'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { Badge, EmptyState, ModuleCard } from './Ui';
import type { GoogleAdsImportData, ProductSeoItem, SearchConsoleV7Data, SeoBlogQualityItem, SeoCluster, SeoKeyword } from '../types/seo';
import {
  buildSeoWorkbenchItems,
  buildSeoWorkbenchSuggestion,
  buildUsedKeywordInsights,
  filterSeoWorkbenchItems,
  filterUsedKeywordInsights,
  normalizeKeyword,
  seoWorkbenchChecklistKey,
  type KeywordPrimaryMapEntry,
  type SeoWorkbenchItem,
  type SeoWorkbenchSuggestion,
  type UsedKeywordFilterKey,
  type UsedKeywordInsight,
  type WorkbenchFilterKey,
  type WorkbenchTargetType,
} from '../services/seoWorkbenchService';
import styles from '../seo-dashboard.module.css';

type Props = {
  products: ProductSeoItem[];
  blogs: SeoBlogQualityItem[];
  keywords: SeoKeyword[];
  clusters: SeoCluster[];
  searchConsole: SearchConsoleV7Data | null;
  googleAds: GoogleAdsImportData | null;
};

type SavedChecklist = Record<string, Record<string, boolean>>;

type KeywordMap = Record<string, KeywordPrimaryMapEntry>;

const CHECKLIST_STORAGE_KEY = 'noithathungngoc-seo-workbench-checklist-v1';
const KEYWORD_MAP_STORAGE_KEY = 'noithathungngoc-seo-keyword-map-v1';
const PAGE_SIZE = 20;
const KEYWORD_PAGE_SIZE = 20;

const typeOptions: Array<{ value: WorkbenchTargetType; label: string }> = [
  { value: 'product', label: 'Sản phẩm' },
  { value: 'blog', label: 'Bài viết' },
  { value: 'category', label: 'Danh mục / landing page' },
  { value: 'keyword', label: 'Từ khóa' },
];

const filterOptions: Array<{ value: WorkbenchFilterKey; label: string }> = [
  { value: 'core', label: 'Hàng chủ đạo' },
  { value: 'searchConsole', label: 'Có impression Search Console' },
  { value: 'keywordPlanner', label: 'Có volume Keyword Planner' },
  { value: 'missingFaq', label: 'Thiếu FAQ' },
  { value: 'thinDescription', label: 'Thiếu mô tả' },
  { value: 'missingInternalLink', label: 'Thiếu internal link' },
  { value: 'position10to30', label: 'Vị trí Google 10-30' },
  { value: 'lowCtr', label: 'CTR thấp' },
  { value: 'highCpcSeoChance', label: 'CPC cao nhưng SEO có cơ hội' },
];

const usedKeywordFilterOptions: Array<{ value: UsedKeywordFilterKey; label: string }> = [
  { value: 'all', label: 'Tất cả keyword' },
  { value: 'unused', label: 'Chưa dùng' },
  { value: 'primary', label: 'Đã có URL chính' },
  { value: 'cannibalization', label: 'Có nguy cơ trùng' },
  { value: 'update_old', label: 'Nên cập nhật bài cũ' },
  { value: 'support_article', label: 'Nên tạo bài hỗ trợ' },
  { value: 'core', label: 'Hàng chủ đạo' },
  { value: 'searchConsole', label: 'Có impression Search Console' },
  { value: 'keywordPlanner', label: 'Có volume Keyword Planner' },
];

function typeLabel(type: WorkbenchTargetType) {
  return typeOptions.find((item) => item.value === type)?.label || type;
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat('vi-VN').format(value || 0);
}

function statusForScore(score: number) {
  if (score >= 75) return 'warning';
  if (score >= 45) return 'pending';
  return 'ok';
}

function statusForKeyword(status: UsedKeywordInsight['status']) {
  if (status === 'cannibalization') return 'warning';
  if (status === 'unused' || status === 'support_article') return 'pending';
  return 'ok';
}

function loadChecklist(): SavedChecklist {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) as SavedChecklist : {};
  } catch {
    return {};
  }
}

function saveChecklist(value: SavedChecklist) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(value));
}

function loadKeywordMap(): KeywordMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEYWORD_MAP_STORAGE_KEY);
    return raw ? JSON.parse(raw) as KeywordMap : {};
  } catch {
    return {};
  }
}

function saveKeywordMap(value: KeywordMap) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEYWORD_MAP_STORAGE_KEY, JSON.stringify(value));
}

async function copyText(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  }
}

function CopyBox({ title, value }: { title: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await copyText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }
  return (
    <div className={styles.workbenchCopyBox}>
      <div className={styles.workbenchCopyHeader}>
        <strong>{title}</strong>
        <button className={styles.secondaryButton} type="button" onClick={handleCopy}>{copied ? 'Đã copy' : 'Copy'}</button>
      </div>
      <pre>{value}</pre>
    </div>
  );
}

function ResultCard({ item, active, keywordInsight, onSelect }: { item: SeoWorkbenchItem; active: boolean; keywordInsight?: UsedKeywordInsight; onSelect: (item: SeoWorkbenchItem) => void }) {
  return (
    <article className={`${styles.workbenchResultCard} ${active ? styles.workbenchResultActive : ''}`}>
      <div className={styles.workbenchResultTop}>
        <Badge status={statusForScore(item.score)}>{item.score}/100</Badge>
        {keywordInsight ? <Badge status={statusForKeyword(keywordInsight.status)}>{keywordInsight.label}</Badge> : null}
        <span>{typeLabel(item.type)}</span>
        <span>{item.cluster}</span>
      </div>
      <h4>{item.title}</h4>
      <p>{item.reasons[0] || 'Có thể tối ưu thêm để hỗ trợ SEO.'}</p>
      <div className={styles.workbenchResultMeta}>
        {item.searchConsole ? <span>SC: {formatNumber(item.searchConsole.impressions)} impressions</span> : null}
        {item.ads ? <span>KP: {formatNumber(item.ads.volume)} lượt tìm</span> : null}
        {keywordInsight?.primaryUrl ? <span>URL chính: {keywordInsight.primaryUrl}</span> : null}
        {item.issues.length ? <span>{item.issues.slice(0, 2).join(', ')}</span> : null}
      </div>
      <button className={styles.primaryButton} type="button" onClick={() => onSelect(item)}>Tạo gợi ý SEO</button>
    </article>
  );
}

function KeywordUsedTable({
  result,
  search,
  filter,
  onSearch,
  onFilter,
  onPage,
  onChoosePrimary,
}: {
  result: ReturnType<typeof filterUsedKeywordInsights>;
  search: string;
  filter: UsedKeywordFilterKey;
  onSearch: (value: string) => void;
  onFilter: (value: UsedKeywordFilterKey) => void;
  onPage: (page: number) => void;
  onChoosePrimary: (keyword: string, url: string, urlType: WorkbenchTargetType) => void;
}) {
  return (
    <section className={styles.workbenchKeywordSection}>
      <div className={styles.workbenchSuggestionHeader}>
        <div>
          <p className={styles.eyebrow}>Chống viết trùng</p>
          <h3>Từ khóa đã dùng & chống trùng SEO</h3>
          <p>Kiểm tra keyword đã có URL chính chưa, có bị nhiều URL cùng bắt từ khóa không, và nên cập nhật bài cũ hay viết bài hỗ trợ.</p>
        </div>
        <Badge status="pending">Lưu URL chính bằng localStorage</Badge>
      </div>

      <div className={styles.workbenchKeywordTools}>
        <input value={search} onChange={(event) => { onSearch(event.target.value); onPage(1); }} placeholder="Tìm keyword, URL, sản phẩm..." />
        <select value={filter} onChange={(event) => { onFilter(event.target.value as UsedKeywordFilterKey); onPage(1); }}>
          {usedKeywordFilterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <span>{formatNumber(result.total)} keyword phù hợp</span>
      </div>

      {result.items.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.workbenchKeywordTable}>
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Trạng thái</th>
                <th>URL chính</th>
                <th>Loại URL</th>
                <th>URL cạnh tranh</th>
                <th>Khuyến nghị</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((insight, index) => (
                <tr key={`${insight.normalizedKeyword}-${insight.primaryUrl || 'no-url'}-${index}`}>
                  <td>
                    <strong>{insight.keyword}</strong>
                    <small>{insight.source}</small>
                  </td>
                  <td><Badge status={statusForKeyword(insight.status)}>{insight.label}</Badge></td>
                  <td>
                    {insight.urls.length > 1 ? (
                      <select
                        className={styles.workbenchUrlSelect}
                        value={insight.primaryUrl || ''}
                        onChange={(event) => {
                          const selected = insight.urls.find((url) => url.url === event.target.value);
                          if (selected) onChoosePrimary(insight.keyword, selected.url, selected.type);
                        }}
                      >
                        <option value="">Chọn URL chính</option>
                        {insight.urls.map((url) => <option key={`${insight.normalizedKeyword}-${url.type}-${url.url}`} value={url.url}>{url.title} - {url.url}</option>)}
                      </select>
                    ) : insight.primaryUrl ? <a href={insight.primaryUrl} target="_blank" rel="noreferrer">{insight.primaryUrl}</a> : <span className={styles.muted}>Chưa có URL</span>}
                  </td>
                  <td>{insight.primaryUrlType ? typeLabel(insight.primaryUrlType) : '-'}</td>
                  <td>{insight.competingCount}</td>
                  <td>{insight.recommendation}</td>
                  <td>
                    <div className={styles.workbenchInlineActions}>
                      {insight.primaryUrl ? <a className={styles.secondaryButton} href={insight.primaryUrl} target="_blank" rel="noreferrer">Mở URL</a> : null}
                      {insight.primaryUrl && insight.primaryUrlType ? <button className={styles.secondaryButton} type="button" onClick={() => onChoosePrimary(insight.keyword, insight.primaryUrl || '', insight.primaryUrlType || 'keyword')}>Lưu URL chính</button> : null}
                      <button className={styles.secondaryButton} type="button" onClick={() => copyText(insight.anchorText)}>Copy anchor</button>
                      <button className={styles.secondaryButton} type="button" onClick={() => copyText(insight.taskText)}>Copy task</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="Chưa có keyword phù hợp" detail="Thử đổi bộ lọc hoặc tìm bằng từ khóa không dấu như ghe chan quy, giuong tang, ban lam viec." />}

      <div className={styles.workbenchPagination}>
        <button className={styles.secondaryButton} type="button" disabled={result.page <= 1} onClick={() => onPage(Math.max(1, result.page - 1))}>Trước</button>
        <span>Trang {result.page}/{result.totalPages}</span>
        <button className={styles.secondaryButton} type="button" disabled={result.page >= result.totalPages} onClick={() => onPage(Math.min(result.totalPages, result.page + 1))}>Sau</button>
      </div>
    </section>
  );
}

function SuggestionPanel({ suggestion, checked, onToggle }: { suggestion: SeoWorkbenchSuggestion; checked: Record<string, boolean>; onToggle: (text: string) => void }) {
  const allText = [
    `Title: ${suggestion.title}`,
    `Meta: ${suggestion.metaDescription}`,
    `H1: ${suggestion.h1}`,
    `Từ khóa chính: ${suggestion.primaryKeyword}`,
    `Trạng thái keyword: ${suggestion.keywordInsight?.label || 'Chưa kiểm tra'}`,
    `URL chính: ${suggestion.keywordInsight?.primaryUrl || 'Chưa có'}`,
    `Từ khóa phụ: ${suggestion.secondaryKeywords.join(', ')}`,
    '',
    suggestion.contentHtml,
  ].join('\n');
  const faqHtml = suggestion.faqs.map((faq) => `<div class="faq-item">\n  <h3>${faq.question}</h3>\n  <p>${faq.answer}</p>\n</div>`).join('\n');

  return (
    <section className={styles.workbenchSuggestion}>
      <div className={styles.workbenchSuggestionHeader}>
        <div>
          <p className={styles.eyebrow}>Gợi ý SEO để copy</p>
          <h3>{suggestion.item.title}</h3>
          <p>{suggestion.item.reasons.join(' ')}</p>
        </div>
        {suggestion.item.url ? <a className={styles.secondaryButton} href={suggestion.item.url} target="_blank" rel="noreferrer">Mở URL</a> : null}
      </div>

      {suggestion.keywordInsight && suggestion.keywordInsight.status !== 'unused' ? (
        <div className={styles.workbenchWarningBox}>
          <strong>{suggestion.keywordInsight.label}</strong>
          <p>{suggestion.keywordInsight.recommendation}</p>
          {suggestion.keywordInsight.primaryUrl ? <a href={suggestion.keywordInsight.primaryUrl} target="_blank" rel="noreferrer">Xem URL chính: {suggestion.keywordInsight.primaryUrl}</a> : null}
        </div>
      ) : null}

      <div className={styles.summaryGrid}>
        <div className={styles.workbenchMiniCard}><span>Từ khóa chính</span><strong>{suggestion.primaryKeyword}</strong></div>
        <div className={styles.workbenchMiniCard}><span>Điểm ưu tiên</span><strong>{suggestion.item.score}/100</strong></div>
        <div className={styles.workbenchMiniCard}><span>Nguồn dữ liệu</span><strong>{suggestion.item.source}</strong></div>
      </div>

      <div className={styles.gridTwo}>
        <CopyBox title="Copy title" value={suggestion.title} />
        <CopyBox title="Copy meta description" value={suggestion.metaDescription} />
      </div>

      <div className={styles.gridTwo}>
        <CopyBox title="Copy FAQ HTML" value={faqHtml} />
        <CopyBox title="Copy toàn bộ" value={allText} />
      </div>

      <CopyBox title="Copy content HTML cho Supabase" value={suggestion.contentHtml} />

      <div className={styles.gridTwo}>
        <div className={styles.workbenchPanelBox}>
          <h4>Heading đề xuất</h4>
          <p><strong>H1:</strong> {suggestion.h1}</p>
          <ul>{suggestion.h2.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className={styles.workbenchPanelBox}>
          <h4>Internal link nên thêm</h4>
          <ul>{suggestion.internalLinks.map((link) => <li key={`${link.url}-${link.anchor}`}><strong>{link.anchor}</strong> → {link.url}<br /><small>{link.reason}</small></li>)}</ul>
        </div>
      </div>

      <div className={styles.workbenchPanelBox}>
        <h4>Checklist SEO</h4>
        <div className={styles.workbenchChecklist}>
          {suggestion.checklist.map((item) => (
            <label key={item}>
              <input type="checkbox" checked={Boolean(checked[item])} onChange={() => onToggle(item)} />
              <span>{item}</span>
            </label>
          ))}
        </div>
        <p className={styles.muted}>Checklist được lưu trên trình duyệt bằng localStorage, không ghi vào Supabase.</p>
      </div>
    </section>
  );
}

function SeoV10Workbench({ products, blogs, keywords, clusters, searchConsole, googleAds }: Props) {
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [targetType, setTargetType] = useState<WorkbenchTargetType>('product');
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<WorkbenchFilterKey[]>([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SeoWorkbenchItem | null>(null);
  const [checklist, setChecklist] = useState<SavedChecklist>({});
  const [keywordMap, setKeywordMap] = useState<KeywordMap>({});
  const [usedKeywordFilter, setUsedKeywordFilter] = useState<UsedKeywordFilterKey>('all');
  const [usedKeywordSearch, setUsedKeywordSearch] = useState('');
  const [usedKeywordPage, setUsedKeywordPage] = useState(1);

  useEffect(() => {
    setChecklist(loadChecklist());
    setKeywordMap(loadKeywordMap());
  }, []);

  const limitedGoogleAds = useMemo(() => googleAds ? {
    ...googleAds,
    rows: [...(googleAds.rows || [])]
      .sort((a, b) => Number(b.avg_monthly_searches || 0) - Number(a.avg_monthly_searches || 0))
      .slice(0, 300),
  } : null, [googleAds]);
  const inputData = useMemo(() => ({ products, blogs, keywords, clusters, searchConsole, googleAds: limitedGoogleAds }), [products, blogs, keywords, clusters, searchConsole, limitedGoogleAds]);
  const items = useMemo(() => analysisStarted ? buildSeoWorkbenchItems(inputData) : [], [analysisStarted, inputData]);
  const usedKeywordInsights = useMemo(() => analysisStarted ? buildUsedKeywordInsights(inputData, keywordMap) : [], [analysisStarted, inputData, keywordMap]);
  const keywordLookup = useMemo(() => {
    const map = new Map<string, UsedKeywordInsight>();
    usedKeywordInsights.forEach((insight) => map.set(insight.normalizedKeyword, insight));
    return map;
  }, [usedKeywordInsights]);
  const result = useMemo(() => filterSeoWorkbenchItems(items, { type: targetType, search, filters: activeFilters, page, pageSize: PAGE_SIZE }), [items, targetType, search, activeFilters, page]);
  const usedKeywordResult = useMemo(() => filterUsedKeywordInsights(usedKeywordInsights, { filter: usedKeywordFilter, search: usedKeywordSearch, page: usedKeywordPage, pageSize: KEYWORD_PAGE_SIZE }), [usedKeywordInsights, usedKeywordFilter, usedKeywordSearch, usedKeywordPage]);
  const selectedInsight = useMemo(() => {
    if (!selected) return undefined;
    return keywordLookup.get(normalizeKeyword(selected.mainKeyword)) || usedKeywordInsights.find((insight) => normalizeKeyword(`${selected.title} ${selected.cluster}`).includes(insight.normalizedKeyword));
  }, [selected, keywordLookup, usedKeywordInsights]);
  const suggestion = useMemo(() => selected ? buildSeoWorkbenchSuggestion(selected, selectedInsight) : null, [selected, selectedInsight]);
  const checklistKey = suggestion ? seoWorkbenchChecklistKey(suggestion.item) : '';
  const checked = checklistKey ? checklist[checklistKey] || {} : {};

  useEffect(() => {
    if (page !== result.page) setPage(result.page);
  }, [page, result.page]);

  useEffect(() => {
    if (usedKeywordPage !== usedKeywordResult.page) setUsedKeywordPage(usedKeywordResult.page);
  }, [usedKeywordPage, usedKeywordResult.page]);

  function toggleFilter(filter: WorkbenchFilterKey) {
    setPage(1);
    setActiveFilters((current) => current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]);
  }

  function handleSelect(item: SeoWorkbenchItem) {
    setSelected(item);
  }

  function toggleChecklist(text: string) {
    if (!checklistKey) return;
    const next = {
      ...checklist,
      [checklistKey]: {
        ...(checklist[checklistKey] || {}),
        [text]: !checklist[checklistKey]?.[text],
      },
    };
    setChecklist(next);
    saveChecklist(next);
  }

  function startAnalysis() {
    setSelected(null);
    setPage(1);
    setUsedKeywordPage(1);
    setAnalysisStarted(true);
  }

  function choosePrimary(keyword: string, primaryUrl: string, urlType: WorkbenchTargetType) {
    if (!primaryUrl) return;
    const key = normalizeKeyword(keyword);
    const next = {
      ...keywordMap,
      [key]: {
        keyword,
        primaryUrl,
        urlType,
        note: 'URL chính do bạn chọn trong Trợ lý SEO v10.',
        updatedAt: new Date().toISOString(),
      },
    };
    setKeywordMap(next);
    saveKeywordMap(next);
  }

  if (!analysisStarted) {
    return (
      <ModuleCard
        title="Trợ lý SEO v10.0"
        description="Trợ lý này đọc toàn bộ sản phẩm, bài viết, danh mục và dữ liệu import để chống trùng keyword và tạo nội dung SEO. Phần phân tích khá nặng nên chỉ chạy khi bạn bấm nút bên dưới."
        action={<button className={styles.primaryButton} type="button" onClick={startAnalysis}>Chạy phân tích SEO v10</button>}
      >
        <div className={styles.summaryGrid}>
          <div className={styles.workbenchMiniCard}><span>Sản phẩm</span><strong>{formatNumber(products.length)}</strong></div>
          <div className={styles.workbenchMiniCard}><span>Bài viết</span><strong>{formatNumber(blogs.length)}</strong></div>
          <div className={styles.workbenchMiniCard}><span>Từ khóa Supabase</span><strong>{formatNumber(keywords.length)}</strong></div>
          <div className={styles.workbenchMiniCard}><span>Keyword Planner dùng để phân tích</span><strong>{formatNumber(limitedGoogleAds?.rows?.length || 0)}</strong></div>
        </div>
        <div className={styles.workbenchStartBox}>
          <p className={styles.muted}>Mở khung này không còn chạy phân tích ngay, nên dashboard sẽ nhẹ hơn. Khi cần tạo bài SEO hoặc kiểm tra keyword đã dùng trên toàn bộ website, hãy bấm nút bên dưới.</p>
          <button className={styles.primaryButton} type="button" onClick={startAnalysis}>Chạy phân tích SEO v10</button>
        </div>
      </ModuleCard>
    );
  }

  return (
    <ModuleCard title="Trợ lý SEO v10.0" description="AI lấy toàn bộ sản phẩm, bài viết, danh mục, Search Console import và Keyword Planner import để tạo gợi ý SEO cụ thể: title, meta, FAQ, internal link và nội dung có thể copy.">
      <div className={styles.workbenchLayout}>
        <section className={styles.workbenchControls}>
          <div className={styles.workbenchControlGrid}>
            <label>
              <span>Chọn loại tối ưu</span>
              <select value={targetType} onChange={(event) => { setTargetType(event.target.value as WorkbenchTargetType); setPage(1); setSelected(null); }}>
                {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Tìm kiếm</span>
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm theo tên, slug, keyword, danh mục..." />
            </label>
          </div>

          <div className={styles.workbenchFilterList}>
            {filterOptions.map((filter) => (
              <button key={filter.value} type="button" className={activeFilters.includes(filter.value) ? styles.workbenchFilterActive : styles.secondaryButton} onClick={() => toggleFilter(filter.value)}>
                {filter.label}
              </button>
            ))}
          </div>

          <div className={styles.workbenchSummaryLine}>
            <span>Đang xem {result.pageItems.length}/{result.filtered.length} mục phù hợp.</span>
            <span>Dữ liệu: Supabase{searchConsole ? ' + Search Console import' : ''}{googleAds ? ' + Keyword Planner import' : ''}</span>
          </div>
        </section>

        <KeywordUsedTable
          result={usedKeywordResult}
          search={usedKeywordSearch}
          filter={usedKeywordFilter}
          onSearch={setUsedKeywordSearch}
          onFilter={setUsedKeywordFilter}
          onPage={setUsedKeywordPage}
          onChoosePrimary={choosePrimary}
        />

        <section className={styles.workbenchResults}>
          {result.pageItems.length ? (
            <div className={styles.workbenchResultGrid}>
              {result.pageItems.map((item) => (
                <ResultCard
                  key={item.id}
                  item={item}
                  keywordInsight={keywordLookup.get(normalizeKeyword(item.mainKeyword))}
                  active={selected?.id === item.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : <EmptyState title="Chưa có mục phù hợp" detail="Thử bỏ bớt bộ lọc hoặc nhập từ khóa khác như giường tầng, bàn làm việc, bàn ghế học sinh." />}

          <div className={styles.workbenchPagination}>
            <button className={styles.secondaryButton} type="button" disabled={result.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trước</button>
            <span>Trang {result.page}/{result.totalPages}</span>
            <button className={styles.secondaryButton} type="button" disabled={result.page >= result.totalPages} onClick={() => setPage((value) => Math.min(result.totalPages, value + 1))}>Sau</button>
          </div>
        </section>

        {suggestion ? <SuggestionPanel suggestion={suggestion} checked={checked} onToggle={toggleChecklist} /> : (
          <div className={styles.workbenchSuggestionEmpty}>
            <h3>Chọn một mục để tạo gợi ý SEO</h3>
            <p>Trợ lý SEO sẽ tạo title, meta, FAQ, internal link, content HTML và checklist để bạn copy sang Supabase.</p>
          </div>
        )}
      </div>
    </ModuleCard>
  );
}

export default memo(SeoV10Workbench);



