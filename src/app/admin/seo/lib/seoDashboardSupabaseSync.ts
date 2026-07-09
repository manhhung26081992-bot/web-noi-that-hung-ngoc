export const SEO_DASHBOARD_SYNC_VERSION = 'v11.2';

export const SEO_DASHBOARD_SYNC_KEYS = [
  'noithathungngoc-search-console-import-v1',
  'noithathungngoc-google-ads-import-v1',
  'noithathungngoc-index-summary-v1',
  'noithathungngoc-seo-work-log-v11',
  'noithathungngoc-seo-next-actions-v11',
  'noithathungngoc-seo-v11-settings',
  'noithathungngoc-gsc-manual-summary-v11',
  'noithathungngoc-seo-work-log-v1',
];

export type SeoDashboardStorePayload = {
  value: unknown;
  raw: string;
  valueType: 'json' | 'text';
  savedAt: string;
};

export type SeoDashboardStoreItem = {
  storeKey: string;
  payload: SeoDashboardStorePayload;
  version?: string;
  updatedAt?: string;
};

export type SeoDashboardSyncResponse = {
  items: SeoDashboardStoreItem[];
};

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

export function isSeoDashboardStorageKey(key: string) {
  return key.startsWith('noithathungngoc-') || SEO_DASHBOARD_SYNC_KEYS.includes(key);
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
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    throw new Error(body.error || 'Không đồng bộ được dữ liệu SEO.');
  }
  return body;
}

export async function loadSeoDashboardFromSupabase(): Promise<SeoDashboardStoreItem[]> {
  const response = await fetch('/api/admin/seo-dashboard-store', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const body = await parseApiResponse(response) as SeoDashboardSyncResponse;
  return Array.isArray(body.items) ? body.items : [];
}

export async function saveSeoDashboardToSupabase(items: SeoDashboardStoreItem[]) {
  const response = await fetch('/api/admin/seo-dashboard-store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      items: items.map((item) => ({ storeKey: item.storeKey, payload: item.payload })),
    }),
  });
  return parseApiResponse(response);
}

export async function saveOneSeoKeyToSupabase(storeKey: string) {
  const [item] = getLocalSeoDashboardSnapshot([storeKey]);
  if (!item) return { ok: false, skipped: true };
  return saveSeoDashboardToSupabase([item]);
}

export async function migrateLocalSeoDataToSupabase() {
  const items = getLocalSeoDashboardSnapshot();
  if (!items.length) return { ok: true, count: 0 };
  await saveSeoDashboardToSupabase(items);
  return { ok: true, count: items.length };
}

export function restoreSupabaseDataToLocalStorage(items: SeoDashboardStoreItem[]) {
  if (!hasWindow()) return 0;

  let restored = 0;
  items.forEach((item) => {
    if (!item.storeKey || !item.payload) return;
    const raw = typeof item.payload.raw === 'string'
      ? item.payload.raw
      : JSON.stringify(item.payload.value ?? item.payload);
    window.localStorage.setItem(item.storeKey, raw);
    restored += 1;
  });

  return restored;
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
