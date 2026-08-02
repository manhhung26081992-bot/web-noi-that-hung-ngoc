import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ADMIN_SESSION_COOKIE, getAdminSessionValue } from '@/lib/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { GSC_QUERY_PAGE_HISTORY_STORE_KEY, GSC_QUERY_PAGE_RANGE_KEYS, getQueryPageRangeStoreKey, resolveDateRange, syncQueryPage } from '../../search-console/googleSearchConsoleApi';
import {
  AI_SEO_DAILY_HISTORY_STORE_KEY,
  AI_SEO_DAILY_PLAN_STORE_KEY,
  buildSeoDailyAiPlan,
} from '@/app/admin/seo/services/seoDailyAiEngine';
import type {
  AiSeoDailyPlan,
  GoogleAdsImportData,
  ProductSeoItem,
  SearchConsoleManualSummary,
  SearchConsoleQueryPageRangeSummary,
  SearchConsoleUpdateHistoryEntry,
  SearchConsoleV7Data,
  SeoBlogQualityItem,
  SeoCluster,
  SeoKeyword,
  SeoOverview,
  TodayTask,
} from '@/app/admin/seo/types/seo';
import type { SeoWorkLogItem } from '@/app/admin/seo/types/seoV11';
import { normalizeSearchConsoleData } from '@/app/admin/seo/services/searchConsoleMetricsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CHUNK_MARKER = '__chunk__';
const CHUNK_SIZE = 180000;
const STORE_VERSION = 'v11.2.3';
const GSC_AGGREGATE_STORE_KEY = 'noithathungngoc-search-console-import-v1';
const GSC_QUERY_PAGE_STORE_KEY = 'noithathungngoc-search-console-query-pages-v1';
const GSC_IMPORT_HISTORY_KEY = 'noithathungngoc-search-console-import-history-v1';
const GSC_MANUAL_SUMMARY_KEY = 'noithathungngoc-gsc-manual-summary-v11';
const GOOGLE_ADS_STORE_KEY = 'noithathungngoc-google-ads-import-v1';
const SEO_WORK_LOG_V11_KEY = 'noithathungngoc-seo-work-log-v11';
const SEO_KEYWORD_MAP_KEY = 'noithathungngoc-seo-keyword-map-v1';

type StorePayload = {
  value?: unknown;
  raw?: string;
  valueType?: 'json' | 'text';
  savedAt?: string;
  isChunked?: boolean;
  chunkCount?: number;
  originalStoreKey?: string;
  updatedAt?: string;
  version?: string;
  chunkIndex?: number;
  data?: unknown;
};

type StoreRow = {
  store_key: string;
  payload: StorePayload;
  version?: string;
  updated_at?: string;
};

type StoreEntry<T> = {
  value: T | null;
  updatedAt: string | null;
};

type SeoDailyErrorCode =
  | 'INPUT_INVALID'
  | 'AUTH_FAILED'
  | 'SOURCE_LOAD_FAILED'
  | 'GSC_LOAD_FAILED'
  | 'ADS_LOAD_FAILED'
  | 'CONTENT_LOAD_FAILED'
  | 'PLAN_BUILD_FAILED'
  | 'PLAN_SAVE_FAILED'
  | 'RESPONSE_SERIALIZE_FAILED'
  | 'UNKNOWN_ERROR';

type SeoDailyStage =
  | 'input'
  | 'auth'
  | 'gsc-sync'
  | 'load-sources'
  | 'load-gsc'
  | 'load-ads'
  | 'load-content'
  | 'build-plan'
  | 'save-plan'
  | 'serialize-response'
  | 'unknown';

type RequestDiagnostics = {
  requestId: string;
  warnings: string[];
  degradedSources: string[];
};

class SeoDailyStageError extends Error {
  code: SeoDailyErrorCode;
  stage: SeoDailyStage;
  retryable: boolean;

  constructor(code: SeoDailyErrorCode, stage: SeoDailyStage, message: string, retryable = false) {
    super(message);
    this.name = 'SeoDailyStageError';
    this.code = code;
    this.stage = stage;
    this.retryable = retryable;
  }
}

function requestId() {
  return 'seo-daily-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function cleanErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown error.');
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/(apikey|authorization|password|secret|token|key)=([^&\s]+)/gi, '$1=[redacted]')
    .slice(0, 500);
}

function logStageError(context: RequestDiagnostics, stage: SeoDailyStage, error: unknown, extra: Record<string, unknown> = {}) {
  console.error('[seo-daily-run]', {
    requestId: context.requestId,
    stage,
    errorName: error instanceof Error ? error.name : typeof error,
    message: cleanErrorMessage(error),
    ...extra,
  });
}

function jsonError(status: number, code: SeoDailyErrorCode, stage: SeoDailyStage, requestIdValue: string, message: string, retryable = false) {
  return NextResponse.json({ ok: false, code, message, stage, requestId: requestIdValue, retryable }, { status });
}

function clampPositiveInteger(value: unknown, fallback: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.min(Math.floor(numeric), max);
}

async function hasAdminSession() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return Boolean(session && session === await getAdminSessionValue(adminPassword));
}

async function authorize(request: NextRequest) {
  const expectedSecret = String(process.env.SEO_DAILY_CRON_SECRET || '').trim();
  const requestSecret = String(request.headers.get('x-seo-cron-secret') || '').trim();
  if (expectedSecret && requestSecret && requestSecret === expectedSecret) return 'cron';
  if (await hasAdminSession()) return 'admin';
  return null;
}


function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeStorePayloadValue(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value;
  if (typeof value === 'string') {
    const parsed = safeJsonParse(value);
    return parsed === value ? value : normalizeStorePayloadValue(parsed, depth + 1);
  }
  if (typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  if (typeof record.raw === 'string' && record.raw.trim()) {
    return normalizeStorePayloadValue(record.raw, depth + 1);
  }
  if (Object.prototype.hasOwnProperty.call(record, 'value')) {
    return normalizeStorePayloadValue(record.value, depth + 1);
  }
  if (typeof record.data === 'string' && record.data.trim()) {
    return normalizeStorePayloadValue(record.data, depth + 1);
  }
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    const nested = record.data as Record<string, unknown>;
    if (
      Object.prototype.hasOwnProperty.call(nested, 'raw') ||
      Object.prototype.hasOwnProperty.call(nested, 'value') ||
      typeof nested.data === 'string' ||
      Object.prototype.hasOwnProperty.call(nested, 'aggregateData')
    ) {
      return normalizeStorePayloadValue(nested, depth + 1);
    }
  }
  if (Object.prototype.hasOwnProperty.call(record, 'aggregateData')) {
    return normalizeStorePayloadValue(record.aggregateData, depth + 1);
  }
  return value;
}

function parseStoreValue<T>(row: StoreRow | null | undefined): T | null {
  if (!row?.payload) return null;
  return normalizeStorePayloadValue(row.payload) as T | null;
}

function extractSearchConsoleData(value: unknown): SearchConsoleV7Data | null {
  const normalized = normalizeStorePayloadValue(value);
  if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)) return null;
  const record = normalized as Record<string, unknown>;
  if (Array.isArray(record.queries) || Array.isArray(record.pages)) return normalizeSearchConsoleData(normalized as SearchConsoleV7Data);
  if (record.data) return extractSearchConsoleData(record.data);
  if (record.aggregateData) return extractSearchConsoleData(record.aggregateData);
  return null;
}

function countSearchConsoleRows(value: unknown, data?: SearchConsoleV7Data | null) {
  const normalized = normalizeStorePayloadValue(value);
  if (normalized && typeof normalized === 'object' && !Array.isArray(normalized)) {
    const record = normalized as Record<string, unknown>;
    const direct = Number(record.rowCount || record.fetchedRows || 0);
    if (Number.isFinite(direct) && direct > 0) return direct;
    if (Array.isArray(record.rows) && record.rows.length) return record.rows.length;
    if (Array.isArray(record.items) && record.items.length) return record.items.length;
  }
  return Array.isArray(data?.queries) ? data.queries.length : 0;
}

async function readStoreEntry<T>(supabase: SupabaseClient, storeKey: string): Promise<StoreEntry<T>> {
  const { data, error } = await supabase
    .from('seo_dashboard_store')
    .select('store_key,payload,version,updated_at')
    .or('store_key.eq.' + storeKey + ',store_key.like.' + storeKey + CHUNK_MARKER + '%')
    .order('store_key', { ascending: true });
  if (error) throw error;
  const rows = (data || []) as StoreRow[];
  const main = rows.find((item) => item.store_key === storeKey);
  if (!main) return { value: null, updatedAt: null };
  if (!main.payload?.isChunked) return { value: parseStoreValue<T>(main), updatedAt: main.updated_at || null };
  const chunks: string[] = [];
  const chunkCount = Number(main.payload.chunkCount || 0);
  for (let index = 1; index <= chunkCount; index += 1) {
    const key = storeKey + CHUNK_MARKER + String(index).padStart(4, '0');
    const chunk = rows.find((item) => item.store_key === key);
    if (typeof chunk?.payload?.data !== 'string') return { value: null, updatedAt: main.updated_at || null };
    chunks.push(chunk.payload.data);
  }
  const payload = safeJsonParse(chunks.join('')) as StorePayload;
  return { value: normalizeStorePayloadValue(payload) as T | null, updatedAt: main.updated_at || null };
}

async function readOptionalStoreEntry<T>(
  supabase: SupabaseClient,
  storeKey: string,
  label: string,
  diagnostics: RequestDiagnostics,
): Promise<StoreEntry<T>> {
  try {
    return await readStoreEntry<T>(supabase, storeKey);
  } catch (error) {
    diagnostics.degradedSources.push(label);
    diagnostics.warnings.push(label + ' chua doc duoc, AI Daily dung du lieu rong cho nguon nay.');
    logStageError(diagnostics, label.includes('GSC') || label.includes('Search Console') ? 'load-gsc' : label.includes('Ads') ? 'load-ads' : 'load-sources', error, { source: label });
    return { value: null, updatedAt: null };
  }
}

function chunkText(text: string) {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += CHUNK_SIZE) chunks.push(text.slice(index, index + CHUNK_SIZE));
  return chunks;
}

async function upsertStoreValue(supabase: SupabaseClient, storeKey: string, value: unknown) {
  const now = new Date().toISOString();
  const raw = JSON.stringify(value);
  const payload: StorePayload = { value, raw, valueType: 'json', savedAt: now };
  const payloadText = JSON.stringify(payload);
  const rows: StoreRow[] = [];
  if (payloadText.length <= 400000) {
    rows.push({ store_key: storeKey, payload, version: STORE_VERSION, updated_at: now });
  } else {
    const chunks = chunkText(payloadText);
    rows.push({
      store_key: storeKey,
      payload: { isChunked: true, chunkCount: chunks.length, originalStoreKey: storeKey, updatedAt: now, version: STORE_VERSION },
      version: STORE_VERSION,
      updated_at: now,
    });
    chunks.forEach((data, index) => rows.push({
      store_key: storeKey + CHUNK_MARKER + String(index + 1).padStart(4, '0'),
      payload: { chunkIndex: index + 1, chunkCount: chunks.length, data },
      version: STORE_VERSION,
      updated_at: now,
    }));
  }
  const { error } = await supabase.from('seo_dashboard_store').upsert(rows, { onConflict: 'store_key' });
  if (error) throw error;
}

function textValue(value: unknown) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanSlug(value?: string | null) {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '');
}

function countImages(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).length;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).length;
    } catch {}
    return 1;
  }
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).filter(Boolean).length;
  return 0;
}

function hasSpecs(value: unknown) {
  if (!value) return false;
  if (typeof value === 'string') return value.trim().length > 8 && value.trim() !== '{}';
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return false;
}

function hasFeatureList(value: unknown) {
  if (!value) return false;
  if (Array.isArray(value)) return value.filter(Boolean).length > 0;
  if (typeof value === 'string') return value.trim().length > 20 && value.trim() !== '{}';
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return false;
}

function toProducts(rows: Array<Record<string, unknown>>): ProductSeoItem[] {
  return rows.map((row, index) => {
    const description = String(row.description || '');
    const detailDescription = String(row.detailDescription || row.detail_description || '');
    const imageCount = (row.image ? 1 : 0) + countImages(row.images) + countImages(row.realInstallImages);
    const checks = {
      mainImage: Boolean(row.image),
      multipleImages: imageCount >= 2,
      alt: Boolean(row.name && row.slug),
      description: textValue(description).length >= 80,
      detailDescription: textValue(detailDescription).length >= 220,
      specs: hasSpecs(row.specs),
      features: hasFeatureList(row.features),
      category: Boolean(row.category || row.parent_slug),
      slug: Boolean(row.slug),
      internalLink: /href=|\/tin-tuc|\/san-pham|\/tu-|\/ghe-|\/ban-/.test(description + detailDescription),
      faq: /faq|hỏi|câu hỏi|thắc mắc|giải đáp/i.test(description + detailDescription),
    };
    const issues: string[] = [];
    if (!checks.mainImage) issues.push('Thiếu ảnh chính');
    if (!checks.multipleImages) issues.push('Ảnh ít');
    if (!checks.description) issues.push('Mô tả mỏng');
    if (!checks.detailDescription) issues.push('Thiếu nội dung chi tiết');
    if (!checks.specs) issues.push('Thiếu thông số');
    if (!checks.features) issues.push('Thiếu đặc điểm nổi bật');
    if (!checks.internalLink) issues.push('Thiếu link nội bộ');
    if (!checks.faq) issues.push('Thiếu FAQ');
    return {
      id: String(row.id || row.slug || index),
      name: String(row.name || 'Sản phẩm chưa có tên'),
      slug: String(row.slug || ''),
      category: row.category as string | null,
      parent_slug: row.parent_slug as string | null,
      image: row.image as string | null,
      images: row.images,
      realInstallImages: row.realInstallImages,
      description,
      detailDescription,
      specs: row.specs,
      features: row.features,
      created_at: row.created_at as string | null,
      qualityScore: Math.round(Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100),
      checks,
      issues,
      action: issues.length ? 'Ưu tiên: ' + issues.slice(0, 3).join(', ') + '.' : 'Theo dõi ổn định.',
    };
  }).sort((a, b) => (a.qualityScore || 0) - (b.qualityScore || 0));
}

function toBlogs(rows: Array<Record<string, unknown>>): SeoBlogQualityItem[] {
  return rows.map((row, index) => {
    const title = String(row.title || row.name || 'Bài viết chưa có tiêu đề');
    const slug = String(row.slug || '');
    const content = String(row.content || row.seo_content || row.body || '');
    const excerpt = String(row.excerpt || row.description || row.meta_description || '');
    const image = String(row.image || row.image_url || row.thumbnail || row.cover || '');
    const combined = (title + ' ' + excerpt + ' ' + content).toLowerCase();
    const checks = {
      content: content.length >= 800,
      internalLink: /href=|\/tu-|\/ghe-|\/ban-|\/san-pham|\/tin-tuc/.test(content),
      image: Boolean(image) || /<img\s/i.test(content),
      slug: Boolean(slug) && slug === slug.toLowerCase() && !/\s/.test(slug),
      meta: excerpt.length >= 80 && excerpt.length <= 180,
      faq: /faq|hỏi|câu hỏi|thắc mắc|giải đáp/i.test(combined),
      keyword: title.length >= 20 || /giá|mua|chọn|nên|hà nội/i.test(combined),
    };
    const issueMap: Record<keyof typeof checks, string> = {
      content: 'nội dung còn mỏng',
      internalLink: 'thiếu internal link',
      image: 'thiếu ảnh đại diện',
      slug: 'slug chưa chuẩn',
      meta: 'meta/excerpt chưa tối ưu',
      faq: 'thiếu FAQ',
      keyword: 'keyword chưa rõ',
    };
    const issues = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => issueMap[key as keyof typeof checks]);
    return {
      id: String(row.id || slug || index),
      title,
      slug,
      excerpt,
      content,
      image,
      created_at: row.created_at as string | null,
      updated_at: row.updated_at as string | null,
      score: Math.round(Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100),
      checks,
      issues,
      action: issues.length ? 'Ưu tiên: ' + issues.slice(0, 3).join(', ') + '.' : 'Theo dõi Search Console.',
    };
  }).sort((a, b) => a.score - b.score);
}

async function strictList<T>(supabase: SupabaseClient, table: string, orderColumn = 'updated_at', limit = 300): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*').order(orderColumn, { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []) as T[];
}

async function optionalList<T>(
  supabase: SupabaseClient,
  table: string,
  label: string,
  diagnostics: RequestDiagnostics,
  orderColumn = 'updated_at',
  limit = 300,
): Promise<T[]> {
  try {
    return await strictList<T>(supabase, table, orderColumn, limit);
  } catch (error) {
    diagnostics.degradedSources.push(label);
    diagnostics.warnings.push(label + ' chua doc duoc, AI Daily dung mang rong.');
    logStageError(diagnostics, 'load-sources', error, { source: label, table });
    return [];
  }
}

function latestImportMeta(data: SearchConsoleV7Data | null | undefined) {
  return [...(data?.imports || [])].sort((a, b) => String(b.updatedAt || b.importedAt).localeCompare(String(a.updatedAt || a.importedAt)))[0] || null;
}

function mergeRangeRows(ranges: SearchConsoleQueryPageRangeSummary[], aggregateData: SearchConsoleV7Data | null) {
  const rows = new Map<string, SearchConsoleV7Data['queries'][number]>();
  ranges.forEach((range) => {
    (range.data?.queries || [])
      .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.position - b.position)
      .slice(0, 900)
      .forEach((row) => {
        const key = String(row.query || '') + '|' + String(row.page || '');
        const current = rows.get(key);
        if (!current || row.impressions > current.impressions) rows.set(key, row);
      });
  });
  (aggregateData?.queries || []).slice(0, 800).forEach((row) => {
    const key = String(row.query || '') + '|' + String(row.page || '');
    if (!rows.has(key)) rows.set(key, row);
  });
  return Array.from(rows.values()).sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.position - b.position).slice(0, 2500);
}

async function loadDashboardInput(supabase: SupabaseClient, apiSummary: unknown, diagnostics: RequestDiagnostics) {
  const [
    aggregateStore,
    queryPageStore,
    manualStore,
    googleAdsStore,
    workLogStore,
    keywordMapStore,
    queryPageHistoryStore,
    importHistoryStore,
    productRows,
    blogRows,
    clusters,
    keywords,
    tasks,
  ] = await Promise.all([
    readOptionalStoreEntry<{ data?: SearchConsoleV7Data } | SearchConsoleV7Data>(supabase, GSC_AGGREGATE_STORE_KEY, 'GSC aggregate store', diagnostics),
    readOptionalStoreEntry<{ data?: SearchConsoleV7Data; lastUpdated?: string }>(supabase, GSC_QUERY_PAGE_STORE_KEY, 'GSC Query+Page latest store', diagnostics),
    readOptionalStoreEntry<SearchConsoleManualSummary>(supabase, GSC_MANUAL_SUMMARY_KEY, 'GSC manual summary', diagnostics),
    readOptionalStoreEntry<GoogleAdsImportData>(supabase, GOOGLE_ADS_STORE_KEY, 'Google Ads import', diagnostics),
    readOptionalStoreEntry<SeoWorkLogItem[]>(supabase, SEO_WORK_LOG_V11_KEY, 'SEO work log v11', diagnostics),
    readOptionalStoreEntry<unknown>(supabase, SEO_KEYWORD_MAP_KEY, 'SEO keyword map', diagnostics),
    readOptionalStoreEntry<{ items?: SearchConsoleUpdateHistoryEntry[] } | SearchConsoleUpdateHistoryEntry[]>(supabase, GSC_QUERY_PAGE_HISTORY_STORE_KEY, 'GSC Query+Page history', diagnostics),
    readOptionalStoreEntry<{ items?: SearchConsoleUpdateHistoryEntry[] } | SearchConsoleUpdateHistoryEntry[]>(supabase, GSC_IMPORT_HISTORY_KEY, 'GSC import history', diagnostics),
    strictList<Record<string, unknown>>(supabase, 'products', 'id', 300),
    strictList<Record<string, unknown>>(supabase, 'blog_posts', 'created_at', 300),
    optionalList<SeoCluster>(supabase, 'seo_clusters', 'seo_clusters', diagnostics, 'priority', 100),
    optionalList<SeoKeyword>(supabase, 'seo_keywords', 'seo_keywords', diagnostics, 'priority', 500),
    optionalList<TodayTask>(supabase, 'seo_tasks', 'seo_tasks', diagnostics, 'updated_at', 100),
  ]);
  const rangeStores = await Promise.all(GSC_QUERY_PAGE_RANGE_KEYS.map(async (rangeKey) => ({
    rangeKey,
    storeKey: getQueryPageRangeStoreKey(rangeKey),
    entry: await readOptionalStoreEntry<{ data?: SearchConsoleV7Data; lastUpdated?: string }>(supabase, getQueryPageRangeStoreKey(rangeKey), 'GSC Query+Page range ' + rangeKey, diagnostics),
  })));
  const aggregateValue = aggregateStore.value;
  const aggregateData = extractSearchConsoleData(aggregateValue);
  const legacyQueryPageData = extractSearchConsoleData(queryPageStore.value);
  const queryPageRanges: SearchConsoleQueryPageRangeSummary[] = rangeStores.map((item) => {
    const data = extractSearchConsoleData(item.entry.value);
    const meta = latestImportMeta(data);
    const fallback = resolveDateRange(item.rangeKey);
    return {
      rangeKey: item.rangeKey,
      label: fallback.dateRangeLabel,
      storeKey: item.storeKey,
      hasData: Boolean(data?.queries?.length || meta || item.entry.updatedAt),
      rowCount: Number(meta?.rowCount || countSearchConsoleRows(item.entry.value, data) || 0),
      updatedAt: item.entry.updatedAt || meta?.updatedAt || data?.overview?.lastUpdated || null,
      dateRangeLabel: meta?.dateRangeLabel || fallback.dateRangeLabel,
      startDate: meta?.startDate,
      endDate: meta?.endDate,
      partial: Boolean(meta?.partial),
      stoppedReason: meta?.stoppedReason,
      data,
    };
  });
  const queryRows = mergeRangeRows(queryPageRanges, legacyQueryPageData || aggregateData);
  const primaryQueryPageData = queryPageRanges.find((item) => item.rangeKey === '28d' && item.data)?.data
    || queryPageRanges.find((item) => item.rangeKey === '3m' && item.data)?.data
    || legacyQueryPageData
    || aggregateData;
  const searchConsole = primaryQueryPageData || aggregateData ? {
    ...(aggregateData || primaryQueryPageData),
    overview: primaryQueryPageData?.overview || aggregateData?.overview,
    imports: [
      ...queryPageRanges.flatMap((item) => item.data?.imports || []),
      ...(legacyQueryPageData?.imports || []),
      ...(aggregateData?.imports || []),
    ],
    queries: queryRows,
    pages: (primaryQueryPageData?.pages || aggregateData?.pages || []).slice(0, 800),
    devices: aggregateData?.devices || [],
    countries: aggregateData?.countries || [],
    trend: aggregateData?.trend || [],
    searchAppearances: aggregateData?.searchAppearances || [],
    opportunities: aggregateData?.opportunities || [],
  } as SearchConsoleV7Data : null;
  const products = toProducts(productRows);
  const blogs = toBlogs(blogRows);
  const overview: SeoOverview = {
    products: productRows.length,
    blogPosts: blogRows.length,
    categories: 0,
    generatedUrls: productRows.length + blogRows.length + 2,
    categorySource: 'supabase',
    staticUrls: 2,
    activeCategoryUrls: 0,
    clusters: clusters.length,
    keywords: keywords.length,
    tasks: tasks.length,
    logs: Array.isArray(workLogStore.value) ? workLogStore.value.length : 0,
  };
  return {
    searchConsole,
    manualGscSummary: manualStore.value,
    googleAds: googleAdsStore.value,
    products,
    blogs,
    clusters,
    keywords,
    tasks,
    workLogs: Array.isArray(workLogStore.value) ? workLogStore.value : [],
    overview,
    keywordMap: keywordMapStore.value,
    apiSummary,
    searchConsoleRanges: queryPageRanges,
    gscUpdateHistory: [
      ...(Array.isArray(queryPageHistoryStore.value) ? queryPageHistoryStore.value : queryPageHistoryStore.value?.items || []),
      ...(Array.isArray(importHistoryStore.value) ? importHistoryStore.value : importHistoryStore.value?.items || []),
    ].slice(0, 80),
  };
}

async function readLatestPlan(supabase: SupabaseClient) {
  return readStoreEntry<AiSeoDailyPlan>(supabase, AI_SEO_DAILY_PLAN_STORE_KEY);
}

function summarizeQueryPageSync(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  return {
    ok: record.ok,
    skipped: record.skipped,
    message: record.message,
    storeKey: record.storeKey,
    latestStoreKey: record.latestStoreKey,
    historyStoreKey: record.historyStoreKey,
    rangeKey: record.rangeKey,
    dateRangeLabel: record.dateRangeLabel,
    rowCount: record.rowCount,
    updatedAt: record.updatedAt,
    partial: record.partial,
    rowLimit: record.rowLimit,
    maxPages: record.maxPages,
    pagesFetched: record.pagesFetched,
    fetchedRows: record.fetchedRows,
    maxPagesReached: record.maxPagesReached,
    stoppedReason: record.stoppedReason,
  };
}

function sanitizeQueryPageRanges(ranges: SearchConsoleQueryPageRangeSummary[] | undefined): SearchConsoleQueryPageRangeSummary[] {
  return (ranges || []).map((range) => ({
    rangeKey: range.rangeKey,
    label: range.label,
    storeKey: range.storeKey,
    hasData: range.hasData,
    rowCount: range.rowCount,
    updatedAt: range.updatedAt,
    dateRangeLabel: range.dateRangeLabel,
    startDate: range.startDate,
    endDate: range.endDate,
    partial: range.partial,
    stoppedReason: range.stoppedReason,
  }));
}

function sanitizePlan(plan: AiSeoDailyPlan): AiSeoDailyPlan {
  return {
    ...plan,
    todayTasks: (plan.todayTasks || []).slice(0, 10),
    next7DaysTasks: (plan.next7DaysTasks || []).slice(0, 20),
    watchOpportunities: (plan.watchOpportunities || []).slice(0, 20),
    internalLinkSuggestions: (plan.internalLinkSuggestions || []).slice(0, 20),
    cannibalizationWarnings: (plan.cannibalizationWarnings || []).slice(0, 20),
    contentTasks: (plan.contentTasks || []).slice(0, 20),
    productOptimizationTasks: (plan.productOptimizationTasks || []).slice(0, 20),
    indexCheckTasks: (plan.indexCheckTasks || []).slice(0, 20),
    notes: (plan.notes || []).slice(0, 30),
    apiSummary: summarizeQueryPageSync(plan.apiSummary),
    queryPageRanges: sanitizeQueryPageRanges(plan.queryPageRanges),
    gscUpdateHistory: (plan.gscUpdateHistory || []).slice(0, 40),
  };
}

function assertJsonSerializable(value: unknown) {
  JSON.stringify(value);
}

export async function GET(request: NextRequest) {
  const diagnostics: RequestDiagnostics = { requestId: requestId(), warnings: [], degradedSources: [] };
  if (!(await authorize(request))) {
    return jsonError(
      401,
      'AUTH_FAILED',
      'auth',
      diagnostics.requestId,
      'Ban can dang nhap quan tri hoac gui x-seo-cron-secret hop le.',
    );
  }
  try {
    const supabase = getSupabaseAdminClient();
    const entry = await readLatestPlan(supabase);
    return NextResponse.json({ ok: true, storeKey: AI_SEO_DAILY_PLAN_STORE_KEY, plan: entry.value, updatedAt: entry.updatedAt });
  } catch (error) {
    logStageError(diagnostics, 'load-sources', error);
    return jsonError(500, 'SOURCE_LOAD_FAILED', 'load-sources', diagnostics.requestId, 'Khong doc duoc AI SEO Daily plan.', true);
  }
}

export async function POST(request: NextRequest) {
  const diagnostics: RequestDiagnostics = { requestId: requestId(), warnings: [], degradedSources: [] };
  let stage: SeoDailyStage = 'auth';
  let code: SeoDailyErrorCode = 'UNKNOWN_ERROR';

  try {
    const authMode = await authorize(request);
    if (!authMode) {
      return jsonError(
        401,
        'AUTH_FAILED',
        'auth',
        diagnostics.requestId,
        'Ban can dang nhap quan tri hoac gui x-seo-cron-secret hop le.',
      );
    }

    stage = 'input';
    code = 'INPUT_INVALID';
    const body = await request.json().catch(() => ({})) as {
      range?: string;
      force?: boolean;
      skipSearchConsoleSync?: boolean;
      rowLimit?: number;
      maxPages?: number;
    };
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new SeoDailyStageError('INPUT_INVALID', 'input', 'Body khong hop le.');
    }

    let queryPageSync: unknown = null;
    if (!body.skipSearchConsoleSync) {
      stage = 'gsc-sync';
      code = 'GSC_LOAD_FAILED';
      try {
        queryPageSync = await syncQueryPage(body.range || '28d', Boolean(body.force), {
          rowLimit: clampPositiveInteger(body.rowLimit, 10000, 10000),
          maxPages: clampPositiveInteger(body.maxPages, 2, 2),
        });
      } catch (error) {
        diagnostics.degradedSources.push('Search Console API sync');
        diagnostics.warnings.push('Search Console API chua dong bo duoc, AI Daily dung du lieu da luu.');
        logStageError(diagnostics, 'gsc-sync', error, { range: body.range || '28d' });
      }
    }

    stage = 'load-sources';
    code = 'SOURCE_LOAD_FAILED';
    const supabase = getSupabaseAdminClient();
    let input: Awaited<ReturnType<typeof loadDashboardInput>>;
    try {
      input = await loadDashboardInput(supabase, summarizeQueryPageSync(queryPageSync), diagnostics);
    } catch (error) {
      logStageError(diagnostics, 'load-content', error);
      throw new SeoDailyStageError('CONTENT_LOAD_FAILED', 'load-content', 'Khong doc duoc du lieu SEO loi tu Supabase.', true);
    }

    stage = 'build-plan';
    code = 'PLAN_BUILD_FAILED';
    const rawPlan = buildSeoDailyAiPlan({ ...input, source: authMode === 'cron' ? 'auto-daily' : 'manual-run' });
    const plan = sanitizePlan(rawPlan);

    stage = 'save-plan';
    code = 'PLAN_SAVE_FAILED';
    const historyEntry = await readOptionalStoreEntry<AiSeoDailyPlan[]>(supabase, AI_SEO_DAILY_HISTORY_STORE_KEY, 'AI SEO Daily history', diagnostics);
    const previousHistory = Array.isArray(historyEntry.value) ? historyEntry.value.map(sanitizePlan) : [];
    const history = [plan, ...previousHistory.filter((item) => item.date !== plan.date)].slice(0, 45);
    await upsertStoreValue(supabase, AI_SEO_DAILY_PLAN_STORE_KEY, plan);
    await upsertStoreValue(supabase, AI_SEO_DAILY_HISTORY_STORE_KEY, history);

    stage = 'serialize-response';
    code = 'RESPONSE_SERIALIZE_FAILED';
    const responseBody = {
      ok: true,
      requestId: diagnostics.requestId,
      storeKey: AI_SEO_DAILY_PLAN_STORE_KEY,
      historyStoreKey: AI_SEO_DAILY_HISTORY_STORE_KEY,
      plan,
      warnings: diagnostics.warnings,
      degradedSources: Array.from(new Set(diagnostics.degradedSources)),
      queryPageSync: summarizeQueryPageSync(queryPageSync),
      authMode,
      message: 'Da chay AI SEO Daily va luu ke hoach vao Supabase.',
    };
    assertJsonSerializable(responseBody);
    return NextResponse.json(responseBody);
  } catch (error) {
    const typedError = error instanceof SeoDailyStageError
      ? error
      : new SeoDailyStageError(code, stage, 'Khong chay duoc AI SEO Daily.', stage !== 'build-plan');
    logStageError(diagnostics, typedError.stage, error);
    return jsonError(
      typedError.code === 'INPUT_INVALID' ? 400 : 500,
      typedError.code,
      typedError.stage,
      diagnostics.requestId,
      typedError.message,
      typedError.retryable,
    );
  }
}
