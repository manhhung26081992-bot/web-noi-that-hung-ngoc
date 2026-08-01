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

function jsonError(status: number, message: string, detail?: string) {
  return NextResponse.json({ ok: false, error: message, message, detail }, { status });
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

async function safeList<T>(supabase: SupabaseClient, table: string, orderColumn = 'updated_at', limit = 300): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*').order(orderColumn, { ascending: false }).limit(limit);
  if (error) return [];
  return (data || []) as T[];
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

async function loadDashboardInput(supabase: SupabaseClient, apiSummary: unknown) {
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
    readStoreEntry<{ data?: SearchConsoleV7Data } | SearchConsoleV7Data>(supabase, GSC_AGGREGATE_STORE_KEY),
    readStoreEntry<{ data?: SearchConsoleV7Data; lastUpdated?: string }>(supabase, GSC_QUERY_PAGE_STORE_KEY),
    readStoreEntry<SearchConsoleManualSummary>(supabase, GSC_MANUAL_SUMMARY_KEY),
    readStoreEntry<GoogleAdsImportData>(supabase, GOOGLE_ADS_STORE_KEY),
    readStoreEntry<SeoWorkLogItem[]>(supabase, SEO_WORK_LOG_V11_KEY),
    readStoreEntry<unknown>(supabase, SEO_KEYWORD_MAP_KEY),
    readStoreEntry<{ items?: SearchConsoleUpdateHistoryEntry[] } | SearchConsoleUpdateHistoryEntry[]>(supabase, GSC_QUERY_PAGE_HISTORY_STORE_KEY),
    readStoreEntry<{ items?: SearchConsoleUpdateHistoryEntry[] } | SearchConsoleUpdateHistoryEntry[]>(supabase, GSC_IMPORT_HISTORY_KEY),
    safeList<Record<string, unknown>>(supabase, 'products', 'id', 300),
    safeList<Record<string, unknown>>(supabase, 'blog_posts', 'created_at', 300),
    safeList<SeoCluster>(supabase, 'seo_clusters', 'priority', 100),
    safeList<SeoKeyword>(supabase, 'seo_keywords', 'priority', 500),
    safeList<TodayTask>(supabase, 'seo_tasks', 'updated_at', 100),
  ]);
  const rangeStores = await Promise.all(GSC_QUERY_PAGE_RANGE_KEYS.map(async (rangeKey) => ({
    rangeKey,
    storeKey: getQueryPageRangeStoreKey(rangeKey),
    entry: await readStoreEntry<{ data?: SearchConsoleV7Data; lastUpdated?: string }>(supabase, getQueryPageRangeStoreKey(rangeKey)),
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

export async function GET(request: NextRequest) {
  if (!(await authorize(request))) return jsonError(401, 'Bạn cần đăng nhập quản trị hoặc gửi x-seo-cron-secret hợp lệ.');
  try {
    const supabase = getSupabaseAdminClient();
    const entry = await readLatestPlan(supabase);
    return NextResponse.json({ ok: true, storeKey: AI_SEO_DAILY_PLAN_STORE_KEY, plan: entry.value, updatedAt: entry.updatedAt });
  } catch (error) {
    return jsonError(500, 'Không đọc được AI SEO Daily plan.', error instanceof Error ? error.message : 'Lỗi không xác định.');
  }
}

export async function POST(request: NextRequest) {
  const authMode = await authorize(request);
  if (!authMode) return jsonError(401, 'Bạn cần đăng nhập quản trị hoặc gửi x-seo-cron-secret hợp lệ.');
  try {
    const body = await request.json().catch(() => ({})) as { range?: string; force?: boolean; skipSearchConsoleSync?: boolean; rowLimit?: number; maxPages?: number };
    const warnings: string[] = [];
    let queryPageSync: unknown = null;
    if (!body.skipSearchConsoleSync) {
      try {
        queryPageSync = await syncQueryPage(body.range || '28d', Boolean(body.force), {
          rowLimit: Number(body.rowLimit || 10000),
          maxPages: Number(body.maxPages || 2),
        });
      } catch (error) {
        warnings.push('Search Console API chưa đồng bộ được: ' + (error instanceof Error ? error.message : 'lỗi không xác định'));
      }
    }
    const supabase = getSupabaseAdminClient();
    const input = await loadDashboardInput(supabase, queryPageSync);
    const plan = buildSeoDailyAiPlan({ ...input, source: authMode === 'cron' ? 'auto-daily' : 'manual-run' });
    const historyEntry = await readStoreEntry<AiSeoDailyPlan[]>(supabase, AI_SEO_DAILY_HISTORY_STORE_KEY);
    const history = [plan, ...(Array.isArray(historyEntry.value) ? historyEntry.value : []).filter((item) => item.date !== plan.date)]
      .slice(0, 45);
    await upsertStoreValue(supabase, AI_SEO_DAILY_PLAN_STORE_KEY, plan);
    await upsertStoreValue(supabase, AI_SEO_DAILY_HISTORY_STORE_KEY, history);
    return NextResponse.json({
      ok: true,
      storeKey: AI_SEO_DAILY_PLAN_STORE_KEY,
      historyStoreKey: AI_SEO_DAILY_HISTORY_STORE_KEY,
      plan,
      warnings,
      queryPageSync,
      authMode,
      message: 'Đã chạy AI SEO Daily và lưu kế hoạch vào Supabase.',
    });
  } catch (error) {
    return jsonError(500, 'Không chạy được AI SEO Daily.', error instanceof Error ? error.message : 'Lỗi không xác định.');
  }
}
