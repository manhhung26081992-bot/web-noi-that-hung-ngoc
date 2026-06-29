import { MENU_ITEMS } from '@/components/Header/menuData';
import { supabase } from '@/lib/supabase';
import type { ContentOpportunity, DoNotTouchItem, IndexStatusItem, InternalLinkSuggestion, LocalSeoItem, ProductSeoItem, RoadmapWeek, SeoCluster, SeoCompetitor, SeoGoal, SeoHealthSnapshot, SeoKeyword, SeoLog, SeoNote, SeoOverview, SeoPriority, SeoProgress, TodayTask } from '../types/seo';

type ProductUrlRow = { slug?: string | null; category?: string | null; parent_slug?: string | null };
type BlogUrlRow = { slug?: string | null };
type BlogAnalyzeRow = { id?: string | number; title?: string | null; slug?: string | null; content?: string | null; excerpt?: string | null };

const STATIC_SEO_PATHS = ['/', '/tin-tuc'];
const DEFAULT_CLUSTERS: SeoCluster[] = [
  { id: 'cluster-ghe-chan-quy', name: 'Ghế chân quỳ', main_url: '/ghe-chan-quy', priority: 5, status: 'đang đẩy', product_count: 0, post_count: 0, internal_link_count: 0, note: 'Cụm ghế văn phòng dễ ra nhu cầu thực.' },
  { id: 'cluster-ban-giam-doc', name: 'Bàn giám đốc', main_url: '/ban-giam-doc', priority: 5, status: 'đang đẩy', product_count: 0, post_count: 0, internal_link_count: 0, note: 'Cụm có giá trị đơn hàng tốt.' },
  { id: 'cluster-ban-lam-viec', name: 'Bàn làm việc', main_url: '/ban-van-phong', priority: 4, status: 'duy trì', product_count: 0, post_count: 0, internal_link_count: 0, note: 'Cụm rộng, cần gom link nội bộ.' },
  { id: 'cluster-giuong-sat', name: 'Giường sắt', main_url: '/giuong-tang-sat', priority: 4, status: 'cần bài viết', product_count: 0, post_count: 0, internal_link_count: 0, note: 'Nên thêm dự án thực tế và ảnh lắp đặt.' },
  { id: 'cluster-tu-locker', name: 'Tủ locker', main_url: '/tu-locker', priority: 4, status: 'duy trì', product_count: 0, post_count: 0, internal_link_count: 0, note: 'Cụm phù hợp trường học, nhà máy, văn phòng.' },
  { id: 'cluster-ghe-giam-doc', name: 'Ghế giám đốc', main_url: '/ghe-giam-doc', priority: 3, status: 'chờ dữ liệu', product_count: 0, post_count: 0, internal_link_count: 0, note: 'Theo dõi thêm query trước khi sửa nhiều.' },
  { id: 'cluster-truong-hoc', name: 'Trường học', main_url: '/truong-hoc', priority: 3, status: 'cần sản phẩm', product_count: 0, post_count: 0, internal_link_count: 0, note: 'Nên bổ sung sản phẩm và bài dự án.' },
];
const INTERNAL_LINK_RULES = [
  { keyword: 'ghế chân quỳ', target_url: '/ghe-chan-quy', anchor: 'ghế chân quỳ văn phòng' },
  { keyword: 'bàn giám đốc', target_url: '/ban-giam-doc', anchor: 'bàn giám đốc giá xưởng' },
  { keyword: 'giường tầng', target_url: '/giuong-tang-sat', anchor: 'giường tầng sắt' },
  { keyword: 'giường sắt', target_url: '/giuong-tang-sat', anchor: 'giường sắt bền đẹp' },
  { keyword: 'tủ locker', target_url: '/tu-locker', anchor: 'tủ locker sắt' },
  { keyword: 'bàn họp', target_url: '/ban-hop', anchor: 'bàn họp văn phòng' },
];

function cleanSlug(value?: string | null) { return String(value || '').trim().replace(/^\/+|\/+$/g, ''); }
function cleanPath(value?: string | null) { const slug = cleanSlug(value); return slug ? `/${slug}` : '/'; }
function getMenuCategoryLinks() {
  const links = new Set<string>();
  MENU_ITEMS.forEach((item) => { if (item.link && item.link !== '/') links.add(cleanPath(item.link)); item.submenu?.forEach((subItem) => { if (subItem.link && subItem.link !== '/') links.add(cleanPath(subItem.link)); }); });
  return Array.from(links);
}
function textIncludes(row: BlogAnalyzeRow, keyword: string) {
  return `${row.title || ''} ${row.excerpt || ''} ${row.content || ''}`.toLowerCase().includes(keyword);
}
function productUrl(product: { slug?: string | null }) { const slug = cleanSlug(product.slug); return slug ? `/san-pham/${slug}` : '/'; }
function normalizeNumber(value: unknown) { const number = Number(value || 0); return Number.isFinite(number) ? number : 0; }
function countImages(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).length;
  if (typeof value === 'string') {
    try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed.filter(Boolean).length; } catch { return value.trim() ? 1 : 0; }
  }
  return 0;
}
function hasSpecs(value: unknown) {
  if (!value) return false;
  if (typeof value === 'string') return value.trim().length > 8 && value.trim() !== '{}';
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return false;
}
function clusterScore(cluster: SeoCluster) {
  return Math.max(5, Math.min(100, cluster.priority * 12 + Math.min(cluster.product_count, 20) + Math.min(cluster.post_count * 4, 24) + Math.min(cluster.internal_link_count * 3, 18)));
}

async function countTable(table: string) { const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }); if (error) return 0; return count || 0; }
async function listProductsForUrls(): Promise<ProductUrlRow[]> { const { data, error } = await supabase.from('products').select('slug, category, parent_slug'); if (error) return []; return (data || []) as ProductUrlRow[]; }
async function listBlogsForUrls(): Promise<BlogUrlRow[]> { const { data, error } = await supabase.from('blog_posts').select('slug'); if (error) return []; return (data || []) as BlogUrlRow[]; }

export function getEstimatedGeneratedUrls(products: ProductUrlRow[], blogs: BlogUrlRow[]) {
  const urls = new Set<string>(STATIC_SEO_PATHS);
  const activeCategorySlugs = new Set<string>();
  products.forEach((product) => { const category = cleanSlug(product.category); const parentSlug = cleanSlug(product.parent_slug); const productSlug = cleanSlug(product.slug); if (category) activeCategorySlugs.add(category); if (parentSlug) activeCategorySlugs.add(parentSlug); if (productSlug) urls.add(`/san-pham/${productSlug}`); });
  const activeCategoryUrls = getMenuCategoryLinks().filter((link) => activeCategorySlugs.has(cleanSlug(link)));
  activeCategoryUrls.forEach((link) => urls.add(link));
  blogs.forEach((post) => { const slug = cleanSlug(post.slug); if (slug) urls.add(`/tin-tuc/${slug}`); });
  return { total: urls.size, staticUrls: STATIC_SEO_PATHS.length, activeCategoryUrls: activeCategoryUrls.length };
}

async function safeList<T>(table: string, orderColumn = 'updated_at', ascending = false, limit?: number): Promise<T[]> {
  let query = supabase.from(table).select('*').order(orderColumn, { ascending });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) return [];
  return (data || []) as T[];
}
async function upsertRow<T>(table: string, payload: Record<string, unknown>): Promise<T> { const { data, error } = await supabase.from(table).upsert(payload).select().single(); if (error) throw error; return data as T; }
async function deleteRow(table: string, id: string) { const { error } = await supabase.from(table).delete().eq('id', id); if (error) throw error; }

export async function getSeoOverview(): Promise<SeoOverview> {
  const [productRows, blogRows, supabaseCategories] = await Promise.all([listProductsForUrls(), listBlogsForUrls(), countTable('categories')]);
  const menuCategories = getMenuCategoryLinks().length;
  const categorySource = supabaseCategories > 0 ? 'supabase' : 'menu';
  const categories = supabaseCategories > 0 ? supabaseCategories : menuCategories;
  const estimatedUrls = getEstimatedGeneratedUrls(productRows, blogRows);
  return { products: productRows.length, blogPosts: blogRows.length, categories, generatedUrls: estimatedUrls.total, categorySource, staticUrls: estimatedUrls.staticUrls, activeCategoryUrls: estimatedUrls.activeCategoryUrls };
}

export async function getSeoPriorities(): Promise<SeoPriority[]> { return safeList<SeoPriority>('seo_priorities', 'rating', false); }
export async function upsertSeoPriority(priority: Partial<SeoPriority>) { return upsertRow<SeoPriority>('seo_priorities', { id: priority.id, keyword: priority.keyword || 'Từ khóa mới', rating: Math.max(1, Math.min(5, Number(priority.rating || 3))), note: priority.note || '', updated_at: new Date().toISOString() }); }
export async function deleteSeoPriority(id: string) { await deleteRow('seo_priorities', id); }

export async function getTodayTasks(): Promise<TodayTask[]> { const today = new Date().toISOString().slice(0, 10); const { data, error } = await supabase.from('seo_tasks').select('*').eq('task_date', today).order('updated_at', { ascending: false }); if (error) return []; return data || []; }
export async function upsertTodayTask(task: Partial<TodayTask>) { return upsertRow<TodayTask>('seo_tasks', { id: task.id, title: task.title || 'Việc SEO mới', completed: Boolean(task.completed), task_date: task.task_date || new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() }); }
export async function deleteTodayTask(id: string) { await deleteRow('seo_tasks', id); }

export async function getSeoNote(): Promise<SeoNote | null> { const { data, error } = await supabase.from('seo_notes').select('*').eq('id', 'main').maybeSingle(); if (error) return null; return data; }
export async function saveSeoNote(content: string) { return upsertRow<SeoNote>('seo_notes', { id: 'main', content, updated_at: new Date().toISOString() }); }
export async function getIndexStatus(): Promise<IndexStatusItem[]> { return safeList<IndexStatusItem>('seo_index_status', 'created_at', false, 20); }

export async function getSeoKeywords(): Promise<SeoKeyword[]> { return safeList<SeoKeyword>('seo_keywords', 'priority', false, 80); }
export async function upsertSeoKeyword(keyword: Partial<SeoKeyword>) {
  return upsertRow<SeoKeyword>('seo_keywords', { id: keyword.id, keyword: keyword.keyword || 'Từ khóa mới', cluster: keyword.cluster || '', target_url: keyword.target_url || '/', intent: keyword.intent || '', priority: Number(keyword.priority || 3), status: keyword.status || 'theo dõi', current_position: keyword.current_position ?? null, current_impression: keyword.current_impression ?? 0, current_click: keyword.current_click ?? 0, note: keyword.note || '', updated_at: new Date().toISOString() });
}
export async function deleteSeoKeyword(id: string) { await deleteRow('seo_keywords', id); }

export async function getSeoLogs(): Promise<SeoLog[]> { return safeList<SeoLog>('seo_logs', 'created_at', false, 40); }
export async function upsertSeoLog(log: Partial<SeoLog>) {
  return upsertRow<SeoLog>('seo_logs', { id: log.id, log_date: log.log_date || new Date().toISOString().slice(0, 10), action: log.action || log.title || 'Hành động SEO', target: log.target || log.related_url || 'Mục tiêu SEO', note: log.note || log.description || '', type: log.type || 'ghi chú SEO', title: log.title || log.action || 'Hành động SEO', description: log.description || log.note || '', related_url: log.related_url || '', cluster: log.cluster || '', created_at: log.created_at || new Date().toISOString() });
}
export async function deleteSeoLog(id: string) { await deleteRow('seo_logs', id); }

export async function getSeoProgress(): Promise<SeoProgress[]> { return safeList<SeoProgress>('seo_progress', 'progress', false, 30); }
export async function upsertSeoProgress(progress: Partial<SeoProgress>) { return upsertRow<SeoProgress>('seo_progress', { id: progress.id, cluster: progress.cluster || 'Cụm SEO mới', progress: Math.max(0, Math.min(100, Number(progress.progress || 0))), note: progress.note || '', updated_at: new Date().toISOString() }); }
export async function deleteSeoProgress(id: string) { await deleteRow('seo_progress', id); }

export async function getSeoGoals(): Promise<SeoGoal[]> { return safeList<SeoGoal>('seo_goals', 'updated_at', false, 20); }
export async function upsertSeoGoal(goal: Partial<SeoGoal>) { return upsertRow<SeoGoal>('seo_goals', { id: goal.id, title: goal.title || 'Mục tiêu SEO mới', target_value: Number(goal.target_value || 100), current_value: Number(goal.current_value || 0), unit: goal.unit || '', note: goal.note || '', updated_at: new Date().toISOString() }); }
export async function deleteSeoGoal(id: string) { await deleteRow('seo_goals', id); }

export async function getLocalSeoItems(): Promise<LocalSeoItem[]> { return safeList<LocalSeoItem>('seo_local_seo', 'updated_at', false, 20); }
export async function upsertLocalSeoItem(item: Partial<LocalSeoItem>) { return upsertRow<LocalSeoItem>('seo_local_seo', { id: item.id, name: item.name || 'Hạng mục Local SEO', value: item.value || '', status: item.status || 'warning', updated_at: new Date().toISOString() }); }
export async function deleteLocalSeoItem(id: string) { await deleteRow('seo_local_seo', id); }

export async function getSeoClusters(): Promise<SeoCluster[]> {
  const rows = await safeList<SeoCluster>('seo_clusters', 'priority', false, 50);
  return rows.length ? rows : DEFAULT_CLUSTERS;
}
export async function upsertSeoCluster(cluster: Partial<SeoCluster>) {
  return upsertRow<SeoCluster>('seo_clusters', { id: cluster.id, name: cluster.name || 'Cụm SEO mới', main_url: cluster.main_url || '/', priority: Number(cluster.priority || 3), status: cluster.status || 'chờ dữ liệu', product_count: Number(cluster.product_count || 0), post_count: Number(cluster.post_count || 0), internal_link_count: Number(cluster.internal_link_count || 0), note: cluster.note || '', updated_at: new Date().toISOString() });
}
export async function deleteSeoCluster(id: string) { await deleteRow('seo_clusters', id); }

export async function getDoNotTouchItems(): Promise<DoNotTouchItem[]> { return safeList<DoNotTouchItem>('seo_do_not_touch', 'created_at', false, 30); }
export async function upsertDoNotTouchItem(item: Partial<DoNotTouchItem>) {
  return upsertRow<DoNotTouchItem>('seo_do_not_touch', { id: item.id, url: item.url || '/', reason: item.reason || 'URL mới, chờ Google đánh giá', until_date: item.until_date || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), status: item.status || 'đang theo dõi', created_at: item.created_at || new Date().toISOString() });
}
export async function deleteDoNotTouchItem(id: string) { await deleteRow('seo_do_not_touch', id); }

export async function getSeoCompetitors(): Promise<SeoCompetitor[]> { return safeList<SeoCompetitor>('seo_competitors', 'priority', false, 30); }
export async function upsertSeoCompetitor(item: Partial<SeoCompetitor>) {
  return upsertRow<SeoCompetitor>('seo_competitors', { id: item.id, name: item.name || 'Đối thủ mới', domain: item.domain || '', note: item.note || '', priority: Number(item.priority || 3), updated_at: new Date().toISOString() });
}
export async function deleteSeoCompetitor(id: string) { await deleteRow('seo_competitors', id); }

export async function getProductSeoItems(): Promise<ProductSeoItem[]> {
  const { data, error } = await supabase.from('products').select('id, name, slug, image, images, category, parent_slug, specs, description, detailDescription').order('id', { ascending: false }).limit(80);
  if (error) return [];
  return (data || []).map((product) => {
    const issues: string[] = [];
    const imageCount = (product.image ? 1 : 0) + countImages(product.images);
    if (!product.image && imageCount === 0) issues.push('Thiếu ảnh chính');
    if (!product.description || product.description.length < 80) issues.push('Mô tả mỏng');
    if (!product.detailDescription || product.detailDescription.length < 200) issues.push('Thiếu nội dung chi tiết');
    if (!hasSpecs(product.specs)) issues.push('Thiếu thông số');
    if (imageCount < 2) issues.push('Ảnh ít');
    return { ...product, issues, action: issues.length ? 'Thêm ảnh thật, FAQ, thông số và link về danh mục.' : 'Giữ ổn định, không đổi slug nếu đã index.' };
  });
}

export async function getInternalLinkSuggestions(): Promise<InternalLinkSuggestion[]> {
  const { data, error } = await supabase.from('blog_posts').select('id, title, slug, content, excerpt').order('created_at', { ascending: false }).limit(80);
  if (error) return [];
  const suggestions: InternalLinkSuggestion[] = [];
  (data || []).forEach((post: BlogAnalyzeRow) => {
    INTERNAL_LINK_RULES.forEach((rule) => {
      if (textIncludes(post, rule.keyword)) {
        suggestions.push({ id: `${post.id || post.slug}-${rule.target_url}`, post_title: post.title || 'Bài viết chưa có tiêu đề', post_url: `/tin-tuc/${cleanSlug(post.slug)}`, detected_keyword: rule.keyword, target_url: rule.target_url, anchor: rule.anchor });
      }
    });
  });
  return suggestions.slice(0, 30);
}

export function buildContentOpportunities(clusters: SeoCluster[], keywords: SeoKeyword[], overview: SeoOverview | null): ContentOpportunity[] {
  const opportunities: ContentOpportunity[] = [];
  const activeClusters = clusters.length ? clusters : DEFAULT_CLUSTERS;
  activeClusters.forEach((cluster) => {
    if (cluster.status.includes('đang đẩy') && cluster.post_count < 3) opportunities.push({ id: `${cluster.id}-post`, cluster: cluster.name, suggestion: 'Viết hoặc cập nhật 1 bài dự án, tránh trùng từ khóa chính.', reason: `${cluster.name} đang đẩy nhưng số bài hỗ trợ còn thấp.`, level: 'high' });
    if (cluster.priority >= 5 && cluster.product_count < 8) opportunities.push({ id: `${cluster.id}-product`, cluster: cluster.name, suggestion: 'Thêm sản phẩm thật hoặc ảnh lắp đặt cho cụm này.', reason: 'Priority cao nhưng dữ liệu sản phẩm chưa dày.', level: 'critical' });
    if (cluster.internal_link_count < 3) opportunities.push({ id: `${cluster.id}-link`, cluster: cluster.name, suggestion: `Tăng internal link về ${cluster.main_url}.`, reason: 'Liên kết nội bộ còn mỏng.', level: 'medium' });
  });
  const weakKeyword = keywords.find((keyword) => normalizeNumber(keyword.current_impression) < 20 && keyword.priority >= 4);
  if (weakKeyword) opportunities.push({ id: `kw-${weakKeyword.id}`, cluster: weakKeyword.cluster || 'Keyword Tracker', suggestion: `Tạo nội dung phụ cho từ khóa "${weakKeyword.keyword}".`, reason: 'Từ khóa ưu tiên cao nhưng impression còn thấp.', level: 'high' });
  if ((overview?.blogPosts || 0) < 60) opportunities.push({ id: 'blog-total', cluster: 'Tin tức', suggestion: 'Bổ sung bài tư vấn có ảnh thật và link về danh mục bán hàng.', reason: `Website mới có ${overview?.blogPosts || 0} bài viết.`, level: 'high' });
  return opportunities.slice(0, 12);
}

export function getRoadmap30Days(): RoadmapWeek[] {
  return [
    { week: 'Tuần 1', focus: 'Theo dõi Ghế chân quỳ', tasks: ['Không đổi slug/title trang mới', 'Thêm sản phẩm thật nếu có hàng', 'Đăng 1 dự án hoặc ảnh thực tế'] },
    { week: 'Tuần 2', focus: 'Bàn giám đốc và bàn làm việc', tasks: ['Tối ưu bài hỗ trợ', 'Thêm FAQ cho sản phẩm chính', 'Tăng internal link về danh mục'] },
    { week: 'Tuần 3', focus: 'Giường sắt và tủ locker', tasks: ['Đăng dự án thực tế', 'Bổ sung ảnh xưởng/lắp đặt', 'Rà sản phẩm thiếu thông số'] },
    { week: 'Tuần 4', focus: 'Tổng kết dữ liệu', tasks: ['Kiểm tra Search Console thủ công', 'Chọn URL position 11-40 để tối ưu', 'Ghi log các thay đổi quan trọng'] },
  ];
}

export function getClusterProgress(cluster: SeoCluster) { return clusterScore(cluster); }

export async function getSeoHealth(): Promise<SeoHealthSnapshot> { const response = await fetch('/api/admin/seo/health', { cache: 'no-store' }); if (!response.ok) throw new Error('Không đọc được tình trạng hệ thống SEO'); return response.json(); }

