'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import { Badge, EmptyState, MetricCard, MiniBarChart, ModuleCard } from './Ui';
import type {
  SearchConsoleCountry,
  SearchConsoleDatePoint,
  SearchConsoleDevice,
  SearchConsoleImportMeta,
  SearchConsoleOpportunity,
  SearchConsolePage,
  SearchConsoleQuery,
  SearchConsoleRequestType,
  SearchConsoleSearchAppearance,
  SearchConsoleV7Data,
  SeoCluster,
  SeoKeyword,
} from '../types/seo';
import styles from '../seo-dashboard.module.css';
import { SEO_DASHBOARD_SYNC_VERSION, saveOneSeoKeyToSupabase, saveSeoDashboardToSupabase } from '../lib/seoDashboardSupabaseSync';
import { detectImportDelimiter, readCsvFileAsText, splitDelimitedRow } from '../services/importFileReader';

type Props = {
  keywords: SeoKeyword[];
  clusters: SeoCluster[];
  onData?: (data: SearchConsoleV7Data | null) => void;
  compact?: boolean;
  externalData?: SearchConsoleV7Data | null;
  onOpenDetails?: () => void;
};

type ImportRow = {
  query?: string;
  page?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  device?: string;
  date?: string;
  country?: string;
  searchAppearance?: string;
};

type SearchConsoleImportKind = SearchConsoleImportMeta['type'];

type SearchConsoleImportStore = {
  version?: number;
  rawText?: string;
  data?: SearchConsoleV7Data | null;
  fileName?: string;
  rowCount?: number;
  rawTextByType?: Partial<Record<SearchConsoleImportKind, string>>;
  fileNames?: Partial<Record<SearchConsoleImportKind, string>>;
  rowCounts?: Partial<Record<SearchConsoleImportKind, number>>;
  imports?: SearchConsoleImportMeta[];
  lastUpdated?: string;
};

type SearchConsoleTypedSource = {
  meta: SearchConsoleImportMeta;
  rawText: string;
  data: SearchConsoleV7Data;
};

type SearchConsoleTypedStore = {
  version: number;
  source: 'search-console';
  type: SearchConsoleImportKind;
  sources: SearchConsoleTypedSource[];
  imports: SearchConsoleImportMeta[];
  data: SearchConsoleV7Data;
  lastUpdated: string;
};

type ParsedSearchConsoleImport = {
  rawText: string;
  data: SearchConsoleV7Data;
  fileName: string;
  zipFileName?: string;
  rowCount: number;
  kind: SearchConsoleImportKind;
  meta: SearchConsoleImportMeta;
};

type SearchConsoleImportStatus = {
  fileName: string;
  zipFileName?: string;
  status: 'success' | 'skipped' | 'error';
  type?: SearchConsoleImportKind;
  rowCount?: number;
  message: string;
};

type SearchConsoleBatchSummary = {
  zipFileName?: string;
  totalFiles: number;
  parsedFiles: number;
  skippedFiles: number;
  totalRows: number;
  statuses: SearchConsoleImportStatus[];
};

type GscManualSummary = {
  range: string;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  position: number | null;
  checkedAt: string;
  note: string;
  updatedAt: string;
};

type GscManualSummaryDraft = {
  range: string;
  clicks: string;
  impressions: string;
  ctr: string;
  position: string;
  checkedAt: string;
  note: string;
};

type GscSummaryNumbers = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  source: 'pages' | 'queries' | 'none';
};

type GscApiStatus = {
  connected: boolean;
  siteUrl: string;
  latestQueryPageSync?: {
    updatedAt: string;
    dateRangeLabel: string;
    startDate?: string;
    endDate?: string;
    rowCount: number;
    source: 'api';
  } | null;
};

type GscApiSyncResponse = {
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



const STORAGE_KEY = 'noithathungngoc-search-console-import-v1';
const LEGACY_STORAGE_KEY = 'noithathungoc-search-console-import-v1';
const GSC_MANUAL_SUMMARY_KEY = 'noithathungngoc-gsc-manual-summary-v11';

const SEARCH_CONSOLE_STORE_KEYS: Record<SearchConsoleImportKind, string> = {
  queries: 'noithathungngoc-search-console-queries-v1',
  pages: 'noithathungngoc-search-console-pages-v1',
  'query-page': 'noithathungngoc-search-console-query-pages-v1',
  dates: 'noithathungngoc-search-console-dates-v1',
  devices: 'noithathungngoc-search-console-devices-v1',
  countries: 'noithathungngoc-search-console-countries-v1',
  'search-appearance': 'noithathungngoc-search-console-search-appearance-v1',
  'manual-summary': GSC_MANUAL_SUMMARY_KEY,
};

const dateRangeOptions = ['Chua xac dinh', '7 ngay', '28 ngay', '3 thang', '6 thang', '12 thang', '16 thang', 'Tuy chinh'];
const apiDateRangeOptions = [
  { value: '28d', label: '28 ngày' },
  { value: '3m', label: '3 tháng' },
  { value: '6m', label: '6 tháng' },
  { value: '12m', label: '12 tháng' },
  { value: '16m', label: '16 tháng' },
];
const metricHeaders = ['clicks', 'impressions', 'ctr', 'position'];
const dimensionHeaders = ['query', 'page', 'device', 'date', 'country', 'searchAppearance'];
const MAX_GSC_TEXT_FILE_BYTES = 8 * 1024 * 1024;
const MAX_GSC_ZIP_BYTES = 40 * 1024 * 1024;
const MAX_GSC_ZIP_TEXT_FILES = 60;

const tabs: Array<{ id: SearchConsoleRequestType; label: string }> = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'queries', label: 'Top từ khóa' },
  { id: 'pages', label: 'Top trang' },
  { id: 'opportunities', label: 'Cơ hội' },
  { id: 'devices', label: 'Thiết bị' },
  { id: 'countries', label: 'Quốc gia' },
  { id: 'dates', label: 'Dates' },
  { id: 'searchAppearance', label: 'Appearance' },
];


function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0));
}

function formatCtr(value: number | null | undefined) {
  return Number(value || 0).toFixed(2) + '%';
}

function formatPosition(value: number | null | undefined) {
  if (value == null || !Number.isFinite(Number(value)) || Number(value) === 0) return '-';
  return Number(value).toFixed(1);
}

function formatSignedNumber(value: number) {
  const prefix = value > 0 ? '+' : '';
  return prefix + formatNumber(value);
}

function formatSignedDecimal(value: number, digits = 2) {
  const prefix = value > 0 ? '+' : '';
  return prefix + Number(value || 0).toFixed(digits);
}

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function defaultManualDraft(): GscManualSummaryDraft {
  return {
    range: 'Chưa xác định',
    clicks: '',
    impressions: '',
    ctr: '',
    position: '',
    checkedAt: todayDateInput(),
    note: '',
  };
}

function parseManualInteger(value: string) {
  const clean = String(value || '').replace(/[^\d-]/g, '');
  if (!clean) return null;
  const number = Number(clean);
  return Number.isFinite(number) ? number : null;
}

function parseManualDecimal(value: string) {
  const clean = String(value || '')
    .replace('%', '')
    .replace(/\s+/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  if (!clean) return null;
  const number = Number(clean);
  return Number.isFinite(number) ? number : null;
}

function manualSummaryToDraft(summary: GscManualSummary | null): GscManualSummaryDraft {
  if (!summary) return defaultManualDraft();
  return {
    range: summary.range || 'Chưa xác định',
    clicks: summary.clicks == null ? '' : String(summary.clicks),
    impressions: summary.impressions == null ? '' : String(summary.impressions),
    ctr: summary.ctr == null ? '' : String(summary.ctr),
    position: summary.position == null ? '' : String(summary.position),
    checkedAt: summary.checkedAt || todayDateInput(),
    note: summary.note || '',
  };
}

function buildCsvSummary(data: SearchConsoleV7Data | null): GscSummaryNumbers {
  if (!data) return { clicks: 0, impressions: 0, ctr: 0, position: 0, source: 'none' };
  const sourceRows = data.pages.length ? data.pages : data.queries;
  const source = data.pages.length ? 'pages' : data.queries.length ? 'queries' : 'none';
  const clicks = sourceRows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = sourceRows.reduce((sum, row) => sum + row.impressions, 0);
  const weightedPosition = sourceRows.reduce((sum, row) => sum + row.position * Math.max(row.impressions, 1), 0);
  const positionBase = sourceRows.reduce((sum, row) => sum + Math.max(row.impressions, 1), 0);
  return {
    clicks,
    impressions,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
    position: positionBase ? weightedPosition / positionBase : 0,
    source,
  };
}

function stripAccent(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd').replace(/\u0110/g, 'D');
}

function normalize(value: unknown) {
  return stripAccent(String(value || '')).toLowerCase().trim();
}

function parseNumber(value: unknown) {
  const raw = String(value || '').trim();
  if (!raw || raw === '-') return 0;
  const withoutPercent = raw.replace('%', '').trim();
  const normalized = withoutPercent.includes(',') && !withoutPercent.includes('.')
    ? withoutPercent.replace(',', '.')
    : withoutPercent.replace(/,/g, '');
  const number = Number(normalized.replace(/[^\d.-]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

function parseInteger(value: unknown) {
  const raw = String(value || '').replace(/[^\d-]/g, '');
  const number = Number(raw);
  return Number.isFinite(number) ? number : 0;
}

function splitRow(line: string, delimiter: string) {
  return splitDelimitedRow(line, delimiter as ',' | '\t' | ';');
}

function headerKey(value: string) {
  const key = normalize(value);
  if (['top queries', 'top query', 'queries', 'query', 'search query', 'truy van', 'tu khoa', 'keyword'].includes(key)) return 'query';
  if (['top pages', 'top page', 'pages', 'page', 'trang', 'url', 'landing page'].includes(key)) return 'page';
  if (['clicks', 'click', 'so lan nhap', 'luot nhap'].includes(key)) return 'clicks';
  if (['impressions', 'impression', 'so luot hien thi', 'luot hien thi'].includes(key)) return 'impressions';
  if (['ctr', 'average ctr', 'ty le nhap'].includes(key)) return 'ctr';
  if (['position', 'average position', 'avg position', 'vi tri', 'vi tri trung binh'].includes(key)) return 'position';
  if (['device', 'thiet bi'].includes(key)) return 'device';
  if (['date', 'ngay'].includes(key)) return 'date';
  if (['country', 'quoc gia'].includes(key)) return 'country';
  if (['search appearance', 'search appearances', 'appearance', 'hien thi tim kiem', 'giao dien tim kiem', 'dang hien thi'].includes(key)) return 'searchAppearance';
  return key;
}

function detectDelimiter(firstLine: string) {
  return detectImportDelimiter(firstLine);
}

function parseImportText(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headerIndex = lines.findIndex((line) =>
    splitRow(line, detectDelimiter(line)).map(headerKey).some((header) => dimensionHeaders.includes(header) || metricHeaders.includes(header))
  );
  const safeHeaderIndex = headerIndex >= 0 ? headerIndex : 0;
  const delimiter = detectDelimiter(lines[safeHeaderIndex]);
  const headers = splitRow(lines[safeHeaderIndex], delimiter).map(headerKey);

  return lines.slice(safeHeaderIndex + 1).map((line) => {
    const cells = splitRow(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] || '';
    });
    return {
      query: row.query || '',
      page: row.page || '',
      clicks: parseInteger(row.clicks),
      impressions: parseInteger(row.impressions),
      ctr: parseNumber(row.ctr),
      position: parseNumber(row.position),
      device: row.device || '',
      date: row.date || '',
      country: row.country || '',
      searchAppearance: row.searchAppearance || '',
    };
  }).filter((row) => (
    row.query || row.page || row.device || row.date || row.country || row.searchAppearance
  ) && (row.clicks || row.impressions || row.ctr || row.position));
}

function getImportColumns(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const headerIndex = lines.findIndex((line) =>
    splitRow(line, detectDelimiter(line)).map(headerKey).some((header) => dimensionHeaders.includes(header) || metricHeaders.includes(header))
  );
  const safeHeaderIndex = headerIndex >= 0 ? headerIndex : 0;
  const delimiter = detectDelimiter(lines[safeHeaderIndex]);
  return splitRow(lines[safeHeaderIndex], delimiter).map(headerKey).filter(Boolean);
}

function isDateText(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value);
}

function normalizeDateText(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return value;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function detectDateBounds(rows: ImportRow[]) {
  const dates = rows.map((row) => row.date || '').filter(isDateText).map(normalizeDateText).sort();
  if (!dates.length) return {};
  return { startDate: dates[0], endDate: dates[dates.length - 1] };
}

function latestImport(imports: SearchConsoleImportMeta[] | undefined) {
  return [...(imports || [])].sort((a, b) =>
    String(b.updatedAt || b.importedAt).localeCompare(String(a.updatedAt || a.importedAt))
  )[0];
}

function mergeImportMeta(previous: SearchConsoleImportMeta[] | undefined, incoming: SearchConsoleImportMeta[] | undefined) {
  const map = new Map<string, SearchConsoleImportMeta>();
  [...(previous || []), ...(incoming || [])].forEach((item) => {
    const key = `${item.type}|${item.dateRangeLabel}|${item.startDate || ''}|${item.endDate || ''}`;
    const current = map.get(key);
    if (!current || String(item.updatedAt || item.importedAt) >= String(current.updatedAt || current.importedAt)) {
      map.set(key, item);
    }
  });
  return Array.from(map.values()).sort((a, b) =>
    String(b.updatedAt || b.importedAt).localeCompare(String(a.updatedAt || a.importedAt))
  );
}

function buildImportMeta(
  kind: SearchConsoleImportKind,
  rows: ImportRow[],
  columns: string[],
  fileName: string,
  dateRangeLabel: string,
  zipFileName?: string,
): SearchConsoleImportMeta {
  const now = new Date().toISOString();
  const bounds = detectDateBounds(rows);
  const range = dateRangeLabel.trim() || (bounds.startDate && bounds.endDate ? `${bounds.startDate} - ${bounds.endDate}` : 'Chua xac dinh');
  return {
    id: `gsc-${kind}-${normalize(range)}-${normalize(fileName)}-${now}`,
    source: 'search-console',
    type: kind,
    dateRangeLabel: range,
    ...bounds,
    importedAt: now,
    updatedAt: now,
    rowCount: rows.length,
    columns,
    fileName,
    zipFileName,
    storeKey: SEARCH_CONSOLE_STORE_KEYS[kind],
  };
}

function buildStoreItem(storeKey: string, raw: string, now: string) {
  return {
    storeKey,
    payload: {
      value: JSON.parse(raw) as unknown,
      raw,
      valueType: 'json' as const,
      savedAt: now,
    },
    version: SEO_DASHBOARD_SYNC_VERSION,
    updatedAt: now,
  };
}

function cacheSeoStoreValue(storeKey: string, raw: string) {
  try {
    localStorage.setItem(storeKey, raw);
    return true;
  } catch {
    return false;
  }
}

function isSearchConsoleTextFile(fileName: string) {
  const clean = fileName.toLowerCase();
  return clean.endsWith('.csv') || clean.endsWith('.tsv');
}

function isZipFile(file: File) {
  return file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
}

function isJunkZipEntry(fileName: string) {
  const parts = fileName.split('/');
  const base = parts[parts.length - 1] || '';
  return fileName.includes('__MACOSX/') || base.startsWith('.') || !isSearchConsoleTextFile(fileName);
}

function readTextFile(file: File) {
  if (file.size > MAX_GSC_TEXT_FILE_BYTES) {
    throw new Error('File vượt giới hạn an toàn ' + Math.round(MAX_GSC_TEXT_FILE_BYTES / 1024 / 1024) + 'MB.');
  }
  return readCsvFileAsText(file);
}

function mergeTypedSources(previous: SearchConsoleTypedSource[], incoming: SearchConsoleTypedSource[]) {
  const map = new Map<string, SearchConsoleTypedSource>();
  [...previous, ...incoming].forEach((item) => {
    const meta = item.meta;
    const key = `${meta.type}|${meta.dateRangeLabel}|${meta.startDate || ''}|${meta.endDate || ''}`;
    const current = map.get(key);
    if (!current || String(meta.updatedAt || meta.importedAt) >= String(current.meta.updatedAt || current.meta.importedAt)) {
      map.set(key, item);
    }
  });
  return Array.from(map.values()).sort((a, b) =>
    String(b.meta.updatedAt || b.meta.importedAt).localeCompare(String(a.meta.updatedAt || a.meta.importedAt))
  );
}

function getTypedSourcesFromCache(kind: SearchConsoleImportKind): SearchConsoleTypedSource[] {
  try {
    const raw = localStorage.getItem(SEARCH_CONSOLE_STORE_KEYS[kind]);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<SearchConsoleTypedStore> & { rawText?: string; data?: SearchConsoleV7Data; meta?: SearchConsoleImportMeta };
    if (Array.isArray(parsed.sources)) return parsed.sources;
    if (parsed.meta && parsed.data && typeof parsed.rawText === 'string') {
      return [{ meta: parsed.meta, data: parsed.data, rawText: parsed.rawText }];
    }
  } catch {
    return [];
  }
  return [];
}

function buildTypedStoreRaw(kind: SearchConsoleImportKind, incoming: SearchConsoleTypedSource[], aggregateData: SearchConsoleV7Data, now: string) {
  const sources = mergeTypedSources(getTypedSourcesFromCache(kind), incoming);
  const imports = sources.map((item) => item.meta);
  return JSON.stringify({
    version: 2,
    source: 'search-console',
    type: kind,
    sources,
    imports,
    data: aggregateData,
    lastUpdated: now,
  } satisfies SearchConsoleTypedStore);
}

function mergeBy<T extends { clicks: number; impressions: number; ctr: number; position: number }>(rows: T[], keyFn: (row: T) => string) {
  const map = new Map<string, T & { count: number }>();
  rows.forEach((row) => {
    const key = keyFn(row);
    if (!key) return;
    const current = map.get(key);
    if (!current) {
      map.set(key, { ...row, count: 1 });
      return;
    }
    const impressions = current.impressions + row.impressions;
    const weightedPosition = impressions ? ((current.position * current.impressions) + (row.position * row.impressions)) / impressions : (current.position + row.position) / 2;
    current.clicks += row.clicks;
    current.impressions = impressions;
    current.ctr = current.impressions ? Number(((current.clicks / current.impressions) * 100).toFixed(2)) : 0;
    current.position = Number(weightedPosition.toFixed(1));
    current.count += 1;
  });
  return Array.from(map.values()).sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
}

function pageType(page: string) {
  const value = normalize(page);
  if (value.includes('/san-pham/')) return 'product';
  if (value.includes('/tin-tuc/')) return 'blog';
  if (/\/(tu-|ghe-|ban-|giuong|sofa|truong-hoc|gia-dinh)/.test(value)) return 'category';
  return 'other';
}

function businessPriority(text: string): 1 | 2 | 3 {
  const value = normalize(text);
  if (/(giuong sat|giuong tang|giuong)/.test(value)) return 1;
  if (/(ban lam viec|ban van phong|ban nhan vien|ban chan sat|ban hoc sinh|ban ghe hoc sinh|truong hoc|bang tu)/.test(value)) return 1;
  if (/(ghe chan quy|ghe giam doc|tu locker|locker|tu van phong)/.test(value)) return 2;
  return 3;
}

function clusterFromText(text: string) {
  const value = normalize(text);
  if (value.includes('giuong')) return 'Giường sắt';
  if (value.includes('ban hoc') || value.includes('truong hoc') || value.includes('bang tu')) return 'Trường học';
  if (value.includes('ban')) return 'Bàn làm việc';
  if (value.includes('ghe')) return 'Ghế văn phòng';
  if (value.includes('tu') || value.includes('locker')) return 'Tủ văn phòng';
  return undefined;
}

function actionFor(row: SearchConsoleQuery | SearchConsolePage, reason: string) {
  if (reason.includes('11-20')) return 'Bổ sung FAQ, thêm liên kết nội bộ và giữ slug ổn định để đẩy vào top 10.';
  if (reason.includes('21-40')) return 'Viết bài phụ hoặc cập nhật nội dung chi tiết, ảnh thực tế và liên kết về trang đích.';
  if (reason.includes('CTR')) return 'Tối ưu title/meta để rõ giá trị mua hàng, không đổi URL nếu trang mới index.';
  if ('page' in row && row.page) return 'Kiểm tra nội dung trang, thêm liên kết nội bộ và CTA phù hợp.';
  return 'Theo dõi thêm nếu dữ liệu còn ít, ưu tiên hàng chủ đạo trước.';
}

function buildOpportunities(queries: SearchConsoleQuery[], pages: SearchConsolePage[], keywords: SeoKeyword[]): SearchConsoleOpportunity[] {
  const knownKeywords = new Set(keywords.map((item) => normalize(item.keyword)).filter(Boolean));
  const opportunities: SearchConsoleOpportunity[] = [];
  const add = (item: SearchConsoleQuery | SearchConsolePage, reason: string) => {
    const query = 'query' in item ? item.query : item.page;
    const page = 'page' in item ? item.page : undefined;
    const text = query + ' ' + (page || '');
    opportunities.push({
      id: 'import-op-' + normalize(reason + '-' + text),
      query,
      page,
      clicks: item.clicks,
      impressions: item.impressions,
      ctr: item.ctr,
      position: item.position,
      priority: businessPriority(text),
      reason,
      action: actionFor(item, reason),
      cluster: clusterFromText(text),
    });
  };

  queries.forEach((row) => {
    if (row.position >= 11 && row.position <= 20) add(row, 'Từ khóa đang ở vị trí 11-20, gần top 10.');
    else if (row.position > 20 && row.position <= 40) add(row, 'Từ khóa đang ở vị trí 21-40, cần thêm nội dung hỗ trợ.');
    if (row.impressions >= 100 && row.ctr < 2) add(row, 'Lượt hiển thị cao nhưng CTR thấp.');
    if (row.query && !knownKeywords.has(normalize(row.query))) add(row, 'Từ khóa mới chưa có trong seo_keywords.');
  });

  pages.forEach((row) => {
    if (row.impressions >= 100 && row.clicks <= 3) add(row, 'Trang có lượt hiển thị cao nhưng ít nhấp.');
  });

  return Array.from(new Map(opportunities.map((item) => [item.id, item])).values())
    .sort((a, b) => a.priority - b.priority || b.impressions - a.impressions || a.position - b.position)
    .slice(0, 50);
}

function detectImportKindFromRows(rows: ImportRow[]): SearchConsoleImportKind {
  const hasQueries = rows.some((row) => row.query);
  const hasPages = rows.some((row) => row.page);
  if (hasQueries && hasPages) return 'query-page';
  if (hasQueries) return 'queries';
  if (hasPages) return 'pages';
  if (rows.some((row) => row.date)) return 'dates';
  if (rows.some((row) => row.device)) return 'devices';
  if (rows.some((row) => row.country)) return 'countries';
  if (rows.some((row) => row.searchAppearance)) return 'search-appearance';
  return 'query-page';
}

function analyzeImport(text: string, keywords: SeoKeyword[], dateRangeLabel: string, fileName = '', zipFileName?: string): SearchConsoleV7Data | null {
  const rows = parseImportText(text);
  if (!rows.length) return null;
  const columns = getImportColumns(text);
  const kind = detectImportKindFromRows(rows);
  const meta = buildImportMeta(kind, rows, columns, fileName, dateRangeLabel, zipFileName);

  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const positionBase = rows.filter((row) => row.position > 0);
  const position = positionBase.length ? positionBase.reduce((sum, row) => sum + row.position, 0) / positionBase.length : 0;

  const queries = mergeBy(rows.filter((row) => row.query).map((row) => ({
    query: row.query || '',
    page: row.page || '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr || (row.impressions ? Number(((row.clicks / row.impressions) * 100).toFixed(2)) : 0),
    position: row.position,
  })), (row) => row.query + '|' + (row.page || '')).slice(0, 100);

  const pages = mergeBy(rows.filter((row) => row.page).map((row) => ({
    page: row.page || '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr || (row.impressions ? Number(((row.clicks / row.impressions) * 100).toFixed(2)) : 0),
    position: row.position,
  })), (row) => row.page).slice(0, 100).map((row) => ({ ...row, pageType: pageType(row.page) }));

  const devices = mergeBy(rows.filter((row) => row.device).map((row) => ({
    device: row.device || '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  })), (row) => row.device) as SearchConsoleDevice[];

  const countries = mergeBy(rows.filter((row) => row.country).map((row) => ({
    country: row.country || '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  })), (row) => row.country) as SearchConsoleCountry[];

  const trend = mergeBy(rows.filter((row) => row.date).map((row) => ({
    date: row.date || '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  })), (row) => row.date).sort((a, b) => a.date.localeCompare(b.date)) as SearchConsoleDatePoint[];

  const searchAppearances = mergeBy(rows.filter((row) => row.searchAppearance).map((row) => ({
    searchAppearance: row.searchAppearance || '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  })), (row) => row.searchAppearance) as SearchConsoleSearchAppearance[];

  return {
    source: 'import',
    selectedType: 'overview',
    overview: {
      connected: true,
      reason: 'manual_import',
      message: 'Đang dùng dữ liệu Search Console nhập thủ công.',
      siteUrl: 'https://www.noithathungngoc.com/',
      range: meta.dateRangeLabel,
      clicks,
      impressions,
      ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
      position: Number(position.toFixed(1)),
      lastUpdated: meta.updatedAt,
    },
    imports: [meta],
    queries,
    pages,
    devices,
    countries,
    trend,
    searchAppearances,
    opportunities: buildOpportunities(queries, pages, keywords),
  };
}

function keywordMatchRows(data: SearchConsoleV7Data | null, keywords: SeoKeyword[]) {
  if (!data) return { matched: [], fresh: [] };
  const keywordSet = new Set(keywords.map((item) => normalize(item.keyword)).filter(Boolean));
  const matched = data.queries.filter((row) => keywordSet.has(normalize(row.query))).slice(0, 12);
  const fresh = data.queries.filter((row) => row.query && !keywordSet.has(normalize(row.query))).slice(0, 12);
  return { matched, fresh };
}

function clusterSignal(data: SearchConsoleV7Data | null, clusters: SeoCluster[]) {
  if (!data) return [];
  const queryRows = data.queries.map((row) => ({
    text: row.query + ' ' + (row.page || ''),
    clicks: row.clicks,
    impressions: row.impressions,
    position: row.position,
  }));
  const pageRows = data.pages.map((row) => ({
    text: row.page,
    clicks: row.clicks,
    impressions: row.impressions,
    position: row.position,
  }));
  const sourceRows = [...queryRows, ...pageRows];

  return clusters.slice(0, 8).map((cluster) => {
    const token = normalize(cluster.name + ' ' + (cluster.main_url || ''));
    const matched = sourceRows.filter((row) => normalize(row.text).includes(token));
    const impressions = matched.reduce((sum, row) => sum + row.impressions, 0);
    const clicks = matched.reduce((sum, row) => sum + row.clicks, 0);
    const position = matched.length ? matched.reduce((sum, row) => sum + row.position, 0) / matched.length : 0;
    return {
      cluster: cluster.name,
      impressions,
      clicks,
      position,
      action: impressions > 150 && position > 10
        ? 'Tối ưu landing page và thêm liên kết nội bộ cho cụm này.'
        : impressions > 0
          ? 'Theo dõi thêm tín hiệu từ từ khóa và trang đã nhập.'
          : 'Chưa có tín hiệu Search Console nhập thủ công cho cụm này.',
    };
  }).filter((item) => item.impressions > 0);
}

function detectImportKind(data: SearchConsoleV7Data): SearchConsoleImportKind {
  const fromMeta = latestImport(data.imports)?.type;
  if (fromMeta) return fromMeta;
  const hasQueries = data.queries.length > 0;
  const hasPages = data.pages.length > 0;
  if (hasQueries && hasPages) return 'query-page';
  if (hasQueries) return 'queries';
  if (hasPages) return 'pages';
  if (data.devices.length > 0) return 'devices';
  if (data.countries.length > 0) return 'countries';
  if (data.trend.length > 0) return 'dates';
  if ((data.searchAppearances || []).length > 0) return 'search-appearance';
  return 'query-page';
}

function buildMergedOverview(
  rows: Array<{ clicks: number; impressions: number; ctr: number; position: number }>,
  previous?: SearchConsoleV7Data | null,
  incoming?: SearchConsoleV7Data | null,
  imports?: SearchConsoleImportMeta[],
) {
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const positionWeight = rows.reduce((sum, row) => sum + row.position * Math.max(row.impressions, 1), 0);
  const positionBase = rows.reduce((sum, row) => sum + Math.max(row.impressions, 1), 0);
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : rows.length ? rows.reduce((sum, row) => sum + row.ctr, 0) / rows.length : 0;
  const position = positionBase > 0 ? positionWeight / positionBase : 0;
  const latest = latestImport(imports);

  return {
    ...(previous?.overview || incoming?.overview || {}),
    connected: true,
    reason: 'manual_import',
    message: 'Đang dùng dữ liệu Search Console nhập thủ công. URL tao tu website khong dòng nghia voi URL Google da index.',
    siteUrl: 'https://www.noithathungngoc.com/',
    range: latest?.dateRangeLabel || incoming?.overview.range || previous?.overview.range || 'Chua xac dinh',
    clicks,
    impressions,
    ctr,
    position,
    lastUpdated: latest?.updatedAt || incoming?.overview.lastUpdated || previous?.overview.lastUpdated || new Date().toISOString(),
  } as SearchConsoleV7Data['overview'];
}

function mergeSearchConsoleData(previous: SearchConsoleV7Data | null, incoming: SearchConsoleV7Data, keywords: SeoKeyword[]): SearchConsoleV7Data {
  const incomingKind = detectImportKind(incoming);
  const replaceQueries = incomingKind === 'queries' || incomingKind === 'query-page';
  const replacePages = incomingKind === 'pages' || incomingKind === 'query-page';

  const queries = replaceQueries ? incoming.queries : previous?.queries || [];
  const pages = replacePages ? incoming.pages : previous?.pages || [];
  const devices = incomingKind === 'devices' ? incoming.devices : previous?.devices || [];
  const countries = incomingKind === 'countries' ? incoming.countries : previous?.countries || [];
  const trend = incomingKind === 'dates' ? incoming.trend : previous?.trend || [];
  const searchAppearances = incomingKind === 'search-appearance' ? incoming.searchAppearances || [] : previous?.searchAppearances || [];
  const imports = mergeImportMeta(previous?.imports, incoming.imports);
  const overviewRows = pages.length > 0
    ? pages
    : queries.length > 0
      ? queries
      : incoming.devices.length > 0
        ? incoming.devices
        : incoming.countries.length > 0
          ? incoming.countries
          : incoming.trend.length > 0
            ? incoming.trend
            : incoming.searchAppearances || [];

  return {
    source: 'import',
    selectedType: 'overview',
    overview: buildMergedOverview(overviewRows, previous, incoming, imports),
    imports,
    queries,
    pages,
    devices,
    countries,
    trend,
    searchAppearances,
    opportunities: buildOpportunities(queries, pages, keywords),
  };
}

function normalizeStoredSearchConsole(parsed: SearchConsoleImportStore): SearchConsoleImportStore {
  const normalizeKindMap = <T,>(value: Partial<Record<SearchConsoleImportKind, T>> | Record<string, T> | undefined, fallback?: T) => {
    const next: Partial<Record<SearchConsoleImportKind, T>> = {};
    Object.entries(value || {}).forEach(([key, item]) => {
      const kind = key === 'combined' ? 'query-page' : key;
      if (kind in SEARCH_CONSOLE_STORE_KEYS) next[kind as SearchConsoleImportKind] = item;
    });
    if (fallback != null && !Object.keys(next).length) next['query-page'] = fallback;
    return next;
  };
  const imports = parsed.data?.imports || parsed.imports || [];
  const data = parsed.data ? {
    ...parsed.data,
    imports,
    searchAppearances: parsed.data.searchAppearances || [],
  } : parsed.data;
  return {
    ...parsed,
    data,
    imports,
    rawTextByType: normalizeKindMap(parsed.rawTextByType as Record<string, string> | undefined, parsed.rawText),
    fileNames: normalizeKindMap(parsed.fileNames as Record<string, string> | undefined, parsed.fileName),
    rowCounts: normalizeKindMap(parsed.rowCounts as Record<string, number> | undefined, parsed.rowCount),
  };
}

function updateImportStore(
  current: {
    rawTextByType: Partial<Record<SearchConsoleImportKind, string>>;
    fileNames: Partial<Record<SearchConsoleImportKind, string>>;
    rowCounts: Partial<Record<SearchConsoleImportKind, number>>;
  },
  kind: SearchConsoleImportKind,
  rawText: string,
  fileName: string,
  rowCount: number
) {
  return {
    rawTextByType: { ...current.rawTextByType, [kind]: rawText },
    fileNames: { ...current.fileNames, [kind]: fileName },
    rowCounts: { ...current.rowCounts, [kind]: rowCount },
  };
}

function SearchConsoleV7Center({ keywords, clusters, onData, compact = false, externalData, onOpenDetails }: Props) {
  const [activeTab, setActiveTab] = useState<SearchConsoleRequestType>('overview');
  const [rawText, setRawText] = useState('');
  const [data, setData] = useState<SearchConsoleV7Data | null>(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [rowCount, setRowCount] = useState(0);
  const [rawTextByType, setRawTextByType] = useState<Partial<Record<SearchConsoleImportKind, string>>>({});
  const [fileNames, setFileNames] = useState<Partial<Record<SearchConsoleImportKind, string>>>({});
  const [rowCounts, setRowCounts] = useState<Partial<Record<SearchConsoleImportKind, number>>>({});
  const [dateRangeLabel, setDateRangeLabel] = useState('Chua xac dinh');
  const [processing, setProcessing] = useState(false);
  const [batchSummary, setBatchSummary] = useState<SearchConsoleBatchSummary | null>(null);
  const [manualSummary, setManualSummary] = useState<GscManualSummary | null>(null);
  const [manualDraft, setManualDraft] = useState<GscManualSummaryDraft>(() => defaultManualDraft());
  const [apiStatus, setApiStatus] = useState<GscApiStatus | null>(null);
  const [apiRange, setApiRange] = useState('3m');
  const [apiSyncing, setApiSyncing] = useState(false);
  const [apiMessage, setApiMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/search-console/status', { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then((response) => response.json())
      .then((body) => {
        if (body?.ok) setApiStatus({ connected: Boolean(body.connected), siteUrl: body.siteUrl || '', latestQueryPageSync: body.latestQueryPageSync || null });
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    try {
      const savedManual = localStorage.getItem(GSC_MANUAL_SUMMARY_KEY);
      if (savedManual) {
        const parsedManual = JSON.parse(savedManual) as GscManualSummary;
        setManualSummary(parsedManual);
        setManualDraft(manualSummaryToDraft(parsedManual));
      }
    } catch {
      localStorage.removeItem(GSC_MANUAL_SUMMARY_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!saved) return;
      const parsed = normalizeStoredSearchConsole(JSON.parse(saved) as SearchConsoleImportStore);
      const latestRawText = parsed.rawText || Object.values(parsed.rawTextByType || {})[0] || '';
      const latestFileName = parsed.fileName || Object.values(parsed.fileNames || {})[0] || '';
      const latestRowCount = typeof parsed.rowCount === 'number'
        ? parsed.rowCount
        : Number(Object.values(parsed.rowCounts || {})[0] || parseImportText(latestRawText).length);
      const latestMeta = latestImport(parsed.data?.imports || parsed.imports);

      setRawText(latestRawText);
      setData(parsed.data || null);
      setFileName(latestFileName);
      setRowCount(latestRowCount);
      setRawTextByType(parsed.rawTextByType || {});
      setFileNames(parsed.fileNames || {});
      setRowCounts(parsed.rowCounts || {});
      setDateRangeLabel(latestMeta?.dateRangeLabel || 'Chua xac dinh');
      onData?.(parsed.data || null);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [onData]);

  useEffect(() => {
    if (!externalData) return;
    setData(externalData);
    const latestMeta = latestImport(externalData.imports);
    setDateRangeLabel(latestMeta?.dateRangeLabel || 'Chua xac dinh');
  }, [externalData]);

  const keywordRows = useMemo(() => keywordMatchRows(data, keywords), [data, keywords]);
  const clusterRows = useMemo(() => clusterSignal(data, clusters), [data, clusters]);
  const uniqueQueries = useMemo(() => new Set(data?.queries.map((row) => normalize(row.query)).filter(Boolean)).size, [data]);
  const uniquePages = useMemo(() => new Set(data?.pages.map((row) => normalize(row.page)).filter(Boolean)).size, [data]);
  const availableRanges = useMemo(() => Array.from(new Set((data?.imports || []).map((item) => item.dateRangeLabel).filter(Boolean))), [data]);
  const latestImports = useMemo(() => (data?.imports || []).slice(0, 8), [data]);
  const importSummaryText = data
    ? 'Queries: ' + uniqueQueries
      + ' - URLs: ' + uniquePages
      + ' - Devices: ' + (data.devices?.length || 0)
      + ' - Countries: ' + (data.countries?.length || 0)
      + ' - Dates: ' + (data.trend?.length || 0)
      + ' - Appearance: ' + (data.searchAppearances?.length || 0)
      + (availableRanges.length ? ' - Ranges: ' + availableRanges.join(', ') : '')
    : '';
  const csvSummary = useMemo(() => buildCsvSummary(data), [data]);
  const manualDiff = useMemo(() => {
    if (!manualSummary) return null;
    return {
      clicks: (manualSummary.clicks ?? 0) - csvSummary.clicks,
      impressions: (manualSummary.impressions ?? 0) - csvSummary.impressions,
      ctr: (manualSummary.ctr ?? 0) - csvSummary.ctr,
      position: (manualSummary.position ?? 0) - csvSummary.position,
    };
  }, [manualSummary, csvSummary]);

  const updateManualDraft = (field: keyof GscManualSummaryDraft, value: string) => {
    setManualDraft((current) => ({ ...current, [field]: value }));
  };

  const saveManualSummary = () => {
    const summary: GscManualSummary = {
      range: manualDraft.range.trim() || 'Chưa xác định',
      clicks: parseManualInteger(manualDraft.clicks),
      impressions: parseManualInteger(manualDraft.impressions),
      ctr: parseManualDecimal(manualDraft.ctr),
      position: parseManualDecimal(manualDraft.position),
      checkedAt: manualDraft.checkedAt || todayDateInput(),
      note: manualDraft.note.trim(),
      updatedAt: new Date().toISOString(),
    };
    setManualSummary(summary);
    setManualDraft(manualSummaryToDraft(summary));
    localStorage.setItem(GSC_MANUAL_SUMMARY_KEY, JSON.stringify(summary));
    saveOneSeoKeyToSupabase(GSC_MANUAL_SUMMARY_KEY).catch(() => null);
  };

  const clearManualSummary = () => {
    setManualSummary(null);
    setManualDraft(defaultManualDraft());
    localStorage.removeItem(GSC_MANUAL_SUMMARY_KEY);
  };

  const connectSearchConsoleApi = async () => {
    setApiMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/search-console/auth-url', { headers: { Accept: 'application/json' }, cache: 'no-store' });
      const body = await response.json().catch(() => ({})) as { url?: string; message?: string; detail?: string };
      if (!response.ok || !body.url) throw new Error(body.detail || body.message || 'Không tạo được OAuth URL.');
      window.location.href = body.url;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Không kết nối được Search Console API.');
    }
  };

  const applyApiQueryPageData = (result: GscApiSyncResponse) => {
    const nextData = result.data;
    const latestMeta = latestImport(nextData.imports);
    const now = result.updatedAt || new Date().toISOString();
    setData(nextData);
    setRawText('');
    setFileName('Google Search Console API');
    setRowCount(result.rowCount);
    setDateRangeLabel(latestMeta?.dateRangeLabel || result.dateRangeLabel);
    setRawTextByType((current) => ({ ...current, 'query-page': '' }));
    setFileNames((current) => ({ ...current, 'query-page': 'Google Search Console API' }));
    setRowCounts((current) => ({ ...current, 'query-page': result.rowCount }));
    setApiStatus({ connected: true, siteUrl: result.siteUrl, latestQueryPageSync: { updatedAt: now, dateRangeLabel: result.dateRangeLabel, startDate: result.startDate, endDate: result.endDate, rowCount: result.rowCount, source: 'api' } });
    onData?.(nextData);

    const aggregateRaw = JSON.stringify({
      version: 2,
      rawText: '',
      data: nextData,
      fileName: 'Google Search Console API',
      rowCount: result.rowCount,
      rawTextByType: { ...rawTextByType, 'query-page': '' },
      fileNames: { ...fileNames, 'query-page': 'Google Search Console API' },
      rowCounts: { ...rowCounts, 'query-page': result.rowCount },
      imports: nextData.imports || [],
      lastUpdated: now,
    } satisfies SearchConsoleImportStore);
    try {
      localStorage.setItem(STORAGE_KEY, aggregateRaw);
    } catch {
      setApiMessage('Đã lưu Supabase store; cache trình duyệt không lưu đủ vì dữ liệu Query+Page lớn.');
    }
  };

  const syncQueryPageFromApi = async (force = false) => {
    setApiSyncing(true);
    setApiMessage('Đang đồng bộ Query+Page từ API...');
    setError('');
    try {
      const response = await fetch('/api/admin/search-console/query-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ range: apiRange, force }),
      });
      const body = await response.json().catch(() => ({})) as Partial<GscApiSyncResponse> & { message?: string; detail?: string };
      if (!response.ok || !body.data) throw new Error(body.detail || body.message || 'Không đồng bộ được Query+Page từ API.');
      applyApiQueryPageData(body as GscApiSyncResponse);
      setApiMessage(body.message || 'Đã đồng bộ Query+Page từ API.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Không đồng bộ được Query+Page từ API.');
      setApiMessage('Lỗi đồng bộ API.');
    } finally {
      setApiSyncing(false);
    }
  };

  const parseTextImport = (text: string, nextFileName: string, zipFileName?: string): ParsedSearchConsoleImport | null => {
    const result = analyzeImport(text, keywords, dateRangeLabel, nextFileName, zipFileName);
    if (!result) return null;
    const meta = latestImport(result.imports);
    if (!meta) return null;
    return {
      rawText: text,
      data: result,
      fileName: nextFileName,
      zipFileName,
      rowCount: meta.rowCount,
      kind: meta.type,
      meta,
    };
  };

  const saveParsedImports = (imports: ParsedSearchConsoleImport[], statuses: SearchConsoleImportStatus[], zipFileName?: string) => {
    if (!imports.length) {
      setBatchSummary({
        zipFileName,
        totalFiles: statuses.length,
        parsedFiles: 0,
        skippedFiles: statuses.length,
        totalRows: 0,
        statuses,
      });
      return;
    }

    let nextData = data;
    let nextStore = { rawTextByType, fileNames, rowCounts };
    imports.forEach((item) => {
      nextData = mergeSearchConsoleData(nextData, item.data, keywords);
      nextStore = updateImportStore(nextStore, item.kind, item.rawText, item.fileName, item.rowCount);
    });
    if (!nextData) return;

    const lastImport = imports[imports.length - 1];
    const now = new Date().toISOString();
    setData(nextData);
    setRawText(lastImport.rawText);
    setFileName(lastImport.zipFileName || lastImport.fileName);
    setRowCount(imports.reduce((sum, item) => sum + item.rowCount, 0));
    setRawTextByType(nextStore.rawTextByType);
    setFileNames(nextStore.fileNames);
    setRowCounts(nextStore.rowCounts);
    onData?.(nextData);

    const aggregateRaw = JSON.stringify({
      version: 2,
      rawText: lastImport.rawText,
      data: nextData,
      fileName: lastImport.zipFileName || lastImport.fileName,
      rowCount: imports.reduce((sum, item) => sum + item.rowCount, 0),
      rawTextByType: nextStore.rawTextByType,
      fileNames: nextStore.fileNames,
      rowCounts: nextStore.rowCounts,
      imports: nextData.imports || [],
      lastUpdated: now,
    } satisfies SearchConsoleImportStore);

    const aggregateCached = cacheSeoStoreValue(STORAGE_KEY, aggregateRaw);
    let cacheOk = aggregateCached;
    const storeItems = [buildStoreItem(STORAGE_KEY, aggregateRaw, now)];
    const importsByKind = imports.reduce((map, item) => {
      const rows = map.get(item.kind) || [];
      rows.push({ meta: item.meta, rawText: item.rawText, data: item.data });
      map.set(item.kind, rows);
      return map;
    }, new Map<SearchConsoleImportKind, SearchConsoleTypedSource[]>());

    importsByKind.forEach((sources, kind) => {
      const typedRaw = buildTypedStoreRaw(kind, sources, nextData as SearchConsoleV7Data, now);
      cacheOk = cacheSeoStoreValue(SEARCH_CONSOLE_STORE_KEYS[kind], typedRaw) && cacheOk;
      storeItems.push(buildStoreItem(SEARCH_CONSOLE_STORE_KEYS[kind], typedRaw, now));
    });

    if (!cacheOk) setError('Dữ liệu lớn đã được gửi lên Supabase store; cache trình duyệt có thể không lưu đủ do giới hạn localStorage.');
    saveSeoDashboardToSupabase(storeItems).catch(() => null);
    setBatchSummary({
      zipFileName,
      totalFiles: statuses.length,
      parsedFiles: imports.length,
      skippedFiles: statuses.filter((item) => item.status !== 'success').length,
      totalRows: imports.reduce((sum, item) => sum + item.rowCount, 0),
      statuses,
    });
  };

  const analyze = () => {
    const nextFileName = fileName || 'du-lieu-dan-thu-cong.csv';
    const parsed = parseTextImport(rawText, nextFileName);
    if (!parsed) {
      setError('Chưa đọc được dữ liệu. Hãy dán CSV hoặc dữ liệu dạng tab từ Google Search Console.');
      return;
    }
    setError('');
    saveParsedImports([parsed], [{
      fileName: nextFileName,
      status: 'success',
      type: parsed.kind,
      rowCount: parsed.rowCount,
      message: 'Parsed CSV/TSV thành công.',
    }]);
  };

  const clearImport = () => {
    setRawText('');
    setError('');
    setFileName('');
    setRowCount(0);
  };

  const readZipFile = async (file: File) => {
    if (file.size > MAX_GSC_ZIP_BYTES) {
      return {
        imports: [] as ParsedSearchConsoleImport[],
        statuses: [{ fileName: file.name, zipFileName: file.name, status: 'skipped' as const, message: 'ZIP vượt giới hạn an toàn.' }],
      };
    }

    const zip = await JSZip.loadAsync(file);
    const entries = Object.values(zip.files).filter((entry) => !entry.dir);
    const imports: ParsedSearchConsoleImport[] = [];
    const statuses: SearchConsoleImportStatus[] = [];
    let textFileCount = 0;

    for (const entry of entries) {
      if (isJunkZipEntry(entry.name)) {
        statuses.push({ fileName: entry.name, zipFileName: file.name, status: 'skipped', message: 'Bỏ qua file không phải CSV/TSV hoặc file hệ thống.' });
        continue;
      }
      textFileCount += 1;
      if (textFileCount > MAX_GSC_ZIP_TEXT_FILES) {
        statuses.push({ fileName: entry.name, zipFileName: file.name, status: 'skipped', message: 'Bỏ qua vì ZIP có quá nhiều file CSV/TSV.' });
        continue;
      }
      const entrySize = Number((entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0);
      if (entrySize > MAX_GSC_TEXT_FILE_BYTES) {
        statuses.push({ fileName: entry.name, zipFileName: file.name, status: 'skipped', message: 'File trong ZIP vượt giới hạn an toàn.' });
        continue;
      }
      try {
        const text = await entry.async('string');
        if (text.length > MAX_GSC_TEXT_FILE_BYTES) {
          statuses.push({ fileName: entry.name, zipFileName: file.name, status: 'skipped', message: 'File trong ZIP quá lớn sau khi giải nén.' });
          continue;
        }
        const parsed = parseTextImport(text, entry.name, file.name);
        if (!parsed) {
          statuses.push({ fileName: entry.name, zipFileName: file.name, status: 'skipped', message: 'Không nhận diện được header Search Console.' });
          continue;
        }
        imports.push(parsed);
        statuses.push({ fileName: entry.name, zipFileName: file.name, status: 'success', type: parsed.kind, rowCount: parsed.rowCount, message: 'Parsed CSV/TSV trong ZIP thành công.' });
      } catch {
        statuses.push({ fileName: entry.name, zipFileName: file.name, status: 'error', message: 'Không đọc được file trong ZIP.' });
      }
    }

    return { imports, statuses };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    setProcessing(true);
    setError('');
    try {
      const parsedImports: ParsedSearchConsoleImport[] = [];
      const statuses: SearchConsoleImportStatus[] = [];
      let latestZipFileName: string | undefined;

      for (const file of files) {
        if (isZipFile(file)) {
          latestZipFileName = file.name;
          const zipResult = await readZipFile(file);
          parsedImports.push(...zipResult.imports);
          statuses.push(...zipResult.statuses);
          continue;
        }
        if (!isSearchConsoleTextFile(file.name)) {
          statuses.push({ fileName: file.name, status: 'skipped', message: 'Bỏ qua vì không phải CSV/TSV/ZIP.' });
          continue;
        }
        try {
          const text = await readTextFile(file);
          const parsed = parseTextImport(text, file.name);
          if (!parsed) {
            statuses.push({ fileName: file.name, status: 'skipped', message: 'Không nhận diện được header Search Console.' });
            continue;
          }
          parsedImports.push(parsed);
          statuses.push({ fileName: file.name, status: 'success', type: parsed.kind, rowCount: parsed.rowCount, message: 'Parsed CSV/TSV thành công.' });
        } catch (error) {
          statuses.push({ fileName: file.name, status: 'error', message: error instanceof Error ? error.message : 'Không đọc được file.' });
        }
      }

      if (!parsedImports.length) {
        setBatchSummary({
          zipFileName: latestZipFileName,
          totalFiles: statuses.length,
          parsedFiles: 0,
          skippedFiles: statuses.length,
          totalRows: 0,
          statuses,
        });
        setError('Chưa có file Search Console hợp lệ để lưu.');
        return;
      }
      saveParsedImports(parsedImports, statuses, latestZipFileName);
    } catch {
      setError('Không đọc được file import. Hãy dùng CSV/TSV Search Console hoặc ZIP chứa các file CSV/TSV.');
    } finally {
      setProcessing(false);
    }
  };

  const gscTypeStatus: Array<{ type: SearchConsoleImportKind; label: string; present: boolean }> = [
    { type: 'queries', label: 'Queries', present: Boolean(data?.queries.length || data?.imports?.some((item) => item.type === 'queries')) },
    { type: 'pages', label: 'Pages', present: Boolean(data?.pages.length || data?.imports?.some((item) => item.type === 'pages')) },
    { type: 'query-page', label: 'Query+Page', present: Boolean(data?.imports?.some((item) => item.type === 'query-page') || data?.queries.some((item) => item.page)) },
    { type: 'dates', label: 'Dates', present: Boolean(data?.trend.length || data?.imports?.some((item) => item.type === 'dates')) },
    { type: 'devices', label: 'Devices', present: Boolean(data?.devices.length || data?.imports?.some((item) => item.type === 'devices')) },
    { type: 'countries', label: 'Countries', present: Boolean(data?.countries.length || data?.imports?.some((item) => item.type === 'countries')) },
  ];
  const totalSavedRows = (data?.imports || []).reduce((sum, item) => sum + Number(item.rowCount || 0), 0);
  const missingImportantGsc = [
    !gscTypeStatus.find((item) => item.type === 'query-page')?.present ? 'Nên import thêm Query+Page 3-6 tháng để AI chống trùng URL chính xác hơn.' : '',
    !gscTypeStatus.find((item) => item.type === 'pages')?.present ? 'Nên import Pages 3 tháng để AI biết URL nào có impression.' : '',
  ].filter(Boolean);

  if (compact) {
    return (
      <ModuleCard
        title="Nhập Google Search Console"
        description="Hỗ trợ Queries, Pages, Query+Page, Dates, Devices, Countries, ZIP nhiều file."
        action={<Badge status={data ? 'connected' : 'pending'}>{data ? 'Đã có dữ liệu GSC' : 'Chưa có dữ liệu GSC'}</Badge>}
      >
        <div className={styles.importCompactCard}>
          <div className={styles.fileImportRow}>
            <label className={styles.fileImportButton}>
              Import Search Console
              <input type="file" multiple accept=".csv,.tsv,.zip" onChange={handleFileUpload} />
            </label>
            <button className={styles.secondaryButton} type="button" onClick={onOpenDetails}>Xem chi tiết trong Phân tích nâng cao</button>
          </div>
          <div className={styles.fileImportRow}>
            <select value={apiRange} onChange={(event) => setApiRange(event.target.value)} disabled={apiSyncing}>
              {apiDateRangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button className={styles.secondaryButton} type="button" onClick={connectSearchConsoleApi} disabled={apiSyncing}>{apiStatus?.connected ? 'Đã kết nối Search Console' : 'Kết nối Search Console'}</button>
            <button className={styles.primaryButton} type="button" onClick={() => syncQueryPageFromApi(false)} disabled={apiSyncing || !apiStatus?.connected}>{apiSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Query+Page từ API'}</button>
            <button className={styles.secondaryButton} type="button" onClick={() => syncQueryPageFromApi(true)} disabled={apiSyncing || !apiStatus?.connected}>Lấy lại dữ liệu</button>
          </div>
          <p className={styles.fileImportMeta}>Chọn 1 CSV/TSV, nhiều CSV/TSV hoặc 1 ZIP. Dashboard chỉ parse khi bạn chọn file import.</p>
          <div className={styles.scV7Status}>
            API: {apiStatus?.connected ? 'Đã kết nối Search Console' : 'Chưa kết nối Search Console'}{apiStatus?.siteUrl ? ' - ' + apiStatus.siteUrl : ''}{apiStatus?.latestQueryPageSync ? ' - Query+Page API: ' + formatNumber(apiStatus.latestQueryPageSync.rowCount) + ' dòng, ' + new Date(apiStatus.latestQueryPageSync.updatedAt).toLocaleString('vi-VN') : ''}
          </div>
          {apiMessage ? <div className={styles.scV7Status}>{apiMessage}</div> : null}
          <div className={styles.scV7Status}>
            API: {apiStatus?.connected ? 'Đã kết nối Search Console' : 'Chưa kết nối Search Console'}{apiStatus?.siteUrl ? ' - ' + apiStatus.siteUrl : ''}{apiStatus?.latestQueryPageSync ? ' - Query+Page API: ' + formatNumber(apiStatus.latestQueryPageSync.rowCount) + ' dòng, ' + new Date(apiStatus.latestQueryPageSync.updatedAt).toLocaleString('vi-VN') : ''}
          </div>
          {apiMessage ? <div className={styles.scV7Status}>{apiMessage}</div> : null}
          <div className={styles.importCompactTypes}>
            {gscTypeStatus.map((item) => (
              <span key={'gsc-compact-' + item.type} className={item.present ? styles.importTypeOk : styles.importTypeMissing}>
                {item.label}: {item.present ? 'đã có' : 'chưa có'}
              </span>
            ))}
          </div>
          <div className={styles.metricGridSmall}>
            <MetricCard label="Tổng query" value={formatNumber(uniqueQueries)} />
            <MetricCard label="Tổng page" value={formatNumber(uniquePages)} />
            <MetricCard label="Tổng dòng đã lưu" value={totalSavedRows ? formatNumber(totalSavedRows) : 'Chưa có dữ liệu'} />
            <MetricCard label="Cập nhật mới nhất" value={data?.overview.lastUpdated ? new Date(data.overview.lastUpdated).toLocaleDateString('vi-VN') : 'Chưa có dữ liệu'} hint={data?.overview.lastUpdated ? new Date(data.overview.lastUpdated).toLocaleTimeString('vi-VN') : 'Chưa có dữ liệu'} />
          </div>
          <div className={styles.scV7Status}>
            {processing ? 'Đang xử lý file Search Console...' : data?.overview.lastUpdated ? 'Cập nhật mới nhất: ' + new Date(data.overview.lastUpdated).toLocaleString('vi-VN') : 'Chưa có dữ liệu Search Console.'}
          </div>
          {batchSummary ? (
            <div className={styles.scImportBatchStats}>
              <span>{formatNumber(batchSummary.totalFiles)} file đã đọc</span>
              <span>{formatNumber(batchSummary.parsedFiles)} parse thành công</span>
              <span>{formatNumber(batchSummary.skippedFiles)} bỏ qua/lỗi</span>
              <span>{formatNumber(batchSummary.totalRows)} dòng đã lưu</span>
            </div>
          ) : null}
          {missingImportantGsc.length ? <div className={styles.v61PlanAlerts}>{missingImportantGsc.map((item) => <span key={item}>{item}</span>)}</div> : null}
          {error ? <div className={styles.alert}>{error}</div> : null}
        </div>
      </ModuleCard>
    );
  }

  return (
    <ModuleCard
      title="Nhập dữ liệu Search Console"
      description="Import lần lượt các tab Search Console: Queries, Pages, Query+Page, Dates, Devices, Countries, Search appearance. Supabase store là nguồn lưu chính; localStorage chỉ là cache."
      action={<Badge status={data ? 'connected' : 'pending'}>{data ? 'Đang dùng dữ liệu nhập thủ công' : 'Chưa nhập dữ liệu'}</Badge>}
    >
      <div className={styles.scV7Stack}>
        <div className={styles.scImportBox}>
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="Dán dữ liệu CSV hoặc tab-separated từ Google Search Console: Query, Page, Clicks, Impressions, CTR, Position..."
          />
          <div className={styles.fileImportRow}>
            <label className={styles.fileImportMeta}>
              Khoảng thời gian GSC
              <select value={dateRangeLabel} onChange={(event) => setDateRangeLabel(event.target.value)}>
                {dateRangeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <span className={styles.fileImportMeta}>Nhập lần lượt Queries, Pages, Query+Page, Dates, Devices, Countries hoặc Search appearance.</span>
          </div>
          <div className={styles.fileImportRow}>
            <label className={styles.fileImportButton}>
              Tải file Search Console
              <input type="file" multiple accept=".csv,.tsv,.zip" onChange={handleFileUpload} />
            </label>
            <span className={styles.fileImportMeta}>
              {processing ? 'Đang xử lý file...' : fileName ? fileName + ' - ' + rowCount + ' dòng' : 'Có thể chọn 1 CSV/TSV, nhiều CSV/TSV, hoặc 1 ZIP chứa nhiều CSV/TSV.'}{importSummaryText ? ' - ' + importSummaryText : ''}
            </span>
          </div>
          <div className={styles.fileImportRow}>
            <select value={apiRange} onChange={(event) => setApiRange(event.target.value)} disabled={apiSyncing}>
              {apiDateRangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button className={styles.secondaryButton} type="button" onClick={connectSearchConsoleApi} disabled={apiSyncing}>{apiStatus?.connected ? 'Đã kết nối Search Console' : 'Kết nối Search Console'}</button>
            <button className={styles.primaryButton} type="button" onClick={() => syncQueryPageFromApi(false)} disabled={apiSyncing || !apiStatus?.connected}>{apiSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Query+Page từ API'}</button>
            <button className={styles.secondaryButton} type="button" onClick={() => syncQueryPageFromApi(true)} disabled={apiSyncing || !apiStatus?.connected}>Lấy lại dữ liệu</button>
          </div>
          <div className={styles.scImportActions}>
            <button className={styles.primaryButton} onClick={analyze} disabled={processing}>{processing ? 'Đang xử lý' : 'Phân tích dữ liệu'}</button>
            <button className={styles.secondaryButton} onClick={clearImport}>Xóa ô nhập</button>
          </div>
          <div className={styles.scV7Status}>
            {error || (data?.overview.lastUpdated
              ? 'Cập nhật lần cuối: ' + new Date(data.overview.lastUpdated).toLocaleString('vi-VN')
              : 'Chưa nhập dữ liệu Search Console. Dashboard vẫn dùng dữ liệu Supabase cũ.')}
          </div>
          {latestImports.length ? (
            <div className={styles.scV7Status}>
              {latestImports.map((item) => (
                <span key={item.id}>
                  {item.type} - {item.dateRangeLabel} - {formatNumber(item.rowCount)} dòng
                </span>
              ))}
            </div>
          ) : null}
          {batchSummary ? (
            <div className={styles.scImportBatchBox}>
              <strong>{batchSummary.zipFileName ? 'ZIP: ' + batchSummary.zipFileName : 'Import file'}</strong>
              <div className={styles.scImportBatchStats}>
                <span>{formatNumber(batchSummary.totalFiles)} file đã đọc</span>
                <span>{formatNumber(batchSummary.parsedFiles)} parse thành công</span>
                <span>{formatNumber(batchSummary.skippedFiles)} bỏ qua/lỗi</span>
                <span>{formatNumber(batchSummary.totalRows)} dòng đã lưu</span>
              </div>
              <div className={styles.scImportBatchList}>
                {batchSummary.statuses.slice(0, 24).map((item, index) => (
                  <p key={'gsc-batch-' + item.fileName + '-' + index}>
                    <b>{item.status === 'success' ? 'OK' : item.status === 'error' ? 'Lỗi' : 'Bỏ qua'}</b>
                    <span>{item.fileName}</span>
                    <small>{item.type ? item.type + ' - ' : ''}{item.rowCount ? formatNumber(item.rowCount) + ' dòng - ' : ''}{item.message}</small>
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <section className={styles.gscManualSummaryBox}>
          <div className={styles.gscManualSummaryHeader}>
            <div>
              <h3>Tổng Search Console nhập tay</h3>
              <p>Nhập số tổng quan bạn nhìn thấy trực tiếp trong Google Search Console để so sánh với dữ liệu CSV export.</p>
            </div>
            <Badge status={manualSummary ? 'connected' : 'pending'}>
              {manualSummary ? 'Đã lưu tổng GSC nhập tay' : 'Chưa nhập tổng GSC thật'}
            </Badge>
          </div>

          <div className={styles.gscManualFormGrid}>
            <label>
              Khoảng thời gian
              <input value={manualDraft.range} onChange={(event) => updateManualDraft('range', event.target.value)} placeholder="16 tháng hoặc tùy chỉnh" />
            </label>
            <label>
              Tổng lượt nhấp
              <input value={manualDraft.clicks} onChange={(event) => updateManualDraft('clicks', event.target.value)} placeholder="20" inputMode="numeric" />
            </label>
            <label>
              Tổng lượt hiển thị
              <input value={manualDraft.impressions} onChange={(event) => updateManualDraft('impressions', event.target.value)} placeholder="2530" inputMode="numeric" />
            </label>
            <label>
              CTR trung bình
              <input value={manualDraft.ctr} onChange={(event) => updateManualDraft('ctr', event.target.value)} placeholder="0.8" inputMode="decimal" />
            </label>
            <label>
              Vị trí trung bình
              <input value={manualDraft.position} onChange={(event) => updateManualDraft('position', event.target.value)} placeholder="51.6" inputMode="decimal" />
            </label>
            <label>
              Ngày cập nhật
              <input type="date" value={manualDraft.checkedAt} onChange={(event) => updateManualDraft('checkedAt', event.target.value)} />
            </label>
            <label className={styles.gscManualNote}>
              Ghi chú
              <textarea value={manualDraft.note} onChange={(event) => updateManualDraft('note', event.target.value)} placeholder="Ví dụ: Số liệu lấy trực tiếp từ tab Hiệu suất trong Search Console." />
            </label>
          </div>

          <div className={styles.scImportActions}>
            <button className={styles.primaryButton} onClick={saveManualSummary}>Lưu tổng GSC</button>
            <button className={styles.secondaryButton} onClick={clearManualSummary}>Xóa tổng GSC nhập tay</button>
          </div>

          <div className={styles.gscSummaryCompareGrid}>
            <article className={styles.gscSummaryCard}>
              <strong>Số liệu từ CSV import</strong>
              <ul>
                <li><span>Nguồn tổng quan</span><b>{csvSummary.source === 'pages' ? 'Pages.csv' : csvSummary.source === 'queries' ? 'Queries.csv' : 'Chưa có dữ liệu'}</b></li>
                <li><span>Tổng lượt nhấp</span><b>{formatNumber(csvSummary.clicks)}</b></li>
                <li><span>Tổng lượt hiển thị</span><b>{formatNumber(csvSummary.impressions)}</b></li>
                <li><span>CTR trung bình</span><b>{formatCtr(csvSummary.ctr)}</b></li>
                <li><span>Vị trí trung bình</span><b>{formatPosition(csvSummary.position)}</b></li>
              </ul>
            </article>
            <article className={styles.gscSummaryCard}>
              <strong>Số liệu GSC nhập tay</strong>
              {manualSummary ? (
                <ul>
                  <li><span>Khoảng thời gian</span><b>{manualSummary.range}</b></li>
                  <li><span>Tổng lượt nhấp</span><b>{manualSummary.clicks == null ? '-' : formatNumber(manualSummary.clicks)}</b></li>
                  <li><span>Tổng lượt hiển thị</span><b>{manualSummary.impressions == null ? '-' : formatNumber(manualSummary.impressions)}</b></li>
                  <li><span>CTR trung bình</span><b>{manualSummary.ctr == null ? '-' : formatCtr(manualSummary.ctr)}</b></li>
                  <li><span>Vị trí trung bình</span><b>{formatPosition(manualSummary.position)}</b></li>
                  <li><span>Ngày cập nhật</span><b>{manualSummary.checkedAt}</b></li>
                </ul>
              ) : (
                <p>Chưa nhập tổng Search Console thật. Dashboard đang dùng số liệu từ CSV import.</p>
              )}
            </article>
          </div>

          {manualDiff ? (
            <div className={styles.gscDiffBox}>
              <strong>So sánh nhanh</strong>
              <div><span>Chênh lệch click</span><b>{formatSignedNumber(manualDiff.clicks)}</b></div>
              <div><span>Chênh lệch impression</span><b>{formatSignedNumber(manualDiff.impressions)}</b></div>
              <div><span>Chênh lệch CTR</span><b>{formatSignedDecimal(manualDiff.ctr, 2)}%</b></div>
              <div><span>Chênh lệch position</span><b>{formatSignedDecimal(manualDiff.position, 1)}</b></div>
              <p>Dữ liệu CSV import có thể lệch nhẹ so với Google Search Console thật do thời điểm export, dữ liệu ẩn hoặc giới hạn bảng. AI SEO vẫn dùng CSV để phân tích keyword/URL chi tiết.</p>
              <small>Số GSC nhập tay chỉ dùng để đối chiếu tổng quan, không thay thế dữ liệu keyword/URL chi tiết.</small>
            </div>
          ) : null}
        </section>

        {data ? (
          <>
            <div className={styles.scV7Tabs}>
              {tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? styles.scV7TabActive : ''} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
            </div>

            <div className={styles.metricGridSmall}>
              <MetricCard label="Tổng lượt nhấp" value={formatNumber(data.overview.clicks)} />
              <MetricCard label="Tổng lượt hiển thị" value={formatNumber(data.overview.impressions)} />
              <MetricCard label="CTR trung bình" value={formatCtr(data.overview.ctr)} />
              <MetricCard label="Vị trí trung bình" value={formatPosition(data.overview.position)} />
              <MetricCard label="Tổng từ khóa" value={formatNumber(uniqueQueries)} />
              <MetricCard label="Tổng trang" value={formatNumber(uniquePages)} />
            </div>

            {activeTab === 'overview' ? (
              <div className={styles.gridTwo}>
                <MiniBarChart data={data.trend.slice(-32).map((item) => ({ date: item.date.slice(5), clicks: item.clicks, impressions: item.impressions }))} label="Xu hướng từ dữ liệu Dates đã import" />
                <div className={styles.scV7InlinePanel}>
                  <h3>Tín hiệu cụm SEO</h3>
                  {clusterRows.length ? clusterRows.map((row, index) => <p key={'cluster-signal-' + row.cluster + '-' + index}><strong>{row.cluster}</strong><span>{formatNumber(row.impressions)} impression - {formatNumber(row.clicks)} click - Pos {row.position.toFixed(1)}</span></p>) : <EmptyState title="Chưa có tín hiệu cụm" detail="Nhập thêm query/page để dashboard gom theo cụm SEO." />}
                </div>
              </div>
            ) : null}

            {activeTab === 'queries' ? (
              <div className={styles.v5TwoTables}>
                <div>
                  <h3>Từ khóa đã có trong dashboard</h3>
                  {keywordRows.matched.length ? <table><tbody>{keywordRows.matched.map((row, index) => <tr key={'gsc-matched-' + row.query + '-' + index}><td>{row.query}</td><td>{formatNumber(row.impressions)}</td><td>{formatCtr(row.ctr)}</td><td>Pos {row.position}</td></tr>)}</tbody></table> : <EmptyState title="Chưa khớp keyword thủ công" detail="Query mới sẽ nằm ở cột bên cạnh." />}
                </div>
                <div>
                  <h3>Từ khóa mới phát hiện</h3>
                  {keywordRows.fresh.length ? <table><tbody>{keywordRows.fresh.map((row, index) => <tr key={'gsc-fresh-' + row.query + '-' + index}><td>{row.query}</td><td>{formatNumber(row.impressions)}</td><td>{formatCtr(row.ctr)}</td><td>Pos {row.position}</td></tr>)}</tbody></table> : <EmptyState title="Chưa có query mới" detail="Dữ liệu import chưa phát hiện từ khóa mới." />}
                </div>
              </div>
            ) : null}

            {activeTab === 'pages' ? (
              <div className={styles.tableWrap}><table><thead><tr><th>Page</th><th>Loại trang</th><th>Click</th><th>Impression</th><th>CTR</th><th>Position</th></tr></thead><tbody>{data.pages.slice(0, 30).map((row, index) => <tr key={'gsc-page-' + row.page + '-' + index}><td>{row.page}</td><td>{pageType(row.page)}</td><td>{formatNumber(row.clicks)}</td><td>{formatNumber(row.impressions)}</td><td>{formatCtr(row.ctr)}</td><td>{row.position}</td></tr>)}</tbody></table></div>
            ) : null}

            {activeTab === 'opportunities' ? (
              data.opportunities.length ? <div className={styles.scV7OpportunityList}>{data.opportunities.slice(0, 16).map((row, index) => <article key={'gsc-op-' + row.id + '-' + index}><Badge status={row.priority === 1 ? 'warning' : 'pending'}>P{row.priority}</Badge><strong>{row.query}</strong><p>{row.reason}</p><span>{row.action}</span><small>{formatNumber(row.impressions)} impression - CTR {formatCtr(row.ctr)} - Pos {row.position}</small></article>)}</div> : <EmptyState title="Chưa có cơ hội Search Console" detail="Nhập thêm dữ liệu có lượt hiển thị/vị trí để tìm cơ hội SEO." />
            ) : null}

            {activeTab === 'devices' ? (
              <div className={styles.tableWrap}><table><thead><tr><th>Device</th><th>Click</th><th>Impression</th><th>CTR</th><th>Position</th></tr></thead><tbody>{data.devices.map((row, index) => <tr key={'gsc-device-' + row.device + '-' + index}><td>{row.device}</td><td>{formatNumber(row.clicks)}</td><td>{formatNumber(row.impressions)}</td><td>{formatCtr(row.ctr)}</td><td>{formatPosition(row.position)}</td></tr>)}</tbody></table>{!data.devices.length ? <EmptyState title="Chưa có thiết bị" detail="Dữ liệu nhập chưa có cột device." /> : null}</div>
            ) : null}

            {activeTab === 'countries' ? (
              <div className={styles.tableWrap}><table><thead><tr><th>Country</th><th>Click</th><th>Impression</th><th>CTR</th><th>Position</th></tr></thead><tbody>{data.countries.map((row, index) => <tr key={'gsc-country-' + row.country + '-' + index}><td>{row.country}</td><td>{formatNumber(row.clicks)}</td><td>{formatNumber(row.impressions)}</td><td>{formatCtr(row.ctr)}</td><td>{formatPosition(row.position)}</td></tr>)}</tbody></table>{!data.countries.length ? <EmptyState title="Chưa có quốc gia" detail="Dữ liệu nhập chưa có cột country." /> : null}</div>
            ) : null}

            {activeTab === 'dates' ? (
              <div className={styles.tableWrap}><table><thead><tr><th>Date</th><th>Click</th><th>Impression</th><th>CTR</th><th>Position</th></tr></thead><tbody>{data.trend.map((row, index) => <tr key={'gsc-date-' + row.date + '-' + index}><td>{row.date}</td><td>{formatNumber(row.clicks)}</td><td>{formatNumber(row.impressions)}</td><td>{formatCtr(row.ctr)}</td><td>{formatPosition(row.position)}</td></tr>)}</tbody></table>{!data.trend.length ? <EmptyState title="Chưa có dữ liệu Dates" detail="Hãy import tab Dates từ Search Console để AI đọc xu hướng dài hạn." /> : null}</div>
            ) : null}

            {activeTab === 'searchAppearance' ? (
              <div className={styles.tableWrap}><table><thead><tr><th>Appearance</th><th>Click</th><th>Impression</th><th>CTR</th><th>Position</th></tr></thead><tbody>{(data.searchAppearances || []).map((row, index) => <tr key={'gsc-appearance-' + row.searchAppearance + '-' + index}><td>{row.searchAppearance}</td><td>{formatNumber(row.clicks)}</td><td>{formatNumber(row.impressions)}</td><td>{formatCtr(row.ctr)}</td><td>{formatPosition(row.position)}</td></tr>)}</tbody></table>{!(data.searchAppearances || []).length ? <EmptyState title="Chưa có Search appearance" detail="Hãy import tab Search appearance nếu Search Console có dữ liệu rich result." /> : null}</div>
            ) : null}
          </>
        ) : <EmptyState title="Chưa nhập dữ liệu Search Console" detail="Chưa có dữ liệu GSC thật trong seo_dashboard_store. AI sẽ không dùng dữ liệu mẫu." />}
      </div>
    </ModuleCard>
  );
}

export default memo(SearchConsoleV7Center);
