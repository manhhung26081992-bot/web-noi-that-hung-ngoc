'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MetricCard, ModuleCard } from './Ui';
import {
  SEO_DASHBOARD_SYNC_KEYS,
  buildBackupJson,
  discoverLocalSeoKeys,
  getLocalSeoDashboardSnapshot,
  loadSeoDashboardFromSupabase,
  migrateLocalSeoDataToSupabase,
  parseBackupJson,
  restoreSupabaseDataToLocalStorage,
  saveOneSeoKeyToSupabase,
  saveSeoDashboardToSupabase,
  type SeoDashboardStoreItem,
} from '../lib/seoDashboardSupabaseSync';
import styles from '../seo-dashboard.module.css';

type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';

const UI = {
  noData: 'Chưa có',
  syncing: 'Đang đồng bộ',
  synced: 'Đã đồng bộ Supabase',
  error: 'Lỗi đồng bộ',
  local: 'Đang dùng dữ liệu localStorage',
  checking: 'Đang kiểm tra dữ liệu đồng bộ...',
  loadedFromSupabase: 'Đã tải {count} nhóm dữ liệu từ Supabase về localStorage.',
  supabaseHasData: 'Supabase đã có dữ liệu SEO Dashboard. Bạn có thể dùng Supabase hoặc đẩy dữ liệu máy này lên nếu cần.',
  localOnlyFound: 'Supabase chưa có dữ liệu. Máy này đang có dữ liệu localStorage, bạn có thể đồng bộ lên Supabase.',
  noSourceData: 'Chưa phát hiện dữ liệu SEO Dashboard trong Supabase hoặc localStorage.',
  checkFailed: 'Không kiểm tra được dữ liệu đồng bộ.',
  syncedCount: 'Đã đồng bộ {count} nhóm dữ liệu từ máy này lên Supabase.',
  syncFailed: 'Không đồng bộ được Supabase, dữ liệu tạm lưu trên trình duyệt này.',
  restored: 'Đã dùng dữ liệu Supabase và lưu {count} nhóm vào localStorage để làm cache.',
  restoreFailed: 'Không tải được dữ liệu từ Supabase.',
  keepLocal: 'Đang giữ dữ liệu localStorage tạm thời. Khi muốn dùng nhiều máy, hãy bấm Đồng bộ lên Supabase.',
  importConfirm: 'Bạn có chắc muốn nhập JSON dự phòng? Dữ liệu trong file sẽ ghi vào localStorage và đồng bộ lên Supabase.',
  invalidJson: 'File JSON không có dữ liệu SEO Dashboard hợp lệ.',
  importedJson: 'Đã nhập {count} nhóm dữ liệu từ JSON dự phòng và đồng bộ lên Supabase.',
  importFailed: 'Không nhập được JSON dự phòng.',
  autoSynced: 'Đã tự đồng bộ nhóm dữ liệu {key} lên Supabase.',
  title: 'Đồng bộ dữ liệu SEO v11.2',
  description: 'Dữ liệu SEO v11.2 được lưu trên Supabase để có thể làm việc ở nhiều máy. localStorage chỉ dùng làm bản dự phòng trên trình duyệt.',
  status: 'Trạng thái',
  localKeys: 'Key localStorage phát hiện',
  supabaseKeys: 'Key đã có trên Supabase',
  lastUpdated: 'Cập nhật gần nhất',
  conflictTitle: 'Phát hiện cả dữ liệu Supabase và dữ liệu trên máy này.',
  conflictDesc: 'Để tránh ghi đè nhầm, hãy chọn cách dùng dữ liệu bên dưới.',
  useSupabase: 'Dùng dữ liệu Supabase',
  pushLocal: 'Đẩy dữ liệu máy này lên Supabase',
  keepLocalButton: 'Giữ dữ liệu localStorage tạm thời',
  syncToSupabase: 'Đồng bộ lên Supabase',
  loadFromSupabase: 'Tải dữ liệu từ Supabase',
  checkSync: 'Kiểm tra dữ liệu đồng bộ',
  exportJson: 'Xuất JSON dự phòng',
  importJson: 'Nhập JSON dự phòng',
};

function withCount(template: string, count: number) {
  return template.replace('{count}', String(count));
}

function formatDate(value?: string) {
  if (!value) return UI.noData;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getStatusText(status: SyncStatus) {
  if (status === 'syncing') return UI.syncing;
  if (status === 'synced') return UI.synced;
  if (status === 'error') return UI.error;
  return UI.local;
}

export default function SeoDashboardSyncV112() {
  const [status, setStatus] = useState<SyncStatus>('local');
  const [message, setMessage] = useState(UI.checking);
  const [localKeys, setLocalKeys] = useState<string[]>([]);
  const [supabaseItems, setSupabaseItems] = useState<SeoDashboardStoreItem[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const syncTimers = useRef<Map<string, number>>(new Map());

  const localSnapshot = useMemo(() => getLocalSeoDashboardSnapshot(localKeys), [localKeys]);
  const localDataCount = localSnapshot.length;
  const supabaseDataCount = supabaseItems.length;
  const hasLocalData = localDataCount > 0;
  const hasSupabaseData = supabaseDataCount > 0;
  const hasConflict = hasLocalData && hasSupabaseData;

  async function refreshState(options?: { restore?: boolean }) {
    setStatus('syncing');
    setLocalKeys(discoverLocalSeoKeys());
    try {
      const items = await loadSeoDashboardFromSupabase();
      setSupabaseItems(items);
      const newest = items
        .map((item) => item.updatedAt)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) || '';
      setLastSyncedAt(newest);

      if (items.length && options?.restore) {
        const count = restoreSupabaseDataToLocalStorage(items);
        setLocalKeys(discoverLocalSeoKeys());
        setMessage(withCount(UI.loadedFromSupabase, count));
      } else if (items.length) {
        setMessage(UI.supabaseHasData);
      } else if (getLocalSeoDashboardSnapshot().length) {
        setMessage(UI.localOnlyFound);
        setStatus('local');
        return;
      } else {
        setMessage(UI.noSourceData);
      }
      setStatus('synced');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : UI.checkFailed);
    }
  }

  async function syncLocalToSupabase() {
    setStatus('syncing');
    try {
      const result = await migrateLocalSeoDataToSupabase();
      await refreshState();
      setMessage(withCount(UI.syncedCount, result.count));
      setStatus('synced');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : UI.syncFailed);
    }
  }

  async function restoreFromSupabase() {
    setStatus('syncing');
    try {
      const items = await loadSeoDashboardFromSupabase();
      const count = restoreSupabaseDataToLocalStorage(items);
      setSupabaseItems(items);
      setLocalKeys(discoverLocalSeoKeys());
      setLastSyncedAt(new Date().toISOString());
      setMessage(withCount(UI.restored, count));
      setStatus('synced');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : UI.restoreFailed);
    }
  }

  function keepLocalOnly() {
    setStatus('local');
    setMessage(UI.keepLocal);
  }

  function exportJson() {
    const json = buildBackupJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'noi-that-hung-ngoc-seo-dashboard-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File) {
    const confirmed = window.confirm(UI.importConfirm);
    if (!confirmed) return;

    setStatus('syncing');
    try {
      const text = await file.text();
      const items = parseBackupJson(text);
      if (!items.length) throw new Error(UI.invalidJson);
      const count = restoreSupabaseDataToLocalStorage(items);
      await saveSeoDashboardToSupabase(items);
      await refreshState();
      setMessage(withCount(UI.importedJson, count));
      setStatus('synced');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : UI.importFailed);
    }
  }

  useEffect(() => {
    refreshState({ restore: true });
  }, []);

  useEffect(() => {
    const originalSetItem = window.localStorage.setItem;
    const originalSetItemBound = originalSetItem.bind(window.localStorage);

    const scheduleSync = (key: string) => {
      if (!key.startsWith('noithathungngoc-') && !SEO_DASHBOARD_SYNC_KEYS.includes(key)) return;
      const currentTimer = syncTimers.current.get(key);
      if (currentTimer) window.clearTimeout(currentTimer);
      const timer = window.setTimeout(() => {
        saveOneSeoKeyToSupabase(key)
          .then(() => {
            setStatus('synced');
            setLastSyncedAt(new Date().toISOString());
            setLocalKeys(discoverLocalSeoKeys());
            setMessage(UI.autoSynced.replace('{key}', key));
          })
          .catch(() => {
            setStatus('error');
            setMessage(UI.syncFailed);
          })
          .finally(() => syncTimers.current.delete(key));
      }, 900);
      syncTimers.current.set(key, timer);
    };

    try {
      window.localStorage.setItem = function patchedSetItem(key: string, value: string) {
        originalSetItemBound(key, value);
        scheduleSync(key);
      };
    } catch {
      setMessage(UI.syncFailed);
    }

    return () => {
      try {
        if (window.localStorage.setItem !== originalSetItem) {
          window.localStorage.setItem = originalSetItem;
        }
      } catch {
        // Một số trình duyệt không cho gán lại localStorage.setItem.
      }
      syncTimers.current.forEach((timer) => window.clearTimeout(timer));
      syncTimers.current.clear();
    };
  }, []);

  return (
    <ModuleCard title={UI.title} description={UI.description}>
      <div className={styles.gridThree}>
        <MetricCard label={UI.status} value={getStatusText(status)} />
        <MetricCard label={UI.localKeys} value={String(localKeys.length)} />
        <MetricCard label={UI.supabaseKeys} value={String(supabaseDataCount)} />
      </div>

      <div className={styles.scV7Status}>
        <strong>{UI.lastUpdated}: {formatDate(lastSyncedAt)}</strong>
        <span>{message}</span>
      </div>

      {hasConflict ? (
        <div className={styles.alertSoft}>
          <strong>{UI.conflictTitle}</strong>
          <p>{UI.conflictDesc}</p>
          <div className={styles.buttonRow}>
            <button className={styles.primaryButton} type="button" onClick={restoreFromSupabase}>{UI.useSupabase}</button>
            <button className={styles.secondaryButton} type="button" onClick={syncLocalToSupabase}>{UI.pushLocal}</button>
            <button className={styles.secondaryButton} type="button" onClick={keepLocalOnly}>{UI.keepLocalButton}</button>
          </div>
        </div>
      ) : null}

      <div className={styles.buttonRow}>
        <button className={styles.primaryButton} type="button" onClick={syncLocalToSupabase}>{UI.syncToSupabase}</button>
        <button className={styles.secondaryButton} type="button" onClick={restoreFromSupabase}>{UI.loadFromSupabase}</button>
        <button className={styles.secondaryButton} type="button" onClick={() => refreshState()}>{UI.checkSync}</button>
        <button className={styles.uploadButton} type="button" onClick={exportJson}>{UI.exportJson}</button>
        <button className={styles.uploadButton} type="button" onClick={() => fileInputRef.current?.click()}>{UI.importJson}</button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.currentTarget.value = '';
          if (file) importJson(file);
        }}
      />
    </ModuleCard>
  );
}
