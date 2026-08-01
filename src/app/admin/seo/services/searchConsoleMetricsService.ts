import type { SearchConsoleQuery, SearchConsoleV7Data } from '../types/seo';

export type NormalizedGscRow = Omit<SearchConsoleQuery, 'position'> & {
  position: number | null;
  dataRange?: string;
  source?: string;
};

export type GscPositionBuckets = {
  top1To5: number;
  top6To10: number;
  top11To30: number;
  top31To50: number;
  over50: number;
  unknown: number;
};

export type GscPerformanceSummary = {
  rowCount: number;
  queryCount: number;
  pageCount: number;
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number | null;
  averagePosition: number | null;
  lowCtrQueryCount: number;
  positionBuckets: GscPositionBuckets;
  updatedAt?: string | null;
  source?: string;
  rangeLabel?: string;
};

export type GscOpportunityRow = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number | null;
  action: string;
  rangeLabel?: string;
};

export type GscCannibalizationOpportunity = {
  query: string;
  pages: string[];
  clicks: number;
  impressions: number;
  averagePosition: number | null;
  action: string;
};

export type GscOpportunitySummary = {
  top6To10: GscOpportunityRow[];
  top11To30: GscOpportunityRow[];
  lowCtrHighImpressions: GscOpportunityRow[];
  cannibalization: GscCannibalizationOpportunity[];
};

type LooseRecord = Record<string, unknown>;

function firstValue(record: LooseRecord, keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  }
  const lowerMap = new Map(Object.keys(record).map((key) => [key.toLowerCase(), key]));
  for (const key of keys) {
    const matched = lowerMap.get(key.toLowerCase());
    if (matched) return record[matched];
  }
  return undefined;
}

export function normalizeGscNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? '')
    .replace(/%/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .trim();
  if (!cleaned) return 0;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function normalizeGscCtr(value: unknown): number {
  const raw = String(value ?? '').trim();
  const numeric = normalizeGscNumber(value);
  if (!Number.isFinite(numeric)) return 0;
  if (raw.includes('%')) return Number(numeric.toFixed(2));
  if (numeric > 0 && numeric <= 1) return Number((numeric * 100).toFixed(2));
  return Number(numeric.toFixed(2));
}

export function normalizeGscPosition(value: unknown): number | null {
  if (value == null || value === '') return null;
  const numeric = normalizeGscNumber(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Number(numeric.toFixed(1));
}

export function normalizeGscQueryPageRow(value: unknown, dataRange?: string): NormalizedGscRow | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as LooseRecord;
  const query = String(firstValue(record, ['query', 'Query', 'truy vấn', 'Truy vấn']) ?? '').trim();
  const page = String(firstValue(record, ['page', 'Page', 'trang', 'Trang']) ?? '').trim();
  if (!query && !page) return null;
  return {
    query,
    page,
    clicks: Math.round(normalizeGscNumber(firstValue(record, ['clicks', 'Clicks', 'lượt nhấp', 'Lượt nhấp']))),
    impressions: Math.round(normalizeGscNumber(firstValue(record, ['impressions', 'Impressions', 'lượt hiển thị', 'Lượt hiển thị']))),
    ctr: normalizeGscCtr(firstValue(record, ['ctr', 'CTR'])),
    position: normalizeGscPosition(firstValue(record, ['position', 'Position', 'vị trí', 'Vị trí'])),
    dataRange,
  };
}

export function normalizeGscRows(rows: unknown, dataRange?: string): NormalizedGscRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => normalizeGscQueryPageRow(row, dataRange)).filter((row): row is NormalizedGscRow => Boolean(row));
}

export function normalizeSearchConsoleData(data: SearchConsoleV7Data | null | undefined, dataRange?: string): SearchConsoleV7Data | null {
  if (!data) return null;
  const queries = normalizeGscRows(data.queries, dataRange).map((row) => ({
    ...row,
    position: row.position ?? 0,
  }));
  const pages = normalizeGscRows(data.pages, dataRange).filter((row) => row.page).map((row) => ({
    page: row.page || '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position ?? 0,
  }));
  return { ...data, queries, pages };
}

function weightedAveragePosition(rows: NormalizedGscRow[]) {
  let totalWeight = 0;
  let totalPosition = 0;
  rows.forEach((row) => {
    if (!row.position) return;
    const weight = Math.max(1, row.impressions || 0);
    totalWeight += weight;
    totalPosition += row.position * weight;
  });
  return totalWeight ? Number((totalPosition / totalWeight).toFixed(1)) : null;
}

export function buildGscPerformanceSummary(rowsInput: unknown, options: { updatedAt?: string | null; source?: string; rangeLabel?: string } = {}): GscPerformanceSummary {
  const rows = normalizeGscRows(rowsInput, options.rangeLabel);
  const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const totalImpressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const positionBuckets: GscPositionBuckets = { top1To5: 0, top6To10: 0, top11To30: 0, top31To50: 0, over50: 0, unknown: 0 };
  rows.forEach((row) => {
    const position = row.position;
    if (!position) positionBuckets.unknown += 1;
    else if (position <= 5) positionBuckets.top1To5 += 1;
    else if (position <= 10) positionBuckets.top6To10 += 1;
    else if (position <= 30) positionBuckets.top11To30 += 1;
    else if (position <= 50) positionBuckets.top31To50 += 1;
    else positionBuckets.over50 += 1;
  });
  return {
    rowCount: rows.length,
    queryCount: new Set(rows.map((row) => row.query).filter(Boolean)).size,
    pageCount: new Set(rows.map((row) => row.page).filter(Boolean)).size,
    totalClicks,
    totalImpressions,
    averageCtr: totalImpressions ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : null,
    averagePosition: weightedAveragePosition(rows),
    lowCtrQueryCount: rows.filter((row) => row.impressions > 0 && row.ctr < 2 && (!row.position || row.position <= 30)).length,
    positionBuckets,
    updatedAt: options.updatedAt || null,
    source: options.source,
    rangeLabel: options.rangeLabel,
  };
}

function opportunityBase(row: NormalizedGscRow, action: string): GscOpportunityRow {
  return {
    query: row.query,
    page: row.page || '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
    action,
    rangeLabel: row.dataRange,
  };
}

export function buildGscOpportunitySummary(rowsInput: unknown): GscOpportunitySummary {
  const rows = normalizeGscRows(rowsInput)
    .filter((row) => row.query && row.impressions > 0)
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || (a.position || 999) - (b.position || 999));

  const top6To10 = rows
    .filter((row) => row.position != null && row.position > 5 && row.position <= 10)
    .slice(0, 10)
    .map((row) => opportunityBase(row, row.ctr < 2 ? 'Sửa title/meta để tăng CTR và thêm internal link nhẹ.' : 'Tối ưu nhẹ để đẩy vào top 3.'));

  const top11To30 = rows
    .filter((row) => row.position != null && row.position > 10 && row.position <= 30)
    .slice(0, 10)
    .map((row) => opportunityBase(row, row.clicks === 0 ? 'Bổ sung internal link, FAQ và tối ưu landing page vì có impression chưa có click.' : 'Bổ sung nội dung/FAQ và link nội bộ để đẩy vào top 10.'));

  const lowCtrHighImpressions = rows
    .filter((row) => row.impressions >= 20 && row.ctr < 2 && (!row.position || row.position <= 30))
    .slice(0, 10)
    .map((row) => opportunityBase(row, 'CTR thấp so với impression; ưu tiên title/meta và snippet.'));

  const groups = new Map<string, { query: string; pages: Map<string, NormalizedGscRow>; clicks: number; impressions: number; weightedPosition: number; weight: number }>();
  rows.forEach((row) => {
    if (!row.query || !row.page) return;
    const key = row.query.toLowerCase();
    const group = groups.get(key) || { query: row.query, pages: new Map<string, NormalizedGscRow>(), clicks: 0, impressions: 0, weightedPosition: 0, weight: 0 };
    const existing = group.pages.get(row.page);
    if (!existing || row.impressions > existing.impressions) group.pages.set(row.page, row);
    group.clicks += row.clicks;
    group.impressions += row.impressions;
    if (row.position) {
      const weight = Math.max(1, row.impressions || 0);
      group.weight += weight;
      group.weightedPosition += row.position * weight;
    }
    groups.set(key, group);
  });

  const cannibalization = Array.from(groups.values())
    .filter((group) => group.pages.size > 1)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10)
    .map((group) => ({
      query: group.query,
      pages: Array.from(group.pages.keys()).slice(0, 5),
      clicks: group.clicks,
      impressions: group.impressions,
      averagePosition: group.weight ? Number((group.weightedPosition / group.weight).toFixed(1)) : null,
      action: 'Chọn URL chính, gom internal link và tránh viết thêm nội dung trùng query.',
    }));

  return { top6To10, top11To30, lowCtrHighImpressions, cannibalization };
}

export function mergeGscRowsForSummary(sources: Array<{ rows?: unknown; rangeLabel?: string }>, limit = 5000): NormalizedGscRow[] {
  const map = new Map<string, NormalizedGscRow>();
  sources.forEach((source) => {
    normalizeGscRows(source.rows, source.rangeLabel).forEach((row) => {
      const key = row.query + '|' + (row.page || '');
      const current = map.get(key);
      if (!current || row.impressions > current.impressions || (row.impressions === current.impressions && row.clicks > current.clicks)) {
        map.set(key, { ...row, dataRange: source.rangeLabel || row.dataRange });
      }
    });
  });
  return Array.from(map.values())
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || (a.position || 999) - (b.position || 999))
    .slice(0, limit);
}
