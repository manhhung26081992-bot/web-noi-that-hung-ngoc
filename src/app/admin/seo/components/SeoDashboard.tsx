'use client';

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Badge, MetricCard, ModuleCard, SkeletonGrid } from './Ui';
import { buildAiInsights, buildSeoCommands, buildTodaySummary } from './SeoV3Modules';
import { buildAiDailyBrief, buildSeoScoreV41 } from './SeoV4Modules';
import { buildContentOpportunities, getRoadmap30Days } from '../services/seoDashboardService';
import { buildProfessionalSeoPlan, type ProfessionalSeoTask } from '../services/seoProfessionalPlanService';
import { SeoV51FilterBar, type DashboardSeoFilters } from './SeoV5Modules';
import { AiBlogRanking, AiProductRanking, AiProgressEngine, AiRecommendationHistory, OpportunityScorePanel, SeoHealthRadar, TodaySeoFocusV61, buildV6Analysis } from './SeoV6Modules';
import SeoV9Modules from './SeoV9Modules';
import { useSeoDashboard } from '../hooks/useSeoDashboard';
import styles from '../seo-dashboard.module.css';
import { SEO_DASHBOARD_RESTORED_EVENT } from '../lib/seoDashboardSupabaseSync';
import { loadSeoWorkLogs } from '../lib/seoWorkLogStorage';
import type { AiSeoDailyPlan, AiSeoDailyTask, GoogleAdsImportData, IndexSummaryManual, SearchConsoleManualSummary, SearchConsoleV7Data } from '../types/seo';
import type { SeoWorkLogItem } from '../types/seoV11';

const SeoDashboardLowerModules = lazy(() => import('./SeoDashboardLowerModules'));
const SearchConsoleV7Center = lazy(() => import('./SearchConsoleV7Center'));
const GoogleAdsV8ImportCenter = lazy(() => import('./GoogleAdsV8ImportCenter'));
const SeoV10Workbench = lazy(() => import('./SeoV10Workbench'));
const SeoWorkLogV11 = lazy(() => import('./SeoWorkLogV11'));
const SeoNextActionsV11 = lazy(() => import('./SeoNextActionsV11'));
const GSC_MANUAL_SUMMARY_KEY = 'noithathungngoc-gsc-manual-summary-v11';

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value || 0);
}

function formatDateTime(date: Date) {
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function norm(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesSearch(search: string, ...values: unknown[]) {
  const needle = norm(search);
  if (!needle) return true;
  return norm(values.filter(Boolean).join(' ')).includes(needle);
}

function formatOptionalDate(value?: string | null) {
  if (!value) return 'Chưa có dữ liệu';
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return value;
  return formatDateTime(new Date(time));
}

function copyTaskText(task: ProfessionalSeoTask) {
  navigator.clipboard?.writeText(task.copyText);
}

function copyDailyTaskText(task: AiSeoDailyTask) {
  navigator.clipboard?.writeText(task.copyPrompt);
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function normalizeAiDailyPlanPayload(value: unknown): AiSeoDailyPlan | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const plan = value as Partial<AiSeoDailyPlan> & Record<string, unknown>;
  const dataFreshness = plan.dataFreshness && typeof plan.dataFreshness === 'object' && !Array.isArray(plan.dataFreshness)
    ? plan.dataFreshness as AiSeoDailyPlan['dataFreshness']
    : { status: 'missing' as const, newestUpdatedAt: null, staleSources: [], missingSources: [] };
  const seoHealthSummary = plan.seoHealthSummary && typeof plan.seoHealthSummary === 'object' && !Array.isArray(plan.seoHealthSummary)
    ? plan.seoHealthSummary as AiSeoDailyPlan['seoHealthSummary']
    : { overviewSource: 'none', clicks: null, impressions: null, ctr: null, position: null, summary: 'Chưa có AI Daily plan hợp lệ.', alerts: [] };
  const workLogSummary = plan.workLogSummary && typeof plan.workLogSummary === 'object' && !Array.isArray(plan.workLogSummary)
    ? plan.workLogSummary as AiSeoDailyPlan['workLogSummary']
    : { total: 0, watching: 0, needFix: 0, dueToday: 0, overdue: 0 };
  return {
    ...plan,
    date: String(plan.date || new Date().toISOString().slice(0, 10)),
    generatedAt: String(plan.generatedAt || ''),
    source: plan.source === 'manual-run' ? 'manual-run' : 'auto-daily',
    dataSources: safeArray<AiSeoDailyPlan['dataSources'][number]>(plan.dataSources),
    dataFreshness: {
      ...dataFreshness,
      staleSources: safeArray<string>(dataFreshness.staleSources),
      missingSources: safeArray<string>(dataFreshness.missingSources),
    },
    seoHealthSummary: {
      ...seoHealthSummary,
      alerts: safeArray<string>(seoHealthSummary.alerts),
    },
    todayTasks: safeArray<AiSeoDailyPlan['todayTasks'][number]>(plan.todayTasks),
    next7DaysTasks: safeArray<AiSeoDailyPlan['next7DaysTasks'][number]>(plan.next7DaysTasks),
    watchOpportunities: safeArray<AiSeoDailyPlan['watchOpportunities'][number]>(plan.watchOpportunities),
    internalLinkSuggestions: safeArray<AiSeoDailyPlan['internalLinkSuggestions'][number]>(plan.internalLinkSuggestions),
    cannibalizationWarnings: safeArray<AiSeoDailyPlan['cannibalizationWarnings'][number]>(plan.cannibalizationWarnings),
    contentTasks: safeArray<AiSeoDailyPlan['contentTasks'][number]>(plan.contentTasks),
    productOptimizationTasks: safeArray<AiSeoDailyPlan['productOptimizationTasks'][number]>(plan.productOptimizationTasks),
    indexCheckTasks: safeArray<AiSeoDailyPlan['indexCheckTasks'][number]>(plan.indexCheckTasks),
    notes: safeArray<string>(plan.notes),
    queryPageRanges: safeArray<NonNullable<AiSeoDailyPlan['queryPageRanges']>[number]>(plan.queryPageRanges),
    gscUpdateHistory: safeArray<NonNullable<AiSeoDailyPlan['gscUpdateHistory']>[number]>(plan.gscUpdateHistory),
    manualGscSummary: plan.manualGscSummary || null,
    googleAdsSummary: plan.googleAdsSummary || null,
    workLogSummary,
  } as AiSeoDailyPlan;
}

function dailySourceRows(plan: AiSeoDailyPlan | null) {
  return Array.isArray(plan?.dataSources) ? plan.dataSources : [];
}

const defaultFilters: DashboardSeoFilters = {
  search: '',
  priority: 'all',
  status: 'all',
  pendingOnly: false,
  productIssuesOnly: false,
};

export default function SeoDashboard() {
  const { dashboard, loading, saving, error, actions } = useSeoDashboard();
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState<DashboardSeoFilters>(defaultFilters);
  const [searchConsoleV7, setSearchConsoleV7] = useState<SearchConsoleV7Data | null>(null);
  const [googleAdsV8, setGoogleAdsV8] = useState<GoogleAdsImportData | null>(null);
  const [gscManualSummary, setGscManualSummary] = useState<SearchConsoleManualSummary | null>(null);
  const [indexSummary, setIndexSummary] = useState<IndexSummaryManual | null>(null);
  const [seoWorkLogsV11, setSeoWorkLogsV11] = useState<SeoWorkLogItem[]>([]);
  const [workbenchEnabled, setWorkbenchEnabled] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => formatDateTime(new Date()));
  const [restoreVersion, setRestoreVersion] = useState(0);
  const [dailyAiPlan, setDailyAiPlan] = useState<AiSeoDailyPlan | null>(null);
  const [dailyAiLoading, setDailyAiLoading] = useState(false);
  const [dailyAiMessage, setDailyAiMessage] = useState('');

  useEffect(() => {
    const handleRestore = () => {
      setRestoreVersion((value) => value + 1);
      setSeoWorkLogsV11(loadSeoWorkLogs());
      try {
        const savedManual = localStorage.getItem(GSC_MANUAL_SUMMARY_KEY);
        setGscManualSummary(savedManual ? JSON.parse(savedManual) as SearchConsoleManualSummary : null);
      } catch {
        setGscManualSummary(null);
      }
    };

    window.addEventListener(SEO_DASHBOARD_RESTORED_EVENT, handleRestore);
    return () => window.removeEventListener(SEO_DASHBOARD_RESTORED_EVENT, handleRestore);
  }, []);

  useEffect(() => {
    loadDailyAiPlan();
    setSeoWorkLogsV11(loadSeoWorkLogs());
    try {
      const savedManual = localStorage.getItem(GSC_MANUAL_SUMMARY_KEY);
      setGscManualSummary(savedManual ? JSON.parse(savedManual) as SearchConsoleManualSummary : null);
    } catch {
      setGscManualSummary(null);
    }
  }, []);

  function openWorkbench() {
    setAdvancedOpen(true);
    setWorkbenchEnabled(true);
    window.setTimeout(() => {
      document.getElementById('seo-workbench')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function openAdvancedSection(sectionId: string) {
    setAdvancedOpen(true);
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  async function reloadDashboard() {
    await actions.reload();
    setLastUpdated(formatDateTime(new Date()));
  }

  async function loadDailyAiPlan() {
    try {
      const response = await fetch('/api/admin/seo-daily/run', { headers: { Accept: 'application/json' } });
      const body = await response.json().catch(() => ({})) as { ok?: boolean; plan?: AiSeoDailyPlan; message?: string; error?: string };
      if (response.ok && body.plan) setDailyAiPlan(body.plan);
      if (!response.ok && response.status !== 401) setDailyAiMessage(body.message || body.error || 'Chưa đọc được AI SEO Daily đã lưu.');
    } catch {
      setDailyAiMessage('Chưa đọc được AI SEO Daily đã lưu.');
    }
  }

  async function runDailyAiPlan() {
    setDailyAiLoading(true);
    setDailyAiMessage('');
    try {
      const response = await fetch('/api/admin/seo-daily/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ range: '28d', rowLimit: 10000, maxPages: 2 }),
      });
      const body = await response.json().catch(() => ({})) as { ok?: boolean; plan?: AiSeoDailyPlan; message?: string; error?: string; warnings?: string[] };
      if (!response.ok || !body.plan) throw new Error(body.message || body.error || 'Không chạy được AI SEO hôm nay.');
      setDailyAiPlan(body.plan);
      setDailyAiMessage((body.message || 'Đã chạy AI SEO hôm nay.') + (body.warnings?.length ? ' ' + body.warnings.join(' ') : ''));
    } catch (err) {
      setDailyAiMessage(err instanceof Error ? err.message : 'Không chạy được AI SEO hôm nay.');
    } finally {
      setDailyAiLoading(false);
    }
  }

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
    if (!matchesSearch(filters.search, item.name, item.slug, item.category, item.parent_slug, item.action, item.issues.join(' '))) return false;
    if (filters.productIssuesOnly && item.issues.length === 0) return false;
    return true;
  }), [dashboard.productSeoItems, filters]);

  const filteredBlogs = useMemo(() => dashboard.blogSeoItems.filter((item) => {
    if (!matchesSearch(filters.search, item.title, item.slug, item.excerpt, item.action, item.issues.join(' '))) return false;
    return true;
  }), [dashboard.blogSeoItems, filters]);

  const overview = dashboard.overview;
  const health = dashboard.health;
  const searchConsoleConnected = Boolean(searchConsoleV7?.overview.connected || searchConsoleV7?.overview.impressions);

  const commands = useMemo(() => buildSeoCommands({
    overview,
    tasks: dashboard.tasks,
    health,
    keywords: dashboard.seoKeywords,
    searchConsoleConnected,
  }), [dashboard.seoKeywords, dashboard.tasks, health, overview, searchConsoleConnected]);

  const insights = useMemo(() => buildAiInsights({
    overview,
    health,
    tasks: dashboard.tasks,
    logs: dashboard.seoLogs,
    searchConsoleConnected,
  }), [dashboard.seoLogs, dashboard.tasks, health, overview, searchConsoleConnected]);

  const summary = useMemo(() => buildTodaySummary({
    overview,
    health,
    logs: dashboard.seoLogs,
  }), [dashboard.seoLogs, health, overview]);

  const dailyBrief = useMemo(() => buildAiDailyBrief({
    overview,
    health,
    productSeoItems: dashboard.productSeoItems,
    logs: dashboard.seoLogs,
    searchConsoleConnected,
  }), [dashboard.productSeoItems, dashboard.seoLogs, health, overview, searchConsoleConnected]);

  const score = useMemo(() => buildSeoScoreV41({
    overview,
    health,
    searchConsoleConnected,
    clusters: dashboard.seoClusters,
    keywords: dashboard.seoKeywords,
    productSeoItems: dashboard.productSeoItems,
  }), [dashboard.productSeoItems, dashboard.seoClusters, dashboard.seoKeywords, health, overview, searchConsoleConnected]);

  const opportunities = useMemo(() => buildContentOpportunities(filteredClusters, filteredKeywords, overview), [filteredClusters, filteredKeywords, overview]);
  const roadmap = useMemo(() => getRoadmap30Days(), []);

  const v6Analysis = useMemo(() => buildV6Analysis({
    overview,
    health,
    products: dashboard.productSeoItems,
    blogs: dashboard.blogSeoItems,
    keywords: dashboard.seoKeywords,
    clusters: dashboard.seoClusters,
    tasks: dashboard.tasks,
    logs: dashboard.seoLogs,
    doNotTouch: dashboard.doNotTouch,
    searchConsole: dashboard.searchConsoleV5,
    searchConsoleV7,
    googleAdsV8,
  }), [dashboard.blogSeoItems, dashboard.doNotTouch, dashboard.productSeoItems, dashboard.searchConsoleV5, dashboard.seoClusters, dashboard.seoKeywords, dashboard.seoLogs, dashboard.tasks, health, overview, searchConsoleV7, googleAdsV8]);

  const filteredV6Decisions = useMemo(() => v6Analysis.decisions.filter((item) => {
    if (!matchesSearch(filters.search, item.title, item.reason, item.action, item.source)) return false;
    if (filters.priority !== 'all' && String(item.priority) !== filters.priority) return false;
    if (filters.status !== 'all' && !matchesSearch(filters.status, item.level, item.source, item.title)) return false;
    return true;
  }), [filters, v6Analysis.decisions]);

  const filteredV6Opportunities = useMemo(() => v6Analysis.opportunities.filter((item) => {
    if (!matchesSearch(filters.search, item.cluster, item.reasons.join(' '), item.nextAction)) return false;
    if (filters.status !== 'all' && !matchesSearch(filters.status, item.cluster, item.reasons.join(' '), item.nextAction)) return false;
    return true;
  }), [filters.search, filters.status, v6Analysis.opportunities]);

  const filteredV6ProductRanking = useMemo(() => v6Analysis.productRanking.filter((item) => {
    if (!matchesSearch(filters.search, item.name, item.slug, item.category, item.parent_slug, item.action, item.issues.join(' '))) return false;
    if (filters.productIssuesOnly && item.issues.length === 0) return false;
    return true;
  }), [filters, v6Analysis.productRanking]);

  const filteredV6BlogRanking = useMemo(() => v6Analysis.blogRanking.filter((item) => matchesSearch(filters.search, item.title, item.slug, item.excerpt, item.action, item.issues.join(' '))), [filters.search, v6Analysis.blogRanking]);

  const filteredCommands = useMemo(() => commands.filter((item) => {
    if (!matchesSearch(filters.search, item.title, item.detail, item.source, item.level)) return false;
    if (filters.status !== 'all' && !matchesSearch(filters.status, item.title, item.detail, item.level)) return false;
    return true;
  }), [commands, filters.search, filters.status]);

  const filteredDailyBrief = useMemo(() => dailyBrief.filter((item) => matchesSearch(filters.search, item.text, item.level)), [dailyBrief, filters.search]);
  const professionalPlan = useMemo(() => buildProfessionalSeoPlan({
    searchConsole: searchConsoleV7,
    googleAds: googleAdsV8,
    products: dashboard.productSeoItems,
    blogs: dashboard.blogSeoItems,
    clusters: dashboard.seoClusters,
    keywords: dashboard.seoKeywords,
    tasks: filteredTasks,
    internalLinks: dashboard.internalLinkSuggestions,
    workLogs: seoWorkLogsV11,
    manualSearchConsoleSummary: gscManualSummary,
  }), [dashboard.blogSeoItems, dashboard.internalLinkSuggestions, dashboard.productSeoItems, dashboard.seoClusters, dashboard.seoKeywords, filteredTasks, googleAdsV8, searchConsoleV7, seoWorkLogsV11, gscManualSummary]);

  if (loading) {
    return (
      <main className={styles.dashboard} data-admin-seo="true">
        <header className={styles.hero}>
          <h1>SEO Dashboard</h1>
          <p>Đang tải dữ liệu SEO...</p>
        </header>
        <SkeletonGrid />
      </main>
    );
  }

  return (
    <main className={`${styles.dashboard} ${darkMode ? styles.dark : ''}`} data-admin-seo="true">
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Nội Thất Hùng Ngọc</p>
          <h1>SEO Dashboard v9.0</h1>
          <p>AI SEO Operating System ra quyết định SEO hằng ngày từ Supabase, Search Console API/import, GSC nhập tay, Keyword Planner và Nhật ký SEO.</p>
        </div>
        <div className={styles.heroActions}>
          <button className={`${styles.secondaryButton} ${styles.themeButton}`} onClick={() => setDarkMode((value) => !value)}>{darkMode ? 'Giao diện sáng' : 'Giao diện tối'}</button>
          <button className={`${styles.primaryButton} ${styles.refreshButton}`} onClick={reloadDashboard}>Làm mới</button>
          <button className={`${styles.primaryButton} ${styles.refreshButton}`} type="button" onClick={openWorkbench}>Mở Trợ lý SEO v10</button>
        </div>
      </header>

      {error ? <div className={styles.alert}>{error}</div> : null}

      <nav className={styles.v61Tabs} aria-label="Điều hướng SEO Dashboard">
        <a href="#hom-nay">Hôm nay</a>
        <a href="#tong-quan">Tổng quan</a>
        <a href="#ai-seo-daily">AI SEO Daily</a>
        <a href="#ke-hoach-seo">Kế hoạch SEO</a>
        <a href="#nhap-du-lieu-seo">Nhập dữ liệu SEO</a>
        <a href="#nhat-ky-seo">Nhật ký SEO</a>
        <a href="#buoc-tiep-theo">Bước tiếp theo</a>
        <a href="#phan-tich-nang-cao">Phân tích nâng cao</a>
      </nav>

      <section id="tong-quan" className={styles.metricGrid}>
        <MetricCard label="Tổng sản phẩm" value={formatNumber(overview?.products || 0)} />
        <MetricCard label="Tổng bài viết" value={formatNumber(overview?.blogPosts || 0)} />
        <MetricCard label="Tổng danh mục" value={formatNumber(overview?.categories || 0)} hint={overview?.categorySource === 'supabase' ? 'Lấy từ Supabase' : 'Fallback từ menu'} />
        <MetricCard label="URL tạo từ website" value={formatNumber(overview?.generatedUrls || 0)} hint={`${overview?.activeCategoryUrls || 0} danh mục có sản phẩm, ${overview?.staticUrls || 0} trang tĩnh`} />
        <MetricCard label="Tổng quan GSC" value={professionalPlan.sourceSummary.performanceOverviewSource} hint={formatOptionalDate(professionalPlan.sourceSummary.performanceUpdatedAt)} />
        <MetricCard label="GSC cập nhật" value={formatOptionalDate(professionalPlan.sourceSummary.searchConsoleUpdatedAt)} hint={`${professionalPlan.sourceSummary.searchConsoleKeywordCount} keyword, ${professionalPlan.sourceSummary.searchConsoleUrlCount} URL có impression - ${professionalPlan.sourceSummary.searchConsoleDateRanges.join(', ') || 'chưa có range'}`} />
        <MetricCard label="Keyword Planner" value={professionalPlan.sourceSummary.googleAdsKeywordCount ? formatNumber(professionalPlan.sourceSummary.googleAdsKeywordCount) : 'Chưa có dữ liệu'} hint={formatOptionalDate(professionalPlan.sourceSummary.googleAdsUpdatedAt)} />
        <MetricCard label="Việc SEO đã làm" value={formatNumber(professionalPlan.sourceSummary.workLogTotal)} hint="Đọc từ Nhật ký SEO v11" />
        <MetricCard label="Đang theo dõi" value={formatNumber(professionalPlan.sourceSummary.workLogWatching)} hint={`${professionalPlan.sourceSummary.workLogDueToday} việc đến hạn hôm nay`} />
        <MetricCard label="Cần sửa tiếp" value={formatNumber(professionalPlan.sourceSummary.workLogNeedFix)} hint={`${professionalPlan.sourceSummary.workLogOverdue} việc quá hạn kiểm tra`} />
        <MetricCard label="Có tín hiệu tốt" value={formatNumber(professionalPlan.sourceSummary.workLogGoodSignal)} />
      </section>

      <section id="hom-nay">
        <TodaySeoFocusV61
          decisions={filteredV6Decisions}
          notifications={v6Analysis.notifications}
          insights={v6Analysis.insights}
          tasks={filteredTasks}
          commands={filteredCommands}
          dailyBrief={filteredDailyBrief}
          lastUpdated={lastUpdated}
        />
      </section>

      <section id="ai-seo-daily">
        <ModuleCard
          title="AI SEO tự động hôm nay"
          description="Kế hoạch được tạo từ route server an toàn, lưu vào Supabase và không tự gọi Search Console API khi mở dashboard."
          action={<button className={styles.primaryButton} type="button" onClick={runDailyAiPlan} disabled={dailyAiLoading}>{dailyAiLoading ? 'Đang chạy...' : 'Chạy AI SEO hôm nay'}</button>}
        >
          <div className={styles.aiDailyStatusGrid}>
            <MetricCard label="Lần phân tích gần nhất" value={formatOptionalDate(dailyAiPlan?.generatedAt)} hint={dailyAiPlan?.source === 'auto-daily' ? 'Chạy tự động/cron' : dailyAiPlan ? 'Chạy thủ công' : 'Chưa có plan đã lưu'} />
            <MetricCard label="Trạng thái dữ liệu" value={dailyAiPlan?.dataFreshness.status === 'fresh' ? 'Dữ liệu mới' : dailyAiPlan?.dataFreshness.status === 'stale' ? 'Dữ liệu cũ' : 'Thiếu dữ liệu'} hint={dailyAiPlan?.dataFreshness.newestUpdatedAt ? formatOptionalDate(dailyAiPlan.dataFreshness.newestUpdatedAt) : 'Chưa có nguồn mới'} />
            <MetricCard label="Query+Page rows" value={formatNumber(dailySourceRows(dailyAiPlan).filter((item) => item.id.startsWith('query-page-api-')).reduce((sum, item) => sum + Number(item.count || 0), 0) || dailySourceRows(dailyAiPlan).find((item) => item.id === 'query-page-api')?.count || 0)} hint="Tong cac moc 7d/28d/3m/6m/12m, khong tu sync khi mo trang" />
            <MetricCard label="Google Ads" value={formatNumber(dailySourceRows(dailyAiPlan).find((item) => item.id === 'google-ads')?.count || professionalPlan.sourceSummary.googleAdsKeywordCount || 0)} hint="Keyword Planner đã import" />
            <MetricCard label="Supabase đã đọc" value={`${formatNumber(overview?.products || 0)} / ${formatNumber(overview?.blogPosts || 0)}`} hint="Sản phẩm / bài viết" />
            <MetricCard label="Nhật ký SEO v11" value={formatNumber(dailyAiPlan?.workLogSummary.total || professionalPlan.sourceSummary.workLogTotal)} hint={`${dailyAiPlan?.workLogSummary.needFix ?? professionalPlan.sourceSummary.workLogNeedFix} cần sửa tiếp`} />
          </div>

          <div className={styles.v61PlanSource}>
            <strong>AI đang phân tích dựa trên:</strong>
            {dailySourceRows(dailyAiPlan).length ? dailySourceRows(dailyAiPlan).map((source) => (
              <span key={source.id}>{source.label}: {source.hasData ? 'có' : 'chưa có'}{source.count != null ? ' - ' + formatNumber(source.count) : ''}{source.status === 'stale' ? ' - dữ liệu đã cũ' : ''}</span>
            )) : (
              <span>Chưa có daily plan đã lưu. Bấm chạy để AI tạo kế hoạch từ dữ liệu hiện có.</span>
            )}
          </div>

          {dailyAiMessage ? <div className={styles.alert}>{dailyAiMessage}</div> : null}
          {Array.isArray(dailyAiPlan?.notes) && dailyAiPlan.notes.length ? <div className={styles.v61PlanAlerts}>{dailyAiPlan.notes.slice(0, 4).map((note) => <span key={'daily-note-' + note}>{note}</span>)}</div> : null}

          {Array.isArray(dailyAiPlan?.internalLinkSuggestions) && dailyAiPlan.internalLinkSuggestions.length ? (
            <div className={styles.aiDailyInternalLinks}>
              <h3>Gợi ý internal link</h3>
              {dailyAiPlan.internalLinkSuggestions.slice(0, 10).map((item) => (
                <article className={styles.v61PlanMiniTask} key={item.id}>
                  <strong>{item.fromTitle} → {item.toTitle}</strong>
                  <span>Từ: {item.fromUrl}</span>
                  <span>Về: {item.toUrl}</span>
                  <span>Anchor: {item.anchorText}</span>
                  <span>{item.reason}</span>
                  <button className={styles.secondaryButton} type="button" onClick={() => navigator.clipboard?.writeText(item.copyPrompt)}>Copy việc cho Codex</button>
                </article>
              ))}
            </div>
          ) : null}

          <div className={styles.v61PlanColumns}>
            <div>
              <h3>Hôm nay cần làm</h3>
              {(dailyAiPlan?.todayTasks || []).slice(0, 5).map((task) => (
                <article className={styles.v61PlanTask} key={'daily-today-' + task.id}>
                  <div><strong>{task.title}</strong><span>{task.priority} - {task.score}/100</span></div>
                  <p><b>URL:</b> {task.url || 'Chưa có URL chính'}</p>
                  <p><b>Keyword:</b> {task.keyword || 'Chưa xác định'}</p>
                  <p>{task.reason}</p>
                  <p><b>Nguồn dữ liệu:</b> {task.sourceData}</p>
                  {task.savedPrimaryUrl ? <p><b>URL chính đã lưu:</b> {task.savedPrimaryUrl}</p> : null}
                  {task.suggestedPrimaryUrl ? <p><b>URL đề xuất:</b> {task.suggestedPrimaryUrl}</p> : null}
                  {task.competingUrls?.length ? <p><b>URL cạnh tranh:</b> {task.competingUrls.join(', ')}</p> : null}
                  <small>{task.action}</small>
                  <button className={styles.secondaryButton} type="button" onClick={() => copyDailyTaskText(task)}>Copy prompt cho Codex</button>
                </article>
              ))}
              {!dailyAiPlan?.todayTasks.length ? <div className={styles.emptyState}><strong>Chưa có kế hoạch tự động</strong><span>Bấm “Chạy AI SEO hôm nay” để tạo plan và lưu vào Supabase.</span></div> : null}
            </div>
            <div>
              <h3>7 ngày tới</h3>
              {(dailyAiPlan?.next7DaysTasks || []).slice(0, 7).map((task) => (
                <article className={styles.v61PlanMiniTask} key={'daily-week-' + task.id}>
                  <strong>{task.title}</strong>
                  <span>{task.type} - {task.priority} - {task.sourceData}</span>
                </article>
              ))}
            </div>
            <div>
              <h3>Cơ hội theo dõi</h3>
              {(dailyAiPlan?.watchOpportunities || []).slice(0, 5).map((task) => (
                <article className={styles.v61PlanMiniTask} key={'daily-watch-' + task.id}>
                  <strong>{task.keyword || task.title}</strong>
                  <span>{task.score}/100 - {task.sourceData}</span>
                </article>
              ))}
              {safeArray<AiSeoDailyPlan['cannibalizationWarnings'][number]>(dailyAiPlan?.cannibalizationWarnings).slice(0, 3).map((item) => (
                <article className={styles.v61PlanMiniTask} key={'daily-cannibal-' + item.query}>
                  <strong>{item.query}</strong>
                  <span>{item.pages.length} URL cạnh tranh - {formatNumber(item.impressions)} impression</span>
                </article>
              ))}
            </div>
          </div>
        </ModuleCard>
      </section>

      <section id="ke-hoach-seo">
        <ModuleCard title="Kế hoạch SEO chuyên nghiệp" description="AI ưu tiên Search Console mới nhất trước, sau đó mới xét Keyword Planner và dữ liệu Supabase.">
          <div className={styles.v61PlanSource}>
            <strong>Dữ liệu AI đang dùng</strong>
            <span>Tổng quan GSC: {professionalPlan.sourceSummary.performanceOverviewSource} - {professionalPlan.sourceSummary.performanceClicks ?? '-'} click, {professionalPlan.sourceSummary.performanceImpressions ?? '-'} impression, CTR {professionalPlan.sourceSummary.performanceCtr ?? '-'}%, position {professionalPlan.sourceSummary.performancePosition ?? '-'}</span>
            <span>GSC nhập tay: {professionalPlan.sourceSummary.manualGscSummary.hasData ? 'đã có' : 'chưa có'}{professionalPlan.sourceSummary.manualGscSummary.hasData ? ` - ${professionalPlan.sourceSummary.manualGscSummary.clicks ?? '-'} click, ${professionalPlan.sourceSummary.manualGscSummary.impressions ?? '-'} impression, CTR ${professionalPlan.sourceSummary.manualGscSummary.ctr ?? '-'}%, position ${professionalPlan.sourceSummary.manualGscSummary.position ?? '-'}, cập nhật ${formatOptionalDate(professionalPlan.sourceSummary.manualGscSummary.updatedAt)}` : ''}</span>
            <span>Search Console API Query+Page latest: {professionalPlan.sourceSummary.apiQueryPageSummary.hasData ? `đã có - ${formatNumber(professionalPlan.sourceSummary.apiQueryPageSummary.rowCount)} dòng, cập nhật ${formatOptionalDate(professionalPlan.sourceSummary.apiQueryPageSummary.updatedAt)}` : 'chưa có'}</span>
            {dailySourceRows(dailyAiPlan).filter((source) => source.id.startsWith('query-page-api-')).map((source) => (
              <span key={'ai-source-' + source.id}>{source.label}: {source.hasData ? 'đã có' : 'chưa có'}{source.count != null ? ' - ' + formatNumber(source.count) + ' dòng' : ''}{source.updatedAt ? ' - cập nhật ' + formatOptionalDate(source.updatedAt) : ''}{source.detail ? ' - ' + source.detail : ''}</span>
            ))}
            {dailyAiPlan?.gscUpdateHistory?.length ? <span>Lịch sử cập nhật GSC gần nhất: {dailyAiPlan.gscUpdateHistory.slice(0, 3).map((item) => [item.rangeKey || item.type, item.rowCount ? formatNumber(item.rowCount) + ' dòng' : '', formatOptionalDate(item.updatedAt || item.importedAt)].filter(Boolean).join(' - ')).join('; ')}</span> : null}
            {dailyAiPlan?.generatedAt ? <span>Lần chạy AI Daily gần nhất: {formatOptionalDate(dailyAiPlan.generatedAt)}</span> : null}
            <span>Search Console CSV: {professionalPlan.sourceSummary.csvSummary.hasData ? `đã có - ${professionalPlan.sourceSummary.csvSummary.source}; type: ${professionalPlan.sourceSummary.searchConsoleImportTypes.join(', ') || 'chưa rõ'}` : 'chưa có'}</span>
            <span>Google Ads Keyword Planner: {professionalPlan.sourceSummary.googleAdsKeywordCount ? formatNumber(professionalPlan.sourceSummary.googleAdsKeywordCount) + ' keyword' : 'chưa có'} · Nhật ký SEO v11: {formatNumber(professionalPlan.sourceSummary.workLogTotal)} log · Supabase: {formatNumber(overview?.products || 0)} sản phẩm, {formatNumber(overview?.blogPosts || 0)} bài viết</span>
            <span>Dữ liệu AI đang dùng: {professionalPlan.sourceSummary.usingSources}</span>
            <span>GSC ưu tiên chi tiết: {professionalPlan.sourceSummary.activeSearchConsoleSource}. Type đã nhập: {professionalPlan.sourceSummary.searchConsoleImportTypes.join(', ') || 'chưa có'}.</span>
            {professionalPlan.sourceSummary.warning ? <strong>{professionalPlan.sourceSummary.warning}</strong> : null}
          </div>
          {professionalPlan.alerts.length ? (
            <div className={styles.v61PlanAlerts}>
              {professionalPlan.alerts.map((item) => <span key={'plan-alert-' + item}>{item}</span>)}
            </div>
          ) : null}
          <div className={styles.v61PlanColumns}>
            <div>
              <h3>Hôm nay cần làm</h3>
              {professionalPlan.today.map((task) => (
                <article className={styles.v61PlanTask} key={task.id}>
                  <div><strong>{task.title}</strong><span>{task.priority} - {task.score}/100 - {task.estimatedTime}</span></div>
                  <p><b>URL:</b> {task.url || 'Chưa có URL chính'}</p>
                  <p><b>Keyword:</b> {task.keyword || 'Chưa xác định'}</p>
                  <p>{task.reason}</p>
                  <p><b>Nguồn tín hiệu:</b> {task.sourceSignal}</p>
                  <p><b>Lịch sử:</b> {task.historyStatus} · <b>Cần làm lại:</b> {task.shouldRedo}</p>
                  <p><b>Nhật ký gần nhất:</b> {task.latestHistory || 'Chưa có'}</p>
                  <p>{task.historyReason}</p>
                  <small>{task.action}</small>
                  <button className={styles.secondaryButton} type="button" onClick={() => copyTaskText(task)}>Copy việc cho Codex</button>
                </article>
              ))}
            </div>
            <div>
              <h3>7 ngày tới</h3>
              {professionalPlan.week.map((task) => (
                <article className={styles.v61PlanMiniTask} key={task.id}>
                  <strong>{task.title}</strong>
                  <span>{task.type} - {task.priority} - {task.estimatedTime} - Lịch sử: {task.historyStatus}</span>
                </article>
              ))}
            </div>
            <div>
              <h3>Cơ hội theo dõi</h3>
              {professionalPlan.watch.map((task) => (
                <article className={styles.v61PlanMiniTask} key={task.id}>
                  <strong>{task.keyword || task.title}</strong>
                  <span>{task.source} - {task.score}/100 - Lịch sử: {task.historyStatus}</span>
                </article>
              ))}
            </div>
          </div>
        </ModuleCard>
      </section>

      <section id="nhap-du-lieu-seo" className={styles.importMainSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Nhập dữ liệu SEO</h2>
            <p>Cập nhật Search Console và Keyword Planner hằng ngày. Màn hình này chỉ hiển thị trạng thái, số lượng và nút import.</p>
          </div>
        </div>
        <div className={styles.gridTwo}>
          <Suspense fallback={<SkeletonGrid />}>
            <SearchConsoleV7Center
              compact
              keywords={dashboard.seoKeywords}
              clusters={dashboard.seoClusters}
              externalData={searchConsoleV7}
              externalManualSummary={gscManualSummary}
              onManualSummary={setGscManualSummary}
              onData={setSearchConsoleV7}
              onOpenDetails={() => openAdvancedSection('search-console')}
            />
            <GoogleAdsV8ImportCenter
              compact
              keywords={dashboard.seoKeywords}
              clusters={dashboard.seoClusters}
              searchConsoleData={searchConsoleV7}
              externalData={googleAdsV8}
              onData={setGoogleAdsV8}
              onOpenDetails={() => openAdvancedSection('search-console')}
            />
          </Suspense>
        </div>
      </section>

      <section id="nhat-ky-seo">
        <Suspense fallback={<SkeletonGrid />}>
          <SeoWorkLogV11 key={`work-log-main-${restoreVersion}`} tasks={filteredTasks} noteContent={dashboard.note?.content || ''} onLogsChange={setSeoWorkLogsV11} />
        </Suspense>
      </section>

      <section id="buoc-tiep-theo">
        <ModuleCard title="Bước tiếp theo" description="Các việc nên làm sau khi cập nhật dữ liệu, giữ gọn để màn hình chính không thành bảng phân tích.">
          <div className={styles.v61PlanSource}>
            <span>AI SEO đang dùng: {professionalPlan.sourceSummary.usingSources || 'Supabase hiện có'}</span>
            <span>Cập nhật dữ liệu xong thì danh sách này tự đổi theo Search Console / Keyword Planner mới nhất.</span>
          </div>
          <div className={styles.v61NextStepGrid}>
            {[...professionalPlan.week, ...professionalPlan.watch].slice(0, 4).map((task) => (
              <article className={styles.v61PlanMiniTask} key={'next-step-' + task.id}>
                <strong>{task.title}</strong>
                <span>{task.type} - {task.priority} - {task.estimatedTime} - Lịch sử: {task.historyStatus}</span>
              </article>
            ))}
          </div>
        </ModuleCard>
      </section>

      <details
        id="phan-tich-nang-cao"
        className={styles.v61AdvancedShell}
        open={advancedOpen}
        onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
      >
        <summary>
          <span>Phân tích nâng cao</span>
          <small>Workbench, nhập dữ liệu Google, radar, sản phẩm, bài viết, cụm SEO và các bảng quản trị.</small>
        </summary>
        <div className={styles.v61AdvancedBody}>
          <SeoV51FilterBar filters={filters} onChange={setFilters} />

          <section id="action-plan">
            <SeoV9Modules
              key={`v9-${restoreVersion}`}
              overview={overview}
              products={filteredProducts}
              blogs={filteredBlogs}
              keywords={filteredKeywords}
              clusters={filteredClusters}
              tasks={filteredTasks}
              logs={dashboard.seoLogs}
              internalLinks={dashboard.internalLinkSuggestions}
              opportunities={opportunities}
              searchConsole={searchConsoleV7}
              googleAds={googleAdsV8}
              indexSummary={indexSummary}
            />
          </section>

          <section id="seo-next-actions-v11">
            <Suspense fallback={<SkeletonGrid />}>
              <SeoNextActionsV11
                key={`next-actions-${restoreVersion}`}
                products={dashboard.productSeoItems as unknown as Record<string, unknown>[]}
                blogs={dashboard.blogSeoItems as unknown as Record<string, unknown>[]}
                keywords={dashboard.seoKeywords as unknown as Record<string, unknown>[]}
                clusters={dashboard.seoClusters as unknown as Record<string, unknown>[]}
                tasks={filteredTasks as unknown as Record<string, unknown>[]}
                logs={dashboard.seoLogs as unknown as Record<string, unknown>[]}
                searchConsole={searchConsoleV7}
                googleAds={googleAdsV8}
                indexSummary={indexSummary}
              />
            </Suspense>
          </section>

          <section id="seo-workbench">
            {workbenchEnabled ? (
              <Suspense fallback={<SkeletonGrid />}>
                <SeoV10Workbench
                  key={`workbench-${restoreVersion}`}
                  products={dashboard.productSeoItems}
                  blogs={dashboard.blogSeoItems}
                  keywords={dashboard.seoKeywords}
                  clusters={dashboard.seoClusters}
                  searchConsole={searchConsoleV7}
                  googleAds={googleAdsV8}
                />
              </Suspense>
            ) : (
              <ModuleCard
                title="Trợ lý SEO v10.0"
                description="Phần này phân tích toàn bộ sản phẩm, bài viết, danh mục và keyword để chống trùng SEO, tạo title, meta, FAQ và gợi ý liên kết nội bộ. Mình để tải khi cần để trang /admin/seo mở nhanh hơn."
                action={<button className={styles.primaryButton} type="button" onClick={openWorkbench}>Mở Trợ lý SEO v10</button>}
              >
                <p className={styles.muted}>Nếu bạn chỉ xem tổng quan, Search Console hoặc Google Ads thì chưa cần mở phần này. Khi cần tạo bài, kiểm tra keyword đã dùng hoặc copy nội dung SEO thì bấm nút mở.</p>
              </ModuleCard>
            )}
          </section>

          <section id="he-thong" className={styles.gridTwo}>
            <SeoHealthRadar points={v6Analysis.radar} />
            <AiProgressEngine analysis={v6Analysis} />
          </section>

          <section id="cum-seo" className={styles.gridTwo}>
            <OpportunityScorePanel items={filteredV6Opportunities} />
            <AiRecommendationHistory decisions={filteredV6Decisions} />
          </section>

          <section className={styles.gridTwo}>
            <div id="san-pham">
              <AiProductRanking products={filteredV6ProductRanking} />
            </div>
            <div id="bai-viet">
              <AiBlogRanking blogs={filteredV6BlogRanking} />
            </div>
          </section>

          <Suspense fallback={<SkeletonGrid />}>
            <SeoDashboardLowerModules
              restoreVersion={restoreVersion}
              dashboard={dashboard}
              saving={saving}
              actions={actions}
              overview={overview}
              health={health}
              score={score}
              opportunities={opportunities}
              insights={insights}
              summary={summary}
              roadmap={roadmap}
              filteredKeywords={filteredKeywords}
              filteredClusters={filteredClusters}
              filteredTasks={filteredTasks}
              filteredProducts={filteredProducts}
              searchConsoleV7={searchConsoleV7}
              onSearchConsoleV7Data={setSearchConsoleV7}
              googleAdsV8={googleAdsV8}
              onGoogleAdsV8Data={setGoogleAdsV8}
              indexSummary={indexSummary}
              onIndexSummaryData={setIndexSummary}
            />
          </Suspense>
        </div>
      </details>
    </main>
  );
}

