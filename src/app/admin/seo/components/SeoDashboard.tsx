'use client';

import { lazy, Suspense, useMemo, useState } from 'react';
import { MetricCard, ModuleCard, SkeletonGrid } from './Ui';
import { buildAiInsights, buildSeoCommands, buildTodaySummary } from './SeoV3Modules';
import { buildAiDailyBrief, buildSeoScoreV41 } from './SeoV4Modules';
import { buildContentOpportunities, getRoadmap30Days } from '../services/seoDashboardService';
import { SeoV51FilterBar, type DashboardSeoFilters } from './SeoV5Modules';
import { AiBlogRanking, AiProductRanking, AiProgressEngine, AiRecommendationHistory, OpportunityScorePanel, SeoHealthRadar, TodaySeoFocusV61, buildV6Analysis } from './SeoV6Modules';
import SeoV9Modules from './SeoV9Modules';
import { useSeoDashboard } from '../hooks/useSeoDashboard';
import styles from '../seo-dashboard.module.css';
import type { GoogleAdsImportData, IndexSummaryManual, SearchConsoleV7Data } from '../types/seo';

const SeoDashboardLowerModules = lazy(() => import('./SeoDashboardLowerModules'));
const SeoV10Workbench = lazy(() => import('./SeoV10Workbench'));

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value || 0);
}

function isConnected(status?: string) {
  return status === 'connected';
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
  const [indexSummary, setIndexSummary] = useState<IndexSummaryManual | null>(null);
  const [workbenchEnabled, setWorkbenchEnabled] = useState(false);

  function openWorkbench() {
    setWorkbenchEnabled(true);
    window.setTimeout(() => {
      document.getElementById('seo-workbench')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
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
  const searchConsoleConnected = Boolean(searchConsoleV7?.overview.impressions);
  const googleAdsConnected = Boolean(googleAdsV8?.summary.keywordCount);

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
  const lastUpdated = useMemo(() => new Date().toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }), []);

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
          <p>AI SEO Operating System ra quyết định SEO hằng ngày từ Supabase và dữ liệu Google import thủ công. Không dùng Google API/OAuth/billing.</p>
        </div>
        <div className={styles.heroActions}>
          <button className={`${styles.secondaryButton} ${styles.themeButton}`} onClick={() => setDarkMode((value) => !value)}>{darkMode ? 'Giao diện sáng' : 'Giao diện tối'}</button>
          <button className={`${styles.primaryButton} ${styles.refreshButton}`} onClick={actions.reload}>Làm mới</button>
          <button className={`${styles.primaryButton} ${styles.refreshButton}`} type="button" onClick={openWorkbench}>Mở Trợ lý SEO v10</button>
        </div>
      </header>

      {error ? <div className={styles.alert}>{error}</div> : null}

      <nav className={styles.v61Tabs} aria-label="Điều hướng SEO Dashboard">
        <a href="#tong-quan">Tổng quan</a>
        <a href="#hom-nay">Hôm nay</a>
        <a href="#action-plan">Kế hoạch SEO AI</a>
        <a href="#seo-workbench">Trợ lý SEO</a>
        <a href="#san-pham">Sản phẩm</a>
        <a href="#bai-viet">Bài viết</a>
        <a href="#cum-seo">Cụm SEO</a>
        <a href="#internal-link">Liên kết nội bộ</a>
        <a href="#search-console">Search Console</a>
        <a href="#he-thong">Hệ thống</a>
      </nav>

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


      <section id="action-plan">
        <SeoV9Modules
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

      <section id="seo-workbench">
        {workbenchEnabled ? (
          <Suspense fallback={<SkeletonGrid />}>
            <SeoV10Workbench
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

      <section id="tong-quan" className={styles.metricGrid}>
        <MetricCard label="Tổng sản phẩm" value={formatNumber(overview?.products || 0)} />
        <MetricCard label="Tổng bài viết" value={formatNumber(overview?.blogPosts || 0)} />
        <MetricCard label="Tổng danh mục" value={formatNumber(overview?.categories || 0)} hint={overview?.categorySource === 'supabase' ? 'Lấy từ Supabase' : 'Fallback từ menu'} />
        <MetricCard label="URL tạo từ website" value={formatNumber(overview?.generatedUrls || 0)} hint={`${overview?.activeCategoryUrls || 0} danh mục có sản phẩm, ${overview?.staticUrls || 0} trang tĩnh`} />
      </section>

      <SeoV51FilterBar filters={filters} onChange={setFilters} />

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
    </main>
  );
}




