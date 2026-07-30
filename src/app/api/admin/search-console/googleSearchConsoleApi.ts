import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, getAdminSessionValue } from '@/lib/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import type { SearchConsoleImportMeta, SearchConsolePage, SearchConsoleQuery, SearchConsoleV7Data } from '@/app/admin/seo/types/seo';

export const GSC_OAUTH_STORE_KEY = 'noithathungngoc-search-console-oauth-v1';
export const GSC_QUERY_PAGE_STORE_KEY = 'noithathungngoc-search-console-query-pages-v1';
export const GSC_AGGREGATE_STORE_KEY = 'noithathungngoc-search-console-import-v1';

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
  data?: string;
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

type QueryPageRange = '28d' | '3m' | '6m' | '12m' | '16m';

export type QueryPageSyncResponse = {
  ok: boolean;
  skipped?: boolean;
  message: string;
  storeKey: string;
  siteUrl: string;
  dateRangeLabel: string;
  startDate: string;
  endDate: string;
  rowCount: number;
  updatedAt: string;
  data: SearchConsoleV7Data;
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
  return jsonError(401, 'Bạn cần đăng nhập quản trị để dùng Search Console API.');
}

function env(name: string) {
  return String(process.env[name] || '').trim();
}

function requiredEnv(name: string) {
  const value = env(name);
  if (!value) throw new Error('Thiếu biến môi trường ' + name + '.');
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
  if (!state) throw new Error('Thiếu OAuth state.');
  const [body, signature] = state.split('.');
  if (!body || !signature) throw new Error('OAuth state không hợp lệ.');
  const expected = crypto.createHmac('sha256', requiredEnv('GSC_TOKEN_ENCRYPTION_KEY')).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error('OAuth state không khớp.');
  }
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { exp?: number };
  if (!payload.exp || payload.exp < Date.now()) throw new Error('OAuth state đã hết hạn.');
  return payload;
}

function getSupabase() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Thiếu SUPABASE_SERVICE_ROLE_KEY.');
  return getSupabaseAdminClient();
}

function parseStoreValue(item: StoreItem | null | undefined) {
  if (!item?.payload) return null;
  if (item.payload.raw && typeof item.payload.raw === 'string') {
    return JSON.parse(item.payload.raw);
  }
  return item.payload.value ?? item.payload;
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
  const payload = JSON.parse(chunks.join('')) as StorePayload;
  return parseStoreValue({ store_key: storeKey, payload }) as T | null;
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
    throw new Error(body.error_description || body.error || 'Google không trả refresh_token. Hãy thử kết nối lại với prompt consent.');
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
    throw new Error(body.error_description || body.error || 'Không lấy được access_token mới từ Google.');
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
  const daysByRange: Record<QueryPageRange, number> = { '28d': 28, '3m': 90, '6m': 180, '12m': 365, '16m': 480 };
  const labelByRange: Record<QueryPageRange, string> = { '28d': '28 ngày', '3m': '3 tháng', '6m': '6 tháng', '12m': '12 tháng', '16m': '16 tháng' };
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

async function fetchQueryPageRows(accessToken: string, siteUrl: string, startDate: string, endDate: string) {
  const allRows: SearchConsoleQuery[] = [];
  for (let pageIndex = 0; pageIndex < MAX_PAGE_COUNT; pageIndex += 1) {
    const startRow = pageIndex * DEFAULT_ROW_LIMIT;
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
        rowLimit: DEFAULT_ROW_LIMIT,
        startRow,
      }),
    });
    const body = await response.json().catch(() => ({})) as { rows?: SearchAnalyticsRow[]; error?: { message?: string } };
    if (!response.ok) throw new Error(body.error?.message || 'Google Search Console API trả lỗi.');
    const rows = normalizeGscRows(body.rows || []);
    allRows.push(...rows);
    if (rows.length < DEFAULT_ROW_LIMIT) break;
  }
  return allRows;
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
      message: 'Đang dùng dữ liệu Query+Page từ Google Search Console API.',
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
  return {
    source: 'api',
    selectedType: 'overview',
    overview: incoming.overview,
    imports,
    queries: incoming.queries,
    pages: incoming.pages,
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

function extractDataFromAggregateStore(value: unknown): SearchConsoleV7Data | null {
  const maybe = value as { data?: SearchConsoleV7Data };
  return maybe?.data || null;
}

export async function getApiStatus() {
  const token = await getTokenStore();
  const typed = await readStoreValue<SearchConsoleTypedStore>(GSC_QUERY_PAGE_STORE_KEY);
  const latest = typed?.imports?.find((item) => item.type === 'query-page');
  return {
    ok: true,
    connected: Boolean(token?.connected),
    siteUrl: token?.siteUrl || getConfiguredSiteUrl(),
    scope: token?.scope || GSC_SCOPE,
    latestQueryPageSync: latest ? {
      updatedAt: latest.updatedAt,
      importedAt: latest.importedAt,
      dateRangeLabel: latest.dateRangeLabel,
      startDate: latest.startDate,
      endDate: latest.endDate,
      rowCount: latest.rowCount,
      source: 'api',
    } : null,
  };
}

export async function syncQueryPage(range: string | null | undefined, force: boolean): Promise<QueryPageSyncResponse> {
  const token = await getTokenStore();
  if (!token?.connected) throw new Error('Chưa kết nối Search Console OAuth.');

  const siteUrl = token.siteUrl || getConfiguredSiteUrl();
  const resolved = resolveDateRange(range);
  const typed = await readStoreValue<SearchConsoleTypedStore>(GSC_QUERY_PAGE_STORE_KEY);
  const existing = typed?.imports?.find((item) =>
    item.type === 'query-page'
    && item.dateRangeLabel === resolved.dateRangeLabel
    && item.startDate === resolved.startDate
    && item.endDate === resolved.endDate
  );
  const today = new Date().toISOString().slice(0, 10);
  if (!force && existing?.updatedAt?.startsWith(today) && typed?.data) {
    return {
      ok: true,
      skipped: true,
      message: 'Query+Page đã được đồng bộ trong hôm nay. Bấm Lấy lại dữ liệu nếu muốn ép đồng bộ.',
      storeKey: GSC_QUERY_PAGE_STORE_KEY,
      siteUrl,
      dateRangeLabel: resolved.dateRangeLabel,
      startDate: resolved.startDate,
      endDate: resolved.endDate,
      rowCount: existing.rowCount,
      updatedAt: existing.updatedAt,
      data: typed.data,
    };
  }

  const refreshToken = decryptRefreshToken(token);
  const accessToken = await refreshAccessToken(refreshToken);
  const rows = await fetchQueryPageRows(accessToken, siteUrl, resolved.startDate, resolved.endDate);
  const now = new Date().toISOString();
  const meta: SearchConsoleImportMeta = {
    id: 'gsc-api-query-page-' + resolved.key + '-' + now,
    source: 'search-console',
    type: 'query-page',
    dateRangeLabel: resolved.dateRangeLabel,
    startDate: resolved.startDate,
    endDate: resolved.endDate,
    importedAt: now,
    updatedAt: now,
    rowCount: rows.length,
    columns: ['query', 'page', 'clicks', 'impressions', 'ctr', 'position'],
    fileName: 'Google Search Console API',
    storeKey: GSC_QUERY_PAGE_STORE_KEY,
  };
  const apiData = buildApiData(rows, meta, siteUrl);
  const apiPayload = {
    source: 'search-console-api',
    type: 'query-page',
    siteUrl,
    dateRangeLabel: resolved.dateRangeLabel,
    startDate: resolved.startDate,
    endDate: resolved.endDate,
    importedAt: now,
    updatedAt: now,
    rowCount: rows.length,
    dimensions: ['query', 'page'],
    columns: ['query', 'page', 'clicks', 'impressions', 'ctr', 'position'],
    data: rows,
  };
  const nextTyped = mergeTypedStore(typed || null, apiData, apiPayload, now);
  await upsertStoreValue(GSC_QUERY_PAGE_STORE_KEY, nextTyped);

  const aggregateStore = await readStoreValue<unknown>(GSC_AGGREGATE_STORE_KEY);
  const previousAggregate = extractDataFromAggregateStore(aggregateStore);
  const aggregateData = mergeAggregate(previousAggregate, apiData);
  const nextAggregate = {
    version: 2,
    rawText: '',
    data: aggregateData,
    fileName: 'Google Search Console API',
    rowCount: rows.length,
    rawTextByType: { 'query-page': '' },
    fileNames: { 'query-page': 'Google Search Console API' },
    rowCounts: { 'query-page': rows.length },
    imports: aggregateData.imports || [],
    lastUpdated: now,
  };
  await upsertStoreValue(GSC_AGGREGATE_STORE_KEY, nextAggregate);

  return {
    ok: true,
    message: 'Đã đồng bộ Query+Page từ Google Search Console API.',
    storeKey: GSC_QUERY_PAGE_STORE_KEY,
    siteUrl,
    dateRangeLabel: resolved.dateRangeLabel,
    startDate: resolved.startDate,
    endDate: resolved.endDate,
    rowCount: rows.length,
    updatedAt: now,
    data: aggregateData,
  };
}
