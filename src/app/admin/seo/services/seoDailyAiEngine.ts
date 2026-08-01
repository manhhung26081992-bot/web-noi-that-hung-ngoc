import type {
  AiSeoDailyDataSource,
  AiSeoDailyPlan,
  AiSeoDailyTask,
  GoogleAdsImportData,
  InternalLinkSuggestion,
  ProductSeoItem,
  SearchConsoleManualSummary,
  SearchConsoleQuery,
  SearchConsoleQueryPageRangeSummary,
  SearchConsoleUpdateHistoryEntry,
  SearchConsoleV7Data,
  SeoBlogQualityItem,
  SeoCluster,
  SeoKeyword,
  SeoOverview,
  TodayTask,
} from '../types/seo';
import type { SeoWorkLogItem } from '../types/seoV11';
import { buildProfessionalSeoPlan, type ProfessionalSeoTask } from './seoProfessionalPlanService';

export const AI_SEO_DAILY_PLAN_STORE_KEY = 'noithathungngoc-ai-seo-daily-plan-v1';
export const AI_SEO_DAILY_HISTORY_STORE_KEY = 'noithathungngoc-ai-seo-daily-history-v1';

export type SeoDailyAiEngineInput = {
  date?: string;
  source?: 'auto-daily' | 'manual-run';
  searchConsole: SearchConsoleV7Data | null;
  manualGscSummary: SearchConsoleManualSummary | null;
  googleAds: GoogleAdsImportData | null;
  products: ProductSeoItem[];
  blogs: SeoBlogQualityItem[];
  clusters: SeoCluster[];
  keywords: SeoKeyword[];
  tasks: TodayTask[];
  internalLinks?: InternalLinkSuggestion[];
  workLogs: SeoWorkLogItem[];
  overview: SeoOverview | null;
  keywordMap?: unknown;
  apiSummary?: unknown;
  searchConsoleRanges?: SearchConsoleQueryPageRangeSummary[];
  gscUpdateHistory?: SearchConsoleUpdateHistoryEntry[];
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function newest(values: Array<string | null | undefined>) {
  const valid = values.filter(Boolean).map(String).sort((a, b) => b.localeCompare(a));
  return valid[0] || null;
}

function isStale(value?: string | null) {
  if (!value) return true;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return true;
  return Date.now() - time > 7 * 86400000;
}

function countUnknown(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items.length;
    if (Array.isArray(record.rows)) return record.rows.length;
    if (Array.isArray(record.data)) return record.data.length;
    return Object.keys(record).length;
  }
  return 0;
}

function sourceStatus(hasData: boolean, updatedAt?: string | null): AiSeoDailyDataSource['status'] {
  if (!hasData) return 'missing';
  return isStale(updatedAt) ? 'stale' : 'fresh';
}

function stripAccent(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function normalizeKeyword(value: unknown) {
  return stripAccent(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanPath(value: unknown) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const parsed = raw.startsWith('http') ? new URL(raw).pathname : raw;
    const path = parsed.split('?')[0].split('#')[0].replace(/^\/+|\/+$/g, '');
    return path ? '/' + path + '/' : '/';
  } catch {
    const path = raw.split('?')[0].split('#')[0].replace(/^\/+|\/+$/g, '');
    return path ? '/' + path + '/' : '';
  }
}

function words(value: unknown) {
  return normalizeKeyword(value).split(' ').filter((word) => word.length > 2);
}

function overlap(a: unknown, b: unknown) {
  const left = words(a);
  if (!left.length) return 0;
  const right = normalizeKeyword(b);
  return left.filter((word) => right.includes(word)).length / left.length;
}

type KeywordMapEntry = {
  keyword: string;
  primaryUrl?: string;
  savedPrimaryUrl?: string;
  suggestedPrimaryUrl?: string;
  urlType?: string;
  note?: string;
  updatedAt?: string;
};

type KeywordUrlContext = {
  savedPrimaryUrl?: string;
  suggestedPrimaryUrl?: string;
  competingUrls: string[];
  bestQuery?: SearchConsoleQuery;
};

function normalizeKeywordMap(value: unknown) {
  const map = new Map<string, KeywordMapEntry>();
  if (!value || typeof value !== 'object') return map;
  const entries = Array.isArray(value)
    ? value.map((item) => [String((item as KeywordMapEntry)?.keyword || ''), item])
    : Object.entries(value as Record<string, unknown>);
  entries.forEach(([key, raw]) => {
    if (!raw || typeof raw !== 'object') return;
    const item = raw as KeywordMapEntry;
    const keyword = item.keyword || key;
    const normalized = normalizeKeyword(keyword || key);
    if (!normalized) return;
    map.set(normalized, {
      ...item,
      keyword,
      primaryUrl: cleanPath(item.primaryUrl || item.savedPrimaryUrl),
      savedPrimaryUrl: cleanPath(item.savedPrimaryUrl || item.primaryUrl),
      suggestedPrimaryUrl: cleanPath(item.suggestedPrimaryUrl),
    });
  });
  return map;
}

function bestQueryPage(keyword: string, rows: SearchConsoleQuery[] = []) {
  const normalized = normalizeKeyword(keyword);
  return rows
    .filter((row) => row.page && normalizeKeyword(row.query) === normalized)
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.position - b.position)[0];
}

function competingPages(keyword: string, rows: SearchConsoleQuery[] = [], savedPrimaryUrl = '') {
  const normalized = normalizeKeyword(keyword);
  const map = new Map<string, { page: string; impressions: number }>();
  rows.forEach((row) => {
    if (!row.page || normalizeKeyword(row.query) !== normalized) return;
    const page = cleanPath(row.page);
    if (!page || (savedPrimaryUrl && page === savedPrimaryUrl)) return;
    const current = map.get(page) || { page, impressions: 0 };
    current.impressions += Number(row.impressions || 0);
    map.set(page, current);
  });
  return Array.from(map.values()).sort((a, b) => b.impressions - a.impressions).map((item) => item.page).slice(0, 5);
}

function keywordUrlContext(keyword: string, keywordMap: Map<string, KeywordMapEntry>, rows: SearchConsoleQuery[] = []): KeywordUrlContext {
  const saved = keywordMap.get(normalizeKeyword(keyword));
  const savedPrimaryUrl = cleanPath(saved?.savedPrimaryUrl || saved?.primaryUrl);
  const best = bestQueryPage(keyword, rows);
  const suggestedPrimaryUrl = savedPrimaryUrl ? '' : cleanPath(saved?.suggestedPrimaryUrl || best?.page);
  return {
    savedPrimaryUrl,
    suggestedPrimaryUrl,
    competingUrls: competingPages(keyword, rows, savedPrimaryUrl),
    bestQuery: best,
  };
}

function enrichTaskWithKeywordMap(task: ProfessionalSeoTask, keywordMap: Map<string, KeywordMapEntry>, rows: SearchConsoleQuery[]): AiSeoDailyTask {
  const context = keywordUrlContext(task.keyword, keywordMap, rows);
  const url = context.savedPrimaryUrl || task.url || context.suggestedPrimaryUrl || '';
  const urlNotes = [
    context.savedPrimaryUrl ? 'URL chính đã lưu: ' + context.savedPrimaryUrl : '',
    context.suggestedPrimaryUrl ? 'URL đề xuất: ' + context.suggestedPrimaryUrl : '',
    context.competingUrls.length ? 'URL cạnh tranh: ' + context.competingUrls.join(', ') : '',
  ].filter(Boolean);
  const reason = [task.reason, ...urlNotes].filter(Boolean).join(' ');
  const copyText = [
    task.copyText,
    context.savedPrimaryUrl ? 'URL chính đã lưu: ' + context.savedPrimaryUrl : '',
    context.suggestedPrimaryUrl ? 'URL đề xuất cần kiểm tra, chưa coi là URL đã lưu: ' + context.suggestedPrimaryUrl : '',
    context.competingUrls.length ? 'URL cạnh tranh cần rà soát: ' + context.competingUrls.join(', ') : '',
  ].filter(Boolean).join('\n');
  return {
    id: task.id,
    title: task.title,
    type: task.type,
    priority: task.priority,
    score: task.score,
    url,
    keyword: task.keyword,
    secondaryKeywords: task.secondaryKeywords,
    reason,
    sourceData: [task.sourceSignal || task.source, context.savedPrimaryUrl ? 'Keyword map URL chính đã lưu' : '', context.suggestedPrimaryUrl ? 'Query+Page URL đề xuất' : ''].filter(Boolean).join(' + '),
    action: urlNotes.length ? task.action + ' ' + urlNotes.join(' ') : task.action,
    expectedResult: task.expectedResult,
    reindex: task.reindex,
    copyPrompt: copyText,
    savedPrimaryUrl: context.savedPrimaryUrl || undefined,
    suggestedPrimaryUrl: context.suggestedPrimaryUrl || undefined,
    competingUrls: context.competingUrls,
  };
}

function buildCannibalizationWarnings(rows: SearchConsoleQuery[] = [], keywordMap = new Map<string, KeywordMapEntry>()) {
  const map = new Map<string, { query: string; pages: Set<string>; impressions: number }>();
  rows.slice(0, 2000).forEach((row) => {
    if (!row.query || !row.page) return;
    const key = row.query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const current = map.get(key) || { query: row.query, pages: new Set<string>(), impressions: 0 };
    current.pages.add(row.page);
    current.impressions += Number(row.impressions || 0);
    map.set(key, current);
  });
  return Array.from(map.values())
    .filter((item) => item.pages.size > 1)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5)
    .map((item) => ({
      query: item.query,
      pages: Array.from(item.pages).slice(0, 5),
      impressions: item.impressions,
      reason: 'Query này đang có nhiều URL cùng xuất hiện, cần chọn URL chính và gom internal link để tránh trùng từ khóa.',
      savedPrimaryUrl: keywordUrlContext(item.query, keywordMap, rows).savedPrimaryUrl,
      suggestedPrimaryUrl: keywordUrlContext(item.query, keywordMap, rows).suggestedPrimaryUrl,
    }));
}

function titleForUrl(url: string, input: SeoDailyAiEngineInput) {
  const path = cleanPath(url);
  const product = input.products.find((item) => cleanPath('/san-pham/' + item.slug) === path);
  if (product) return product.name || path;
  const blog = input.blogs.find((item) => cleanPath('/tin-tuc/' + item.slug) === path);
  if (blog) return blog.title || path;
  const cluster = input.clusters.find((item) => cleanPath(item.main_url) === path);
  return cluster?.name || path;
}

function categoryUrlForProduct(product: ProductSeoItem) {
  return cleanPath(product.category || product.parent_slug || '');
}

function categoryTitleForProduct(product: ProductSeoItem) {
  return String(product.category || product.parent_slug || '').replace(/-/g, ' ') || 'Danh mục chính';
}

function buildInternalLinkSuggestions(input: SeoDailyAiEngineInput, tasks: AiSeoDailyTask[]) {
  const suggestions = new Map<string, AiSeoDailyPlan['internalLinkSuggestions'][number]>();
  const add = (item: Omit<AiSeoDailyPlan['internalLinkSuggestions'][number], 'id' | 'copyPrompt'>) => {
    const fromUrl = cleanPath(item.fromUrl);
    const toUrl = cleanPath(item.toUrl);
    if (!fromUrl || !toUrl || fromUrl === toUrl) return;
    const key = fromUrl + '->' + toUrl + '|' + normalizeKeyword(item.anchorText);
    if (suggestions.has(key)) return;
    const id = 'daily-internal-link-' + suggestions.size + '-' + normalizeKeyword(item.anchorText).replace(/\s+/g, '-').slice(0, 40);
    suggestions.set(key, {
      id,
      ...item,
      fromUrl,
      toUrl,
      copyPrompt: [
        'Thêm internal link cho SEO Daily.',
        'Từ URL: ' + fromUrl,
        'Từ tiêu đề: ' + item.fromTitle,
        'Trỏ về URL: ' + toUrl,
        'Anchor text: ' + item.anchorText,
        'Lý do: ' + item.reason,
        'Nguồn: ' + item.source,
      ].join('\n'),
    });
  };

  const priorityTargets = [
    ...(input.searchConsole?.queries || [])
      .filter((row) => row.page && row.impressions >= 20 && row.position >= 10 && row.position <= 30)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 8)
      .map((row) => ({ toUrl: cleanPath(row.page), anchorText: row.query, source: 'Query+Page position 10-30', score: row.impressions + 40 })),
    ...input.workLogs
      .filter((log) => log.url && (String(log.status).includes('theo dõi') || String(log.status).includes('sửa tiếp') || Boolean(log.nextCheckDate && log.nextCheckDate <= today())))
      .slice(0, 6)
      .map((log) => ({ toUrl: cleanPath(log.url), anchorText: log.keyword || log.title || titleForUrl(log.url, input), source: 'Nhật ký SEO v11 cần hỗ trợ', score: 90 })),
    ...tasks
      .filter((task) => task.url && (task.type.includes('internal') || task.type.includes('link') || task.savedPrimaryUrl || task.suggestedPrimaryUrl))
      .slice(0, 5)
      .map((task) => ({ toUrl: cleanPath(task.url), anchorText: task.keyword || task.title, source: 'AI Daily task', score: task.score })),
  ].sort((a, b) => b.score - a.score);

  priorityTargets.forEach((target) => {
    const fromBlog = input.blogs
      .slice(0, 120)
      .find((blog) => cleanPath('/tin-tuc/' + blog.slug) !== target.toUrl && overlap(target.anchorText, [blog.title, blog.excerpt, blog.content, blog.slug].join(' ')) >= 0.45);
    if (fromBlog) {
      add({
        fromUrl: '/tin-tuc/' + fromBlog.slug + '/',
        fromTitle: fromBlog.title || fromBlog.slug,
        toUrl: target.toUrl,
        toTitle: titleForUrl(target.toUrl, input),
        anchorText: target.anchorText,
        reason: 'URL đích có impression/vị trí 10-30 hoặc đang cần theo dõi, nên bổ sung internal link từ bài liên quan.',
        priority: target.score >= 90 ? 'Cao' : 'Trung bình',
        source: target.source,
      });
    }
    const fromProduct = input.products
      .slice(0, 120)
      .find((product) => cleanPath('/san-pham/' + product.slug) !== target.toUrl && overlap(target.anchorText, [product.name, product.category, product.parent_slug, product.slug].join(' ')) >= 0.55);
    if (fromProduct) {
      add({
        fromUrl: '/san-pham/' + fromProduct.slug + '/',
        fromTitle: fromProduct.name || fromProduct.slug,
        toUrl: target.toUrl,
        toTitle: titleForUrl(target.toUrl, input),
        anchorText: target.anchorText,
        reason: 'Sản phẩm cùng cụm có thể hỗ trợ URL đang có tín hiệu Search Console.',
        priority: target.score >= 90 ? 'Cao' : 'Trung bình',
        source: target.source + ' + products',
      });
    }
  });

  input.products.slice(0, 80).forEach((product) => {
    const toUrl = categoryUrlForProduct(product);
    if (!toUrl) return;
    add({
      fromUrl: '/san-pham/' + product.slug + '/',
      fromTitle: product.name || product.slug,
      toUrl,
      toTitle: categoryTitleForProduct(product),
      anchorText: categoryTitleForProduct(product),
      reason: 'Sản phẩm thuộc danh mục này, nên có link về danh mục chính để gom sức mạnh cụm SEO.',
      priority: product.issues?.includes('Thiếu link nội bộ') ? 'Cao' : 'Trung bình',
      source: 'products + category',
    });
  });

  input.blogs.slice(0, 100).forEach((blog) => {
    const text = [blog.title, blog.slug, blog.excerpt, blog.content].join(' ');
    const target = input.products.slice(0, 100).find((product) => overlap(product.name, text) >= 0.45)
      || input.products.slice(0, 100).find((product) => overlap(product.category || product.parent_slug || '', text) >= 0.55);
    if (!target) return;
    add({
      fromUrl: '/tin-tuc/' + blog.slug + '/',
      fromTitle: blog.title || blog.slug,
      toUrl: '/san-pham/' + target.slug + '/',
      toTitle: target.name || target.slug,
      anchorText: target.name || target.category || target.slug,
      reason: 'Bài viết và sản phẩm cùng cụm keyword, nên đặt link về sản phẩm/danh mục chính.',
      priority: 'Trung bình',
      source: 'blog_posts + products',
    });
  });

  return Array.from(suggestions.values()).slice(0, 10);
}

const GSC_RANGE_ORDER = ['7d', '28d', '3m', '6m', '12m'];

function rowRangeSignal(task: AiSeoDailyTask, ranges: SearchConsoleQueryPageRangeSummary[] = []) {
  const keyword = normalizeKeyword(task.keyword || task.title);
  const url = cleanPath(task.url || task.savedPrimaryUrl || task.suggestedPrimaryUrl || '');
  const matched = ranges.find((range) => (range.data?.queries || []).some((row) => {
    const rowKeyword = normalizeKeyword(row.query);
    const sameQuery = keyword && (rowKeyword.includes(keyword) || keyword.includes(rowKeyword));
    const sameUrl = url && cleanPath(row.page || '') === url;
    return sameQuery || sameUrl;
  })) || ranges.find((range) => range.hasData);
  if (!matched) return { dataRange: '', signalSource: '' };
  return {
    dataRange: matched.label || matched.dateRangeLabel || matched.rangeKey,
    signalSource: 'GSC API Query+Page ' + (matched.label || matched.dateRangeLabel || matched.rangeKey),
  };
}

function attachRangeSignal(task: AiSeoDailyTask, ranges: SearchConsoleQueryPageRangeSummary[] = []) {
  const signal = rowRangeSignal(task, ranges);
  if (!signal.dataRange) return task;
  return {
    ...task,
    dataRange: signal.dataRange,
    signalSource: signal.signalSource,
    reason: task.reason + ' Moc du lieu: ' + signal.dataRange + '.',
    sourceData: [task.sourceData, signal.signalSource].filter(Boolean).join(' + '),
    copyPrompt: task.copyPrompt + '\nMoc du lieu: ' + signal.dataRange + '\nNguon tin hieu: ' + signal.signalSource,
  };
}

function buildRangeTrendNotes(ranges: SearchConsoleQueryPageRangeSummary[] = []) {
  const byKey = new Map(ranges.map((range) => [range.rangeKey, range]));
  const notes: string[] = [];
  const seven = byKey.get('7d');
  const three = byKey.get('3m');
  if (seven?.hasData) notes.push('AI co moc 7 ngay de phat hien keyword/URL moi noi va CTR thap trong tuan.');
  if (three?.hasData) notes.push('AI co moc 3 thang de so sanh tin hieu on dinh truoc khi uu tien toi uu.');
  if (seven?.hasData && three?.hasData) {
    const threeQueries = new Set((three.data?.queries || []).map((row) => normalizeKeyword(row.query)).filter(Boolean));
    const fresh = (seven.data?.queries || []).filter((row) => row.impressions >= 10 && !threeQueries.has(normalizeKeyword(row.query))).slice(0, 3);
    if (fresh.length) notes.push('Tin hieu moi 7 ngay: ' + fresh.map((row) => row.query).join(', ') + '.');
  }
  return notes;
}

function buildRangeTrendTasks(ranges: SearchConsoleQueryPageRangeSummary[] = []) {
  const seven = ranges.find((range) => range.rangeKey === '7d');
  const three = ranges.find((range) => range.rangeKey === '3m');
  const threeQueries = new Set((three?.data?.queries || []).map((row) => normalizeKeyword(row.query)).filter(Boolean));
  return (seven?.data?.queries || [])
    .filter((row) => row.impressions >= 10 && row.position >= 4 && row.position <= 30 && !threeQueries.has(normalizeKeyword(row.query)))
    .sort((a, b) => b.impressions - a.impressions || a.position - b.position)
    .slice(0, 3)
    .map((row, index): AiSeoDailyTask => ({
      id: 'daily-gsc-7d-trend-' + index + '-' + normalizeKeyword(row.query).replace(/\s+/g, '-').slice(0, 40),
      title: 'Theo doi tin hieu moi 7 ngay',
      type: row.ctr < 2 && row.position <= 30 ? 'Toi uu CTR / internal link' : 'Co hoi theo doi',
      priority: row.position <= 20 ? 'Cao' : 'Trung binh',
      score: row.position <= 20 ? 78 : 64,
      url: cleanPath(row.page || ''),
      keyword: row.query,
      secondaryKeywords: [],
      reason: 'Moc du lieu: 7 ngay. Nguon tin hieu: GSC API Query+Page 7 ngay. Keyword co ' + row.impressions + ' impressions, ' + row.clicks + ' clicks, vi tri ' + row.position + ', CTR ' + row.ctr + '%.',
      sourceData: 'GSC API Query+Page 7 ngay',
      action: row.ctr < 2 ? 'Kiem tra title/meta va them internal link nhe, chua viet bai moi neu chua co tin hieu 3 thang.' : 'Theo doi them trong 28 ngay va gan URL chinh neu can.',
      expectedResult: 'Khong bo lo keyword moi noi nhung van tranh uu tien qua cao khi chua du du lieu dai hon.',
      reindex: 'Khong submit lai neu chua sua noi dung that.',
      copyPrompt: 'Kiem tra tin hieu 7 ngay cho keyword ' + row.query + ' tai URL ' + (row.page || '') + '. Metrics: ' + row.clicks + ' clicks, ' + row.impressions + ' impressions, CTR ' + row.ctr + '%, position ' + row.position + '.',
      dataRange: '7 ngay',
      signalSource: 'GSC API Query+Page 7 ngay',
    }));
}

function buildIndexTasks(tasks: AiSeoDailyTask[], logs: SeoWorkLogItem[]) {
  const todayKey = today();
  const fromLogs = logs
    .filter((log) => {
      const status = String(log.status || '');
      return status.includes('submit') || status.includes('theo dõi') || status.includes('sửa tiếp') || Boolean(log.nextCheckDate && log.nextCheckDate <= todayKey);
    })
    .slice(0, 5)
    .map((log, index): AiSeoDailyTask => ({
      id: 'daily-index-log-' + (log.id || index),
      title: log.nextCheckDate && log.nextCheckDate <= todayKey ? 'Kiểm tra lại việc SEO đến hạn' : 'Theo dõi URL đã submit/index',
      type: 'Kiểm tra index',
      priority: log.nextCheckDate && log.nextCheckDate <= todayKey ? 'Cao' : 'Trung bình',
      score: log.nextCheckDate && log.nextCheckDate <= todayKey ? 88 : 62,
      url: log.url || '',
      keyword: log.keyword || '',
      secondaryKeywords: [],
      reason: 'Nhật ký SEO v11 có trạng thái cần theo dõi hoặc đến hạn kiểm tra lại.',
      sourceData: 'Nhật ký SEO v11 + Search Console',
      action: 'Mở URL trong Search Console, kiểm tra impression/click/index rồi cập nhật nhật ký SEO.',
      expectedResult: 'Biết URL đã có tín hiệu hay cần bổ sung internal link/title/meta.',
      reindex: 'Không submit lại nếu đã submit gần đây, chỉ submit khi có cập nhật nội dung thật.',
      copyPrompt: `Kiểm tra URL ${log.url || '(chưa có URL)'} trong Search Console, đối chiếu nhật ký SEO ngày ${log.date}.`,
    }));
  const fromTasks = tasks.filter((task) => task.reindex && !task.reindex.toLowerCase().includes('không')).slice(0, 5);
  return [...fromLogs, ...fromTasks].slice(0, 5);
}

export function buildSeoDailyAiPlan(input: SeoDailyAiEngineInput): AiSeoDailyPlan {
  const generatedAt = new Date().toISOString();
  const date = input.date || today();
  const professional = buildProfessionalSeoPlan({
    searchConsole: input.searchConsole,
    googleAds: input.googleAds,
    products: input.products,
    blogs: input.blogs,
    clusters: input.clusters,
    keywords: input.keywords,
    tasks: input.tasks,
    internalLinks: input.internalLinks || [],
    workLogs: input.workLogs,
    manualSearchConsoleSummary: input.manualGscSummary,
  });
  const summary = professional.sourceSummary;
  const manualUpdatedAt = input.manualGscSummary?.updatedAt || input.manualGscSummary?.checkedAt || null;
  const apiUpdatedAt = summary.apiQueryPageSummary.updatedAt || null;
  const csvUpdatedAt = summary.searchConsoleUpdatedAt || null;
  const googleAdsUpdatedAt = summary.googleAdsUpdatedAt || null;
  const keywordMap = normalizeKeywordMap(input.keywordMap);
  const keywordMapCount = keywordMap.size || countUnknown(input.keywordMap);
  const rangeSources: AiSeoDailyDataSource[] = GSC_RANGE_ORDER.map((rangeKey) => {
    const item = (input.searchConsoleRanges || []).find((range) => range.rangeKey === rangeKey);
    const label = item?.label || rangeKey;
    return {
      id: 'query-page-api-' + rangeKey,
      label: 'Query+Page API ' + label,
      hasData: Boolean(item?.hasData),
      count: item?.rowCount || 0,
      updatedAt: item?.updatedAt || null,
      status: sourceStatus(Boolean(item?.hasData), item?.updatedAt || null),
      detail: item?.hasData ? [item.storeKey, item.partial ? 'partial' : 'full', item.stoppedReason || 'completed'].filter(Boolean).join(' - ') : item?.storeKey || 'Chua co du lieu',
    };
  });
  const dataSources: AiSeoDailyDataSource[] = [
    { id: 'gsc-manual', label: 'GSC nhập tay', hasData: Boolean(input.manualGscSummary), updatedAt: manualUpdatedAt, status: sourceStatus(Boolean(input.manualGscSummary), manualUpdatedAt), detail: input.manualGscSummary?.range || '' },
    { id: 'gsc-api-overview', label: 'Search Console API overview', hasData: summary.performanceOverviewSource === 'API overview', updatedAt: summary.performanceUpdatedAt, status: sourceStatus(summary.performanceOverviewSource === 'API overview', summary.performanceUpdatedAt), detail: summary.performanceOverviewSource },
    { id: 'query-page-api', label: 'Query+Page API latest/current', hasData: summary.apiQueryPageSummary.hasData, count: summary.apiQueryPageSummary.rowCount, updatedAt: apiUpdatedAt, status: sourceStatus(summary.apiQueryPageSummary.hasData, apiUpdatedAt), detail: summary.activeSearchConsoleSource },
    ...rangeSources,
    { id: 'search-console-csv', label: 'Search Console CSV', hasData: summary.csvSummary.hasData, count: summary.searchConsoleKeywordCount + summary.searchConsoleUrlCount, updatedAt: csvUpdatedAt, status: sourceStatus(summary.csvSummary.hasData, csvUpdatedAt), detail: summary.searchConsoleImportTypes.join(', ') || summary.csvSummary.source },
    { id: 'google-ads', label: 'Google Ads / Keyword Planner', hasData: Boolean(summary.googleAdsKeywordCount), count: summary.googleAdsKeywordCount, updatedAt: googleAdsUpdatedAt, status: sourceStatus(Boolean(summary.googleAdsKeywordCount), googleAdsUpdatedAt), detail: summary.googleAdsKeywordCount ? summary.googleAdsKeywordCount + ' keyword' : '' },
    { id: 'supabase-content', label: 'Supabase products/blog_posts', hasData: Boolean(input.products.length || input.blogs.length), count: input.products.length + input.blogs.length, updatedAt: generatedAt, status: input.products.length || input.blogs.length ? 'fresh' : 'missing', detail: `${input.products.length} sản phẩm, ${input.blogs.length} bài viết` },
    { id: 'work-log-v11', label: 'Nhật ký SEO v11', hasData: Boolean(input.workLogs.length), count: input.workLogs.length, updatedAt: newest(input.workLogs.map((log) => log.updatedAt || log.createdAt || log.date)), status: sourceStatus(Boolean(input.workLogs.length), newest(input.workLogs.map((log) => log.updatedAt || log.createdAt || log.date))), detail: `${summary.workLogNeedFix} cần sửa tiếp, ${summary.workLogOverdue} quá hạn` },
    { id: 'keyword-map', label: 'Keyword map', hasData: keywordMapCount > 0, count: keywordMapCount, updatedAt: null, status: keywordMapCount > 0 ? 'fresh' : 'missing', detail: keywordMapCount > 0 ? keywordMapCount + ' mục' : '' },
  ];
  const staleSources = dataSources.filter((source) => source.status === 'stale').map((source) => source.label);
  const missingSources = dataSources.filter((source) => source.status === 'missing').map((source) => source.label);
  const newestUpdatedAt = newest(dataSources.map((source) => source.updatedAt));
  const todayTasks = professional.today.slice(0, 5).map((task) => attachRangeSignal(enrichTaskWithKeywordMap(task, keywordMap, input.searchConsole?.queries || []), input.searchConsoleRanges));
  const next7DaysTasks = professional.week.slice(0, 7).map((task) => attachRangeSignal(enrichTaskWithKeywordMap(task, keywordMap, input.searchConsole?.queries || []), input.searchConsoleRanges));
  const watchOpportunities = [
    ...buildRangeTrendTasks(input.searchConsoleRanges),
    ...professional.watch.slice(0, 5).map((task) => attachRangeSignal(enrichTaskWithKeywordMap(task, keywordMap, input.searchConsole?.queries || []), input.searchConsoleRanges)),
  ].slice(0, 7);
  const allTasks = [...todayTasks, ...next7DaysTasks, ...watchOpportunities];
  const internalLinkSuggestions = buildInternalLinkSuggestions(input, allTasks);
  const notes = [
    ...professional.alerts,
    ...buildRangeTrendNotes(input.searchConsoleRanges),
    input.gscUpdateHistory?.length ? 'Lich su cap nhat GSC gan nhat: ' + input.gscUpdateHistory.slice(0, 3).map((item) => (item.rangeKey || item.type) + ' ' + (item.updatedAt || item.importedAt || '')).join('; ') + '.' : '',
    staleSources.length ? 'Dữ liệu đã cũ, nên đồng bộ lại: ' + staleSources.join(', ') + '.' : '',
    missingSources.length ? 'Thiếu dữ liệu: ' + missingSources.join(', ') + '.' : '',
  ].filter(Boolean);
  return {
    date,
    generatedAt,
    source: input.source || 'auto-daily',
    dataSources,
    dataFreshness: {
      status: missingSources.length > 3 ? 'missing' : staleSources.length ? 'stale' : 'fresh',
      newestUpdatedAt,
      staleSources,
      missingSources,
    },
    seoHealthSummary: {
      overviewSource: summary.performanceOverviewSource,
      clicks: summary.performanceClicks,
      impressions: summary.performanceImpressions,
      ctr: summary.performanceCtr,
      position: summary.performancePosition,
      summary: `Tổng quan ${summary.performanceOverviewSource}: ${summary.performanceClicks ?? '-'} click, ${summary.performanceImpressions ?? '-'} impression, CTR ${summary.performanceCtr ?? '-'}%, position ${summary.performancePosition ?? '-'}.`,
      alerts: professional.alerts,
    },
    todayTasks,
    next7DaysTasks,
    watchOpportunities,
    internalLinkSuggestions,
    cannibalizationWarnings: buildCannibalizationWarnings(input.searchConsole?.queries || [], keywordMap),
    contentTasks: allTasks.filter((task) => /bài|FAQ|nội dung|content/i.test(task.type + ' ' + task.title)).slice(0, 7),
    productOptimizationTasks: allTasks.filter((task) => /sản phẩm|product/i.test(task.type + ' ' + task.title)).slice(0, 7),
    indexCheckTasks: buildIndexTasks(allTasks, input.workLogs),
    notes,
    apiSummary: input.apiSummary,
    manualGscSummary: input.manualGscSummary,
    googleAdsSummary: input.googleAds?.summary || null,
    queryPageRanges: input.searchConsoleRanges,
    gscUpdateHistory: input.gscUpdateHistory,
    workLogSummary: {
      total: summary.workLogTotal,
      watching: summary.workLogWatching,
      needFix: summary.workLogNeedFix,
      dueToday: summary.workLogDueToday,
      overdue: summary.workLogOverdue,
    },
  };
}
