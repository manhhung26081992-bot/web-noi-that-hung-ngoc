'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { Badge, EmptyState, MetricCard, MiniBarChart, ModuleCard } from './Ui';
import type {
  SearchConsoleCountry,
  SearchConsoleDatePoint,
  SearchConsoleDevice,
  SearchConsoleOpportunity,
  SearchConsolePage,
  SearchConsoleQuery,
  SearchConsoleRequestType,
  SearchConsoleV7Data,
  SeoCluster,
  SeoKeyword,
} from '../types/seo';
import styles from '../seo-dashboard.module.css';
import { detectImportDelimiter, readCsvFileAsText, splitDelimitedRow } from '../services/importFileReader';

type Props = {
  keywords: SeoKeyword[];
  clusters: SeoCluster[];
  onData?: (data: SearchConsoleV7Data | null) => void;
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
};

type SearchConsoleImportKind = 'queries' | 'pages' | 'combined' | 'devices' | 'countries' | 'dates';

type SearchConsoleImportStore = {
  version?: number;
  rawText?: string;
  data?: SearchConsoleV7Data | null;
  fileName?: string;
  rowCount?: number;
  rawTextByType?: Partial<Record<SearchConsoleImportKind, string>>;
  fileNames?: Partial<Record<SearchConsoleImportKind, string>>;
  rowCounts?: Partial<Record<SearchConsoleImportKind, number>>;
  lastUpdated?: string;
};

const STORAGE_KEY = 'noithathungngoc-search-console-import-v1';
const LEGACY_STORAGE_KEY = 'noithathungoc-search-console-import-v1';

const tabs: Array<{ id: SearchConsoleRequestType; label: string }> = [
  { id: 'overview', label: 'Tong quan' },
  { id: 'queries', label: 'Top query' },
  { id: 'pages', label: 'Top page' },
  { id: 'opportunities', label: 'Co hoi' },
  { id: 'devices', label: 'Thiet bi' },
];

const sampleData = [
  'Query,Page,Clicks,Impressions,CTR,Position,Device,Country,Date',
  'giuong tang sat gia re,https://www.noithathungngoc.com/giuong-tang-sat/,3,180,1.6%,18.4,MOBILE,VNM,2026-06-24',
  'ban lam viec gia re,https://www.noithathungngoc.com/ban-lam-viec/,5,240,2.1%,14.2,DESKTOP,VNM,2026-06-24',
  'ban ghe hoc sinh,https://www.noithathungngoc.com/truong-hoc/,2,90,2.2%,21.7,MOBILE,VNM,2026-06-25',
  'ghe chan quy gia re tai ha noi,https://www.noithathungngoc.com/ghe-chan-quy/,1,185,0.5%,34.0,MOBILE,VNM,2026-06-25',
  'tu locker sat,https://www.noithathungngoc.com/tu-locker/,4,260,1.54%,24.5,DESKTOP,VNM,2026-06-26',
].join('\n');

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0));
}

function formatCtr(value: number | null | undefined) {
  return Number(value || 0).toFixed(2) + '%';
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
  return key;
}

function detectDelimiter(firstLine: string) {
  return detectImportDelimiter(firstLine);
}

function parseImportText(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headerIndex = lines.findIndex((line) =>
    splitRow(line, detectDelimiter(line)).map(headerKey).some((header) => ['query', 'page'].includes(header))
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
    };
  }).filter((row) => (row.query || row.page) && (row.clicks || row.impressions || row.ctr || row.position));
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
  if (value.includes('giuong')) return 'Giuong sat';
  if (value.includes('ban hoc') || value.includes('truong hoc') || value.includes('bang tu')) return 'Truong hoc';
  if (value.includes('ban')) return 'Ban lam viec';
  if (value.includes('ghe')) return 'Ghe van phong';
  if (value.includes('tu') || value.includes('locker')) return 'Tu van phong';
  return undefined;
}

function actionFor(row: SearchConsoleQuery | SearchConsolePage, reason: string) {
  if (reason.includes('11-20')) return 'Bo sung FAQ, them internal link va giu slug on dinh de day vao top 10.';
  if (reason.includes('21-40')) return 'Viet bai phu hoac cap nhat noi dung chi tiet, anh thuc te va lien ket ve trang dich.';
  if (reason.includes('CTR')) return 'Toi uu title/meta de ro gia tri mua hang, khong doi URL neu trang moi index.';
  if ('page' in row && row.page) return 'Kiem tra noi dung trang, them link noi bo va CTA phu hop.';
  return 'Theo doi them neu du lieu con it, uu tien hang chu dao truoc.';
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
    if (row.position >= 11 && row.position <= 20) add(row, 'Query position 11-20, gan top 10.');
    else if (row.position > 20 && row.position <= 40) add(row, 'Query position 21-40, can them noi dung ho tro.');
    if (row.impressions >= 100 && row.ctr < 2) add(row, 'Impression cao nhung CTR thap.');
    if (row.query && !knownKeywords.has(normalize(row.query))) add(row, 'Query moi chua co trong seo_keywords.');
  });

  pages.forEach((row) => {
    if (row.impressions >= 100 && row.clicks <= 3) add(row, 'Page co impression cao nhung it click.');
  });

  return Array.from(new Map(opportunities.map((item) => [item.id, item])).values())
    .sort((a, b) => a.priority - b.priority || b.impressions - a.impressions || a.position - b.position)
    .slice(0, 50);
}

function analyzeImport(text: string, keywords: SeoKeyword[]): SearchConsoleV7Data | null {
  const rows = parseImportText(text);
  if (!rows.length) return null;

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

  return {
    source: 'import',
    selectedType: 'overview',
    overview: {
      connected: true,
      reason: 'manual_import',
      message: 'Dang dung du lieu Search Console import thu cong.',
      siteUrl: 'https://www.noithathungngoc.com/',
      range: '28d',
      clicks,
      impressions,
      ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
      position: Number(position.toFixed(1)),
      lastUpdated: new Date().toISOString(),
    },
    queries,
    pages,
    devices,
    countries,
    trend,
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
        ? 'Toi uu landing page va them internal link cho cum nay.'
        : impressions > 0
          ? 'Theo doi them tin hieu tu query va page da import.'
          : 'Chua co tin hieu Search Console import cho cum nay.',
    };
  }).filter((item) => item.impressions > 0);
}

function detectImportKind(data: SearchConsoleV7Data): SearchConsoleImportKind {
  const hasQueries = data.queries.length > 0;
  const hasPages = data.pages.length > 0;
  if (hasQueries && hasPages) return 'combined';
  if (hasQueries) return 'queries';
  if (hasPages) return 'pages';
  if (data.devices.length > 0) return 'devices';
  if (data.countries.length > 0) return 'countries';
  if (data.trend.length > 0) return 'dates';
  return 'combined';
}

function buildMergedOverview(rows: ImportRow[], previous?: SearchConsoleV7Data | null, incoming?: SearchConsoleV7Data | null) {
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const positionWeight = rows.reduce((sum, row) => sum + row.position * Math.max(row.impressions, 1), 0);
  const positionBase = rows.reduce((sum, row) => sum + Math.max(row.impressions, 1), 0);
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : rows.length ? rows.reduce((sum, row) => sum + row.ctr, 0) / rows.length : 0;
  const position = positionBase > 0 ? positionWeight / positionBase : 0;

  return {
    ...(previous?.overview || incoming?.overview || {}),
    connected: true,
    reason: 'manual_import',
    message: 'Dang dung du lieu Search Console import thu cong. URL tao tu website khong dong nghia voi URL Google da index.',
    siteUrl: 'https://www.noithathungngoc.com/',
    range: '28d',
    clicks,
    impressions,
    ctr,
    position,
    lastUpdated: new Date().toISOString(),
  } as SearchConsoleV7Data['overview'];
}

function mergeSearchConsoleData(previous: SearchConsoleV7Data | null, incoming: SearchConsoleV7Data, keywords: SeoKeyword[]): SearchConsoleV7Data {
  const incomingKind = detectImportKind(incoming);
  const replaceQueries = incomingKind === 'queries' || incomingKind === 'combined';
  const replacePages = incomingKind === 'pages' || incomingKind === 'combined';

  const queries = replaceQueries ? incoming.queries : previous?.queries || [];
  const pages = replacePages ? incoming.pages : previous?.pages || [];
  const devices = incoming.devices.length > 0 ? incoming.devices : previous?.devices || [];
  const countries = incoming.countries.length > 0 ? incoming.countries : previous?.countries || [];
  const trend = incoming.trend.length > 0 ? incoming.trend : previous?.trend || [];
  const overviewRows = pages.length > 0 ? pages : queries;

  return {
    source: 'import',
    selectedType: 'overview',
    overview: buildMergedOverview(overviewRows, previous, incoming),
    queries,
    pages,
    devices,
    countries,
    trend,
    opportunities: buildOpportunities(queries, pages, keywords),
  };
}

function normalizeStoredSearchConsole(parsed: SearchConsoleImportStore): SearchConsoleImportStore {
  const rawTextByType = parsed.rawTextByType || (parsed.rawText ? { combined: parsed.rawText } : {});
  const fileNames = parsed.fileNames || (parsed.fileName ? { combined: parsed.fileName } : {});
  const rowCounts = parsed.rowCounts || (typeof parsed.rowCount === 'number' ? { combined: parsed.rowCount } : {});
  return { ...parsed, rawTextByType, fileNames, rowCounts };
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

function SearchConsoleV7Center({ keywords, clusters, onData }: Props) {
  const [activeTab, setActiveTab] = useState<SearchConsoleRequestType>('overview');
  const [rawText, setRawText] = useState('');
  const [data, setData] = useState<SearchConsoleV7Data | null>(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [rowCount, setRowCount] = useState(0);
  const [rawTextByType, setRawTextByType] = useState<Partial<Record<SearchConsoleImportKind, string>>>({});
  const [fileNames, setFileNames] = useState<Partial<Record<SearchConsoleImportKind, string>>>({});
  const [rowCounts, setRowCounts] = useState<Partial<Record<SearchConsoleImportKind, number>>>({});

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

      setRawText(latestRawText);
      setData(parsed.data || null);
      setFileName(latestFileName);
      setRowCount(latestRowCount);
      setRawTextByType(parsed.rawTextByType || {});
      setFileNames(parsed.fileNames || {});
      setRowCounts(parsed.rowCounts || {});
      onData?.(parsed.data || null);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [onData]);

  const keywordRows = useMemo(() => keywordMatchRows(data, keywords), [data, keywords]);
  const clusterRows = useMemo(() => clusterSignal(data, clusters), [data, clusters]);
  const uniqueQueries = useMemo(() => new Set(data?.queries.map((row) => normalize(row.query)).filter(Boolean)).size, [data]);
  const uniquePages = useMemo(() => new Set(data?.pages.map((row) => normalize(row.page)).filter(Boolean)).size, [data]);
  const importSummaryText = data ? 'Query import: ' + uniqueQueries + ' - Page import: ' + uniquePages : '';

  const saveImport = (nextData: SearchConsoleV7Data, nextRawText: string, nextFileName: string, nextRowCount: number, kind: SearchConsoleImportKind) => {
    const nextStore = updateImportStore({ rawTextByType, fileNames, rowCounts }, kind, nextRawText, nextFileName, nextRowCount);
    setData(nextData);
    setRawText(nextRawText);
    setFileName(nextFileName);
    setRowCount(nextRowCount);
    setRawTextByType(nextStore.rawTextByType);
    setFileNames(nextStore.fileNames);
    setRowCounts(nextStore.rowCounts);
    onData?.(nextData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      rawText: nextRawText,
      data: nextData,
      fileName: nextFileName,
      rowCount: nextRowCount,
      rawTextByType: nextStore.rawTextByType,
      fileNames: nextStore.fileNames,
      rowCounts: nextStore.rowCounts,
      lastUpdated: new Date().toISOString(),
    } satisfies SearchConsoleImportStore));
  };

  const analyze = () => {
    const result = analyzeImport(rawText, keywords);
    if (!result) {
      setError('Chua doc duoc du lieu. Hay dan CSV hoac du lieu tab tu Google Search Console.');
      return;
    }
    const kind = detectImportKind(result);
    const nextData = mergeSearchConsoleData(data, result, keywords);
    const nextRowCount = parseImportText(rawText).length;
    setError('');
    saveImport(nextData, rawText, fileName || 'du-lieu-dan-thu-cong.csv', nextRowCount, kind);
  };

  const clearImport = () => {
    setRawText('');
    setData(null);
    setError('');
    setFileName('');
    setRowCount(0);
    setRawTextByType({});
    setFileNames({});
    setRowCounts({});
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    onData?.(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await readCsvFileAsText(file);
      const result = analyzeImport(text, keywords);
      if (!result) {
        setError('File chua dung dinh dang. Vui long export CSV tu Google Search Console hoac copy bang vao o nhap.');
        return;
      }
      const kind = detectImportKind(result);
      const nextData = mergeSearchConsoleData(data, result, keywords);
      const nextRowCount = parseImportText(text).length;
      setError('');
      saveImport(nextData, text, file.name, nextRowCount, kind);
    } catch {
      setError('Khong doc duoc file CSV. Neu dung Excel, hay luu thanh CSV truoc.');
    }
  };

  const useSample = () => {
    setRawText(sampleData);
    setFileName('du-lieu-mau-search-console.csv');
    setRowCount(parseImportText(sampleData).length);
    setError('');
  };

  return (
    <ModuleCard
      title="Search Console Import Center"
      description="Vao Google Search Console -> Performance -> Export -> copy du lieu Query/Page roi dan vao day."
      action={<Badge status={data ? 'connected' : 'pending'}>{data ? 'Đang dùng dữ liệu thủ công' : 'Chưa import dữ liệu'}</Badge>}
    >
      <div className={styles.scV7Stack}>
        <div className={styles.scImportBox}>
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="Dan du lieu CSV hoac tab-separated tu Google Search Console: Query, Page, Clicks, Impressions, CTR, Position..."
          />
          <div className={styles.fileImportRow}>
            <label className={styles.fileImportButton}>
              Tai file Search Console CSV
              <input type="file" accept=".csv,text/csv,text/tab-separated-values" onChange={handleFileUpload} />
            </label>
            <span className={styles.fileImportMeta}>
              {fileName ? fileName + ' - ' + rowCount + ' dong' : 'Nếu dùng Excel, hãy lưu thành CSV trước.'}{importSummaryText ? ' - ' + importSummaryText : ''}
            </span>
          </div>
          <div className={styles.scImportActions}>
            <button className={styles.primaryButton} onClick={analyze}>Phân tích dữ liệu </button>
            <button className={styles.secondaryButton} onClick={useSample}>Dùng dữu liệu mẫu</button>
            <button className={styles.secondaryButton} onClick={clearImport}>Xóa dữ liệu import</button>
          </div>
          <div className={styles.scV7Status}>
            {error || (data?.overview.lastUpdated
              ? 'Cap nhat lan cuoi: ' + new Date(data.overview.lastUpdated).toLocaleString('vi-VN')
              : 'Chua import du lieu Search Console. Dashboard van dung du lieu Supabase cu.')}
          </div>
        </div>

        {data ? (
          <>
            <div className={styles.scV7Tabs}>
              {tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? styles.scV7TabActive : ''} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
            </div>

            <div className={styles.metricGridSmall}>
              <MetricCard label="Tong clicks" value={formatNumber(data.overview.clicks)} />
              <MetricCard label="Tong impressions" value={formatNumber(data.overview.impressions)} />
              <MetricCard label="CTR trung binh" value={formatCtr(data.overview.ctr)} />
              <MetricCard label="Position trung binh" value={data.overview.position || '-'} />
              <MetricCard label="Tong query" value={formatNumber(uniqueQueries)} />
              <MetricCard label="Tong page" value={formatNumber(uniquePages)} />
            </div>

            {activeTab === 'overview' ? (
              <div className={styles.gridTwo}>
                <MiniBarChart data={data.trend.slice(-28).map((item) => ({ date: item.date.slice(5), clicks: item.clicks, impressions: item.impressions }))} label="Xu huong 28 ngay" />
                <div className={styles.scV7InlinePanel}>
                  <h3>Tin hieu cum SEO</h3>
                  {clusterRows.length ? clusterRows.map((row, index) => <p key={'cluster-signal-' + row.cluster + '-' + index}><strong>{row.cluster}</strong><span>{formatNumber(row.impressions)} impression - {formatNumber(row.clicks)} click - Pos {row.position.toFixed(1)}</span></p>) : <EmptyState title="Chua co tin hieu cum" detail="Import them query/page de dashboard gom theo cum SEO." />}
                </div>
              </div>
            ) : null}

            {activeTab === 'queries' ? (
              <div className={styles.v5TwoTables}>
                <div>
                  <h3>Keyword da co trong dashboard</h3>
                  {keywordRows.matched.length ? <table><tbody>{keywordRows.matched.map((row, index) => <tr key={'gsc-matched-' + row.query + '-' + index}><td>{row.query}</td><td>{formatNumber(row.impressions)}</td><td>{formatCtr(row.ctr)}</td><td>Pos {row.position}</td></tr>)}</tbody></table> : <EmptyState title="Chưa Khớp keyword thủ công" detail="Query mới sẽ nằm ở cột bên cạnh." />}
                </div>
                <div>
                  <h3>từ khóa mới phát hiện</h3>
                  {keywordRows.fresh.length ? <table><tbody>{keywordRows.fresh.map((row, index) => <tr key={'gsc-fresh-' + row.query + '-' + index}><td>{row.query}</td><td>{formatNumber(row.impressions)}</td><td>{formatCtr(row.ctr)}</td><td>Pos {row.position}</td></tr>)}</tbody></table> : <EmptyState title="Chưa có query mới" detail="Dữ Liệu import Chưa phát hiện từ khóa mới" />}
                </div>
              </div>
            ) : null}

            {activeTab === 'pages' ? (
              <div className={styles.tableWrap}><table><thead><tr><th>Page</th><th>Loai trang</th><th>Click</th><th>Impression</th><th>CTR</th><th>Position</th></tr></thead><tbody>{data.pages.slice(0, 30).map((row, index) => <tr key={'gsc-page-' + row.page + '-' + index}><td>{row.page}</td><td>{pageType(row.page)}</td><td>{formatNumber(row.clicks)}</td><td>{formatNumber(row.impressions)}</td><td>{formatCtr(row.ctr)}</td><td>{row.position}</td></tr>)}</tbody></table></div>
            ) : null}

            {activeTab === 'opportunities' ? (
              data.opportunities.length ? <div className={styles.scV7OpportunityList}>{data.opportunities.slice(0, 16).map((row, index) => <article key={'gsc-op-' + row.id + '-' + index}><Badge status={row.priority === 1 ? 'warning' : 'pending'}>P{row.priority}</Badge><strong>{row.query}</strong><p>{row.reason}</p><span>{row.action}</span><small>{formatNumber(row.impressions)} impression - CTR {formatCtr(row.ctr)} - Pos {row.position}</small></article>)}</div> : <EmptyState title="Chua co co hoi Search Console" detail="Import them du lieu co impressions/position de tim co hoi SEO." />
            ) : null}

            {activeTab === 'devices' ? (
              <div className={styles.v5TwoTables}>
                <div><h3>Thiet bi</h3>{data.devices.length ? <table><tbody>{data.devices.map((row, index) => <tr key={'gsc-device-' + row.device + '-' + index}><td>{row.device}</td><td>{formatNumber(row.clicks)}</td><td>{formatNumber(row.impressions)}</td><td>{formatCtr(row.ctr)}</td></tr>)}</tbody></table> : <EmptyState title="Chua co thiet bi" detail="Du lieu import chua co cot device." />}</div>
                <div><h3>Quoc gia</h3>{data.countries.length ? <table><tbody>{data.countries.map((row, index) => <tr key={'gsc-country-' + row.country + '-' + index}><td>{row.country}</td><td>{formatNumber(row.clicks)}</td><td>{formatNumber(row.impressions)}</td><td>{formatCtr(row.ctr)}</td></tr>)}</tbody></table> : <EmptyState title="Chua co quoc gia" detail="Du lieu import chua co cot country." />}</div>
              </div>
            ) : null}
          </>
        ) : <EmptyState title="Chua import du lieu Search Console" detail="Du lieu se duoc luu trong localStorage cua trinh duyet, khong tao bang Supabase moi." />}
      </div>
    </ModuleCard>
  );
}

export default memo(SearchConsoleV7Center);
