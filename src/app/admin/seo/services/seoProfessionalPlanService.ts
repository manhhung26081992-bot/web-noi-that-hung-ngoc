import type {
  GoogleAdsImportData,
  InternalLinkSuggestion,
  ProductSeoItem,
  SearchConsoleQuery,
  SearchConsoleV7Data,
  SeoBlogQualityItem,
  SeoCluster,
  SeoKeyword,
  TodayTask,
} from '../types/seo';

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
    googleAdsUpdatedAt: string | null;
    googleAdsKeywordCount: number;
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
    `Nguồn: ${task.source}`,
    internal.trim(),
  ].filter(Boolean).join('\n');
}

function buildTask(task: Omit<ProfessionalSeoTask, 'copyText'>): ProfessionalSeoTask {
  return { ...task, copyText: taskCopyText(task) };
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

function buildSearchConsoleTasks(input: BuildProfessionalSeoPlanInput) {
  const data = input.searchConsole;
  if (!data?.queries.length && !data?.pages.length) return [];
  const duplicateMap = duplicateQueries(data.queries);
  const tasks: ProfessionalSeoTask[] = [];

  duplicateMap.forEach((rows, key) => {
    const uniquePages = Array.from(new Set(rows.map((row) => cleanPath(row.page)).filter(Boolean)));
    if (uniquePages.length < 2) return;
    const main = bestRow(rows);
    const score = clamp(30 + 25 + businessScore(main.query) + Math.min(10, main.clicks) + Math.min(15, main.impressions / 50));
    tasks.push(buildTask({
      id: `sc-duplicate-${slugify(key)}`,
      type: 'Kiểm tra trùng từ khóa',
      title: `Chọn URL chính cho query "${main.query}"`,
      url: cleanPath(main.page) || fallbackUrl(main.query),
      keyword: main.query,
      secondaryKeywords: rows.map((row) => row.query).filter((value, index, arr) => arr.indexOf(value) === index).slice(1, 4),
      reason: `Search Console cho thấy cùng query đang xuất hiện ở ${uniquePages.length} URL. URL có tín hiệu tốt nhất hiện là ${cleanPath(main.page)} với ${main.impressions} impression, ${main.clicks} click, vị trí ${main.position.toFixed(1)}.`,
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
    const ctrLow = row.impressions >= 50 && row.ctr < 2;
    const nearTop = row.position >= 10 && row.position <= 30;
    const hasClick = row.clicks > 0;
    const duplicateRisk = (duplicateMap.get(stripAccent(row.query)) || []).map((item) => cleanPath(item.page)).filter(Boolean).filter((value, i, arr) => arr.indexOf(value) === i).length > 1;
    const missingUrl = !row.page && !known?.target_url;
    const missingFaq = Boolean(product?.checks && !product.checks.faq);
    const missingMeta = Boolean(blog?.checks && !blog.checks.meta);
    const missingInternalLink = !link && Boolean(url);
    let score = 30 + businessScore(`${row.query} ${url}`);
    if (ctrLow) score += 20;
    if (nearTop) score += 25;
    if (hasClick) score += 10;
    if (duplicateRisk) score += 20;
    if (missingUrl) score += 20;
    if (missingFaq || missingMeta || missingInternalLink) score += 10;
    score += Math.min(15, row.impressions / 80);
    score = clamp(score);

    let type: ProfessionalSeoTaskType = 'Theo dõi cơ hội SEO';
    let action = 'Theo dõi thêm dữ liệu Search Console trước khi sửa mạnh.';
    let expectedResult = 'Có thêm dữ liệu chắc hơn để quyết định URL/keyword.';
    let reindex: ProfessionalSeoTask['reindex'] = 'Theo dõi thêm';
    if (missingUrl) {
      type = 'Gắn URL chính cho keyword';
      action = `Gắn URL chính cho "${row.query}" trong Keyword Map, ưu tiên ${fallbackUrl(row.query)} nếu chưa có landing page tốt hơn.`;
      expectedResult = 'Keyword có URL đích rõ để AI không đề xuất trùng.';
      reindex = 'Không cần';
    } else if (duplicateRisk) {
      type = 'Kiểm tra trùng từ khóa';
      action = `Chọn URL chính cho "${row.query}", sau đó thêm link nội bộ về ${url}.`;
      expectedResult = 'Giảm nhiều URL cùng bắt một query.';
      reindex = 'Không cần';
    } else if (ctrLow) {
      type = 'Sửa title/meta/description';
      action = `Sửa title/meta của ${url} để nêu rõ sản phẩm, giá trị mua hàng và khu vực Hà Nội.`;
      expectedResult = 'Tăng CTR cho query đã có impression.';
      reindex = 'Có';
    } else if (nearTop) {
      type = missingInternalLink ? 'Thêm internal link' : missingFaq ? 'Thêm FAQ' : product ? 'Tối ưu sản phẩm' : blog ? 'Sửa bài viết cũ' : 'Thêm FAQ';
      action = missingInternalLink
        ? `Thêm 1-2 internal link về ${url} với anchor "${row.query}".`
        : `Bổ sung FAQ, đoạn mô tả 150-200 chữ và liên kết nội bộ cho ${url}.`;
      expectedResult = 'Đẩy query vị trí 10-30 tiến gần top 10.';
      reindex = 'Có';
    }

    tasks.push(buildTask({
      id: `sc-query-${index}-${slugify(row.query)}-${slugify(url)}`,
      type,
      title: `${type}: ${row.query}`,
      url,
      keyword: row.query,
      secondaryKeywords: data.queries.filter((item) => cleanPath(item.page) === url && item.query !== row.query).map((item) => item.query).slice(0, 3),
      reason: `Search Console: ${row.impressions} impression, ${row.clicks} click, CTR ${row.ctr.toFixed(2)}%, vị trí ${row.position.toFixed(1)}. ${ctrLow ? 'CTR thấp. ' : ''}${nearTop ? 'Đang ở vùng 10-30. ' : ''}${missingInternalLink ? 'Chưa thấy internal link phù hợp trong gợi ý hiện có. ' : ''}`,
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

export function buildProfessionalSeoPlan(input: BuildProfessionalSeoPlanInput): ProfessionalSeoPlan {
  const scKeywords = new Set((input.searchConsole?.queries || []).map((row) => stripAccent(row.query)).filter(Boolean));
  const scTasks = buildSearchConsoleTasks(input);
  const adsTasks = buildAdsOnlyTasks(input, scKeywords);
  const supabaseTasks = buildSupabaseTasks(input);
  const allTasks = uniqueTasks([...scTasks, ...supabaseTasks, ...adsTasks]);
  const highPriorityToday = allTasks.filter((task) => task.priority === 'Cao').slice(0, 5);
  const today = highPriorityToday.length ? highPriorityToday : allTasks.slice(0, 5);
  const week = allTasks.filter((task) => !today.some((item) => item.id === task.id)).slice(0, 7);
  const watch = uniqueTasks([
    ...allTasks.filter((task) => task.priority !== 'Cao' || task.type === 'Theo dõi cơ hội SEO'),
    ...adsTasks,
  ]).slice(0, 5);
  const scKeywordCount = new Set((input.searchConsole?.queries || []).map((row) => stripAccent(row.query)).filter(Boolean)).size;
  const scUrlCount = new Set([
    ...(input.searchConsole?.pages || []).map((row) => cleanPath(row.page)),
    ...(input.searchConsole?.queries || []).map((row) => cleanPath(row.page)),
  ].filter(Boolean)).size;
  const latestByType = latestSearchConsoleImports(input.searchConsole);
  const scDateRanges = Array.from(new Set((input.searchConsole?.imports || []).map((item) => item.dateRangeLabel).filter(Boolean)));
  const scImportTypes = Array.from(new Set((input.searchConsole?.imports || []).map((item) => item.type).filter(Boolean)));
  const hasQueryPage = scImportTypes.includes('query-page');
  const hasUsefulSearchConsole = Boolean(input.searchConsole?.overview.connected && (scKeywordCount || scUrlCount));
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
        : input.searchConsole?.trend?.length
          ? 'Dates trend'
          : 'Chưa có GSC chi tiết';
  const alerts: string[] = [];
  if (!input.searchConsole?.overview.connected) alerts.push('Chưa có dữ liệu Search Console mới, AI chỉ dùng Supabase và Keyword Planner để gợi ý tạm.');
  if (input.searchConsole?.overview.connected && !scKeywordCount) alerts.push('Search Console đã import nhưng chưa thấy query chi tiết.');
  if (onlyShortSearchConsole) alerts.push('Search Console hiện chỉ có dữ liệu ngắn hạn. Nên import thêm 3/6/12/16 tháng để AI đọc xu hướng và ưu tiên bền hơn.');
  if (input.searchConsole?.overview.connected && !hasQueryPage) alerts.push('Nên import thêm Query+Page để AI chọn đúng URL chính cho từng keyword.');
  const weakDevice = (input.searchConsole?.devices || [])
    .filter((item) => item.impressions >= 50 && item.ctr > 0 && item.ctr < Math.max(1, (input.searchConsole?.overview.ctr || 0) * 0.75))
    .sort((a, b) => b.impressions - a.impressions)[0];
  if (weakDevice) alerts.push(`Thiết bị ${weakDevice.device} có ${weakDevice.impressions} impression nhưng CTR thấp (${weakDevice.ctr.toFixed(2)}%). Nên kiểm tra title/meta và trải nghiệm mobile/desktop theo thiết bị này.`);
  const topCountry = [...(input.searchConsole?.countries || [])].sort((a, b) => b.impressions - a.impressions)[0];
  if (topCountry && !includesAny(topCountry.country, ['viet nam', 'vietnam', 'việt nam'])) {
    alerts.push(`Quốc gia có impression cao nhất là ${topCountry.country}. Nên kiểm tra lại target thị trường nếu khách chính vẫn là Việt Nam.`);
  }
  if (!input.googleAds?.summary.keywordCount) alerts.push('Chưa có dữ liệu Keyword Planner thật.');

  return {
    sourceSummary: {
      searchConsoleUpdatedAt: input.searchConsole?.overview.lastUpdated || null,
      searchConsoleKeywordCount: scKeywordCount,
      searchConsoleUrlCount: scUrlCount,
      searchConsoleDateRanges: scDateRanges,
      searchConsoleImportTypes: scImportTypes,
      searchConsoleLatestByType: latestByType,
      activeSearchConsoleSource,
      googleAdsUpdatedAt: input.googleAds?.lastUpdated || input.googleAds?.summary.lastUpdated || null,
      googleAdsKeywordCount: input.googleAds?.summary.keywordCount || 0,
      usingSources: [
        hasUsefulSearchConsole ? `Search Console ${activeSearchConsoleSource}` : '',
        input.searchConsole?.trend?.length ? 'Search Console Dates trend' : '',
        input.searchConsole?.devices?.length ? 'Search Console Devices' : '',
        input.searchConsole?.countries?.length ? 'Search Console Countries' : '',
        input.googleAds?.summary.keywordCount ? 'Keyword Planner import' : '',
        'Supabase products/blog_posts/categories/seo_*',
        'seo_dashboard_store',
      ].filter(Boolean).join(' + '),
      warning: !input.searchConsole?.overview.connected
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
