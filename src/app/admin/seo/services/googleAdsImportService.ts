'use client';

import { detectDelimiterFromLine, splitDelimitedRow } from './importFileReader';
import type {
  GoogleAdsImportData,
  GoogleAdsImportMergeResult,
  GoogleAdsImportMode,
  GoogleAdsImportSource,
  GoogleAdsImportSummary,
  GoogleAdsKeywordImportRow,
  GoogleAdsOpportunity,
  GoogleAdsRecommendation,
  SearchConsoleQuery,
  SearchConsoleV7Data,
  SeoAdsKeywordMatrixRow,
  SeoCluster,
  SeoKeyword,
} from '../types/seo';

export const GOOGLE_ADS_IMPORT_STORAGE_KEY = 'noithathungngoc-google-ads-import-v1';

export const googleAdsSampleData = [
  'Keyword\tCurrency\tAvg. monthly searches\tCompetition\tCompetition (indexed value)\tTop of page bid (low range)\tTop of page bid (high range)\tClicks\tImpressions',
  'giường tầng sắt giá rẻ\tVND\t1200\tMedium\t55\t2800\t6900\t42\t1800',
  'giường sắt 2 tầng\tVND\t900\tLow\t32\t2200\t5200\t35\t1400',
  'bàn làm việc 1m2\tVND\t5000\tCao\t100\t4257\t19299\t58\t2600',
  'bàn văn phòng giá rẻ\tVND\t1300\tMedium\t62\t4200\t9000\t44\t2100',
  'bàn ghế học sinh\tVND\t1000\tLow\t28\t2200\t4800\t39\t1750',
  'ghế chân quỳ\tVND\t700\tHigh\t78\t5200\t12000\t21\t900',
  'tủ locker\tVND\t650\tMedium\t58\t3900\t8300\t18\t820',
].join('\n');

const headerMap: Record<string, keyof GoogleAdsKeywordImportRow> = {
  keyword: 'keyword',
  keywords: 'keyword',
  search_term: 'keyword',
  search_terms: 'keyword',
  tu_khoa: 'keyword',
  cum_tu_tim_kiem: 'keyword',
  avg_monthly_searches: 'avg_monthly_searches',
  avg_monthly_search: 'avg_monthly_searches',
  average_monthly_searches: 'avg_monthly_searches',
  monthly_searches: 'avg_monthly_searches',
  search_volume: 'avg_monthly_searches',
  luot_tim_kiem_trung_binh_hang_thang: 'avg_monthly_searches',
  so_luot_tim_kiem_trung_binh_hang_thang: 'avg_monthly_searches',
  luong_tim_kiem: 'avg_monthly_searches',
  competition: 'competition',
  muc_do_canh_tranh: 'competition',
  competition_index: 'competition_index',
  competition_indexed_value: 'competition_index',
  chi_so_canh_tranh: 'competition_index',
  low_top_of_page_bid: 'low_top_of_page_bid',
  top_of_page_bid_low_range: 'low_top_of_page_bid',
  gia_thau_thap: 'low_top_of_page_bid',
  high_top_of_page_bid: 'high_top_of_page_bid',
  top_of_page_bid_high_range: 'high_top_of_page_bid',
  gia_thau_cao: 'high_top_of_page_bid',
  currency: 'currency',
  tien_te: 'currency',
  ad_impression_share: 'ad_impression_share',
  ty_le_hien_thi_quang_cao: 'ad_impression_share',
  organic_impression_share: 'organic_impression_share',
  ty_le_hien_thi_tu_nhien: 'organic_impression_share',
  organic_average_position: 'organic_average_position',
  vi_tri_tu_nhien_trung_binh: 'organic_average_position',
  cpc: 'cpc',
  campaign: 'campaign',
  chien_dich: 'campaign',
  ad_group: 'ad_group',
  nhom_quang_cao: 'ad_group',
  clicks: 'clicks',
  so_luot_nhap: 'clicks',
  impressions: 'impressions',
  so_luot_hien_thi: 'impressions',
  ctr: 'ctr',
  cost: 'cost',
  chi_phi: 'cost',
  conversions: 'conversions',
  chuyen_doi: 'conversions',
  conversion_rate: 'conversion_rate',
  ty_le_chuyen_doi: 'conversion_rate',
};

function stripAccent(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

export function normalizeText(value: unknown) {
  return stripAccent(String(value || '').toLowerCase().trim()).replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normalizeGoogleAdsKeyword(value: unknown) {
  return normalizeText(value);
}

function headerKey(value: string) {
  const base = value.trim().replace(/^"|"$/g, '');
  const noAccent = stripAccent(base.toLowerCase());
  return noAccent.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function parseDelimitedLine(line: string, delimiter: ',' | '\t' | ';') {
  return splitDelimitedRow(line, delimiter);
}

function findHeaderIndex(lines: string[]) {
  return lines.findIndex((line) => {
    const delimiter = detectDelimiterFromLine(line);
    const headers = parseDelimitedLine(line, delimiter).map(headerKey);
    return headers.some((header) => ['keyword', 'keywords', 'search_term', 'search_terms', 'tu_khoa', 'cum_tu_tim_kiem'].includes(header));
  });
}

function parseNumber(value: unknown) {
  if (value === null || value === undefined) return undefined;
  let text = String(value).trim();
  if (!text || text === '-' || text.toLowerCase() === 'n/a') return undefined;
  text = text.replace(/%/g, '').replace(/đ|₫|vnd|vnđ|usd|\$/gi, '').replace(/\s/g, '');
  text = text.replace(/[^0-9.,-]/g, '');
  if (!text) return undefined;
  const hasComma = text.includes(',');
  const hasDot = text.includes('.');
  if (hasComma && hasDot) {
    const lastComma = text.lastIndexOf(',');
    const lastDot = text.lastIndexOf('.');
    text = lastComma > lastDot ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '');
  } else if (hasComma) {
    text = /^-?\d{1,3}(,\d{3})+$/.test(text) ? text.replace(/,/g, '') : text.replace(',', '.');
  } else if (hasDot) {
    text = /^-?\d{1,3}(\.\d{3})+$/.test(text) ? text.replace(/\./g, '') : text;
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : undefined;
}

function normalizeCompetition(value: unknown, index?: number) {
  const text = normalizeText(value);
  if (text.includes('cao') || text.includes('high')) return 'High';
  if (text.includes('thap') || text.includes('low')) return 'Low';
  if (text.includes('trung') || text.includes('medium')) return 'Medium';
  if (typeof index === 'number') {
    if (index >= 67) return 'High';
    if (index >= 34) return 'Medium';
    return 'Low';
  }
  return value ? String(value) : 'Unknown';
}

function competitionScore(value: unknown, index?: number) {
  const comp = normalizeCompetition(value, index).toLowerCase();
  if (comp.includes('low')) return 28;
  if (comp.includes('medium')) return 18;
  if (comp.includes('high')) return 7;
  return 12;
}

function businessCluster(keyword: string) {
  const text = normalizeText(keyword);
  if (/(giuong|giuong sat|giuong tang|giuong tang sat)/.test(text)) return { cluster: 'Giường sắt / giường tầng sắt', priority: 100 };
  if (/(ban lam viec|ban van phong|ban nhan vien|ban chan sat|ban fami)/.test(text)) return { cluster: 'Bàn làm việc / bàn văn phòng', priority: 96 };
  if (/(ban hoc sinh|ban ghe hoc sinh|truong hoc|bang tu|noi that truong hoc)/.test(text)) return { cluster: 'Bàn ghế học sinh / nội thất trường học', priority: 94 };
  if (/(ghe chan quy|ghe giam doc|ghe xoay|ghe van phong)/.test(text)) return { cluster: 'Ghế văn phòng', priority: 62 };
  if (/(tu locker|tu van phong|tu sat|tu tai lieu)/.test(text)) return { cluster: 'Tủ văn phòng / locker', priority: 58 };
  return { cluster: 'Theo dõi thêm', priority: 45 };
}

function commercialIntent(keyword: string) {
  const text = normalizeText(keyword);
  let score = 35;
  if (/(gia re|bao gia|mua|ban|gia|xuong|ha noi|hcm)/.test(text)) score += 25;
  if (/(1m2|1m4|2 tang|3 tang|sat|chan sat|fami|hoc sinh|van phong)/.test(text)) score += 15;
  if (/(cach|kinh nghiem|huong dan|la gi)/.test(text)) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function findSearchConsoleMatch(keyword: string, queries: SearchConsoleQuery[]) {
  const key = normalizeText(keyword);
  if (!key) return undefined;
  return queries.find((query) => {
    const q = normalizeText(query.query);
    return q === key || (q.length > 4 && key.includes(q)) || (key.length > 4 && q.includes(key));
  });
}

function average(values: Array<number | undefined>) {
  const clean = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null;
}

function sum(values: Array<number | undefined>) {
  return values.reduce<number>((total, value) => total + Number(value || 0), 0);
}

function recommendation(row: GoogleAdsKeywordImportRow, score: number, sc?: SearchConsoleQuery): GoogleAdsRecommendation {
  const cpc = row.cpc || row.high_top_of_page_bid || row.low_top_of_page_bid || 0;
  const comp = normalizeCompetition(row.competition, row.competition_index).toLowerCase();
  const volume = row.avg_monthly_searches || 0;
  const hasConversion = Number(row.conversions || 0) > 0;
  const wasted = Number(row.cost || 0) > 0 && Number(row.conversions || 0) === 0 && Number(row.clicks || 0) >= 10;
  if (wasted && comp.includes('high')) return 'Không ưu tiên';
  if (sc && sc.position >= 11 && sc.position <= 20 && volume >= 100) return row.businessPriority >= 80 ? 'Cả hai' : 'SEO trước';
  if (row.businessPriority >= 90 && volume >= 300 && !comp.includes('high')) return cpc && cpc <= 6000 ? 'Cả hai' : 'SEO trước';
  if (row.commercialIntent >= 60 && cpc > 0 && cpc <= 5000 && !comp.includes('high')) return 'Ads thử';
  if (hasConversion) return 'Ads thử';
  if (score >= 65) return 'SEO trước';
  if (volume < 30) return 'Theo dõi';
  return 'Theo dõi';
}

function actionFor(reco: GoogleAdsRecommendation, row: GoogleAdsKeywordImportRow, sc?: SearchConsoleQuery) {
  if (reco === 'Cả hai') return 'Tối ưu landing page, thêm liên kết nội bộ rồi chạy Ads thử với ngân sách nhỏ.';
  if (reco === 'SEO trước') {
    if (sc && sc.position >= 11 && sc.position <= 20) return 'SEO trước vì vị trí đang 11-20 và volume tốt; bổ sung nội dung, FAQ và liên kết nội bộ.';
    return 'Viết hoặc cập nhật nội dung hỗ trợ danh mục, thêm sản phẩm hoặc dự án thực tế cho cụm này.';
  }
  if (reco === 'Ads thử') return 'Chạy Ads thử vì CPC tương đối thấp hoặc ý định mua hàng rõ; theo dõi chuyển đổi.';
  if (reco === 'Không ưu tiên') return 'Không chạy Ads lúc này vì chi phí hoặc cạnh tranh cao; tối ưu trang đích trước.';
  return 'Theo dõi thêm vì dữ liệu còn ít; chưa nên đổi slug hoặc title mạnh.';
}

function reasonFor(row: GoogleAdsKeywordImportRow, sc?: SearchConsoleQuery) {
  const parts = [
    'Volume ' + (row.avg_monthly_searches || 0),
    'CPC/giá thầu ' + (row.cpc || row.high_top_of_page_bid || row.low_top_of_page_bid || 0),
    'Cạnh tranh ' + normalizeCompetition(row.competition, row.competition_index),
    'Ưu tiên ngành ' + row.businessPriority,
  ];
  if (sc) parts.push('Search Console vị trí ' + sc.position + ', ' + sc.impressions + ' lượt hiển thị');
  return parts.join(' · ');
}

function opportunityScore(row: GoogleAdsKeywordImportRow, maxVolume: number, sc?: SearchConsoleQuery) {
  const volumeScore = maxVolume ? Math.min(32, ((row.avg_monthly_searches || 0) / maxVolume) * 32) : 0;
  const businessScore = row.businessPriority * 0.25;
  const intentScore = row.commercialIntent * 0.16;
  const comp = competitionScore(row.competition, row.competition_index);
  const scScore = sc ? (sc.position >= 4 && sc.position <= 20 ? 15 : sc.impressions > 100 ? 10 : 5) : 0;
  const cpc = row.cpc || row.high_top_of_page_bid || row.low_top_of_page_bid || 0;
  const cpcScore = cpc > 0 ? (cpc <= 5000 ? 10 : cpc <= 10000 ? 6 : 2) : 4;
  return Math.max(0, Math.min(100, Math.round(volumeScore + businessScore + intentScore + comp + scScore + cpcScore)));
}

export function parseGoogleAdsImport(text: string): GoogleAdsKeywordImportRow[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headerIndex = findHeaderIndex(lines);
  if (headerIndex < 0) return [];
  const delimiter = detectDelimiterFromLine(lines[headerIndex]);
  const rawHeaders = parseDelimitedLine(lines[headerIndex], delimiter);
  const headers = rawHeaders.map((header) => headerMap[headerKey(header)]);
  const monthlyIndexes = rawHeaders.map((header, index) => ({ header, index, key: headerKey(header) })).filter((item) => item.key.startsWith('searches_'));
  const rows = new Map<string, GoogleAdsKeywordImportRow>();

  lines.slice(headerIndex + 1).forEach((line, index) => {
    const cells = parseDelimitedLine(line, delimiter);
    const raw: Record<string, unknown> = {};
    cells.forEach((cell, cellIndex) => {
      const key = headers[cellIndex];
      if (key) raw[key] = cell;
    });
    const keyword = String(raw.keyword || '').trim();
    if (!keyword) return;
    const monthlySearches: Record<string, number | null> = {};
    monthlyIndexes.forEach(({ header, index: cellIndex }) => {
      monthlySearches[header.replace(/^Searches:\s*/i, '')] = parseNumber(cells[cellIndex]) ?? null;
    });
    const cluster = businessCluster(keyword);
    const row: GoogleAdsKeywordImportRow = {
      id: 'ads-' + normalizeText(keyword).replace(/\s+/g, '-') + '-' + index,
      keyword,
      avg_monthly_searches: parseNumber(raw.avg_monthly_searches),
      competition: normalizeCompetition(raw.competition, parseNumber(raw.competition_index)),
      competition_index: parseNumber(raw.competition_index),
      low_top_of_page_bid: parseNumber(raw.low_top_of_page_bid),
      high_top_of_page_bid: parseNumber(raw.high_top_of_page_bid),
      cpc: parseNumber(raw.cpc),
      currency: raw.currency ? String(raw.currency) : undefined,
      ad_impression_share: parseNumber(raw.ad_impression_share),
      organic_impression_share: parseNumber(raw.organic_impression_share),
      organic_average_position: parseNumber(raw.organic_average_position),
      monthlySearches: Object.keys(monthlySearches).length ? monthlySearches : undefined,
      campaign: raw.campaign ? String(raw.campaign) : undefined,
      ad_group: raw.ad_group ? String(raw.ad_group) : undefined,
      clicks: parseNumber(raw.clicks),
      impressions: parseNumber(raw.impressions),
      ctr: parseNumber(raw.ctr),
      cost: parseNumber(raw.cost),
      conversions: parseNumber(raw.conversions),
      conversion_rate: parseNumber(raw.conversion_rate),
      cluster: cluster.cluster,
      businessPriority: cluster.priority,
      commercialIntent: commercialIntent(keyword),
    };
    const hasMetric = row.avg_monthly_searches !== undefined || row.competition || row.competition_index !== undefined || row.low_top_of_page_bid !== undefined || row.high_top_of_page_bid !== undefined || row.clicks !== undefined || row.impressions !== undefined || row.cost !== undefined || row.cpc !== undefined;
    if (!hasMetric) return;
    const unique = normalizeText(keyword);
    const old = rows.get(unique);
    rows.set(unique, old ? { ...old, ...row, clicks: Number(old.clicks || 0) + Number(row.clicks || 0), impressions: Number(old.impressions || 0) + Number(row.impressions || 0), cost: Number(old.cost || 0) + Number(row.cost || 0), conversions: Number(old.conversions || 0) + Number(row.conversions || 0) } : row);
  });
  return Array.from(rows.values());
}

export function analyzeGoogleAdsImport(text: string, searchConsoleData?: SearchConsoleV7Data | null, _keywords: SeoKeyword[] = [], _clusters: SeoCluster[] = []): GoogleAdsImportData | null {
  const rows = parseGoogleAdsImport(text);
  if (!rows.length) return null;
  const maxVolume = Math.max(...rows.map((row) => row.avg_monthly_searches || 0), 1);
  const queries = searchConsoleData?.queries || [];
  const opportunities: GoogleAdsOpportunity[] = rows.map((row) => {
    const sc = findSearchConsoleMatch(row.keyword, queries);
    const score = opportunityScore(row, maxVolume, sc);
    const reco = recommendation(row, score, sc);
    return { id: 'op-' + row.id, keyword: row.keyword, cluster: row.cluster || 'Theo dõi thêm', score, recommendation: reco, reason: reasonFor(row, sc), action: actionFor(reco, row, sc), row };
  }).sort((a, b) => b.score - a.score);
  const matrix: SeoAdsKeywordMatrixRow[] = rows.map((row) => {
    const sc = findSearchConsoleMatch(row.keyword, queries);
    const op = opportunities.find((item) => item.row.id === row.id);
    return {
      id: 'matrix-' + row.id,
      keyword: row.keyword,
      cluster: row.cluster || 'Theo dõi thêm',
      searchConsolePosition: sc?.position,
      searchConsoleImpressions: sc?.impressions,
      searchConsoleClicks: sc?.clicks,
      adsSearchVolume: row.avg_monthly_searches,
      cpc: row.cpc || row.high_top_of_page_bid || row.low_top_of_page_bid,
      competition: normalizeCompetition(row.competition, row.competition_index),
      recommendation: op?.recommendation || 'Theo dõi',
      reason: op?.reason || 'Chưa đủ dữ liệu.',
    };
  }).sort((a, b) => {
    const recoWeight = (value: GoogleAdsRecommendation) => value === 'Cả hai' ? 5 : value === 'SEO trước' ? 4 : value === 'Ads thử' ? 3 : value === 'Theo dõi' ? 2 : 1;
    return recoWeight(b.recommendation) - recoWeight(a.recommendation) || Number(b.adsSearchVolume || 0) - Number(a.adsSearchVolume || 0);
  });
  const byAdGroup = new Map<string, { name: string; cost: number; conversions: number; clicks: number; impressions: number }>();
  rows.forEach((row) => {
    const name = row.ad_group || row.campaign || 'Chưa phân nhóm';
    const old = byAdGroup.get(name) || { name, cost: 0, conversions: 0, clicks: 0, impressions: 0 };
    old.cost += Number(row.cost || 0);
    old.conversions += Number(row.conversions || 0);
    old.clicks += Number(row.clicks || 0);
    old.impressions += Number(row.impressions || 0);
    byAdGroup.set(name, old);
  });
  const summary: GoogleAdsImportSummary = {
    keywordCount: rows.length,
    totalSearchVolume: sum(rows.map((row) => row.avg_monthly_searches)),
    averageCpc: average(rows.map((row) => row.cpc || row.high_top_of_page_bid || row.low_top_of_page_bid)),
    averageCompetitionIndex: average(rows.map((row) => row.competition_index)),
    totalClicks: sum(rows.map((row) => row.clicks)),
    totalImpressions: sum(rows.map((row) => row.impressions)),
    totalCost: sum(rows.map((row) => row.cost)),
    totalConversions: sum(rows.map((row) => row.conversions)),
    hasAdsPerformance: rows.some((row) => row.clicks !== undefined || row.impressions !== undefined || row.cost !== undefined || row.conversions !== undefined),
    lastUpdated: new Date().toISOString(),
  };
  const sortedVolume = [...rows].sort((a, b) => Number(b.avg_monthly_searches || 0) - Number(a.avg_monthly_searches || 0));
  const avgCpcValue = summary.averageCpc || 0;
  return {
    source: 'import',
    lastUpdated: summary.lastUpdated,
    rows,
    summary,
    topVolume: sortedVolume.slice(0, 10),
    lowCpcGoodVolume: rows.filter((row) => Number(row.avg_monthly_searches || 0) >= 100 && Number(row.cpc || row.high_top_of_page_bid || row.low_top_of_page_bid || 0) > 0 && (!avgCpcValue || Number(row.cpc || row.high_top_of_page_bid || row.low_top_of_page_bid || 0) <= avgCpcValue)).sort((a, b) => Number(b.avg_monthly_searches || 0) - Number(a.avg_monthly_searches || 0)).slice(0, 10),
    lowCompetition: rows.filter((row) => !normalizeCompetition(row.competition, row.competition_index).toLowerCase().includes('high')).sort((a, b) => Number(b.avg_monthly_searches || 0) - Number(a.avg_monthly_searches || 0)).slice(0, 10),
    highCommercial: rows.filter((row) => row.commercialIntent >= 60).sort((a, b) => b.commercialIntent - a.commercialIntent).slice(0, 10),
    shouldSeo: opportunities.filter((item) => item.recommendation === 'SEO trước' || item.recommendation === 'Cả hai').slice(0, 10),
    shouldAds: opportunities.filter((item) => item.recommendation === 'Ads thử' || item.recommendation === 'Cả hai').slice(0, 10),
    shouldWatch: opportunities.filter((item) => item.recommendation === 'Theo dõi' || item.recommendation === 'Không ưu tiên').slice(0, 10),
    wasteKeywords: rows.filter((row) => Number(row.cost || 0) > 0 && Number(row.conversions || 0) === 0 && Number(row.clicks || 0) >= 10).slice(0, 10),
    lowCtrKeywords: rows.filter((row) => Number(row.impressions || 0) >= 200 && Number(row.clicks || 0) / Math.max(1, Number(row.impressions || 0)) < 0.01).slice(0, 10),
    highCpcKeywords: rows.filter((row) => Number(row.cpc || row.high_top_of_page_bid || row.low_top_of_page_bid || 0) > Math.max(10000, (avgCpcValue || 0) * 1.5)).slice(0, 10),
    goodConversionKeywords: rows.filter((row) => Number(row.conversions || 0) > 0).sort((a, b) => Number(b.conversions || 0) - Number(a.conversions || 0)).slice(0, 10),
    highImpressionLowClickKeywords: rows.filter((row) => Number(row.impressions || 0) >= 500 && Number(row.clicks || 0) <= 5).slice(0, 10),
    adGroupsToOptimize: Array.from(byAdGroup.values()).filter((group) => group.cost > 0 || group.impressions > 0).map((group) => ({ ...group, reason: group.cost > 0 && group.conversions === 0 ? 'Tốn chi phí nhưng chưa có chuyển đổi.' : group.impressions > 500 && group.clicks < 10 ? 'Hiển thị cao nhưng nhấp thấp.' : 'Theo dõi thêm.' })).slice(0, 8),
    opportunities,
    matrix,
  };
}

function rowsToGoogleAdsText(rows: GoogleAdsKeywordImportRow[]) {
  const headers = [
    'Keyword',
    'Currency',
    'Avg. monthly searches',
    'Competition',
    'Competition (indexed value)',
    'Top of page bid (low range)',
    'Top of page bid (high range)',
    'CPC',
    'Clicks',
    'Impressions',
    'CTR',
    'Cost',
    'Conversions',
    'Conversion rate',
    'Campaign',
    'Ad group',
  ];
  const escapeCell = (value: unknown) => String(value ?? '').replace(/\r?\n/g, ' ').replace(/\t/g, ' ');
  const lines = rows.map((row) => [
    row.keyword,
    row.currency,
    row.avg_monthly_searches,
    row.competition,
    row.competition_index,
    row.low_top_of_page_bid,
    row.high_top_of_page_bid,
    row.cpc,
    row.clicks,
    row.impressions,
    row.ctr,
    row.cost,
    row.conversions,
    row.conversion_rate,
    row.campaign,
    row.ad_group,
  ].map(escapeCell).join('\t'));
  return [headers.join('\t'), ...lines].join('\n');
}

function normalizeGoogleAdsRow(row: Partial<GoogleAdsKeywordImportRow>, index: number): GoogleAdsKeywordImportRow | null {
  const keyword = String(row.keyword || '').trim();
  if (!keyword) return null;
  const cluster = businessCluster(keyword);
  return {
    id: row.id || 'ads-' + normalizeGoogleAdsKeyword(keyword).replace(/\s+/g, '-') + '-' + index,
    keyword,
    avg_monthly_searches: row.avg_monthly_searches,
    competition: row.competition || normalizeCompetition(row.competition, row.competition_index),
    competition_index: row.competition_index,
    low_top_of_page_bid: row.low_top_of_page_bid,
    high_top_of_page_bid: row.high_top_of_page_bid,
    cpc: row.cpc,
    currency: row.currency,
    ad_impression_share: row.ad_impression_share,
    organic_impression_share: row.organic_impression_share,
    organic_average_position: row.organic_average_position,
    monthlySearches: row.monthlySearches,
    campaign: row.campaign,
    ad_group: row.ad_group,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    cost: row.cost,
    conversions: row.conversions,
    conversion_rate: row.conversion_rate,
    cluster: row.cluster || cluster.cluster,
    businessPriority: Number(row.businessPriority || cluster.priority),
    commercialIntent: Number(row.commercialIntent || commercialIntent(keyword)),
  };
}

export function analyzeGoogleAdsRows(rows: GoogleAdsKeywordImportRow[], searchConsoleData?: SearchConsoleV7Data | null, keywords: SeoKeyword[] = [], clusters: SeoCluster[] = []): GoogleAdsImportData | null {
  const cleanRows = rows
    .map((row, index) => normalizeGoogleAdsRow(row, index))
    .filter((row): row is GoogleAdsKeywordImportRow => Boolean(row));
  if (!cleanRows.length) return null;
  return analyzeGoogleAdsImport(rowsToGoogleAdsText(cleanRows), searchConsoleData, keywords, clusters);
}

function normalizeSources(value: unknown): GoogleAdsImportSource[] {
  if (!Array.isArray(value)) return [];
  const sources: GoogleAdsImportSource[] = [];
  value.forEach((item) => {
    const source = item as Partial<GoogleAdsImportSource>;
    if (!source.importedAt) return;
    sources.push({
      fileName: source.fileName,
      importedAt: source.importedAt,
      rowCount: Number(source.rowCount || 0),
      mode: source.mode === 'replace' ? 'replace' : 'merge',
      addedCount: source.addedCount,
      updatedCount: source.updatedCount,
      totalCount: source.totalCount,
    });
  });
  return sources;
}

export function normalizeGoogleAdsImportData(value: unknown): GoogleAdsImportData | null {
  if (!value || typeof value !== 'object') return null;
  const wrapper = value as { data?: unknown; rows?: unknown; items?: unknown; summary?: unknown; sources?: unknown; lastImportedAt?: string; lastUpdated?: string; fileName?: string; rowCount?: number };
  const sourceValue = wrapper.data && typeof wrapper.data === 'object' ? wrapper.data as typeof wrapper : wrapper;
  const rawRows = Array.isArray(sourceValue.rows) ? sourceValue.rows : Array.isArray(sourceValue.items) ? sourceValue.items : [];
  const rows = rawRows
    .map((row, index) => normalizeGoogleAdsRow(row as Partial<GoogleAdsKeywordImportRow>, index))
    .filter((row): row is GoogleAdsKeywordImportRow => Boolean(row));
  if (!rows.length) return null;
  const data = sourceValue as Partial<GoogleAdsImportData>;
  const fallbackSummary = data.summary as Partial<GoogleAdsImportSummary> | undefined;
  const lastUpdated = data.lastUpdated || fallbackSummary?.lastUpdated || wrapper.lastUpdated || new Date().toISOString();
  const normalized: GoogleAdsImportData = {
    source: 'import',
    lastUpdated,
    rows,
    summary: {
      keywordCount: rows.length,
      totalSearchVolume: Number(fallbackSummary?.totalSearchVolume || sum(rows.map((row) => row.avg_monthly_searches))),
      averageCpc: fallbackSummary?.averageCpc ?? average(rows.map((row) => row.cpc || row.high_top_of_page_bid || row.low_top_of_page_bid)),
      averageCompetitionIndex: fallbackSummary?.averageCompetitionIndex ?? average(rows.map((row) => row.competition_index)),
      totalClicks: Number(fallbackSummary?.totalClicks || sum(rows.map((row) => row.clicks))),
      totalImpressions: Number(fallbackSummary?.totalImpressions || sum(rows.map((row) => row.impressions))),
      totalCost: Number(fallbackSummary?.totalCost || sum(rows.map((row) => row.cost))),
      totalConversions: Number(fallbackSummary?.totalConversions || sum(rows.map((row) => row.conversions))),
      hasAdsPerformance: Boolean(fallbackSummary?.hasAdsPerformance || rows.some((row) => row.clicks !== undefined || row.impressions !== undefined || row.cost !== undefined || row.conversions !== undefined)),
      lastUpdated,
    },
    topVolume: data.topVolume || [],
    lowCpcGoodVolume: data.lowCpcGoodVolume || [],
    lowCompetition: data.lowCompetition || [],
    highCommercial: data.highCommercial || [],
    shouldSeo: data.shouldSeo || [],
    shouldAds: data.shouldAds || [],
    shouldWatch: data.shouldWatch || [],
    wasteKeywords: data.wasteKeywords || [],
    lowCtrKeywords: data.lowCtrKeywords || [],
    highCpcKeywords: data.highCpcKeywords || [],
    goodConversionKeywords: data.goodConversionKeywords || [],
    highImpressionLowClickKeywords: data.highImpressionLowClickKeywords || [],
    adGroupsToOptimize: data.adGroupsToOptimize || [],
    opportunities: data.opportunities || [],
    matrix: data.matrix || [],
    sources: normalizeSources(data.sources || wrapper.sources),
    lastImportedAt: data.lastImportedAt || wrapper.lastImportedAt || lastUpdated,
  };
  return normalized;
}

export function mergeGoogleAdsImportData(
  existing: GoogleAdsImportData | null | undefined,
  incoming: GoogleAdsImportData | null | undefined,
  mode: GoogleAdsImportMode,
  meta: { fileName?: string; rowCount?: number; importedAt?: string },
  searchConsoleData?: SearchConsoleV7Data | null,
  keywords: SeoKeyword[] = [],
  clusters: SeoCluster[] = [],
): GoogleAdsImportMergeResult | null {
  const incomingData = normalizeGoogleAdsImportData(incoming);
  if (!incomingData?.rows.length) return null;
  const existingData = normalizeGoogleAdsImportData(existing);
  const importedAt = meta.importedAt || new Date().toISOString();
  const merged = new Map<string, GoogleAdsKeywordImportRow>();

  if (mode === 'merge' && existingData?.rows.length) {
    existingData.rows.forEach((row) => {
      const key = normalizeGoogleAdsKeyword(row.keyword);
      if (key) merged.set(key, row);
    });
  }

  let addedCount = 0;
  let updatedCount = 0;
  incomingData.rows.forEach((row, index) => {
    const cleanRow = normalizeGoogleAdsRow(row, index);
    if (!cleanRow) return;
    const key = normalizeGoogleAdsKeyword(cleanRow.keyword);
    if (!key) return;
    if (merged.has(key)) updatedCount += 1;
    else addedCount += 1;
    merged.set(key, { ...merged.get(key), ...cleanRow });
  });

  const rows = Array.from(merged.values());
  const analyzed = analyzeGoogleAdsRows(rows, searchConsoleData, keywords, clusters);
  if (!analyzed) return null;
  const source: GoogleAdsImportSource = {
    fileName: meta.fileName,
    importedAt,
    rowCount: Number(meta.rowCount || incomingData.rows.length),
    mode,
    addedCount,
    updatedCount,
    totalCount: analyzed.summary.keywordCount,
  };
  const previousSources = mode === 'merge' ? existingData?.sources || [] : [];
  const data: GoogleAdsImportData = {
    ...analyzed,
    sources: [source, ...previousSources].slice(0, 20),
    lastImportedAt: importedAt,
    lastUpdated: importedAt,
    summary: { ...analyzed.summary, keywordCount: analyzed.rows.length, lastUpdated: importedAt },
  };
  return { data, source, addedCount, updatedCount, totalCount: data.summary.keywordCount };
}
