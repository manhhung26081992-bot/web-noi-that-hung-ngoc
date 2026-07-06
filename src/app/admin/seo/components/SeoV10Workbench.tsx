'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { Badge, EmptyState, ModuleCard } from './Ui';
import type { GoogleAdsImportData, ProductSeoItem, SearchConsoleV7Data, SeoBlogQualityItem, SeoCluster, SeoKeyword } from '../types/seo';
import {
  buildSeoWorkbenchItems,
  buildSeoWorkbenchSuggestion,
  filterSeoWorkbenchItems,
  seoWorkbenchChecklistKey,
  type SeoWorkbenchItem,
  type SeoWorkbenchSuggestion,
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

const CHECKLIST_STORAGE_KEY = 'noithathungngoc-seo-workbench-checklist-v1';
const PAGE_SIZE = 20;

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

function ResultCard({ item, active, onSelect }: { item: SeoWorkbenchItem; active: boolean; onSelect: (item: SeoWorkbenchItem) => void }) {
  return (
    <article className={`${styles.workbenchResultCard} ${active ? styles.workbenchResultActive : ''}`}>
      <div className={styles.workbenchResultTop}>
        <Badge status={statusForScore(item.score)}>{item.score}/100</Badge>
        <span>{typeLabel(item.type)}</span>
        <span>{item.cluster}</span>
      </div>
      <h4>{item.title}</h4>
      <p>{item.reasons[0] || 'Có thể tối ưu thêm để hỗ trợ SEO.'}</p>
      <div className={styles.workbenchResultMeta}>
        {item.searchConsole ? <span>SC: {formatNumber(item.searchConsole.impressions)} impressions</span> : null}
        {item.ads ? <span>KP: {formatNumber(item.ads.volume)} lượt tìm</span> : null}
        {item.issues.length ? <span>{item.issues.slice(0, 2).join(', ')}</span> : null}
      </div>
      <button className={styles.primaryButton} type="button" onClick={() => onSelect(item)}>Tạo gợi ý SEO</button>
    </article>
  );
}

function SuggestionPanel({ suggestion, checked, onToggle }: { suggestion: SeoWorkbenchSuggestion; checked: Record<string, boolean>; onToggle: (text: string) => void }) {
  const allText = [
    `Title: ${suggestion.title}`,
    `Meta: ${suggestion.metaDescription}`,
    `H1: ${suggestion.h1}`,
    `Từ khóa chính: ${suggestion.primaryKeyword}`,
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
  const [targetType, setTargetType] = useState<WorkbenchTargetType>('product');
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<WorkbenchFilterKey[]>(['core']);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SeoWorkbenchItem | null>(null);
  const [checklist, setChecklist] = useState<SavedChecklist>({});

  useEffect(() => { setChecklist(loadChecklist()); }, []);

  const items = useMemo(() => buildSeoWorkbenchItems({ products, blogs, keywords, clusters, searchConsole, googleAds }), [products, blogs, keywords, clusters, searchConsole, googleAds]);
  const result = useMemo(() => filterSeoWorkbenchItems(items, { type: targetType, search, filters: activeFilters, page, pageSize: PAGE_SIZE }), [items, targetType, search, activeFilters, page]);
  const suggestion = useMemo(() => selected ? buildSeoWorkbenchSuggestion(selected) : null, [selected]);
  const checklistKey = suggestion ? seoWorkbenchChecklistKey(suggestion.item) : '';
  const checked = checklistKey ? checklist[checklistKey] || {} : {};

  useEffect(() => {
    if (page !== result.page) setPage(result.page);
  }, [page, result.page]);

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

  return (
    <ModuleCard title="Bàn làm việc SEO v10.0" description="Chọn sản phẩm, bài viết hoặc URL để tạo gợi ý SEO cụ thể: title, meta, FAQ, internal link và nội dung có thể copy.">
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

        <section className={styles.workbenchResults}>
          {result.pageItems.length ? (
            <div className={styles.workbenchResultGrid}>
              {result.pageItems.map((item) => <ResultCard key={item.id} item={item} active={selected?.id === item.id} onSelect={handleSelect} />)}
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
            <p>Workbench sẽ tạo title, meta, FAQ, internal link, content HTML và checklist để bạn copy sang Supabase.</p>
          </div>
        )}
      </div>
    </ModuleCard>
  );
}

export default memo(SeoV10Workbench);
