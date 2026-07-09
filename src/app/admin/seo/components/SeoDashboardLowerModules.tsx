'use client';

import { memo } from 'react';
import EditablePriorityList from './EditablePriorityList';
import SeoNotesPanel from './SeoNotesPanel';
import TodayTaskList from './TodayTaskList';
import SearchConsoleV7Center from './SearchConsoleV7Center';
import GoogleAdsV8ImportCenter from './GoogleAdsV8ImportCenter';
import IndexSummaryPanel from './IndexSummaryPanel';
import SeoDashboardSyncV112 from './SeoDashboardSyncV112';
import { Badge, EmptyState, MetricCard, ModuleCard } from './Ui';
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
import { DashboardAnalytics, ClusterHealth, ContentPlanner, InternalLinkAIV5, KeywordIntelligence, ProductQualityAIV5 } from './SeoV5Modules';
import type { useSeoDashboard } from '../hooks/useSeoDashboard';
import type { AiInsight, ContentOpportunity, ProductSeoItem, RoadmapWeek, GoogleAdsImportData, IndexSummaryManual, SearchConsoleV7Data, SeoCluster, SeoHealthSnapshot, SeoKeyword, SeoOverview, TodaySummary, TodayTask } from '../types/seo';
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
  score: SeoScore;
  opportunities: ContentOpportunity[];
  insights: AiInsight[];
  summary: TodaySummary;
  roadmap: RoadmapWeek[];
  filteredKeywords: SeoKeyword[];
  filteredClusters: SeoCluster[];
  filteredTasks: TodayTask[];
  filteredProducts: ProductSeoItem[];
  searchConsoleV7: SearchConsoleV7Data | null;
  onSearchConsoleV7Data: (data: SearchConsoleV7Data | null) => void;
  googleAdsV8: GoogleAdsImportData | null;
  onGoogleAdsV8Data: (data: GoogleAdsImportData | null) => void;
  indexSummary: IndexSummaryManual | null;
  onIndexSummaryData: (data: IndexSummaryManual | null) => void;
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
  score,
  opportunities,
  insights,
  summary,
  roadmap,
  filteredKeywords,
  filteredClusters,
  filteredTasks,
  filteredProducts,
  searchConsoleV7,
  onSearchConsoleV7Data,
  googleAdsV8,
  onGoogleAdsV8Data,
  indexSummary,
  onIndexSummaryData,
}: Props) {
  return (
    <div className={styles.v61Deferred}>
      <AccordionSection id="search-console" title="Import Google thủ công và dữ liệu tổng quan" description="Search Console và Google Ads dùng dữ liệu import thủ công, không dùng API." defaultOpen>
        <section className={styles.gridTwo}>
          <SearchConsoleV7Center keywords={dashboard.seoKeywords} clusters={dashboard.seoClusters} onData={onSearchConsoleV7Data} />
          <GoogleAdsV8ImportCenter keywords={dashboard.seoKeywords} clusters={dashboard.seoClusters} searchConsoleData={searchConsoleV7} onData={onGoogleAdsV8Data} />
        </section>
        <section className={styles.stack}>
          <DashboardAnalytics overview={overview} health={health} clusters={dashboard.seoClusters} keywords={dashboard.seoKeywords} tasks={dashboard.tasks} logs={dashboard.seoLogs} doNotTouch={dashboard.doNotTouch} searchConsoleV7={searchConsoleV7} indexSummary={indexSummary} />
          <SeoDashboardSyncV112 />
        </section>
      </AccordionSection>

      <AccordionSection title="Từ khóa, cụm SEO và kế hoạch nội dung" description="Lọc bằng thanh tìm kiếm phía trên.">
        <section className={styles.gridTwo}>
          <KeywordIntelligence keywords={filteredKeywords} searchConsoleQueries={searchConsoleV7?.queries || []} adsData={googleAdsV8} />
          <ClusterHealth clusters={filteredClusters} searchConsoleData={searchConsoleV7} adsData={googleAdsV8} />
        </section>
        <section className={styles.gridTwo}>
          <ContentPlanner opportunities={opportunities} keywords={filteredKeywords} />
          <ProductQualityAIV5 products={filteredProducts} />
        </section>
      </AccordionSection>

      <AccordionSection id="internal-link" title="Liên kết nội bộ và chất lượng sản phẩm" description="Các gợi ý liên kết nội bộ và sản phẩm cần tối ưu.">
        <section className={styles.gridTwo}>
          <InternalLinkAIV5 suggestions={dashboard.internalLinkSuggestions} clusters={filteredClusters} products={filteredProducts} />
          <ProductSeoAiPanel items={filteredProducts} />
        </section>
        <section className={styles.gridTwo}>
          <InternalLinkAiPanel items={dashboard.internalLinkSuggestions} />
          <ContentOpportunityPanel items={opportunities} />
        </section>
      </AccordionSection>

      <AccordionSection title="Quản trị SEO thủ công" description="Từ khóa, cụm SEO, log, danh sách không sửa và đối thủ.">
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

      <AccordionSection title="Mục tiêu, ghi chú và tác vụ" description="Các gợi ý liên kết nội bộ và sản phẩm cần tối ưu.">
        <section className={styles.gridThree}>
          <ModuleCard title="SEO Priority" description="Danh sách ưu tiên theo sao, lưu trong Supabase.">
            <EditablePriorityList priorities={dashboard.priorities} saving={saving} onSave={actions.savePriority} onDelete={actions.removePriority} />
          </ModuleCard>
          <ModuleCard title="Today Task" description="Các gợi ý liên kết nội bộ và sản phẩm cần tối ưu.">
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

      <AccordionSection id="he-thong-chi-tiet" title="Hệ thống và thao tác nhanh" description="Sitemap, robots, 404, index và trạng thái hệ thống.">
        <section className={styles.gridTwo}>
          <QuickActionPanelV41 />
          <LocalSeoPanel items={dashboard.localSeo} saving={saving} actions={actions} />
        </section>
        <section className={styles.gridTwo}>
          <IndexSummaryPanel onData={onIndexSummaryData} />
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
          <ModuleCard title="Index Status" description="Index thật chỉ hiển thị khi có Search Console import hoặc Index Summary thủ công. Không dùng công cụ kiểm tra URL tự động.">
            <div className={styles.metricGridSmall}>
              <MetricCard label="URL tạo từ website" value={formatNumber(overview?.generatedUrls || 0)} />
              <MetricCard label="Index thật" value={indexSummary ? 'Đang dùng tóm tắt thủ công' : searchConsoleV7 ? 'Đang dùng Search Console import thủ công' : 'Chưa có dữ liệu index thật'} />
            </div>
            <p className={styles.indexSummaryNote}>URL tạo từ website không đồng nghĩa với URL Google đã index. URL có impression trong Search Console import là URL đã được Google hiển thị; URL không có impression chưa chắc là chưa index.</p>
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