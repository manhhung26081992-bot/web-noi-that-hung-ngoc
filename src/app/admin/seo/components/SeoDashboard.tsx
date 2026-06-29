'use client';

import { useState } from 'react';
import EditablePriorityList from './EditablePriorityList';
import SeoNotesPanel from './SeoNotesPanel';
import TodayTaskList from './TodayTaskList';
import { Badge, EmptyState, MetricCard, MiniBarChart, ModuleCard, SkeletonGrid } from './Ui';
import { AiInsightPanel, LocalSeoPanel, SeoCommandCenter, TodaySummaryPanel, buildAiInsights, buildSeoCommands, buildTodaySummary } from './SeoV3Modules';
import {
  AiDailyBriefPanel,
  AiSeoScorePanelV4,
  ClusterManager,
  CompetitorWatchPanel,
  ContentOpportunityPanel,
  DoNotTouchPanel,
  GoalOverviewV4,
  InternalLinkAiPanel,
  KeywordCenter,
  ProductSeoAiPanel,
  QuickActionPanelV4,
  Roadmap30DaysPanel,
  SeoMemoryTimeline,
  buildAiDailyBrief,
  buildSeoScoreV4,
} from './SeoV4Modules';
import { buildContentOpportunities, getRoadmap30Days } from '../services/seoDashboardService';
import { useSeoDashboard } from '../hooks/useSeoDashboard';
import styles from '../seo-dashboard.module.css';

function formatNumber(value: number) { return new Intl.NumberFormat('vi-VN').format(value || 0); }
function isConnected(status?: string) { return status === 'connected'; }

export default function SeoDashboard() {
  const { dashboard, loading, saving, error, actions } = useSeoDashboard();
  const [darkMode, setDarkMode] = useState(false);

  if (loading) return <main className={styles.dashboard}><header className={styles.hero}><h1>SEO Dashboard</h1><p>Đang tải dữ liệu SEO...</p></header><SkeletonGrid /></main>;

  const overview = dashboard.overview;
  const searchConsole = dashboard.searchConsole;
  const health = dashboard.health;
  const searchConsoleConnected = isConnected(searchConsole?.status);
  const googleAdsConnected = dashboard.adsKeywords.some((item) => isConnected(item.status));
  const commands = buildSeoCommands({ overview, tasks: dashboard.tasks, health, keywords: dashboard.seoKeywords, searchConsoleConnected });
  const insights = buildAiInsights({ overview, health, tasks: dashboard.tasks, logs: dashboard.seoLogs, searchConsoleConnected });
  const summary = buildTodaySummary({ overview, health, logs: dashboard.seoLogs });
  const dailyBrief = buildAiDailyBrief({ overview, health, productSeoItems: dashboard.productSeoItems, logs: dashboard.seoLogs, searchConsoleConnected });
  const score = buildSeoScoreV4({ overview, health, searchConsoleConnected, googleAdsConnected, clusters: dashboard.seoClusters, keywords: dashboard.seoKeywords });
  const opportunities = buildContentOpportunities(dashboard.seoClusters, dashboard.seoKeywords, overview);
  const roadmap = getRoadmap30Days();

  return <main className={`${styles.dashboard} ${darkMode ? styles.dark : ''}`}>
    <header className={styles.hero}><div><p className={styles.eyebrow}>Nội Thất Hùng Ngọc</p><h1>SEO Dashboard v4.0</h1><p>AI SEO Operating System: điều hành cụm SEO, keyword, nội dung, link nội bộ và dữ liệu vận hành hằng ngày.</p></div><div className={styles.heroActions}><button className={styles.secondaryButton} onClick={() => setDarkMode((value) => !value)}>{darkMode ? 'Light Mode' : 'Dark Mode'}</button><button className={styles.primaryButton} onClick={actions.reload}>Làm mới</button></div></header>
    {error ? <div className={styles.alert}>{error}</div> : null}

    <AiDailyBriefPanel items={dailyBrief} />
    <SeoCommandCenter commands={commands} />

    <section className={styles.metricGrid}><MetricCard label="Tổng sản phẩm" value={formatNumber(overview?.products || 0)} /><MetricCard label="Tổng bài viết" value={formatNumber(overview?.blogPosts || 0)} /><MetricCard label="Tổng danh mục" value={formatNumber(overview?.categories || 0)} hint={overview?.categorySource === 'supabase' ? 'Lấy từ Supabase' : 'Fallback từ menu'} /><MetricCard label="URL tạo từ website" value={formatNumber(overview?.generatedUrls || 0)} hint={`${overview?.activeCategoryUrls || 0} danh mục có sản phẩm, ${overview?.staticUrls || 0} trang tĩnh`} /></section>

    <section className={styles.gridTwo}><KeywordCenter keywords={dashboard.seoKeywords} saving={saving} actions={actions} /><AiSeoScorePanelV4 score={score} /></section>
    <section className={styles.gridTwo}><ClusterManager clusters={dashboard.seoClusters} saving={saving} actions={actions} /><ContentOpportunityPanel items={opportunities} /></section>
    <section className={styles.gridTwo}><ProductSeoAiPanel items={dashboard.productSeoItems} /><InternalLinkAiPanel items={dashboard.internalLinkSuggestions} /></section>
    <section className={styles.gridTwo}><SeoMemoryTimeline logs={dashboard.seoLogs} saving={saving} actions={actions} /><Roadmap30DaysPanel weeks={roadmap} /></section>
    <section className={styles.gridTwo}><DoNotTouchPanel items={dashboard.doNotTouch} saving={saving} actions={actions} /><CompetitorWatchPanel items={dashboard.seoCompetitors} saving={saving} actions={actions} /></section>
    <section className={styles.gridThree}><AiInsightPanel insights={insights} /><GoalOverviewV4 goals={dashboard.seoGoals} overview={overview} /><TodaySummaryPanel summary={summary} /></section>
    <section className={styles.gridTwo}><QuickActionPanelV4 /><LocalSeoPanel items={dashboard.localSeo} saving={saving} actions={actions} /></section>

    <section className={styles.gridThree}><ModuleCard title="SEO Priority" description="Danh sách ưu tiên theo sao, lưu trong Supabase."><EditablePriorityList priorities={dashboard.priorities} saving={saving} onSave={actions.savePriority} onDelete={actions.removePriority} /></ModuleCard><ModuleCard title="Today Task" description="Checklist SEO hằng ngày."><TodayTaskList tasks={dashboard.tasks} suggestions={commands} saving={saving} onSave={actions.saveTask} onDelete={actions.removeTask} /></ModuleCard><ModuleCard title="SEO Note" description="Ghi chú nhanh cho kế hoạch SEO."><SeoNotesPanel note={dashboard.note} saving={saving} onSave={actions.saveNote} /></ModuleCard></section>

    <section className={styles.gridTwo}>
      <ModuleCard title="Search Console" description="Kiến trúc đã sẵn sàng để gắn Google Search Console API." action={<Badge status={searchConsole?.status || 'pending'}>{searchConsole?.message || 'Chưa kết nối Search Console'}</Badge>}><div className={styles.metricGridSmall}><MetricCard label="Impression" value={formatNumber(searchConsole?.impressions || 0)} /><MetricCard label="Click" value={formatNumber(searchConsole?.clicks || 0)} /><MetricCard label="CTR" value={`${searchConsole?.ctr || 0}%`} /><MetricCard label="Average Position" value={searchConsole?.averagePosition || 0} /></div><div className={styles.chartTabs}><MiniBarChart data={searchConsole?.chart7Days || []} label="Biểu đồ 7 ngày" /><MiniBarChart data={searchConsole?.chart28Days || []} label="Biểu đồ 28 ngày" /></div><div className={styles.keywordGrid}><EmptyState title="Top Query" detail="Sẽ hiển thị sau khi kết nối API" /><EmptyState title="Top Page" detail="Sẽ hiển thị sau khi kết nối API" /><EmptyState title="Top Country" detail="Sẽ hiển thị sau khi kết nối API" /><EmptyState title="Top Device" detail="Sẽ hiển thị sau khi kết nối API" /></div></ModuleCard>
      <ModuleCard title="Google Ads" description="Chuẩn bị sẵn cho Keyword Planner / Google Ads API." action={<Badge status={googleAdsConnected ? 'connected' : 'disconnected'}>{dashboard.adsMessage}</Badge>}>{dashboard.adsKeywords.length === 0 ? <EmptyState title="Chưa kết nối Google Ads" detail="Sau này có API sẽ hiện Keyword, Competition, Monthly Search và Status." /> : null}<div className={styles.tableWrap}><table><thead><tr><th>Keyword</th><th>Competition</th><th>Monthly Search</th><th>Status</th></tr></thead><tbody>{dashboard.adsKeywords.map((item) => <tr key={item.id}><td>{item.keyword}</td><td>{item.competition}</td><td>{item.monthlySearch}</td><td>{item.status}</td></tr>)}</tbody></table></div></ModuleCard>
    </section>

    <section className={styles.gridTwo}>
      <ModuleCard title="404" description="Đọc public/404-log.json hoặc public/redirects.json nếu có.">{health?.brokenUrls.length ? <div className={styles.tableWrap}><table><thead><tr><th>URL lỗi</th><th>Redirect</th><th>Trạng thái</th></tr></thead><tbody>{health.brokenUrls.map((item) => <tr key={item.id}><td>{item.url}</td><td>{item.redirectTo || '-'}</td><td><Badge status={item.status === 'new' ? 'warning' : 'ok'}>{item.status}</Badge></td></tr>)}</tbody></table></div> : <EmptyState title="Chưa có log 404 mới" detail="Khi có file log hoặc redirect, dashboard sẽ tự hiển thị." />}</ModuleCard>
      <ModuleCard title="Sitemap" description="Kiểm tra sitemap.xml và robots.txt."><div className={styles.metricGridSmall}><MetricCard label="URL trong sitemap" value={formatNumber(health?.sitemap.urlCount || 0)} /><MetricCard label="Last Generated" value={health?.sitemap.lastGenerated || 'Chưa rõ'} /><MetricCard label="Robots" value={health?.sitemap.robotsOk ? 'OK' : 'Cần kiểm tra'} /><MetricCard label="Sitemap" value={health?.sitemap.sitemapOk ? 'OK' : 'Cần kiểm tra'} /></div><a className={styles.link} href="/sitemap.xml" target="_blank" rel="noreferrer">Mở sitemap.xml</a></ModuleCard>
    </section>

    <section className={styles.gridTwo}>
      <ModuleCard title="Index Status" description="URL đã index: Chưa kết nối Search Console. Module này sẵn sàng nhận dữ liệu khi có API."><div className={styles.metricGridSmall}><MetricCard label="URL tạo từ website" value={formatNumber(overview?.generatedUrls || 0)} /><MetricCard label="URL đã index" value="Chưa kết nối Search Console" /></div>{dashboard.indexStatus.length === 0 ? <EmptyState title="Chưa có dữ liệu index" detail="Không dùng nhãn đã index khi chưa có Search Console API." /> : <div className={styles.tableWrap}><table><thead><tr><th>URL mới</th><th>Ngày tạo</th><th>Đã gửi index</th><th>Đã index</th></tr></thead><tbody>{dashboard.indexStatus.map((item) => <tr key={item.id}><td>{item.url}</td><td>{new Date(item.created_at).toLocaleDateString('vi-VN')}</td><td>{item.submitted ? 'Có' : 'Chưa'}</td><td>{item.indexed ? 'Có' : 'Chưa'}</td></tr>)}</tbody></table></div>}</ModuleCard>
      <ModuleCard title="System Health" description="Theo dõi những điểm quan trọng của hệ thống SEO."><div className={styles.healthList}>{health?.systemHealth.map((item) => <div className={styles.healthItem} key={item.name}><div><strong>{item.name}</strong><span>{item.detail}</span></div><Badge status={item.status}>{item.status}</Badge></div>)}</div></ModuleCard>
    </section>
  </main>;
}
