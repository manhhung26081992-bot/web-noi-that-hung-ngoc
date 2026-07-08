import type {
  GoogleAdsImportData,
  ProductSeoItem,
  SearchConsoleQuery,
  SearchConsoleV7Data,
  SeoBlogQualityItem,
  SeoCluster,
  SeoKeyword,
} from '../types/seo';

export type WorkbenchTargetType = 'product' | 'blog' | 'category' | 'keyword';
export type WorkbenchFilterKey = 'core' | 'searchConsole' | 'keywordPlanner' | 'missingFaq' | 'thinDescription' | 'missingInternalLink' | 'position10to30' | 'lowCtr' | 'highCpcSeoChance';
export type UsedKeywordStatus = 'unused' | 'primary' | 'cannibalization' | 'update_old' | 'support_article';
export type UsedKeywordFilterKey = 'all' | 'unused' | 'primary' | 'cannibalization' | 'update_old' | 'support_article' | 'core' | 'searchConsole' | 'keywordPlanner';

export interface SeoWorkbenchItem {
  id: string;
  type: WorkbenchTargetType;
  title: string;
  slug?: string;
  url?: string;
  category?: string;
  cluster: string;
  score: number;
  mainKeyword: string;
  secondaryKeywords: string[];
  reasons: string[];
  issues: string[];
  source: string;
  searchConsole?: {
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  };
  ads?: {
    volume: number;
    cpc?: number;
    competition?: string;
  };
}

export interface SeoFaqSuggestion {
  question: string;
  answer: string;
}

export interface SeoInternalLinkSuggestion {
  url: string;
  anchor: string;
  reason: string;
}

export interface KeywordPrimaryMapEntry {
  keyword: string;
  primaryUrl: string;
  urlType: WorkbenchTargetType;
  note?: string;
  updatedAt: string;
}

export interface UsedKeywordUrl {
  url: string;
  title: string;
  type: WorkbenchTargetType;
  score: number;
  reason: string;
}

export interface UsedKeywordInsight {
  keyword: string;
  normalizedKeyword: string;
  status: UsedKeywordStatus;
  label: string;
  primaryUrl?: string;
  primaryUrlType?: WorkbenchTargetType;
  urls: UsedKeywordUrl[];
  competingCount: number;
  recommendation: string;
  anchorText: string;
  taskText: string;
  core: boolean;
  source: string;
  searchConsole?: { impressions: number; clicks: number; ctr: number; position: number };
  ads?: { volume: number; cpc?: number; competition?: string };
}

export interface SeoWorkbenchSuggestion {
  item: SeoWorkbenchItem;
  keywordInsight?: UsedKeywordInsight;
  primaryKeyword: string;
  secondaryKeywords: string[];
  title: string;
  metaDescription: string;
  h1: string;
  h2: string[];
  faqs: SeoFaqSuggestion[];
  internalLinks: SeoInternalLinkSuggestion[];
  shortDescription: string;
  contentHtml: string;
  checklist: string[];
}

export interface SeoWorkbenchBuildInput {
  products: ProductSeoItem[];
  blogs: SeoBlogQualityItem[];
  keywords: SeoKeyword[];
  clusters: SeoCluster[];
  searchConsole: SearchConsoleV7Data | null;
  googleAds: GoogleAdsImportData | null;
}

const CORE_GROUPS = [
  {
    name: 'Giường sắt',
    url: '/giuong-tang-sat/',
    words: ['giuong', 'giuong sat', 'giuong tang', 'giuong tang sat', 'hn4'],
    anchors: ['giường tầng sắt tại Hà Nội', 'giường sắt bền đẹp', 'giường sắt giá xưởng'],
  },
  {
    name: 'Bàn làm việc',
    url: '/ban-lam-viec/',
    words: ['ban lam viec', 'ban van phong', 'ban nhan vien', 'ban chan sat', 'ban fami', 'ban hop'],
    anchors: ['bàn làm việc giá xưởng', 'bàn văn phòng tại Hà Nội', 'bàn chân sắt văn phòng'],
  },
  {
    name: 'Trường học',
    url: '/truong-hoc/',
    words: ['ban hoc sinh', 'ban ghe hoc sinh', 'truong hoc', 'bang tu', 'noi that truong hoc'],
    anchors: ['bàn ghế học sinh giá xưởng', 'nội thất trường học tại Hà Nội', 'bảng từ trường học'],
  },
];

const SECONDARY_GROUPS = [
  { name: 'Ghế chân quỳ', url: '/ghe-chan-quy/', words: ['ghe chan quy', 'ghe van phong'] },
  { name: 'Ghế giám đốc', url: '/ghe-giam-doc/', words: ['ghe giam doc'] },
  { name: 'Tủ locker', url: '/tu-locker/', words: ['tu locker', 'tu sat locker'] },
  { name: 'Tủ văn phòng', url: '/tu-van-phong/', words: ['tu van phong', 'tu ho so', 'tu tai lieu'] },
];

export function normalizeKeyword(value: unknown) {
  return normalizeText(value);
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(value: unknown) {
  return String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function limitText(value: string, max: number) {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

function cleanSlug(value?: string | null) {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '');
}

function productUrl(slug?: string | null) {
  const clean = cleanSlug(slug);
  return clean ? `/san-pham/${clean}/` : '/';
}

function blogUrl(slug?: string | null) {
  const clean = cleanSlug(slug);
  return clean ? `/tin-tuc/${clean}/` : '/tin-tuc/';
}

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function detectGroup(text: string) {
  const normalized = normalizeText(text);
  const core = CORE_GROUPS.find((group) => group.words.some((word) => normalized.includes(word)));
  if (core) return { ...core, core: true };
  const secondary = SECONDARY_GROUPS.find((group) => group.words.some((word) => normalized.includes(word)));
  if (secondary) return { ...secondary, anchors: [secondary.name.toLowerCase()], core: false };
  return { name: 'Nội thất văn phòng', url: '/', words: [], anchors: ['nội thất giá xưởng'], core: false };
}

function businessScore(text: string) {
  const group = detectGroup(text);
  if (group.core) return 28;
  if (['Ghế chân quỳ', 'Ghế giám đốc', 'Tủ locker', 'Tủ văn phòng'].includes(group.name)) return 12;
  return 6;
}

function matchSearchConsole(text: string, searchConsole: SearchConsoleV7Data | null) {
  const normalized = normalizeText(text);
  const allRows = [
    ...(searchConsole?.queries || []),
    ...(searchConsole?.pages || []).map((page) => ({ query: page.page, page: page.page, clicks: page.clicks, impressions: page.impressions, ctr: page.ctr, position: page.position } as SearchConsoleQuery)),
  ];
  const matched = allRows.filter((row) => {
    const rowText = normalizeText(`${row.query || ''} ${row.page || ''}`);
    return rowText && (normalized.includes(rowText) || rowText.includes(normalized) || normalized.split(' ').some((part) => part.length > 4 && rowText.includes(part)));
  });
  if (!matched.length) return undefined;
  const impressions = matched.reduce((sum, row) => sum + toNumber(row.impressions), 0);
  const clicks = matched.reduce((sum, row) => sum + toNumber(row.clicks), 0);
  const ctr = impressions ? clicks / impressions * 100 : matched.reduce((sum, row) => sum + toNumber(row.ctr), 0) / matched.length;
  const position = matched.reduce((sum, row) => sum + toNumber(row.position), 0) / matched.length;
  return { impressions, clicks, ctr, position };
}

function matchAds(text: string, googleAds: GoogleAdsImportData | null) {
  const normalized = normalizeText(text);
  const rows = googleAds?.rows || [];
  const matched = rows.filter((row) => {
    const rowText = normalizeText(row.keyword);
    return rowText && (normalized.includes(rowText) || rowText.includes(normalized) || normalized.split(' ').some((part) => part.length > 4 && rowText.includes(part)));
  });
  if (!matched.length) return undefined;
  const volume = matched.reduce((sum, row) => sum + toNumber(row.avg_monthly_searches), 0);
  const cpcRows = matched.filter((row) => row.cpc || row.low_top_of_page_bid || row.high_top_of_page_bid);
  const cpc = cpcRows.length ? cpcRows.reduce((sum, row) => sum + toNumber(row.cpc || row.low_top_of_page_bid || row.high_top_of_page_bid), 0) / cpcRows.length : undefined;
  const competition = matched.find((row) => row.competition)?.competition;
  return { volume, cpc, competition };
}

function mergeKeywords(...groups: Array<Array<string | undefined>>) {
  const values = groups.flat().filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  const seen = new Set<string>();
  return values.filter((item) => {
    const key = normalizeText(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function productMainKeyword(product: ProductSeoItem) {
  const group = detectGroup(`${product.name} ${product.slug} ${product.category} ${product.parent_slug}`);
  if (group.core) return group.anchors[0];
  return product.name.replace(/[-–].*$/, '').trim().toLowerCase();
}

function scoreItem(baseText: string, issues: string[], sc?: SeoWorkbenchItem['searchConsole'], ads?: SeoWorkbenchItem['ads']) {
  let score = businessScore(baseText);
  if (issues.length) score += Math.min(issues.length * 5, 24);
  if (sc?.impressions) score += Math.min(sc.impressions / 10, 22);
  if (sc?.position && sc.position >= 10 && sc.position <= 30) score += 18;
  if (sc?.ctr !== undefined && sc.impressions > 50 && sc.ctr < 1.5) score += 14;
  if (ads?.volume) score += Math.min(ads.volume / 80, 20);
  if (ads?.cpc && ads.cpc > 3000) score += 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function sourceText(sc?: SeoWorkbenchItem['searchConsole'], ads?: SeoWorkbenchItem['ads']) {
  const sources = ['Supabase'];
  if (sc) sources.push('Search Console import');
  if (ads) sources.push('Keyword Planner import');
  return sources.join(' + ');
}

export function buildSeoWorkbenchItems(input: SeoWorkbenchBuildInput): SeoWorkbenchItem[] {
  const items: SeoWorkbenchItem[] = [];

  input.products.forEach((product) => {
    const text = `${product.name} ${product.slug} ${product.category || ''} ${product.parent_slug || ''}`;
    const sc = matchSearchConsole(text, input.searchConsole);
    const ads = matchAds(text, input.googleAds);
    const issues = product.issues || [];
    const mainKeyword = productMainKeyword(product);
    const group = detectGroup(text);
    const secondaryKeywords = mergeKeywords([product.category || undefined, product.parent_slug || undefined, group.name, product.name.split('-')[0]]).slice(0, 5);
    items.push({
      id: `product-${product.id}-${product.slug}`,
      type: 'product',
      title: product.name,
      slug: product.slug,
      url: productUrl(product.slug),
      category: product.category || product.parent_slug || '',
      cluster: group.name,
      score: scoreItem(text, issues, sc, ads),
      mainKeyword,
      secondaryKeywords,
      reasons: [
        group.core ? 'Thuộc nhóm hàng chủ đạo cần ưu tiên.' : 'Có thể tối ưu thêm để tăng độ phủ SEO.',
        issues.length ? `Cần xử lý: ${issues.slice(0, 3).join(', ')}.` : 'Sản phẩm tương đối ổn, nên bổ sung link nội bộ nếu có bài liên quan.',
        sc?.impressions ? `Có ${sc.impressions} lượt hiển thị từ Search Console import.` : '',
        ads?.volume ? `Có ${ads.volume} lượt tìm kiếm từ Keyword Planner import.` : '',
      ].filter(Boolean),
      issues,
      source: sourceText(sc, ads),
      searchConsole: sc,
      ads,
    });
  });

  input.blogs.forEach((blog) => {
    const text = `${blog.title} ${blog.slug} ${blog.excerpt || ''}`;
    const sc = matchSearchConsole(text, input.searchConsole);
    const ads = matchAds(text, input.googleAds);
    const group = detectGroup(text);
    const issues = blog.issues || [];
    const titleKeyword = blog.title.replace(/[-–|].*$/, '').trim().toLowerCase();
    items.push({
      id: `blog-${blog.id}-${blog.slug}`,
      type: 'blog',
      title: blog.title,
      slug: blog.slug,
      url: blogUrl(blog.slug),
      cluster: group.name,
      score: scoreItem(text, issues, sc, ads),
      mainKeyword: group.core ? group.anchors[0] : titleKeyword,
      secondaryKeywords: mergeKeywords([group.name, blog.slug, titleKeyword]).slice(0, 5),
      reasons: [
        issues.length ? `Bài viết còn: ${issues.slice(0, 3).join(', ')}.` : 'Bài viết có thể cập nhật thêm link về danh mục chính.',
        sc?.position ? `Vị trí trung bình khoảng ${sc.position.toFixed(1)} từ Search Console import.` : '',
        ads?.volume ? `Keyword liên quan có volume ${ads.volume}.` : '',
      ].filter(Boolean),
      issues,
      source: sourceText(sc, ads),
      searchConsole: sc,
      ads,
    });
  });

  input.clusters.forEach((cluster) => {
    const text = `${cluster.name} ${cluster.main_url} ${cluster.note || ''}`;
    const sc = matchSearchConsole(text, input.searchConsole);
    const ads = matchAds(text, input.googleAds);
    const group = detectGroup(text);
    const issues = [
      cluster.post_count < 3 ? 'Thiếu bài viết hỗ trợ' : '',
      cluster.product_count < 6 ? 'Số sản phẩm còn mỏng' : '',
      cluster.internal_link_measured && cluster.internal_link_count < 3 ? 'Thiếu link nội bộ về danh mục' : '',
    ].filter(Boolean);
    items.push({
      id: `category-${cluster.id}`,
      type: 'category',
      title: cluster.name,
      url: cluster.main_url || group.url,
      cluster: cluster.name,
      score: scoreItem(text, issues, sc, ads),
      mainKeyword: group.core ? group.anchors[0] : cluster.name.toLowerCase(),
      secondaryKeywords: mergeKeywords([cluster.name, cluster.status, cluster.note]).slice(0, 5),
      reasons: [
        group.core ? 'Danh mục thuộc nhóm hàng chủ đạo.' : 'Danh mục cần theo dõi và gom thêm tín hiệu.',
        issues.length ? issues.join(', ') + '.' : 'Danh mục có dữ liệu cơ bản, nên theo dõi thêm Search Console.',
      ],
      issues,
      source: sourceText(sc, ads),
      searchConsole: sc,
      ads,
    });
  });

  input.keywords.forEach((keyword) => {
    const text = `${keyword.keyword} ${keyword.cluster || ''} ${keyword.target_url || ''} ${keyword.note || ''}`;
    const sc = matchSearchConsole(text, input.searchConsole);
    const ads = matchAds(text, input.googleAds);
    const group = detectGroup(text);
    const issues = [
      !keyword.target_url ? 'Thiếu URL đích' : '',
      !keyword.current_position ? 'Chưa có vị trí theo dõi' : '',
      toNumber(keyword.current_impression) < 20 ? 'Impression còn thấp' : '',
    ].filter(Boolean);
    items.push({
      id: `keyword-${keyword.id}`,
      type: 'keyword',
      title: keyword.keyword,
      url: keyword.target_url || group.url,
      cluster: keyword.cluster || group.name,
      score: scoreItem(text, issues, sc, ads) + Math.min(toNumber(keyword.priority) * 4, 16),
      mainKeyword: keyword.keyword,
      secondaryKeywords: mergeKeywords([keyword.cluster, keyword.intent, group.name]).slice(0, 5),
      reasons: [
        group.core ? 'Từ khóa thuộc nhóm hàng chủ đạo.' : 'Từ khóa có thể theo dõi để mở rộng nội dung.',
        keyword.status ? `Trạng thái hiện tại: ${keyword.status}.` : '',
        ads?.volume ? `Keyword Planner có volume ${ads.volume}.` : '',
      ].filter(Boolean),
      issues,
      source: sourceText(sc, ads),
      searchConsole: sc,
      ads,
    });
  });

  return items
    .map((item) => ({ ...item, score: Math.max(0, Math.min(100, item.score)) }))
    .sort((a, b) => b.score - a.score || businessScore(b.title + ' ' + b.cluster) - businessScore(a.title + ' ' + a.cluster));
}

export function filterSeoWorkbenchItems(items: SeoWorkbenchItem[], options: { type: WorkbenchTargetType; search: string; filters: WorkbenchFilterKey[]; page: number; pageSize: number; }) {
  const search = normalizeText(options.search);
  const filtered = items.filter((item) => {
    if (item.type !== options.type) return false;
    if (search) {
      const haystack = normalizeText(`${item.title} ${item.slug || ''} ${item.url || ''} ${item.category || ''} ${item.cluster} ${item.mainKeyword} ${item.secondaryKeywords.join(' ')}`);
      if (!haystack.includes(search)) return false;
    }
    return options.filters.every((filter) => {
      if (filter === 'core') return detectGroup(`${item.title} ${item.cluster}`).core;
      if (filter === 'searchConsole') return Boolean(item.searchConsole?.impressions);
      if (filter === 'keywordPlanner') return Boolean(item.ads?.volume);
      if (filter === 'missingFaq') return item.issues.some((issue) => normalizeText(issue).includes('faq'));
      if (filter === 'thinDescription') return item.issues.some((issue) => normalizeText(issue).includes('mo ta') || normalizeText(issue).includes('noi dung'));
      if (filter === 'missingInternalLink') return item.issues.some((issue) => normalizeText(issue).includes('link noi bo'));
      if (filter === 'position10to30') return Boolean(item.searchConsole?.position && item.searchConsole.position >= 10 && item.searchConsole.position <= 30);
      if (filter === 'lowCtr') return Boolean(item.searchConsole?.impressions && item.searchConsole.impressions > 50 && item.searchConsole.ctr < 1.5);
      if (filter === 'highCpcSeoChance') return Boolean(item.ads?.cpc && item.ads.cpc > 3000 && item.score >= 50);
      return true;
    });
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / options.pageSize));
  const page = Math.min(Math.max(1, options.page), totalPages);
  return { filtered, pageItems: filtered.slice((page - 1) * options.pageSize, page * options.pageSize), totalPages, page };
}

const STOP_WORDS = new Set(['gia', 're', 'tai', 'ha', 'noi', 'that', 'hung', 'ngoc', 'cao', 'cap', 'dep', 'mau', 'cho', 'cua', 'va', 'co', 'khong', 'nen', 'chon']);
const BROAD_CATEGORY_KEYWORDS = ['giuong sat', 'giuong tang sat', 'ban lam viec', 'ban van phong', 'ban ghe hoc sinh', 'truong hoc'];

function readText(record: unknown, key: string) {
  const value = (record as Record<string, unknown> | null)?.[key];
  if (Array.isArray(value)) return value.join(' ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value ?? '');
}

function cleanKeywordDisplay(value: unknown) {
  return String(value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[-_/]+/g, ' ')
    .replace(/\bHN\s*\d+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function keywordCandidatePriority(keyword: string) {
  const normalized = normalizeKeyword(keyword);
  let score = businessScore(keyword);
  if (CORE_GROUPS.some((group) => group.name.toLowerCase() === keyword || group.words.some((word) => normalized.includes(word)))) score += 45;
  if (SECONDARY_GROUPS.some((group) => group.name.toLowerCase() === keyword || group.words.some((word) => normalized.includes(word)))) score += 18;
  if (BROAD_CATEGORY_KEYWORDS.some((item) => normalized.includes(item) || item.includes(normalized))) score += 25;
  const wordCount = normalized.split(' ').filter(Boolean).length;
  if (wordCount >= 2 && wordCount <= 5) score += 12;
  if (/hns*d+/i.test(String(keyword))) score += 8;
  return score;
}

function addCandidate(target: Map<string, string>, keyword: unknown) {
  const display = cleanKeywordDisplay(keyword);
  const normalized = normalizeKeyword(display);
  if (!normalized || normalized.length < 4) return;
  const words = normalized.split(' ').filter(Boolean);
  if (words.length === 1 && !['sofa'].includes(normalized)) return;
  if (words.every((word) => STOP_WORDS.has(word))) return;
  if (!target.has(normalized)) target.set(normalized, display || normalized);
}

export function extractKeywordsFromTitle(title: string) {
  const clean = cleanKeywordDisplay(title);
  const normalized = normalizeKeyword(clean);
  const words = normalized.split(' ').filter((word) => word && !STOP_WORDS.has(word) && !/^hn\d+$/i.test(word));
  const phrases = new Set<string>();
  if (words.length >= 2) phrases.add(words.slice(0, Math.min(5, words.length)).join(' '));
  for (const group of [...CORE_GROUPS, ...SECONDARY_GROUPS]) {
    if (group.words.some((word) => normalized.includes(word))) phrases.add(group.name.toLowerCase());
  }
  for (let size = 2; size <= Math.min(4, words.length); size += 1) {
    for (let index = 0; index <= words.length - size; index += 1) {
      const phrase = words.slice(index, index + size).join(' ');
      if (phrase.length >= 8) phrases.add(phrase);
    }
  }
  return Array.from(phrases).slice(0, 8);
}

export function extractKeywordsFromSlug(slug: string) {
  const clean = cleanKeywordDisplay(slug.replace(/-/g, ' '));
  return extractKeywordsFromTitle(clean);
}

function keywordOverlap(keyword: string, text: string) {
  const key = normalizeKeyword(keyword);
  const haystack = normalizeKeyword(text);
  if (!key || !haystack) return 0;
  if (haystack.includes(key)) return 1;
  const words = key.split(' ').filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  if (!words.length) return 0;
  const matched = words.filter((word) => haystack.includes(word)).length;
  return matched / words.length;
}

function isQuestionKeyword(keyword: string) {
  const normalized = normalizeKeyword(keyword);
  return ['cach ', 'tai sao', 'co nen', 'nen ', 'kinh nghiem', 'bao nhieu', 'chon ', 'so sanh', 'loai nao'].some((word) => normalized.includes(word));
}

function isSpecificKeyword(keyword: string) {
  const raw = String(keyword ?? '');
  const normalized = normalizeKeyword(raw);
  return /hn\s*\d+/i.test(raw) || /\d/.test(normalized) || normalized.split(' ').length >= 5;
}

function isBroadCategoryKeyword(keyword: string) {
  const normalized = normalizeKeyword(keyword);
  return BROAD_CATEGORY_KEYWORDS.some((item) => normalized.includes(item) || item.includes(normalized));
}

function statusLabel(status: UsedKeywordStatus) {
  if (status === 'unused') return 'Chưa dùng';
  if (status === 'primary') return 'Đã có URL chính';
  if (status === 'cannibalization') return 'Có nguy cơ trùng từ khóa';
  if (status === 'update_old') return 'Nên cập nhật bài cũ';
  return 'Nên tạo bài hỗ trợ';
}

function buildUrlIndex(input: SeoWorkbenchBuildInput): UsedKeywordUrl[] {
  const urls: UsedKeywordUrl[] = [];
  input.products.forEach((product) => {
    const url = productUrl(product.slug);
    urls.push({
      url,
      title: product.name || product.slug || 'Sản phẩm',
      type: 'product',
      score: scoreItem([product.name, product.category].join(' '), product.issues || []),
      reason: [product.name, product.slug, product.category, readText(product, 'description'), readText(product, 'detailDescription'), readText(product, 'seo_content')].join(' '),
    });
  });
  input.blogs.forEach((blog) => {
    const url = blogUrl(blog.slug);
    urls.push({
      url,
      title: blog.title || blog.slug || 'Bài viết',
      type: 'blog',
      score: scoreItem([blog.title, blog.slug].join(' '), blog.issues || []),
      reason: [blog.title, blog.slug, blog.excerpt, readText(blog, 'content'), readText(blog, 'seo_content')].join(' '),
    });
  });
  input.clusters.forEach((cluster) => {
    const url = cluster.main_url || detectGroup(cluster.name).url;
    if (!url || url === '/') return;
    urls.push({
      url,
      title: cluster.name || url,
      type: 'category',
      score: businessScore(cluster.name || url) + Math.min(20, (cluster.product_count || 0) + (cluster.post_count || 0)),
      reason: [cluster.name, cluster.main_url, cluster.note].join(' '),
    });
  });
  input.keywords.forEach((keyword) => {
    if (!keyword.target_url) return;
    urls.push({
      url: keyword.target_url,
      title: keyword.keyword || keyword.target_url,
      type: 'keyword',
      score: toNumber(keyword.priority),
      reason: [keyword.keyword, keyword.cluster, keyword.target_url, keyword.note].join(' '),
    });
  });
  const unique = new Map<string, UsedKeywordUrl>();
  urls.forEach((url) => {
    const key = `${url.type}:${url.url}`;
    const current = unique.get(key);
    if (!current || url.score > current.score) unique.set(key, url);
  });
  return Array.from(unique.values());
}

function addUrlKeyword(map: Map<string, UsedKeywordUrl[]>, keyword: string, url: UsedKeywordUrl) {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return;
  const current = map.get(normalized) || [];
  if (!current.some((item) => item.url === url.url && item.type === url.type)) current.push(url);
  map.set(normalized, current);
}

export function detectUsedKeywordsFromBlogPosts(blogs: SeoBlogQualityItem[]) {
  const map = new Map<string, UsedKeywordUrl[]>();
  blogs.forEach((blog) => {
    const url: UsedKeywordUrl = {
      url: blogUrl(blog.slug),
      title: blog.title || blog.slug || 'Bài viết',
      type: 'blog',
      score: scoreItem([blog.title, blog.slug].join(' '), blog.issues || []),
      reason: [blog.title, blog.slug, blog.excerpt, readText(blog, 'content')].join(' '),
    };
    [...extractKeywordsFromTitle(blog.title || ''), ...extractKeywordsFromSlug(blog.slug || '')].forEach((keyword) => addUrlKeyword(map, keyword, url));
  });
  return map;
}

export function detectUsedKeywordsFromProducts(products: ProductSeoItem[]) {
  const map = new Map<string, UsedKeywordUrl[]>();
  products.forEach((product) => {
    const url: UsedKeywordUrl = {
      url: productUrl(product.slug),
      title: product.name || product.slug || 'Sản phẩm',
      type: 'product',
      score: scoreItem([product.name, product.category].join(' '), product.issues || []),
      reason: [product.name, product.slug, product.category, readText(product, 'description')].join(' '),
    };
    [...extractKeywordsFromTitle(product.name || ''), ...extractKeywordsFromSlug(product.slug || ''), productMainKeyword(product)].forEach((keyword) => addUrlKeyword(map, keyword, url));
  });
  return map;
}

export function detectKeywordCannibalization(keyword: string, urls: UsedKeywordUrl[]) {
  if (urls.length < 2) return false;
  const realUrls = new Set(urls.map((url) => url.url));
  if (realUrls.size < 2) return false;
  if (isSpecificKeyword(keyword) && !isBroadCategoryKeyword(keyword)) return urls.filter((url) => url.type === 'product').length > 1;
  return normalizeKeyword(keyword).split(' ').length >= 2;
}

export function findPrimaryUrlForKeyword(keyword: string, urls: UsedKeywordUrl[], saved?: KeywordPrimaryMapEntry) {
  if (saved?.primaryUrl) {
    return urls.find((url) => url.url === saved.primaryUrl) || { url: saved.primaryUrl, title: saved.keyword, type: saved.urlType, score: 100, reason: saved.note || 'URL chính do bạn chọn.' };
  }
  const group = detectGroup(keyword);
  const category = urls.find((url) => url.type === 'category' && (url.url === group.url || keywordOverlap(keyword, url.title) >= 0.7));
  if (isBroadCategoryKeyword(keyword) && category) return category;
  if (isSpecificKeyword(keyword)) {
    const product = urls.find((url) => url.type === 'product') || urls.find((url) => url.type === 'keyword' && url.url.includes('/san-pham/'));
    if (product) return product;
  }
  if (isQuestionKeyword(keyword)) {
    const blog = urls.find((url) => url.type === 'blog');
    if (blog) return blog;
  }
  if (category) return category;
  return [...urls].sort((a, b) => b.score - a.score)[0];
}

function recommendationForKeyword(keyword: string, status: UsedKeywordStatus, primary?: UsedKeywordUrl, urls: UsedKeywordUrl[] = []) {
  if (status === 'unused') return 'Chưa có URL rõ ràng. Nên tạo bài hỗ trợ hoặc landing page nếu keyword thuộc nhóm hàng chủ đạo.';
  if (status === 'cannibalization') return `Có ${urls.length} URL cùng bắt keyword này. Nên chọn một URL chính, các URL còn lại trỏ internal link về URL chính.`;
  if (status === 'update_old') return `Không nên viết bài mới trùng. Nên cập nhật lại ${primary?.title || 'URL hiện có'}: bổ sung FAQ, ảnh thật, title/meta và internal link.`;
  if (status === 'support_article') return `Đã có URL chính ${primary?.url || ''}. Nên viết bài hỗ trợ long-tail và link về URL chính.`;
  return `Đã có URL chính. Tiếp tục bổ sung internal link, FAQ và nội dung thực tế cho ${primary?.title || keyword}.`;
}

function taskForKeyword(keyword: string, status: UsedKeywordStatus, primary?: UsedKeywordUrl) {
  if (status === 'unused') return `Kiểm tra keyword "${keyword}" và tạo nội dung hỗ trợ nếu có sản phẩm/danh mục phù hợp.`;
  if (status === 'cannibalization') return `Chọn URL chính cho "${keyword}" và chỉnh các trang trùng để trỏ về URL chính.`;
  if (status === 'update_old') return `Cập nhật URL cũ cho "${keyword}": ${primary?.url || 'URL hiện có'}.`;
  if (status === 'support_article') return `Viết bài hỗ trợ cho "${keyword}" và đặt link về ${primary?.url || 'URL chính'}.`;
  return `Đẩy SEO cho "${keyword}" bằng internal link về ${primary?.url || 'URL chính'}.`;
}

export function buildUsedKeywordInsights(input: SeoWorkbenchBuildInput, savedMap: Record<string, KeywordPrimaryMapEntry> = {}): UsedKeywordInsight[] {
  const candidates = new Map<string, string>();
  const urls = buildUrlIndex(input);

  CORE_GROUPS.forEach((group) => {
    addCandidate(candidates, group.name);
    group.words.forEach((word) => addCandidate(candidates, word));
  });
  SECONDARY_GROUPS.forEach((group) => {
    addCandidate(candidates, group.name);
    group.words.forEach((word) => addCandidate(candidates, word));
  });
  input.products.forEach((product) => {
    addCandidate(candidates, productMainKeyword(product));
    extractKeywordsFromTitle(product.name || '').forEach((keyword) => addCandidate(candidates, keyword));
    extractKeywordsFromSlug(product.slug || '').forEach((keyword) => addCandidate(candidates, keyword));
  });
  input.blogs.forEach((blog) => {
    extractKeywordsFromTitle(blog.title || '').forEach((keyword) => addCandidate(candidates, keyword));
    extractKeywordsFromSlug(blog.slug || '').forEach((keyword) => addCandidate(candidates, keyword));
  });
  input.keywords.forEach((keyword) => addCandidate(candidates, keyword.keyword));
  input.clusters.forEach((cluster) => addCandidate(candidates, cluster.name));
  (input.searchConsole?.queries || []).forEach((query) => addCandidate(candidates, query.query));
  (input.googleAds?.rows || []).forEach((row) => addCandidate(candidates, row.keyword));

  const selectedCandidates = Array.from(candidates.entries())
    .sort((a, b) => keywordCandidatePriority(b[1]) - keywordCandidatePriority(a[1]) || a[0].localeCompare(b[0]))
    .slice(0, 180);

  const insights = selectedCandidates.map(([normalizedKeyword, keyword]) => {
    const relatedUrls = urls
      .filter((url) => keywordOverlap(keyword, `${url.title} ${url.reason} ${url.url}`) >= 0.55)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    const saved = savedMap[normalizedKeyword] || savedMap[keyword];
    const primary = findPrimaryUrlForKeyword(keyword, relatedUrls, saved);
    const sc = matchSearchConsole(keyword, input.searchConsole);
    const ads = matchAds(keyword, input.googleAds);
    const isCore = businessScore(keyword) >= 35;
    const hasCannibalization = detectKeywordCannibalization(keyword, relatedUrls);
    let status: UsedKeywordStatus = 'unused';
    if (hasCannibalization) status = 'cannibalization';
    else if (primary && (primary.type === 'blog' || primary.type === 'product') && (sc?.position || 0) > 10) status = 'update_old';
    else if (primary && isBroadCategoryKeyword(keyword) && (ads?.volume || sc?.impressions || 0) > 0) status = 'support_article';
    else if (primary) status = 'primary';

    return {
      keyword,
      normalizedKeyword,
      status,
      label: statusLabel(status),
      primaryUrl: primary?.url,
      primaryUrlType: primary?.type,
      urls: relatedUrls,
      competingCount: relatedUrls.length,
      recommendation: recommendationForKeyword(keyword, status, primary, relatedUrls),
      anchorText: keyword,
      taskText: taskForKeyword(keyword, status, primary),
      core: isCore,
      source: [sc ? 'Search Console' : '', ads ? 'Keyword Planner' : '', primary ? 'Supabase' : ''].filter(Boolean).join(' + ') || 'Supabase',
      searchConsole: sc,
      ads,
    };
  });

  return insights
    .sort((a, b) => {
      const scoreA = businessScore(a.keyword) + (a.status === 'cannibalization' ? 30 : 0) + (a.status === 'unused' ? 20 : 0) + (a.searchConsole?.impressions || 0) / 100 + (a.ads?.volume || 0) / 100;
      const scoreB = businessScore(b.keyword) + (b.status === 'cannibalization' ? 30 : 0) + (b.status === 'unused' ? 20 : 0) + (b.searchConsole?.impressions || 0) / 100 + (b.ads?.volume || 0) / 100;
      return scoreB - scoreA;
    })
    .slice(0, 180);
}

export function filterUsedKeywordInsights(insights: UsedKeywordInsight[], options: { filter: UsedKeywordFilterKey; search: string; page: number; pageSize: number }) {
  const search = normalizeKeyword(options.search);
  const filtered = insights.filter((insight) => {
    const text = normalizeKeyword(`${insight.keyword} ${insight.primaryUrl || ''} ${insight.recommendation} ${insight.urls.map((url) => url.title).join(' ')}`);
    if (search && !text.includes(search)) return false;
    if (options.filter === 'all') return true;
    if (options.filter === 'core') return insight.core;
    if (options.filter === 'searchConsole') return Boolean(insight.searchConsole);
    if (options.filter === 'keywordPlanner') return Boolean(insight.ads);
    return insight.status === options.filter;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / options.pageSize));
  const page = Math.min(Math.max(1, options.page), totalPages);
  return {
    total: filtered.length,
    page,
    totalPages,
    items: filtered.slice((page - 1) * options.pageSize, page * options.pageSize),
  };
}

function titleFor(item: SeoWorkbenchItem) {
  const base = item.title.replace(/\s+/g, ' ').trim();
  const group = detectGroup(`${item.title} ${item.cluster} ${item.mainKeyword}`);
  if (item.type === 'product') {
    const code = base.match(/HN\d+/i)?.[0] || '';
    const keyword = item.mainKeyword || base;
    return limitText(`${capitalizeFirst(keyword)} ${code} giá xưởng tại Hà Nội`.replace(/\s+/g, ' '), 60);
  }
  if (item.type === 'blog') return limitText(`${base} - Kinh nghiệm chọn mua thực tế`, 60);
  if (item.type === 'category') return limitText(`${item.title} giá xưởng tại Hà Nội`, 60);
  return limitText(`${capitalizeFirst(item.mainKeyword)} - Nên chọn mẫu nào?`, 60);
}

function capitalizeFirst(value: string) {
  const text = value.trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function metaFor(item: SeoWorkbenchItem) {
  const keyword = item.mainKeyword || item.title;
  const group = detectGroup(`${item.title} ${item.cluster}`);
  const benefit = group.core ? 'ưu tiên độ bền, giá xưởng và giao nhanh tại Hà Nội' : 'phù hợp nhu cầu thực tế, dễ chọn mẫu và báo giá';
  return limitText(`${capitalizeFirst(keyword)} tại Nội Thất Hùng Ngọc, ${benefit}. Xem mẫu, thông số và nhận tư vấn nhanh trước khi đặt hàng.`, 158);
}

function faqFor(item: SeoWorkbenchItem): SeoFaqSuggestion[] {
  const keyword = item.mainKeyword || item.title;
  const group = detectGroup(`${item.title} ${item.cluster} ${keyword}`);
  const common: SeoFaqSuggestion[] = [
    { question: `${capitalizeFirst(keyword)} có sẵn hàng không?`, answer: 'Nội Thất Hùng Ngọc thường có sẵn nhiều mẫu phổ biến. Với số lượng lớn hoặc kích thước riêng, shop sẽ kiểm tra kho và báo thời gian giao cụ thể.' },
    { question: `Có giao hàng tại Hà Nội không?`, answer: 'Có. Shop hỗ trợ giao hàng khu vực Hà Nội và các tỉnh lân cận, phí giao phụ thuộc địa chỉ, số lượng và kích thước sản phẩm.' },
    { question: `Có nhận báo giá số lượng lớn không?`, answer: 'Có. Khách hàng mua cho văn phòng, trường học, nhà xưởng hoặc dự án có thể gửi số lượng để Nội Thất Hùng Ngọc báo giá sát hơn.' },
  ];
  if (group.name === 'Giường sắt') {
    return [
      { question: 'Giường tầng sắt có chịu lực tốt không?', answer: 'Các mẫu giường sắt được thiết kế khung chắc, phù hợp gia đình, phòng trọ, ký túc xá hoặc khu công nhân nếu chọn đúng kích thước và tải trọng.' },
      { question: 'Có nhận đặt kích thước theo yêu cầu không?', answer: 'Một số mẫu có thể đặt theo kích thước riêng. Bạn nên gửi chiều dài, chiều rộng và nhu cầu sử dụng để shop tư vấn mẫu phù hợp.' },
      ...common,
    ].slice(0, 5);
  }
  if (group.name === 'Bàn làm việc') {
    return [
      { question: 'Bàn làm việc nên chọn kích thước nào?', answer: 'Văn phòng nhỏ thường dùng bàn 1m2 hoặc 1m4. Nếu đặt máy tính, hồ sơ hoặc làm việc nhóm, nên chọn mặt bàn rộng hơn và có hộc nếu cần lưu trữ.' },
      { question: 'Bàn có phù hợp văn phòng số lượng lớn không?', answer: 'Có. Các mẫu bàn chân sắt, bàn Fami và bàn văn phòng phổ thông phù hợp mua số lượng cho công ty, phòng làm việc hoặc setup văn phòng mới.' },
      ...common,
    ].slice(0, 5);
  }
  if (group.name === 'Trường học') {
    return [
      { question: 'Bàn ghế học sinh có phù hợp trường học không?', answer: 'Các mẫu bàn ghế học sinh, bảng từ và nội thất trường học được chọn theo độ bền, kích thước và nhu cầu sử dụng thực tế của lớp học.' },
      { question: 'Có báo giá theo số lượng cho trường học không?', answer: 'Có. Khách hàng nên gửi số lượng, kích thước và địa điểm giao để shop tư vấn mẫu và báo giá phù hợp.' },
      ...common,
    ].slice(0, 5);
  }
  return common.slice(0, 4);
}

function internalLinksFor(item: SeoWorkbenchItem): SeoInternalLinkSuggestion[] {
  const group = detectGroup(`${item.title} ${item.cluster} ${item.mainKeyword}`);
  const links: SeoInternalLinkSuggestion[] = [];
  if (group.url !== '/') {
    links.push({ url: group.url, anchor: group.anchors[0] || group.name.toLowerCase(), reason: 'Gom sức mạnh SEO về danh mục chính có khả năng bán hàng.' });
  }
  if (group.name === 'Bàn làm việc') {
    links.push({ url: '/ban-van-phong/', anchor: 'bàn văn phòng giá xưởng', reason: 'Liên kết sang danh mục gần nghĩa để tăng độ phủ từ khóa.' });
  }
  if (group.name === 'Trường học') {
    links.push({ url: '/ban-ghe-hoc-sinh/', anchor: 'bàn ghế học sinh giá rẻ', reason: 'Đẩy thêm danh mục có nhu cầu mua theo số lượng.' });
    links.push({ url: '/bang-tu/', anchor: 'bảng từ trường học', reason: 'Gợi ý thêm sản phẩm liên quan trong cùng nhóm trường học.' });
  }
  if (item.url && item.type !== 'product') {
    links.push({ url: item.url, anchor: item.title.toLowerCase(), reason: 'Giữ liên kết tới trang đang tối ưu để người đọc xem chi tiết.' });
  }
  return links.slice(0, 4);
}

function contentHtmlFor(item: SeoWorkbenchItem, faqs: SeoFaqSuggestion[], links: SeoInternalLinkSuggestion[]) {
  const keyword = item.mainKeyword || item.title;
  const title = titleFor(item);
  const linkHtml = links.map((link) => `<li><a href="${link.url}">${link.anchor}</a> - ${link.reason}</li>`).join('\n');
  const faqHtml = faqs.map((faq) => `<div class="faq-item">\n  <h3>${faq.question}</h3>\n  <p>${faq.answer}</p>\n</div>`).join('\n');
  return `<h2>${title}</h2>\n<p>${capitalizeFirst(keyword)} là lựa chọn phù hợp cho khách hàng cần sản phẩm bền, dễ sử dụng và có mức giá sát nhu cầu thực tế. Nội Thất Hùng Ngọc hỗ trợ tư vấn mẫu, kiểm tra hàng và báo giá theo số lượng.</p>\n<h3>Điểm nên chú ý khi chọn ${keyword}</h3>\n<ul>\n  <li>Kiểm tra kích thước thực tế của không gian sử dụng.</li>\n  <li>Ưu tiên chất liệu bền, dễ vệ sinh và phù hợp tần suất sử dụng.</li>\n  <li>Nên hỏi trước tình trạng hàng, bảo hành và phí vận chuyển.</li>\n</ul>\n<h3>Liên kết nội bộ nên thêm</h3>\n<ul>\n${linkHtml}\n</ul>\n<h2>Câu hỏi thường gặp</h2>\n${faqHtml}\n<p>Khách hàng cần báo giá hoặc tư vấn nhanh có thể liên hệ Nội Thất Hùng Ngọc để được kiểm tra mẫu phù hợp trước khi đặt hàng.</p>`;
}

export function buildSeoWorkbenchSuggestion(item: SeoWorkbenchItem, keywordInsight?: UsedKeywordInsight): SeoWorkbenchSuggestion {
  const faqs = faqFor(item);
  const internalLinks = internalLinksFor(item);
  const title = titleFor(item);
  const metaDescription = metaFor(item);
  const primaryKeyword = item.mainKeyword || item.title.toLowerCase();
  const secondaryKeywords = mergeKeywords(item.secondaryKeywords, [item.cluster, ...internalLinks.map((link) => link.anchor)]).slice(0, 6);
  return {
    item,
    keywordInsight,
    primaryKeyword,
    secondaryKeywords,
    title,
    metaDescription,
    h1: title.replace(/ tại Hà Nội$/i, ''),
    h2: [`Vì sao nên chọn ${primaryKeyword}?`, `Thông số và nhu cầu sử dụng`, `Câu hỏi thường gặp về ${primaryKeyword}`],
    faqs,
    internalLinks,
    shortDescription: limitText(`${capitalizeFirst(primaryKeyword)} phù hợp nhu cầu sử dụng thực tế, ưu tiên độ bền, giá xưởng và hỗ trợ giao hàng tại Hà Nội.`, 180),
    contentHtml: contentHtmlFor(item, faqs, internalLinks),
    checklist: [
      ...(keywordInsight && keywordInsight.status !== 'unused' ? ['Đã kiểm tra tránh viết trùng keyword', 'Đã xác định URL chính cần đẩy SEO'] : []),
      'Đã có title SEO tốt',
      'Đã có meta description',
      'Đã có H1/H2 rõ',
      'Đã có FAQ',
      'Đã có internal link về danh mục chính',
      'Đã có link từ bài viết liên quan',
      'Đã có ảnh thật nếu có',
      'Đã có mô tả chi tiết',
      'Đã có từ khóa chính trong đoạn đầu',
      'Đã kiểm tra URL không lỗi 404',
    ],
  };
}

export function seoWorkbenchChecklistKey(item: SeoWorkbenchItem) {
  return `${item.type}:${item.slug || item.url || item.id}`;
}

