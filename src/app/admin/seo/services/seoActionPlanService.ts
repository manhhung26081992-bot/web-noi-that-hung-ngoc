import type {
  ContentOpportunity,
  GoogleAdsImportData,
  GoogleAdsKeywordImportRow,
  IndexSummaryManual,
  InternalLinkSuggestion,
  ProductSeoItem,
  SearchConsoleV7Data,
  SeoBlogQualityItem,
  SeoCluster,
  SeoKeyword,
  SeoLog,
  SeoOverview,
  TodayTask,
} from '../types/seo';

export type V9ActionType = 'product' | 'blog' | 'category' | 'keyword' | 'internal_link' | 'ads' | 'technical';
export type V9Difficulty = 'Dễ' | 'Trung bình' | 'Khó';
export type V9DataSource = 'Supabase' | 'Search Console import' | 'Google Ads import' | 'Kết hợp';
export type V9MatrixGroup = 'SEO trước' | 'Ads thử' | 'Cả SEO + Ads' | 'Theo dõi';

export interface V9SeoAction {
  id: string;
  title: string;
  type: V9ActionType;
  url?: string;
  keyword?: string;
  cluster: string;
  reason: string;
  priorityScore: number;
  difficulty: V9Difficulty;
  action: string;
  source: V9DataSource;
}

export interface V9WeeklyDay {
  day: string;
  mainTask: V9SeoAction;
  sideTasks: V9SeoAction[];
  reason: string;
}

export interface V9ContentIdea {
  id: string;
  title: string;
  slug: string;
  metaDescription: string;
  mainKeyword: string;
  secondaryKeywords: string[];
  internalLinks: string[];
  targetUrl: string;
  reason: string;
  priorityScore: number;
}

export interface V9InternalLinkIdea {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  reason: string;
  priorityScore: number;
}

export interface V9AdsMatrixRow {
  id: string;
  keyword: string;
  group: V9MatrixGroup;
  reason: string;
  searchVolume?: number;
  cpc?: number;
  competition?: string;
  searchConsolePosition?: number;
  targetUrl?: string;
}

export interface V9ActionPlan {
  today: V9SeoAction[];
  week: V9SeoAction[];
  productActions: V9SeoAction[];
  categoryActions: V9SeoAction[];
  blogActions: V9SeoAction[];
  seoKeywords: V9SeoAction[];
  adsKeywords: V9SeoAction[];
  watchKeywords: V9SeoAction[];
  weeklyPlan: V9WeeklyDay[];
  contentIdeas: V9ContentIdea[];
  internalLinks: V9InternalLinkIdea[];
  adsMatrix: V9AdsMatrixRow[];
  dataStatus: {
    hasSearchConsole: boolean;
    hasGoogleAds: boolean;
    hasIndexSummary: boolean;
  };
}

export interface BuildV9ActionPlanInput {
  overview: SeoOverview | null;
  products: ProductSeoItem[];
  blogs: SeoBlogQualityItem[];
  keywords: SeoKeyword[];
  clusters: SeoCluster[];
  tasks: TodayTask[];
  logs: SeoLog[];
  internalLinks: InternalLinkSuggestion[];
  opportunities: ContentOpportunity[];
  searchConsole: SearchConsoleV7Data | null;
  googleAds: GoogleAdsImportData | null;
  indexSummary: IndexSummaryManual | null;
}

const MAIN_BUSINESS = [
  { cluster: 'Giường sắt', terms: ['giường', 'giuong', 'giường sắt', 'giuong sat', 'giường tầng', 'giuong tang'] },
  { cluster: 'Bàn làm việc', terms: ['bàn làm việc', 'ban lam viec', 'bàn văn phòng', 'ban van phong', 'bàn nhân viên', 'ban nhan vien', 'bàn chân sắt', 'ban chan sat'] },
  { cluster: 'Trường học', terms: ['bàn học sinh', 'ban hoc sinh', 'bàn ghế học sinh', 'ban ghe hoc sinh', 'trường học', 'truong hoc', 'bảng từ', 'bang tu'] },
];

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function stripAccent(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function slugify(value: string) {
  return stripAccent(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
}

function includesAny(text: string, terms: string[]) {
  const clean = stripAccent(text);
  return terms.some((term) => clean.includes(stripAccent(term)));
}

function detectCluster(text: string, fallback = 'Nhóm sản phẩm chính') {
  const found = MAIN_BUSINESS.find((item) => includesAny(text, item.terms));
  if (found) return found.cluster;
  if (includesAny(text, ['ghế chân quỳ', 'ghe chan quy'])) return 'Ghế chân quỳ';
  if (includesAny(text, ['ghế giám đốc', 'ghe giam doc'])) return 'Ghế giám đốc';
  if (includesAny(text, ['tủ locker', 'tu locker', 'locker'])) return 'Tủ locker';
  return fallback;
}

function businessPriority(text: string) {
  const clean = stripAccent(text);
  if (MAIN_BUSINESS.some((item) => item.terms.some((term) => clean.includes(stripAccent(term))))) return 35;
  if (includesAny(text, ['ghế chân quỳ', 'ghế giám đốc', 'tủ locker', 'tủ quần áo'])) return 4;
  return 0;
}

function productUrl(product: ProductSeoItem) {
  return product.slug ? `/san-pham/${product.slug}/` : undefined;
}

function keywordUrl(keyword: string) {
  const cluster = detectCluster(keyword);
  if (cluster === 'Giường sắt') return '/giuong-tang-sat/';
  if (cluster === 'Bàn làm việc') return '/ban-lam-viec/';
  if (cluster === 'Trường học') return '/truong-hoc/';
  if (cluster === 'Ghế chân quỳ') return '/ghe-chan-quy/';
  if (cluster === 'Ghế giám đốc') return '/ghe-giam-doc/';
  if (cluster === 'Tủ locker') return '/tu-locker/';
  return `/${slugify(keyword)}/`;
}

function uniqueActions(actions: V9SeoAction[]) {
  const map = new Map<string, V9SeoAction>();
  actions.sort((a, b) => b.priorityScore - a.priorityScore).forEach((item, index) => {
    const key = `${item.type}-${item.url || item.keyword || item.title}-${index}`;
    if (!map.has(key)) map.set(key, item);
  });
  return Array.from(map.values()).sort((a, b) => b.priorityScore - a.priorityScore);
}

function buildSearchConsoleActions(data: SearchConsoleV7Data | null): V9SeoAction[] {
  if (!data) return [];
  const queryActions = data.queries.map((row, index) => {
    let score = businessPriority(row.query) + Math.min(30, row.impressions / 10);
    let action = 'Theo dõi thêm dữ liệu Search Console import.';
    let reason = `Query có ${row.impressions} impression, ${row.clicks} click, vị trí trung bình ${row.position.toFixed(1)}.`;
    let difficulty: V9Difficulty = 'Trung bình';

    if (row.position >= 11 && row.position <= 20) {
      score += 30;
      action = 'Tối ưu title/meta, bổ sung FAQ và thêm internal link để đẩy lên trang 1.';
      reason += ' Đây là nhóm vị trí 11-20, có cơ hội lên trang 1.';
    } else if (row.position > 20 && row.position <= 40) {
      score += 18;
      action = 'Viết bài phụ hoặc mở rộng nội dung landing page cho query này.';
      difficulty = 'Khó';
      reason += ' Query đang ở vị trí 21-40, cần thêm nội dung hỗ trợ.';
    } else if (row.position >= 4 && row.position <= 10) {
      score += 22;
      action = 'Sửa title/meta để tăng CTR và giữ top.';
      difficulty = 'Dễ';
      reason += ' Query đã gần top, ưu tiên tăng CTR.';
    }

    if (row.impressions >= 100 && row.ctr < 0.02) {
      score += 20;
      action = 'Tối ưu title/meta vì impression cao nhưng CTR thấp.';
      reason += ' CTR thấp so với lượng hiển thị.';
    }

    return {
      id: `sc-query-${index}-${slugify(row.query)}`,
      title: `Từ Search Console: tối ưu query ${row.query}`, 
      type: 'keyword' as const,
      keyword: row.query,
      url: row.page || keywordUrl(row.query),
      cluster: detectCluster(row.query),
      reason,
      priorityScore: clamp(score),
      difficulty,
      action,
      source: 'Search Console import' as const,
    };
  });

  const pageActions = data.pages.map((row, index) => ({
    id: `sc-page-${index}-${slugify(row.page)}`,
    title: `Tối ưu landing page có impression: ${row.page}`,
    type: 'category' as const,
    url: row.page,
    cluster: detectCluster(row.page),
    reason: `Trang có ${row.impressions} impression, ${row.clicks} click, CTR ${(row.ctr * 100).toFixed(1)}%.`,
    priorityScore: clamp(35 + businessPriority(row.page) + Math.min(25, row.impressions / 12) + (row.ctr < 0.02 ? 20 : 0)),
    difficulty: 'Trung bình' as const,
    action: 'Kiểm tra title/meta, thêm mô tả đầu trang, FAQ và internal link từ bài viết liên quan.',
    source: 'Search Console import' as const,
  }));

  return [...queryActions, ...pageActions];
}

function buildAdsActions(data: GoogleAdsImportData | null) {
  if (!data) return { seo: [] as V9SeoAction[], ads: [] as V9SeoAction[], watch: [] as V9SeoAction[], matrix: [] as V9AdsMatrixRow[] };

  const matrix: V9AdsMatrixRow[] = data.rows.map((row, index) => {
    const volume = row.avg_monthly_searches || 0;
    const cpc = row.cpc || row.low_top_of_page_bid || row.high_top_of_page_bid || 0;
    const priority = businessPriority(row.keyword);
    let group: V9MatrixGroup = 'Theo dõi';
    let reason = 'Dữ liệu còn ít, nên theo dõi thêm.';

    if (priority >= 20 && volume >= 300 && (!row.competition_index || row.competition_index <= 70)) {
      group = 'Cả SEO + Ads';
      reason = 'Hàng chủ đạo, volume tốt và cạnh tranh chưa quá cao.';
    } else if (priority >= 20 && volume >= 200) {
      group = 'SEO trước';
      reason = 'Keyword thuộc nhóm hàng chủ đạo, nên ưu tiên SEO trước.';
    } else if (volume >= 300 && cpc > 0 && cpc <= 5000) {
      group = 'Ads thử';
      reason = 'Volume tốt, giá thầu có thể thử ngân sách nhỏ.';
    }

    return { id: `v9-matrix-${index}-${slugify(row.keyword)}`, keyword: row.keyword, group, reason, searchVolume: volume || undefined, cpc: cpc || undefined, competition: row.competition, targetUrl: keywordUrl(row.keyword) };
  });

  const toAction = (row: GoogleAdsKeywordImportRow, type: 'ads' | 'keyword', action: string, base: number): V9SeoAction => ({
    id: `ads-${type}-${row.id}`,
    title: type === 'ads' ? `Từ Keyword Planner: chạy Ads thử ${row.keyword}` : `Từ Keyword Planner: SEO keyword ${row.keyword}`,
    type,
    keyword: row.keyword,
    url: keywordUrl(row.keyword),
    cluster: row.cluster || detectCluster(row.keyword),
    reason: `Từ Keyword Planner: keyword có volume ${row.avg_monthly_searches || 0}, cạnh tranh ${row.competition || 'chưa rõ'}, giá thầu thấp ${row.low_top_of_page_bid || 0}.`,
    priorityScore: clamp(base + businessPriority(row.keyword) + Math.min(25, (row.avg_monthly_searches || 0) / 120)),
    difficulty: (row.competition_index || 0) > 80 ? 'Khó' : 'Trung bình',
    action,
    source: 'Google Ads import',
  });

  return {
    seo: data.rows.filter((row) => (row.avg_monthly_searches || 0) >= 100).map((row) => toAction(row, 'keyword', 'Tạo hoặc tối ưu landing page/bài viết hỗ trợ keyword này.', 35)),
    ads: data.rows.filter((row) => businessPriority(row.keyword) >= 20 || ((row.avg_monthly_searches || 0) >= 300 && (row.low_top_of_page_bid || 0) > 0)).map((row) => toAction(row, 'ads', 'Chạy Ads thử ngân sách nhỏ sau khi kiểm tra landing page.', 30)),
    watch: data.rows.filter((row) => (row.avg_monthly_searches || 0) < 150 || businessPriority(row.keyword) < 10).map((row) => toAction(row, 'keyword', 'Theo dõi thêm, chưa cần ưu tiên cao hôm nay.', 12)),
    matrix,
  };
}

function buildProductActions(products: ProductSeoItem[]): V9SeoAction[] {
  return products.map((product, index) => {
    const score = typeof product.qualityScore === 'number' ? product.qualityScore : Math.max(10, 100 - product.issues.length * 14);
    const text = `${product.name} ${product.category || ''}`;
    return {
      id: `product-${product.id}-${index}`,
      title: `Bổ sung SEO cho ${product.name}`,
      type: 'product' as const,
      url: productUrl(product),
      cluster: detectCluster(text),
      reason: `Sản phẩm đạt khoảng ${score}/100, vấn đề chính: ${product.issues.slice(0, 4).join(', ') || 'cần rà soát nội dung'}.`,
      priorityScore: clamp(100 - score + businessPriority(text)),
      difficulty: (product.issues.length >= 4 ? 'Trung bình' : 'Dễ') as V9Difficulty,
      action: 'Bổ sung mô tả chi tiết, FAQ, ảnh thật và internal link từ bài viết liên quan.',
      source: 'Supabase' as const,
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

function buildBlogActions(blogs: SeoBlogQualityItem[]): V9SeoAction[] {
  return blogs.map((blog, index) => ({
    id: `blog-${blog.id}-${index}`,
    title: `Cập nhật bài viết: ${blog.title}`,
    type: 'blog' as const,
    url: `/tin-tuc/${blog.slug}/`,
    cluster: detectCluster(blog.title),
    reason: `Điểm nội dung khoảng ${blog.score}/100, còn thiếu: ${blog.issues.slice(0, 3).join(', ') || 'internal link/FAQ'}.`,
    priorityScore: clamp(100 - blog.score + businessPriority(blog.title)),
    difficulty: 'Dễ' as const,
    action: 'Thêm internal link về danh mục chính, cập nhật đoạn mở bài và FAQ ngắn.',
    source: 'Supabase' as const,
  })).sort((a, b) => b.priorityScore - a.priorityScore);
}

function buildCategoryActions(clusters: SeoCluster[], opportunities: ContentOpportunity[]): V9SeoAction[] {
  return [
    ...clusters.map((cluster, index) => ({
      id: `cluster-${cluster.id}-${index}`,
      title: `Tăng sức mạnh cụm: ${cluster.name}`,
      type: 'category' as const,
      url: cluster.main_url,
      cluster: cluster.name,
      reason: `Cụm có ${cluster.product_count || 0} sản phẩm, ${cluster.post_count || 0} bài viết, ${cluster.internal_link_measured === false ? 'chưa đo internal link' : `${cluster.internal_link_count || 0} internal link`}.`,
      priorityScore: clamp(35 + businessPriority(cluster.name) + Math.max(0, 8 - (cluster.post_count || 0)) * 4),
      difficulty: 'Trung bình' as const,
      action: 'Bổ sung bài vệ tinh, FAQ danh mục và link nội bộ về trang cụm chính.',
      source: 'Supabase' as const,
    })),
    ...opportunities.map((item, index) => ({
      id: `opportunity-${item.id}-${index}`,
      title: item.suggestion,
      type: 'category' as const,
      cluster: item.cluster,
      reason: item.reason,
      priorityScore: clamp(45 + businessPriority(item.cluster)),
      difficulty: 'Trung bình' as const,
      action: 'Chọn một trang đích cụ thể, thêm nội dung hỗ trợ và internal link.',
      source: 'Supabase' as const,
    })),
  ].sort((a, b) => b.priorityScore - a.priorityScore);
}

function buildContentIdeas(actions: V9SeoAction[], existingBlogs: SeoBlogQualityItem[]): V9ContentIdea[] {
  const existing = new Set(existingBlogs.map((blog) => stripAccent(blog.title)));
  return actions.filter((item) => item.keyword || item.cluster).map((item, index) => {
    const keyword = item.keyword || item.cluster;
    const title = `${keyword} giá rẻ tại Hà Nội nên chọn loại nào?`.slice(0, 58);
    return {
      id: `idea-${index}-${slugify(keyword)}`,
      title,
      slug: slugify(title),
      metaDescription: `Gợi ý chọn ${keyword} phù hợp, giá tốt, giao hàng nhanh tại Hà Nội cùng Nội Thất Hùng Ngọc.`,
      mainKeyword: keyword,
      secondaryKeywords: [item.cluster, `${keyword} giá rẻ`, `${keyword} tại Hà Nội`].filter(Boolean),
      internalLinks: [item.url || keywordUrl(keyword), '/tin-tuc/'],
      targetUrl: item.url || keywordUrl(keyword),
      reason: item.reason,
      priorityScore: item.priorityScore,
    };
  }).filter((idea) => !existing.has(stripAccent(idea.title))).slice(0, 12);
}

function buildInternalLinkIdeas(actions: V9SeoAction[], internalLinks: InternalLinkSuggestion[]): V9InternalLinkIdea[] {
  const existing = new Set(internalLinks.map((item) => `${item.post_url}->${item.target_url}`));
  return actions.filter((item) => item.url && (item.keyword || item.cluster)).map((item, index) => {
    const sourceUrl = `/tin-tuc/${slugify(item.keyword || item.cluster)}-gia-re/`;
    const targetUrl = item.url || keywordUrl(item.cluster);
    return {
      id: `link-${index}-${slugify(sourceUrl + targetUrl)}`,
      sourceUrl,
      targetUrl,
      anchorText: item.keyword || item.cluster,
      reason: `Liên kết hỗ trợ cụm ${item.cluster}: ${item.reason}`,
      priorityScore: item.priorityScore,
    };
  }).filter((item) => !existing.has(`${item.sourceUrl}->${item.targetUrl}`)).slice(0, 12);
}

function buildWeeklyPlan(actions: V9SeoAction[]): V9WeeklyDay[] {
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  return days.map((day, index) => {
    const mainTask = actions[index] || actions[0];
    return {
      day,
      mainTask,
      sideTasks: actions.slice(index + 1, index + 3),
      reason: mainTask ? `Chọn vì điểm ưu tiên ${mainTask.priorityScore}/100 và thuộc cụm ${mainTask.cluster}.` : 'Chưa đủ dữ liệu để lập kế hoạch.',
    };
  }).filter((item) => item.mainTask);
}

export function buildV9ActionPlan(input: BuildV9ActionPlanInput): V9ActionPlan {
  const productActions = buildProductActions(input.products).slice(0, 20);
  const blogActions = buildBlogActions(input.blogs).slice(0, 20);
  const categoryActions = buildCategoryActions(input.clusters, input.opportunities).slice(0, 20);
  const scActions = buildSearchConsoleActions(input.searchConsole);
  const ads = buildAdsActions(input.googleAds);
  const technicalActions: V9SeoAction[] = [
    {
      id: 'technical-import-search-console',
      title: input.searchConsole ? 'Rà soát dữ liệu Search Console đã import' : 'Import Search Console để phân tích sâu hơn',
      type: 'technical',
      cluster: 'Hệ thống',
      reason: input.searchConsole ? 'Dashboard đang dùng dữ liệu Search Console import thủ công.' : 'Chưa có dữ liệu Search Console import, dashboard đang dựa chủ yếu vào Supabase.',
      priorityScore: input.searchConsole ? 35 : 60,
      difficulty: 'Dễ',
      action: input.searchConsole ? 'Kiểm tra query 11-20 và page có CTR thấp.' : 'Export Queries/Pages từ Search Console rồi import vào dashboard.',
      source: input.searchConsole ? 'Search Console import' : 'Supabase',
    },
    {
      id: 'technical-import-google-ads',
      title: input.googleAds ? 'Rà soát dữ liệu Keyword Planner đã import' : 'Import Keyword Planner để biết volume và giá thầu',
      type: 'technical',
      cluster: 'Hệ thống',
      reason: input.googleAds ? 'Dashboard đang dùng dữ liệu Google Ads import thủ công.' : 'Chưa có dữ liệu volume/CPC từ Keyword Planner.',
      priorityScore: input.googleAds ? 30 : 55,
      difficulty: 'Dễ',
      action: input.googleAds ? 'Chọn keyword hàng chủ đạo có volume tốt để lập kế hoạch.' : 'Export Keyword Planner CSV rồi import vào dashboard.',
      source: input.googleAds ? 'Google Ads import' : 'Supabase',
    },
  ];
  const allActions = uniqueActions([...productActions, ...blogActions, ...categoryActions, ...scActions, ...ads.seo, ...ads.ads, ...technicalActions]);
  const keywordSeo = uniqueActions([...scActions, ...ads.seo]).filter((item) => item.type === 'keyword').slice(0, 10);
  const adsKeywords = uniqueActions(ads.ads).slice(0, 10);
  const watchKeywords = uniqueActions(ads.watch).slice(0, 10);
  return {
    today: allActions.slice(0, 10),
    week: allActions.slice(0, 10),
    productActions: productActions.slice(0, 5),
    categoryActions: categoryActions.slice(0, 5),
    blogActions: blogActions.slice(0, 5),
    seoKeywords: keywordSeo.slice(0, 5),
    adsKeywords: adsKeywords.slice(0, 5),
    watchKeywords: watchKeywords.slice(0, 5),
    weeklyPlan: buildWeeklyPlan(allActions),
    contentIdeas: buildContentIdeas(allActions, input.blogs),
    internalLinks: buildInternalLinkIdeas(allActions, input.internalLinks),
    adsMatrix: ads.matrix,
    dataStatus: { hasSearchConsole: Boolean(input.searchConsole), hasGoogleAds: Boolean(input.googleAds), hasIndexSummary: Boolean(input.indexSummary) },
  };
}

