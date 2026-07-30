import type {
  GoogleAdsImportData,
  InternalLinkSuggestion,
  ProductSeoItem,
  SearchConsoleManualSummary,
  SearchConsoleQuery,
  SearchConsoleV7Data,
  SeoBlogQualityItem,
  SeoCluster,
  SeoKeyword,
  TodayTask,
} from '../types/seo';
import type { SeoWorkLogItem } from '../types/seoV11';

export type ProfessionalSeoTaskType =
  | 'Sửa title/meta/description'
  | 'Tối ưu sản phẩm'
  | 'Sửa bài viết cũ'
  | 'Viết bài mới'
  | 'Thêm internal link'
  | 'Gắn URL chính cho keyword'
  | 'Thêm FAQ'
  | 'Kiểm tra trùng từ khóa'
  | 'Theo dõi cơ hội SEO';

export type ProfessionalSeoPriority = 'Cao' | 'Trung bình' | 'Thấp';
export type ProfessionalSeoSource = 'Search Console import' | 'Google Ads import' | 'Supabase' | 'Kết hợp';

export interface ProfessionalSeoTask {
  id: string;
  type: ProfessionalSeoTaskType;
  title: string;
  url: string;
  keyword: string;
  secondaryKeywords: string[];
  reason: string;
  priority: ProfessionalSeoPriority;
  score: number;
  estimatedTime: '10 phút' | '20 phút' | '30 phút' | '60 phút';
  action: string;
  expectedResult: string;
  reindex: 'Có' | 'Không cần' | 'Theo dõi thêm';
  source: ProfessionalSeoSource;
  internalLink?: { from: string; to: string; anchor: string };
  copyText: string;
  historyStatus: 'Đã làm' | 'Chưa làm' | 'Đang theo dõi' | 'Cần sửa tiếp';
  latestHistory?: string;
  shouldRedo: 'Có' | 'Không';
  historyReason: string;
  sourceSignal: string;
}

export interface ProfessionalSeoPlan {
  sourceSummary: {
    searchConsoleUpdatedAt: string | null;
    searchConsoleKeywordCount: number;
    searchConsoleUrlCount: number;
    searchConsoleDateRanges: string[];
    searchConsoleImportTypes: string[];
    searchConsoleLatestByType: Array<{ type: string; dateRangeLabel: string; updatedAt: string; rowCount: number }>;
    activeSearchConsoleSource: string;
    performanceOverviewSource: string;
    performanceClicks: number | null;
    performanceImpressions: number | null;
    performanceCtr: number | null;
    performancePosition: number | null;
    performanceUpdatedAt: string | null;
    manualGscSummary: { hasData: boolean; range: string; clicks: number | null; impressions: number | null; ctr: number | null; position: number | null; updatedAt: string | null };
    apiQueryPageSummary: { hasData: boolean; rowCount: number; updatedAt: string | null };
    csvSummary: { hasData: boolean; source: string; clicks: number; impressions: number; ctr: number; position: number };
    googleAdsUpdatedAt: string | null;
    googleAdsKeywordCount: number;
    workLogTotal: number;
    workLogWatching: number;
    workLogNeedFix: number;
    workLogGoodSignal: number;
    workLogDueToday: number;
    workLogOverdue: number;
    usingSources: string;
    warning?: string;
  };
  today: ProfessionalSeoTask[];
  week: ProfessionalSeoTask[];
  watch: ProfessionalSeoTask[];
  alerts: string[];
}

export interface BuildProfessionalSeoPlanInput {
  searchConsole: SearchConsoleV7Data | null;
  googleAds: GoogleAdsImportData | null;
  products: ProductSeoItem[];
  blogs: SeoBlogQualityItem[];
  clusters: SeoCluster[];
  keywords: SeoKeyword[];
  tasks: TodayTask[];
  internalLinks: InternalLinkSuggestion[];
  workLogs?: SeoWorkLogItem[];
  manualSearchConsoleSummary?: SearchConsoleManualSummary | null;
}

const BUSINESS_GROUPS = [
  { name: 'Giường sắt', terms: ['giường', 'giuong', 'giường sắt', 'giuong sat', 'giường tầng', 'giuong tang'], url: '/giuong-tang-sat/' },
  { name: 'Bàn làm việc', terms: ['bàn làm việc', 'ban lam viec', 'bàn văn phòng', 'ban van phong', 'bàn nhân viên', 'ban nhan vien', 'bàn chân sắt', 'ban chan sat'], url: '/ban-lam-viec/' },
  { name: 'Bàn giám đốc', terms: ['bàn giám đốc', 'ban giam doc'], url: '/ban-giam-doc/' },
  { name: 'Trường học', terms: ['bàn học sinh', 'ban hoc sinh', 'bàn ghế học sinh', 'ban ghe hoc sinh', 'trường học', 'truong hoc', 'bảng từ', 'bang tu'], url: '/truong-hoc/' },
  { name: 'Tủ locker', terms: ['tủ locker', 'tu locker', 'locker', 'tủ văn phòng', 'tu van phong', 'tủ tài liệu', 'tu tai lieu'], url: '/tu-locker/' },
  { name: 'Ghế chân quỳ', terms: ['ghế chân quỳ', 'ghe chan quy'], url: '/ghe-chan-quy/' },
];

function stripAccent(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function cleanPath(value: unknown) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return url.pathname || '/';
  } catch {
    return raw.startsWith('/') ? raw : '/' + raw.replace(/^\/+/, '');
  }
}

function slugify(value: unknown) {
  return stripAccent(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
}

function includesAny(text: unknown, terms: string[]) {
  const clean = stripAccent(text);
  return terms.some((term) => clean.includes(stripAccent(term)));
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function detectBusinessGroup(text: unknown) {
  return BUSINESS_GROUPS.find((group) => includesAny(text, group.terms));
}

function businessScore(text: unknown) {
  return detectBusinessGroup(text) ? 15 : 0;
}

function fallbackUrl(keyword: string) {
  return detectBusinessGroup(keyword)?.url || `/${slugify(keyword)}/`;
}

function priority(score: number): ProfessionalSeoPriority {
  if (score >= 75) return 'Cao';
  if (score >= 45) return 'Trung bình';
  return 'Thấp';
}

function positionOpportunity(position: number) {
  if (!Number.isFinite(position) || position <= 0) {
    return {
      band: 'unknown' as const,
      score: 0,
      maxTodayScore: 60,
      label: 'chưa rõ vị trí',
      todayFit: false,
    };
  }
  if (position >= 4 && position <= 10) {
    return {
      band: 'ctr' as const,
      score: 28,
      maxTodayScore: 92,
      label: 'vị trí 4-10, cơ hội tối ưu CTR/title/meta',
      todayFit: true,
    };
  }
  if (position > 10 && position <= 30) {
    return {
      band: 'growth' as const,
      score: 32,
      maxTodayScore: 90,
      label: 'vị trí 10-30, cơ hội thêm internal link/FAQ/nội dung',
      todayFit: true,
    };
  }
  if (position > 30 && position <= 50) {
    return {
      band: 'medium' as const,
      score: 10,
      maxTodayScore: 68,
      label: 'vị trí 31-50, ưu tiên trung bình',
      todayFit: false,
    };
  }
  if (position > 50) {
    return {
      band: 'far' as const,
      score: -18,
      maxTodayScore: 42,
      label: 'vị trí trên 50, chỉ nên theo dõi trước',
      todayFit: false,
    };
  }
  return {
    band: 'top' as const,
    score: 6,
    maxTodayScore: 72,
    label: 'đang gần top đầu, ưu tiên giữ tín hiệu',
    todayFit: false,
  };
}

function hasCtrOpportunity(row: Pick<SearchConsoleQuery, 'impressions' | 'ctr' | 'position'>) {
  return row.impressions >= 50 && row.ctr < 2 && row.position >= 4 && row.position <= 30;
}

const PLAN_SEARCH_CONSOLE_SCAN_LIMIT = 2000;
const PLAN_SEARCH_CONSOLE_TASK_LIMIT = 1000;
const PLAN_SEARCH_CONSOLE_PAGE_LIMIT = 500;
const PLAN_GOOGLE_ADS_ROW_LIMIT = 1000;

function summarizeSearchConsoleForPlan(data: SearchConsoleV7Data | null): SearchConsoleV7Data | null {
  if (!data) return null;
  const scannedQueries = (data.queries || []).slice(0, PLAN_SEARCH_CONSOLE_SCAN_LIMIT);
  const priorityRows = scannedQueries
    .filter((row) => row.impressions > 0 && (
      (row.position >= 4 && row.position <= 30)
      || hasCtrOpportunity(row)
      || Boolean(row.page)
      || businessScore(row.query)
    ))
    .sort((a, b) => {
      const scoreA = (hasCtrOpportunity(a) ? 100000 : 0) + (a.position >= 4 && a.position <= 30 ? 50000 : 0) + a.impressions + a.clicks * 20;
      const scoreB = (hasCtrOpportunity(b) ? 100000 : 0) + (b.position >= 4 && b.position <= 30 ? 50000 : 0) + b.impressions + b.clicks * 20;
      return scoreB - scoreA;
    });
  const byKey = new Map<string, SearchConsoleQuery>();
  priorityRows.forEach((row) => {
    const key = stripAccent(row.query) + '|' + cleanPath(row.page);
    if (!byKey.has(key)) byKey.set(key, row);
  });
  scannedQueries
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.position - b.position)
    .forEach((row) => {
      if (byKey.size >= PLAN_SEARCH_CONSOLE_TASK_LIMIT) return;
      const key = stripAccent(row.query) + '|' + cleanPath(row.page);
      if (!byKey.has(key)) byKey.set(key, row);
    });

  return {
    ...data,
    queries: Array.from(byKey.values()).slice(0, PLAN_SEARCH_CONSOLE_TASK_LIMIT),
    pages: (data.pages || []).slice(0, PLAN_SEARCH_CONSOLE_PAGE_LIMIT),
  };
}

function summarizeGoogleAdsForPlan(data: GoogleAdsImportData | null): GoogleAdsImportData | null {
  if (!data) return null;
  const rows = [...(data.rows || [])]
    .sort((a, b) => Number(b.avg_monthly_searches || 0) - Number(a.avg_monthly_searches || 0))
    .slice(0, PLAN_GOOGLE_ADS_ROW_LIMIT);
  return { ...data, rows };
}

function timeByTask(score: number, type: ProfessionalSeoTaskType): ProfessionalSeoTask['estimatedTime'] {
  if (type === 'Gắn URL chính cho keyword' || type === 'Thêm internal link') return '10 phút';
  if (type === 'Viết bài mới') return '60 phút';
  if (score >= 80) return '30 phút';
  return '20 phút';
}

function keyForTask(task: Pick<ProfessionalSeoTask, 'type' | 'url' | 'keyword'>) {
  return `${task.type}|${cleanPath(task.url)}|${stripAccent(task.keyword)}`;
}

function taskCopyText(task: Omit<ProfessionalSeoTask, 'copyText'>) {
  const internal = task.internalLink
    ? `\nInternal link: từ ${task.internalLink.from} đến ${task.internalLink.to}, anchor "${task.internalLink.anchor}"`
    : '';
  return [
    task.title,
    `Loại việc: ${task.type}`,
    `URL: ${task.url || 'Chưa có URL chính'}`,
    `Keyword chính: ${task.keyword || 'Chưa xác định'}`,
    `Keyword phụ: ${task.secondaryKeywords.join(', ') || '-'}`,
    `Lý do: ${task.reason}`,
    `Ưu tiên: ${task.priority} (${task.score}/100)`,
    `Thời gian: ${task.estimatedTime}`,
    `Hành động: ${task.action}`,
    `Kết quả kỳ vọng: ${task.expectedResult}`,
    `Index lại GSC: ${task.reindex}`,
    `Nguồn tín hiệu: ${task.sourceSignal}`,
    `Nguồn: ${task.source}`,
    `Lịch sử: ${task.historyStatus}`,
    task.latestHistory ? `Nhật ký gần nhất: ${task.latestHistory}` : '',
    `Có cần làm lại không: ${task.shouldRedo}`,
    `Lý do dựa trên nhật ký: ${task.historyReason}`,
    internal.trim(),
  ].filter(Boolean).join('\n');
}

type ProfessionalSeoTaskDraft = Omit<ProfessionalSeoTask, 'copyText' | 'historyStatus' | 'latestHistory' | 'shouldRedo' | 'historyReason' | 'sourceSignal'>
  & Partial<Pick<ProfessionalSeoTask, 'historyStatus' | 'latestHistory' | 'shouldRedo' | 'historyReason' | 'sourceSignal'>>;

function buildTask(task: ProfessionalSeoTaskDraft): ProfessionalSeoTask {
  const enriched = {
    ...task,
    historyStatus: task.historyStatus || 'Chưa làm',
    latestHistory: task.latestHistory,
    shouldRedo: task.shouldRedo || 'Có',
    historyReason: task.historyReason || 'Chưa thấy nhật ký SEO v11 trùng URL/keyword.',
    sourceSignal: task.sourceSignal || 'Tổng quan: chưa có dữ liệu GSC · Chi tiết: Supabase hiện có',
  } satisfies Omit<ProfessionalSeoTask, 'copyText'>;
  return { ...enriched, copyText: taskCopyText(enriched) };
}

function findKnownKeyword(keyword: string, keywords: SeoKeyword[]) {
  const clean = stripAccent(keyword);
  return keywords.find((item) => stripAccent(item.keyword) === clean || clean.includes(stripAccent(item.keyword)) || stripAccent(item.keyword).includes(clean));
}

function findRelatedProduct(url: string, keyword: string, products: ProductSeoItem[]) {
  const cleanUrl = cleanPath(url);
  return products.find((product) => cleanUrl.includes(`/san-pham/${product.slug}`))
    || products.find((product) => includesAny(`${product.name} ${product.slug} ${product.category || ''} ${product.parent_slug || ''}`, [keyword]));
}

function findRelatedBlog(url: string, keyword: string, blogs: SeoBlogQualityItem[]) {
  const cleanUrl = cleanPath(url);
  return blogs.find((blog) => cleanUrl.includes(`/tin-tuc/${blog.slug}`))
    || blogs.find((blog) => includesAny(`${blog.title} ${blog.slug} ${blog.excerpt || ''}`, [keyword]));
}

function findInternalLink(url: string, keyword: string, links: InternalLinkSuggestion[]) {
  const cleanUrl = cleanPath(url);
  return links.find((item) => cleanPath(item.target_url) === cleanUrl || stripAccent(item.detected_keyword) === stripAccent(keyword));
}

function meaningfulKeyword(value: unknown) {
  const raw = String(value || '').trim();
  const clean = stripAccent(raw);
  if (!raw || clean === '-' || clean.includes('chua xac dinh') || clean.includes('khong ro')) return '';
  return raw;
}

function slugFromUrl(url: string) {
  const cleanUrl = cleanPath(url).replace(/\/+$/, '');
  return cleanUrl.split('/').filter(Boolean).pop() || '';
}

function keywordFromSlug(url: string) {
  const replacements: Record<string, string> = {
    ban: 'bàn',
    ghe: 'ghế',
    chan: 'chân',
    quy: 'quỳ',
    luoi: 'lưới',
    lung: 'lưng',
    cao: 'cao',
    thap: 'thấp',
    sat: 'sắt',
    go: 'gỗ',
    tu: 'tủ',
    locker: 'locker',
    van: 'văn',
    phong: 'phòng',
    hoc: 'học',
    sinh: 'sinh',
    truong: 'trường',
    tang: 'tầng',
    lam: 'làm',
    viec: 'việc',
  };
  const words = slugFromUrl(url)
    .replace(/-?hn\d+$/i, '')
    .split('-')
    .filter((word) => word && !/^\d+$/.test(word));
  return words.map((word) => replacements[word] || word).join(' ').trim();
}

function textMatchScore(needle: string, haystack: string) {
  const terms = stripAccent(needle).split(/[^a-z0-9]+/).filter((term) => term.length >= 3);
  const cleanHaystack = stripAccent(haystack);
  if (!terms.length || !cleanHaystack) return 0;
  return terms.reduce((total, term) => total + (cleanHaystack.includes(term) ? 1 : 0), 0) / terms.length;
}

function bestKeywordPlannerMatch(context: string, rows: GoogleAdsImportData['rows']) {
  return [...rows]
    .map((row) => ({
      row,
      score: textMatchScore(context, `${row.keyword} ${row.cluster || ''} ${row.parentCluster || ''} ${row.subCluster || ''}`),
    }))
    .filter((item) => item.score >= 0.55)
    .sort((a, b) => b.score - a.score || (b.row.avg_monthly_searches || 0) - (a.row.avg_monthly_searches || 0))[0]?.row.keyword || '';
}

function inferKeywordForUrl(url: string, input: BuildProfessionalSeoPlanInput): { keyword: string; source: string } {
  const cleanUrl = cleanPath(url);
  if (!cleanUrl) return { keyword: '', source: '' };
  const hasQueryPage = (input.searchConsole?.imports || []).some((item) => item.type === 'query-page');
  const exactScRows = (input.searchConsole?.queries || [])
    .filter((row) => meaningfulKeyword(row.query) && row.page && cleanPath(row.page) === cleanUrl)
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
  if (hasQueryPage && exactScRows[0]) return { keyword: exactScRows[0].query, source: 'Search Console Query+Page' };
  if (exactScRows[0]) return { keyword: exactScRows[0].query, source: 'Search Console Queries' };

  const looseScRows = (input.searchConsole?.queries || [])
    .filter((row) => meaningfulKeyword(row.query) && row.page && (cleanPath(row.page).includes(cleanUrl) || cleanUrl.includes(cleanPath(row.page))))
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
  if (looseScRows[0]) return { keyword: looseScRows[0].query, source: 'Search Console URL match' };

  const product = input.products.find((item) => cleanUrl.includes(`/san-pham/${item.slug}`));
  if (product) return { keyword: meaningfulKeyword(product.name) || meaningfulKeyword(product.category) || keywordFromSlug(cleanUrl), source: 'Supabase products' };

  const blog = input.blogs.find((item) => cleanUrl.includes(`/tin-tuc/${item.slug}`));
  if (blog) return { keyword: meaningfulKeyword(blog.title) || keywordFromSlug(cleanUrl), source: 'Supabase blog_posts' };

  const cluster = input.clusters.find((item) => {
    const mainUrl = cleanPath(item.main_url);
    return mainUrl && (cleanUrl === mainUrl || cleanUrl.includes(mainUrl) || mainUrl.includes(cleanUrl));
  });
  if (cluster) return { keyword: meaningfulKeyword(cluster.name) || keywordFromSlug(cleanUrl), source: 'Supabase category/cluster' };

  const mappedKeyword = input.keywords.find((item) => {
    const targetUrl = cleanPath(item.target_url);
    return targetUrl && (cleanUrl === targetUrl || cleanUrl.includes(targetUrl) || targetUrl.includes(cleanUrl));
  });
  if (mappedKeyword?.keyword) return { keyword: mappedKeyword.keyword, source: 'Supabase seo_keywords' };

  const slugKeyword = keywordFromSlug(cleanUrl);
  const plannerKeyword = bestKeywordPlannerMatch(slugKeyword, input.googleAds?.rows || []);
  if (plannerKeyword) return { keyword: plannerKeyword, source: 'Keyword Planner' };

  return { keyword: slugKeyword, source: slugKeyword ? 'URL slug' : '' };
}

function resolveWorkLogKeyword(log: SeoWorkLogItem, input: BuildProfessionalSeoPlanInput) {
  const direct = meaningfulKeyword(log.keyword);
  if (direct) return { keyword: direct, source: 'Nhật ký SEO' };
  return inferKeywordForUrl(log.url, input);
}

function duplicateQueries(queries: SearchConsoleQuery[]) {
  const map = new Map<string, SearchConsoleQuery[]>();
  queries.forEach((row) => {
    const key = stripAccent(row.query);
    if (!key || !row.page) return;
    const rows = map.get(key) || [];
    rows.push(row);
    map.set(key, rows);
  });
  return map;
}

function bestRow(rows: SearchConsoleQuery[]) {
  return [...rows].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions || a.position - b.position)[0];
}

function importTimestamp(value: { updatedAt?: string; importedAt?: string }) {
  return String(value.updatedAt || value.importedAt || '');
}

function csvOverviewSummary(data: SearchConsoleV7Data | null) {
  if (!data) return { hasData: false, source: 'chưa có', clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const rows = data.pages.length ? data.pages : data.queries;
  const source = data.pages.length ? 'Pages.csv' : data.queries.length ? 'Queries.csv' : 'chưa có';
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const positionBase = rows.reduce((sum, row) => sum + Math.max(row.impressions, 1), 0);
  const weightedPosition = rows.reduce((sum, row) => sum + row.position * Math.max(row.impressions, 1), 0);
  return {
    hasData: Boolean(rows.length),
    source,
    clicks,
    impressions,
    ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
    position: positionBase ? Number((weightedPosition / positionBase).toFixed(1)) : 0,
  };
}

function apiQueryPageMeta(data: SearchConsoleV7Data | null) {
  return (data?.imports || [])
    .filter((item) => item.type === 'query-page' && item.source === 'search-console-api')
    .sort((a, b) => importTimestamp(b).localeCompare(importTimestamp(a)))[0];
}

function choosePerformanceOverview(input: BuildProfessionalSeoPlanInput, data: SearchConsoleV7Data | null) {
  const apiMeta = apiQueryPageMeta(data);
  const manual = input.manualSearchConsoleSummary || null;
  const csv = csvOverviewSummary(data);
  if (apiMeta && data?.overview) {
    return { source: 'API overview', clicks: data.overview.clicks, impressions: data.overview.impressions, ctr: data.overview.ctr, position: data.overview.position, updatedAt: data.overview.lastUpdated || apiMeta.updatedAt || apiMeta.importedAt || null, csv, apiMeta };
  }
  if (manual && (manual.clicks !== null || manual.impressions !== null || manual.ctr !== null || manual.position !== null)) {
    return { source: 'GSC nhập tay', clicks: manual.clicks, impressions: manual.impressions, ctr: manual.ctr, position: manual.position, updatedAt: manual.updatedAt || manual.checkedAt || null, csv, apiMeta };
  }
  if (csv.hasData) return { source: 'CSV summary', clicks: csv.clicks, impressions: csv.impressions, ctr: csv.ctr, position: csv.position, updatedAt: data?.overview.lastUpdated || null, csv, apiMeta };
  return { source: 'chưa có dữ liệu tổng quan', clicks: null, impressions: null, ctr: null, position: null, updatedAt: null, csv, apiMeta };
}

function detailSourceLabel(data: SearchConsoleV7Data | null, googleAds: GoogleAdsImportData | null) {
  const hasApiQueryPage = Boolean(apiQueryPageMeta(data));
  const hasQueryPage = (data?.imports || []).some((item) => item.type === 'query-page');
  if (hasApiQueryPage) return 'Chi tiết: Search Console API Query+Page';
  if (hasQueryPage) return 'Chi tiết: Search Console CSV Query+Page';
  if (data?.queries.length || data?.pages.length) return 'Chi tiết: Search Console CSV';
  if (googleAds?.summary.keywordCount) return 'Thị trường: Google Ads Keyword Planner';
  return 'Chi tiết: Supabase products/blog/work log';
}

function sourceSignal(input: BuildProfessionalSeoPlanInput) {
  const overview = choosePerformanceOverview(input, input.searchConsole);
  const overviewLabel = overview.source === 'GSC nhập tay'
    ? `Tổng quan: GSC nhập tay (${overview.clicks ?? '-'} click, ${overview.impressions ?? '-'} impression, CTR ${overview.ctr ?? '-'}%, position ${overview.position ?? '-'})`
    : overview.source === 'API overview'
      ? `Tổng quan: API overview (${overview.clicks ?? '-'} click, ${overview.impressions ?? '-'} impression, CTR ${overview.ctr ?? '-'}%, position ${overview.position ?? '-'})`
      : overview.source === 'CSV summary'
        ? `Tổng quan: CSV summary ${overview.csv.source}`
        : 'Tổng quan: chưa có dữ liệu GSC';
  return [overviewLabel, detailSourceLabel(input.searchConsole, input.googleAds), input.workLogs?.length ? 'Lịch sử: Nhật ký SEO v11' : 'Lịch sử: chưa có nhật ký'].join(' · ');
}

function overviewContextText(input: BuildProfessionalSeoPlanInput) {
  const overview = choosePerformanceOverview(input, input.searchConsole);
  if (overview.source === 'GSC nhập tay') return `Tổng quan GSC nhập tay đang là ${overview.clicks ?? '-'} click, ${overview.impressions ?? '-'} impression, CTR ${overview.ctr ?? '-'}%, position ${overview.position ?? '-'}; AI không lấy click 0 từ Pages.csv làm tổng toàn site. `;
  if (overview.source === 'API overview') return `Tổng quan API đang là ${overview.clicks ?? '-'} click, ${overview.impressions ?? '-'} impression, CTR ${overview.ctr ?? '-'}%, position ${overview.position ?? '-'}. `;
  if (overview.source === 'CSV summary') return `Tổng quan tạm từ ${overview.csv.source}; nếu đây là Pages.csv thì chỉ xem là dữ liệu chi tiết theo URL. `;
  return '';
}

function latestSearchConsoleImports(data: SearchConsoleV7Data | null) {
  const map = new Map<string, { type: string; dateRangeLabel: string; updatedAt: string; rowCount: number }>();
  (data?.imports || []).forEach((item) => {
    const current = map.get(item.type);
    if (!current || importTimestamp(item) > current.updatedAt) {
      map.set(item.type, {
        type: item.type,
        dateRangeLabel: item.dateRangeLabel,
        updatedAt: importTimestamp(item),
        rowCount: item.rowCount,
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function isShortSearchConsoleRange(range: string) {
  const clean = stripAccent(range);
  return clean.includes('7 ngay') || clean.includes('28 ngay') || clean === '7d' || clean === '28d';
}

function workLogTime(log: SeoWorkLogItem) {
  return new Date(log.date || log.updatedAt || log.createdAt).getTime() || 0;
}

function latestWorkLog(logs: SeoWorkLogItem[], task: Pick<ProfessionalSeoTask, 'url' | 'keyword' | 'type'>) {
  const url = cleanPath(task.url);
  const keyword = stripAccent(task.keyword);
  const type = stripAccent(task.type);
  return [...logs]
    .filter((log) => {
      const logUrl = cleanPath(log.url);
      const logKeyword = stripAccent(log.keyword || log.title || log.description);
      const logType = stripAccent(log.type || log.title);
      const urlMatch = Boolean(url && logUrl && (url === logUrl || url.includes(logUrl) || logUrl.includes(url)));
      const keywordMatch = Boolean(keyword && logKeyword && (keyword === logKeyword || logKeyword.includes(keyword) || keyword.includes(logKeyword)));
      const typeMatch = Boolean(type && logType && (type.includes(logType) || logType.includes(type) || includesAny(type + ' ' + logType, ['title', 'meta', 'faq', 'internal link', 'submit index', 'trung keyword'])));
      return (urlMatch || keywordMatch) && typeMatch;
    })
    .sort((a, b) => workLogTime(b) - workLogTime(a))[0];
}

function latestWorkLogByTarget(logs: SeoWorkLogItem[], url: string, keyword: string) {
  const cleanUrl = cleanPath(url);
  const cleanKeyword = stripAccent(keyword);
  return [...logs]
    .filter((log) => {
      const logUrl = cleanPath(log.url);
      const logKeyword = stripAccent(log.keyword || log.title || log.description);
      return Boolean(
        (cleanUrl && logUrl && (cleanUrl === logUrl || cleanUrl.includes(logUrl) || logUrl.includes(cleanUrl)))
        || (cleanKeyword && logKeyword && (cleanKeyword === logKeyword || logKeyword.includes(cleanKeyword) || cleanKeyword.includes(logKeyword))),
      );
    })
    .sort((a, b) => workLogTime(b) - workLogTime(a))[0];
}

function workLogSummary(log: SeoWorkLogItem | undefined) {
  if (!log) return undefined;
  return `${log.date} - ${log.type} - ${log.status}`;
}

function taskHistoryStatus(log: SeoWorkLogItem | undefined): ProfessionalSeoTask['historyStatus'] {
  if (!log) return 'Chưa làm';
  if (log.status === 'Cần sửa tiếp') return 'Cần sửa tiếp';
  if (log.status === 'Đang theo dõi' || log.status === 'Đã submit index' || log.status === 'Đã index') return 'Đang theo dõi';
  return 'Đã làm';
}

function hasSearchConsoleSignal(data: SearchConsoleV7Data | null, url: string, keyword: string) {
  const cleanUrl = cleanPath(url);
  const cleanKeyword = stripAccent(keyword);
  const row = [...(data?.queries || []), ...(data?.pages || [])].find((item) => {
    const itemUrl = cleanPath('page' in item ? item.page : '');
    const itemKeyword = stripAccent('query' in item ? item.query : '');
    return Boolean((cleanUrl && itemUrl && cleanUrl === itemUrl) || (cleanKeyword && itemKeyword && cleanKeyword === itemKeyword));
  });
  return row ? { impressions: row.impressions, clicks: row.clicks, ctr: row.ctr, position: row.position } : null;
}

function enrichTasksWithWorkLogs(tasks: ProfessionalSeoTask[], input: BuildProfessionalSeoPlanInput) {
  const logs = input.workLogs || [];
  if (!logs.length) return tasks.map((task) => buildTask(task));

  return tasks.map((task) => {
    const exact = latestWorkLog(logs, task);
    const target = exact || latestWorkLogByTarget(logs, task.url, task.keyword);
    const signal = hasSearchConsoleSignal(input.searchConsole, task.url, task.keyword);
    const completedSameWork = exact && ['Đã làm', 'Đã submit index', 'Đang theo dõi', 'Đã index', 'Có tín hiệu tốt'].includes(exact.status);
    const completedSameTarget = target && ['Đã làm', 'Đã submit index', 'Đang theo dõi', 'Đã index', 'Có tín hiệu tốt'].includes(target.status);
    const duplicateCreationTask = task.type === 'Viết bài mới' || task.type === 'Gắn URL chính cho keyword';
    const signalNeedsOptimization = signal && (hasCtrOpportunity(signal) || (signal.position >= 10 && signal.position <= 30));
    const shouldRedo: ProfessionalSeoTask['shouldRedo'] = exact?.status === 'Cần sửa tiếp'
      || signalNeedsOptimization
      ? 'Có'
      : completedSameWork || (completedSameTarget && duplicateCreationTask)
        ? 'Không'
        : 'Có';
    const historyReason = target
      ? signal
        ? `Nhật ký gần nhất là "${target.status}". Search Console hiện có ${signal.impressions} impression, CTR ${signal.ctr.toFixed(2)}%, vị trí ${signal.position.toFixed(1)} nên AI chỉ đề xuất bước phù hợp với tín hiệu mới.`
        : target.status === 'Đã submit index'
          ? 'URL/keyword đã submit index trong nhật ký nhưng chưa thấy tín hiệu Search Console trong dữ liệu import mới, nên ưu tiên theo dõi hoặc kiểm tra lại.'
          : `Có nhật ký liên quan trạng thái "${target.status}", AI tránh lặp lại việc y hệt nếu không có tín hiệu mới.`
      : 'Chưa thấy nhật ký SEO v11 trùng URL/keyword.';
    return buildTask({
      ...task,
      historyStatus: taskHistoryStatus(target),
      latestHistory: workLogSummary(target),
      shouldRedo,
      historyReason,
    });
  }).filter((task) => task.shouldRedo === 'Có' || task.historyStatus === 'Cần sửa tiếp' || task.id.startsWith('worklog-followup-'));
}

function buildWorkLogFollowUpTasks(input: BuildProfessionalSeoPlanInput) {
  const logs = input.workLogs || [];
  const today = new Date().toISOString().slice(0, 10);
  return logs
    .filter((log) => {
      const due = log.nextCheckDate && log.nextCheckDate <= today;
      return due || log.status === 'Đang theo dõi' || log.status === 'Cần sửa tiếp';
    })
    .sort((a, b) => {
      const statusScore = (value: SeoWorkLogItem) => value.status === 'Cần sửa tiếp' ? 3 : value.nextCheckDate && value.nextCheckDate <= today ? 2 : 1;
      return statusScore(b) - statusScore(a) || workLogTime(a) - workLogTime(b);
    })
    .slice(0, 8)
    .map((log, index) => {
      const inferredKeyword = resolveWorkLogKeyword(log, input);
      const keyword = inferredKeyword.keyword;
      const signal = hasSearchConsoleSignal(input.searchConsole, log.url, keyword);
      const score = clamp((log.status === 'Cần sửa tiếp' ? 80 : 62) + businessScore(`${log.targetGroup} ${keyword} ${log.url}`));
      const keywordReason = keyword && inferredKeyword.source !== 'Nhật ký SEO'
        ? ` AI suy luận keyword "${keyword}" từ ${inferredKeyword.source}.`
        : '';
      return buildTask({
        id: `worklog-followup-${index}-${slugify(log.id)}`,
        type: log.status === 'Cần sửa tiếp' ? 'Theo dõi cơ hội SEO' : 'Theo dõi cơ hội SEO',
        title: log.status === 'Cần sửa tiếp' ? `Sửa tiếp việc đã ghi: ${log.title}` : `Kiểm tra lại nhật ký SEO: ${log.title}`,
        url: cleanPath(log.url),
        keyword,
        secondaryKeywords: [],
        sourceSignal: sourceSignal(input),
        reason: signal
          ? `Nhật ký ${log.date}: ${log.type}, trạng thái ${log.status}.${keywordReason} Search Console mới: ${signal.impressions} impression, CTR ${signal.ctr.toFixed(2)}%, vị trí ${signal.position.toFixed(1)}.`
          : `Nhật ký ${log.date}: ${log.type}, trạng thái ${log.status}.${keywordReason} ${log.nextCheckDate ? 'Ngày kiểm tra lại: ' + log.nextCheckDate + '. ' : ''}Chưa thấy tín hiệu Search Console mới cho URL/keyword này.`,
        priority: priority(score),
        score,
        estimatedTime: '20 phút',
        action: log.status === 'Cần sửa tiếp'
          ? 'Mở lại URL/keyword trong nhật ký, xử lý phần còn thiếu rồi cập nhật trạng thái nhật ký.'
          : 'Kiểm tra Search Console, nếu có tín hiệu thì cập nhật nhật ký; nếu chưa có tín hiệu thì bổ sung internal link hoặc kiểm tra index.',
        expectedResult: 'Không bỏ sót việc đang theo dõi/cần sửa tiếp và không tạo task trùng việc đã hoàn thành.',
        reindex: log.status === 'Đã submit index' ? 'Theo dõi thêm' : 'Không cần',
        source: 'Kết hợp',
        historyStatus: taskHistoryStatus(log),
        latestHistory: workLogSummary(log),
        shouldRedo: 'Có',
        historyReason: log.nextCheckDate && log.nextCheckDate <= today
          ? 'Việc này đến hạn hoặc quá hạn kiểm tra lại trong Nhật ký SEO v11.'
          : `Trạng thái nhật ký là "${log.status}", AI ưu tiên theo dõi/sửa tiếp trước khi tạo việc mới.`,
      });
    });
}

function summarizeWorkLogs(logs: SeoWorkLogItem[]) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    total: logs.length,
    watching: logs.filter((item) => item.status === 'Đang theo dõi').length,
    needFix: logs.filter((item) => item.status === 'Cần sửa tiếp').length,
    goodSignal: logs.filter((item) => item.status === 'Có tín hiệu tốt').length,
    dueToday: logs.filter((item) => item.nextCheckDate === today).length,
    overdue: logs.filter((item) => item.nextCheckDate && item.nextCheckDate < today && item.status !== 'Có tín hiệu tốt').length,
  };
}

function buildSearchConsoleTasks(input: BuildProfessionalSeoPlanInput) {
  const data = input.searchConsole;
  if (!data?.queries.length && !data?.pages.length) return [];
  const taskSourceSignal = sourceSignal(input);
  const overviewContext = overviewContextText(input);
  const duplicateMap = duplicateQueries(data.queries);
  const hasQueryPage = (data.imports || []).some((item) => item.type === 'query-page');
  const tasks: ProfessionalSeoTask[] = [];

  duplicateMap.forEach((rows, key) => {
    const uniquePages = Array.from(new Set(rows.map((row) => cleanPath(row.page)).filter(Boolean)));
    if (uniquePages.length < 2) return;
    const main = bestRow(rows);
    const opportunity = positionOpportunity(main.position);
    let score = clamp(30 + opportunity.score + businessScore(main.query) + Math.min(10, main.clicks) + Math.min(15, main.impressions / 50));
    score = Math.min(score, opportunity.maxTodayScore);
    tasks.push(buildTask({
      id: `sc-duplicate-${slugify(key)}`,
      type: 'Kiểm tra trùng từ khóa',
      title: `Chọn URL chính cho query "${main.query}"`,
      url: cleanPath(main.page) || fallbackUrl(main.query),
      keyword: main.query,
      secondaryKeywords: rows.map((row) => row.query).filter((value, index, arr) => arr.indexOf(value) === index).slice(1, 4),
      sourceSignal: taskSourceSignal,
      reason: overviewContext + `Search Console cho thấy cùng query đang xuất hiện ở ${uniquePages.length} URL. URL có tín hiệu tốt nhất hiện là ${cleanPath(main.page)} với ${main.impressions} impression, ${main.clicks} click, vị trí ${main.position.toFixed(1)} (${opportunity.label}).`,
      priority: priority(score),
      score,
      estimatedTime: timeByTask(score, 'Kiểm tra trùng từ khóa'),
      action: `Giữ ${cleanPath(main.page)} làm URL chính, thêm internal link về URL này và tránh viết bài mới trùng keyword.`,
      expectedResult: 'Giảm cannibalization và dồn tín hiệu SEO về một URL chính.',
      reindex: 'Không cần',
      source: 'Search Console import',
    }));
  });

  data.queries.forEach((row, index) => {
    const known = findKnownKeyword(row.query, input.keywords);
    const url = cleanPath(row.page || known?.target_url || fallbackUrl(row.query));
    const product = findRelatedProduct(url, row.query, input.products);
    const blog = findRelatedBlog(url, row.query, input.blogs);
    const link = findInternalLink(url, row.query, input.internalLinks);
    const opportunity = positionOpportunity(row.position);
    const ctrLow = hasCtrOpportunity(row);
    const rawCtrLow = row.impressions >= 50 && row.ctr < 2;
    const topCtrOpportunity = row.position >= 4 && row.position <= 10;
    const nearTop = row.position > 10 && row.position <= 30;
    const mediumOpportunity = row.position > 30 && row.position <= 50;
    const farPosition = row.position > 50;
    const hasClick = row.clicks > 0;
    const duplicateRisk = (duplicateMap.get(stripAccent(row.query)) || []).map((item) => cleanPath(item.page)).filter(Boolean).filter((value, i, arr) => arr.indexOf(value) === i).length > 1;
    const missingUrl = !row.page && !known?.target_url;
    const missingFaq = Boolean(product?.checks && !product.checks.faq);
    const missingMeta = Boolean(blog?.checks && !blog.checks.meta);
    const missingInternalLink = !link && Boolean(url);
    let score = 24 + businessScore(`${row.query} ${url}`) + opportunity.score;
    if (ctrLow) score += 20;
    if (hasClick && !farPosition) score += 8;
    if (duplicateRisk) score += 20;
    if (missingUrl && !farPosition) score += hasQueryPage ? 12 : 6;
    if ((missingFaq || missingMeta || missingInternalLink) && !farPosition) score += 10;
    score += Math.min(farPosition ? 6 : 15, row.impressions / 80);
    score = clamp(score);
    score = Math.min(score, opportunity.maxTodayScore);

    let type: ProfessionalSeoTaskType = 'Theo dõi cơ hội SEO';
    let action = 'Theo dõi thêm dữ liệu Search Console trước khi sửa mạnh.';
    let expectedResult = 'Có thêm dữ liệu chắc hơn để quyết định URL/keyword.';
    let reindex: ProfessionalSeoTask['reindex'] = 'Theo dõi thêm';
    if (missingUrl && !farPosition) {
      type = 'Gắn URL chính cho keyword';
      action = hasQueryPage
        ? `Gắn URL chính cho "${row.query}" trong Keyword Map theo URL có tín hiệu tốt nhất.`
        : `Gắn URL chính tạm thời cho "${row.query}" trong Keyword Map, ưu tiên ${fallbackUrl(row.query)}, rồi kiểm tra lại sau khi import Query+Page.`;
      expectedResult = hasQueryPage
        ? 'Keyword có URL đích rõ để AI không đề xuất trùng.'
        : 'Có URL tạm để quản lý keyword, nhưng không biến kế hoạch hôm nay thành hàng loạt việc gán URL.';
      reindex = 'Không cần';
    } else if (duplicateRisk) {
      type = 'Kiểm tra trùng từ khóa';
      action = `Chọn URL chính cho "${row.query}", sau đó thêm link nội bộ về ${url}.`;
      expectedResult = 'Giảm nhiều URL cùng bắt một query.';
      reindex = 'Không cần';
    } else if (ctrLow && (topCtrOpportunity || nearTop)) {
      type = 'Sửa title/meta/description';
      action = nearTop && missingInternalLink
        ? `Sửa title/meta của ${url}, sau đó thêm 1 internal link với anchor "${row.query}" để đẩy query đang ở vùng 10-30.`
        : `Sửa title/meta của ${url} để nêu rõ sản phẩm, giá trị mua hàng và khu vực Hà Nội.`;
      expectedResult = nearTop ? 'Tăng CTR và hỗ trợ query tiến gần top 10.' : 'Tăng CTR cho query đã có impression.';
      reindex = 'Có';
    } else if (nearTop) {
      type = missingInternalLink ? 'Thêm internal link' : missingFaq ? 'Thêm FAQ' : product ? 'Tối ưu sản phẩm' : blog ? 'Sửa bài viết cũ' : 'Thêm FAQ';
      action = missingInternalLink
        ? `Thêm 1-2 internal link về ${url} với anchor "${row.query}".`
        : `Bổ sung FAQ, đoạn mô tả 150-200 chữ và liên kết nội bộ cho ${url}.`;
      expectedResult = 'Đẩy query vị trí 10-30 tiến gần top 10.';
      reindex = 'Có';
    } else if (mediumOpportunity) {
      action = `Đưa "${row.query}" vào danh sách theo dõi 7 ngày tới; chỉ tối ưu mạnh khi có thêm impression hoặc URL chính rõ hơn.`;
      expectedResult = 'Không dồn nguồn lực hôm nay cho keyword chưa đủ gần top.';
    } else if (farPosition) {
      action = `Theo dõi "${row.query}" và ưu tiên import Query+Page/kiểm tra URL trước; chưa sửa title/meta chỉ vì CTR thấp khi vị trí còn trên 50.`;
      expectedResult = 'Giữ kế hoạch hôm nay tập trung vào keyword có khả năng tăng trưởng thực tế hơn.';
    }

    tasks.push(buildTask({
      id: `sc-query-${index}-${slugify(row.query)}-${slugify(url)}`,
      type,
      title: `${type}: ${row.query}`,
      url,
      keyword: row.query,
      secondaryKeywords: data.queries.filter((item) => cleanPath(item.page) === url && item.query !== row.query).map((item) => item.query).slice(0, 3),
      sourceSignal: taskSourceSignal,
      reason: overviewContext + `Search Console: ${row.impressions} impression, ${row.clicks} click, CTR ${row.ctr.toFixed(2)}%, vị trí ${row.position.toFixed(1)} (${opportunity.label}). ${ctrLow ? 'CTR thấp và vị trí đang đủ gần để tối ưu title/meta. ' : rawCtrLow && farPosition ? 'CTR thấp chưa phải vấn đề chính vì vị trí còn trên 50. ' : ''}${nearTop ? 'Đang ở vùng 10-30 nên ưu tiên internal link/FAQ/nội dung. ' : ''}${missingUrl && !hasQueryPage ? 'Chưa có Query+Page nên chỉ gán URL chính có kiểm soát và cần import thêm để xác nhận. ' : ''}${missingInternalLink && !farPosition ? 'Chưa thấy internal link phù hợp trong gợi ý hiện có. ' : ''}`,
      priority: priority(score),
      score,
      estimatedTime: timeByTask(score, type),
      action,
      expectedResult,
      reindex,
      source: 'Search Console import',
      internalLink: missingInternalLink && url ? { from: '/tin-tuc/bai-viet-lien-quan/', to: url, anchor: row.query } : undefined,
    }));
  });

  return tasks;
}

function buildAdsOnlyTasks(input: BuildProfessionalSeoPlanInput, existingKeywords: Set<string>) {
  if (!input.googleAds?.rows.length) return [];
  return input.googleAds.rows
    .filter((row) => row.keyword && !existingKeywords.has(stripAccent(row.keyword)))
    .map((row, index) => {
      const volume = row.avg_monthly_searches || 0;
      const score = clamp(15 + businessScore(row.keyword) + Math.min(15, volume / 120) + ((row.competition_index || 100) <= 60 ? 8 : 0));
      const url = findKnownKeyword(row.keyword, input.keywords)?.target_url || fallbackUrl(row.keyword);
      const type: ProfessionalSeoTaskType = findKnownKeyword(row.keyword, input.keywords) ? 'Gắn URL chính cho keyword' : 'Theo dõi cơ hội SEO';
      return buildTask({
        id: `ads-opportunity-${index}-${slugify(row.keyword)}`,
        type,
        title: `Cơ hội từ Keyword Planner: ${row.keyword}`,
        url,
        keyword: row.keyword,
        secondaryKeywords: [],
        sourceSignal: sourceSignal(input),
        reason: `Keyword Planner có volume ${volume || 'chưa rõ'}, cạnh tranh ${row.competition || 'chưa rõ'}, nhưng chưa thấy impression trong Search Console import mới nhất.`,
        priority: priority(score),
        score,
        estimatedTime: timeByTask(score, type),
        action: 'Đưa vào nhóm cơ hội theo dõi; chỉ viết bài mới nếu chưa có URL phù hợp sau khi kiểm tra chống trùng.',
        expectedResult: 'Có danh sách cơ hội SEO/Ads nhưng không vượt ưu tiên Search Console.',
        reindex: 'Không cần',
        source: 'Google Ads import',
      });
    });
}

function buildSupabaseTasks(input: BuildProfessionalSeoPlanInput) {
  const productTasks = input.products.slice(0, 8).map((product, index) => {
    const issueScore = Math.max(0, 100 - (product.qualityScore || 0));
    const score = clamp(issueScore + businessScore(`${product.name} ${product.category || ''}`) + (product.issues.some((issue) => includesAny(issue, ['FAQ', 'mô tả', 'link'])) ? 10 : 0));
    return buildTask({
      id: `product-quality-${index}-${product.id}`,
      type: product.issues.some((issue) => includesAny(issue, ['FAQ'])) ? 'Thêm FAQ' : 'Tối ưu sản phẩm',
      title: `Bổ sung SEO sản phẩm ${product.name}`,
      url: product.slug ? `/san-pham/${product.slug}/` : '',
      keyword: product.name,
      secondaryKeywords: [product.category || '', product.parent_slug || ''].filter(Boolean),
      sourceSignal: sourceSignal(input),
      reason: `Supabase cho thấy sản phẩm còn thiếu: ${product.issues.slice(0, 3).join(', ') || 'cần rà soát nội dung'}.`,
      priority: priority(score),
      score,
      estimatedTime: timeByTask(score, 'Tối ưu sản phẩm'),
      action: 'Bổ sung mô tả thật, thông số, FAQ và internal link về danh mục chính.',
      expectedResult: 'Sản phẩm đủ nội dung hơn trước khi đẩy SEO hoặc Ads.',
      reindex: 'Có',
      source: 'Supabase',
    });
  });

  const blogTasks = input.blogs.slice(0, 6).map((blog, index) => {
    const score = clamp(100 - blog.score + businessScore(blog.title));
    return buildTask({
      id: `blog-quality-${index}-${blog.id}`,
      type: 'Sửa bài viết cũ',
      title: `Cập nhật bài cũ: ${blog.title}`,
      url: blog.slug ? `/tin-tuc/${blog.slug}/` : '',
      keyword: blog.title,
      secondaryKeywords: [],
      sourceSignal: sourceSignal(input),
      reason: `Bài viết đạt ${blog.score}/100, còn thiếu: ${blog.issues.slice(0, 3).join(', ') || 'cần rà soát'}.`,
      priority: priority(score),
      score,
      estimatedTime: timeByTask(score, 'Sửa bài viết cũ'),
      action: 'Cập nhật đoạn mở bài, thêm FAQ và link về danh mục/sản phẩm liên quan.',
      expectedResult: 'Tăng chất lượng nội dung cũ thay vì viết trùng bài mới.',
      reindex: 'Có',
      source: 'Supabase',
    });
  });

  return [...productTasks, ...blogTasks];
}

function uniqueTasks(tasks: ProfessionalSeoTask[]) {
  const map = new Map<string, ProfessionalSeoTask>();
  tasks.sort((a, b) => b.score - a.score).forEach((task) => {
    const key = keyForTask(task);
    if (!map.has(key)) map.set(key, task);
  });
  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

function balancedTodayTasks(tasks: ProfessionalSeoTask[]) {
  const sorted = [...tasks].sort((a, b) => b.score - a.score);
  const selected: ProfessionalSeoTask[] = [];
  const selectedIds = new Set<string>();
  let mapUrlTasks = 0;

  const add = (task: ProfessionalSeoTask | undefined) => {
    if (!task || selected.length >= 5 || selectedIds.has(task.id)) return false;
    if (task.type === 'Gắn URL chính cho keyword' && mapUrlTasks >= 2) return false;
    selected.push(task);
    selectedIds.add(task.id);
    if (task.type === 'Gắn URL chính cho keyword') mapUrlTasks += 1;
    return true;
  };

  const addBest = (predicate: (task: ProfessionalSeoTask) => boolean) => {
    add(sorted.find((task) => !selectedIds.has(task.id) && predicate(task)));
  };

  addBest((task) => task.id.startsWith('worklog-followup-') || task.historyStatus === 'Cần sửa tiếp' || (task.historyStatus === 'Đang theo dõi' && task.shouldRedo === 'Có'));
  addBest((task) => task.type === 'Sửa title/meta/description');
  addBest((task) => task.type === 'Thêm internal link');
  addBest((task) => task.type === 'Thêm FAQ' || task.type === 'Tối ưu sản phẩm' || task.type === 'Sửa bài viết cũ');
  addBest((task) => task.type === 'Gắn URL chính cho keyword' && task.score >= 45);
  addBest((task) => task.type === 'Kiểm tra trùng từ khóa');

  sorted.forEach((task) => {
    if (selected.length >= 5) return;
    if (task.type === 'Gắn URL chính cho keyword' && mapUrlTasks >= 2) return;
    add(task);
  });

  return selected;
}

export function buildProfessionalSeoPlan(input: BuildProfessionalSeoPlanInput): ProfessionalSeoPlan {
  const planInput: BuildProfessionalSeoPlanInput = {
    ...input,
    searchConsole: summarizeSearchConsoleForPlan(input.searchConsole),
    googleAds: summarizeGoogleAdsForPlan(input.googleAds),
  };
  const performanceOverview = choosePerformanceOverview(input, planInput.searchConsole);
  const scKeywords = new Set((planInput.searchConsole?.queries || []).map((row) => stripAccent(row.query)).filter(Boolean));
  const scTasks = buildSearchConsoleTasks(planInput);
  const adsTasks = buildAdsOnlyTasks(planInput, scKeywords);
  const supabaseTasks = buildSupabaseTasks(planInput);
  const workLogFollowUps = buildWorkLogFollowUpTasks(planInput);
  const allTasks = uniqueTasks(enrichTasksWithWorkLogs([...workLogFollowUps, ...scTasks, ...supabaseTasks, ...adsTasks], planInput));
  const today = balancedTodayTasks(allTasks);
  const week = allTasks.filter((task) => !today.some((item) => item.id === task.id)).slice(0, 7);
  const watch = uniqueTasks([
    ...allTasks.filter((task) => task.priority !== 'Cao' || task.type === 'Theo dõi cơ hội SEO'),
    ...adsTasks,
  ]).slice(0, 5);
  const scKeywordCount = new Set((planInput.searchConsole?.queries || []).map((row) => stripAccent(row.query)).filter(Boolean)).size;
  const scUrlCount = new Set([
    ...(planInput.searchConsole?.pages || []).map((row) => cleanPath(row.page)),
    ...(planInput.searchConsole?.queries || []).map((row) => cleanPath(row.page)),
  ].filter(Boolean)).size;
  const latestByType = latestSearchConsoleImports(input.searchConsole);
  const scDateRanges = Array.from(new Set((planInput.searchConsole?.imports || []).map((item) => item.dateRangeLabel).filter(Boolean)));
  const scImportTypes = Array.from(new Set((planInput.searchConsole?.imports || []).map((item) => item.type).filter(Boolean)));
  const workLogStats = summarizeWorkLogs(input.workLogs || []);
  const hasQueryPage = scImportTypes.includes('query-page');
  const hasUsefulSearchConsole = Boolean(planInput.searchConsole?.overview.connected && (scKeywordCount || scUrlCount));
  const onlyShortSearchConsole = hasUsefulSearchConsole
    && scDateRanges.length > 0
    && scDateRanges.every(isShortSearchConsoleRange)
    && !latestByType.some((item) => !isShortSearchConsoleRange(item.dateRangeLabel));
  const activeSearchConsoleSource = hasQueryPage
    ? 'Query+Page mới nhất'
    : scKeywordCount
      ? 'Queries mới nhất'
      : scUrlCount
        ? 'Pages mới nhất'
        : planInput.searchConsole?.trend?.length
          ? 'Dates trend'
          : 'Chưa có GSC chi tiết';
  const alerts: string[] = [];
  if (!planInput.searchConsole?.overview.connected) alerts.push('Chưa có dữ liệu Search Console mới, AI chỉ dùng Supabase và Keyword Planner để gợi ý tạm.');
  if (planInput.searchConsole?.overview.connected && !scKeywordCount) alerts.push('Search Console đã import nhưng chưa thấy query chi tiết.');
  if (onlyShortSearchConsole) alerts.push('Search Console hiện chỉ có dữ liệu ngắn hạn. Nên import thêm 3/6/12/16 tháng để AI đọc xu hướng và ưu tiên bền hơn.');
  if (performanceOverview.source === 'GSC nhập tay' && Number(performanceOverview.impressions || 0) > 0 && Number(performanceOverview.ctr || 0) < 1.5) alerts.push('Tổng quan GSC nhập tay cho thấy impression có nhưng CTR thấp; AI ưu tiên sửa title/meta, FAQ và rich content trên URL có tín hiệu chi tiết.');
  if (performanceOverview.source === 'GSC nhập tay' && Number(performanceOverview.position || 0) > 30) alerts.push('Tổng quan GSC nhập tay cho thấy position trung bình còn yếu; AI ưu tiên internal link, nội dung hỗ trợ và cụm danh mục.');
  if (planInput.searchConsole?.overview.connected && !hasQueryPage) alerts.push('Nên import Query+Page để chọn URL chính chính xác hơn. Trước khi có Query+Page, AI chỉ cho tối đa 2 việc gán URL chính trong hôm nay.');
  const weakDevice = (planInput.searchConsole?.devices || [])
    .filter((item) => item.impressions >= 50 && item.ctr > 0 && item.ctr < Math.max(1, (planInput.searchConsole?.overview.ctr || 0) * 0.75))
    .sort((a, b) => b.impressions - a.impressions)[0];
  if (weakDevice) alerts.push(`Thiết bị ${weakDevice.device} có ${weakDevice.impressions} impression nhưng CTR thấp (${weakDevice.ctr.toFixed(2)}%). Nên kiểm tra title/meta và trải nghiệm mobile/desktop theo thiết bị này.`);
  const topCountry = [...(planInput.searchConsole?.countries || [])].sort((a, b) => b.impressions - a.impressions)[0];
  if (topCountry && !includesAny(topCountry.country, ['viet nam', 'vietnam', 'việt nam'])) {
    alerts.push(`Quốc gia có impression cao nhất là ${topCountry.country}. Nên kiểm tra lại target thị trường nếu khách chính vẫn là Việt Nam.`);
  }
  if (!planInput.googleAds?.summary.keywordCount) alerts.push('Chưa có dữ liệu Keyword Planner thật.');
  if (workLogStats.needFix) alerts.push(`Nhật ký SEO có ${workLogStats.needFix} việc cần sửa tiếp, AI ưu tiên xử lý trước khi tạo việc mới.`);
  if (workLogStats.dueToday || workLogStats.overdue) alerts.push(`Nhật ký SEO có ${workLogStats.dueToday} việc đến hạn hôm nay và ${workLogStats.overdue} việc quá hạn kiểm tra.`);

  return {
    sourceSummary: {
      searchConsoleUpdatedAt: planInput.searchConsole?.overview.lastUpdated || null,
      searchConsoleKeywordCount: scKeywordCount,
      searchConsoleUrlCount: scUrlCount,
      searchConsoleDateRanges: scDateRanges,
      searchConsoleImportTypes: scImportTypes,
      searchConsoleLatestByType: latestByType,
      activeSearchConsoleSource,
      performanceOverviewSource: performanceOverview.source,
      performanceClicks: performanceOverview.clicks,
      performanceImpressions: performanceOverview.impressions,
      performanceCtr: performanceOverview.ctr,
      performancePosition: performanceOverview.position,
      performanceUpdatedAt: performanceOverview.updatedAt,
      manualGscSummary: {
        hasData: Boolean(input.manualSearchConsoleSummary),
        range: input.manualSearchConsoleSummary?.range || '',
        clicks: input.manualSearchConsoleSummary?.clicks ?? null,
        impressions: input.manualSearchConsoleSummary?.impressions ?? null,
        ctr: input.manualSearchConsoleSummary?.ctr ?? null,
        position: input.manualSearchConsoleSummary?.position ?? null,
        updatedAt: input.manualSearchConsoleSummary?.updatedAt || input.manualSearchConsoleSummary?.checkedAt || null,
      },
      apiQueryPageSummary: {
        hasData: Boolean(performanceOverview.apiMeta),
        rowCount: performanceOverview.apiMeta?.rowCount || 0,
        updatedAt: performanceOverview.apiMeta ? importTimestamp(performanceOverview.apiMeta) : null,
      },
      csvSummary: performanceOverview.csv,
      googleAdsUpdatedAt: planInput.googleAds?.lastUpdated || planInput.googleAds?.summary.lastUpdated || null,
      googleAdsKeywordCount: planInput.googleAds?.summary.keywordCount || 0,
      workLogTotal: workLogStats.total,
      workLogWatching: workLogStats.watching,
      workLogNeedFix: workLogStats.needFix,
      workLogGoodSignal: workLogStats.goodSignal,
      workLogDueToday: workLogStats.dueToday,
      workLogOverdue: workLogStats.overdue,
      usingSources: [
        `Tổng quan: ${performanceOverview.source}`,
        hasUsefulSearchConsole ? `Search Console ${activeSearchConsoleSource}` : '',
        planInput.searchConsole?.trend?.length ? 'Search Console Dates trend' : '',
        planInput.searchConsole?.devices?.length ? 'Search Console Devices' : '',
        planInput.searchConsole?.countries?.length ? 'Search Console Countries' : '',
        planInput.googleAds?.summary.keywordCount ? 'Keyword Planner import' : '',
        input.workLogs?.length ? 'Nhật ký SEO v11' : '',
        'Supabase products/blog_posts/categories/seo_*',
        'seo_dashboard_store',
      ].filter(Boolean).join(' + '),
      warning: !planInput.searchConsole?.overview.connected
        ? 'Chưa có dữ liệu Search Console mới'
        : onlyShortSearchConsole
          ? 'Search Console đang chỉ có range ngắn'
          : undefined,
    },
    today,
    week,
    watch,
    alerts,
  };
}
