'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, EmptyState, MetricCard, ModuleCard } from './Ui';
import {
  GOOGLE_ADS_IMPORT_STORAGE_KEY,
  analyzeGoogleAdsImport,
  googleAdsSampleData,
  mergeGoogleAdsImportData,
  normalizeGoogleAdsImportData,
  parseGoogleAdsImport,
} from '../services/googleAdsImportService';
import type { GoogleAdsImportData, GoogleAdsImportMode, GoogleAdsImportSource, GoogleAdsKeywordImportRow, GoogleAdsOpportunity, SearchConsoleV7Data, SeoCluster, SeoKeyword } from '../types/seo';
import styles from '../seo-dashboard.module.css';
import { countImportRows, readCsvFileAsText } from '../services/importFileReader';

type Props = {
  keywords: SeoKeyword[];
  clusters: SeoCluster[];
  searchConsoleData?: SearchConsoleV7Data | null;
  onData?: (data: GoogleAdsImportData | null) => void;
};

type LastImportResult = {
  source: GoogleAdsImportSource;
  addedCount: number;
  updatedCount: number;
  totalCount: number;
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

function modeLabel(mode: GoogleAdsImportMode) {
  return mode === 'merge' ? 'Gộp vào dữ liệu hiện có' : 'Thay thế dữ liệu cũ';
}

function KeywordTable({ title, rows, mode = 'row' }: { title: string; rows: GoogleAdsKeywordImportRow[] | GoogleAdsOpportunity[]; mode?: 'row' | 'opportunity' }) {
  return (
    <div className={styles.tableWrap}>
      <h3 className={styles.adsV8TableTitle}>{title}</h3>
      {rows.length ? (
        <table>
          <thead>
            <tr><th>Keyword</th><th>Cụm</th><th>Lượt tìm</th><th>CPC</th><th>Cạnh tranh</th><th>Gợi ý</th></tr>
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
                  <td>{op ? <RecommendationBadge value={op.recommendation} /> : <span>{row.commercialIntent >= 60 ? 'Ý định mua hàng' : 'Theo dõi'}</span>}</td>
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
  const [importMode, setImportMode] = useState<GoogleAdsImportMode>('merge');
  const [lastImportResult, setLastImportResult] = useState<LastImportResult | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GOOGLE_ADS_IMPORT_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { rawText?: string; data?: unknown; fileName?: string; rowCount?: number; importMode?: GoogleAdsImportMode };
      const normalized = normalizeGoogleAdsImportData(parsed.data || parsed);
      setRawText(parsed.rawText || '');
      setData(normalized);
      setFileName(parsed.fileName || normalized?.sources?.[0]?.fileName || '');
      setRowCount(parsed.rowCount || normalized?.sources?.[0]?.rowCount || normalized?.summary.keywordCount || countImportRows(parsed.rawText || ''));
      setImportMode(parsed.importMode === 'replace' ? 'replace' : 'merge');
      onData?.(normalized);
    } catch {
      setData(null);
      onData?.(null);
    }
  }, [onData]);

  const analyzed = useMemo(() => data, [data]);
  const summary = analyzed?.summary;

  function saveImport(nextData: GoogleAdsImportData, text: string, sourceFileName: string, nextRowCount: number, mode: GoogleAdsImportMode) {
    const storageValue = {
      rawText: text,
      data: nextData,
      fileName: sourceFileName,
      rowCount: nextRowCount,
      importMode: mode,
    };
    localStorage.setItem(GOOGLE_ADS_IMPORT_STORAGE_KEY, JSON.stringify(storageValue));
    setRawText(text);
    setFileName(sourceFileName);
    setRowCount(nextRowCount);
    setData(nextData);
    onData?.(nextData);
  }

  function applyImport(incoming: GoogleAdsImportData | null, text: string, sourceFileName: string, nextRowCount: number) {
    if (!incoming) {
      setError('Chưa đọc được dữ liệu. Hãy kiểm tra file có cột keyword hoặc Từ khóa.');
      return;
    }
    const result = mergeGoogleAdsImportData(
      data,
      incoming,
      importMode,
      { fileName: sourceFileName, rowCount: nextRowCount },
      searchConsoleData,
      keywords,
      clusters,
    );
    if (!result) {
      setError('Chưa đọc được dữ liệu. Hãy kiểm tra file có cột keyword hoặc Từ khóa.');
      return;
    }
    setError('');
    setLastImportResult(result);
    saveImport(result.data, text, sourceFileName, nextRowCount, importMode);
  }

  function analyze() {
    const incoming = analyzeGoogleAdsImport(rawText, searchConsoleData, keywords, clusters);
    const nextRowCount = parseGoogleAdsImport(rawText).length;
    applyImport(incoming, rawText, fileName || 'Dữ liệu dán thủ công', nextRowCount);
  }

  function clearImport() {
    if (typeof window !== 'undefined' && !window.confirm('Bạn có chắc muốn xóa toàn bộ dữ liệu Google Ads đã nhập không?')) return;
    setRawText('');
    setData(null);
    setFileName('');
    setRowCount(0);
    setError('');
    setLastImportResult(null);
    localStorage.removeItem(GOOGLE_ADS_IMPORT_STORAGE_KEY);
    onData?.(null);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await readCsvFileAsText(file);
      const incoming = analyzeGoogleAdsImport(text, searchConsoleData, keywords, clusters);
      const nextRowCount = parseGoogleAdsImport(text).length;
      if (!incoming) {
        setError('File chưa đúng định dạng. Vui lòng export CSV từ Google hoặc copy bảng vào ô nhập.');
        return;
      }
      applyImport(incoming, text, file.name, nextRowCount);
    } catch {
      setError('Không đọc được file CSV. Nếu dùng Excel, hãy lưu thành CSV trước.');
    } finally {
      event.target.value = '';
    }
  }

  function useSample() {
    const incoming = analyzeGoogleAdsImport(googleAdsSampleData, searchConsoleData, keywords, clusters);
    applyImport(incoming, googleAdsSampleData, 'du-lieu-mau-google-ads.csv', parseGoogleAdsImport(googleAdsSampleData).length);
  }

  const latestSource = analyzed?.sources?.[0];

  return (
    <ModuleCard
      title="Nhập dữ liệu Google Ads / Keyword Planner"
      description="Vào Google Ads / Keyword Planner, export keyword plan hoặc report, copy dữ liệu rồi dán vào đây. Nếu dùng Excel, hãy lưu thành CSV trước."
      action={<Badge status={data ? 'ok' : 'pending'}>{data ? 'Đang dùng dữ liệu nhập thủ công' : 'Chưa nhập dữ liệu Google Ads'}</Badge>}
    >
      <div className={styles.scV7Stack}>
        <div className={styles.scV7Status}>
          {data ? 'Cập nhật lần cuối: ' + new Date(data.lastImportedAt || data.lastUpdated).toLocaleString('vi-VN') : 'Chưa nhập dữ liệu Google Ads / Keyword Planner.'}
        </div>
        <div className={styles.scImportBox}>
          <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder="Dán CSV hoặc dữ liệu tab-separated từ Google Ads / Keyword Planner vào đây..." />

          <div className={styles.importModeBox}>
            <strong>Chế độ nhập dữ liệu</strong>
            <label className={styles.importModeOption}>
              <input type="radio" name="google-ads-import-mode" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} />
              Gộp vào dữ liệu hiện có
            </label>
            <label className={styles.importModeOption}>
              <input type="radio" name="google-ads-import-mode" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} />
              Thay thế dữ liệu cũ
            </label>
          </div>

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
          {lastImportResult ? (
            <div className={styles.importResultBox}>
              <strong>{lastImportResult.source.mode === 'merge' ? 'Đã gộp dữ liệu Google Ads.' : 'Đã thay thế dữ liệu Google Ads cũ bằng file mới.'}</strong>
              <span>Nguồn file: {lastImportResult.source.fileName || 'Dữ liệu dán thủ công'}</span>
              <span>Chế độ: {modeLabel(lastImportResult.source.mode)}</span>
              <span>Thêm mới: {formatNumber(lastImportResult.addedCount)} · Cập nhật trùng: {formatNumber(lastImportResult.updatedCount)} · Tổng keyword hiện có: {formatNumber(lastImportResult.totalCount)}</span>
            </div>
          ) : latestSource ? (
            <div className={styles.importResultBox}>
              <strong>Nguồn import gần nhất</strong>
              <span>{latestSource.fileName || 'Dữ liệu dán thủ công'} · {modeLabel(latestSource.mode)}</span>
              <span>Thêm mới: {formatNumber(latestSource.addedCount)} · Cập nhật trùng: {formatNumber(latestSource.updatedCount)} · Tổng keyword hiện có: {formatNumber(latestSource.totalCount || summary?.keywordCount)}</span>
            </div>
          ) : null}
        </div>

        {summary && analyzed ? (
          <>
            <div className={styles.metricGridSmall}>
              <MetricCard label="Từ khóa đã nhập" value={formatNumber(summary.keywordCount)} />
              <MetricCard label="Tổng lượt tìm kiếm" value={formatNumber(summary.totalSearchVolume)} />
              <MetricCard label="CPC trung bình" value={formatMoney(summary.averageCpc)} />
              <MetricCard label="Cạnh tranh trung bình" value={summary.averageCompetitionIndex === null ? '-' : Math.round(summary.averageCompetitionIndex)} />
              <MetricCard label="Tổng lượt nhấp" value={formatNumber(summary.totalClicks)} />
              <MetricCard label="Tổng lượt hiển thị" value={formatNumber(summary.totalImpressions)} />
              <MetricCard label="Tổng chi phí" value={formatMoney(summary.totalCost)} />
              <MetricCard label="Tổng chuyển đổi" value={formatNumber(summary.totalConversions)} />
            </div>

            <div className={styles.scV7Tabs}>
              <button type="button" className={tab === 'overview' ? styles.scV7TabActive : ''} onClick={() => setTab('overview')}>Tổng quan</button>
              <button type="button" className={tab === 'planner' ? styles.scV7TabActive : ''} onClick={() => setTab('planner')}>Keyword Planner</button>
              <button type="button" className={tab === 'performance' ? styles.scV7TabActive : ''} onClick={() => setTab('performance')}>Hiệu quả Ads</button>
              <button type="button" className={tab === 'matrix' ? styles.scV7TabActive : ''} onClick={() => setTab('matrix')}>Ma trận SEO + Ads</button>
            </div>

            {tab === 'overview' ? (
              <div className={styles.scV7OpportunityList}>
                {analyzed.opportunities.slice(0, 8).map((item, index) => (
                  <article key={key('ads-opportunity', item.id, item.keyword, index)}>
                    <strong>{item.keyword}</strong>
                    <RecommendationBadge value={item.recommendation} />
                    <p>Điểm {item.score}/100 · {item.cluster}</p>
                    <span>{item.reason}</span>
                    <small>{item.action}</small>
                  </article>
                ))}
              </div>
            ) : null}

            {tab === 'planner' ? (
              <div className={styles.v5TwoTables}>
                <KeywordTable title="Top từ khóa theo lượt tìm kiếm" rows={analyzed.topVolume} />
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
                <KeywordTable title="Chuyển đổi tốt" rows={analyzed.goodConversionKeywords} />
                <KeywordTable title="Hiển thị cao, nhấp thấp" rows={analyzed.highImpressionLowClickKeywords} />
                <div className={styles.tableWrap}>
                  <h3 className={styles.adsV8TableTitle}>Nhóm quảng cáo cần tối ưu</h3>
                  <table><thead><tr><th>Nhóm</th><th>Chi phí</th><th>Chuyển đổi</th><th>Nhấp</th><th>Hiển thị</th><th>Lý do</th></tr></thead><tbody>{analyzed.adGroupsToOptimize.map((item, index) => <tr key={key('adgroup', item.name, item.reason, index)}><td>{item.name}</td><td>{formatMoney(item.cost)}</td><td>{formatNumber(item.conversions)}</td><td>{formatNumber(item.clicks)}</td><td>{formatNumber(item.impressions)}</td><td>{item.reason}</td></tr>)}</tbody></table>
                </div>
              </div> : <EmptyState title="Chưa có dữ liệu hiệu quả Ads" detail="Nếu import thêm lượt nhấp, lượt hiển thị, chi phí và chuyển đổi thì phần này sẽ tự phân tích." />
            ) : null}

            {tab === 'matrix' ? (
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>Keyword</th><th>Cụm</th><th>Vị trí SC</th><th>Hiển thị SC</th><th>Nhấp SC</th><th>Lượt tìm Ads</th><th>CPC</th><th>Cạnh tranh</th><th>Gợi ý</th><th>Lý do</th></tr></thead>
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
