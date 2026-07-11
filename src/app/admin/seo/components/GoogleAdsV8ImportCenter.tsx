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
  parseGoogleAdsImportDebug,
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

type RowsPerPage = 50 | 100 | 200;

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

function rowCpc(row: GoogleAdsKeywordImportRow) {
  return row.cpc || row.low_top_of_page_bid || row.high_top_of_page_bid || 0;
}

function normalizeFilter(value: unknown) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function uniqueOptions(rows: GoogleAdsKeywordImportRow[], field: 'parentCluster' | 'subCluster' | 'competition') {
  return Array.from(new Set(rows.map((row) => String(row[field] || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'vi'));
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

function FullKeywordTable({ rows }: { rows: GoogleAdsKeywordImportRow[] }) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Cụm cha</th>
            <th>Danh mục con</th>
            <th>Lượt tìm</th>
            <th>Cạnh tranh</th>
            <th>Chỉ số</th>
            <th>Giá thấp</th>
            <th>Giá cao</th>
            <th>Tiền tệ</th>
            <th>Lý do phân cụm</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={key('ads-full', row.id, row.keyword, index)}>
              <td><strong>{row.keyword}</strong></td>
              <td>{row.parentCluster || row.cluster || 'Theo dõi thêm'}</td>
              <td>{row.subCluster || '-'}</td>
              <td>{formatNumber(row.avg_monthly_searches)}</td>
              <td>{row.competition || '-'}</td>
              <td>{row.competition_index ?? '-'}</td>
              <td>{formatMoney(row.low_top_of_page_bid)}</td>
              <td>{formatMoney(row.high_top_of_page_bid)}</td>
              <td>{row.currency || '-'}</td>
              <td>{row.clusterReason || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GoogleAdsV8ImportCenter({ keywords, clusters, searchConsoleData, onData }: Props) {
  const [rawText, setRawText] = useState('');
  const [data, setData] = useState<GoogleAdsImportData | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'overview' | 'planner' | 'performance' | 'matrix' | 'all'>('overview');
  const [fileName, setFileName] = useState('');
  const [rowCount, setRowCount] = useState(0);
  const [importMode, setImportMode] = useState<GoogleAdsImportMode>('merge');
  const [lastImportResult, setLastImportResult] = useState<LastImportResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [parentFilter, setParentFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [competitionFilter, setCompetitionFilter] = useState('');
  const [minVolume, setMinVolume] = useState('');
  const [maxCpc, setMaxCpc] = useState('');
  const [unclusteredOnly, setUnclusteredOnly] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPage>(50);
  const [page, setPage] = useState(1);

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
  const allRows = analyzed?.rows || [];
  const parentOptions = useMemo(() => uniqueOptions(allRows, 'parentCluster'), [allRows]);
  const subOptions = useMemo(() => uniqueOptions(parentFilter ? allRows.filter((row) => row.parentCluster === parentFilter) : allRows, 'subCluster'), [allRows, parentFilter]);
  const competitionOptions = useMemo(() => uniqueOptions(allRows, 'competition'), [allRows]);

  const filteredRows = useMemo(() => {
    const keywordNeedle = normalizeFilter(searchTerm);
    const min = Number(minVolume || 0);
    const max = Number(maxCpc || 0);
    return allRows.filter((row) => {
      if (keywordNeedle && !normalizeFilter(row.keyword).includes(keywordNeedle)) return false;
      if (parentFilter && row.parentCluster !== parentFilter) return false;
      if (subFilter && row.subCluster !== subFilter) return false;
      if (competitionFilter && row.competition !== competitionFilter) return false;
      if (unclusteredOnly && (row.parentCluster || row.cluster) !== 'Theo dõi thêm') return false;
      if (min && Number(row.avg_monthly_searches || 0) < min) return false;
      if (max && rowCpc(row) > max) return false;
      return true;
    });
  }, [allRows, searchTerm, parentFilter, subFilter, competitionFilter, unclusteredOnly, minVolume, maxCpc]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, parentFilter, subFilter, competitionFilter, unclusteredOnly, minVolume, maxCpc, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

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
      const debug = parseGoogleAdsImportDebug(text);
      setError(debug.message || 'Không tìm thấy dòng header Keyword Planner');
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
      const debug = parseGoogleAdsImportDebug(text);
      setError(debug.message || 'File rỗng hoặc sai định dạng');
      return;
    }
    setError('');
    setLastImportResult(result);
    saveImport(result.data, text, sourceFileName, nextRowCount, importMode);
  }

  function analyze() {
    const incoming = analyzeGoogleAdsImport(rawText, searchConsoleData, keywords, clusters);
    const debug = parseGoogleAdsImportDebug(rawText);
    applyImport(incoming, rawText, fileName || 'Dữ liệu dán thủ công', debug.parsedRowCount || parseGoogleAdsImport(rawText).length);
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
      const debug = parseGoogleAdsImportDebug(text);
      if (!incoming) {
        setError(debug.message || 'Không tìm thấy dòng header Keyword Planner');
        return;
      }
      applyImport(incoming, text, file.name, debug.parsedRowCount || parseGoogleAdsImport(text).length);
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
  const debug = summary?.importDebug;

  return (
    <ModuleCard
      title="Nhập dữ liệu Google Ads / Keyword Planner"
      description="Vào Google Ads / Keyword Planner, export keyword plan hoặc report, copy dữ liệu rồi dán vào đây. Dashboard tự tìm dòng header thật sau phần metadata của Google Ads."
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
              {fileName ? fileName + ' · ' + rowCount + ' dòng parse thành công' : 'Hỗ trợ CSV có metadata đầu file, dấu phẩy, chấm phẩy, tab và UTF-8 BOM.'}
            </span>
          </div>
          <div className={styles.scImportActions}>
            <button className={styles.primaryButton} type="button" onClick={analyze}>Phân tích dữ liệu</button>
            <button className={styles.secondaryButton} type="button" onClick={useSample}>Dùng dữ liệu mẫu</button>
            <button className={styles.secondaryButton} type="button" onClick={clearImport}>Xóa dữ liệu import</button>
          </div>
          {error ? <div className={styles.alert}>{error}</div> : null}
          {debug ? (
            <div className={styles.importResultBox}>
              <strong>Debug import Keyword Planner</strong>
              <span>Tổng dòng đọc được: {formatNumber(debug.totalLines)} · Header phát hiện ở dòng: {debug.headerRowNumber || '-'} · Parse thành công: {formatNumber(debug.parsedRowCount)} · Bỏ qua: {formatNumber(debug.skippedRowCount)}</span>
              <span>Cột đã nhận diện: {(debug.detectedColumns || []).join(', ') || '-'}</span>
            </div>
          ) : null}
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
              <MetricCard label="Dòng CSV đọc được" value={formatNumber(summary.rawLineCount || summary.importDebug?.totalLines)} />
              <MetricCard label="Keyword parse thành công" value={formatNumber(summary.parsedRowCount || summary.keywordCount)} />
              <MetricCard label="Keyword sau gộp trùng" value={formatNumber(summary.mergedKeywordCount || summary.keywordCount)} />
              <MetricCard label="Keyword chưa phân cụm" value={formatNumber(summary.unclusteredKeywordCount)} />
              <MetricCard label="Keyword trong Supabase/cache" value={formatNumber(summary.keywordCount)} />
              <MetricCard label="Đang hiển thị sau lọc" value={formatNumber(filteredRows.length)} />
              <MetricCard label="Tổng lượt tìm kiếm" value={formatNumber(summary.totalSearchVolume)} />
              <MetricCard label="CPC trung bình" value={formatMoney(summary.averageCpc)} />
            </div>

            <div className={styles.scV7Tabs}>
              <button type="button" className={tab === 'overview' ? styles.scV7TabActive : ''} onClick={() => setTab('overview')}>Tổng quan</button>
              <button type="button" className={tab === 'planner' ? styles.scV7TabActive : ''} onClick={() => setTab('planner')}>Keyword Planner</button>
              <button type="button" className={tab === 'all' ? styles.scV7TabActive : ''} onClick={() => setTab('all')}>Tất cả keyword</button>
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

            {tab === 'all' ? (
              <div className={styles.adsV8FullPanel}>
                <div className={styles.adsV8FilterGrid}>
                  <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm keyword..." />
                  <select value={parentFilter} onChange={(event) => { setParentFilter(event.target.value); setSubFilter(''); }}>
                    <option value="">Tất cả cụm cha</option>
                    {parentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <select value={subFilter} onChange={(event) => setSubFilter(event.target.value)}>
                    <option value="">Tất cả danh mục con</option>
                    {subOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <select value={competitionFilter} onChange={(event) => setCompetitionFilter(event.target.value)}>
                    <option value="">Mọi cạnh tranh</option>
                    {competitionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <input value={minVolume} onChange={(event) => setMinVolume(event.target.value)} inputMode="numeric" placeholder="Lượt tìm tối thiểu" />
                  <input value={maxCpc} onChange={(event) => setMaxCpc(event.target.value)} inputMode="numeric" placeholder="CPC tối đa" />
                  <select value={rowsPerPage} onChange={(event) => setRowsPerPage(Number(event.target.value) as RowsPerPage)}>
                    <option value={50}>50 dòng/trang</option>
                    <option value={100}>100 dòng/trang</option>
                    <option value={200}>200 dòng/trang</option>
                  </select>
                  <label className={styles.v51Toggle}>
                    <input type="checkbox" checked={unclusteredOnly} onChange={(event) => setUnclusteredOnly(event.target.checked)} />
                    Chỉ keyword chưa phân cụm
                  </label>
                </div>
                <div className={styles.adsV8Pager}>
                  <strong>Hiển thị {formatNumber(pageRows.length)} / {formatNumber(filteredRows.length)} keyword</strong>
                  <span>Trang {safePage}/{totalPages}</span>
                  <button type="button" className={styles.secondaryButton} onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1}>Trước</button>
                  <button type="button" className={styles.secondaryButton} onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages}>Sau</button>
                </div>
                <FullKeywordTable rows={pageRows} />
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
