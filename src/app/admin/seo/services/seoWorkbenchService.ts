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
export type UsedKeywordStatus = 'unused' | 'suggested_primary' | 'primary' | 'cannibalization' | 'category_product_duplicate' | 'blog_product_duplicate' | 'update_old' | 'support_article' | 'manual_check';
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
  groupName?: string;
  groupUrl?: string;
}

export interface UsedKeywordInsight {
  keyword: string;
  normalizedKeyword: string;
  status: UsedKeywordStatus;
  label: string;
  primaryUrl?: string;
  primaryUrlType?: WorkbenchTargetType;
  suggestedPrimaryUrl?: string;
  suggestedPrimaryUrlType?: WorkbenchTargetType;
  urls: UsedKeywordUrl[];
  competingUrls: UsedKeywordUrl[];
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

export interface UsedKeywordInsightBuildOptions {
  candidateOffset?: number;
  candidateLimit?: number;
  candidateCap?: number;
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
  { name: 'Ghe chan quy', url: '/ghe-chan-quy/', words: ['ghe chan quy', 'ghe quy', 'ghe hop chan quy', 'ghe chan quy lung luoi'] },
  { name: 'Ghe xoay van phong', url: '/ghe-xoay-van-phong/', words: ['ghe xoay', 'ghe xoay van phong', 'ghe ngoi xoay'] },
  { name: 'Ghe giam doc', url: '/ghe-giam-doc/', words: ['ghe giam doc', 'ghe lanh dao', 'ghe truong phong'] },
  { name: 'Tu locker', url: '/tu-locker/', words: ['tu locker', 'tu sat locker'] },
  { name: 'Tu van phong', url: '/tu-van-phong/', words: ['tu van phong', 'tu ho so', 'tu tai lieu'] },
];

const SPECIFIC_GROUP_RULES = [
  { name: 'Giuong tang sat', url: '/giuong-tang-sat/', words: ['giuong tang sat', 'giuong sat 2 tang', 'giuong 2 tang sat', 'giuong sat', 'giuong don sat', 'giuong nha tro', 'giuong ky tuc xa', 'giuong phong tro', 'hn4'], exclude: ['giuong go', 'go soi', 'go cong nghiep'] },
  { name: 'Giuong go', url: '/giuong-go/', words: ['giuong go', 'giuong ngu go', 'giuong go cong nghiep', 'giuong go gap gon', 'giuong co ngan keo'], exclude: ['giuong sat', 'giuong tang sat', 'ky tuc xa'] },
  { name: 'Ghe chan quy', url: '/ghe-chan-quy/', words: ['ghe chan quy', 'ghe quy', 'ghe hop chan quy', 'ghe chan quy lung luoi', 'ghe chan quy van phong', 'ghe phong hop'], exclude: ['ghe xoay', 'ghe giam doc', 'ghe gaming', 'ghe gap'] },
  { name: 'Ghe xoay van phong', url: '/ghe-xoay-van-phong/', words: ['ghe xoay', 'ghe xoay van phong', 'ghe ngoi xoay', 'ghe luoi van phong'], exclude: ['ghe chan quy', 'ghe quy', 'ghe giam doc', 'ghe gaming', 'ghe gap'] },
  { name: 'Ghe giam doc', url: '/ghe-giam-doc/', words: ['ghe giam doc', 'ghe lanh dao', 'ghe truong phong'], exclude: ['ghe xoay', 'ghe chan quy', 'ghe gaming', 'ghe gap'] },
  { name: 'Ghe gaming', url: '/ghe-gaming/', words: ['ghe gaming', 'ghe choi game'], exclude: ['ghe xoay van phong', 'ghe chan quy', 'ghe giam doc'] },
  { name: 'Ghe gap', url: '/ghe-gap/', words: ['ghe gap', 'ghe gap van phong'], exclude: ['ghe xoay', 'ghe chan quy', 'ghe giam doc'] },
  { name: 'Tu locker', url: '/tu-locker/', words: ['tu locker', 'tu sat locker', 'tu locker sat', 'tu locker nhieu ngan', 'tu locker 6 ngan', 'tu locker 9 ngan', 'tu locker 12 ngan'], exclude: ['tu quan ao', 'tu giay', 'tu tai lieu'] },
  { name: 'Tu tai lieu sat', url: '/tu-tai-lieu-sat/', words: ['tu tai lieu sat', 'tu sat van phong', 'tu ho so sat', 'tu sat dung tai lieu'], exclude: ['tu locker', 'tu go', 'tu quan ao', 'tu giay'] },
  { name: 'Tu tai lieu go', url: '/tu-tai-lieu-go/', words: ['tu tai lieu go', 'tu ho so go', 'tu van phong go', 'tu go van phong'], exclude: ['tu sat', 'tu locker', 'tu quan ao', 'tu giay'] },
  { name: 'Hoc tu', url: '/hoc-tu/', words: ['hoc tu', 'hoc di dong', 'hoc tu van phong'], exclude: ['tu locker', 'tu quan ao'] },
  { name: 'Tu phu', url: '/tu-phu/', words: ['tu phu', 'tu phu ban lam viec'], exclude: ['tu locker', 'tu quan ao'] },
  { name: 'Tu quan ao', url: '/tu-quan-ao/', words: ['tu quan ao', 'tu ao', 'tu quan ao go', 'tu quan ao sat'], exclude: ['tu locker', 'tu tai lieu', 'tu van phong'] },
  { name: 'Tu giay', url: '/tu-giay/', words: ['tu giay', 'tu de giay'], exclude: ['tu locker', 'tu tai lieu'] },
  { name: 'Ban giam doc', url: '/ban-giam-doc/', words: ['ban giam doc', 'ban lanh dao', 'ban truong phong'], exclude: ['ban nhan vien', 'ban hop', 'ban hoc sinh', 'ban trang diem'] },
  { name: 'Ban hop', url: '/ban-hop/', words: ['ban hop', 'ban hop van phong', 'ban phong hop'], exclude: ['ban nhan vien', 'ban giam doc', 'ban hoc sinh', 'ban trang diem'] },
  { name: 'Ban chan sat', url: '/ban-chan-sat/', words: ['ban chan sat', 'ban lam viec chan sat', 'ban sat van phong', 'ban chan sat chu k', 'ban chan sat chu z', 'ban chan sat 1m2'], exclude: ['ban giam doc', 'ban hop', 'ban hoc sinh', 'ban trang diem'] },
  { name: 'Cum ban lam viec', url: '/cum-ban-lam-viec/', words: ['cum ban lam viec', 'cum ban nhan vien', 'module ban lam viec', 'cum ban'], exclude: ['ban giam doc', 'ban hop', 'ban hoc sinh'] },
  { name: 'Quay le tan', url: '/quay-le-tan/', words: ['quay le tan', 'ban le tan'], exclude: ['ban nhan vien', 'ban giam doc', 'ban hop'] },
  { name: 'Ban nhan vien', url: '/ban-nhan-vien/', words: ['ban nhan vien', 'ban lam viec nhan vien', 'ban van phong nhan vien'], exclude: ['ban giam doc', 'ban hop', 'ban hoc sinh', 'ban trang diem', 'quay le tan'] },
  { name: 'Ban van phong', url: '/ban-van-phong/', words: ['ban van phong', 'ban lam viec van phong', 'ban lam viec'], exclude: ['ban giam doc', 'ban hop', 'ban hoc sinh', 'ban trang diem', 'quay le tan'] },
  { name: 'Ban ghe hoc sinh', url: '/ban-ghe-hoc-sinh/', words: ['ban ghe hoc sinh', 'ban hoc sinh', 'ghe hoc sinh'], exclude: ['ban nhan vien', 'ban giam doc', 'ban hop', 'ghe van phong'] },
  { name: 'Ban ghe giao vien', url: '/ban-ghe-giao-vien/', words: ['ban ghe giao vien', 'ban giao vien', 'ghe giao vien'], exclude: ['ban hoc sinh'] },
  { name: 'Bang tu', url: '/bang-tu/', words: ['bang tu', 'bang trang', 'bang viet but long'], exclude: ['ban ', 'ghe ', 'tu '] },
  { name: 'Ban trang diem', url: '/ban-trang-diem/', words: ['ban trang diem', 'ban phan'], exclude: ['ban nhan vien', 'ban giam doc', 'ban hop'] },
  { name: 'Ke tivi', url: '/ke-tivi/', words: ['ke tivi', 'ke tivi go'], exclude: ['ke sach', 'ke de hang'] },
  { name: 'Ke sach', url: '/ke-sach/', words: ['ke sach', 'gia sach', 'ke sach van phong'], exclude: ['ke tivi', 'ke de hang'] },
  { name: 'Ke treo quan ao', url: '/ke-treo-quan-ao/', words: ['ke treo quan ao', 'gia treo quan ao'], exclude: ['ke tivi', 'ke sach'] },
  { name: 'Ke de hang', url: '/ke-de-hang/', words: ['ke de hang', 'ke kho', 'ke sat de hang'], exclude: ['ke tivi', 'ke sach'] },
  { name: 'Ke trang tri', url: '/ke-trang-tri/', words: ['ke trang tri'], exclude: ['ke tivi', 'ke sach', 'ke de hang'] },
  { name: 'Ke go', url: '/ke-go/', words: ['ke go', 'ke go trang tri'], exclude: ['ke tivi', 'ke sach', 'ke de hang'] },
  { name: 'Ket sat', url: '/ket-sat/', words: ['ket sat', 'ket bac', 'ket an toan'], exclude: ['tu sat', 'ke sat', 'giuong sat'] },
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
  return clean ? `/san-pham/${clean}/` : '';
}

function blogUrl(slug?: string | null) {
  const clean = cleanSlug(slug);
  return clean ? `/tin-tuc/${clean}/` : '/tin-tuc/';
}

function normalizeSearchValue(value: unknown) {
  return normalizeKeyword(value).replace(/[-/]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeUrlPath(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  let path = raw;
  try {
    if (/^https?:\/\//i.test(raw)) path = new URL(raw).pathname;
  } catch {
    path = raw;
  }
  path = path.split('?')[0].split('#')[0].trim();
  if (!path.startsWith('/')) path = '/' + path;
  return path.endsWith('/') ? path : path + '/';
}

function tokenSet(value: string) {
  return new Set(normalizeKeyword(value).split(' ').filter((word) => word.length > 2 && !STOP_WORDS.has(word)));
}

function strictKeywordMatch(keyword: string, text: string) {
  const key = normalizeKeyword(keyword);
  const haystack = normalizeKeyword(text);
  if (!key || !haystack) return false;
  if (key.length >= 6 && haystack.includes(key)) return true;
  if (haystack.length >= 6 && key.includes(haystack)) return true;
  const keyTokens = Array.from(tokenSet(key));
  const textTokens = Array.from(tokenSet(haystack));
  if (keyTokens.length < 2 || textTokens.length < 2) return false;
  const matched = keyTokens.filter((word) => textTokens.includes(word)).length;
  return matched >= 2 && matched / keyTokens.length >= 0.65;
}

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function detectSpecificGroup(text: string) {
  const normalized = normalizeSearchValue(text);
  return SPECIFIC_GROUP_RULES.find((group) => {
    if (group.exclude.some((word) => normalized.includes(word.trim()))) return false;
    return group.words.some((word) => normalized.includes(word));
  });
}

function detectGroupByUrl(url: string) {
  const path = normalizeUrlPath(url);
  return SPECIFIC_GROUP_RULES.find((group) => path === group.url || path.startsWith(group.url));
}

function detectGroup(text: string) {
  const specific = detectSpecificGroup(text);
  if (specific) return { ...specific, anchors: [specific.name.toLowerCase()], core: specific.url === '/giuong-tang-sat/' || specific.url === '/ban-nhan-vien/' || specific.url === '/ban-ghe-hoc-sinh/' };
  const normalized = normalizeText(text);
  const core = CORE_GROUPS.find((group) => group.words.some((word) => normalized.includes(word)));
  if (core) return { ...core, core: true };
  const secondary = SECONDARY_GROUPS.find((group) => group.words.some((word) => normalized.includes(word)));
  if (secondary) return { ...secondary, anchors: [secondary.name.toLowerCase()], core: false };
  return { name: 'Noi that van phong', url: '/', words: [], anchors: ['noi that gia xuong'], core: false };
}

function businessScore(text: string) {
  const group = detectGroup(text);
  if (group.core) return 28;
  if (['/ghe-chan-quy/', '/ghe-giam-doc/', '/tu-locker/', '/tu-tai-lieu-sat/', '/tu-tai-lieu-go/'].includes(group.url)) return 12;
  return 6;
}

function aggregateSearchConsoleRows(rows: SearchConsoleQuery[]) {
  if (!rows.length) return undefined;
  const impressions = rows.reduce((sum, row) => sum + toNumber(row.impressions), 0);
  const clicks = rows.reduce((sum, row) => sum + toNumber(row.clicks), 0);
  const ctr = impressions ? clicks / impressions * 100 : rows.reduce((sum, row) => sum + toNumber(row.ctr), 0) / rows.length;
  const position = rows.reduce((sum, row) => sum + toNumber(row.position), 0) / rows.length;
  return { impressions, clicks, ctr, position };
}

function matchSearchConsole(text: string, searchConsole: SearchConsoleV7Data | null, targetUrl?: string) {
  const exactPath = normalizeUrlPath(targetUrl);
  if (exactPath) {
    const exactRows = (searchConsole?.pages || [])
      .filter((page) => normalizeUrlPath(page.page) === exactPath)
      .map((page) => ({ query: page.page, page: page.page, clicks: page.clicks, impressions: page.impressions, ctr: page.ctr, position: page.position } as SearchConsoleQuery));
    const exact = aggregateSearchConsoleRows(exactRows);
    if (exact) return exact;
  }

  const matched = (searchConsole?.queries || []).filter((row) => strictKeywordMatch(text, row.query || ''));
  return aggregateSearchConsoleRows(matched);
}

function matchSearchConsoleByUrl(searchConsole: SearchConsoleV7Data | null, targetUrl?: string) {
  const exactPath = normalizeUrlPath(targetUrl);
  if (!exactPath) return undefined;
  const exactRows = (searchConsole?.pages || [])
    .filter((page) => normalizeUrlPath(page.page) === exactPath)
    .map((page) => ({ query: page.page, page: page.page, clicks: page.clicks, impressions: page.impressions, ctr: page.ctr, position: page.position } as SearchConsoleQuery));
  return aggregateSearchConsoleRows(exactRows);
}

function matchAds(text: string, googleAds: GoogleAdsImportData | null) {
  const rows = googleAds?.rows || [];
  const matched = rows
    .filter((row) => strictKeywordMatch(text, row.keyword))
    .sort((a, b) => {
      const aExact = normalizeKeyword(a.keyword) === normalizeKeyword(text) ? 1 : 0;
      const bExact = normalizeKeyword(b.keyword) === normalizeKeyword(text) ? 1 : 0;
      return bExact - aExact || toNumber(b.avg_monthly_searches) - toNumber(a.avg_monthly_searches);
    })
    .slice(0, 12);
  if (!matched.length) return undefined;
  const volume = matched.reduce((sum, row) => sum + toNumber(row.avg_monthly_searches), 0);
  const cpcRows = matched.filter((row) => row.cpc || row.low_top_of_page_bid || row.high_top_of_page_bid);
  const cpc = cpcRows.length ? cpcRows.reduce((sum, row) => sum + toNumber(row.cpc || row.low_top_of_page_bid || row.high_top_of_page_bid), 0) / cpcRows.length : undefined;
  const competition = matched.find((row) => row.competition)?.competition;
  return { volume, cpc, competition };
}

function matchAdsStrict(text: string, googleAds: GoogleAdsImportData | null) {
  const target = normalizeKeyword(text);
  if (!target) return undefined;
  const rows = (googleAds?.rows || []).filter((row) => {
    const keyword = normalizeKeyword(row.keyword);
    return keyword === target || strictKeywordMatch(target, keyword) && keywordOverlap(target, keyword) >= 0.9;
  }).slice(0, 4);
  if (!rows.length) return undefined;
  const volume = rows.reduce((sum, row) => sum + toNumber(row.avg_monthly_searches), 0);
  const cpcRows = rows.filter((row) => row.cpc || row.low_top_of_page_bid || row.high_top_of_page_bid);
  const cpc = cpcRows.length ? cpcRows.reduce((sum, row) => sum + toNumber(row.cpc || row.low_top_of_page_bid || row.high_top_of_page_bid), 0) / cpcRows.length : undefined;
  const competition = rows.find((row) => row.competition)?.competition;
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
    const url = productUrl(product.slug);
    const mainKeyword = productMainKeyword(product);
    const sc = matchSearchConsoleByUrl(input.searchConsole, url);
    const ads = matchAdsStrict(mainKeyword, input.googleAds) || matchAdsStrict(product.name, input.googleAds);
    const issues = product.issues || [];
    const group = detectGroup(text);
    const secondaryKeywords = mergeKeywords([product.category || undefined, product.parent_slug || undefined, group.name, product.name.split('-')[0]]).slice(0, 5);
    items.push({
      id: `product-${product.id}-${product.slug}`,
      type: 'product',
      title: product.name,
      slug: product.slug,
      url,
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
    const url = blogUrl(blog.slug);
    const sc = matchSearchConsole(text, input.searchConsole, url);
    const ads = matchAds(text, input.googleAds);
    const group = detectGroup(text);
    const issues = blog.issues || [];
    const titleKeyword = blog.title.replace(/[-â€“|].*$/, '').trim().toLowerCase();
    items.push({
      id: `blog-${blog.id}-${blog.slug}`,
      type: 'blog',
      title: blog.title,
      slug: blog.slug,
      url,
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
    const url = normalizeUrlPath(cluster.main_url || detectGroup(text).url);
    const sc = matchSearchConsole(text, input.searchConsole, url);
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
      url,
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
    const url = normalizeUrlPath(keyword.target_url || detectGroup(text).url);
    const sc = matchSearchConsole(text, input.searchConsole, url);
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
      url,
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

function collectUsedKeywordCandidates(input: SeoWorkbenchBuildInput) {
  const candidates = new Map<string, string>();

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

  return Array.from(candidates.entries())
    .sort((a, b) => keywordCandidatePriority(b[1]) - keywordCandidatePriority(a[1]) || a[0].localeCompare(b[0]));
}

export function countUsedKeywordCandidates(input: SeoWorkbenchBuildInput, candidateCap?: number) {
  const total = collectUsedKeywordCandidates(input).length;
  if (typeof candidateCap !== 'number') return total;
  return Math.min(Math.max(0, candidateCap), total);
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

function enrichUsedKeywordUrl(url: UsedKeywordUrl): UsedKeywordUrl {
  const urlGroup = detectGroupByUrl(url.url);
  const textGroup = detectSpecificGroup(`${url.title} ${url.reason} ${url.url}`);
  const group = urlGroup || textGroup;
  return group ? { ...url, groupName: group.name, groupUrl: group.url } : url;
}

function candidateUrlScore(keyword: string, url: UsedKeywordUrl) {
  const group = detectGroup(keyword);
  let score = 0;
  if (group.url && group.url !== '/' && url.groupUrl === group.url) {
    score += 100;
    if (url.type === 'category' && normalizeUrlPath(url.url) === group.url) score += 80;
    if (url.type === 'product') score += 45;
    if (url.type === 'blog') score += 25;
  }
  const overlap = keywordOverlap(keyword, `${url.title} ${url.reason} ${url.url}`);
  if (overlap >= 0.8) score += 45;
  else if (overlap >= 0.65) score += 25;
  else if (overlap >= 0.55) score += 10;
  return score + Math.min(20, url.score / 5);
}

function savedPrimaryUrlForKeyword(keyword: string, urls: UsedKeywordUrl[], saved?: KeywordPrimaryMapEntry) {
  const savedPath = normalizeUrlPath(saved?.primaryUrl);
  if (!saved || !savedPath) return undefined;

  const keywordGroup = detectGroup(keyword);
  const matchedUrl = urls.find((url) => normalizeUrlPath(url.url) === savedPath);
  if (keywordGroup.url && keywordGroup.url !== '/') {
    const matchedGroup = matchedUrl?.groupUrl || detectGroupByUrl(savedPath)?.url || '';
    if (matchedGroup && matchedGroup !== keywordGroup.url) return undefined;
    if (!matchedGroup && savedPath !== keywordGroup.url && !savedPath.startsWith(keywordGroup.url)) return undefined;
  }

  return matchedUrl || {
    url: savedPath,
    title: saved.keyword || keyword,
    type: saved.urlType,
    score: 100,
    reason: saved.note || 'URL chinh do ban chon.',
    groupName: keywordGroup.name,
    groupUrl: keywordGroup.url,
  };
}

function sortCandidateUrls(keyword: string, urls: UsedKeywordUrl[], saved?: KeywordPrimaryMapEntry) {
  const savedUrl = normalizeUrlPath(savedPrimaryUrlForKeyword(keyword, urls, saved)?.url);
  const strict = urls.filter((url) => candidateUrlScore(keyword, url) >= 35 || (savedUrl && normalizeUrlPath(url.url) === savedUrl));
  return strict
    .sort((a, b) => {
      const savedA = savedUrl && normalizeUrlPath(a.url) === savedUrl ? 1000 : 0;
      const savedB = savedUrl && normalizeUrlPath(b.url) === savedUrl ? 1000 : 0;
      return (savedB + candidateUrlScore(keyword, b)) - (savedA + candidateUrlScore(keyword, a));
    })
    .slice(0, 10);
}

function isRealContentMatch(keyword: string, url: UsedKeywordUrl) {
  const normalizedKeyword = normalizeSearchValue(keyword);
  if (!normalizedKeyword) return false;
  const normalizedText = normalizeSearchValue(`${url.title} ${url.reason} ${url.url}`);
  if (normalizedKeyword.length >= 6 && normalizedText.includes(normalizedKeyword)) return true;
  return keywordOverlap(keyword, normalizedText) >= 0.8;
}

function addUniqueUrl(target: Map<string, UsedKeywordUrl>, url: UsedKeywordUrl) {
  const key = `${url.type}:${normalizeUrlPath(url.url)}`;
  if (!target.has(key)) target.set(key, { ...url, url: normalizeUrlPath(url.url) });
}

function buildCompetingUrls(keyword: string, urls: UsedKeywordUrl[], input: SeoWorkbenchBuildInput, savedPrimary?: UsedKeywordUrl) {
  const keywordGroup = detectGroup(keyword);
  const savedPath = normalizeUrlPath(savedPrimary?.url);
  const matches = new Map<string, UsedKeywordUrl>();

  urls.forEach((url) => {
    if (url.type === 'category') return;
    if (savedPath && normalizeUrlPath(url.url) === savedPath) return;
    if (keywordGroup.url !== '/' && url.groupUrl && url.groupUrl !== keywordGroup.url) return;
    if (isRealContentMatch(keyword, url)) addUniqueUrl(matches, url);
  });

  (input.searchConsole?.queries || []).forEach((row) => {
    if (!row.page || !strictKeywordMatch(keyword, row.query || '')) return;
    const path = normalizeUrlPath(row.page);
    if (savedPath && path === savedPath) return;
    const known = urls.find((url) => normalizeUrlPath(url.url) === path);
    if (keywordGroup.url !== '/' && known?.groupUrl && known.groupUrl !== keywordGroup.url) return;
    addUniqueUrl(matches, known || {
      url: path,
      title: row.query || path,
      type: 'keyword',
      score: toNumber(row.impressions),
      reason: `Search Console ranking URL for ${row.query || keyword}`,
      groupName: keywordGroup.name,
      groupUrl: keywordGroup.url,
    });
  });

  return Array.from(matches.values()).sort((a, b) => b.score - a.score).slice(0, 20);
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
  if (status === 'unused') return 'Chưa có URL chính';
  if (status === 'suggested_primary') return 'Đề xuất URL chính';
  if (status === 'primary') return 'Đã có URL chính';
  if (status === 'cannibalization') return 'Có nguy cơ trùng từ khóa';
  if (status === 'category_product_duplicate') return 'Trùng giữa danh mục và sản phẩm';
  if (status === 'blog_product_duplicate') return 'Trùng giữa bài viết và sản phẩm';
  if (status === 'manual_check') return 'Cần kiểm tra thủ công';
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
  SPECIFIC_GROUP_RULES.forEach((group) => {
    urls.push({
      url: group.url,
      title: group.name,
      type: 'category',
      score: 80,
      reason: [group.name, group.url, ...group.words].join(' '),
      groupName: group.name,
      groupUrl: group.url,
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
  return Array.from(unique.values()).map((url) => enrichUsedKeywordUrl(url));
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
  const savedPrimary = savedPrimaryUrlForKeyword(keyword, urls, saved);
  if (savedPrimary) return savedPrimary;
  const ordered = sortCandidateUrls(keyword, urls, saved);
  const group = detectGroup(keyword);
  const exactCategory = ordered.find((url) => url.type === 'category' && group.url !== '/' && normalizeUrlPath(url.url) === group.url);
  if (exactCategory) return exactCategory;
  if (isBroadCategoryKeyword(keyword)) return ordered.find((url) => url.type === 'category') || ordered[0];
  if (isSpecificKeyword(keyword)) return ordered.find((url) => url.type === 'product') || ordered[0];
  if (isQuestionKeyword(keyword)) return ordered.find((url) => url.type === 'blog') || ordered[0];
  return ordered[0];
}

function recommendationForKeyword(keyword: string, status: UsedKeywordStatus, primary?: UsedKeywordUrl, urls: UsedKeywordUrl[] = []) {
  if (status === 'suggested_primary') return `Chưa lưu URL chính. Có thể chọn URL đề xuất ${primary?.url || ''} nếu đúng nhóm sản phẩm.`;
  if (status === 'unused') return 'Chưa có URL rõ ràng. Nên tạo bài hỗ trợ hoặc landing page nếu keyword thuộc nhóm hàng chủ đạo.';
  if (status === 'cannibalization') return `Có ${urls.length} URL cùng bắt keyword này. Nên chọn một URL chính, các URL còn lại trỏ internal link về URL chính.`;
  if (status === 'update_old') return `Không nên viết bài mới trùng. Nên cập nhật lại ${primary?.title || 'URL hiện có'}: bổ sung FAQ, ảnh thật, title/meta và internal link.`;
  if (status === 'support_article') return `Đã có URL chính ${primary?.url || ''}. Nên viết bài hỗ trợ long-tail và link về URL chính.`;
  return `Đã có URL chính. Tiếp tục bổ sung internal link, FAQ và nội dung thực tế cho ${primary?.title || keyword}.`;
}

function taskForKeyword(keyword: string, status: UsedKeywordStatus, primary?: UsedKeywordUrl) {
  if (status === 'suggested_primary') return `Kiểm tra URL đề xuất cho "${keyword}" và bấm Lưu URL chính nếu đúng: ${primary?.url || 'chưa có URL đề xuất'}.`;
  if (status === 'unused') return `Kiểm tra keyword "${keyword}" và tạo nội dung hỗ trợ nếu có sản phẩm/danh mục phù hợp.`;
  if (status === 'cannibalization') return `Chọn URL chính cho "${keyword}" và chỉnh các trang trùng để trỏ về URL chính.`;
  if (status === 'update_old') return `Cập nhật URL cũ cho "${keyword}": ${primary?.url || 'URL hiện có'}.`;
  if (status === 'support_article') return `Viết bài hỗ trợ cho "${keyword}" và đặt link về ${primary?.url || 'URL chính'}.`;
  return `Đẩy SEO cho "${keyword}" bằng internal link về ${primary?.url || 'URL chính'}.`;
}

export function buildUsedKeywordInsights(input: SeoWorkbenchBuildInput, savedMap: Record<string, KeywordPrimaryMapEntry> = {}, options: UsedKeywordInsightBuildOptions = {}): UsedKeywordInsight[] {
  const urls = buildUrlIndex(input);
  const offset = Math.max(0, options.candidateOffset || 0);
  const limit = Math.max(1, options.candidateLimit || Number.MAX_SAFE_INTEGER);
  const allCandidates = collectUsedKeywordCandidates(input);
  const cappedCandidates = typeof options.candidateCap === 'number'
    ? allCandidates.slice(0, Math.max(0, options.candidateCap))
    : allCandidates;
  const selectedCandidates = cappedCandidates.slice(offset, offset + limit);

  const insights = selectedCandidates.map(([normalizedKeyword, keyword]) => {
    const saved = savedMap[normalizedKeyword] || savedMap[keyword];
    const safeSavedPrimary = savedPrimaryUrlForKeyword(keyword, urls, saved);
    const relatedUrls = sortCandidateUrls(keyword, urls, safeSavedPrimary ? saved : undefined);
    const suggestedPrimary = safeSavedPrimary ? undefined : findPrimaryUrlForKeyword(keyword, relatedUrls);
    const primary = safeSavedPrimary;
    const competingUrls = buildCompetingUrls(keyword, urls, input, primary);
    const sc = matchSearchConsole(keyword, input.searchConsole, primary?.url || suggestedPrimary?.url);
    const ads = matchAds(keyword, input.googleAds);
    const isCore = businessScore(keyword) >= 35;
    const hasCannibalization = detectKeywordCannibalization(keyword, competingUrls);
    const relatedTypes = new Set(competingUrls.map((url) => url.type));
    let status: UsedKeywordStatus = 'unused';
    if (primary && hasCannibalization && relatedTypes.has('category') && relatedTypes.has('product')) status = 'category_product_duplicate';
    else if (primary && hasCannibalization && relatedTypes.has('blog') && relatedTypes.has('product')) status = 'blog_product_duplicate';
    else if (primary && competingUrls.length) status = 'cannibalization';
    else if (!primary && hasCannibalization) status = 'cannibalization';
    else if (primary && (primary.type === 'blog' || primary.type === 'product') && (sc?.position || 0) > 10) status = 'update_old';
    else if (primary && isBroadCategoryKeyword(keyword) && (ads?.volume || sc?.impressions || 0) > 0) status = 'support_article';
    else if (primary) status = 'primary';
    else if (suggestedPrimary) status = 'suggested_primary';
    else if (relatedUrls.length === 1) status = 'manual_check';

    return {
      keyword,
      normalizedKeyword,
      status,
      label: statusLabel(status),
      primaryUrl: primary?.url,
      primaryUrlType: primary?.type,
      suggestedPrimaryUrl: suggestedPrimary?.url,
      suggestedPrimaryUrlType: suggestedPrimary?.type,
      urls: relatedUrls,
      competingUrls,
      competingCount: competingUrls.length,
      recommendation: recommendationForKeyword(keyword, status, primary || suggestedPrimary, competingUrls),
      anchorText: keyword,
      taskText: taskForKeyword(keyword, status, primary || suggestedPrimary),
      core: isCore,
      source: [sc ? 'Search Console' : '', ads ? 'Keyword Planner' : '', primary ? 'Supabase' : ''].filter(Boolean).join(' + ') || 'Supabase',
      searchConsole: sc,
      ads,
    };
  });

  return sortUsedKeywordInsights(insights);
}

export function sortUsedKeywordInsights(insights: UsedKeywordInsight[]) {
  return [...insights].sort((a, b) => {
    const scoreA = businessScore(a.keyword) + (a.status === 'cannibalization' ? 30 : 0) + (a.status === 'unused' ? 20 : 0) + (a.searchConsole?.impressions || 0) / 100 + (a.ads?.volume || 0) / 100;
    const scoreB = businessScore(b.keyword) + (b.status === 'cannibalization' ? 30 : 0) + (b.status === 'unused' ? 20 : 0) + (b.searchConsole?.impressions || 0) / 100 + (b.ads?.volume || 0) / 100;
    return scoreB - scoreA;
  });
}

export function filterUsedKeywordInsights(insights: UsedKeywordInsight[], options: { filter: UsedKeywordFilterKey; search: string; page: number; pageSize: number }) {
  const rawSearch = String(options.search || '').trim();
  const search = normalizeSearchValue(rawSearch);
  const urlSearch = /\//.test(rawSearch) || /^https?:/i.test(rawSearch) || /\b(tin tuc|san pham)\b/.test(search);
  const slugSearch = /-/.test(rawSearch) && search.split(' ').length >= 2;
  const filtered = insights.filter((insight) => {
    const keywordText = normalizeSearchValue(`${insight.keyword} ${insight.normalizedKeyword}`);
    const primaryUrlText = normalizeSearchValue(insight.primaryUrl || '');
    const suggestedUrlText = normalizeSearchValue(insight.suggestedPrimaryUrl || '');
    if (search) {
      const matchesKeyword = keywordText.includes(search);
      const matchesUrl = (urlSearch || slugSearch) && (primaryUrlText.includes(search) || suggestedUrlText.includes(search));
      if (!matchesKeyword && !matchesUrl) return false;
    }
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

