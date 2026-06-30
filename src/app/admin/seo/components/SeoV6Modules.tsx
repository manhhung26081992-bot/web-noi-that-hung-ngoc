'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { Badge, EmptyState, ModuleCard } from './Ui';
import type { SearchConsoleV5Data } from '../services/searchConsole';
import type { AiDailyBrief, AiRecommendationHistoryItem, GoogleAdsImportData, DoNotTouchItem, ProductSeoItem, SearchConsoleV7Data, SeoBlogQualityItem, SeoCluster, SeoCommand, SeoHealthSnapshot, SeoKeyword, SeoLog, SeoOverview, TodayTask, V6Analysis, V6Decision, V6Notification, V6Opportunity, V6RadarPoint } from '../types/seo';
import styles from '../seo-dashboard.module.css';

type V6Input = { overview: SeoOverview | null; health: SeoHealthSnapshot | null; products: ProductSeoItem[]; blogs: SeoBlogQualityItem[]; keywords: SeoKeyword[]; clusters: SeoCluster[]; tasks: TodayTask[]; logs: SeoLog[]; doNotTouch: DoNotTouchItem[]; searchConsole: SearchConsoleV5Data | null; searchConsoleV7?: SearchConsoleV7Data | null; googleAdsV8?: GoogleAdsImportData | null; };

function n(value: unknown) { return String(value || '').trim().toLowerCase(); }
function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0))); }
function avg(items: number[]) { return items.length ? clamp(items.reduce((sum, value) => sum + value, 0) / items.length) : 0; }
function fmt(value: number | null | undefined) { return new Intl.NumberFormat('vi-VN').format(Number(value || 0)); }
function key(table: string, id: unknown, slug: unknown, index: number) { return table + '-' + String(id ?? 'no-id') + '-' + String(slug ?? 'no-slug') + '-' + index; }
function status(score: number) { return score >= 80 ? 'ok' : score >= 55 ? 'pending' : 'warning'; }
function levelStatus(level: string) { return level === 'critical' || level === 'high' ? 'warning' : level === 'low' ? 'ok' : 'pending'; }
function uniqueBy<T>(items: T[], getKey: (item: T, index: number) => string) { const map = new Map<string, T>(); items.forEach((item, index) => { const k = getKey(item, index); if (!map.has(k)) map.set(k, item); }); return Array.from(map.values()); }
function productHref(product: ProductSeoItem) { return '/san-pham/' + product.slug; }
function clusterMatch(cluster: SeoCluster, value: unknown) { const text = n(value); const name = n(cluster.name); const url = n(cluster.main_url).replace(/^\//, ''); return Boolean(text && ((name && text.includes(name)) || (url && text.includes(url)))); }

function productsRank(products: ProductSeoItem[]) {
  return uniqueBy(products, (item, index) => key('product', item.id, item.slug, index))
    .map((product) => ({ ...product, qualityScore: clamp(product.qualityScore ?? 0), issues: product.issues?.length ? product.issues : ['Chưa thấy vấn đề lớn'], action: product.action || 'Giữ ổn định, không đổi slug nếu đã index.' }))
    .sort((a, b) => (a.qualityScore || 0) - (b.qualityScore || 0))
    .slice(0, 20);
}

function blogsRank(blogs: SeoBlogQualityItem[]) {
  return uniqueBy(blogs, (item, index) => key('blog', item.id, item.slug, index)).sort((a, b) => a.score - b.score || b.issues.length - a.issues.length).slice(0, 20);
}

function opportunities(input: V6Input, products: ProductSeoItem[], blogs: SeoBlogQualityItem[]): V6Opportunity[] {
  return input.clusters.map((cluster, index) => {
    const ps = products.filter((product) => clusterMatch(cluster, [product.name, product.slug, product.category, product.parent_slug].join(' ')));
    const bs = blogs.filter((blog) => clusterMatch(cluster, [blog.title, blog.slug, blog.excerpt].join(' ')));
    const ks = input.keywords.filter((kw) => clusterMatch(cluster, [kw.cluster, kw.keyword, kw.target_url].join(' ')));
    const productScore = ps.length ? avg(ps.map((item) => item.qualityScore || 0)) : 35;
    const blogScore = bs.length ? avg(bs.map((item) => item.score)) : 30;
    const keywordScore = clamp(Math.min(ks.length * 18, 100));
    const linkScore = cluster.internal_link_measured === false ? 45 : clamp((cluster.internal_link_count || 0) * 20);
    const coverageScore = clamp((cluster.product_count || ps.length) * 9 + (cluster.post_count || bs.length) * 14);
    const score = clamp(productScore * 0.25 + blogScore * 0.22 + keywordScore * 0.18 + linkScore * 0.18 + coverageScore * 0.17);
    const reasons = [];
    if (!ps.length && !cluster.product_count) reasons.push('thiếu sản phẩm liên quan');
    if (!bs.length && !cluster.post_count) reasons.push('thiếu bài viết hỗ trợ');
    if (!ks.length) reasons.push('chưa có keyword theo cụm');
    if (cluster.internal_link_measured === false) reasons.push('internal link chưa đo');
    if (!reasons.length) reasons.push(score >= 80 ? 'cụm đang ổn, ưu tiên theo dõi' : 'điểm chất lượng còn thấp');
    const nextAction = reasons[0].includes('bài viết') ? 'Viết/cập nhật bài hỗ trợ cho cụm ' + cluster.name + '.' : reasons[0].includes('keyword') ? 'Thêm keyword chính và phụ cho cụm ' + cluster.name + '.' : reasons[0].includes('sản phẩm') ? 'Bổ sung sản phẩm thật cho cụm ' + cluster.name + ' nếu có hàng.' : 'Tăng internal link và FAQ cho cụm ' + cluster.name + '.';
    return { id: String(cluster.id || cluster.name || index), cluster: cluster.name, score, reasons, nextAction };
  }).sort((a, b) => a.score - b.score);
}

function decisions(input: V6Input, products: ProductSeoItem[], blogs: SeoBlogQualityItem[], opps: V6Opportunity[]): V6Decision[] {
  const list: V6Decision[] = [];
  const p = products[0];
  const b = blogs[0];
  const c = opps[0];
  const kw = [...input.keywords].sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99))[0];
  const dnt = input.doNotTouch.find((item) => n(item.status).includes('theo dõi') || Date.parse(item.until_date) > Date.now());
  const ads = input.googleAdsV8?.opportunities?.[0];
  if (ads) list.push({ id: 'p1-ads-' + ads.id, priority: ads.recommendation === 'Cả hai' ? 1 : 2, title: 'Tận dụng keyword ' + ads.keyword, reason: ads.reason, action: ads.action, level: ads.score >= 75 ? 'critical' : 'high', source: 'google_ads_import' });
  if (p && (p.qualityScore || 0) < 80) list.push({ id: 'p1-product-' + p.id, priority: 1, title: 'Bổ sung SEO cho ' + p.name, reason: p.issues.slice(0, 3).join(', ') || 'sản phẩm còn thiếu dữ liệu', action: p.action, level: 'critical', source: 'products' });
  if (c && c.score < 75) list.push({ id: 'p2-cluster-' + c.id, priority: 2, title: 'Đẩy cụm ' + c.cluster, reason: c.reasons.join(', '), action: c.nextAction, level: 'high', source: 'seo_clusters' });
  if (b && b.score < 75) list.push({ id: 'p2-blog-' + b.id, priority: 2, title: 'Cập nhật bài ' + b.title, reason: b.issues.slice(0, 3).join(', '), action: b.action, level: 'high', source: 'blog_posts' });
  if (kw) list.push({ id: 'p3-keyword-' + kw.id, priority: 3, title: 'Theo dõi keyword ' + kw.keyword, reason: 'Ưu tiên ' + kw.priority + (kw.cluster ? ' trong cụm ' + kw.cluster : ''), action: kw.target_url ? 'Kiểm tra URL đích ' + kw.target_url + ' và bổ sung liên kết nội bộ.' : 'Gắn URL đích cho keyword này.', level: Number(kw.priority || 3) <= 2 ? 'high' : 'medium', source: 'seo_keywords' });
  if (dnt) list.push({ id: 'p3-dnt-' + dnt.id, priority: 3, title: 'Không đổi slug/title URL mới', reason: dnt.reason, action: 'Giữ nguyên ' + dnt.url + ' đến ' + dnt.until_date + '.', level: 'medium', source: 'seo_do_not_touch' });
  return uniqueBy(list, (item, index) => key('decision', item.id, item.source, index)).slice(0, 6);
}

function notifications(input: V6Input, products: ProductSeoItem[], blogs: SeoBlogQualityItem[], opps: V6Opportunity[]): V6Notification[] {
  const missingFaq = products.filter((p) => p.checks && !p.checks.faq).length;
  const missingImage = products.filter((p) => p.issues.some((issue) => n(issue).includes('ảnh'))).length;
  const weakBlog = blogs.filter((blog) => blog.score < 70).length;
  const weakCluster = opps.filter((item) => item.score < 70).length;
  const list: V6Notification[] = [];
  if (missingFaq) list.push({ id: 'missing-faq', title: missingFaq + ' sản phẩm thiếu FAQ', detail: 'Ưu tiên sản phẩm đang SEO hoặc có hàng thật.', level: missingFaq > 10 ? 'critical' : 'high', count: missingFaq });
  if (missingImage) list.push({ id: 'missing-image', title: missingImage + ' sản phẩm cần kiểm tra ảnh', detail: 'Ảnh thật giúp tăng niềm tin và SEO hình ảnh.', level: 'high', count: missingImage });
  if (weakBlog) list.push({ id: 'weak-blog', title: weakBlog + ' bài viết cần tối ưu', detail: 'Kiểm tra nội dung, ảnh, meta và internal link.', level: 'high', count: weakBlog });
  if (weakCluster) list.push({ id: 'weak-cluster', title: weakCluster + ' cụm SEO dưới 70 điểm', detail: 'Cần thêm bài, sản phẩm hoặc liên kết nội bộ.', level: 'critical', count: weakCluster });
  if (input.googleAdsV8?.summary.keywordCount) list.push({ id: 'ads-import', title: input.googleAdsV8.summary.keywordCount + ' keyword Keyword Planner đã import', detail: 'AI đang dùng dữ liệu Ads import thủ công để ưu tiên SEO/Ads.', level: 'medium', count: input.googleAdsV8.summary.keywordCount });
  if (!input.searchConsoleV7?.overview.impressions) list.push({ id: 'gsc-import-pending', title: 'Chưa import dữ liệu Search Console', detail: 'Có thể import thủ công nếu cần phân tích query, page, CTR và position. Không dùng API ở phiên bản hiện tại.', level: 'medium' });
  return list;
}

function radar(input: V6Input, products: ProductSeoItem[], blogs: SeoBlogQualityItem[], opps: V6Opportunity[]): V6RadarPoint[] {
  const technical = avg([input.health?.sitemap.sitemapOk ? 100 : 45, input.health?.sitemap.robotsOk ? 100 : 45, input.overview?.generatedUrls ? 90 : 40]);
  const content = avg([input.overview?.blogPosts ? 80 : 30, blogs.length ? avg(blogs.map((item) => item.score)) : 35]);
  const internalLink = input.clusters.length ? avg(input.clusters.map((cluster) => cluster.internal_link_measured === false ? 45 : Math.min((cluster.internal_link_count || 0) * 20, 100))) : 40;
  const keyword = input.googleAdsV8?.summary.keywordCount ? clamp(Math.min((input.keywords.length + input.googleAdsV8.summary.keywordCount) * 6, 100)) : (input.keywords.length ? clamp(Math.min(input.keywords.length * 8, 100)) : 35);
  const product = products.length ? avg(products.map((item) => item.qualityScore || 0)) : 30;
  const cluster = opps.length ? avg(opps.map((item) => item.score)) : 35;
  const blog = blogs.length ? avg(blogs.map((item) => item.score)) : 35;
  const gsc = input.searchConsoleV7?.overview.connected || input.searchConsole?.status === 'connected' ? 90 : 50;
  return [{ label: 'Technical', score: technical }, { label: 'Content', score: content }, { label: 'Internal Link', score: internalLink }, { label: 'Keyword', score: keyword }, { label: 'Product', score: product }, { label: 'Cluster', score: cluster }, { label: 'Blog', score: blog }, { label: 'Search Console', score: gsc }];
}

export function buildV6Analysis(input: V6Input): V6Analysis {
  const productRanking = productsRank(input.products);
  const blogRanking = blogsRank(input.blogs);
  const opportunityScore = opportunities(input, productRanking, blogRanking);
  const radarPoints = radar(input, productRanking, blogRanking, opportunityScore);
  const productNeedFaq = productRanking.find((item) => item.checks && !item.checks.faq);
  const insights = uniqueBy([
    opportunityScore[0] ? opportunityScore[0].cluster + ' còn dư địa tăng SEO: ' + opportunityScore[0].reasons[0] + '.' : '',
    productNeedFaq ? productNeedFaq.name + ' nên bổ sung FAQ trước khi đổi slug hoặc title.' : '',
    blogRanking[0] ? 'Bài ' + blogRanking[0].title + ' cần tối ưu: ' + blogRanking[0].issues.slice(0, 2).join(', ') + '.' : '',
    !input.searchConsoleV7?.overview.impressions ? 'Chưa import dữ liệu Search Console nên dashboard chưa thể đọc query/click/impression thật.' : 'Dashboard đang dùng dữ liệu Search Console import thủ công để phân tích cơ hội SEO.',
  ].filter(Boolean), (item) => n(item)).slice(0, 3);
  const completedTasks = input.tasks.filter((task) => task.completed || ['done', 'completed', 'hoàn thành'].includes(n(task.status))).length;
  const progress = { yesterday: input.logs.filter((log) => Date.parse(log.created_at || log.log_date) > Date.now() - 86400000).length, today: input.tasks.filter((task) => !task.completed && !['done', 'completed', 'hoàn thành'].includes(n(task.status))).length, sevenDays: input.logs.filter((log) => Date.parse(log.created_at || log.log_date) > Date.now() - 7 * 86400000).length, thirtyDays: input.logs.filter((log) => Date.parse(log.created_at || log.log_date) > Date.now() - 30 * 86400000).length, improved: [productRanking.filter((item) => (item.qualityScore || 0) >= 80).length + ' sản phẩm đạt điểm tốt', blogRanking.filter((item) => item.score >= 80).length + ' bài viết đạt điểm tốt', completedTasks ? completedTasks + ' task đã hoàn thành' : 'Chưa có task hoàn thành'] };
  return { decisions: decisions(input, productRanking, blogRanking, opportunityScore), opportunities: opportunityScore, productRanking, blogRanking, notifications: notifications(input, productRanking, blogRanking, opportunityScore), radar: radarPoints, progress, insights };
}

export function AiDecisionEngine({ decisions }: { decisions: V6Decision[] }) {
  return <ModuleCard title="AI Decision Engine" description="AI đọc dữ liệu thật hiện có và xếp việc theo Priority 1/2/3.">{decisions.length ? <div className={styles.v6List}>{decisions.map((item, index) => <div className={styles.v6Decision} key={key('decision-render', item.id, item.source, index)}><Badge status={levelStatus(item.level)}>Priority {item.priority}</Badge><div><strong>{item.title}</strong><p>{item.reason}</p><span>{item.action}</span></div></div>)}</div> : <EmptyState title="Chưa đủ dữ liệu quyết định" detail="Thêm sản phẩm, keyword hoặc cluster để AI phân tích." />}</ModuleCard>;
}

export function OpportunityScorePanel({ items }: { items: V6Opportunity[] }) {
  return <ModuleCard title="Opportunity Score" description="Điểm cơ hội SEO cho từng cụm, tính từ sản phẩm, bài viết, keyword và internal link.">{items.length ? <div className={styles.v6List}>{items.slice(0, 8).map((item, index) => <div className={styles.v6ScoreRow} key={key('opportunity', item.id, item.cluster, index)}><div><strong>{item.cluster}</strong><p>{item.reasons.join(', ')}</p><span>{item.nextAction}</span></div><Badge status={status(item.score)}>{item.score}/100</Badge></div>)}</div> : <EmptyState title="Chưa có cụm SEO" detail="Thêm seo_clusters để dashboard tính cơ hội." />}</ModuleCard>;
}

export function AiProductRanking({ products }: { products: ProductSeoItem[] }) {
  const [filter, setFilter] = useState('all');
  const list = useMemo(() => products.filter((item) => filter === 'all' || item.issues.some((issue) => n(issue).includes(n(filter)))), [products, filter]);
  return <ModuleCard title="AI Product Ranking" description="Top 20 sản phẩm cần tối ưu nhất."><div className={styles.v6Toolbar}><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Tất cả lỗi</option><option value="ảnh">Thiếu ảnh</option><option value="FAQ">Thiếu FAQ</option><option value="mô tả">Thiếu mô tả</option><option value="thông số">Thiếu thông số</option></select></div>{list.length ? <div className={styles.v6RankList}>{list.map((item, index) => <a className={styles.v6RankItem} href={productHref(item)} target="_blank" rel="noreferrer" key={key('product-rank', item.id, item.slug, index)}><strong>{item.name}</strong><span>{item.issues.slice(0, 3).join(', ')}</span><Badge status={status(item.qualityScore || 0)}>{item.qualityScore || 0}/100</Badge></a>)}</div> : <EmptyState title="Không có sản phẩm phù hợp bộ lọc" detail="Đổi bộ lọc để xem sản phẩm khác." />}</ModuleCard>;
}

export function AiBlogRanking({ blogs }: { blogs: SeoBlogQualityItem[] }) {
  return <ModuleCard title="AI Blog Ranking" description="Xếp hạng bài viết theo nội dung, internal link, ảnh, slug, meta, FAQ và keyword.">{blogs.length ? <div className={styles.v6RankList}>{blogs.map((item, index) => <a className={styles.v6RankItem} href={'/tin-tuc/' + item.slug} target="_blank" rel="noreferrer" key={key('blog-rank', item.id, item.slug, index)}><strong>{item.title}</strong><span>{item.issues.slice(0, 3).join(', ')}</span><Badge status={status(item.score)}>{item.score}/100</Badge></a>)}</div> : <EmptyState title="Chưa có dữ liệu blog" detail="Khi có blog_posts, module sẽ tự chấm điểm." />}</ModuleCard>;
}

export function SmartNotificationCenter({ items }: { items: V6Notification[] }) {
  return <ModuleCard title="Smart Notification Center" description="Các cảnh báo SEO tổng hợp từ sản phẩm, blog, cluster và hệ thống.">{items.length ? <div className={styles.v6NoticeGrid}>{items.map((item, index) => <div className={styles.v6Notice} key={key('notice', item.id, item.title, index)}><Badge status={levelStatus(item.level)}>{item.count ? fmt(item.count) : 'AI'}</Badge><strong>{item.title}</strong><p>{item.detail}</p></div>)}</div> : <EmptyState title="Không có cảnh báo lớn" detail="Dashboard chưa phát hiện vấn đề ưu tiên cao." />}</ModuleCard>;
}

export function AiRecommendationHistory({ decisions }: { decisions: V6Decision[] }) {
  const [history, setHistory] = useState<AiRecommendationHistoryItem[]>([]);
  useEffect(() => { try { setHistory(JSON.parse(localStorage.getItem('hn_ai_recommendation_history') || '[]')); } catch { setHistory([]); } }, []);
  function save(item: V6Decision) {
    const next = uniqueBy([{ id: item.id + '-' + Date.now(), date: new Date().toISOString(), suggestion: item.title, done: false, result: item.action }, ...history], (row) => row.id).slice(0, 20);
    setHistory(next);
    localStorage.setItem('hn_ai_recommendation_history', JSON.stringify(next));
  }
  function toggle(id: string) {
    const next = history.map((item) => item.id === id ? { ...item, done: !item.done } : item);
    setHistory(next);
    localStorage.setItem('hn_ai_recommendation_history', JSON.stringify(next));
  }
  return <ModuleCard title="AI Recommendation History" description="Lịch sử gợi ý AI lưu localStorage, không cần thêm bảng Supabase."><div className={styles.v6Toolbar}>{decisions.slice(0, 3).map((item, index) => <button className={styles.secondaryButton} onClick={() => save(item)} key={key('save-decision', item.id, item.source, index)}>Lưu: {item.title}</button>)}</div>{history.length ? <div className={styles.v6List}>{history.map((item, index) => <label className={styles.v6History} key={key('history', item.id, item.suggestion, index)}><input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} /><span><strong>{new Date(item.date).toLocaleDateString('vi-VN')} - {item.suggestion}</strong><small>{item.result || 'Chưa ghi kết quả'}</small></span></label>)}</div> : <EmptyState title="Chưa lưu gợi ý nào" detail="Bấm lưu ở các gợi ý AI để theo dõi lịch sử." />}</ModuleCard>;
}

export function AiProgressEngine({ analysis }: { analysis: V6Analysis }) {
  const hasHistory = analysis.progress.yesterday > 0 || analysis.progress.sevenDays > 0 || analysis.progress.thirtyDays > 0 || analysis.progress.today > 0 || analysis.progress.improved.some((item) => !item.startsWith('0 ') && item !== 'Chưa có task hoàn thành');

  return <ModuleCard title="AI Progress Engine" description="Theo dõi cải thiện hôm qua, hôm nay, 7 ngày và 30 ngày.">
    {hasHistory ? <div className={styles.v6ProgressGrid}>
      <div><span>Hôm qua</span><strong>{analysis.progress.yesterday}</strong></div>
      <div><span>Việc còn hôm nay</span><strong>{analysis.progress.today}</strong></div>
      <div><span>7 ngày</span><strong>{analysis.progress.sevenDays}</strong></div>
      <div><span>30 ngày</span><strong>{analysis.progress.thirtyDays}</strong></div>
    </div> : <EmptyState title="Chưa có dữ liệu tiến độ đủ để so sánh." detail="Khi có seo_logs, seo_progress hoặc task hoàn thành, phần này sẽ tự tổng hợp." />}
    <div className={styles.v6List}>{analysis.progress.improved.map((item, index) => <span className={styles.v6Pill} key={key('improved', item, '', index)}>{item}</span>)}</div>
  </ModuleCard>;
}

export function SeoHealthRadar({ points }: { points: V6RadarPoint[] }) {
  const polygon = points.map((point, index) => { const angle = -Math.PI / 2 + index * (Math.PI * 2 / points.length); const radius = point.score * 1.05; return String(120 + Math.cos(angle) * radius) + ',' + String(120 + Math.sin(angle) * radius); }).join(' ');
  return <ModuleCard title="SEO Health Radar" description="Radar tổng hợp Technical, Content, Internal Link, Keyword, Product, Cluster, Blog và Search Console."><div className={styles.v6RadarWrap}><svg viewBox="0 0 240 240" className={styles.v6Radar} aria-label="SEO Health Radar"><polygon points={points.map((_, index) => { const angle = -Math.PI / 2 + index * (Math.PI * 2 / points.length); return String(120 + Math.cos(angle) * 105) + ',' + String(120 + Math.sin(angle) * 105); }).join(' ')} className={styles.v6RadarGrid} /><polygon points={polygon} className={styles.v6RadarShape} /></svg><div className={styles.v6RadarLegend}>{points.map((point, index) => <div key={key('radar', point.label, point.score, index)}><span>{point.label}</span><strong>{point.score}</strong></div>)}</div></div></ModuleCard>;
}

export function AutoInsightPanel({ insights }: { insights: string[] }) {
  return <ModuleCard title="Auto Insight" description="Mỗi lần làm mới, AI sinh 3 nhận xét từ dữ liệu hiện tại.">{insights.length ? <div className={styles.v6List}>{insights.map((item, index) => <div className={styles.v6Insight} key={key('insight', item, '', index)}>{item}</div>)}</div> : <EmptyState title="Chưa đủ dữ liệu insight" detail="Thêm sản phẩm, blog hoặc cluster để AI tự nhận xét." />}</ModuleCard>;
}


function uniqueText(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean))).slice(0, 8);
}

function TodaySeoFocusV61Base({
  decisions,
  notifications,
  insights,
  tasks,
  commands,
  dailyBrief,
  lastUpdated,
}: {
  decisions: V6Decision[];
  notifications: V6Notification[];
  insights: string[];
  tasks: TodayTask[];
  commands: SeoCommand[];
  dailyBrief: AiDailyBrief[];
  lastUpdated: string;
}) {
  const pendingTasks = useMemo(() => tasks.filter((task) => !task.completed).slice(0, 5), [tasks]);
  const todayItems = useMemo(() => uniqueText([
    ...decisions.map((item) => item.title + ': ' + item.action),
    ...commands.map((item) => item.title + ': ' + item.detail),
    ...dailyBrief.map((item) => item.text),
    ...pendingTasks.map((item) => 'Làm task: ' + item.title),
  ]).slice(0, 6), [commands, dailyBrief, decisions, pendingTasks]);

  return (
    <ModuleCard title="Hôm nay cần làm gì" description={'Gộp AI Daily Brief, Daily SEO Mission, Today Task, Auto Insight và Smart Notification. Cập nhật: ' + lastUpdated}>
      <div className={styles.v61TodayGrid}>
        <div className={styles.v61TodayColumn}>
          <strong>Việc ưu tiên</strong>
          {todayItems.length ? todayItems.map((item, index) => <p key={key('today-focus', item, '', index)}>{item}</p>) : <EmptyState title="Chưa có việc ưu tiên" detail="Dashboard chưa đủ dữ liệu để sinh việc hôm nay." />}
        </div>
        <div className={styles.v61TodayColumn}>
          <strong>Cảnh báo</strong>
          {notifications.length ? notifications.slice(0, 4).map((item, index) => <div className={styles.v61NoticeLine} key={key('today-notice', item.id, item.title, index)}><Badge status={levelStatus(item.level)}>{item.count ? fmt(item.count) : 'AI'}</Badge><span>{item.title}</span></div>) : <span>Không có cảnh báo lớn.</span>}
        </div>
        <div className={styles.v61TodayColumn}>
          <strong>Insight nhanh</strong>
          {insights.length ? insights.map((item, index) => <p key={key('today-insight', item, '', index)}>{item}</p>) : <span>Chưa có insight mới.</span>}
        </div>
      </div>
    </ModuleCard>
  );
}

export const TodaySeoFocusV61 = memo(TodaySeoFocusV61Base);
