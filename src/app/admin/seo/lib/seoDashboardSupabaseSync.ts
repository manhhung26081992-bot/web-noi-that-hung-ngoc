export const SEO_DASHBOARD_SYNC_VERSION = 'v11.2.3';
export const SEO_DASHBOARD_RESTORED_EVENT = 'noithathungngoc:seo-dashboard-restored';

export type SeoDashboardRestoredEventDetail = {
  source: 'supabase';
  restoredKeys: string[];
  restoredAt: string;
};

export type SeoDashboardRestoreResult = {
  count: number;
  restoredKeys: string[];
  restoredAt: string;
};

export const SEO_DASHBOARD_SYNC_KEYS = [
  'noithathungngoc-search-console-import-v1',
  'noithathungoc-search-console-import-v1',
  'noithathungngoc-google-ads-import-v1',
  'noithathungngoc-index-summary-v1',
  'noithathungngoc-seo-work-log-v11',
  'noithathungngoc-seo-next-actions-v11',
  'noithathungngoc-seo-v11-settings',
  'noithathungngoc-gsc-manual-summary-v11',
  'noithathungngoc-seo-work-log-v1',
  'noithathungngoc-seo-workbench-checklist-v1',
  'noithathungngoc-seo-keyword-map-v1',
  'hn_ai_recommendation_history',
];

const CHUNK_MARKER = '__chunk__';
const MAX_PAYLOAD_CHARS = 400000;
const CHUNK_SIZE = 180000;

export type SeoDashboardStorePayload = {
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

export type SeoDashboardStoreItem = {
  storeKey: string;
  payload: SeoDashboardStorePayload;
  version?: string;
  updatedAt?: string;
  chunked?: boolean;
};

export type SeoDashboardSyncResponse = {
  items: SeoDashboardStoreItem[];
};

export type SeoDashboardSyncFailure = {
  storeKey: string;
  message: string;
};

export type SeoDashboardSyncResult = {
  ok: boolean;
  totalKeys: number;
  successKeys: string[];
  failedKeys: SeoDashboardSyncFailure[];
  skippedKeys: string[];
  chunkedKeys: string[];
};

type ApiErrorBody = {
  ok?: boolean;
  error?: string;
  message?: string;
  detail?: string;
};

function emptyResult(totalKeys = 0): SeoDashboardSyncResult {
  return {
    ok: true,
    totalKeys,
    successKeys: [],
    failedKeys: [],
    skippedKeys: [],
    chunkedKeys: [],
  };
}

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function tryParseJson(raw: string): { value: unknown; valueType: 'json' | 'text' } {
  try {
    return { value: JSON.parse(raw), valueType: 'json' };
  } catch {
    return { value: raw, valueType: 'text' };
  }
}

export function isChunkStoreKey(key: string) {
  return key.includes(CHUNK_MARKER);
}

export function getOriginalStoreKey(key: string) {
  return key.split(CHUNK_MARKER)[0];
}

export function isSeoDashboardStorageKey(key: string) {
  return !isChunkStoreKey(key) && (SEO_DASHBOARD_SYNC_KEYS.includes(key) || key.startsWith('noithathungngoc-'));
}

export function discoverLocalSeoKeys() {
  if (!hasWindow()) return [...SEO_DASHBOARD_SYNC_KEYS];

  const discovered = new Set<string>(SEO_DASHBOARD_SYNC_KEYS);
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && isSeoDashboardStorageKey(key)) discovered.add(key);
  }

  return Array.from(discovered).sort();
}

export function getLocalSeoDashboardSnapshot(keys = discoverLocalSeoKeys()): SeoDashboardStoreItem[] {
  if (!hasWindow()) return [];

  const now = new Date().toISOString();
  const items: Array<SeoDashboardStoreItem | null> = keys.map((storeKey) => {
    if (!isSeoDashboardStorageKey(storeKey)) return null;
    const raw = window.localStorage.getItem(storeKey);
    if (raw == null) return null;
    const parsed = tryParseJson(raw);
    return {
      storeKey,
      payload: {
        value: parsed.value,
        raw,
        valueType: parsed.valueType,
        savedAt: now,
      },
      version: SEO_DASHBOARD_SYNC_VERSION,
      updatedAt: now,
    };
  });

  return items.filter((item): item is SeoDashboardStoreItem => item !== null);
}

async function parseApiResponse(response: Response) {
  const body = await response.json().catch(() => ({})) as ApiErrorBody;
  if (!response.ok) {
    const mainMessage = body.message || body.error || 'Không đồng bộ được dữ liệu SEO.';
    const detail = body.detail ? ' - ' + body.detail : '';
    throw new Error(mainMessage + detail);
  }
  return body;
}

function chunkText(text: string) {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += CHUNK_SIZE) {
    chunks.push(text.slice(index, index + CHUNK_SIZE));
  }
  return chunks;
}

function buildChunkedItems(item: SeoDashboardStoreItem) {
  const payloadText = JSON.stringify(item.payload);
  if (payloadText.length <= MAX_PAYLOAD_CHARS) {
    return { items: [item], chunked: false };
  }

  const now = new Date().toISOString();
  const chunks = chunkText(payloadText);
  const chunkCount = chunks.length;
  const metadata: SeoDashboardStoreItem = {
    storeKey: item.storeKey,
    version: SEO_DASHBOARD_SYNC_VERSION,
    updatedAt: now,
    payload: {
      isChunked: true,
      chunkCount,
      originalStoreKey: item.storeKey,
      updatedAt: now,
      version: SEO_DASHBOARD_SYNC_VERSION,
    },
  };

  const chunkItems = chunks.map((data, index): SeoDashboardStoreItem => ({
    storeKey: item.storeKey + CHUNK_MARKER + String(index + 1).padStart(4, '0'),
    version: SEO_DASHBOARD_SYNC_VERSION,
    updatedAt: now,
    payload: {
      chunkIndex: index + 1,
      chunkCount,
      data,
    },
  }));

  return { items: [metadata, ...chunkItems], chunked: true };
}

async function postStoreItems(items: SeoDashboardStoreItem[]) {
  const response = await fetch('/api/admin/seo-dashboard-store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      items: items.map((item) => ({ storeKey: item.storeKey, payload: item.payload })),
    }),
  });
  return parseApiResponse(response);
}

async function saveSingleStoreItem(item: SeoDashboardStoreItem) {
  const { items, chunked } = buildChunkedItems(item);

  for (const part of items) {
    await postStoreItems([part]);
  }

  return { chunked };
}

function hydrateChunkedItems(items: SeoDashboardStoreItem[]) {
  const itemMap = new Map(items.map((item) => [item.storeKey, item]));
  const hydrated: SeoDashboardStoreItem[] = [];

  items.forEach((item) => {
    if (isChunkStoreKey(item.storeKey)) return;

    if (!item.payload?.isChunked) {
      hydrated.push(item);
      return;
    }

    const chunkCount = Number(item.payload.chunkCount || 0);
    const chunkData: string[] = [];
    for (let index = 1; index <= chunkCount; index += 1) {
      const chunkKey = item.storeKey + CHUNK_MARKER + String(index).padStart(4, '0');
      const chunk = itemMap.get(chunkKey);
      if (typeof chunk?.payload?.data !== 'string') {
        hydrated.push({ ...item, chunked: true });
        return;
      }
      chunkData.push(chunk.payload.data);
    }

    try {
      const originalPayload = JSON.parse(chunkData.join('')) as SeoDashboardStorePayload;
      hydrated.push({
        ...item,
        payload: originalPayload,
        chunked: true,
      });
    } catch {
      hydrated.push({ ...item, chunked: true });
    }
  });

  return hydrated;
}

export async function loadSeoDashboardFromSupabase(): Promise<SeoDashboardStoreItem[]> {
  const response = await fetch('/api/admin/seo-dashboard-store', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const body = await parseApiResponse(response) as SeoDashboardSyncResponse;
  const items = Array.isArray(body.items) ? body.items : [];
  return hydrateChunkedItems(items);
}

export async function saveSeoDashboardToSupabase(items: SeoDashboardStoreItem[]): Promise<SeoDashboardSyncResult> {
  const result = emptyResult(items.length);

  for (const item of items) {
    if (!item?.storeKey) {
      result.skippedKeys.push('Không rõ storeKey');
      continue;
    }

    try {
      const saved = await saveSingleStoreItem(item);
      result.successKeys.push(item.storeKey);
      if (saved.chunked) result.chunkedKeys.push(item.storeKey);
    } catch (error) {
      result.failedKeys.push({
        storeKey: item.storeKey,
        message: error instanceof Error ? error.message : 'Không đồng bộ được key này.',
      });
    }
  }

  result.ok = result.failedKeys.length === 0;
  return result;
}

export async function saveOneSeoKeyToSupabase(storeKey: string): Promise<SeoDashboardSyncResult> {
  const [item] = getLocalSeoDashboardSnapshot([storeKey]);
  if (!item) {
    const result = emptyResult(1);
    result.skippedKeys.push(storeKey);
    return result;
  }
  return saveSeoDashboardToSupabase([item]);
}

export async function migrateLocalSeoDataToSupabase(): Promise<SeoDashboardSyncResult> {
  const items = getLocalSeoDashboardSnapshot();
  if (!items.length) return emptyResult(0);
  return saveSeoDashboardToSupabase(items);
}

export function dispatchSeoDashboardRestoredEvent(restoredKeys: string[]) {
  if (!hasWindow()) return;
  window.dispatchEvent(
    new CustomEvent<SeoDashboardRestoredEventDetail>(SEO_DASHBOARD_RESTORED_EVENT, {
      detail: {
        source: 'supabase',
        restoredKeys,
        restoredAt: new Date().toISOString(),
      },
    }),
  );
}

export function restoreSupabaseDataToLocalStorage(items: SeoDashboardStoreItem[]): SeoDashboardRestoreResult {
  const restoredAt = new Date().toISOString();
  if (!hasWindow()) return { count: 0, restoredKeys: [], restoredAt };

  const restoredKeys: string[] = [];
  items.forEach((item) => {
    if (!item.storeKey || !item.payload || item.payload.isChunked) return;
    const raw = typeof item.payload.raw === 'string'
      ? item.payload.raw
      : JSON.stringify(item.payload.value ?? item.payload);
    window.localStorage.setItem(item.storeKey, raw);
    restoredKeys.push(item.storeKey);
  });

  return {
    count: restoredKeys.length,
    restoredKeys,
    restoredAt,
  };
}

export function buildBackupJson() {
  return JSON.stringify({
    version: SEO_DASHBOARD_SYNC_VERSION,
    exportedAt: new Date().toISOString(),
    items: getLocalSeoDashboardSnapshot(),
  }, null, 2);
}

export function parseBackupJson(text: string): SeoDashboardStoreItem[] {
  const parsed = JSON.parse(text) as { items?: SeoDashboardStoreItem[] } | SeoDashboardStoreItem[];
  const items = Array.isArray(parsed) ? parsed : parsed.items;
  if (!Array.isArray(items)) return [];
  return items.filter((item) => Boolean(item?.storeKey));
}
