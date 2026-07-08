'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from '../seo-dashboard.module.css';
import type { SeoNextAction, SeoNextActionStatus, SeoWorkPriority, SeoWorkStatus } from '../types/seoV11';
import { seoTargetGroups, seoWorkPriorities } from '../types/seoV11';
import { buildSeoNextActionsV11 } from '../lib/seoV11Analyzer';
import { createSeoWorkLogDraft, loadSeoNextActions, loadSeoV11Settings, loadSeoWorkLogs, saveSeoNextActions, saveSeoV11Settings, saveSeoWorkLogs } from '../lib/seoWorkLogStorage';

type Row = Record<string, unknown>;

interface SeoNextActionsV11Props {
  products?: Row[];
  blogs?: Row[];
  categories?: Row[];
  keywords?: Row[];
  clusters?: Row[];
  tasks?: Row[];
  logs?: Row[];
  searchConsole?: unknown;
  googleAds?: unknown;
  indexSummary?: unknown;
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
}

function statusButtonLabel(status: SeoNextActionStatus) {
  if (status === 'Đã đưa vào task') return 'Đã đưa vào việc hôm nay';
  return status;
}

export default function SeoNextActionsV11(props: SeoNextActionsV11Props) {
  const [actions, setActions] = useState<SeoNextAction[]>([]);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('Tất cả');
  const [priorityFilter, setPriorityFilter] = useState('Tất cả');
  const [typeFilter, setTypeFilter] = useState('Tất cả');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState('');

  useEffect(() => {
    setActions(loadSeoNextActions());
    setLastAnalyzedAt(loadSeoV11Settings().lastAnalyzedAt || '');
  }, []);

  function persist(nextActions: SeoNextAction[]) {
    setActions(nextActions);
    saveSeoNextActions(nextActions);
  }

  function analyze() {
    const workLogs = loadSeoWorkLogs();
    const next = buildSeoNextActionsV11({
      products: props.products,
      blogs: props.blogs,
      categories: props.categories,
      keywords: props.keywords,
      clusters: props.clusters,
      tasks: props.tasks,
      logs: workLogs,
      searchConsole: props.searchConsole,
      googleAds: props.googleAds,
      indexSummary: props.indexSummary,
    });
    persist(next);
    const now = new Date().toISOString();
    setLastAnalyzedAt(now);
    saveSeoV11Settings({ ...loadSeoV11Settings(), lastAnalyzedAt: now });
  }

  function updateActionStatus(id: string, status: SeoNextActionStatus) {
    const now = new Date().toISOString();
    persist(actions.map((item) => item.id === id ? { ...item, status, updatedAt: now } : item));
  }

  function saveActionToLog(action: SeoNextAction, status: SeoWorkStatus = 'Đang theo dõi') {
    const logs = loadSeoWorkLogs();
    const log = createSeoWorkLogDraft({
      title: action.title,
      description: action.reason,
      type: action.actionType,
      targetGroup: action.targetGroup,
      url: action.url || '',
      keyword: action.keyword || '',
      status,
      priority: action.priority,
      note: 'Tạo từ AI SEO v11.0 – Bước tiếp theo. Bằng chứng: ' + action.evidence.join(' | '),
    });
    saveSeoWorkLogs([log, ...logs]);
  }

  function addToToday(action: SeoNextAction) {
    updateActionStatus(action.id, 'Đã đưa vào task');
    saveActionToLog(action, 'Đang theo dõi');
  }

  const actionTypes = useMemo(() => {
    return Array.from(new Set(actions.map((item) => item.actionType).filter(Boolean))).sort();
  }, [actions]);

  const filteredActions = useMemo(() => {
    const keyword = normalize(search);
    return actions.filter((item) => {
      if (groupFilter !== 'Tất cả' && item.targetGroup !== groupFilter) return false;
      if (priorityFilter !== 'Tất cả' && item.priority !== priorityFilter) return false;
      if (typeFilter !== 'Tất cả' && item.actionType !== typeFilter) return false;
      if (statusFilter !== 'Tất cả' && item.status !== statusFilter) return false;
      if (!keyword) return true;
      return normalize([item.title, item.reason, item.url, item.keyword, item.targetGroup, item.evidence.join(' ')].join(' ')).includes(keyword);
    });
  }, [actions, search, groupFilter, priorityFilter, typeFilter, statusFilter]);

  const grouped = useMemo(() => {
    return {
      today: actions.slice(0, 10),
      week: actions.slice(0, 21),
      products: actions.filter((item) => item.actionType.includes('sản phẩm') || item.title.toLowerCase().includes('sản phẩm')).slice(0, 5),
      landing: actions.filter((item) => item.actionType.includes('danh mục') || item.url).slice(0, 5),
      blogs: actions.filter((item) => item.actionType.includes('bài viết')).slice(0, 5),
      seoKeywords: actions.filter((item) => item.keyword && item.actionType !== 'Theo dõi Keyword Planner').slice(0, 5),
      ads: actions.filter((item) => item.evidence.some((line) => line.includes('Keyword Planner'))).slice(0, 5),
      watch: actions.filter((item) => item.priority === 'Thấp' || item.status === 'Đề xuất mới').slice(0, 5),
    };
  }, [actions]);

  return (
    <section className={styles.sectionCard}>
      <div className={styles.cardHeader}>
        <div>
          <span>SEO v11.0</span>
          <h2>AI SEO v11.0 – Bước tiếp theo</h2>
          <p>Phân tích toàn bộ dữ liệu trước, sau đó mới dùng bộ lọc để xem đề xuất phù hợp. Không gọi Google API.</p>
          {lastAnalyzedAt && <p>Cập nhật lần cuối: {new Date(lastAnalyzedAt).toLocaleString('vi-VN')}</p>}
        </div>
        <button className={styles.primaryButton} type="button" onClick={analyze}>Phân tích bước tiếp theo</button>
      </div>

      <div className={styles.metricGridSmall}>
        <div><span>Đề xuất hiện có</span><strong>{actions.length}</strong></div>
        <div><span>Việc hôm nay</span><strong>{grouped.today.length}</strong></div>
        <div><span>Keyword nên SEO</span><strong>{grouped.seoKeywords.length}</strong></div>
        <div><span>Keyword nên Ads thử</span><strong>{grouped.ads.length}</strong></div>
        <div><span>Việc theo dõi</span><strong>{grouped.watch.length}</strong></div>
      </div>

      <div className={styles.v11Panel}>
        <h3>Bộ lọc đề xuất</h3>
        <p>Bộ lọc chỉ áp dụng sau khi đã phân tích, không giới hạn dữ liệu đầu vào.</p>
        <div className={styles.v11FilterBar}>
          <label>Tìm kiếm<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm URL, keyword, tiêu đề..." /></label>
          <label>Nhóm SEO<select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}><option>Tất cả</option>{seoTargetGroups.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Ưu tiên<select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option>Tất cả</option>{seoWorkPriorities.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Trạng thái<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Tất cả</option>{['Đề xuất mới', 'Đã đưa vào task', 'Đã làm', 'Bỏ qua'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Loại hành động<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>Tất cả</option>{actionTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
      </div>

      {actions.length === 0 && <div className={styles.v11Empty}><strong>Chưa có đề xuất v11.</strong><span>Bấm “Phân tích bước tiếp theo” để tạo danh sách việc nên làm dựa trên dữ liệu hiện có.</span></div>}

      <div className={styles.v11Panel}>
        <h3>10 việc SEO nên làm hôm nay</h3>
        <div className={styles.v11ActionGrid}>
          {filteredActions.slice(0, 10).map((action) => (
            <article className={styles.v11ActionCard} key={action.id}>
              <div className={styles.v11CardTop}>
                <span>{action.priority}</span>
                <small>{statusButtonLabel(action.status)}</small>
              </div>
              <h3>{action.title}</h3>
              <p><strong>Lý do:</strong> {action.reason}</p>
              <p><strong>Nhóm:</strong> {action.targetGroup}</p>
              {action.keyword && <p><strong>Keyword:</strong> {action.keyword}</p>}
              {action.url && <p className={styles.v11UrlText}><strong>URL:</strong> {action.url}</p>}
              <p><strong>Việc cần làm:</strong> {action.actionType}</p>
              <ul>{action.evidence.map((line, index) => <li key={action.id + '-evidence-' + index}>{line}</li>)}</ul>
              <div className={styles.v11Actions}>
                <button className={styles.secondaryButton} type="button" onClick={() => addToToday(action)}>Thêm vào việc hôm nay</button>
                <button className={styles.secondaryButton} type="button" onClick={() => saveActionToLog(action)}>Lưu vào nhật ký SEO</button>
                <button className={styles.secondaryButton} type="button" onClick={() => { updateActionStatus(action.id, 'Đã làm'); saveActionToLog(action, 'Đã làm'); }}>Đánh dấu đã làm</button>
                <button className={styles.dangerButton} type="button" onClick={() => updateActionStatus(action.id, 'Bỏ qua')}>Bỏ qua</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.gridThree}>
        <div className={styles.v11Panel}><h3>5 sản phẩm cần tối ưu nhất</h3>{grouped.products.map((item) => <p key={'product-' + item.id}>{item.title}</p>)}{grouped.products.length === 0 && <p>Chưa có đề xuất sản phẩm riêng.</p>}</div>
        <div className={styles.v11Panel}><h3>5 danh mục/landing page cần tối ưu</h3>{grouped.landing.map((item) => <p key={'landing-' + item.id}>{item.title}</p>)}{grouped.landing.length === 0 && <p>Chưa có đề xuất landing page riêng.</p>}</div>
        <div className={styles.v11Panel}><h3>5 bài viết cần cập nhật</h3>{grouped.blogs.map((item) => <p key={'blog-' + item.id}>{item.title}</p>)}{grouped.blogs.length === 0 && <p>Chưa có đề xuất bài viết riêng.</p>}</div>
      </div>
    </section>
  );
}
