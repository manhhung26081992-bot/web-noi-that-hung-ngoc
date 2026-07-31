import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, getAdminSessionValue } from '@/lib/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import type { SearchConsoleImportMeta, SearchConsolePage, SearchConsoleQuery, SearchConsoleUpdateHistoryEntry, SearchConsoleV7Data } from '@/app/admin/seo/types/seo';

export const GSC_OAUTH_STORE_KEY = 'noithathungngoc-search-console-oauth-v1';
export const GSC_QUERY_PAGE_STORE_KEY = 'noithathungngoc-search-console-query-pages-v1';
export const GSC_QUERY_PAGE_HISTORY_STORE_KEY = 'noithathungngoc-search-console-query-pages-history-v1';
export const GSC_QUERY_PAGE_RANGE_KEYS = ['7d', '28d', '3m', '6m', '12m'] as const;
export const GSC_AGGREGATE_STORE_KEY = 'noithathungngoc-search-console-import-v1';

export function getQueryPageRangeStoreKey(rangeKey: string) {
  return GSC_QUERY_PAGE_STORE_KEY + '__range__' + String(rangeKey || '').trim();
}

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const CHUNK_MARKER = '__chunk__';
const CHUNK_SIZE = 180000;
const MAX_PAGE_COUNT = 4;
const DEFAULT_ROW_LIMIT = 25000;

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
  metadata?: Partial<GscQueryPageSyncMeta> | null;
};

type StoreItem = {
  store_key: string;
  payload: StorePayload;
  version?: string;
  updated_at?: string;
};

type TokenStore = {
  source: 'google-search-console-oauth';
  connected: boolean;
  siteUrl: string;
  scope: string;
  encryptedRefreshToken: string;
  iv: string;
  tag: string;
  connectedAt: string;
  updatedAt: string;
};

type SearchAnalyticsRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type QueryPageRange = '7d' | '28d' | '3m' | '6m' | '12m' | '16m';

export type QueryPageSyncOptions = {
  rowLimit?: number;
  maxPages?: number;
};

export type GscQueryPageStoppedReason = 'completed' | 'max_pages_reached' | 'empty_response' | 'api_error';

export type GscQueryPageSyncMeta = {
  source: 'search-console-api';
  type: 'query-page';
  storeKey: string;
  rangeKey: string;
  siteUrl: string;
  dateRangeLabel: string;
  startDate: string;
  endDate: string;
  importedAt: string;
  updatedAt: string;
  rowCount: number;
  dimensions: string[];
  columns: string[];
  partial: boolean;
  rowLimit: number;
  maxPages: number;
  pagesFetched: number;
  fetchedRows: number;
  maxPagesReached: boolean;
  stoppedReason: GscQueryPageStoppedReason;
};

export type QueryPageSyncResponse = {
  ok: boolean;
  skipped?: boolean;
  message: string;
  storeKey: string;
  latestStoreKey?: string;
  historyStoreKey?: string;
  rangeKey: string;
  siteUrl: string;
  dateRangeLabel: string;
  startDate: string;
  endDate: string;
  rowCount: number;
  updatedAt: string;
  partial: boolean;
  rowLimit: number;
  maxPages: number;
  pagesFetched: number;
  fetchedRows: number;
  maxPagesReached: boolean;
  stoppedReason: GscQueryPageStoppedReason;
  metadata: GscQueryPageSyncMeta;
  overview: SearchConsoleV7Data['overview'];
  topRows: SearchConsoleQuery[];
};

export async function isAdminRequest() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!session) return false;

  return session === await getAdminSessionValue(adminPassword);
}

export function jsonError(status: number, message: string, detail?: string) {
  return NextResponse.json({ ok: false, error: message, message, detail }, { status });
}

export function unauthorized() {
  return jsonError(401, 'Báº¡n cáº§n Ä‘Äƒng nháº­p quáº£n trá»‹ Ä‘á»ƒ dÃ¹ng Search Console API.');
}

function env(name: string) {
  return String(process.env[name] || '').trim();
}

function requiredEnv(name: string) {
  const value = env(name);
  if (!value) throw new Error('Thiáº¿u biáº¿n mÃ´i trÆ°á»ng ' + name + '.');
  return value;
}

export function getConfiguredSiteUrl() {
  return env('GOOGLE_SEARCH_CONSOLE_SITE_URL') || 'sc-domain:noithathungngoc.com';
}

function encryptionKey() {
  return crypto.createHash('sha256').update(requiredEnv('GSC_TOKEN_ENCRYPTION_KEY')).digest();
}

function encryptRefreshToken(refreshToken: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(refreshToken, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encryptedRefreshToken: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

function decryptRefreshToken(store: TokenStore) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(store.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(store.tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(store.encryptedRefreshToken, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

function signState(payload: Record<string, unknown>) {
  const secret = requiredEnv('GSC_TOKEN_ENCRYPTION_KEY');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return body + '.' + signature;
}

function verifyState(state: string | null) {
  if (!state) throw new Error('Thiáº¿u OAuth state.');
  const [body, signature] = state.split('.');
  if (!body || !signature) throw new Error('OAuth state khÃ´ng há»£p lá»‡.');
  const expected = crypto.createHmac('sha256', requiredEnv('GSC_TOKEN_ENCRYPTION_KEY')).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error('OAuth state khÃ´ng khá»›p.');
  }
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { exp?: number };
  if (!payload.exp || payload.exp < Date.now()) throw new Error('OAuth state Ä‘Ã£ háº¿t háº¡n.');
  return payload;
}

function getSupabase() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Thiáº¿u SUPABASE_SERVICE_ROLE_KEY.');
  return getSupabaseAdminClient();
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

function parseStoreValue(item: StoreItem | null | undefined) {
  if (!item?.payload) return null;
  return normalizeStorePayloadValue(item.payload);
}

function countQueryPageRows(value: unknown): number {
  const normalized = normalizeStorePayloadValue(value);
  if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)) return 0;
  const record = normalized as Record<string, unknown>;
  const directRowCount = Number(record.rowCount || record.fetchedRows || 0);
  if (Number.isFinite(directRowCount) && directRowCount > 0) return directRowCount;
  const queryRows = Array.isArray(record.queries) ? record.queries.length : 0;
  if (queryRows > 0) return queryRows;
  const rows = Array.isArray(record.rows) ? record.rows.length : 0;
  if (rows > 0) return rows;
  const items = Array.isArray(record.items) ? record.items.length : 0;
  if (items > 0) return items;
  if (record.data && typeof record.data === 'object') return countQueryPageRows(record.data);
  if (record.apiPayload && typeof record.apiPayload === 'object') return countQueryPageRows(record.apiPayload);
  return 0;
}

async function readStoreRows(storeKey: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('seo_dashboard_store')
    .select('store_key,payload,version,updated_at')
    .or('store_key.eq.' + storeKey + ',store_key.like.' + storeKey + CHUNK_MARKER + '%');
  if (error) throw error;
  return (data || []) as StoreItem[];
}

async function readStoreMain(storeKey: string) {
  const { data } = await getSupabase()
    .from('seo_dashboard_store')
    .select('store_key,payload,version,updated_at')
    .eq('store_key', storeKey)
    .maybeSingle();
  return data as StoreItem | null;
}

function latestMetaFromStoreValue(value: unknown): Partial<GscQueryPageSyncMeta> | null {
  const normalized = normalizeStorePayloadValue(value);
  if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)) return null;
  const typed = normalized as Record<string, unknown> & { imports?: Array<Partial<GscQueryPageSyncMeta> & { type?: string; source?: string }>; queryPageApi?: GscQueryPageSyncMeta; metadata?: Partial<GscQueryPageSyncMeta> };
  if (typed.queryPageApi) return typed.queryPageApi;
  if (typed.metadata && typeof typed.metadata === 'object') return typed.metadata;
  const latestImport = [...(Array.isArray(typed.imports) ? typed.imports : [])]
    .filter((item) => item.type === 'query-page')
    .sort((a, b) => String(b.updatedAt || b.importedAt || '').localeCompare(String(a.updatedAt || a.importedAt || '')))[0];
  if (latestImport) return latestImport as Partial<GscQueryPageSyncMeta>;
  const latestItem = [...(Array.isArray(typed.items) ? typed.items as Array<Partial<GscQueryPageSyncMeta> & { type?: string }> : [])]
    .filter((item) => !item.type || item.type === 'query-page')
    .sort((a, b) => String(b.updatedAt || b.importedAt || '').localeCompare(String(a.updatedAt || a.importedAt || '')))[0];
  if (latestItem) return latestItem;
  const rowCount = countQueryPageRows(normalized);
  return rowCount > 0 ? { rowCount } : null;
}

function rangeStatusFromMainRow(rangeKey: string, main: StoreItem | null, historyLatest?: SearchConsoleUpdateHistoryEntry) {
  const fallback = resolveDateRange(rangeKey);
  const payload = main?.payload || null;
  const storeValue = payload && !payload.isChunked ? parseStoreValue(main || undefined) : null;
  const metadata = (payload?.metadata || latestMetaFromStoreValue(storeValue) || latestMetaFromStoreValue(payload) || null) as Partial<GscQueryPageSyncMeta> | null;
  const hasData = Boolean(main || historyLatest);
  const rowCount = Number(historyLatest?.rowCount || metadata?.rowCount || countQueryPageRows(storeValue) || countQueryPageRows(payload) || 0);
  const updatedAt = historyLatest?.updatedAt || metadata?.updatedAt || main?.updated_at || payload?.updatedAt || null;
  const importedAt = historyLatest?.importedAt || metadata?.importedAt || null;
  const stoppedReason = historyLatest?.stoppedReason || metadata?.stoppedReason || (hasData ? 'completed' : '');
  return {
    rangeKey,
    storeKey: getQueryPageRangeStoreKey(rangeKey),
    exists: Boolean(main),
    hasData,
    updatedAt,
    importedAt,
    dateRangeLabel: historyLatest?.dateRangeLabel || metadata?.dateRangeLabel || fallback.dateRangeLabel,
    startDate: historyLatest?.startDate || metadata?.startDate || '',
    endDate: historyLatest?.endDate || metadata?.endDate || '',
    rowCount,
    source: 'api',
    full: hasData ? !Boolean(historyLatest?.partial || metadata?.partial) : false,
    partial: Boolean(historyLatest?.partial || metadata?.partial),
    rowLimit: Number(historyLatest?.rowLimit || metadata?.rowLimit || 0),
    maxPages: Number(historyLatest?.maxPages || metadata?.maxPages || 0),
    pagesFetched: Number(historyLatest?.pagesFetched || metadata?.pagesFetched || 0),
    fetchedRows: Number(metadata?.fetchedRows || rowCount || 0),
    maxPagesReached: stoppedReason === 'max_pages_reached' || Boolean(metadata?.maxPagesReached),
    stoppedReason,
  };
}

async function readStoreValue<T>(storeKey: string): Promise<T | null> {
  const rows = await readStoreRows(storeKey);
  const main = rows.find((item) => item.store_key === storeKey);
  if (!main) return null;
  if (!main.payload?.isChunked) return parseStoreValue(main) as T | null;

  const chunks: string[] = [];
  const chunkCount = Number(main.payload.chunkCount || 0);
  for (let index = 1; index <= chunkCount; index += 1) {
    const key = storeKey + CHUNK_MARKER + String(index).padStart(4, '0');
    const chunk = rows.find((item) => item.store_key === key);
    if (typeof chunk?.payload?.data !== 'string') return null;
    chunks.push(chunk.payload.data);
  }
  const parsed = safeJsonParse(chunks.join('')) as StorePayload;
  return normalizeStorePayloadValue(parsed) as T | null;
}

function chunkText(text: string) {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += CHUNK_SIZE) {
    chunks.push(text.slice(index, index + CHUNK_SIZE));
  }
  return chunks;
}

async function upsertStoreValue(storeKey: string, value: unknown) {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const raw = JSON.stringify(value);
  const payload: StorePayload = { value, raw, valueType: 'json', savedAt: now };
  const payloadText = JSON.stringify(payload);
  const rows: StoreItem[] = [];

  if (payloadText.length <= 400000) {
    rows.push({ store_key: storeKey, payload, version: 'v11.2.3', updated_at: now });
  } else {
    const chunks = chunkText(payloadText);
    rows.push({
      store_key: storeKey,
      version: 'v11.2.3',
      updated_at: now,
      payload: {
        isChunked: true,
        chunkCount: chunks.length,
        originalStoreKey: storeKey,
        updatedAt: now,
        version: 'v11.2.3',
        metadata: latestMetaFromStoreValue(value),
      },
    });
    chunks.forEach((data, index) => {
      rows.push({
        store_key: storeKey + CHUNK_MARKER + String(index + 1).padStart(4, '0'),
        version: 'v11.2.3',
        updated_at: now,
        payload: {
          chunkIndex: index + 1,
          chunkCount: chunks.length,
          data,
        },
      });
    });
  }

  const { error } = await supabase.from('seo_dashboard_store').upsert(rows, { onConflict: 'store_key' });
  if (error) throw error;
}

export async function buildAuthUrl() {
  const clientId = requiredEnv('GOOGLE_SEARCH_CONSOLE_CLIENT_ID');
  const redirectUri = requiredEnv('GOOGLE_SEARCH_CONSOLE_REDIRECT_URI');
  const state = signState({ source: 'gsc-oauth', exp: Date.now() + 10 * 60 * 1000 });
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'https://www.googleapis.com/auth/webmasters.readonly');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  return url.toString();
}

async function exchangeCodeForTokens(code: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      code,
      client_id: requiredEnv('GOOGLE_SEARCH_CONSOLE_CLIENT_ID'),
      client_secret: requiredEnv('GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET'),
      redirect_uri: requiredEnv('GOOGLE_SEARCH_CONSOLE_REDIRECT_URI'),
      grant_type: 'authorization_code',
    }),
  });
  const body = await response.json().catch(() => ({})) as { refresh_token?: string; error?: string; error_description?: string };
  if (!response.ok || !body.refresh_token) {
    throw new Error(body.error_description || body.error || 'Google khÃ´ng tráº£ refresh_token. HÃ£y thá»­ káº¿t ná»‘i láº¡i vá»›i prompt consent.');
  }
  return body.refresh_token;
}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: requiredEnv('GOOGLE_SEARCH_CONSOLE_CLIENT_ID'),
      client_secret: requiredEnv('GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET'),
      grant_type: 'refresh_token',
    }),
  });
  const body = await response.json().catch(() => ({})) as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description || body.error || 'KhÃ´ng láº¥y Ä‘Æ°á»£c access_token má»›i tá»« Google.');
  }
  return body.access_token;
}

export async function handleOAuthCallback(code: string, state: string | null) {
  verifyState(state);
  const refreshToken = await exchangeCodeForTokens(code);
  const now = new Date().toISOString();
  const encrypted = encryptRefreshToken(refreshToken);
  const tokenStore: TokenStore = {
    source: 'google-search-console-oauth',
    connected: true,
    siteUrl: getConfiguredSiteUrl(),
    scope: GSC_SCOPE,
    ...encrypted,
    connectedAt: now,
    updatedAt: now,
  };
  await upsertStoreValue(GSC_OAUTH_STORE_KEY, tokenStore);
}

async function getTokenStore() {
  return readStoreValue<TokenStore>(GSC_OAUTH_STORE_KEY);
}

function dateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function resolveDateRange(range: string | null | undefined) {
  const key = String(range || '3m') as QueryPageRange;
  const daysByRange: Record<QueryPageRange, number> = { '7d': 7, '28d': 28, '3m': 90, '6m': 180, '12m': 365, '16m': 480 };
  const labelByRange: Record<QueryPageRange, string> = { '7d': '7 ngay', '28d': '28 ngay', '3m': '3 thang', '6m': '6 thang', '12m': '12 thang', '16m': '16 thang' };
  const safeKey = key in daysByRange ? key : '3m';
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - daysByRange[safeKey] + 1);
  return {
    key: safeKey,
    dateRangeLabel: labelByRange[safeKey],
    startDate: dateInput(start),
    endDate: dateInput(end),
  };
}

function resolveQueryPageFetchLimits(options: QueryPageSyncOptions = {}) {
  const rowLimit = Math.max(1000, Math.min(DEFAULT_ROW_LIMIT, Math.floor(Number(options.rowLimit || DEFAULT_ROW_LIMIT))));
  const maxPages = Math.max(1, Math.min(MAX_PAGE_COUNT, Math.floor(Number(options.maxPages || MAX_PAGE_COUNT))));
  return { rowLimit, maxPages };
}

function normalizeGscRows(rows: SearchAnalyticsRow[]) {
  return rows.map((row) => ({
    query: String(row.keys?.[0] || '').trim(),
    page: String(row.keys?.[1] || '').trim(),
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    ctr: Number(((Number(row.ctr || 0)) * 100).toFixed(2)),
    position: Number(Number(row.position || 0).toFixed(1)),
  })).filter((row) => row.query && row.page);
}

async function fetchQueryPageRows(accessToken: string, siteUrl: string, startDate: string, endDate: string, options: QueryPageSyncOptions = {}) {
  const { rowLimit, maxPages } = resolveQueryPageFetchLimits(options);
  const allRows: SearchConsoleQuery[] = [];
  let pagesFetched = 0;
  let stoppedReason: GscQueryPageStoppedReason = 'completed';
  let maxPagesReached = false;

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const startRow = pageIndex * rowLimit;
    const endpoint = 'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(siteUrl) + '/searchAnalytics/query';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query', 'page'],
        type: 'web',
        rowLimit,
        startRow,
      }),
    });
    const body = await response.json().catch(() => ({})) as { rows?: SearchAnalyticsRow[]; error?: { message?: string } };
    if (!response.ok) throw new Error(body.error?.message || 'Google Search Console API tra loi.');

    pagesFetched += 1;
    const rows = normalizeGscRows(body.rows || []);
    if (!rows.length) {
      stoppedReason = 'empty_response';
      break;
    }
    allRows.push(...rows);
    if (rows.length < rowLimit) {
      stoppedReason = 'completed';
      break;
    }
    if (pageIndex === maxPages - 1) {
      maxPagesReached = true;
      stoppedReason = 'max_pages_reached';
    }
  }

  return {
    rows: allRows,
    rowLimit,
    maxPages,
    pagesFetched,
    fetchedRows: allRows.length,
    maxPagesReached,
    partial: maxPagesReached,
    stoppedReason,
  };
}

function previewRows(rows: SearchConsoleQuery[]) {
  return [...rows]
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.position - b.position)
    .slice(0, 50);
}

function mergeByPage(rows: SearchConsoleQuery[]): SearchConsolePage[] {
  const map = new Map<string, SearchConsolePage>();
  rows.forEach((row) => {
    const current = map.get(row.page || '');
    if (!current) {
      map.set(row.page || '', { page: row.page || '', clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position });
      return;
    }
    const impressions = current.impressions + row.impressions;
    const weightedPosition = impressions ? ((current.position * current.impressions) + (row.position * row.impressions)) / impressions : current.position;
    current.clicks += row.clicks;
    current.impressions = impressions;
    current.ctr = impressions ? Number(((current.clicks / impressions) * 100).toFixed(2)) : 0;
    current.position = Number(weightedPosition.toFixed(1));
  });
  return Array.from(map.values()).sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
}

function buildApiData(rows: SearchConsoleQuery[], meta: SearchConsoleImportMeta, siteUrl: string): SearchConsoleV7Data {
  const pages = mergeByPage(rows);
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const positionWeight = rows.reduce((sum, row) => sum + row.position * Math.max(row.impressions, 1), 0);
  const positionBase = rows.reduce((sum, row) => sum + Math.max(row.impressions, 1), 0);
  return {
    source: 'api',
    selectedType: 'overview',
    overview: {
      connected: true,
      reason: 'api_sync',
      message: 'Äang dÃ¹ng dá»¯ liá»‡u Query+Page tá»« Google Search Console API.',
      siteUrl,
      range: meta.dateRangeLabel,
      clicks,
      impressions,
      ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
      position: positionBase ? Number((positionWeight / positionBase).toFixed(1)) : 0,
      lastUpdated: meta.updatedAt,
    },
    imports: [meta],
    queries: rows,
    pages,
    devices: [],
    countries: [],
    trend: [],
    searchAppearances: [],
    opportunities: [],
  };
}

function importKey(item: SearchConsoleImportMeta) {
  return item.type + '|' + item.dateRangeLabel + '|' + (item.startDate || '') + '|' + (item.endDate || '');
}

function mergeImportMeta(previous: SearchConsoleImportMeta[] = [], incoming: SearchConsoleImportMeta[] = []) {
  const map = new Map<string, SearchConsoleImportMeta>();
  [...previous, ...incoming].forEach((item) => {
    const current = map.get(importKey(item));
    if (!current || String(item.updatedAt || item.importedAt) >= String(current.updatedAt || current.importedAt)) {
      map.set(importKey(item), item);
    }
  });
  return Array.from(map.values()).sort((a, b) => String(b.updatedAt || b.importedAt).localeCompare(String(a.updatedAt || a.importedAt)));
}

function mergeAggregate(previous: SearchConsoleV7Data | null | undefined, incoming: SearchConsoleV7Data): SearchConsoleV7Data {
  const imports = mergeImportMeta(previous?.imports, incoming.imports);
  const previousImports = previous?.imports || [];
  const hasManualQueries = previousImports.some((item) => item.type === 'queries');
  const hasManualPages = previousImports.some((item) => item.type === 'pages');

  return {
    source: 'api',
    selectedType: 'overview',
    overview: incoming.overview,
    imports,
    queries: hasManualQueries ? (previous?.queries || []).filter((row) => !row.page) : [],
    pages: hasManualPages ? (previous?.pages || []) : [],
    devices: previous?.devices || [],
    countries: previous?.countries || [],
    trend: previous?.trend || [],
    searchAppearances: previous?.searchAppearances || [],
    opportunities: previous?.opportunities || [],
  };
}

type SearchConsoleTypedStore = {
  version: number;
  source: 'search-console' | 'search-console-api';
  type: 'query-page';
  sources: Array<{ meta: SearchConsoleImportMeta; rawText: string; data: SearchConsoleV7Data }>;
  imports: SearchConsoleImportMeta[];
  data: SearchConsoleV7Data;
  lastUpdated: string;
  apiPayload?: unknown;
};

function mergeTypedStore(previous: SearchConsoleTypedStore | null, incoming: SearchConsoleV7Data, apiPayload: unknown, now: string): SearchConsoleTypedStore {
  const nextSource = { meta: incoming.imports?.[0] as SearchConsoleImportMeta, rawText: '', data: incoming };
  const sources = [...(previous?.sources || []), nextSource];
  const map = new Map<string, typeof nextSource>();
  sources.forEach((source) => {
    const current = map.get(importKey(source.meta));
    if (!current || String(source.meta.updatedAt || source.meta.importedAt) >= String(current.meta.updatedAt || current.meta.importedAt)) {
      map.set(importKey(source.meta), source);
    }
  });
  const mergedSources = Array.from(map.values()).sort((a, b) => String(b.meta.updatedAt).localeCompare(String(a.meta.updatedAt)));
  return {
    version: 2,
    source: 'search-console-api',
    type: 'query-page',
    sources: mergedSources,
    imports: mergedSources.map((item) => item.meta),
    data: incoming,
    lastUpdated: now,
    apiPayload,
  };
}

function latestQueryPageMeta(store: SearchConsoleTypedStore | null | undefined) {
  return [...(store?.imports || [])]
    .filter((item) => item.type === 'query-page')
    .sort((a, b) => String(b.updatedAt || b.importedAt).localeCompare(String(a.updatedAt || a.importedAt)))[0] || null;
}

async function appendQueryPageHistory(entry: SearchConsoleUpdateHistoryEntry) {
  const current = await readStoreValue<{ items?: SearchConsoleUpdateHistoryEntry[]; history?: SearchConsoleUpdateHistoryEntry[] } | SearchConsoleUpdateHistoryEntry[]>(GSC_QUERY_PAGE_HISTORY_STORE_KEY);
  const previous = Array.isArray(current) ? current : Array.isArray(current?.items) ? current.items : Array.isArray(current?.history) ? current.history : [];
  const history = [entry, ...previous.filter((item) => item.id !== entry.id)]
    .sort((a, b) => String(b.updatedAt || b.importedAt).localeCompare(String(a.updatedAt || a.importedAt)))
    .slice(0, 160);
  await upsertStoreValue(GSC_QUERY_PAGE_HISTORY_STORE_KEY, {
    version: 1,
    source: 'search-console-api',
    items: history,
    lastUpdated: entry.updatedAt || entry.importedAt || new Date().toISOString(),
  });
}

function extractDataFromAggregateStore(value: unknown): SearchConsoleV7Data | null {
  const maybe = value as { data?: SearchConsoleV7Data };
  return maybe?.data || null;
}

export async function getApiStatus() {
  const token = await getTokenStore();
  const historyStore = await readStoreValue<{ items?: SearchConsoleUpdateHistoryEntry[] } | SearchConsoleUpdateHistoryEntry[]>(GSC_QUERY_PAGE_HISTORY_STORE_KEY);
  const aggregateStore = await readStoreValue<{ queryPageApi?: GscQueryPageSyncMeta }>(GSC_AGGREGATE_STORE_KEY);
  const history = Array.isArray(historyStore) ? historyStore : Array.isArray(historyStore?.items) ? historyStore.items : [];
  const latestByRange = new Map<string, SearchConsoleUpdateHistoryEntry>();
  history
    .filter((item) => item.source === 'api' && item.type === 'query-page' && item.rangeKey)
    .sort((a, b) => String(b.updatedAt || b.importedAt).localeCompare(String(a.updatedAt || a.importedAt)))
    .forEach((item) => {
      if (item.rangeKey && !latestByRange.has(item.rangeKey)) latestByRange.set(item.rangeKey, item);
    });
  const rangeMainRows = await Promise.all(GSC_QUERY_PAGE_RANGE_KEYS.map((rangeKey) => readStoreMain(getQueryPageRangeStoreKey(rangeKey))));
  const rangeQueryPageSyncs = GSC_QUERY_PAGE_RANGE_KEYS.map((rangeKey, index) => rangeStatusFromMainRow(rangeKey, rangeMainRows[index], latestByRange.get(rangeKey)));
  const aggregateLatest = aggregateStore?.queryPageApi || latestMetaFromStoreValue(aggregateStore);
  const historyLatest = history
    .filter((item) => item.source === 'api' && item.type === 'query-page')
    .sort((a, b) => String(b.updatedAt || b.importedAt).localeCompare(String(a.updatedAt || a.importedAt)))[0];
  const latest = historyLatest || (aggregateLatest ? {
    ...aggregateLatest,
    source: 'api' as const,
    rowCount: aggregateLatest.rowCount,
    updatedAt: aggregateLatest.updatedAt,
    importedAt: aggregateLatest.importedAt,
    storeKey: aggregateLatest.storeKey,
  } : null);
  return {
    ok: true,
    connected: Boolean(token?.connected),
    siteUrl: token?.siteUrl || getConfiguredSiteUrl(),
    scope: token?.scope || GSC_SCOPE,
    ranges: Object.fromEntries(rangeQueryPageSyncs.map((item) => [item.rangeKey, item])),
    rangeQueryPageSyncs,
    historySummary: history.slice(0, 12).map((item) => ({
      source: item.source,
      type: item.type,
      rangeKey: item.rangeKey,
      dateRangeLabel: item.dateRangeLabel,
      rowCount: item.rowCount,
      updatedAt: item.updatedAt,
      importedAt: item.importedAt,
      storeKey: item.storeKey,
      partial: item.partial,
      stoppedReason: item.stoppedReason,
    })),
    latestQueryPageSync: latest ? {
      rangeKey: latest.rangeKey,
      storeKey: latest.storeKey || GSC_QUERY_PAGE_STORE_KEY,
      updatedAt: latest.updatedAt,
      importedAt: latest.importedAt,
      dateRangeLabel: latest.dateRangeLabel,
      startDate: latest.startDate,
      endDate: latest.endDate,
      rowCount: Number(latest.rowCount || 0),
      source: 'api',
      partial: latest.partial,
      rowLimit: latest.rowLimit,
      maxPages: latest.maxPages,
      pagesFetched: latest.pagesFetched,
      fetchedRows: 'fetchedRows' in latest ? latest.fetchedRows : latest.rowCount,
      maxPagesReached: 'maxPagesReached' in latest ? latest.maxPagesReached : latest.stoppedReason === 'max_pages_reached',
      stoppedReason: latest.stoppedReason,
    } : null,
  };
}

export async function syncQueryPage(range: string | null | undefined, force: boolean, options: QueryPageSyncOptions = {}): Promise<QueryPageSyncResponse> {
  const token = await getTokenStore();
  if (!token?.connected) throw new Error('Chua ket noi Search Console OAuth.');

  const siteUrl = token.siteUrl || getConfiguredSiteUrl();
  const resolved = resolveDateRange(range);
  const rangeStoreKey = getQueryPageRangeStoreKey(resolved.key);
  const typed = await readStoreValue<SearchConsoleTypedStore>(rangeStoreKey);
  const existing = latestQueryPageMeta(typed);
  const today = new Date().toISOString().slice(0, 10);
  if (!force && existing?.updatedAt?.startsWith(today) && typed?.data) {
    const metadata: GscQueryPageSyncMeta = {
      source: 'search-console-api',
      type: 'query-page',
      storeKey: rangeStoreKey,
      rangeKey: resolved.key,
      siteUrl,
      dateRangeLabel: resolved.dateRangeLabel,
      startDate: resolved.startDate,
      endDate: resolved.endDate,
      importedAt: existing.importedAt || existing.updatedAt,
      updatedAt: existing.updatedAt,
      rowCount: existing.rowCount,
      dimensions: existing.dimensions || ['query', 'page'],
      columns: existing.columns || ['query', 'page', 'clicks', 'impressions', 'ctr', 'position'],
      partial: Boolean(existing.partial),
      rowLimit: Number(existing.rowLimit || DEFAULT_ROW_LIMIT),
      maxPages: Number(existing.maxPages || MAX_PAGE_COUNT),
      pagesFetched: Number(existing.pagesFetched || 0),
      fetchedRows: Number(existing.fetchedRows || existing.rowCount || 0),
      maxPagesReached: Boolean(existing.maxPagesReached),
      stoppedReason: existing.stoppedReason || 'completed',
    };
    return {
      ok: true,
      skipped: true,
      message: 'Query+Page da duoc dong bo trong hom nay. Bam Lay lai du lieu neu muon ep dong bo.',
      storeKey: rangeStoreKey,
      latestStoreKey: GSC_QUERY_PAGE_STORE_KEY,
      historyStoreKey: GSC_QUERY_PAGE_HISTORY_STORE_KEY,
      rangeKey: resolved.key,
      siteUrl,
      dateRangeLabel: resolved.dateRangeLabel,
      startDate: resolved.startDate,
      endDate: resolved.endDate,
      rowCount: existing.rowCount,
      updatedAt: existing.updatedAt,
      partial: metadata.partial,
      rowLimit: metadata.rowLimit,
      maxPages: metadata.maxPages,
      pagesFetched: metadata.pagesFetched,
      fetchedRows: metadata.fetchedRows,
      maxPagesReached: metadata.maxPagesReached,
      stoppedReason: metadata.stoppedReason,
      metadata,
      overview: typed.data.overview,
      topRows: previewRows(typed.data.queries || []),
    };
  }

  const refreshToken = decryptRefreshToken(token);
  const accessToken = await refreshAccessToken(refreshToken);
  const fetchResult = await fetchQueryPageRows(accessToken, siteUrl, resolved.startDate, resolved.endDate, options);
  const rows = fetchResult.rows;
  const now = new Date().toISOString();
  const meta: SearchConsoleImportMeta = {
    id: 'gsc-api-query-page-' + resolved.key + '-' + now,
    source: 'search-console-api',
    type: 'query-page',
    dateRangeLabel: resolved.dateRangeLabel,
    rangeKey: resolved.key,
    startDate: resolved.startDate,
    endDate: resolved.endDate,
    importedAt: now,
    updatedAt: now,
    rowCount: rows.length,
    columns: ['query', 'page', 'clicks', 'impressions', 'ctr', 'position'],
    dimensions: ['query', 'page'],
    partial: fetchResult.partial,
    rowLimit: fetchResult.rowLimit,
    maxPages: fetchResult.maxPages,
    pagesFetched: fetchResult.pagesFetched,
    fetchedRows: fetchResult.fetchedRows,
    maxPagesReached: fetchResult.maxPagesReached,
    stoppedReason: fetchResult.stoppedReason,
    fileName: 'Google Search Console API',
    storeKey: rangeStoreKey,
  };
  const apiData = buildApiData(rows, meta, siteUrl);
  const apiPayload = {
    source: 'search-console-api',
    type: 'query-page',
    siteUrl,
    rangeKey: resolved.key,
    dateRangeLabel: resolved.dateRangeLabel,
    startDate: resolved.startDate,
    endDate: resolved.endDate,
    importedAt: now,
    updatedAt: now,
    rowCount: rows.length,
    dimensions: ['query', 'page'],
    columns: ['query', 'page', 'clicks', 'impressions', 'ctr', 'position'],
    partial: fetchResult.partial,
    rowLimit: fetchResult.rowLimit,
    maxPages: fetchResult.maxPages,
    pagesFetched: fetchResult.pagesFetched,
    fetchedRows: fetchResult.fetchedRows,
    maxPagesReached: fetchResult.maxPagesReached,
    stoppedReason: fetchResult.stoppedReason,
    data: rows,
  };
  const nextTyped = mergeTypedStore(typed || null, apiData, apiPayload, now);
  await upsertStoreValue(rangeStoreKey, nextTyped);
  await upsertStoreValue(GSC_QUERY_PAGE_STORE_KEY, nextTyped);

  const historyEntry: SearchConsoleUpdateHistoryEntry = {
    id: meta.id,
    source: 'api',
    type: 'query-page',
    dateRangeLabel: resolved.dateRangeLabel,
    rangeKey: resolved.key,
    startDate: resolved.startDate,
    endDate: resolved.endDate,
    rowCount: rows.length,
    full: !fetchResult.partial,
    partial: fetchResult.partial,
    updatedAt: now,
    importedAt: now,
    storeKey: rangeStoreKey,
    stoppedReason: fetchResult.stoppedReason,
    pagesFetched: fetchResult.pagesFetched,
    maxPages: fetchResult.maxPages,
    rowLimit: fetchResult.rowLimit,
  };
  await appendQueryPageHistory(historyEntry);

  const aggregateStore = await readStoreValue<unknown>(GSC_AGGREGATE_STORE_KEY);
  const previousAggregate = extractDataFromAggregateStore(aggregateStore);
  const aggregateData = mergeAggregate(previousAggregate, apiData);
  const previousStore = (aggregateStore || {}) as {
    rawTextByType?: Record<string, string>;
    fileNames?: Record<string, string>;
    rowCounts?: Record<string, number>;
  };
  const metadata: GscQueryPageSyncMeta = {
    source: 'search-console-api',
    type: 'query-page',
    storeKey: rangeStoreKey,
    rangeKey: resolved.key,
    siteUrl,
    dateRangeLabel: resolved.dateRangeLabel,
    startDate: resolved.startDate,
    endDate: resolved.endDate,
    importedAt: now,
    updatedAt: now,
    rowCount: rows.length,
    dimensions: ['query', 'page'],
    columns: ['query', 'page', 'clicks', 'impressions', 'ctr', 'position'],
    partial: fetchResult.partial,
    rowLimit: fetchResult.rowLimit,
    maxPages: fetchResult.maxPages,
    pagesFetched: fetchResult.pagesFetched,
    fetchedRows: fetchResult.fetchedRows,
    maxPagesReached: fetchResult.maxPagesReached,
    stoppedReason: fetchResult.stoppedReason,
  };
  const nextAggregate = {
    version: 2,
    rawText: '',
    data: aggregateData,
    fileName: 'Google Search Console API',
    rowCount: rows.length,
    rawTextByType: { ...(previousStore.rawTextByType || {}), 'query-page': '' },
    fileNames: { ...(previousStore.fileNames || {}), 'query-page': 'Google Search Console API' },
    rowCounts: { ...(previousStore.rowCounts || {}), 'query-page': rows.length },
    imports: aggregateData.imports || [],
    queryPageApi: metadata,
    queryPageApiHistoryStoreKey: GSC_QUERY_PAGE_HISTORY_STORE_KEY,
    lastUpdated: now,
  };
  await upsertStoreValue(GSC_AGGREGATE_STORE_KEY, nextAggregate);

  return {
    ok: true,
    message: 'Da dong bo Query+Page tu Google Search Console API.',
    storeKey: rangeStoreKey,
    latestStoreKey: GSC_QUERY_PAGE_STORE_KEY,
    historyStoreKey: GSC_QUERY_PAGE_HISTORY_STORE_KEY,
    rangeKey: resolved.key,
    siteUrl,
    dateRangeLabel: resolved.dateRangeLabel,
    startDate: resolved.startDate,
    endDate: resolved.endDate,
    rowCount: rows.length,
    updatedAt: now,
    partial: fetchResult.partial,
    rowLimit: fetchResult.rowLimit,
    maxPages: fetchResult.maxPages,
    pagesFetched: fetchResult.pagesFetched,
    fetchedRows: fetchResult.fetchedRows,
    maxPagesReached: fetchResult.maxPagesReached,
    stoppedReason: fetchResult.stoppedReason,
    metadata,
    overview: apiData.overview,
    topRows: previewRows(rows),
  };
}
