'use client';

import { lazy, Suspense, useMemo, useState } from 'react';
import { MetricCard, SkeletonGrid } from './Ui';
import { buildAiInsights, buildSeoCommands, buildTodaySummary } from './SeoV3Modules';
import { buildAiDailyBrief, buildSeoScoreV41 } from './SeoV4Modules';
import { buildContentOpportunities, getRoadmap30Days } from '../services/seoDashboardService';
import { SeoV51FilterBar, type DashboardSeoFilters } from './SeoV5Modules';
import { AiBlogRanking, AiProductRanking, AiProgressEngine, AiRecommendationHistory, OpportunityScorePanel, SeoHealthRadar, TodaySeoFocusV61, buildV6Analysis } from './SeoV6Modules';
import { useSeoDashboard } from '../hooks/useSeoDashboard';
import styles from '../seo-dashboard.module.css';

const SeoDashboardLowerModules = lazy(() => import('./SeoDashboardLowerModules'));

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value || 0);
}

function isConnected(status?: string) {
  return status === 'connected';
}

function norm(value: unknown) {
  return String(value || '').toLowerCase().trim();
}

function matchesSearch(search: string, ...values: unknown[]) {
  const needle = norm(search);
  if (!needle) return true;
  return values.some((value) => norm(value).includes(needle));
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
  }), [dashboard.blogSeoItems, dashboard.doNotTouch, dashboard.productSeoItems, dashboard.searchConsoleV5, dashboard.seoClusters, dashboard.seoKeywords, dashboard.seoLogs, dashboard.tasks, health, overview]);

  if (loading) {
    return (
      <main className={styles.dashboard}>
        <header className={styles.hero}>
          <h1>SEO Dashboard</h1>
          <p>Đang tải dữ liệu SEO...</p>
        </header>
        <SkeletonGrid />
      </main>
    );
  }

  return (
    <main className={`${styles.dashboard} ${darkMode ? styles.dark : ''}`}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Nội Thất Hùng Ngọc</p>
          <h1>SEO Dashboard v6.1</h1>
          <p>AI SEO Operating System dùng dữ liệu thật từ Supabase khi có thể, gom việc hằng ngày và tối ưu hiển thị mobile.</p>
        </div>
        <div className={styles.heroActions}>
          <button className={styles.secondaryButton} onClick={() => setDarkMode((value) => !value)}>{darkMode ? 'Light Mode' : 'Dark Mode'}</button>
          <button className={styles.primaryButton} onClick={actions.reload}>Làm mới</button>
        </div>
      </header>

      {error ? <div className={styles.alert}>{error}</div> : null}

      <nav className={styles.v61Tabs} aria-label="Điều hướng SEO Dashboard">
        <a href="#tong-quan">Tổng quan</a>
        <a href="#hom-nay">Hôm nay</a>
        <a href="#san-pham">Sản phẩm</a>
        <a href="#bai-viet">Bài viết</a>
        <a href="#cum-seo">Cụm SEO</a>
        <a href="#internal-link">Internal Link</a>
        <a href="#search-console">Search Console</a>
        <a href="#he-thong">Hệ thống</a>
      </nav>

      <section id="hom-nay">
        <TodaySeoFocusV61
          decisions={v6Analysis.decisions}
          notifications={v6Analysis.notifications}
          insights={v6Analysis.insights}
          tasks={dashboard.tasks}
          commands={commands}
          dailyBrief={dailyBrief}
          lastUpdated={lastUpdated}
        />
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
        <OpportunityScorePanel items={v6Analysis.opportunities} />
        <AiRecommendationHistory decisions={v6Analysis.decisions} />
      </section>

      <section className={styles.gridTwo}>
        <div id="san-pham">
          <AiProductRanking products={v6Analysis.productRanking} />
        </div>
        <div id="bai-viet">
          <AiBlogRanking blogs={v6Analysis.blogRanking} />
        </div>
      </section>

      <Suspense fallback={<SkeletonGrid />}>
        <SeoDashboardLowerModules
          dashboard={dashboard}
          saving={saving}
          actions={actions}
          overview={overview}
          health={health}
          searchConsole={searchConsole}
          searchConsoleConnected={searchConsoleConnected}
          googleAdsConnected={googleAdsConnected}
          score={score}
          opportunities={opportunities}
          insights={insights}
          summary={summary}
          roadmap={roadmap}
          filteredKeywords={filteredKeywords}
          filteredClusters={filteredClusters}
          filteredTasks={filteredTasks}
          filteredProducts={filteredProducts}
        />
      </Suspense>
    </main>
  );
}
