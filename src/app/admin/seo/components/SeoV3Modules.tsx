'use client';

import { Badge, EmptyState, MetricCard, ModuleCard } from './Ui';
import type { AiInsight, AiSeoScore, LocalSeoItem, SeoCommand, SeoGoal, SeoHealthSnapshot, SeoKeyword, SeoLog, SeoOverview, SeoPriorityLevel, SeoProgress, TodaySummary, TodayTask } from '../types/seo';
import styles from '../seo-dashboard.module.css';

type V3Actions = {
  saveKeyword: (keyword: Partial<SeoKeyword>) => void;
  removeKeyword: (id: string) => void;
  saveLog: (log: Partial<SeoLog>) => void;
  removeLog: (id: string) => void;
  saveProgress: (progress: Partial<SeoProgress>) => void;
  removeProgress: (id: string) => void;
  saveGoal: (goal: Partial<SeoGoal>) => void;
  removeGoal: (id: string) => void;
  saveLocalSeo: (item: Partial<LocalSeoItem>) => void;
  removeLocalSeo: (id: string) => void;
};

function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value || 0))); }
function levelIcon(level: SeoPriorityLevel) { return ({ critical: '🔴', high: '🟡', medium: '🔵', low: '🟢' } as const)[level]; }
function newId(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }
function isRecentDate(dateString?: string) {
  if (!dateString) return false;
  const value = new Date(dateString).getTime();
  if (Number.isNaN(value)) return false;
  return Date.now() - value <= 3 * 24 * 60 * 60 * 1000;
}
function supabaseDashboardUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  return projectRef ? `https://supabase.com/dashboard/project/${projectRef}` : 'https://supabase.com/dashboard';
}

export function buildSeoCommands({ overview, tasks, health, keywords, searchConsoleConnected }: { overview: SeoOverview | null; tasks: TodayTask[]; health: SeoHealthSnapshot | null; keywords: SeoKeyword[]; searchConsoleConnected: boolean }): SeoCommand[] {
  const commands: SeoCommand[] = [];
  const products = overview?.products || 0;
  const blogPosts = overview?.blogPosts || 0;
  const pendingTasks = tasks.filter((task) => !task.completed).length;
  const errors = health?.brokenUrls.filter((item) => item.status === 'new').length || 0;
  const weakKeyword = keywords.find((item) => item.current_position && item.current_position > 10);
  const sitemapOk = Boolean(health?.sitemap.sitemapOk);

  if (products < 350) commands.push({ id: 'product', title: 'Thêm 1 sản phẩm thật nếu có hàng', detail: `${products} sản phẩm hiện có, mục tiêu giai đoạn này là 350+ sản phẩm thật.`, level: 'critical', source: 'products' });
  else commands.push({ id: 'product-ok', title: 'Không thêm sản phẩm ảo', detail: `${products} sản phẩm hiện có. Chỉ thêm khi có ảnh, giá và thông tin thật.`, level: 'low', source: 'products' });

  if (blogPosts < 60) commands.push({ id: 'blog', title: 'Viết hoặc cập nhật 1 bài tin tức/dự án', detail: `${blogPosts} bài viết hiện có. Ưu tiên bài có ảnh thật và liên kết nội bộ.`, level: 'high', source: 'blog_posts' });
  else commands.push({ id: 'blog-ok', title: 'Rà soát bài cũ thay vì viết dàn trải', detail: `${blogPosts} bài viết hiện có. Nên cập nhật bài có khả năng ra đơn.`, level: 'medium', source: 'blog_posts' });

  commands.push(searchConsoleConnected ? { id: 'console-ok', title: 'Đọc dữ liệu Search Console', detail: 'Search Console đã sẵn sàng để theo dõi impression, click và query.', level: 'medium', source: 'search_console' } : { id: 'console', title: 'Kiểm tra Search Console thủ công', detail: 'Chưa kết nối API, nên kiểm tra index và query bằng Search Console.', level: 'medium', source: 'search_console' });

  commands.push(sitemapOk ? { id: 'sitemap-ok', title: 'Không sửa sitemap hôm nay', detail: `${health?.sitemap.urlCount || overview?.generatedUrls || 0} URL đang được theo dõi. Sitemap đọc được.`, level: 'low', source: 'sitemap' } : { id: 'sitemap-check', title: 'Kiểm tra sitemap.xml', detail: 'Dashboard chưa đọc được sitemap.xml hoặc sitemap đang lỗi.', level: 'critical', source: 'sitemap' });

  if (errors) commands.push({ id: '404', title: `Xử lý ${errors} URL 404 mới`, detail: 'Ưu tiên redirect hoặc sửa liên kết nội bộ trước khi viết thêm nội dung.', level: 'critical', source: '404' });
  else commands.push({ id: 'stable-url', title: 'Không sửa title/slug URL mới', detail: 'Nếu vừa thêm sản phẩm hoặc bài viết, nên chờ Google đánh giá trước khi đổi URL.', level: 'low', source: 'index' });

  if (weakKeyword) commands.push({ id: 'keyword', title: `Tối ưu cụm ${weakKeyword.keyword}`, detail: `Đang theo dõi vị trí ${weakKeyword.current_position}. Nên thêm FAQ, ảnh thật hoặc liên kết nội bộ.`, level: 'high', source: 'seo_keywords' });
  if (!pendingTasks) commands.push({ id: 'old-product', title: 'Cập nhật ảnh thật hoặc FAQ cho sản phẩm cũ', detail: 'Khi không có sản phẩm mới, nên làm giàu dữ liệu cho sản phẩm đang bán.', level: 'medium', source: 'products' });

  return commands.slice(0, Math.max(3, Math.min(commands.length, 6)));
}

export function buildAiInsights({ overview, health, tasks, logs, searchConsoleConnected }: { overview: SeoOverview | null; health: SeoHealthSnapshot | null; tasks: TodayTask[]; logs: SeoLog[]; searchConsoleConnected: boolean }): AiInsight[] {
  const today = new Date().toISOString().slice(0, 10);
  const recentLogs = logs.filter((item) => isRecentDate(item.log_date)).length;
  const sitemapUrls = health?.sitemap.urlCount || overview?.generatedUrls || 0;
  return [
    { id: 'data', text: `Website hiện có ${overview?.products || 0} sản phẩm, ${overview?.blogPosts || 0} bài viết và ${overview?.categories || 0} danh mục.`, level: 'low' },
    { id: 'sitemap', text: health?.sitemap.sitemapOk ? `Sitemap đọc được, đang có khoảng ${sitemapUrls} URL.` : 'Sitemap chưa đọc được, cần kiểm tra trước khi submit lại.', level: health?.sitemap.sitemapOk ? 'low' : 'critical' },
    { id: 'console', text: searchConsoleConnected ? 'Search Console đã kết nối, có thể dùng dữ liệu impression/click để ra quyết định.' : 'Search Console chưa kết nối API nên chưa thể tự lấy impression/click; hiện vẫn nên kiểm tra thủ công.', level: searchConsoleConnected ? 'low' : 'medium' },
    { id: 'priority', text: 'Hôm nay nên ưu tiên dữ liệu thật: sản phẩm, dự án, ảnh thực tế và câu hỏi thường gặp.', level: 'high' },
    { id: 'url-stability', text: recentLogs ? 'Có hành động SEO mới trong 3 ngày gần đây, không nên đổi slug/title liên tục.' : 'Chưa thấy log SEO mới gần đây, có thể chọn 1 trang cũ để cập nhật nội dung.', level: recentLogs ? 'low' : 'medium' },
    { id: 'tasks', text: tasks.some((item) => !item.completed) ? 'Còn việc SEO hôm nay chưa hoàn thành.' : 'Checklist hôm nay chưa có việc lưu, có thể dùng gợi ý ở Today Task.', level: tasks.some((item) => !item.completed) ? 'medium' : 'low' },
  ];
}

export function buildSeoScore({ overview, health, searchConsoleConnected, googleAdsConnected }: { overview: SeoOverview | null; health: SeoHealthSnapshot | null; searchConsoleConnected: boolean; googleAdsConnected: boolean }): AiSeoScore {
  const supabaseOk = Boolean(overview);
  const sitemapOk = Boolean(health?.sitemap.sitemapOk);
  const robotsOk = Boolean(health?.sitemap.robotsOk);
  const hasProducts = Boolean((overview?.products || 0) > 0);
  const hasBlogPosts = Boolean((overview?.blogPosts || 0) > 0);
  const canonicalOk = health?.systemHealth.some((item) => item.name.toLowerCase() === 'canonical' && item.status === 'ok') || false;
  const overall = (supabaseOk ? 20 : 0) + (sitemapOk ? 20 : 0) + (robotsOk ? 15 : 0) + (hasProducts ? 15 : 0) + (hasBlogPosts ? 10 : 0) + (searchConsoleConnected ? 10 : 0) + (googleAdsConnected ? 5 : 0) + (canonicalOk ? 5 : 0);

  return {
    technical: clamp(((sitemapOk ? 20 : 0) + (robotsOk ? 15 : 0) + (canonicalOk ? 5 : 0)) / 40 * 100),
    content: clamp(((hasProducts ? 15 : 0) + (hasBlogPosts ? 10 : 0)) / 25 * 100),
    data: supabaseOk ? 100 : 0,
    integration: clamp(((searchConsoleConnected ? 10 : 0) + (googleAdsConnected ? 5 : 0)) / 15 * 100),
    overall,
    details: { supabaseOk, sitemapOk, robotsOk, hasProducts, hasBlogPosts, searchConsoleConnected, googleAdsConnected, canonicalOk },
  };
}

export function buildTodaySummary({ overview, health, logs }: { overview: SeoOverview | null; health: SeoHealthSnapshot | null; logs: SeoLog[] }): TodaySummary {
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((item) => item.log_date === today);
  return { products: todayLogs.filter((item) => item.action.toLowerCase().includes('sản phẩm')).length, blogPosts: todayLogs.filter((item) => item.action.toLowerCase().includes('bài') || item.action.toLowerCase().includes('tin')).length, errors: health?.brokenUrls.filter((item) => item.status === 'new').length || 0, urls: overview?.generatedUrls || health?.sitemap.urlCount || 0, productsTotal: overview?.products || 0, blogPostsTotal: overview?.blogPosts || 0 };
}

export function SeoCommandCenter({ commands }: { commands: SeoCommand[] }) {
  return <ModuleCard title="Hôm nay nên làm gì?" description="AI SEO Manager tự xếp ưu tiên từ dữ liệu hiện có."><div className={styles.commandGrid}>{commands.map((item) => <div className={`${styles.commandCard} ${styles[item.level]}`} key={item.id}><strong>{levelIcon(item.level)} {item.title}</strong><span>{item.detail}</span><small>Nguồn: {item.source}</small></div>)}</div></ModuleCard>;
}

export function KeywordTracker({ keywords, saving, actions }: { keywords: SeoKeyword[]; saving: boolean; actions: V3Actions }) {
  return <ModuleCard title="Keyword Tracker" description="Theo dõi từ khóa, URL mục tiêu, priority, position và impression." action={<button className={styles.secondaryButton} disabled={saving} onClick={() => actions.saveKeyword({ id: newId('kw'), keyword: 'Từ khóa mới', target_url: '/', priority: 3, status: 'Theo dõi', current_position: null, current_impression: 0 })}>+ Thêm keyword</button>}>{keywords.length === 0 ? <EmptyState title="Chưa có keyword" detail="Tạo bảng seo_keywords rồi thêm từ khóa cần SEO." /> : <div className={styles.tableWrap}><table><thead><tr><th>Keyword</th><th>Target URL</th><th>Priority</th><th>Position</th><th>Impression</th><th>Status</th><th></th></tr></thead><tbody>{keywords.map((item) => <tr key={item.id}><td><input value={item.keyword} onChange={(event) => actions.saveKeyword({ ...item, keyword: event.target.value })} /></td><td><input value={item.target_url} onChange={(event) => actions.saveKeyword({ ...item, target_url: event.target.value })} /></td><td><input type="number" value={item.priority} onChange={(event) => actions.saveKeyword({ ...item, priority: Number(event.target.value) })} /></td><td><input type="number" value={item.current_position || ''} onChange={(event) => actions.saveKeyword({ ...item, current_position: event.target.value ? Number(event.target.value) : null })} /></td><td><input type="number" value={item.current_impression || 0} onChange={(event) => actions.saveKeyword({ ...item, current_impression: Number(event.target.value) })} /></td><td><input value={item.status} onChange={(event) => actions.saveKeyword({ ...item, status: event.target.value })} /></td><td><button className={styles.iconButton} onClick={() => actions.removeKeyword(item.id)}>×</button></td></tr>)}</tbody></table></div>}</ModuleCard>;
}

export function SeoTimeline({ logs, saving, actions }: { logs: SeoLog[]; saving: boolean; actions: V3Actions }) {
  return <ModuleCard title="SEO Timeline" description="Lưu lại từng hành động SEO theo ngày." action={<button className={styles.secondaryButton} disabled={saving} onClick={() => actions.saveLog({ id: newId('log'), log_date: new Date().toISOString().slice(0, 10), action: 'Hành động SEO', target: 'Mục tiêu SEO' })}>+ Thêm log</button>}>{logs.length === 0 ? <EmptyState title="Chưa có timeline" detail="Ghi lại các việc đã làm để theo dõi tiến độ SEO." /> : <div className={styles.timeline}>{logs.map((item) => <div className={styles.timelineItem} key={item.id}><input type="date" value={item.log_date} onChange={(event) => actions.saveLog({ ...item, log_date: event.target.value })} /><input value={item.action} onChange={(event) => actions.saveLog({ ...item, action: event.target.value })} /><input value={item.target} onChange={(event) => actions.saveLog({ ...item, target: event.target.value })} /><button className={styles.iconButton} onClick={() => actions.removeLog(item.id)}>×</button></div>)}</div>}</ModuleCard>;
}

export function ProjectProgress({ progress, saving, actions }: { progress: SeoProgress[]; saving: boolean; actions: V3Actions }) {
  return <ModuleCard title="Project Progress" description="Theo dõi từng cụm SEO." action={<button className={styles.secondaryButton} disabled={saving} onClick={() => actions.saveProgress({ id: newId('progress'), cluster: 'Cụm SEO mới', progress: 10 })}>+ Thêm cụm</button>}>{progress.length === 0 ? <EmptyState title="Chưa có cụm SEO" detail="Ví dụ: Ghế chân quỳ, Giường tầng, Bàn giám đốc." /> : <div className={styles.progressList}>{progress.map((item) => <div className={styles.progressItem} key={item.id}><input value={item.cluster} onChange={(event) => actions.saveProgress({ ...item, cluster: event.target.value })} /><input type="range" min="0" max="100" value={item.progress} onChange={(event) => actions.saveProgress({ ...item, progress: Number(event.target.value) })} /><strong>{item.progress}%</strong><button className={styles.iconButton} onClick={() => actions.removeProgress(item.id)}>×</button><span><i style={{ width: `${clamp(item.progress)}%` }} /></span></div>)}</div>}</ModuleCard>;
}

export function GoalPanel({ goals, saving, actions }: { goals: SeoGoal[]; saving: boolean; actions: V3Actions }) {
  return <ModuleCard title="Goal" description="Thiết lập mục tiêu SEO dài hạn." action={<button className={styles.secondaryButton} disabled={saving} onClick={() => actions.saveGoal({ id: newId('goal'), title: 'Mục tiêu SEO mới', target_value: 100, current_value: 0 })}>+ Thêm goal</button>}>{goals.length === 0 ? <EmptyState title="Chưa có mục tiêu" detail="Ví dụ: 500 URL Index, 100 bài viết, 350 sản phẩm." /> : <div className={styles.goalList}>{goals.map((item) => { const percent = clamp((item.current_value / Math.max(1, item.target_value)) * 100); return <div className={styles.goalItem} key={item.id}><input value={item.title} onChange={(event) => actions.saveGoal({ ...item, title: event.target.value })} /><div><input type="number" value={item.current_value} onChange={(event) => actions.saveGoal({ ...item, current_value: Number(event.target.value) })} /><span>/</span><input type="number" value={item.target_value} onChange={(event) => actions.saveGoal({ ...item, target_value: Number(event.target.value) })} /></div><strong>{percent}%</strong><button className={styles.iconButton} onClick={() => actions.removeGoal(item.id)}>×</button><span><i style={{ width: `${percent}%` }} /></span></div>; })}</div>}</ModuleCard>;
}

export function AiInsightPanel({ insights }: { insights: AiInsight[] }) {
  return <ModuleCard title="AI Insight" description="Nhận xét tự động từ dữ liệu Supabase và tình trạng hệ thống."><div className={styles.insightList}>{insights.map((item) => <div className={`${styles.insightItem} ${styles[item.level]}`} key={item.id}>{levelIcon(item.level)} {item.text}</div>)}</div></ModuleCard>;
}

export function TodaySummaryPanel({ summary }: { summary: TodaySummary }) {
  return <ModuleCard title="Today Summary" description="Tóm tắt nhanh trong ngày."><div className={styles.metricGridSmall}><MetricCard label="+ Sản phẩm" value={summary.products} /><MetricCard label="+ Bài viết" value={summary.blogPosts} /><MetricCard label="+ Lỗi" value={summary.errors} /><MetricCard label="URL tạo từ website" value={summary.urls} /><MetricCard label="Tổng sản phẩm" value={summary.productsTotal} /><MetricCard label="Tổng bài viết" value={summary.blogPostsTotal} /></div></ModuleCard>;
}

export function QuickActionPanel() {
  const actions = [
    { label: 'Mở Sitemap', href: '/sitemap.xml' },
    { label: 'Mở Robots', href: '/robots.txt' },
    { label: 'Mở Search Console', href: 'https://search.google.com/search-console' },
    { label: 'Mở Google Ads', href: 'https://ads.google.com' },
    { label: 'Mở Supabase', href: supabaseDashboardUrl() },
    { label: 'Mở trang chủ', href: '/' },
    { label: 'Mở Ghế chân quỳ', href: '/ghe-chan-quy' },
    { label: 'Mở Bàn giám đốc', href: '/ban-giam-doc' },
  ];
  return <ModuleCard title="Quick Action" description="Các đường tắt thao tác SEO."><div className={styles.quickGrid}>{actions.map((item) => <a className={styles.quickButton} href={item.href} target="_blank" rel="noreferrer" key={item.label}>{item.label}</a>)}</div></ModuleCard>;
}

export function LocalSeoPanel({ items, saving, actions }: { items: LocalSeoItem[]; saving: boolean; actions: V3Actions }) {
  return <ModuleCard title="Local SEO" description="Theo dõi tên doanh nghiệp, số điện thoại, địa chỉ, Google Business và LocalBusiness schema." action={<button className={styles.secondaryButton} disabled={saving} onClick={() => actions.saveLocalSeo({ id: newId('local'), name: 'Hạng mục Local SEO', value: '', status: 'warning' })}>+ Thêm mục</button>}>{items.length === 0 ? <EmptyState title="Chưa có dữ liệu Local SEO" detail="Thêm thông tin NAP, Google Business hoặc trạng thái schema." /> : <div className={styles.tableWrap}><table><thead><tr><th>Hạng mục</th><th>Giá trị</th><th>Status</th><th></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><input value={item.name} onChange={(event) => actions.saveLocalSeo({ ...item, name: event.target.value })} /></td><td><input value={item.value} onChange={(event) => actions.saveLocalSeo({ ...item, value: event.target.value })} /></td><td><select value={item.status} onChange={(event) => actions.saveLocalSeo({ ...item, status: event.target.value as LocalSeoItem['status'] })}><option value="ok">OK</option><option value="warning">Cần kiểm tra</option><option value="missing">Thiếu</option></select></td><td><button className={styles.iconButton} onClick={() => actions.removeLocalSeo(item.id)}>×</button></td></tr>)}</tbody></table></div>}</ModuleCard>;
}

export function AiSeoScorePanel({ score }: { score: AiSeoScore }) {
  const rows = [['Technical SEO', score.technical], ['Content', score.content], ['Data', score.data], ['Integration', score.integration]] as const;
  return <ModuleCard title="AI SEO Score" description="Điểm tự chấm thực tế từ tình trạng website. Search Console/Ads chưa kết nối được xem là pending."><div className={styles.scoreHero}><strong>{score.overall}/100</strong><span>Overall Score</span></div><div className={styles.scoreList}>{rows.map(([label, value]) => <div className={styles.scoreItem} key={label}><span>{label}</span><b>{value}</b><i><em style={{ width: `${value}%` }} /></i></div>)}</div><div className={styles.scoreStatus}><Badge status={score.details.searchConsoleConnected ? 'connected' : 'pending'}>Search Console {score.details.searchConsoleConnected ? 'đã kết nối' : 'pending'}</Badge><Badge status={score.details.googleAdsConnected ? 'connected' : 'pending'}>Google Ads {score.details.googleAdsConnected ? 'đã kết nối' : 'pending'}</Badge><Badge status={score.details.canonicalOk ? 'ok' : 'pending'}>Canonical {score.details.canonicalOk ? 'OK' : 'pending'}</Badge></div></ModuleCard>;
}
