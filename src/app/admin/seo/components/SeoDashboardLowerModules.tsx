'use client';

import { memo } from 'react';
import EditablePriorityList from './EditablePriorityList';
import SeoNotesPanel from './SeoNotesPanel';
import TodayTaskList from './TodayTaskList';
import { Badge, EmptyState, MetricCard, MiniBarChart, ModuleCard } from './Ui';
import { AiInsightPanel, LocalSeoPanel, TodaySummaryPanel } from './SeoV3Modules';
import {
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
  MonthlyGoalProgressPanel,
} from './SeoV4Modules';
import { DashboardAnalytics, ClusterHealth, ContentPlanner, InternalLinkAIV5, KeywordIntelligence, ProductQualityAIV5, SearchConsoleCenter } from './SeoV5Modules';
import type { useSeoDashboard } from '../hooks/useSeoDashboard';
import type { AiInsight, ContentOpportunity, ProductSeoItem, RoadmapWeek, SeoCluster, SeoHealthSnapshot, SeoKeyword, SeoOverview, TodaySummary, TodayTask } from '../types/seo';
import styles from '../seo-dashboard.module.css';

type DashboardData = ReturnType<typeof useSeoDashboard>['dashboard'];
type DashboardActions = ReturnType<typeof useSeoDashboard>['actions'];
type SeoScore = Parameters<typeof AiSeoScorePanelV41>[0]['score'];

type Props = {
  dashboard: DashboardData;
  saving: boolean;
  actions: DashboardActions;
  overview: SeoOverview | null;
  health: SeoHealthSnapshot | null;
  searchConsole: DashboardData['searchConsole'];
  searchConsoleConnected: boolean;
  googleAdsConnected: boolean;
  score: SeoScore;
  opportunities: ContentOpportunity[];
  insights: AiInsight[];
  summary: TodaySummary;
  roadmap: RoadmapWeek[];
  filteredKeywords: SeoKeyword[];
  filteredClusters: SeoCluster[];
  filteredTasks: TodayTask[];
  filteredProducts: ProductSeoItem[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value || 0);
}

function dashboardKey(table: string, item: unknown, index: number) {
  const row = item as Record<string, unknown>;
  return table + '-' + String(row.id ?? row.name ?? row.url ?? row.keyword ?? 'no-id') + '-' + String(row.url ?? row.keyword ?? row.name ?? 'no-slug') + '-' + index;
}

function AccordionSection({ id, title, description, defaultOpen = false, children }: { id?: string; title: string; description?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details id={id} className={styles.v61Accordion} open={defaultOpen}>
      <summary>
        <span>{title}</span>
        {description ? <small>{description}</small> : null}
      </summary>
      <div className={styles.v61AccordionBody}>{children}</div>
    </details>
  );
}

function SeoDashboardLowerModules({
  dashboard,
  saving,
  actions,
  overview,
  health,
  searchConsole,
  searchConsoleConnected,
  googleAdsConnected,
  score,
  opportunities,
  insights,
  summary,
  roadmap,
  filteredKeywords,
  filteredClusters,
  filteredTasks,
  filteredProducts,
}: Props) {
  return (
    <div className={styles.v61Deferred}>
      <AccordionSection id="search-console" title="Search Console và dữ liệu tổng quan" description="Các module đọc sau để dashboard nhẹ hơn." defaultOpen>
        <section className={styles.gridTwo}>
          <SearchConsoleCenter data={dashboard.searchConsoleV5} />
          <DashboardAnalytics overview={overview} health={health} clusters={dashboard.seoClusters} keywords={dashboard.seoKeywords} tasks={dashboard.tasks} logs={dashboard.seoLogs} doNotTouch={dashboard.doNotTouch} />
        </section>
      </AccordionSection>

      <AccordionSection title="Keyword, cụm SEO và kế hoạch nội dung" description="Lọc bằng thanh tìm kiếm phía trên.">
        <section className={styles.gridTwo}>
          <KeywordIntelligence keywords={filteredKeywords} />
          <ClusterHealth clusters={filteredClusters} />
        </section>
        <section className={styles.gridTwo}>
          <ContentPlanner opportunities={opportunities} keywords={filteredKeywords} />
          <ProductQualityAIV5 products={filteredProducts} />
        </section>
      </AccordionSection>

      <AccordionSection id="internal-link" title="Internal Link và chất lượng sản phẩm" description="Các gợi ý liên kết nội bộ, sản phẩm cần tối ưu.">
        <section className={styles.gridTwo}>
          <InternalLinkAIV5 suggestions={dashboard.internalLinkSuggestions} clusters={filteredClusters} products={filteredProducts} />
          <ProductSeoAiPanel items={dashboard.productSeoItems} />
        </section>
        <section className={styles.gridTwo}>
          <InternalLinkAiPanel items={dashboard.internalLinkSuggestions} />
          <ContentOpportunityPanel items={opportunities} />
        </section>
      </AccordionSection>

      <AccordionSection title="Quản trị SEO thủ công" description="Keyword, cluster, log, do-not-touch và đối thủ.">
        <section className={styles.gridTwo}>
          <KeywordCenter keywords={dashboard.seoKeywords} saving={saving} actions={actions} />
          <AiSeoScorePanelV41 score={score} />
        </section>
        <section className={styles.gridTwo}>
          <ClusterManager clusters={dashboard.seoClusters} saving={saving} actions={actions} />
          <SeoMemoryTimeline logs={dashboard.seoLogs} saving={saving} actions={actions} />
        </section>
        <section className={styles.gridTwo}>
          <DoNotTouchPanelV41 items={dashboard.doNotTouch} saving={saving} actions={actions} />
          <CompetitorWatchPanel items={dashboard.seoCompetitors} saving={saving} actions={actions} />
        </section>
      </AccordionSection>

      <AccordionSection title="Mục tiêu, ghi chú và tác vụ" description="Các phần nhập liệu dùng hằng ngày.">
        <section className={styles.gridThree}>
          <ModuleCard title="SEO Priority" description="Danh sách ưu tiên theo sao, lưu trong Supabase.">
            <EditablePriorityList priorities={dashboard.priorities} saving={saving} onSave={actions.savePriority} onDelete={actions.removePriority} />
          </ModuleCard>
          <ModuleCard title="Today Task" description="Checklist SEO hằng ngày.">
            <TodayTaskList tasks={filteredTasks} suggestions={[]} saving={saving} onSave={actions.saveTask} onDelete={actions.removeTask} />
          </ModuleCard>
          <ModuleCard title="SEO Note" description="Ghi chú nhanh cho kế hoạch SEO.">
            <SeoNotesPanel note={dashboard.note} saving={saving} onSave={actions.saveNote} />
          </ModuleCard>
        </section>
        <section className={styles.gridThree}>
          <AiInsightPanel insights={insights} />
          <GoalOverviewV4 goals={dashboard.seoGoals} overview={overview} />
          <TodaySummaryPanel summary={summary} />
        </section>
        <section className={styles.gridTwo}>
          <MonthlyGoalProgressPanel overview={overview} logs={dashboard.seoLogs} />
          <Roadmap30DaysPanel weeks={roadmap} />
        </section>
      </AccordionSection>

      <AccordionSection id="he-thong-chi-tiet" title="Hệ thống và quick actions" description="Sitemap, robots, 404, index và trạng thái hệ thống.">
        <section className={styles.gridTwo}>
          <QuickActionPanelV41 />
          <LocalSeoPanel items={dashboard.localSeo} saving={saving} actions={actions} />
        </section>
        <section className={styles.gridTwo}>
          <ModuleCard title="Search Console" description="Kiến trúc đã sẵn sàng để gắn Google Search Console API." action={<Badge status={searchConsole?.status || 'pending'}>{searchConsole?.message || 'Chưa kết nối Search Console'}</Badge>}>
            <div className={styles.metricGridSmall}>
              <MetricCard label="Impression" value={formatNumber(searchConsole?.impressions || 0)} />
              <MetricCard label="Click" value={formatNumber(searchConsole?.clicks || 0)} />
              <MetricCard label="CTR" value={`${searchConsole?.ctr || 0}%`} />
              <MetricCard label="Average Position" value={searchConsole?.averagePosition || 0} />
            </div>
            <div className={styles.chartTabs}>
              <MiniBarChart data={searchConsole?.chart7Days || []} label="Biểu đồ 7 ngày" />
              <MiniBarChart data={searchConsole?.chart28Days || []} label="Biểu đồ 28 ngày" />
            </div>
            <div className={styles.keywordGrid}>
              <EmptyState title="Top Query" detail="Sẽ hiển thị sau khi kết nối API" />
              <EmptyState title="Top Page" detail="Sẽ hiển thị sau khi kết nối API" />
              <EmptyState title="Top Country" detail="Sẽ hiển thị sau khi kết nối API" />
              <EmptyState title="Top Device" detail="Sẽ hiển thị sau khi kết nối API" />
            </div>
          </ModuleCard>
          <ModuleCard title="Google Ads" description="Chuẩn bị sẵn cho Keyword Planner / Google Ads API." action={<Badge status={googleAdsConnected ? 'connected' : 'disconnected'}>{dashboard.adsMessage}</Badge>}>
            {dashboard.adsKeywords.length === 0 ? <EmptyState title="Chưa kết nối Google Ads" detail="Sau này có API sẽ hiện Keyword, Competition, Monthly Search và Status." /> : null}
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Keyword</th><th>Competition</th><th>Monthly Search</th><th>Status</th></tr></thead>
                <tbody>{dashboard.adsKeywords.map((item, index) => <tr key={dashboardKey('ads', item, index)}><td>{item.keyword}</td><td>{item.competition}</td><td>{item.monthlySearch}</td><td>{item.status}</td></tr>)}</tbody>
              </table>
            </div>
          </ModuleCard>
        </section>

        <section className={styles.gridTwo}>
          <ModuleCard title="404" description="Đọc public/404-log.json hoặc public/redirects.json nếu có.">
            {health?.brokenUrls.length ? (
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>URL lỗi</th><th>Redirect</th><th>Trạng thái</th></tr></thead>
                  <tbody>{health.brokenUrls.map((item, index) => <tr key={dashboardKey('broken-url', item, index)}><td>{item.url}</td><td>{item.redirectTo || '-'}</td><td><Badge status={item.status === 'new' ? 'warning' : 'ok'}>{item.status}</Badge></td></tr>)}</tbody>
                </table>
              </div>
            ) : <EmptyState title="Chưa có log 404 mới" detail="Khi có file log hoặc redirect, dashboard sẽ tự hiển thị." />}
          </ModuleCard>
          <ModuleCard title="Sitemap" description="Kiểm tra sitemap.xml và robots.txt.">
            <div className={styles.metricGridSmall}>
              <MetricCard label="URL trong sitemap" value={formatNumber(health?.sitemap.urlCount || 0)} />
              <MetricCard label="Last Generated" value={health?.sitemap.lastGenerated || 'Chưa rõ'} />
              <MetricCard label="Robots" value={health?.sitemap.robotsOk ? 'OK' : 'Cần kiểm tra'} />
              <MetricCard label="Sitemap" value={health?.sitemap.sitemapOk ? 'OK' : 'Cần kiểm tra'} />
            </div>
            <a className={styles.link} href="/sitemap.xml" target="_blank" rel="noreferrer">Mở sitemap.xml</a>
          </ModuleCard>
        </section>

        <section className={styles.gridTwo}>
          <ModuleCard title="Index Status" description="URL đã index: Chưa kết nối Search Console. Module này sẵn sàng nhận dữ liệu khi có API.">
            <div className={styles.metricGridSmall}>
              <MetricCard label="URL tạo từ website" value={formatNumber(overview?.generatedUrls || 0)} />
              <MetricCard label="URL đã index" value="Chưa kết nối Search Console" />
            </div>
            {dashboard.indexStatus.length === 0 ? <EmptyState title="Chưa có dữ liệu index" detail="Không dùng nhãn đã index khi chưa có Search Console API." /> : (
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>URL mới</th><th>Ngày tạo</th><th>Đã gửi index</th><th>Đã index</th></tr></thead>
                  <tbody>{dashboard.indexStatus.map((item, index) => <tr key={dashboardKey('index-status', item, index)}><td>{item.url}</td><td>{new Date(item.created_at).toLocaleDateString('vi-VN')}</td><td>{item.submitted ? 'Có' : 'Chưa'}</td><td>{item.indexed ? 'Có' : 'Chưa'}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </ModuleCard>
          <ModuleCard title="System Health" description="Theo dõi những điểm quan trọng của hệ thống SEO.">
            <div className={styles.healthList}>{health?.systemHealth.map((item, index) => <div className={styles.healthItem} key={dashboardKey('system-health', item, index)}><div><strong>{item.name}</strong><span>{item.detail}</span></div><Badge status={item.status}>{item.status}</Badge></div>)}</div>
          </ModuleCard>
        </section>
      </AccordionSection>
    </div>
  );
}

export default memo(SeoDashboardLowerModules);
