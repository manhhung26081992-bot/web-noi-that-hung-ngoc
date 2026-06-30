'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, EmptyState, MetricCard, ModuleCard } from './Ui';
import {
  GOOGLE_ADS_IMPORT_STORAGE_KEY,
  analyzeGoogleAdsImport,
  googleAdsSampleData,
  parseGoogleAdsImport,
} from '../services/googleAdsImportService';
import type { GoogleAdsImportData, GoogleAdsKeywordImportRow, GoogleAdsOpportunity, SearchConsoleV7Data, SeoCluster, SeoKeyword } from '../types/seo';
import styles from '../seo-dashboard.module.css';
import { countImportRows, readCsvFileAsText } from '../services/importFileReader';

type Props = {
  keywords: SeoKeyword[];
  clusters: SeoCluster[];
  searchConsoleData?: SearchConsoleV7Data | null;
  onData?: (data: GoogleAdsImportData | null) => void;
};

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0));
}

function formatMoney(value: number | null | undefined) {
  if (!value) return '-';
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value) + ' đ';
}

function key(table: string, id: unknown, slug: unknown, index: number) {
  return table + '-' + String(id ?? 'no-id') + '-' + String(slug ?? 'no-slug') + '-' + index;
}

function RecommendationBadge({ value }: { value: string }) {
  const status = value === 'Không ưu tiên' ? 'warning' : value === 'Theo dõi' ? 'pending' : 'ok';
  return <Badge status={status}>{value}</Badge>;
}

function KeywordTable({ title, rows, mode = 'row' }: { title: string; rows: GoogleAdsKeywordImportRow[] | GoogleAdsOpportunity[]; mode?: 'row' | 'opportunity' }) {
  return (
    <div className={styles.tableWrap}>
      <h3 className={styles.adsV8TableTitle}>{title}</h3>
      {rows.length ? (
        <table>
          <thead>
            <tr><th>Keyword</th><th>Cluster</th><th>Volume</th><th>CPC</th><th>Cạnh tranh</th><th>Gợi ý</th></tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((item, index) => {
              const row = mode === 'opportunity' ? (item as GoogleAdsOpportunity).row : item as GoogleAdsKeywordImportRow;
              const op = mode === 'opportunity' ? item as GoogleAdsOpportunity : null;
              return (
                <tr key={key('ads-table', row.id, row.keyword, index)}>
                  <td>{row.keyword}</td>
                  <td>{row.cluster || '-'}</td>
                  <td>{formatNumber(row.avg_monthly_searches)}</td>
                  <td>{formatMoney(row.cpc || row.high_top_of_page_bid || row.low_top_of_page_bid)}</td>
                  <td>{row.competition || '-'}</td>
                  <td>{op ? <RecommendationBadge value={op.recommendation} /> : <span>{row.commercialIntent >= 60 ? 'Intent mua hàng' : 'Theo dõi'}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : <EmptyState title="Chưa có dữ liệu" detail="Nhóm này sẽ hiện sau khi import đúng cột keyword và chỉ số liên quan." />}
    </div>
  );
}

export default function GoogleAdsV8ImportCenter({ keywords, clusters, searchConsoleData, onData }: Props) {
  const [rawText, setRawText] = useState('');
  const [data, setData] = useState<GoogleAdsImportData | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'overview' | 'planner' | 'performance' | 'matrix'>('overview');
  const [fileName, setFileName] = useState('');
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GOOGLE_ADS_IMPORT_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { rawText?: string; data?: GoogleAdsImportData; fileName?: string; rowCount?: number };
      setRawText(parsed.rawText || '');
      setData(parsed.data || null);
      setFileName(parsed.fileName || '');
      setRowCount(parsed.rowCount || countImportRows(parsed.rawText || ''));
      onData?.(parsed.data || null);
    } catch {
      setData(null);
      onData?.(null);
    }
  }, [onData]);

  const analyzed = useMemo(() => data, [data]);
  const summary = analyzed?.summary;

  function analyze() {
    const next = analyzeGoogleAdsImport(rawText, searchConsoleData, keywords, clusters);
    if (!next) {
      setError('Chưa đọc được dữ liệu. Hãy kiểm tra có cột keyword hoặc Từ khóa.');
      setData(null);
      onData?.(null);
      return;
    }
    setError('');
    const nextRowCount = parseGoogleAdsImport(rawText).length;
    setData(next);
    setRowCount(nextRowCount);
    localStorage.setItem(GOOGLE_ADS_IMPORT_STORAGE_KEY, JSON.stringify({ rawText, data: next, fileName, rowCount: nextRowCount }));
    onData?.(next);
  }

  function clearImport() {
    setRawText('');
    setData(null);
    setFileName('');
    setRowCount(0);
    setError('');
    localStorage.removeItem(GOOGLE_ADS_IMPORT_STORAGE_KEY);
    onData?.(null);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await readCsvFileAsText(file);
      const next = analyzeGoogleAdsImport(text, searchConsoleData, keywords, clusters);
      if (!next) {
        setError('File chưa đúng định dạng. Vui lòng export CSV từ Google hoặc copy bảng vào ô nhập.');
        return;
      }
      const nextRowCount = parseGoogleAdsImport(text).length;
      setRawText(text);
      setFileName(file.name);
      setRowCount(nextRowCount);
      setData(next);
      setError('');
      localStorage.setItem(GOOGLE_ADS_IMPORT_STORAGE_KEY, JSON.stringify({ rawText: text, data: next, fileName: file.name, rowCount: nextRowCount }));
      onData?.(next);
    } catch {
      setError('Không đọc được file CSV. Nếu dùng Excel, hãy lưu thành CSV trước.');
    } finally {
      event.target.value = '';
    }
  }

  function useSample() {
    setRawText(googleAdsSampleData);
    setFileName('du-lieu-mau-google-ads.csv');
    setRowCount(parseGoogleAdsImport(googleAdsSampleData).length);
    const next = analyzeGoogleAdsImport(googleAdsSampleData, searchConsoleData, keywords, clusters);
    setData(next);
    setError('');
    if (next) localStorage.setItem(GOOGLE_ADS_IMPORT_STORAGE_KEY, JSON.stringify({ rawText: googleAdsSampleData, data: next, fileName: 'du-lieu-mau-google-ads.csv', rowCount: parseGoogleAdsImport(googleAdsSampleData).length }));
    onData?.(next);
  }

  return (
    <ModuleCard
      title="Google Ads & Keyword Planner Import Center"
      description="Vào Google Ads / Keyword Planner → Export keyword plan hoặc report → copy dữ liệu rồi dán vào đây."
      action={<Badge status={data ? 'ok' : 'pending'}>{data ? 'Đang dùng dữ liệu import thủ công' : 'Chưa import dữ liệu Google Ads'}</Badge>}
    >
      <div className={styles.scV7Stack}>
        <div className={styles.scV7Status}>
          {data ? 'Cập nhật lần cuối: ' + new Date(data.lastUpdated).toLocaleString('vi-VN') : 'Chưa import dữ liệu Google Ads / Keyword Planner.'}
        </div>
        <div className={styles.scImportBox}>
          <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder="Dán CSV hoặc tab-separated text từ Google Ads / Keyword Planner vào đây..." />
          <div className={styles.fileImportRow}>
            <label className={styles.fileImportButton}>
              Tải file Google Ads / Keyword Planner CSV
              <input type="file" accept=".csv,text/csv,text/tab-separated-values" onChange={handleFileUpload} />
            </label>
            <span className={styles.fileImportMeta}>
              {fileName ? fileName + ' · ' + rowCount + ' dòng' : 'Nếu dùng Excel, hãy lưu thành CSV trước.'}
            </span>
          </div>
          <div className={styles.scImportActions}>
            <button className={styles.primaryButton} type="button" onClick={analyze}>Phân tích dữ liệu</button>
            <button className={styles.secondaryButton} type="button" onClick={useSample}>Dùng dữ liệu mẫu</button>
            <button className={styles.secondaryButton} type="button" onClick={clearImport}>Xóa dữ liệu import</button>
          </div>
          {error ? <div className={styles.alert}>{error}</div> : null}
        </div>

        {summary ? (
          <>
            <div className={styles.metricGridSmall}>
              <MetricCard label="Keyword import" value={formatNumber(summary.keywordCount)} />
              <MetricCard label="Tổng search volume" value={formatNumber(summary.totalSearchVolume)} />
              <MetricCard label="CPC trung bình" value={formatMoney(summary.averageCpc)} />
              <MetricCard label="Cạnh tranh TB" value={summary.averageCompetitionIndex === null ? '-' : Math.round(summary.averageCompetitionIndex)} />
              <MetricCard label="Tổng clicks" value={formatNumber(summary.totalClicks)} />
              <MetricCard label="Tổng impressions" value={formatNumber(summary.totalImpressions)} />
              <MetricCard label="Tổng cost" value={formatMoney(summary.totalCost)} />
              <MetricCard label="Tổng conversions" value={formatNumber(summary.totalConversions)} />
            </div>

            <div className={styles.scV7Tabs}>
              <button type="button" className={tab === 'overview' ? styles.scV7TabActive : ''} onClick={() => setTab('overview')}>Tổng quan</button>
              <button type="button" className={tab === 'planner' ? styles.scV7TabActive : ''} onClick={() => setTab('planner')}>Keyword Planner</button>
              <button type="button" className={tab === 'performance' ? styles.scV7TabActive : ''} onClick={() => setTab('performance')}>Ads Performance</button>
              <button type="button" className={tab === 'matrix' ? styles.scV7TabActive : ''} onClick={() => setTab('matrix')}>SEO + Ads Matrix</button>
            </div>

            {tab === 'overview' ? (
              <div className={styles.scV7OpportunityList}>
                {analyzed.opportunities.slice(0, 8).map((item, index) => (
                  <article key={key('ads-opportunity', item.id, item.keyword, index)}>
                    <strong>{item.keyword}</strong>
                    <RecommendationBadge value={item.recommendation} />
                    <p>Score {item.score}/100 · {item.cluster}</p>
                    <span>{item.reason}</span>
                    <small>{item.action}</small>
                  </article>
                ))}
              </div>
            ) : null}

            {tab === 'planner' ? (
              <div className={styles.v5TwoTables}>
                <KeywordTable title="Top keyword theo search volume" rows={analyzed.topVolume} />
                <KeywordTable title="CPC thấp nhưng volume tốt" rows={analyzed.lowCpcGoodVolume} />
                <KeywordTable title="Cạnh tranh thấp/trung bình" rows={analyzed.lowCompetition} />
                <KeywordTable title="Keyword thương mại cao" rows={analyzed.highCommercial} />
                <KeywordTable title="Keyword nên SEO" rows={analyzed.shouldSeo} mode="opportunity" />
                <KeywordTable title="Keyword nên chạy Ads" rows={analyzed.shouldAds} mode="opportunity" />
              </div>
            ) : null}

            {tab === 'performance' ? (
              summary.hasAdsPerformance ? <div className={styles.v5TwoTables}>
                <KeywordTable title="Tốn tiền nhưng chưa chuyển đổi" rows={analyzed.wasteKeywords} />
                <KeywordTable title="CTR thấp" rows={analyzed.lowCtrKeywords} />
                <KeywordTable title="CPC cao" rows={analyzed.highCpcKeywords} />
                <KeywordTable title="Conversion tốt" rows={analyzed.goodConversionKeywords} />
                <KeywordTable title="Impression cao, click thấp" rows={analyzed.highImpressionLowClickKeywords} />
                <div className={styles.tableWrap}>
                  <h3 className={styles.adsV8TableTitle}>Nhóm quảng cáo cần tối ưu</h3>
                  <table><thead><tr><th>Nhóm</th><th>Cost</th><th>Conv.</th><th>Click</th><th>Impr.</th><th>Lý do</th></tr></thead><tbody>{analyzed.adGroupsToOptimize.map((item, index) => <tr key={key('adgroup', item.name, item.reason, index)}><td>{item.name}</td><td>{formatMoney(item.cost)}</td><td>{formatNumber(item.conversions)}</td><td>{formatNumber(item.clicks)}</td><td>{formatNumber(item.impressions)}</td><td>{item.reason}</td></tr>)}</tbody></table>
                </div>
              </div> : <EmptyState title="Chưa có dữ liệu Ads Performance" detail="Nếu import thêm clicks, impressions, cost, conversions thì phần này sẽ tự phân tích." />
            ) : null}

            {tab === 'matrix' ? (
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>Keyword</th><th>Cluster</th><th>SC Position</th><th>SC Impr.</th><th>SC Click</th><th>Ads Volume</th><th>CPC</th><th>Competition</th><th>Gợi ý</th><th>Lý do</th></tr></thead>
                  <tbody>
                    {analyzed.matrix.map((item, index) => (
                      <tr key={key('ads-matrix', item.id, item.keyword, index)}>
                        <td>{item.keyword}</td><td>{item.cluster}</td><td>{item.searchConsolePosition || '-'}</td><td>{formatNumber(item.searchConsoleImpressions)}</td><td>{formatNumber(item.searchConsoleClicks)}</td><td>{formatNumber(item.adsSearchVolume)}</td><td>{formatMoney(item.cpc)}</td><td>{item.competition || '-'}</td><td><RecommendationBadge value={item.recommendation} /></td><td>{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        ) : <EmptyState title="Chưa có dữ liệu Google Ads" detail="Bạn có thể dùng dữ liệu mẫu để kiểm tra nhanh hoặc dán file export từ Keyword Planner." />}
      </div>
    </ModuleCard>
  );
}
