'use client';

import { useMemo } from 'react';
import { Badge, EmptyState, MetricCard, MiniBarChart, ModuleCard } from './Ui';
import type { SearchConsoleV5Data } from '../services/searchConsole';
import { getClusterProgress } from '../services/seoDashboardService';
import type { ContentOpportunity, DoNotTouchItem, GoogleAdsImportData, IndexSummaryManual, InternalLinkSuggestion, ProductSeoItem, SearchConsoleQuery, SearchConsoleV7Data, SeoCluster, SeoHealthSnapshot, SeoKeyword, SeoLog, SeoOverview, TodayTask } from '../types/seo';
import styles from '../seo-dashboard.module.css';

export type DashboardSeoFilters = {
  search: string;
  priority: string;
  status: string;
  pendingOnly: boolean;
  productIssuesOnly: boolean;
};

function formatNumber(value: number | null | undefined) { return new Intl.NumberFormat('vi-VN').format(Number(value || 0)); }
function formatCtr(value: number | null | undefined) { return `${Number(value || 0).toFixed(2)}%`; }
function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value || 0))); }
function levelByScore(score: number) { return score >= 80 ? 'ok' : score >= 55 ? 'pending' : 'warning'; }
function safeKey(table: string, id: unknown, slug: unknown, index: number) { return `${table}-${String(id ?? 'no-id')}-${String(slug ?? 'no-slug')}-${index}`; }
function uniqueBy<T>(items: T[], getKey: (item: T, index: number) => string) { const map = new Map<string, T>(); items.forEach((item, index) => { const key = getKey(item, index); if (!map.has(key)) map.set(key, item); }); return Array.from(map.values()); }
function productHref(product: ProductSeoItem) { return `/san-pham/${product.slug}`; }
function normalize(value: unknown) { return String(value || '').trim().toLowerCase(); }
function statusIncludes(itemStatus: string | undefined, keyword: string) { return normalize(itemStatus).includes(normalize(keyword)); }

export function SeoV51FilterBar({ filters, onChange }: { filters: DashboardSeoFilters; onChange: (next: DashboardSeoFilters) => void }) {
  return <ModuleCard title="Bộ lọc SEO v5.1" description="Lọc nhanh keyword, sản phẩm, cụm SEO và task từ dữ liệu thật.">
    <div className={styles.v51FilterBar}>
      <input value={filters.search} onChange={(event) => onChange({ ...filters, search: event.target.value })} placeholder="Tìm keyword, sản phẩm, cluster..." />
      <select value={filters.priority} onChange={(event) => onChange({ ...filters, priority: event.target.value })}>
        <option value="all">Tất cả ưu tiên</option>
        <option value="5">Ưu tiên 5</option>
        <option value="4">Ưu tiên 4</option>
        <option value="3">Ưu tiên 3</option>
        <option value="2">Ưu tiên 2</option>
        <option value="1">Ưu tiên 1</option>
      </select>
      <select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value })}>
        <option value="all">Tất cả trạng thái</option>
        <option value="đang đẩy">Đang đẩy</option>
        <option value="theo dõi">Theo dõi</option>
        <option value="tạm dừng">Tạm dừng</option>
        <option value="cần tối ưu">Cần tối ưu</option>
        <option value="đã top">Đã top</option>
      </select>
      <label className={styles.v51Toggle}><input type="checkbox" checked={filters.pendingOnly} onChange={(event) => onChange({ ...filters, pendingOnly: event.target.checked })} /> Chỉ việc chưa làm</label>
      <label className={styles.v51Toggle}><input type="checkbox" checked={filters.productIssuesOnly} onChange={(event) => onChange({ ...filters, productIssuesOnly: event.target.checked })} /> Sản phẩm cần tối ưu</label>
    </div>
  </ModuleCard>;
}

export function SearchConsoleCenter({ data }: { data: SearchConsoleV5Data | null }) {
  const source = data;
  const topQueries = useMemo(() => uniqueBy(source?.topQueries || [], (item) => `${item.query || ''}-${item.page || ''}`), [source]);
  const topPages = useMemo(() => uniqueBy(source?.topPages || [], (item) => item.page || ''), [source]);
  const fallbackMessage = 'Không dùng API ở phiên bản hiện tại. Hãy dùng Search Console Import Center để nhập dữ liệu thủ công.';

  return <ModuleCard title="Search Console Center v5" description="Trạng thái cũ đã chuyển sang hướng import thủ công, không OAuth, không billing." action={<Badge status="pending">Import thủ công</Badge>}>
    {!source ? <EmptyState title="Chưa import dữ liệu Search Console" detail={fallbackMessage} /> : <div className={styles.v5Stack}>
      <div className={styles.v5Warning}>{fallbackMessage}</div>
      <div className={styles.metricGridSmall}>
        <MetricCard label="Clicks tham khảo" value={formatNumber(source.overview.clicks)} />
        <MetricCard label="Impressions tham khảo" value={formatNumber(source.overview.impressions)} />
        <MetricCard label="CTR tham khảo" value={formatCtr(source.overview.ctr)} />
        <MetricCard label="Average Position tham khảo" value={source.overview.position || '-'} />
      </div>
      <MiniBarChart data={source.keywordTrend.slice(-28).map((item) => ({ date: item.date, impressions: item.impressions, clicks: item.clicks }))} label="Trend tham khảo 28 ngày" />
      <div className={styles.v5TwoTables}>
        <div><h3>Top Queries tham khảo</h3>{topQueries.length ? <table><tbody>{topQueries.map((item, index) => <tr key={safeKey('gsc-query', item.query, item.page, index)}><td>{item.query}</td><td>{item.page}</td><td>{formatNumber(item.impressions)}</td></tr>)}</tbody></table> : <EmptyState title="Chưa có query" detail="Dùng Search Console Import Center để nhập dữ liệu thật thủ công." />}</div>
        <div><h3>Top Pages tham khảo</h3>{topPages.length ? <table><tbody>{topPages.map((item, index) => <tr key={safeKey('gsc-page', item.page, item.query, index)}><td>{item.page}</td><td>{formatNumber(item.clicks)}</td><td>{formatNumber(item.impressions)}</td></tr>)}</tbody></table> : <EmptyState title="Chưa có page" detail="Dùng Search Console Import Center để nhập dữ liệu thật thủ công." />}</div>
      </div>
    </div>}
  </ModuleCard>;
}

export function KeywordIntelligence({ keywords, searchConsoleQueries = [], adsData = null }: { keywords: SeoKeyword[]; searchConsoleQueries?: SearchConsoleQuery[]; adsData?: GoogleAdsImportData | null }) {
  const cleanKeywords = useMemo(() => uniqueBy(keywords, (item) => item.id || item.keyword.trim().toLowerCase()), [keywords]);
  const clusters = useMemo(() => Array.from(new Set(cleanKeywords.map((item) => item.cluster || 'Chưa phân cụm').filter(Boolean))), [cleanKeywords]);
  const duplicates = useMemo(() => keywords.filter((item, index) => keywords.findIndex((row) => row.keyword.trim().toLowerCase() === item.keyword.trim().toLowerCase()) !== index), [keywords]);
  const statusGroups = [
    { label: 'Đang đẩy', test: (item: SeoKeyword) => statusIncludes(item.status, 'đang đẩy') },
    { label: 'Theo dõi', test: (item: SeoKeyword) => statusIncludes(item.status, 'theo dõi') },
    { label: 'Tạm dừng', test: (item: SeoKeyword) => statusIncludes(item.status, 'tạm dừng') },
    { label: 'Cần tối ưu', test: (item: SeoKeyword) => statusIncludes(item.status, 'cần tối ưu') || (item.priority >= 4 && (item.current_impression || 0) < 20) },
    { label: 'Đã top', test: (item: SeoKeyword) => statusIncludes(item.status, 'đã top') || (item.current_position || 99) <= 10 },
    { label: 'Tránh trùng', test: (item: SeoKeyword) => duplicates.some((dup) => dup.keyword.trim().toLowerCase() === item.keyword.trim().toLowerCase()) },
  ];
  const intents = ['Informational', 'Commercial', 'Transactional'];
  const gscKeywordRows = useMemo(() => {
    const manual = new Set(cleanKeywords.map((item) => normalize(item.keyword)).filter(Boolean));
    return {
      matched: searchConsoleQueries.filter((row) => manual.has(normalize(row.query))).slice(0, 5),
      fresh: searchConsoleQueries.filter((row) => !manual.has(normalize(row.query))).slice(0, 5),
    };
  }, [cleanKeywords, searchConsoleQueries]);
  const adsRows = useMemo(() => (adsData?.matrix || []).slice(0, 8), [adsData]);

  return <ModuleCard title="Keyword Intelligence" description="Đọc bảng seo_keywords thật, gom theo cụm, trạng thái, intent và ưu tiên.">
    {cleanKeywords.length === 0 ? <EmptyState title="Chưa có keyword" detail="Thêm keyword ở Keyword Center để module tự phân tích." /> : <div className={styles.v5Stack}>
      <div className={styles.v5PillGrid}>{clusters.map((cluster, index) => <span key={safeKey('keyword-cluster', cluster, cluster, index)}>{cluster}: {cleanKeywords.filter((item) => (item.cluster || 'Chưa phân cụm') === cluster).length}</span>)}</div>
      <div className={styles.v5FourColumns}>
        {statusGroups.slice(0, 4).map((group, index) => <div key={safeKey('keyword-status', group.label, group.label, index)}><h3>{group.label}</h3>{cleanKeywords.filter(group.test).slice(0, 5).map((item, itemIndex) => <p key={safeKey('keyword-row', item.id, item.keyword, itemIndex)}>{item.keyword}<small>{item.cluster || 'Chưa phân cụm'} · Ưu tiên {item.priority}</small></p>) || null}{cleanKeywords.filter(group.test).length === 0 ? <small>Chưa có dữ liệu.</small> : null}</div>)}
      </div>
      <div className={styles.v5FourColumns}>
        {statusGroups.slice(4).map((group, index) => <div key={safeKey('keyword-status-extra', group.label, group.label, index)}><h3>{group.label}</h3>{cleanKeywords.filter(group.test).slice(0, 5).map((item, itemIndex) => <p key={safeKey('keyword-extra', item.id, item.keyword, itemIndex)}>{item.keyword}<small>Pos {item.current_position || '-'} · {formatNumber(item.current_impression)} impression</small></p>)}{cleanKeywords.filter(group.test).length === 0 ? <small>Chưa có dữ liệu.</small> : null}</div>)}
        <div><h3>Intent</h3>{intents.map((intent, index) => <p key={safeKey('intent', intent, intent, index)}>{intent}<small>{cleanKeywords.filter((item) => (item.intent || '').toLowerCase() === intent.toLowerCase()).length} keyword</small></p>)}</div>
      </div>
      {searchConsoleQueries.length ? <div className={styles.v5TwoTables}>
        <div><h3>Keyword từ Search Console</h3>{gscKeywordRows.matched.length ? <table><tbody>{gscKeywordRows.matched.map((item, index) => <tr key={safeKey('keyword-gsc-match', item.query, item.page, index)}><td>{item.query}</td><td>{formatNumber(item.impressions)}</td><td>Pos {item.position}</td></tr>)}</tbody></table> : <small>Chưa khớp keyword thủ công.</small>}</div>
        <div><h3>Từ khóa mới phát hiện</h3>{gscKeywordRows.fresh.length ? <table><tbody>{gscKeywordRows.fresh.map((item, index) => <tr key={safeKey('keyword-gsc-fresh', item.query, item.page, index)}><td>{item.query}</td><td>{formatNumber(item.impressions)}</td><td>CTR {formatCtr(item.ctr)}</td></tr>)}</tbody></table> : <small>Chưa có query mới.</small>}</div>
      </div> : null}
      {adsRows.length ? <div className={styles.v5TwoTables}><div><h3>SEO + Ads signal</h3><table><tbody>{adsRows.map((item, index) => <tr key={safeKey('keyword-ads-matrix', item.id, item.keyword, index)}><td>{item.keyword}</td><td>{item.cluster}</td><td>{item.recommendation}</td></tr>)}</tbody></table></div><div><h3>Cơ hội từ Keyword Planner</h3><table><tbody>{(adsData?.opportunities || []).slice(0, 5).map((item, index) => <tr key={safeKey('keyword-ads-op', item.id, item.keyword, index)}><td>{item.keyword}</td><td>{item.score}/100</td><td>{item.recommendation}</td></tr>)}</tbody></table></div></div> : null}
      {duplicates.length ? <div className={styles.v5Warning}>Keyword bị trùng: {uniqueBy(duplicates, (item) => item.keyword.trim().toLowerCase()).map((item) => item.keyword).join(', ')}</div> : <Badge status="ok">Không thấy keyword trùng</Badge>}
    </div>}
  </ModuleCard>;
}

export function InternalLinkAIV5({ suggestions, clusters, products }: { suggestions: InternalLinkSuggestion[]; clusters: SeoCluster[]; products: ProductSeoItem[] }) {
  const safeSuggestions = useMemo(() => uniqueBy(suggestions, (item) => `${item.id}-${item.post_url}-${item.target_url}-${item.anchor}`), [suggestions]);
  const measuredLinks = clusters.filter((item) => item.internal_link_measured);
  const linkScore = clamp(40 + Math.min(safeSuggestions.length * 4, 35) + Math.min(measuredLinks.reduce((sum, item) => sum + item.internal_link_count, 0), 25));
  const productTargets = useMemo(() => uniqueBy(products.filter((item) => item.issues.includes('Thiếu link nội bộ') || item.issues.length > 0), (item) => `${item.id}-${item.slug}`).slice(0, 6), [products]);
  return <ModuleCard title="Internal Link AI v5" description="Phân tích liên kết nội bộ, gợi ý bài và sản phẩm nên liên kết." action={<Badge status={levelByScore(linkScore)}>Điểm Internal Link: {linkScore}/100</Badge>}>
    <div className={styles.v5Stack}>
      {safeSuggestions.length ? <div className={styles.tableWrap}><table><thead><tr><th>Bài nên liên kết</th><th>Anchor</th><th>URL đích</th></tr></thead><tbody>{safeSuggestions.slice(0, 8).map((item, index) => <tr key={safeKey('internal-link', item.id, item.target_url, index)}><td>{item.post_title}</td><td>{item.anchor}</td><td>{item.target_url}</td></tr>)}</tbody></table></div> : <EmptyState title="Chưa có gợi ý bài viết" detail="Khi bài chứa keyword, module sẽ đề xuất anchor phù hợp." />}
      <div className={styles.v5PillGrid}>{productTargets.map((item, index) => <a href={productHref(item)} target="_blank" rel="noreferrer" key={safeKey('internal-product', item.id, item.slug, index)}>{item.name}</a>)}</div>
    </div>
  </ModuleCard>;
}

export function ContentPlanner({ opportunities, keywords }: { opportunities: ContentOpportunity[]; keywords: SeoKeyword[] }) {
  const safeOpportunities = useMemo(() => uniqueBy(opportunities, (item) => `${item.id}-${item.cluster}-${item.suggestion}`), [opportunities]);
  const rows = safeOpportunities.slice(0, 10).map((item, index) => {
    const keyword = keywords.find((row) => row.cluster === item.cluster) || keywords[index % Math.max(1, keywords.length)];
    return { ...item, mainKeyword: keyword?.keyword || item.cluster, subKeyword: keyword?.intent || 'keyword phụ', targetUrl: keyword?.target_url || '/', status: item.level === 'critical' ? 'nên làm ngay' : 'lên lịch' };
  });
  return <ModuleCard title="Content Planner" description="Danh sách bài nên viết, ưu tiên, keyword chính/phụ và URL đích.">
    {rows.length === 0 ? <EmptyState title="Chưa có kế hoạch nội dung" detail="Thêm keyword/cụm SEO để sinh kế hoạch." /> : <div className={styles.tableWrap}><table><thead><tr><th>Ưu tiên</th><th>Bài nên viết</th><th>Keyword chính</th><th>Keyword phụ</th><th>URL đích</th><th>Trạng thái</th></tr></thead><tbody>{rows.map((item, index) => <tr key={safeKey('content-plan', item.id, item.cluster, index)}><td><Badge status={item.level === 'critical' ? 'error' : 'pending'}>{item.level}</Badge></td><td>{item.suggestion}</td><td>{item.mainKeyword}</td><td>{item.subKeyword}</td><td>{item.targetUrl}</td><td>{item.status}</td></tr>)}</tbody></table></div>}
  </ModuleCard>;
}

export function ProductQualityAIV5({ products }: { products: ProductSeoItem[] }) {
  const rows = useMemo(() => uniqueBy(products.filter((item) => item.issues.length > 0), (item) => `${item.id}-${item.slug}`).slice(0, 20), [products]);
  const checkLabels: Array<[keyof NonNullable<ProductSeoItem['checks']>, string]> = [['mainImage', 'Ảnh chính'], ['multipleImages', 'Nhiều ảnh'], ['alt', 'Alt'], ['description', 'Mô tả'], ['detailDescription', 'Nội dung'], ['specs', 'Thông số'], ['features', 'Đặc điểm'], ['category', 'Danh mục'], ['slug', 'Slug'], ['internalLink', 'Link'], ['faq', 'FAQ']];
  return <ModuleCard title="Product Quality AI" description="Đánh giá sản phẩm từ dữ liệu thật: ảnh, alt, mô tả, thông số, FAQ và internal link.">
    {rows.length === 0 ? <EmptyState title="Chưa thấy sản phẩm cần xử lý" detail="Dữ liệu sản phẩm gần đây tương đối ổn." /> : <div className={styles.productQualityCards}>{rows.map((item, index) => <article className={styles.productQualityCard} key={safeKey('product-quality', item.id, item.slug, index)}>
      <div className={styles.qualityHeader}><a className={styles.linkInline} href={productHref(item)} target="_blank" rel="noreferrer">{item.name}</a><Badge status={levelByScore(item.qualityScore || 0)}>{item.qualityScore || 0}/100</Badge></div>
      <p>{item.action}</p>
      <div className={styles.qualityChecklist}>{checkLabels.map(([key, label], checkIndex) => <span className={item.checks?.[key] ? styles.qualityOk : styles.qualityMissing} key={safeKey('quality-check', key, item.id, checkIndex)}>{item.checks?.[key] ? '✓' : '!'} {label}</span>)}</div>
      <small>{item.issues.slice(0, 5).join(', ')}</small>
    </article>)}</div>}
  </ModuleCard>;
}

export function ClusterHealth({ clusters, searchConsoleData, adsData = null }: { clusters: SeoCluster[]; searchConsoleData?: SearchConsoleV7Data | null; adsData?: GoogleAdsImportData | null }) {
  const safeClusters = useMemo(() => uniqueBy(clusters, (cluster) => `${cluster.id}-${cluster.main_url}`), [clusters]);
  const gscByCluster = useMemo(() => {
    const map = new Map<string, { clicks: number; impressions: number; position: number; count: number }>();
    safeClusters.forEach((cluster) => {
      const name = normalize(cluster.name);
      const url = normalize(cluster.main_url).replace(/^\//, '');
      const rows = (searchConsoleData?.queries || []).filter((row) => {
        const textValue = normalize(row.query + ' ' + (row.page || ''));
        return (name && textValue.includes(name)) || (url && textValue.includes(url)) || (url && textValue.includes(url.replace(/-/g, ' ')));
      });
      map.set(String(cluster.id || cluster.name), {
        clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
        impressions: rows.reduce((sum, row) => sum + row.impressions, 0),
        position: rows.length ? rows.reduce((sum, row) => sum + row.position, 0) / rows.length : 0,
        count: rows.length,
      });
    });
    return map;
  }, [safeClusters, searchConsoleData]);
  const adsByCluster = useMemo(() => {
    const map = new Map<string, { count: number; bestScore: number; recommendation: string }>();
    safeClusters.forEach((cluster) => {
      const name = normalize(cluster.name);
      const rows = (adsData?.opportunities || []).filter((row) => {
        const clusterText = normalize(row.cluster);
        const keywordText = normalize(row.keyword);
        return (name && clusterText.includes(name)) || (name && name.includes(clusterText)) || (name && keywordText.includes(name));
      });
      map.set(String(cluster.id || cluster.name), {
        count: rows.length,
        bestScore: rows[0]?.score || 0,
        recommendation: rows[0]?.recommendation || 'Chưa import',
      });
    });
    return map;
  }, [adsData, safeClusters]);
  return <ModuleCard title="Cluster Health" description="Điểm cụm tính từ sản phẩm, bài viết, keyword, task, log và internal link đã đo được.">
    {safeClusters.length === 0 ? <EmptyState title="Chưa có cụm SEO" detail="Thêm cụm trong Cluster Manager." /> : <div className={styles.v5ClusterHealth}>{safeClusters.map((cluster, index) => { const score = getClusterProgress(cluster); const gsc = gscByCluster.get(String(cluster.id || cluster.name)); const ads = adsByCluster.get(String(cluster.id || cluster.name)); return <div key={safeKey('cluster-health', cluster.id, cluster.main_url, index)}><strong>{cluster.name}</strong><Badge status={levelByScore(score)}>{score}/100</Badge><span><i style={{ width: `${score}%` }} /></span><small>Sản phẩm {cluster.product_count} · Bài {cluster.post_count} · Keyword {cluster.keyword_count || 0} · Task {cluster.task_count || 0} · Log {cluster.log_count || 0} · Internal link {cluster.internal_link_measured ? cluster.internal_link_count : 'Chưa đo'}</small><small>Search Console: {gsc?.count ? `${formatNumber(gsc.impressions)} impression · ${formatNumber(gsc.clicks)} click · Pos ${gsc.position.toFixed(1)}` : 'Chưa đo'}</small><small>Keyword Planner: {ads?.count ? `${ads.count} keyword · Score tốt nhất ${ads.bestScore}/100 · ${ads.recommendation}` : 'Chưa import'}</small></div>; })}</div>}
  </ModuleCard>;
}

export function DailySeoMission({ overview, health, opportunities, tasks, products, keywords, clusters, logs, doNotTouch }: { overview: SeoOverview | null; health: SeoHealthSnapshot | null; opportunities: ContentOpportunity[]; tasks: TodayTask[]; products: ProductSeoItem[]; keywords: SeoKeyword[]; clusters: SeoCluster[]; logs: SeoLog[]; doNotTouch: DoNotTouchItem[] }) {
  const missions = useMemo(() => {
    const weakProduct = products.find((item) => item.issues.length > 0);
    const highKeyword = keywords.find((item) => item.priority >= 4 && (item.current_impression || 0) < 20);
    const pendingTask = tasks.find((item) => !item.completed);
    const weakCluster = clusters.find((item) => item.priority >= 4 && (item.product_count < 8 || item.post_count < 3));
    const protectedUrl = doNotTouch.find((item) => item.status !== 'done' && item.status !== 'hoàn thành');
    const recentLog = logs[0];
    const raw = [
      weakProduct ? `Cập nhật ảnh thật, FAQ hoặc thông số cho sản phẩm ${weakProduct.name}.` : '',
      protectedUrl ? `Không sửa URL ${protectedUrl.url} vì đang trong Do Not Touch List.` : '',
      highKeyword ? `Thêm nội dung hoặc link nội bộ cho keyword "${highKeyword.keyword}".` : '',
      pendingTask ? `Hoàn thành task hôm nay: ${pendingTask.title}.` : '',
      weakCluster ? `Bổ sung bài hoặc sản phẩm cho cụm ${weakCluster.name}.` : '',
      health?.sitemap.sitemapOk && health.sitemap.robotsOk ? 'Sitemap và robots đang ổn, hôm nay không sửa nếu không cần.' : 'Kiểm tra sitemap.xml và robots.txt trước khi gửi index.',
      recentLog ? `Không sửa liên tục mục vừa ghi log: ${recentLog.target || recentLog.title || recentLog.action}.` : '',
      (overview?.blogPosts || 0) < 60 ? 'Viết/cập nhật 1 bài dự án có link về danh mục chính.' : '',
      'Import dữ liệu Search Console thủ công nếu cần phân tích sâu hơn.',
    ].filter(Boolean);
    return uniqueBy(raw, (mission) => mission).slice(0, 5);
  }, [clusters, doNotTouch, health, keywords, logs, overview, products, tasks]);
  return <ModuleCard title="Daily SEO Mission" description="5 nhiệm vụ sinh từ dữ liệu thật của website hôm nay."><div className={styles.v5MissionList}>{missions.map((mission, index) => <div key={safeKey('mission', mission, mission, index)}><b>{index + 1}</b><span>{mission}</span></div>)}</div></ModuleCard>;
}

export function DashboardAnalytics({ overview, health, clusters, keywords, tasks, logs, doNotTouch, searchConsoleV7, indexSummary }: { overview: SeoOverview | null; health: SeoHealthSnapshot | null; clusters: SeoCluster[]; keywords: SeoKeyword[]; tasks: TodayTask[]; logs: SeoLog[]; doNotTouch: DoNotTouchItem[]; searchConsoleV7?: SearchConsoleV7Data | null; indexSummary?: IndexSummaryManual | null }) {
  const pendingTasks = tasks.filter((item) => !item.completed).length;
  const completedTasks = tasks.filter((item) => item.completed).length;
  const uniqueQueries = searchConsoleV7 ? new Set(searchConsoleV7.queries.map((item) => normalize(item.query)).filter(Boolean)).size : null;
  const uniquePages = searchConsoleV7 ? new Set(searchConsoleV7.pages.filter((item) => item.impressions > 0).map((item) => normalize(item.page)).filter(Boolean)).size : null;
  const hasIndexSummary = Boolean(indexSummary && (indexSummary.indexedUrls !== null || indexSummary.notIndexedUrls !== null || indexSummary.mainIssue || indexSummary.lastCheckedDate));

  return <ModuleCard title="Dashboard Analytics" description="Dữ liệu website lấy tự động từ Supabase/website; dữ liệu Google chỉ dùng import thủ công.">
    <div className={styles.metricGridSmall}>
      <MetricCard label="Tổng sản phẩm" value={formatNumber(overview?.products || 0)} />
      <MetricCard label="Tổng bài viết" value={formatNumber(overview?.blogPosts || 0)} />
      <MetricCard label="Tổng danh mục" value={formatNumber(overview?.categories || 0)} />
      <MetricCard label="Tổng cụm SEO" value={formatNumber(overview?.clusters ?? uniqueBy(clusters, (item) => `${item.id}-${item.main_url}`).length)} />
      <MetricCard label="Tổng keyword" value={formatNumber(overview?.keywords ?? keywords.length)} />
      <MetricCard label="Tổng task" value={formatNumber(overview?.tasks ?? tasks.length)} />
      <MetricCard label="Tổng log SEO" value={formatNumber(overview?.logs ?? logs.length)} />
      <MetricCard label="URL tạo từ website" value={formatNumber(overview?.generatedUrls || 0)} hint="Không đồng nghĩa với URL Google đã index." />
      <MetricCard label="Sitemap" value={health?.sitemap.sitemapOk ? 'OK' : 'Cần kiểm tra'} />
      <MetricCard label="Robots" value={health?.sitemap.robotsOk ? 'OK' : 'Cần kiểm tra'} />
      <MetricCard label="Index" value={searchConsoleV7 ? 'Đang dùng Search Console import thủ công' : 'Chưa có dữ liệu index thật'} hint="URL có impression là URL đã được Google hiển thị; URL không có impression chưa chắc là chưa index." />
      <MetricCard label="Task chưa làm" value={formatNumber(pendingTasks + doNotTouch.length)} />
      <MetricCard label="Task hoàn thành" value={completedTasks ? formatNumber(completedTasks) : 'Chưa có task hoàn thành'} />
    </div>
    {searchConsoleV7 ? <div className={styles.indexAnalyticsBox}>
      <strong>Dữ liệu Search Console import thủ công</strong>
      <div className={styles.metricGridSmall}>
        <MetricCard label="Tổng query import" value={formatNumber(uniqueQueries || 0)} />
        <MetricCard label="Page có impression" value={formatNumber(uniquePages || 0)} />
        <MetricCard label="Tổng impressions" value={formatNumber(searchConsoleV7.overview.impressions)} />
        <MetricCard label="Tổng clicks" value={formatNumber(searchConsoleV7.overview.clicks)} />
        <MetricCard label="CTR trung bình" value={formatCtr(searchConsoleV7.overview.ctr)} />
        <MetricCard label="Position trung bình" value={searchConsoleV7.overview.position || '-'} />
        <MetricCard label="Cập nhật lần cuối" value={searchConsoleV7.overview.lastUpdated ? new Date(searchConsoleV7.overview.lastUpdated).toLocaleString('vi-VN') : '-'} />
      </div>
    </div> : null}
    {hasIndexSummary ? <div className={styles.indexAnalyticsBox}>
      <strong>Index Summary thủ công</strong>
      <div className={styles.metricGridSmall}>
        {indexSummary?.indexedUrls !== null ? <MetricCard label="URL đã index" value={formatNumber(indexSummary?.indexedUrls || 0)} /> : null}
        {indexSummary?.notIndexedUrls !== null ? <MetricCard label="URL chưa index" value={formatNumber(indexSummary?.notIndexedUrls || 0)} /> : null}
        {indexSummary?.mainIssue ? <MetricCard label="Lý do chính" value={indexSummary.mainIssue} /> : null}
        {indexSummary?.lastCheckedDate ? <MetricCard label="Ngày kiểm tra" value={new Date(indexSummary.lastCheckedDate).toLocaleDateString('vi-VN')} /> : null}
      </div>
    </div> : null}
    <p className={styles.indexSummaryNote}>Số URL tạo từ website không đồng nghĩa với số URL Google đã index.</p>
  </ModuleCard>;
}
