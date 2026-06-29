'use client';

import { Badge, EmptyState, MetricCard, MiniBarChart, ModuleCard } from './Ui';
import type { SearchConsoleV5Data } from '../services/searchConsole';
import styles from '../seo-dashboard.module.css';

function formatNumber(value: number) { return new Intl.NumberFormat('vi-VN').format(value || 0); }
function safeKey(table: string, id: unknown, slug: unknown, index: number) { return `${table}-${String(id || 'no-id')}-${String(slug || 'no-slug')}-${index}`; }
function uniqueBy<T>(items: T[], getKey: (item: T, index: number) => string) { const map = new Map<string, T>(); items.forEach((item, index) => { const key = getKey(item, index); if (!map.has(key)) map.set(key, item); }); return Array.from(map.values()); }

export function SearchConsoleV5Panel({ data }: { data: SearchConsoleV5Data | null }) {
  const source = data;
  const topQueries = uniqueBy(source?.topQueries || [], (item) => `${item.query || ''}-${item.page || ''}`);
  const topPages = uniqueBy(source?.topPages || [], (item) => item.page || '');
  const newQueries = uniqueBy(source?.newQueries || [], (item) => `${item.query || ''}-${item.page || ''}`);
  const losingPages = uniqueBy(source?.pagesLosingImpression || [], (item) => `${item.page}-${item.query || ''}`);
  return <ModuleCard title="Search Console v5" description="Kiến trúc sẵn sàng cho Google Search Console API." action={<Badge status={source?.status === 'connected' ? 'connected' : 'pending'}>{source?.message || 'Chưa kết nối Search Console API - đang dùng dữ liệu thủ công/mock.'}</Badge>}>
    {!source ? <EmptyState title="Chưa có dữ liệu Search Console" detail="Module đang chờ dữ liệu mock hoặc API thật." /> : <>
      <div className={styles.metricGridSmall}>
        <MetricCard label="Clicks" value={formatNumber(source.overview.clicks)} />
        <MetricCard label="Impressions" value={formatNumber(source.overview.impressions)} />
        <MetricCard label="CTR" value={`${source.overview.ctr}%`} />
        <MetricCard label="Position" value={source.overview.position} />
      </div>
      <div className={styles.gridTwoTight}>
        <MiniBarChart data={source.keywordTrend.map((item) => ({ date: item.date, impressions: item.impressions, clicks: item.clicks }))} label="Keyword Trend" />
        <MiniBarChart data={source.pageTrend.map((item) => ({ date: item.date, impressions: item.impressions, clicks: item.clicks }))} label="Page Trend" />
      </div>
      <div className={styles.searchConsoleTables}>
        <div><h3>Top Queries</h3><table><tbody>{topQueries.map((item, index) => <tr key={safeKey('sc-query', item.query, item.page, index)}><td>{item.query}</td><td>{item.page}</td><td>{formatNumber(item.impressions)}</td></tr>)}</tbody></table></div>
        <div><h3>Top Pages</h3><table><tbody>{topPages.map((item, index) => <tr key={safeKey('sc-page', item.page, item.query, index)}><td>{item.page}</td><td>{formatNumber(item.clicks)}</td><td>{formatNumber(item.impressions)}</td></tr>)}</tbody></table></div>
        <div><h3>New Queries</h3><table><tbody>{newQueries.map((item, index) => <tr key={safeKey('sc-new-query', item.query, item.page, index)}><td>{item.query}</td><td>{item.page}</td></tr>)}</tbody></table></div>
        <div><h3>Pages Losing Impression</h3><table><tbody>{losingPages.map((item, index) => <tr key={safeKey('sc-losing-page', item.page, item.query, index)}><td>{item.page}</td><td>{item.query || '-'}</td></tr>)}</tbody></table></div>
      </div>
    </>}
  </ModuleCard>;
}

