'use client';

import { useMemo, useState } from 'react';
import EditablePriorityList from './EditablePriorityList';
import SeoNotesPanel from './SeoNotesPanel';
import TodayTaskList from './TodayTaskList';
import { Badge, EmptyState, MetricCard, MiniBarChart, ModuleCard, SkeletonGrid } from './Ui';
import { AiInsightPanel, LocalSeoPanel, SeoCommandCenter, TodaySummaryPanel, buildAiInsights, buildSeoCommands, buildTodaySummary } from './SeoV3Modules';
import {
  AiDailyBriefPanelV41,
  AiSeoScorePanelV41,
  ClusterManager,
  CompetitorWatchPanel,
  ContentOpportunityPanel,
  DoNotTouchPanelV41,
  GoalOverviewV4,
  InternalLinkAiPanel,
  KeywordCenter,
  ProductSeoAiPanel,
  QuickActionPanelV41,
  Roadmap30DaysPanel,
  SeoMemoryTimeline,
  buildAiDailyBrief,
  MonthlyGoalProgressPanel,
  buildSeoScoreV41,
} from './SeoV4Modules';
import { buildContentOpportunities, getRoadmap30Days } from '../services/seoDashboardService';
import { DashboardAnalytics, DailySeoMission, ClusterHealth, ContentPlanner, InternalLinkAIV5, KeywordIntelligence, ProductQualityAIV5, SearchConsoleCenter, SeoV51FilterBar, type DashboardSeoFilters } from './SeoV5Modules';
import { AiBlogRanking, AiDecisionEngine, AiProductRanking, AiProgressEngine, AiRecommendationHistory, AutoInsightPanel, OpportunityScorePanel, SeoHealthRadar, SmartNotificationCenter, buildV6Analysis } from './SeoV6Modules';
import { useSeoDashboard } from '../hooks/useSeoDashboard';
import styles from '../seo-dashboard.module.css';

function formatNumber(value: number) { return new Intl.NumberFormat('vi-VN').format(value || 0); }
function isConnected(status?: string) { return status === 'connected'; }
function dashboardKey(table: string, item: unknown, index: number) { const row = item as Record<string, unknown>; return table + '-' + String(row.id ?? row.name ?? row.url ?? row.keyword ?? 'no-id') + '-' + String(row.url ?? row.keyword ?? row.name ?? 'no-slug') + '-' + index; }
function norm(value: unknown) { return String(value || '').toLowerCase().trim(); }
function matchesSearch(search: string, ...values: unknown[]) { const needle = norm(search); if (!needle) return true; return values.some((value) => norm(value).includes(needle)); }

const defaultFilters: DashboardSeoFilters = { search: '', priority: 'all', status: 'all', pendingOnly: false, productIssuesOnly: false };

export default function SeoDashboard() {
  const { dashboard, loading, saving, error, actions } = useSeoDashboard();
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState<DashboardSeoFilters>(defaultFilters);

  const filteredKeywords = useMemo(() => dashboard.seoKeywords.filter((item) => {
    if (!matchesSearch(filters.search, item.keyword, item.cluster, item.target_url, item.status, item.intent)) return false;
    if (filters.priority !== 'all' && String(item.priority) !== filters.priority) return false;
    if (filters.status !== 'all' && !norm(item.status).includes(norm(filters.status))) return false;
    return true;
  }), [dashboard.seoKeywords, filters]);

  const filteredClusters = useMemo(() => dashboard.seoClusters.filter((item) => {
    if (!matchesSearch(filters.search, item.name, item.main_url, item.status, item.note)) return false;
    if (filters.priority !== 'all' && String(item.priority) !== filters.priority) return false;
    if (filters.status !== 'all' && !norm(item.status).includes(norm(filters.status))) return false;
    return true;
  }), [dashboard.seoClusters, filters]);

  const filteredTasks = useMemo(() => dashboard.tasks.filter((item) => {
    if (!matchesSearch(filters.search, item.title, item.status, item.cluster)) return false;
    if (filters.pendingOnly && item.completed) return false;
    return true;
  }), [dashboard.tasks, filters]);

  const filteredProducts = useMemo(() => dashboard.productSeoItems.filter((item) => {
    if (!matchesSearch(filters.search, item.name, item.slug, item.category, item.parent_slug, item.issues.join(' '))) return false;
    if (filters.productIssuesOnly && item.issues.length === 0) return false;
    return true;
  }), [dashboard.productSeoItems, filters]);

  const overview = dashboard.overview;
  const searchConsole = dashboard.searchConsole;
  const health = dashboard.health;
  const searchConsoleConnected = isConnected(searchConsole?.status);
  const googleAdsConnected = dashboard.adsKeywords.some((item) => isConnected(item.status));
  const commands = useMemo(() => buildSeoCommands({ overview, tasks: dashboard.tasks, health, keywords: dashboard.seoKeywords, searchConsoleConnected }), [dashboard.seoKeywords, dashboard.tasks, health, overview, searchConsoleConnected]);
  const insights = useMemo(() => buildAiInsights({ overview, health, tasks: dashboard.tasks, logs: dashboard.seoLogs, searchConsoleConnected }), [dashboard.seoLogs, dashboard.tasks, health, overview, searchConsoleConnected]);
  const summary = useMemo(() => buildTodaySummary({ overview, health, logs: dashboard.seoLogs }), [dashboard.seoLogs, health, overview]);
  const dailyBrief = useMemo(() => buildAiDailyBrief({ overview, health, productSeoItems: dashboard.productSeoItems, logs: dashboard.seoLogs, searchConsoleConnected }), [dashboard.productSeoItems, dashboard.seoLogs, health, overview, searchConsoleConnected]);
  const score = useMemo(() => buildSeoScoreV41({ overview, health, searchConsoleConnected, clusters: dashboard.seoClusters, keywords: dashboard.seoKeywords, productSeoItems: dashboard.productSeoItems }), [dashboard.productSeoItems, dashboard.seoClusters, dashboard.seoKeywords, health, overview, searchConsoleConnected]);
  const opportunities = useMemo(() => buildContentOpportunities(filteredClusters, filteredKeywords, overview), [filteredClusters, filteredKeywords, overview]);
  const roadmap = useMemo(() => getRoadmap30Days(), []);
  const lastUpdated = useMemo(() => new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }), []);
  const v6Analysis = useMemo(() => buildV6Analysis({ overview, health, products: dashboard.productSeoItems, blogs: dashboard.blogSeoItems, keywords: dashboard.seoKeywords, clusters: dashboard.seoClusters, tasks: dashboard.tasks, logs: dashboard.seoLogs, doNotTouch: dashboard.doNotTouch, searchConsole: dashboard.searchConsoleV5 }), [dashboard.blogSeoItems, dashboard.doNotTouch, dashboard.productSeoItems, dashboard.searchConsoleV5, dashboard.seoClusters, dashboard.seoKeywords, dashboard.seoLogs, dashboard.tasks, health, overview]);

  if (loading) return <main className={styles.dashboard}><header className={styles.hero}><h1>SEO Dashboard</h1><p>Đang tải dữ liệu SEO...</p></header><SkeletonGrid /></main>;

  return <main className={`${styles.dashboard} ${darkMode ? styles.dark : ''}`}>
    <header className={styles.hero}><div><p className={styles.eyebrow}>Nội Thất Hùng Ngọc</p><h1>SEO Dashboard v6.0</h1><p>AI SEO Operating System dùng dữ liệu thật từ Supabase khi có thể, fallback rõ ràng khi chưa có API ngoài.</p></div><div className={styles.heroActions}><button className={styles.secondaryButton} onClick={() => setDarkMode((value) => !value)}>{darkMode ? 'Light Mode' : 'Dark Mode'}</button><button className={styles.primaryButton} onClick={actions.reload}>Làm mới</button></div></header>
    {error ? <div className={styles.alert}>{error}</div> : null}

    <AiDailyBriefPanelV41 items={dailyBrief} lastUpdated={lastUpdated} />
    <SeoCommandCenter commands={commands} />

    <section className={styles.metricGrid}><MetricCard label="Tổng sản phẩm" value={formatNumber(overview?.products || 0)} /><MetricCard label="Tổng bài viết" value={formatNumber(overview?.blogPosts || 0)} /><MetricCard label="Tổng danh mục" value={formatNumber(overview?.categories || 0)} hint={overview?.categorySource === 'supabase' ? 'Lấy từ Supabase' : 'Fallback từ menu'} /><MetricCard label="URL tạo từ website" value={formatNumber(overview?.generatedUrls || 0)} hint={`${overview?.activeCategoryUrls || 0} danh mục có sản phẩm, ${overview?.staticUrls || 0} trang tĩnh`} /></section>

    <SeoV51FilterBar filters={filters} onChange={setFilters} />

    <section className={styles.gridTwo}><AiDecisionEngine decisions={v6Analysis.decisions} /><SmartNotificationCenter items={v6Analysis.notifications} /></section>
    <section className={styles.gridTwo}><SeoHealthRadar points={v6Analysis.radar} /><AutoInsightPanel insights={v6Analysis.insights} /></section>
    <section className={styles.gridTwo}><OpportunityScorePanel items={v6Analysis.opportunities} /><AiProgressEngine analysis={v6Analysis} /></section>
    <section className={styles.gridTwo}><AiProductRanking products={v6Analysis.productRanking} /><AiBlogRanking blogs={v6Analysis.blogRanking} /></section>
    <AiRecommendationHistory decisions={v6Analysis.decisions} />

    <section className={styles.gridTwo}><SearchConsoleCenter data={dashboard.searchConsoleV5} /><DashboardAnalytics overview={overview} health={health} clusters={dashboard.seoClusters} keywords={dashboard.seoKeywords} tasks={dashboard.tasks} logs={dashboard.seoLogs} doNotTouch={dashboard.doNotTouch} /></section>
    <section className={styles.gridTwo}><KeywordIntelligence keywords={filteredKeywords} /><ClusterHealth clusters={filteredClusters} /></section>
    <section className={styles.gridTwo}><ContentPlanner opportunities={opportunities} keywords={filteredKeywords} /><DailySeoMission overview={overview} health={health} opportunities={opportunities} tasks={dashboard.tasks} products={dashboard.productSeoItems} keywords={dashboard.seoKeywords} clusters={dashboard.seoClusters} logs={dashboard.seoLogs} doNotTouch={dashboard.doNotTouch} /></section>
    <section className={styles.gridTwo}><InternalLinkAIV5 suggestions={dashboard.internalLinkSuggestions} clusters={filteredClusters} products={filteredProducts} /><ProductQualityAIV5 products={filteredProducts} /></section>

    <section className={styles.gridTwo}><KeywordCenter keywords={dashboard.seoKeywords} saving={saving} actions={actions} /><AiSeoScorePanelV41 score={score} /></section>
    <section className={styles.gridTwo}><ClusterManager clusters={dashboard.seoClusters} saving={saving} actions={actions} /><ContentOpportunityPanel items={opportunities} /></section>
    <section className={styles.gridTwo}><ProductSeoAiPanel items={dashboard.productSeoItems} /><InternalLinkAiPanel items={dashboard.internalLinkSuggestions} /></section>
    <section className={styles.gridTwo}><SeoMemoryTimeline logs={dashboard.seoLogs} saving={saving} actions={actions} /><Roadmap30DaysPanel weeks={roadmap} /></section>
    <section className={styles.gridTwo}><DoNotTouchPanelV41 items={dashboard.doNotTouch} saving={saving} actions={actions} /><CompetitorWatchPanel items={dashboard.seoCompetitors} saving={saving} actions={actions} /></section>
    <section className={styles.gridThree}><AiInsightPanel insights={insights} /><GoalOverviewV4 goals={dashboard.seoGoals} overview={overview} /><TodaySummaryPanel summary={summary} /></section>
    <section className={styles.gridTwo}><MonthlyGoalProgressPanel overview={overview} logs={dashboard.seoLogs} /><QuickActionPanelV41 /></section>
    <section className={styles.gridTwo}><LocalSeoPanel items={dashboard.localSeo} saving={saving} actions={actions} /></section>

    <section className={styles.gridThree}><ModuleCard title="SEO Priority" description="Danh sách ưu tiên theo sao, lưu trong Supabase."><EditablePriorityList priorities={dashboard.priorities} saving={saving} onSave={actions.savePriority} onDelete={actions.removePriority} /></ModuleCard><ModuleCard title="Today Task" description="Checklist SEO hằng ngày."><TodayTaskList tasks={filteredTasks} suggestions={commands} saving={saving} onSave={actions.saveTask} onDelete={actions.removeTask} /></ModuleCard><ModuleCard title="SEO Note" description="Ghi chú nhanh cho kế hoạch SEO."><SeoNotesPanel note={dashboard.note} saving={saving} onSave={actions.saveNote} /></ModuleCard></section>

    <section className={styles.gridTwo}>
      <ModuleCard title="Search Console" description="Kiến trúc đã sẵn sàng để gắn Google Search Console API." action={<Badge status={searchConsole?.status || 'pending'}>{searchConsole?.message || 'Chưa kết nối Search Console'}</Badge>}><div className={styles.metricGridSmall}><MetricCard label="Impression" value={formatNumber(searchConsole?.impressions || 0)} /><MetricCard label="Click" value={formatNumber(searchConsole?.clicks || 0)} /><MetricCard label="CTR" value={`${searchConsole?.ctr || 0}%`} /><MetricCard label="Average Position" value={searchConsole?.averagePosition || 0} /></div><div className={styles.chartTabs}><MiniBarChart data={searchConsole?.chart7Days || []} label="Biểu đồ 7 ngày" /><MiniBarChart data={searchConsole?.chart28Days || []} label="Biểu đồ 28 ngày" /></div><div className={styles.keywordGrid}><EmptyState title="Top Query" detail="Sẽ hiển thị sau khi kết nối API" /><EmptyState title="Top Page" detail="Sẽ hiển thị sau khi kết nối API" /><EmptyState title="Top Country" detail="Sẽ hiển thị sau khi kết nối API" /><EmptyState title="Top Device" detail="Sẽ hiển thị sau khi kết nối API" /></div></ModuleCard>
      <ModuleCard title="Google Ads" description="Chuẩn bị sẵn cho Keyword Planner / Google Ads API." action={<Badge status={googleAdsConnected ? 'connected' : 'disconnected'}>{dashboard.adsMessage}</Badge>}>{dashboard.adsKeywords.length === 0 ? <EmptyState title="Chưa kết nối Google Ads" detail="Sau này có API sẽ hiện Keyword, Competition, Monthly Search và Status." /> : null}<div className={styles.tableWrap}><table><thead><tr><th>Keyword</th><th>Competition</th><th>Monthly Search</th><th>Status</th></tr></thead><tbody>{dashboard.adsKeywords.map((item, index) => <tr key={dashboardKey('ads', item, index)}><td>{item.keyword}</td><td>{item.competition}</td><td>{item.monthlySearch}</td><td>{item.status}</td></tr>)}</tbody></table></div></ModuleCard>
    </section>

    <section className={styles.gridTwo}>
      <ModuleCard title="404" description="Đọc public/404-log.json hoặc public/redirects.json nếu có.">{health?.brokenUrls.length ? <div className={styles.tableWrap}><table><thead><tr><th>URL lỗi</th><th>Redirect</th><th>Trạng thái</th></tr></thead><tbody>{health.brokenUrls.map((item, index) => <tr key={dashboardKey('broken-url', item, index)}><td>{item.url}</td><td>{item.redirectTo || '-'}</td><td><Badge status={item.status === 'new' ? 'warning' : 'ok'}>{item.status}</Badge></td></tr>)}</tbody></table></div> : <EmptyState title="Chưa có log 404 mới" detail="Khi có file log hoặc redirect, dashboard sẽ tự hiển thị." />}</ModuleCard>
      <ModuleCard title="Sitemap" description="Kiểm tra sitemap.xml và robots.txt."><div className={styles.metricGridSmall}><MetricCard label="URL trong sitemap" value={formatNumber(health?.sitemap.urlCount || 0)} /><MetricCard label="Last Generated" value={health?.sitemap.lastGenerated || 'Chưa rõ'} /><MetricCard label="Robots" value={health?.sitemap.robotsOk ? 'OK' : 'Cần kiểm tra'} /><MetricCard label="Sitemap" value={health?.sitemap.sitemapOk ? 'OK' : 'Cần kiểm tra'} /></div><a className={styles.link} href="/sitemap.xml" target="_blank" rel="noreferrer">Mở sitemap.xml</a></ModuleCard>
    </section>

    <section className={styles.gridTwo}>
      <ModuleCard title="Index Status" description="URL đã index: Chưa kết nối Search Console. Module này sẵn sàng nhận dữ liệu khi có API."><div className={styles.metricGridSmall}><MetricCard label="URL tạo từ website" value={formatNumber(overview?.generatedUrls || 0)} /><MetricCard label="URL đã index" value="Chưa kết nối Search Console" /></div>{dashboard.indexStatus.length === 0 ? <EmptyState title="Chưa có dữ liệu index" detail="Không dùng nhãn đã index khi chưa có Search Console API." /> : <div className={styles.tableWrap}><table><thead><tr><th>URL mới</th><th>Ngày tạo</th><th>Đã gửi index</th><th>Đã index</th></tr></thead><tbody>{dashboard.indexStatus.map((item, index) => <tr key={dashboardKey('index-status', item, index)}><td>{item.url}</td><td>{new Date(item.created_at).toLocaleDateString('vi-VN')}</td><td>{item.submitted ? 'Có' : 'Chưa'}</td><td>{item.indexed ? 'Có' : 'Chưa'}</td></tr>)}</tbody></table></div>}</ModuleCard>
      <ModuleCard title="System Health" description="Theo dõi những điểm quan trọng của hệ thống SEO."><div className={styles.healthList}>{health?.systemHealth.map((item, index) => <div className={styles.healthItem} key={dashboardKey('system-health', item, index)}><div><strong>{item.name}</strong><span>{item.detail}</span></div><Badge status={item.status}>{item.status}</Badge></div>)}</div></ModuleCard>
    </section>
  </main>;
}

