import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, getAdminSessionValue } from '@/lib/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  GoogleAdsImportData,
  ProductSeoItem,
  SearchConsoleQuery,
  SeoBlogQualityItem,
  SeoCluster,
  SeoKeyword,
  SeoLog,
} from '@/app/admin/seo/types/seo';
import {
  GSC_IMPORT_STORE_KEY,
  GSC_QUERY_PAGE_RANGE_KEYS,
  GSC_QUERY_PAGE_STORE_KEY,
  GOOGLE_ADS_ACCOUNT_HISTORY_STORE_KEY,
  GOOGLE_ADS_AI_HISTORY_STORE_KEY,
  GOOGLE_ADS_AI_PLAN_STORE_KEY,
  GOOGLE_ADS_IMPORT_STORE_KEY,
  SEO_KEYWORD_MAP_STORE_KEY,
  SEO_WORK_LOG_STORE_KEY,
  attachGoogleAdsRuleEngine,
  appendGoogleAdsPlannerHistory,
  buildGoogleAdsPlannerPlan,
  normalizeAdsAccountHistory,
  extractGoogleAdsImport,
  extractSearchConsoleRows,
  getQueryPageRangeStoreKey,
  normalizePlannerPayload,
  type AdsAccountHistory,
  type GoogleAdsAiHistory,
  type GoogleAdsAiPlan,
} from '@/app/admin/ads/services/googleAdsPlannerService';

export const dynamic = 'force-dynamic';

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
  data?: string;
};

type StoreRow = {
  store_key: string;
  payload: StorePayload;
  version?: string | null;
  updated_at?: string | null;
};

type StoreEntry<T> = {
  value: T | null;
  updatedAt: string | null;
};

type PlannerSummary = {
  googleAdsKeywordCount: number;
  googleAdsUpdatedAt: string | null;
  gscQueryPageCount: number;
  gscQueryPageRows: number;
  gscQueryPageUpdatedAt: string | null;
  hasGoogleAdsImport: boolean;
  hasSearchConsoleData: boolean;
  savedPlanUpdatedAt: string | null;
  warnings: string[];
  triedKeys: string[];
  gscRanges: GoogleAdsAiPlan['sourceSummary']['gscRanges'];
  accountHistoryUpdatedAt: string | null;
};

type GscSavedData = {
  rows: SearchConsoleQuery[];
  ranges: GoogleAdsAiPlan['sourceSummary']['gscRanges'];
  rowCount: number;
  updatedAt: string | null;
  warnings: string[];
};

const CHUNK_MARKER = '__chunk__';
const STORE_VERSION = 'google-ads-ai-plan-v1';
const CHUNK_SIZE = 180000;
const GSC_SAVED_STORE_KEYS = [
  GSC_QUERY_PAGE_STORE_KEY,
  ...GSC_QUERY_PAGE_RANGE_KEYS.map((rangeKey) => getQueryPageRangeStoreKey(rangeKey)),
  GSC_IMPORT_STORE_KEY,
];

async function isAdminRequest() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!session) return false;
  return session === await getAdminSessionValue(adminPassword);
}

function jsonError(status: number, message: string, detail?: string, step?: string, triedKeys: string[] = []) {
  return NextResponse.json({ ok: false, step, error: message, message, detail, triedKeys }, { status });
}

function unauthorized() {
  return jsonError(401, 'Bạn cần đăng nhập quản trị để dùng Google Ads Planner.');
}

function getAdminSupabaseOrError() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { client: null, response: jsonError(500, 'Thiếu SUPABASE_SERVICE_ROLE_KEY.', 'Thêm biến server-side trong Vercel, không dùng NEXT_PUBLIC_.', 'init_supabase') };
  }
  try {
    return { client: getSupabaseAdminClient(), response: null };
  } catch (error) {
    return { client: null, response: jsonError(500, 'Không khởi tạo được Supabase admin client.', error instanceof Error ? error.message : undefined, 'init_supabase') };
  }
}

function safeJsonParse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function parseStoreValue<T>(row: StoreRow | null | undefined): T | null {
  if (!row?.payload) return null;
  return normalizePlannerPayload(row.payload) as T | null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Lỗi không xác định.';
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
    if (typeof chunk?.payload?.data !== 'string') {
      throw new Error('Thiếu chunk ' + key);
    }
    chunks.push(chunk.payload.data);
  }
  const payload = safeJsonParse(chunks.join('')) as StorePayload;
  return { value: normalizePlannerPayload(payload) as T | null, updatedAt: main.updated_at || null };
}

async function readOptionalStoreEntry<T>(supabase: SupabaseClient, storeKey: string, warnings: string[]): Promise<StoreEntry<T>> {
  try {
    return await readStoreEntry<T>(supabase, storeKey);
  } catch (error) {
    warnings.push('Không đọc được ' + storeKey + ': ' + errorMessage(error));
    return { value: null, updatedAt: null };
  }
}

function chunkText(text: string) {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += CHUNK_SIZE) chunks.push(text.slice(index, index + CHUNK_SIZE));
  return chunks;
}

async function upsertStoreValue(supabase: SupabaseClient, storeKey: string, value: unknown, version = STORE_VERSION) {
  const now = new Date().toISOString();
  const raw = JSON.stringify(value);
  const payload: StorePayload = { value, raw, valueType: 'json', savedAt: now };
  const payloadText = JSON.stringify(payload);
  const rows: StoreRow[] = [];
  if (payloadText.length <= 400000) {
    rows.push({ store_key: storeKey, payload, version, updated_at: now });
  } else {
    const chunks = chunkText(payloadText);
    rows.push({
      store_key: storeKey,
      payload: { isChunked: true, chunkCount: chunks.length, originalStoreKey: storeKey, updatedAt: now, version },
      version,
      updated_at: now,
    });
    chunks.forEach((data, index) => rows.push({
      store_key: storeKey + CHUNK_MARKER + String(index + 1).padStart(4, '0'),
      payload: { chunkIndex: index + 1, chunkCount: chunks.length, data },
      version,
      updated_at: now,
    }));
  }
  const { error } = await supabase.from('seo_dashboard_store').upsert(rows, { onConflict: 'store_key' });
  if (error) throw error;
}

function textValue(value: unknown) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toProducts(rows: Array<Record<string, unknown>>): Array<Partial<ProductSeoItem>> {
  return rows.map((row, index) => ({
    id: String(row.id || row.slug || index),
    name: textValue(row.name || row.title || 'Sản phẩm chưa có tên'),
    slug: String(row.slug || ''),
    category: row.category as string | null,
    parent_slug: row.parent_slug as string | null,
    description: textValue(row.description || ''),
    detailDescription: textValue(row.detailDescription || row.detail_description || row.content || ''),
  }));
}

function toBlogs(rows: Array<Record<string, unknown>>): Array<Partial<SeoBlogQualityItem>> {
  return rows.map((row, index) => ({
    id: String(row.id || row.slug || index),
    title: textValue(row.title || row.name || 'Bài viết chưa có tiêu đề'),
    slug: String(row.slug || ''),
    excerpt: textValue(row.excerpt || row.description || row.meta_description || ''),
    content: textValue(row.content || row.seo_content || row.body || ''),
  }));
}

async function safeList<T>(supabase: SupabaseClient, table: string, orderColumn = 'updated_at', limit = 300): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*').order(orderColumn, { ascending: false }).limit(limit);
  if (error) return [];
  return (data || []) as T[];
}

function countRows(value: unknown) {
  const normalized = normalizePlannerPayload(value);
  if (Array.isArray(normalized)) return normalized.length;
  if (normalized && typeof normalized === 'object') {
    const record = normalized as Record<string, unknown>;
    const direct = Number(record.rowCount || record.fetchedRows || record.count || 0);
    if (Number.isFinite(direct) && direct > 0) return direct;
    if (Array.isArray(record.queries)) return record.queries.length;
    if (Array.isArray(record.rows)) return record.rows.length;
    if (Array.isArray(record.items)) return record.items.length;
    if (record.data) return countRows(record.data);
    if (record.aggregateData) return countRows(record.aggregateData);
  }
  return 0;
}

function extractRowsSafe(value: unknown, limit: number, warnings: string[], label: string) {
  try {
    return extractSearchConsoleRows(value, limit);
  } catch (error) {
    warnings.push('Không parse được ' + label + ': ' + errorMessage(error));
    return [];
  }
}

async function loadGscSavedData(supabase: SupabaseClient): Promise<GscSavedData> {
  const warnings: string[] = [];
  const latest = await readOptionalStoreEntry<unknown>(supabase, GSC_QUERY_PAGE_STORE_KEY, warnings);
  const aggregate = await readOptionalStoreEntry<unknown>(supabase, GSC_IMPORT_STORE_KEY, warnings);
  const rangeEntries = await Promise.all(GSC_QUERY_PAGE_RANGE_KEYS.map(async (rangeKey) => {
    const storeKey = getQueryPageRangeStoreKey(rangeKey);
    const entry = await readOptionalStoreEntry<unknown>(supabase, storeKey, warnings);
    const rows = extractRowsSafe(entry.value, 1200, warnings, storeKey);
    return { rangeKey, storeKey, entry, rows };
  }));

  const allRows = new Map<string, SearchConsoleQuery>();
  [
    ...extractRowsSafe(latest.value, 1500, warnings, GSC_QUERY_PAGE_STORE_KEY),
    ...extractRowsSafe(aggregate.value, 1000, warnings, GSC_IMPORT_STORE_KEY),
    ...rangeEntries.flatMap((item) => item.rows),
  ].forEach((row) => {
    const key = String(row.query || '') + '|' + String(row.page || '');
    const current = allRows.get(key);
    if (!current || row.impressions > current.impressions) allRows.set(key, row);
  });

  const ranges = rangeEntries.map((item) => ({
    rangeKey: item.rangeKey,
    rowCount: countRows(item.entry.value) || item.rows.length,
    updatedAt: item.entry.updatedAt,
    source: item.storeKey,
  }));
  const rangeRows = ranges.reduce((sum, item) => sum + Number(item.rowCount || 0), 0);
  const latestRows = countRows(latest.value);
  const aggregateRows = countRows(aggregate.value);
  const rowCount = Math.max(rangeRows, latestRows, aggregateRows, allRows.size);
  const updatedAt = latest.updatedAt || ranges.find((item) => item.updatedAt)?.updatedAt || aggregate.updatedAt || null;
  if (!rowCount) {
    warnings.push('Chưa đọc được Search Console, phân tích sẽ thiếu dữ liệu SEO đối chiếu.');
  }

  return {
    rows: Array.from(allRows.values()).sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.position - b.position).slice(0, 4000),
    ranges,
    rowCount,
    updatedAt,
    warnings,
  };
}

function buildSummary(
  plan: GoogleAdsAiPlan | null,
  ads: GoogleAdsImportData | null,
  adsUpdatedAt: string | null,
  history: GoogleAdsAiHistory | null,
  gsc: GscSavedData,
  accountHistory: AdsAccountHistory,
  accountHistoryUpdatedAt: string | null,
  warnings: string[] = [],
): { ok: true; plan: GoogleAdsAiPlan | null; history: GoogleAdsAiHistory['items']; accountHistory: AdsAccountHistory; summary: PlannerSummary; sourceSummary: PlannerSummary } {
  const allWarnings = Array.from(new Set([...warnings, ...gsc.warnings]));
  const summary: PlannerSummary = {
    googleAdsKeywordCount: ads?.summary.keywordCount || ads?.rows.length || 0,
    googleAdsUpdatedAt: ads?.lastUpdated || ads?.summary.lastUpdated || adsUpdatedAt,
    gscQueryPageCount: gsc.rowCount,
    gscQueryPageRows: gsc.rowCount,
    gscQueryPageUpdatedAt: gsc.updatedAt,
    hasGoogleAdsImport: Boolean(ads?.rows.length),
    hasSearchConsoleData: gsc.rowCount > 0,
    savedPlanUpdatedAt: plan?.generatedAt || null,
    warnings: allWarnings,
    triedKeys: GSC_SAVED_STORE_KEYS,
    gscRanges: gsc.ranges,
    accountHistoryUpdatedAt,
  };
  return {
    ok: true,
    plan,
    history: history?.items || [],
    accountHistory,
    summary,
    sourceSummary: summary,
  };
}

async function loadSavedPlan(supabase: SupabaseClient) {
  const warnings: string[] = [];
  const [planStore, historyStore, adsStore, gsc] = await Promise.all([
    readOptionalStoreEntry<GoogleAdsAiPlan>(supabase, GOOGLE_ADS_AI_PLAN_STORE_KEY, warnings),
    readOptionalStoreEntry<GoogleAdsAiHistory>(supabase, GOOGLE_ADS_AI_HISTORY_STORE_KEY, warnings),
    readOptionalStoreEntry<GoogleAdsImportData>(supabase, GOOGLE_ADS_IMPORT_STORE_KEY, warnings),
    loadGscSavedData(supabase),
  ]);
  const accountHistoryStore = await readOptionalStoreEntry<AdsAccountHistory>(supabase, GOOGLE_ADS_ACCOUNT_HISTORY_STORE_KEY, warnings);
  const accountHistory = normalizeAdsAccountHistory(planStore.value?.accountHistory || accountHistoryStore.value);
  const ads = extractGoogleAdsImport(adsStore.value);
  if (!ads?.rows.length) warnings.push('Chưa đọc được Google Ads Keyword Planner import.');
  const planWithRules = planStore.value ? attachGoogleAdsRuleEngine(planStore.value, accountHistory, ads) : null;
  return buildSummary(planWithRules, ads, adsStore.updatedAt, historyStore.value, gsc, accountHistory, accountHistoryStore.updatedAt, warnings);
}

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  const { client: supabase, response } = getAdminSupabaseOrError();
  if (!supabase) return response;
  try {
    return NextResponse.json(await loadSavedPlan(supabase));
  } catch (error) {
    return jsonError(500, 'Không đọc được dữ liệu Google Ads Planner đã lưu.', errorMessage(error), 'read_google_ads_planner', [GOOGLE_ADS_IMPORT_STORE_KEY, ...GSC_SAVED_STORE_KEYS]);
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest())) return unauthorized();
  const { client: supabase, response } = getAdminSupabaseOrError();
  if (!supabase) return response;

  try {
    const body = await request.json().catch(() => ({})) as { accountHistory?: unknown };
    const accountHistory = normalizeAdsAccountHistory(body.accountHistory);
    await upsertStoreValue(supabase, GOOGLE_ADS_ACCOUNT_HISTORY_STORE_KEY, accountHistory, 'google-ads-account-history-v1');
    return NextResponse.json({ ok: true, storeKey: GOOGLE_ADS_ACCOUNT_HISTORY_STORE_KEY, accountHistory });
  } catch (error) {
    return jsonError(500, 'Không lưu được lịch sử/trạng thái Google Ads.', errorMessage(error), 'save_account_history', [GOOGLE_ADS_ACCOUNT_HISTORY_STORE_KEY]);
  }
}

export async function POST() {
  if (!(await isAdminRequest())) return unauthorized();
  const { client: supabase, response } = getAdminSupabaseOrError();
  if (!supabase) return response;

  let adsStore: StoreEntry<GoogleAdsImportData>;
  try {
    adsStore = await readStoreEntry<GoogleAdsImportData>(supabase, GOOGLE_ADS_IMPORT_STORE_KEY);
  } catch (error) {
    return jsonError(500, 'Không đọc được Google Ads Keyword Planner import.', errorMessage(error), 'read_google_ads_import', [GOOGLE_ADS_IMPORT_STORE_KEY]);
  }

  const googleAds = extractGoogleAdsImport(adsStore.value);
  if (!googleAds?.rows.length) {
    return jsonError(400, 'Chưa có dữ liệu Google Ads Keyword Planner import.', 'Hãy import Keyword Planner trước khi chạy Ads Planner.', 'read_google_ads_import', [GOOGLE_ADS_IMPORT_STORE_KEY]);
  }

  const warnings: string[] = [];
  const gsc = await loadGscSavedData(supabase);
  if (!gsc.rowCount) warnings.push('Chưa đọc được Search Console, phân tích sẽ thiếu dữ liệu SEO đối chiếu.');

  try {
    const [
      workLogStore,
      keywordMapStore,
      accountHistoryStore,
      historyStore,
      productsRaw,
      blogsRaw,
      clusters,
      seoKeywords,
    ] = await Promise.all([
      readOptionalStoreEntry<Array<Partial<SeoLog> & Record<string, unknown>>>(supabase, SEO_WORK_LOG_STORE_KEY, warnings),
      readOptionalStoreEntry<unknown>(supabase, SEO_KEYWORD_MAP_STORE_KEY, warnings),
      readOptionalStoreEntry<AdsAccountHistory>(supabase, GOOGLE_ADS_ACCOUNT_HISTORY_STORE_KEY, warnings),
      readOptionalStoreEntry<GoogleAdsAiHistory>(supabase, GOOGLE_ADS_AI_HISTORY_STORE_KEY, warnings),
      safeList<Record<string, unknown>>(supabase, 'products', 'id', 350),
      safeList<Record<string, unknown>>(supabase, 'blog_posts', 'created_at', 200),
      safeList<SeoCluster>(supabase, 'seo_clusters', 'priority', 100),
      safeList<SeoKeyword>(supabase, 'seo_keywords', 'priority', 500),
    ]);

    const plan = buildGoogleAdsPlannerPlan({
      googleAds,
      searchConsoleRows: gsc.rows,
      gscRanges: gsc.ranges,
      products: toProducts(productsRaw),
      blogs: toBlogs(blogsRaw),
      clusters,
      seoKeywords,
      workLogs: Array.isArray(workLogStore.value) ? workLogStore.value : [],
      keywordMap: keywordMapStore.value,
      accountHistory: normalizeAdsAccountHistory(accountHistoryStore.value),
    });
    if (warnings.length || gsc.warnings.length) {
      plan.sourceSummary.notes = Array.from(new Set([...warnings, ...gsc.warnings, ...plan.sourceSummary.notes]));
    }

    const history = appendGoogleAdsPlannerHistory(plan, historyStore.value);
    await upsertStoreValue(supabase, GOOGLE_ADS_AI_PLAN_STORE_KEY, plan);
    await upsertStoreValue(supabase, GOOGLE_ADS_AI_HISTORY_STORE_KEY, history);

    return NextResponse.json(buildSummary(plan, googleAds, adsStore.updatedAt, history, gsc, plan.accountHistory, accountHistoryStore.updatedAt, warnings));
  } catch (error) {
    return jsonError(500, 'Không chạy được AI Google Ads Planner.', errorMessage(error), 'build_google_ads_plan', [GOOGLE_ADS_IMPORT_STORE_KEY]);
  }
}
