import 'server-only';
import type {
  SearchConsoleOverview,
  SearchConsoleRange,
  SearchConsoleRequestType,
  SearchConsoleV7Data,
} from '../types/seo';

const DEFAULT_SITE_URL = 'https://www.noithathungngoc.com/';

function toRange(value: string | null): SearchConsoleRange {
  return value === '7d' || value === '90d' ? value : '28d';
}

function toType(value: string | null): SearchConsoleRequestType {
  const allowed: SearchConsoleRequestType[] = ['overview', 'queries', 'pages', 'devices', 'countries', 'opportunities'];
  return allowed.includes(value as SearchConsoleRequestType) ? value as SearchConsoleRequestType : 'overview';
}

export function normalizeSearchConsoleRange(value: string | null): SearchConsoleRange {
  return toRange(value);
}

export function normalizeSearchConsoleType(value: string | null): SearchConsoleRequestType {
  return toType(value);
}

function fallback(range: SearchConsoleRange, selectedType: SearchConsoleRequestType, reason: SearchConsoleOverview['reason'], message: string): SearchConsoleV7Data {
  return {
    source: 'fallback',
    selectedType,
    overview: {
      connected: false,
      reason,
      message,
      siteUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || DEFAULT_SITE_URL,
      range,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
      lastUpdated: new Date().toISOString(),
    },
    queries: [],
    pages: [],
    devices: [],
    countries: [],
    trend: [],
    opportunities: [],
  };
}

export async function getSearchConsoleData(range: SearchConsoleRange = '28d', selectedType: SearchConsoleRequestType = 'overview'): Promise<SearchConsoleV7Data> {
  return fallback(
    range,
    selectedType,
    'manual_import',
    'Đang dùng chế độ import thủ công. Dashboard không tự gọi Google Search Console API.'
  );
}
