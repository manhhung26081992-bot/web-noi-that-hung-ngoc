'use client';

import { memo, useMemo, useState } from 'react';
import { Badge, EmptyState, ModuleCard } from './Ui';
import type {
  ContentOpportunity,
  GoogleAdsImportData,
  IndexSummaryManual,
  InternalLinkSuggestion,
  ProductSeoItem,
  SearchConsoleV7Data,
  SeoBlogQualityItem,
  SeoCluster,
  SeoKeyword,
  SeoLog,
  SeoOverview,
  TodayTask,
} from '../types/seo';
import { buildV9ActionPlan, type V9SeoAction } from '../services/seoActionPlanService';
import styles from '../seo-dashboard.module.css';

type Props = {
  overview: SeoOverview | null;
  products: ProductSeoItem[];
  blogs: SeoBlogQualityItem[];
  keywords: SeoKeyword[];
  clusters: SeoCluster[];
  tasks: TodayTask[];
  logs: SeoLog[];
  internalLinks: InternalLinkSuggestion[];
  opportunities: ContentOpportunity[];
  searchConsole: SearchConsoleV7Data | null;
  googleAds: GoogleAdsImportData | null;
  indexSummary: IndexSummaryManual | null;
};

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat('vi-VN').format(value || 0);
}

function actionStatus(score: number) {
  if (score >= 80) return 'warning';
  if (score >= 55) return 'pending';
  return 'ok';
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    product: 'Sản phẩm',
    blog: 'Bài viết',
    category: 'Danh mục',
    keyword: 'Từ khóa',
    internal_link: 'Liên kết nội bộ',
    ads: 'Ads',
    technical: 'Kỹ thuật',
  };
  return labels[type] || type;
}

function ActionCard({ item }: { item: V9SeoAction }) {
  return (
    <article className={styles.v9ActionCard}>
      <div className={styles.v9StatusRow}>
        <Badge status={actionStatus(item.priorityScore)}>{item.priorityScore}/100</Badge>
        <span>{typeLabel(item.type)}</span>
        <span>{item.difficulty}</span>
      </div>
      <h4>{item.title}</h4>
      <p>{item.reason}</p>
      <strong>Việc cần làm: {item.action}</strong>
      <div className={styles.v9MetaRow}>
        <span>Cụm: {item.cluster}</span>
        <span>Nguồn: {item.source}</span>
      </div>
      {item.url ? <a className={styles.link} href={item.url} target="_blank" rel="noreferrer">Mở trang liên quan</a> : null}
    </article>
  );
}

function ActionList({ title, items, empty }: { title: string; items: V9SeoAction[]; empty: string }) {
  return (
    <div className={styles.v9Panel}>
      <h3>{title}</h3>
      {items.length ? <div className={styles.v9ActionList}>{items.map((item) => <ActionCard key={item.id} item={item} />)}</div> : <EmptyState title={empty} detail="Import thêm Search Console hoặc Google Ads để dashboard phân tích sâu hơn." />}
    </div>
  );
}

function SeoV9Modules(props: Props) {
  const [tab, setTab] = useState<'actions' | 'weekly' | 'content' | 'links' | 'matrix'>('actions');
  const plan = useMemo(() => buildV9ActionPlan({
    overview: props.overview,
    products: props.products,
    blogs: props.blogs,
    keywords: props.keywords,
    clusters: props.clusters,
    tasks: props.tasks,
    logs: props.logs,
    internalLinks: props.internalLinks,
    opportunities: props.opportunities,
    searchConsole: props.searchConsole,
    googleAds: props.googleAds,
    indexSummary: props.indexSummary,
  }), [props]);

  return (
    <ModuleCard title="Kế hoạch SEO AI v9.0" description="Trung tâm ra quyết định SEO hằng ngày từ Supabase, Search Console nhập thủ công và Google Ads nhập thủ công.">
      <div className={styles.v9SourceBar}>
        <Badge status={plan.dataStatus.hasSearchConsole ? 'ok' : 'pending'}>{plan.dataStatus.hasSearchConsole ? 'Đang dùng dữ liệu Search Console nhập thủ công' : 'Chưa nhập dữ liệu Search Console'}</Badge>
        <Badge status={plan.dataStatus.hasGoogleAds ? 'ok' : 'pending'}>{plan.dataStatus.hasGoogleAds ? 'Đang dùng dữ liệu Google Ads nhập thủ công' : 'Chưa nhập dữ liệu Google Ads'}</Badge>
        <Badge status={plan.dataStatus.hasIndexSummary ? 'ok' : 'pending'}>{plan.dataStatus.hasIndexSummary ? 'Có tóm tắt index thủ công' : 'Chưa có dữ liệu index thật'}</Badge>
      </div>

      <div className={styles.v9Tabs} role="tablist" aria-label="SEO v9 modules">
        <button className={tab === 'actions' ? styles.v9ActiveTab : ''} onClick={() => setTab('actions')}>Kế hoạch hành động</button>
        <button className={tab === 'weekly' ? styles.v9ActiveTab : ''} onClick={() => setTab('weekly')}>Kế hoạch tuần</button>
        <button className={tab === 'content' ? styles.v9ActiveTab : ''} onClick={() => setTab('content')}>Ý tưởng nội dung</button>
        <button className={tab === 'links' ? styles.v9ActiveTab : ''} onClick={() => setTab('links')}>Liên kết nội bộ</button>
        <button className={tab === 'matrix' ? styles.v9ActiveTab : ''} onClick={() => setTab('matrix')}>Ma trận SEO + Ads</button>
      </div>

      {tab === 'actions' ? (
        <div className={styles.v9Stack}>
          <ActionList title="10 việc SEO nên làm hôm nay" items={plan.today} empty="Chưa đủ dữ liệu để tạo việc hôm nay" />
          <ActionList title="10 việc SEO nên làm trong tuần" items={plan.week} empty="Chưa đủ dữ liệu để tạo kế hoạch tuần" />
          <section className={styles.gridThree}>
            <ActionList title="5 sản phẩm cần tối ưu nhất" items={plan.productActions} empty="Chưa có sản phẩm cần tối ưu" />
            <ActionList title="5 landing page cần tối ưu" items={plan.categoryActions} empty="Chưa có landing page cần tối ưu" />
            <ActionList title="5 bài viết cần cập nhật" items={plan.blogActions} empty="Chưa có bài viết cần cập nhật" />
          </section>
          <section className={styles.gridThree}>
            <ActionList title="5 keyword nên SEO trước" items={plan.seoKeywords} empty="Chưa có keyword SEO rõ ràng" />
            <ActionList title="5 keyword nên chạy Ads thử" items={plan.adsKeywords} empty="Chưa có keyword Ads phù hợp" />
            <ActionList title="5 keyword chỉ nên theo dõi" items={plan.watchKeywords} empty="Chưa có keyword theo dõi" />
          </section>
        </div>
      ) : null}

      {tab === 'weekly' ? (
        <div className={styles.v9WeeklyGrid}>
          {plan.weeklyPlan.map((day) => (
            <article className={styles.v9WeekCard} key={day.day}>
              <h3>{day.day}</h3>
              <strong>{day.mainTask.title}</strong>
              <p>{day.reason}</p>
              <ul>{day.sideTasks.map((task) => <li key={task.id}>{task.title}</li>)}</ul>
              <button className={styles.secondaryButton} onClick={() => navigator.clipboard?.writeText(day.mainTask.title)}>Sao chép việc</button>
            </article>
          ))}
        </div>
      ) : null}

      {tab === 'content' ? (
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>Tiêu đề SEO</th><th>Slug</th><th>Keyword chính</th><th>Liên kết nội bộ</th><th>Lý do</th></tr></thead>
            <tbody>{plan.contentIdeas.map((idea) => <tr key={idea.id}><td><strong>{idea.title}</strong><br /><small>{idea.metaDescription}</small></td><td>{idea.slug}</td><td>{idea.mainKeyword}</td><td>{idea.internalLinks.join(', ')}</td><td>{idea.reason}</td></tr>)}</tbody>
          </table>
        </div>
      ) : null}

      {tab === 'links' ? (
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>Trang nguồn</th><th>Trang đích</th><th>Anchor</th><th>Ưu tiên</th><th>Lý do</th></tr></thead>
            <tbody>{plan.internalLinks.map((item) => <tr key={item.id}><td>{item.sourceUrl}</td><td>{item.targetUrl}</td><td>{item.anchorText}</td><td>{item.priorityScore}/100</td><td>{item.reason}</td></tr>)}</tbody>
          </table>
        </div>
      ) : null}

      {tab === 'matrix' ? (
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>Từ khóa</th><th>Nhóm đề xuất</th><th>Lượt tìm</th><th>CPC/Giá thầu</th><th>Cạnh tranh</th><th>URL phù hợp</th><th>Lý do</th></tr></thead>
            <tbody>{plan.adsMatrix.map((item) => <tr key={item.id}><td>{item.keyword}</td><td><Badge status={item.group === 'Theo dõi' ? 'pending' : 'ok'}>{item.group}</Badge></td><td>{formatNumber(item.searchVolume)}</td><td>{formatNumber(item.cpc)}</td><td>{item.competition || '-'}</td><td>{item.targetUrl || '-'}</td><td>{item.reason}</td></tr>)}</tbody>
          </table>
        </div>
      ) : null}
    </ModuleCard>
  );
}

export default memo(SeoV9Modules);
