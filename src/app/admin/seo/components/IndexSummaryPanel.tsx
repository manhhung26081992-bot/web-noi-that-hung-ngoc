'use client';

import { memo, useEffect, useState } from 'react';
import { Badge, EmptyState, ModuleCard } from './Ui';
import type { IndexSummaryManual } from '../types/seo';
import styles from '../seo-dashboard.module.css';

export const INDEX_SUMMARY_STORAGE_KEY = 'noithathungngoc-index-summary-v1';

type Props = {
  onData?: (data: IndexSummaryManual | null) => void;
};

function toInputValue(value: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const number = Number(trimmed.replace(/[^\d]/g, ''));
  return Number.isFinite(number) ? number : null;
}

function IndexSummaryPanel({ onData }: Props) {
  const [indexedUrls, setIndexedUrls] = useState('');
  const [notIndexedUrls, setNotIndexedUrls] = useState('');
  const [mainIssue, setMainIssue] = useState('');
  const [lastCheckedDate, setLastCheckedDate] = useState('');
  const [saved, setSaved] = useState<IndexSummaryManual | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(INDEX_SUMMARY_STORAGE_KEY);
      if (!raw) {
        onData?.(null);
        return;
      }
      const data = JSON.parse(raw) as IndexSummaryManual;
      setIndexedUrls(toInputValue(data.indexedUrls));
      setNotIndexedUrls(toInputValue(data.notIndexedUrls));
      setMainIssue(data.mainIssue || '');
      setLastCheckedDate(data.lastCheckedDate || '');
      setSaved(data);
      onData?.(data);
    } catch {
      window.localStorage.removeItem(INDEX_SUMMARY_STORAGE_KEY);
      setSaved(null);
      onData?.(null);
    }
  }, [onData]);

  function save() {
    const data: IndexSummaryManual = {
      indexedUrls: parseOptionalNumber(indexedUrls),
      notIndexedUrls: parseOptionalNumber(notIndexedUrls),
      mainIssue: mainIssue.trim(),
      lastCheckedDate,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(INDEX_SUMMARY_STORAGE_KEY, JSON.stringify(data));
    setSaved(data);
    onData?.(data);
  }

  function clear() {
    setIndexedUrls('');
    setNotIndexedUrls('');
    setMainIssue('');
    setLastCheckedDate('');
    setSaved(null);
    window.localStorage.removeItem(INDEX_SUMMARY_STORAGE_KEY);
    onData?.(null);
  }

  return (
    <ModuleCard
      title="Index Summary thủ công"
      description="Tóm tắt nhẹ tình trạng index nếu bạn kiểm tra thủ công trong Search Console. Không dùng công cụ kiểm tra URL tự động."
      action={<Badge status={saved ? 'ok' : 'pending'}>{saved ? 'Đã lưu tóm tắt index' : 'Chưa có dữ liệu index thật'}</Badge>}
    >
      <div className={styles.indexSummaryGrid}>
        <label>
          <span>URL đã index</span>
          <input inputMode="numeric" value={indexedUrls} onChange={(event) => setIndexedUrls(event.target.value)} placeholder="Ví dụ: 388" />
        </label>
        <label>
          <span>URL chưa index</span>
          <input inputMode="numeric" value={notIndexedUrls} onChange={(event) => setNotIndexedUrls(event.target.value)} placeholder="Ví dụ: 24" />
        </label>
        <label>
          <span>Lý do chính</span>
          <input value={mainIssue} onChange={(event) => setMainIssue(event.target.value)} placeholder="Ví dụ: Alternate page with proper canonical tag" />
        </label>
        <label>
          <span>Ngày kiểm tra</span>
          <input type="date" value={lastCheckedDate} onChange={(event) => setLastCheckedDate(event.target.value)} />
        </label>
      </div>
      <div className={styles.scImportActions}>
        <button className={styles.primaryButton} type="button" onClick={save}>Lưu tóm tắt index</button>
        <button className={styles.secondaryButton} type="button" onClick={clear}>Xóa tóm tắt index</button>
      </div>
      {saved ? (
        <p className={styles.indexSummaryNote}>Dữ liệu này là tóm tắt bạn nhập thủ công. URL tạo từ website không đồng nghĩa với URL Google đã index.</p>
      ) : (
        <EmptyState title="Chưa có dữ liệu index thật" detail="Dashboard sẽ không hiển thị số 0 giả cho URL đã index hoặc chưa index." />
      )}
    </ModuleCard>
  );
}

export default memo(IndexSummaryPanel);
