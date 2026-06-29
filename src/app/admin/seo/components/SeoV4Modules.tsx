'use client';

import { Badge, EmptyState, MetricCard, ModuleCard } from './Ui';
import { getClusterProgress } from '../services/seoDashboardService';
import type {
  AiDailyBrief,
  AiSeoScore,
  ContentOpportunity,
  DoNotTouchItem,
  InternalLinkSuggestion,
  ProductSeoItem,
  RoadmapWeek,
  SeoCluster,
  SeoCompetitor,
  SeoGoal,
  SeoHealthSnapshot,
  SeoKeyword,
  SeoLog,
  SeoOverview,
  SeoPriorityLevel,
  TodayTask,
} from '../types/seo';
import styles from '../seo-dashboard.module.css';

type V4Actions = {
  saveKeyword: (keyword: Partial<SeoKeyword>) => void;
  removeKeyword: (id: string) => void;
  saveLog: (log: Partial<SeoLog>) => void;
  removeLog: (id: string) => void;
  saveCluster: (cluster: Partial<SeoCluster>) => void;
  removeCluster: (id: string) => void;
  saveDoNotTouch: (item: Partial<DoNotTouchItem>) => void;
  removeDoNotTouch: (id: string) => void;
  saveCompetitor: (item: Partial<SeoCompetitor>) => void;
  removeCompetitor: (id: string) => void;
};

function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value || 0))); }
function newId(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }
function formatNumber(value: number | null | undefined) { return new Intl.NumberFormat('vi-VN').format(Number(value || 0)); }
function levelLabel(level: SeoPriorityLevel) { return ({ critical: 'Rất cao', high: 'Cao', medium: 'Vừa', low: 'Ổn định' } as const)[level]; }
function today() { return new Date().toISOString().slice(0, 10); }
function isRecent(value?: string) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && Date.now() - time <= 3 * 86400000;
}
function supabaseDashboardUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  return projectRef ? `https://supabase.com/dashboard/project/${projectRef}` : 'https://supabase.com/dashboard';
}

export function buildAiDailyBrief({ overview, health, productSeoItems, logs, searchConsoleConnected }: { overview: SeoOverview | null; health: SeoHealthSnapshot | null; productSeoItems: ProductSeoItem[]; logs: SeoLog[]; searchConsoleConnected: boolean }): AiDailyBrief[] {
  const weakProducts = productSeoItems.filter((item) => item.issues.length > 0).length;
  const recentLogs = logs.filter((item) => isRecent(item.created_at || item.log_date)).length;
  const brief: AiDailyBrief[] = [
    { id: 'overview', text: `Hiện có ${overview?.products || 0} sản phẩm, ${overview?.blogPosts || 0} bài viết, khoảng ${overview?.generatedUrls || health?.sitemap.urlCount || 0} URL tạo từ website.`, level: 'low' },
    { id: 'sitemap', text: health?.sitemap.sitemapOk ? 'Sitemap và robots đang đọc được, hôm nay không nên sửa nếu không có lỗi mới.' : 'Sitemap hoặc robots cần kiểm tra trước khi submit Search Console.', level: health?.sitemap.sitemapOk ? 'low' : 'critical' },
    { id: 'products', text: weakProducts ? `Có ${weakProducts} sản phẩm gần đây cần làm dày dữ liệu: ảnh thật, mô tả, thông số hoặc FAQ.` : 'Nhóm sản phẩm mới kiểm tra chưa thấy lỗi dữ liệu lớn.', level: weakProducts ? 'high' : 'low' },
    { id: 'console', text: searchConsoleConnected ? 'Search Console đã sẵn sàng để dùng dữ liệu query/page.' : 'Chưa kết nối Search Console API, nên kiểm tra index và query thủ công.', level: searchConsoleConnected ? 'low' : 'medium' },
    { id: 'stability', text: recentLogs ? 'Có thay đổi SEO gần đây, tránh đổi slug/title liên tục để Google ổn định đánh giá.' : 'Chưa có log SEO mới gần đây, có thể chọn một trang cũ để cập nhật nội dung thật.', level: recentLogs ? 'low' : 'medium' },
  ];
  return brief;
}

export function buildSeoScoreV4({ overview, health, searchConsoleConnected, googleAdsConnected, clusters, keywords }: { overview: SeoOverview | null; health: SeoHealthSnapshot | null; searchConsoleConnected: boolean; googleAdsConnected: boolean; clusters: SeoCluster[]; keywords: SeoKeyword[] }): AiSeoScore {
  const supabaseOk = Boolean(overview);
  const sitemapOk = Boolean(health?.sitemap.sitemapOk);
  const robotsOk = Boolean(health?.sitemap.robotsOk);
  const hasProducts = Boolean((overview?.products || 0) > 0);
  const hasBlogPosts = Boolean((overview?.blogPosts || 0) > 0);
  const canonicalOk = health?.systemHealth.some((item) => item.name.toLowerCase() === 'canonical' && item.status === 'ok') || false;
  const clusterReady = clusters.length > 0;
  const keywordReady = keywords.length > 0;
  const overall = (supabaseOk ? 20 : 0) + (sitemapOk ? 20 : 0) + (robotsOk ? 15 : 0) + (hasProducts ? 15 : 0) + (hasBlogPosts ? 10 : 0) + (searchConsoleConnected ? 10 : 0) + (googleAdsConnected ? 5 : 0) + (canonicalOk ? 5 : 0);

  return {
    technical: clamp(((sitemapOk ? 20 : 0) + (robotsOk ? 15 : 0) + (canonicalOk ? 5 : 0)) / 40 * 100),
    content: clamp(((hasProducts ? 15 : 0) + (hasBlogPosts ? 10 : 0) + (clusterReady ? 5 : 0)) / 30 * 100),
    data: clamp(((supabaseOk ? 60 : 0) + (keywordReady ? 20 : 0) + (clusterReady ? 20 : 0))),
    integration: clamp(((searchConsoleConnected ? 10 : 0) + (googleAdsConnected ? 5 : 0)) / 15 * 100),
    overall,
    details: { supabaseOk, sitemapOk, robotsOk, hasProducts, hasBlogPosts, searchConsoleConnected, googleAdsConnected, canonicalOk },
  };
}

export function AiDailyBriefPanel({ items }: { items: AiDailyBrief[] }) {
  return <ModuleCard title="AI Daily Brief" description="Bản tóm tắt điều hành SEO hôm nay, sinh từ dữ liệu hiện có."><div className={styles.briefList}>{items.map((item) => <div className={`${styles.briefItem} ${styles[item.level]}`} key={item.id}><Badge status={item.level === 'critical' ? 'error' : item.level === 'low' ? 'ok' : 'pending'}>{levelLabel(item.level)}</Badge><span>{item.text}</span></div>)}</div></ModuleCard>;
}

export function KeywordCenter({ keywords, saving, actions }: { keywords: SeoKeyword[]; saving: boolean; actions: V4Actions }) {
  return <ModuleCard title="Keyword Center" description="Theo dõi keyword, cụm SEO, intent, URL mục tiêu, impression và click." action={<button className={styles.secondaryButton} disabled={saving} onClick={() => actions.saveKeyword({ id: newId('kw'), keyword: 'Từ khóa mới', cluster: 'Cụm SEO', target_url: '/', intent: 'commercial', priority: 3, status: 'theo dõi', current_position: null, current_impression: 0, current_click: 0 })}>+ Thêm keyword</button>}>{keywords.length === 0 ? <EmptyState title="Chưa có keyword" detail="Sau khi chạy SQL v4, bạn có thể thêm keyword, cụm và intent tại đây." /> : <div className={styles.tableWrap}><table><thead><tr><th>Keyword</th><th>Cụm</th><th>Target URL</th><th>Intent</th><th>Priority</th><th>Position</th><th>Impression</th><th>Click</th><th>Status</th><th></th></tr></thead><tbody>{keywords.map((item) => <tr key={item.id}><td><input value={item.keyword} onChange={(event) => actions.saveKeyword({ ...item, keyword: event.target.value })} /></td><td><input value={item.cluster || ''} onChange={(event) => actions.saveKeyword({ ...item, cluster: event.target.value })} /></td><td><input value={item.target_url} onChange={(event) => actions.saveKeyword({ ...item, target_url: event.target.value })} /></td><td><input value={item.intent || ''} onChange={(event) => actions.saveKeyword({ ...item, intent: event.target.value })} /></td><td><input type="number" value={item.priority} onChange={(event) => actions.saveKeyword({ ...item, priority: Number(event.target.value) })} /></td><td><input type="number" value={item.current_position || ''} onChange={(event) => actions.saveKeyword({ ...item, current_position: event.target.value ? Number(event.target.value) : null })} /></td><td><input type="number" value={item.current_impression || 0} onChange={(event) => actions.saveKeyword({ ...item, current_impression: Number(event.target.value) })} /></td><td><input type="number" value={item.current_click || 0} onChange={(event) => actions.saveKeyword({ ...item, current_click: Number(event.target.value) })} /></td><td><input value={item.status} onChange={(event) => actions.saveKeyword({ ...item, status: event.target.value })} /></td><td><button className={styles.iconButton} onClick={() => actions.removeKeyword(item.id)}>×</button></td></tr>)}</tbody></table></div>}</ModuleCard>;
}

export function ClusterManager({ clusters, saving, actions }: { clusters: SeoCluster[]; saving: boolean; actions: V4Actions }) {
  return <ModuleCard title="Cluster Manager" description="Quản lý từng cụm SEO: sản phẩm, bài viết, liên kết nội bộ và trạng thái." action={<button className={styles.secondaryButton} disabled={saving} onClick={() => actions.saveCluster({ id: newId('cluster'), name: 'Cụm SEO mới', main_url: '/', priority: 3, status: 'chờ dữ liệu', product_count: 0, post_count: 0, internal_link_count: 0 })}>+ Thêm cụm</button>}>{clusters.length === 0 ? <EmptyState title="Chưa có cụm SEO" detail="Nếu bảng seo_clusters rỗng, dashboard vẫn có cụm mặc định để tham khảo." /> : <div className={styles.clusterCards}>{clusters.map((item) => { const progress = getClusterProgress(item); return <div className={styles.clusterCard} key={item.id}><div><input value={item.name} onChange={(event) => actions.saveCluster({ ...item, name: event.target.value })} /><input value={item.main_url} onChange={(event) => actions.saveCluster({ ...item, main_url: event.target.value })} /></div><div className={styles.metricGridSmall}><MetricCard label="Sản phẩm" value={item.product_count} /><MetricCard label="Bài viết" value={item.post_count} /><MetricCard label="Link nội bộ" value={item.internal_link_count} /><MetricCard label="Điểm cụm" value={`${progress}%`} /></div><div className={styles.inlineEdit}><input type="number" value={item.priority} onChange={(event) => actions.saveCluster({ ...item, priority: Number(event.target.value) })} /><input value={item.status} onChange={(event) => actions.saveCluster({ ...item, status: event.target.value })} /><button className={styles.iconButton} onClick={() => actions.removeCluster(item.id)}>×</button></div><span className={styles.progressTrack}><i style={{ width: `${progress}%` }} /></span></div>; })}</div>}</ModuleCard>;
}

export function ContentOpportunityPanel({ items }: { items: ContentOpportunity[] }) {
  return <ModuleCard title="Content Opportunity AI" description="Gợi ý nội dung nên làm dựa trên cụm, keyword và dữ liệu website.">{items.length === 0 ? <EmptyState title="Chưa có cơ hội nội dung" detail="Khi có thêm cụm SEO/keyword, module sẽ tự sinh đề xuất." /> : <div className={styles.issueList}>{items.map((item) => <div className={`${styles.issueItem} ${styles[item.level]}`} key={item.id}><strong>{item.cluster}</strong><span>{item.suggestion}</span><small>{item.reason}</small></div>)}</div>}</ModuleCard>;
}

export function ProductSeoAiPanel({ items }: { items: ProductSeoItem[] }) {
  const visibleItems = items.filter((item) => item.issues.length > 0).slice(0, 12);
  return <ModuleCard title="Product SEO AI" description="Rà sản phẩm cần bổ sung ảnh, mô tả, thông số hoặc nội dung chi tiết.">{visibleItems.length === 0 ? <EmptyState title="Chưa phát hiện sản phẩm yếu" detail="Nhóm sản phẩm gần đây đã có dữ liệu tương đối ổn." /> : <div className={styles.tableWrap}><table><thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Vấn đề</th><th>Hành động</th></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id}><td><a className={styles.linkInline} href={`/san-pham/${item.slug}`} target="_blank" rel="noreferrer">{item.name}</a></td><td>{item.category || item.parent_slug || '-'}</td><td>{item.issues.join(', ')}</td><td>{item.action}</td></tr>)}</tbody></table></div>}</ModuleCard>;
}

export function InternalLinkAiPanel({ items }: { items: InternalLinkSuggestion[] }) {
  return <ModuleCard title="Internal Link AI" description="Gợi ý anchor và URL nên chèn trong bài viết dựa trên từ khóa xuất hiện trong nội dung.">{items.length === 0 ? <EmptyState title="Chưa có gợi ý link nội bộ" detail="Khi bài viết chứa cụm như ghế chân quỳ, bàn giám đốc, tủ locker... dashboard sẽ gợi ý link." /> : <div className={styles.tableWrap}><table><thead><tr><th>Bài viết</th><th>Từ khóa thấy được</th><th>Anchor gợi ý</th><th>Link tới</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><a className={styles.linkInline} href={item.post_url} target="_blank" rel="noreferrer">{item.post_title}</a></td><td>{item.detected_keyword}</td><td>{item.anchor}</td><td><a className={styles.linkInline} href={item.target_url} target="_blank" rel="noreferrer">{item.target_url}</a></td></tr>)}</tbody></table></div>}</ModuleCard>;
}

export function SeoMemoryTimeline({ logs, saving, actions }: { logs: SeoLog[]; saving: boolean; actions: V4Actions }) {
  return <ModuleCard title="SEO Timeline / AI Memory" description="Lưu trí nhớ SEO: đã làm gì, thuộc cụm nào, liên quan URL nào." action={<button className={styles.secondaryButton} disabled={saving} onClick={() => actions.saveLog({ id: newId('log'), log_date: today(), type: 'ghi chú SEO', title: 'Hành động SEO mới', action: 'Hành động SEO mới', target: 'URL hoặc cụm SEO', description: '' })}>+ Thêm log</button>}>{logs.length === 0 ? <EmptyState title="Chưa có AI Memory" detail="Ghi lại thay đổi quan trọng để tránh sửa lặp hoặc đổi URL quá sớm." /> : <div className={styles.memoryList}>{logs.slice(0, 16).map((item) => <div className={styles.memoryItem} key={item.id}><input type="date" value={item.log_date || today()} onChange={(event) => actions.saveLog({ ...item, log_date: event.target.value })} /><input value={item.type || ''} onChange={(event) => actions.saveLog({ ...item, type: event.target.value })} /><input value={item.title || item.action || ''} onChange={(event) => actions.saveLog({ ...item, title: event.target.value, action: event.target.value })} /><input value={item.related_url || item.target || ''} onChange={(event) => actions.saveLog({ ...item, related_url: event.target.value, target: event.target.value })} /><button className={styles.iconButton} onClick={() => actions.removeLog(item.id)}>×</button></div>)}</div>}</ModuleCard>;
}

export function DoNotTouchPanel({ items, saving, actions }: { items: DoNotTouchItem[]; saving: boolean; actions: V4Actions }) {
  return <ModuleCard title="Do Not Touch List" description="Danh sách URL không nên sửa trong thời gian Google đang đánh giá." action={<button className={styles.secondaryButton} disabled={saving} onClick={() => actions.saveDoNotTouch({ id: newId('freeze'), url: '/', reason: 'URL mới, chờ Google đánh giá', until_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), status: 'đang theo dõi' })}>+ Thêm URL</button>}>{items.length === 0 ? <EmptyState title="Chưa có URL cần giữ nguyên" detail="Nên thêm các URL mới index hoặc mới request indexing để tránh sửa liên tục." /> : <div className={styles.tableWrap}><table><thead><tr><th>URL</th><th>Lý do</th><th>Giữ đến ngày</th><th>Status</th><th></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><input value={item.url} onChange={(event) => actions.saveDoNotTouch({ ...item, url: event.target.value })} /></td><td><input value={item.reason} onChange={(event) => actions.saveDoNotTouch({ ...item, reason: event.target.value })} /></td><td><input type="date" value={item.until_date} onChange={(event) => actions.saveDoNotTouch({ ...item, until_date: event.target.value })} /></td><td><input value={item.status} onChange={(event) => actions.saveDoNotTouch({ ...item, status: event.target.value })} /></td><td><button className={styles.iconButton} onClick={() => actions.removeDoNotTouch(item.id)}>×</button></td></tr>)}</tbody></table></div>}</ModuleCard>;
}

export function CompetitorWatchPanel({ items, saving, actions }: { items: SeoCompetitor[]; saving: boolean; actions: V4Actions }) {
  return <ModuleCard title="Competitor Watch" description="Theo dõi đối thủ, domain, ghi chú và mức ưu tiên." action={<button className={styles.secondaryButton} disabled={saving} onClick={() => actions.saveCompetitor({ id: newId('competitor'), name: 'Đối thủ mới', domain: '', priority: 3 })}>+ Thêm đối thủ</button>}>{items.length === 0 ? <EmptyState title="Chưa có đối thủ" detail="Ví dụ: noithatquocdai.vn, noithatnavi.com hoặc đối thủ bạn đang theo dõi." /> : <div className={styles.tableWrap}><table><thead><tr><th>Tên</th><th>Domain</th><th>Priority</th><th>Ghi chú</th><th></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><input value={item.name} onChange={(event) => actions.saveCompetitor({ ...item, name: event.target.value })} /></td><td><input value={item.domain} onChange={(event) => actions.saveCompetitor({ ...item, domain: event.target.value })} /></td><td><input type="number" value={item.priority} onChange={(event) => actions.saveCompetitor({ ...item, priority: Number(event.target.value) })} /></td><td><input value={item.note || ''} onChange={(event) => actions.saveCompetitor({ ...item, note: event.target.value })} /></td><td><button className={styles.iconButton} onClick={() => actions.removeCompetitor(item.id)}>×</button></td></tr>)}</tbody></table></div>}</ModuleCard>;
}

export function QuickActionPanelV4() {
  const actions = [
    { label: 'Mở trang chủ', href: '/' },
    { label: 'Mở Sitemap', href: '/sitemap.xml' },
    { label: 'Mở Robots', href: '/robots.txt' },
    { label: 'Mở Search Console', href: 'https://search.google.com/search-console' },
    { label: 'Mở Google Ads', href: 'https://ads.google.com' },
    { label: 'Mở Supabase', href: supabaseDashboardUrl() },
    { label: 'Ghế chân quỳ', href: '/ghe-chan-quy' },
    { label: 'Bàn giám đốc', href: '/ban-giam-doc' },
    { label: 'Giường tầng sắt', href: '/giuong-tang-sat' },
    { label: 'Tin tức', href: '/tin-tuc' },
    { label: 'Thêm sản phẩm', href: '/admin' },
    { label: 'Thêm bài viết', href: '/admin' },
  ];
  return <ModuleCard title="Quick Action v4" description="Đường tắt thao tác SEO và kiểm tra hệ thống."><div className={styles.quickGrid}>{actions.map((item) => <a className={styles.quickButton} href={item.href} target="_blank" rel="noreferrer" key={item.label}>{item.label}</a>)}</div></ModuleCard>;
}

export function Roadmap30DaysPanel({ weeks }: { weeks: RoadmapWeek[] }) {
  return <ModuleCard title="Roadmap 30 ngày" description="Lộ trình SEO thực dụng, ưu tiên dữ liệu thật và không sửa URL quá thường xuyên."><div className={styles.roadmapGrid}>{weeks.map((week) => <div className={styles.roadmapCard} key={week.week}><strong>{week.week}</strong><span>{week.focus}</span><ul>{week.tasks.map((task) => <li key={task}>{task}</li>)}</ul></div>)}</div></ModuleCard>;
}

export function AiSeoScorePanelV4({ score }: { score: AiSeoScore }) {
  const rows = [['Technical SEO', score.technical], ['Content', score.content], ['Data', score.data], ['Integration', score.integration]] as const;
  return <ModuleCard title="AI SEO Score v4" description="Điểm tự chấm theo dữ liệu thật. API chưa kết nối là pending, không xem là lỗi nặng."><div className={styles.scoreHero}><strong>{score.overall}/100</strong><span>Overall Score</span></div><div className={styles.scoreList}>{rows.map(([label, value]) => <div className={styles.scoreItem} key={label}><span>{label}</span><b>{value}</b><i><em style={{ width: `${value}%` }} /></i></div>)}</div><div className={styles.scoreStatus}><Badge status={score.details.sitemapOk ? 'ok' : 'warning'}>Sitemap {score.details.sitemapOk ? 'OK' : 'cần kiểm tra'}</Badge><Badge status={score.details.robotsOk ? 'ok' : 'warning'}>Robots {score.details.robotsOk ? 'OK' : 'cần kiểm tra'}</Badge><Badge status={score.details.searchConsoleConnected ? 'connected' : 'pending'}>Search Console {score.details.searchConsoleConnected ? 'đã kết nối' : 'pending'}</Badge><Badge status={score.details.googleAdsConnected ? 'connected' : 'pending'}>Google Ads {score.details.googleAdsConnected ? 'đã kết nối' : 'pending'}</Badge></div></ModuleCard>;
}

export function GoalOverviewV4({ goals, overview }: { goals: SeoGoal[]; overview: SeoOverview | null }) {
  const virtualGoals = goals.length ? goals : [
    { id: 'goal-url', title: '500 URL tạo từ website', target_value: 500, current_value: overview?.generatedUrls || 0, unit: 'URL' },
    { id: 'goal-blog', title: '100 bài viết', target_value: 100, current_value: overview?.blogPosts || 0, unit: 'bài' },
    { id: 'goal-product', title: '350 sản phẩm', target_value: 350, current_value: overview?.products || 0, unit: 'sản phẩm' },
  ];
  return <ModuleCard title="Goal v4" description="Theo dõi mục tiêu lớn của dự án SEO."><div className={styles.goalList}>{virtualGoals.map((goal) => { const percent = clamp((goal.current_value / Math.max(1, goal.target_value)) * 100); return <div className={styles.goalItem} key={goal.id}><strong>{goal.title}</strong><span>{formatNumber(goal.current_value)} / {formatNumber(goal.target_value)} {goal.unit || ''}</span><b>{percent}%</b><i /><span><i style={{ width: `${percent}%` }} /></span></div>; })}</div></ModuleCard>;
}
