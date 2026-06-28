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

export function buildSeoCommands({ overview, tasks, health, keywords }: { overview: SeoOverview | null; tasks: TodayTask[]; health: SeoHealthSnapshot | null; keywords: SeoKeyword[] }): SeoCommand[] {
  const pendingTasks = tasks.filter((task) => !task.completed).length;
  const errors = health?.brokenUrls.filter((item) => item.status === 'new').length || 0;
  const weakKeyword = keywords.find((item) => item.current_position && item.current_position > 10);
  return [
    { id: 'product', title: 'Thêm 1 sản phẩm', detail: `${overview?.products || 0} sản phẩm hiện có`, level: (overview?.products || 0) < 350 ? 'critical' : 'low', source: 'products' },
    { id: 'blog', title: 'Viết 1 bài tin tức', detail: `${overview?.blogPosts || 0} bài viết hiện có`, level: (overview?.blogPosts || 0) < 100 ? 'high' : 'low', source: 'blog_posts' },
    { id: 'focus', title: weakKeyword ? `Tối ưu ${weakKeyword.keyword}` : 'Không sửa cụm đã ổn', detail: weakKeyword ? `Đang ở vị trí ${weakKeyword.current_position}` : 'Ưu tiên cụm còn yếu', level: weakKeyword ? 'high' : 'low', source: 'seo_keywords' },
    { id: 'console', title: 'Kiểm tra Search Console', detail: errors ? `${errors} URL 404 mới` : 'Sitemap và robots đang được theo dõi', level: errors ? 'critical' : 'medium', source: 'health' },
    { id: 'task', title: pendingTasks ? `Hoàn thành ${pendingTasks} việc SEO` : 'Tạo checklist hôm nay', detail: pendingTasks ? 'Còn việc chưa xong' : 'Chưa có việc cần làm', level: pendingTasks ? 'medium' : 'high', source: 'seo_tasks' },
  ];
}

export function buildAiInsights({ overview, health, tasks, logs }: { overview: SeoOverview | null; health: SeoHealthSnapshot | null; tasks: TodayTask[]; logs: SeoLog[] }): AiInsight[] {
  const today = new Date().toISOString().slice(0, 10);
  return [
    { id: 'products', text: `Website đang có ${overview?.products || 0} sản phẩm.`, level: (overview?.products || 0) >= 300 ? 'low' : 'high' },
    { id: 'blogs', text: `Kho tin tức đang có ${overview?.blogPosts || 0} bài viết.`, level: (overview?.blogPosts || 0) >= 80 ? 'low' : 'high' },
    { id: 'robots', text: health?.sitemap.robotsOk ? 'Không phát hiện lỗi robots.' : 'Cần kiểm tra robots.txt.', level: health?.sitemap.robotsOk ? 'low' : 'critical' },
    { id: 'sitemap', text: health?.sitemap.sitemapOk ? `Sitemap hoạt động bình thường với ${health.sitemap.urlCount} URL.` : 'Cần kiểm tra sitemap.xml.', level: health?.sitemap.sitemapOk ? 'low' : 'critical' },
    { id: 'logs', text: logs.some((item) => item.log_date === today) ? 'Hôm nay đã có hành động SEO được ghi nhận.' : 'Hôm nay chưa có log SEO mới.', level: logs.some((item) => item.log_date === today) ? 'low' : 'medium' },
    { id: 'tasks', text: tasks.some((item) => !item.completed) ? 'Còn việc SEO hôm nay chưa hoàn thành.' : 'Checklist hôm nay đang gọn.', level: tasks.some((item) => !item.completed) ? 'medium' : 'low' },
  ];
}

export function buildSeoScore({ overview, health, keywords, progress }: { overview: SeoOverview | null; health: SeoHealthSnapshot | null; keywords: SeoKeyword[]; progress: SeoProgress[] }): AiSeoScore {
  const technical = health?.sitemap.sitemapOk && health?.sitemap.robotsOk ? 95 : 70;
  const content = clamp(((overview?.blogPosts || 0) / 100) * 100);
  const internalLink = progress.length ? clamp(progress.reduce((sum, item) => sum + item.progress, 0) / progress.length) : 70;
  const index = clamp(((health?.sitemap.urlCount || 0) / Math.max(1, overview?.generatedUrls || 1)) * 100);
  const keywordScore = keywords.length ? clamp(100 - keywords.reduce((sum, item) => sum + Math.min(item.current_position || 20, 30), 0) / keywords.length) : 80;
  const healthScore = health?.brokenUrls.some((item) => item.status === 'new') ? 80 : 100;
  const overall = clamp((technical + content + internalLink + index + keywordScore + healthScore) / 6);
  return { technical, content, internalLink, index, health: healthScore, overall };
}

export function buildTodaySummary({ overview, health, logs }: { overview: SeoOverview | null; health: SeoHealthSnapshot | null; logs: SeoLog[] }): TodaySummary {
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((item) => item.log_date === today);
  return { products: todayLogs.filter((item) => item.action.toLowerCase().includes('sản phẩm')).length, blogPosts: todayLogs.filter((item) => item.action.toLowerCase().includes('bài') || item.action.toLowerCase().includes('tin')).length, errors: health?.brokenUrls.filter((item) => item.status === 'new').length || 0, urls: health?.sitemap.urlCount || overview?.generatedUrls || 0, productsTotal: overview?.products || 0, blogPostsTotal: overview?.blogPosts || 0 };
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
  return <ModuleCard title="Today Summary" description="Tóm tắt nhanh trong ngày."><div className={styles.metricGridSmall}><MetricCard label="+ Sản phẩm" value={summary.products} /><MetricCard label="+ Bài viết" value={summary.blogPosts} /><MetricCard label="+ Lỗi" value={summary.errors} /><MetricCard label="URL" value={summary.urls} /><MetricCard label="Tổng sản phẩm" value={summary.productsTotal} /><MetricCard label="Tổng bài viết" value={summary.blogPostsTotal} /></div></ModuleCard>;
}

export function QuickActionPanel() {
  const actions = [{ label: 'Thêm sản phẩm', href: '/admin' }, { label: 'Thêm bài viết', href: '/admin' }, { label: 'Mở Search Console', href: 'https://search.google.com/search-console' }, { label: 'Mở Google Ads', href: 'https://ads.google.com' }, { label: 'Mở Sitemap', href: '/sitemap.xml' }, { label: 'Mở Robots', href: '/robots.txt' }];
  return <ModuleCard title="Quick Action" description="Các đường tắt thao tác SEO."><div className={styles.quickGrid}>{actions.map((item) => <a className={styles.quickButton} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} key={item.label}>{item.label}</a>)}</div></ModuleCard>;
}

export function LocalSeoPanel({ items, saving, actions }: { items: LocalSeoItem[]; saving: boolean; actions: V3Actions }) {
  return <ModuleCard title="Local SEO" description="Theo dõi tên doanh nghiệp, số điện thoại, địa chỉ, Google Business và LocalBusiness schema." action={<button className={styles.secondaryButton} disabled={saving} onClick={() => actions.saveLocalSeo({ id: newId('local'), name: 'Hạng mục Local SEO', value: '', status: 'warning' })}>+ Thêm mục</button>}>{items.length === 0 ? <EmptyState title="Chưa có dữ liệu Local SEO" detail="Thêm thông tin NAP, Google Business hoặc trạng thái schema." /> : <div className={styles.tableWrap}><table><thead><tr><th>Hạng mục</th><th>Giá trị</th><th>Status</th><th></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><input value={item.name} onChange={(event) => actions.saveLocalSeo({ ...item, name: event.target.value })} /></td><td><input value={item.value} onChange={(event) => actions.saveLocalSeo({ ...item, value: event.target.value })} /></td><td><select value={item.status} onChange={(event) => actions.saveLocalSeo({ ...item, status: event.target.value as LocalSeoItem['status'] })}><option value="ok">OK</option><option value="warning">Cần kiểm tra</option><option value="missing">Thiếu</option></select></td><td><button className={styles.iconButton} onClick={() => actions.removeLocalSeo(item.id)}>×</button></td></tr>)}</tbody></table></div>}</ModuleCard>;
}

export function AiSeoScorePanel({ score }: { score: AiSeoScore }) {
  const rows = [['Technical SEO', score.technical], ['Content', score.content], ['Internal Link', score.internalLink], ['Index', score.index], ['Health', score.health]] as const;
  return <ModuleCard title="AI SEO Score" description="Điểm tự chấm từ dữ liệu dashboard."><div className={styles.scoreHero}><strong>{score.overall}/100</strong><span>Overall</span></div><div className={styles.scoreList}>{rows.map(([label, value]) => <div className={styles.scoreItem} key={label}><span>{label}</span><b>{value}</b><i><em style={{ width: `${value}%` }} /></i></div>)}</div></ModuleCard>;
}
