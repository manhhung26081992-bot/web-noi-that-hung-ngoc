'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MetricCard, ModuleCard } from './Ui';
import {
  buildBackupJson,
  discoverLocalSeoKeys,
  dispatchSeoDashboardRestoredEvent,
  getLocalSeoDashboardSnapshot,
  isChunkStoreKey,
  isSeoDashboardStorageKey,
  loadSeoDashboardFromSupabase,
  migrateLocalSeoDataToSupabase,
  parseBackupJson,
  restoreSupabaseDataToLocalStorage,
  saveOneSeoKeyToSupabase,
  saveSeoDashboardToSupabase,
  type SeoDashboardStoreItem,
  type SeoDashboardSyncResult,
} from '../lib/seoDashboardSupabaseSync';
import styles from '../seo-dashboard.module.css';

type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';

type SeoTableSource = {
  name: string;
  count: number;
  note?: string;
};

type Props = {
  seoTableSources?: SeoTableSource[];
  aiDataSources?: string[];
};

const UI = {
  noData: 'Chưa có',
  syncing: 'Đang đồng bộ',
  synced: 'Đã đồng bộ Supabase',
  error: 'Lỗi đồng bộ',
  local: 'Đang dùng dữ liệu localStorage tạm thời',
  checking: 'Đang kiểm tra toàn bộ dữ liệu SEO...',
  loadedFromSupabase: 'Đã tải {count} nhóm dữ liệu từ Supabase và cập nhật dashboard. Không cần tải lại trang.',
  supabaseHasData: 'Supabase đã có dữ liệu SEO Dashboard. Dashboard đang ưu tiên Supabase làm nguồn chính.',
  localOnlyFound: 'Supabase chưa có dữ liệu cho một số mục. Máy này đang có dữ liệu localStorage, bạn có thể đẩy lên Supabase nếu muốn dùng ở nhiều máy.',
  noSourceData: 'Chưa phát hiện dữ liệu SEO Dashboard trong Supabase hoặc localStorage.',
  checkFailed: 'Không kiểm tra được dữ liệu đồng bộ.',
  syncedCount: 'Đồng bộ xong: {success} key thành công, {failed} key lỗi, {chunked} key chia nhỏ.',
  syncFailed: 'Không đồng bộ được Supabase, dữ liệu tạm vẫn còn trên trình duyệt này.',
  restored: 'Đã tải {count} nhóm dữ liệu từ Supabase và cập nhật dashboard. Không cần tải lại trang.',
  restoreFailed: 'Không tải được dữ liệu từ Supabase.',
  keepLocal: 'Đang giữ dữ liệu localStorage tạm thời. Khi muốn dùng nhiều máy, hãy bấm Đẩy dữ liệu cục bộ lên Supabase.',
  importConfirm: 'Bạn có chắc muốn nhập JSON dự phòng? Dữ liệu trong file sẽ ghi vào localStorage và đồng bộ lên Supabase.',
  invalidJson: 'File JSON không có dữ liệu SEO Dashboard hợp lệ.',
  importedJson: 'Đã nhập {count} nhóm dữ liệu từ JSON dự phòng và đồng bộ lên Supabase.',
  importFailed: 'Không nhập được JSON dự phòng.',
  autoSynced: 'Đã tự đồng bộ nhóm dữ liệu {key} lên Supabase.',
  title: 'Đồng bộ dữ liệu SEO v11.2.3',
  description: 'Supabase là nguồn dữ liệu chính cho AI SEO. localStorage chỉ dùng làm cache tạm và bản dự phòng trên trình duyệt.',
  status: 'Trạng thái nguồn dữ liệu',
  localKeys: 'Tổng key localStorage',
  supabaseKeys: 'Tổng store_key trên Supabase',
  supabaseReady: 'Dữ liệu đã có trên Supabase',
  localOnly: 'Dữ liệu chỉ có ở localStorage',
  seoTables: 'Dữ liệu ở bảng seo_* riêng',
  aiSources: 'Nguồn đã cấp cho AI SEO',
  chunkedKeys: 'Key chia nhỏ',
  lastUpdated: 'Cập nhật gần nhất',
  supabasePrimary: 'Supabase đang là nguồn chính',
  localUnsynced: 'Còn dữ liệu cục bộ chưa đồng bộ',
  conflictTitle: 'Phát hiện dữ liệu cục bộ chưa có trên Supabase.',
  conflictDesc: 'Để tránh ghi đè nhầm, hãy chọn cách dùng dữ liệu bên dưới. Dashboard không tự đẩy dữ liệu cũ lên Supabase nếu bạn chưa bấm.',
  useSupabase: 'Dùng dữ liệu Supabase',
  pushLocal: 'Đẩy dữ liệu cục bộ lên Supabase',
  keepLocalButton: 'Giữ localStorage tạm thời',
  syncToSupabase: 'Đẩy dữ liệu cục bộ lên Supabase',
  loadFromSupabase: 'Tải toàn bộ dữ liệu từ Supabase',
  checkSync: 'Kiểm tra toàn bộ dữ liệu SEO',
  exportJson: 'Xuất JSON dự phòng',
  importJson: 'Nhập JSON dự phòng',
};

function withCount(template: string, count: number) {
  return template.replace('{count}', String(count));
}

function formatResultMessage(result: SeoDashboardSyncResult) {
  return UI.syncedCount
    .replace('{success}', String(result.successKeys.length))
    .replace('{failed}', String(result.failedKeys.length))
    .replace('{chunked}', String(result.chunkedKeys.length));
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

function getStatusText(status: SyncStatus, sourceStatus: string) {
  if (status === 'syncing') return UI.syncing;
  if (status === 'error') return UI.error;
  if (status === 'synced') return sourceStatus;
  return UI.local;
}

function summarizeKeys(keys: string[]) {
  if (!keys.length) return 'Không có';
  return keys.slice(0, 8).join(', ') + (keys.length > 8 ? ' và ' + (keys.length - 8) + ' key khác' : '');
}

export default function SeoDashboardSyncV112({ seoTableSources = [], aiDataSources = [] }: Props) {
  const [status, setStatus] = useState<SyncStatus>('local');
  const [message, setMessage] = useState(UI.checking);
  const [localKeys, setLocalKeys] = useState<string[]>([]);
  const [supabaseItems, setSupabaseItems] = useState<SeoDashboardStoreItem[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [lastResult, setLastResult] = useState<SeoDashboardSyncResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const syncTimers = useRef<Map<string, number>>(new Map());
  const restoringRef = useRef(false);

  const localSnapshot = useMemo(() => getLocalSeoDashboardSnapshot(localKeys), [localKeys]);
  const localDataCount = localSnapshot.length;
  const supabaseStoreKeys = useMemo(
    () => supabaseItems.map((item) => item.storeKey).filter((key) => key && !isChunkStoreKey(key)),
    [supabaseItems],
  );
  const supabaseKeySet = useMemo(() => new Set(supabaseStoreKeys), [supabaseStoreKeys]);
  const localKeySet = useMemo(() => new Set(localSnapshot.map((item) => item.storeKey)), [localSnapshot]);
  const localOnlyKeys = useMemo(
    () => localSnapshot.map((item) => item.storeKey).filter((key) => !supabaseKeySet.has(key)),
    [localSnapshot, supabaseKeySet],
  );
  const supabaseOnlyKeys = useMemo(
    () => supabaseStoreKeys.filter((key) => !localKeySet.has(key)),
    [supabaseStoreKeys, localKeySet],
  );
  const syncedKeys = useMemo(
    () => supabaseStoreKeys.filter((key) => localKeySet.has(key)),
    [supabaseStoreKeys, localKeySet],
  );
  const supabaseDataCount = supabaseStoreKeys.length;
  const supabaseChunkedCount = supabaseItems.filter((item) => item.chunked).length;
  const seoTableRowCount = seoTableSources.reduce((sum, item) => sum + item.count, 0);
  const hasLocalData = localDataCount > 0;
  const hasSupabaseData = supabaseDataCount > 0;
  const hasConflict = hasSupabaseData && localOnlyKeys.length > 0;
  const sourceStatus = hasSupabaseData && localOnlyKeys.length === 0 ? UI.supabasePrimary : UI.localUnsynced;

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
        restoringRef.current = true;
        const restoreResult = restoreSupabaseDataToLocalStorage(items);
        restoringRef.current = false;
        setLocalKeys(discoverLocalSeoKeys());
        setMessage(withCount(UI.loadedFromSupabase, restoreResult.count));
        dispatchSeoDashboardRestoredEvent(restoreResult.restoredKeys);
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
      restoringRef.current = false;
      setStatus('error');
      setMessage(error instanceof Error ? error.message : UI.checkFailed);
    }
  }

  async function syncLocalToSupabase() {
    setStatus('syncing');
    setLastResult(null);
    try {
      const result = await migrateLocalSeoDataToSupabase();
      setLastResult(result);
      await refreshState();
      setMessage(formatResultMessage(result));
      setStatus(result.failedKeys.length ? 'error' : 'synced');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : UI.syncFailed);
    }
  }

  async function restoreFromSupabase() {
    setStatus('syncing');
    try {
      const items = await loadSeoDashboardFromSupabase();
      restoringRef.current = true;
      const restoreResult = restoreSupabaseDataToLocalStorage(items);
      restoringRef.current = false;
      setSupabaseItems(items);
      setLocalKeys(discoverLocalSeoKeys());
      setLastSyncedAt(new Date().toISOString());
      setMessage(withCount(UI.restored, restoreResult.count));
      dispatchSeoDashboardRestoredEvent(restoreResult.restoredKeys);
      setStatus('synced');
    } catch (error) {
      restoringRef.current = false;
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
    setLastResult(null);
    try {
      const text = await file.text();
      const items = parseBackupJson(text);
      if (!items.length) throw new Error(UI.invalidJson);
      restoringRef.current = true;
      const restoreResult = restoreSupabaseDataToLocalStorage(items);
      restoringRef.current = false;
      const result = await saveSeoDashboardToSupabase(items);
      setLastResult(result);
      await refreshState();
      setMessage(withCount(UI.importedJson, restoreResult.count) + ' ' + formatResultMessage(result));
      dispatchSeoDashboardRestoredEvent(restoreResult.restoredKeys);
      setStatus(result.failedKeys.length ? 'error' : 'synced');
    } catch (error) {
      restoringRef.current = false;
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
      if (restoringRef.current || !isSeoDashboardStorageKey(key)) return;
      const currentTimer = syncTimers.current.get(key);
      if (currentTimer) window.clearTimeout(currentTimer);
      const timer = window.setTimeout(() => {
        saveOneSeoKeyToSupabase(key)
          .then((result) => {
            setLastResult(result);
            setStatus(result.failedKeys.length ? 'error' : 'synced');
            setLastSyncedAt(new Date().toISOString());
            setLocalKeys(discoverLocalSeoKeys());
            setMessage(result.failedKeys.length ? UI.syncFailed : UI.autoSynced.replace('{key}', key));
          })
          .catch((error) => {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : UI.syncFailed);
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
        <MetricCard label={UI.status} value={getStatusText(status, sourceStatus)} />
        <MetricCard label={UI.localKeys} value={String(localKeys.length)} />
        <MetricCard label={UI.supabaseKeys} value={String(supabaseDataCount)} />
        <MetricCard label={UI.supabaseReady} value={String(syncedKeys.length)} />
        <MetricCard label={UI.localOnly} value={String(localOnlyKeys.length)} />
        <MetricCard label={UI.seoTables} value={String(seoTableRowCount)} />
        <MetricCard label={UI.aiSources} value={String(aiDataSources.length)} />
        <MetricCard label={UI.chunkedKeys} value={String(supabaseChunkedCount)} />
      </div>

      <div className={styles.scV7Status}>
        <strong>{UI.lastUpdated}: {formatDate(lastSyncedAt)}</strong>
        <span>{message}</span>
      </div>

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Nguồn dữ liệu</th>
              <th>Số lượng</th>
              <th>Vai trò</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>seo_dashboard_store</td>
              <td>{supabaseDataCount}</td>
              <td>Nguồn chính cho dữ liệu import, workbench, checklist, lịch sử AI và cấu hình động.</td>
            </tr>
            <tr>
              <td>localStorage cache</td>
              <td>{localDataCount}</td>
              <td>Bản tạm trên trình duyệt, được phục hồi từ Supabase khi mở dashboard.</td>
            </tr>
            {seoTableSources.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{item.count}</td>
                <td>{item.note || 'Bảng SEO riêng trong Supabase.'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {aiDataSources.length ? (
        <div className={styles.scV7Status}>
          <strong>Dữ liệu AI SEO đang dùng</strong>
          <span>{aiDataSources.join(' · ')}</span>
        </div>
      ) : null}

      {localOnlyKeys.length || supabaseOnlyKeys.length ? (
        <div className={styles.alert}>
          <strong>Đối chiếu key đồng bộ</strong>
          <p>Chỉ có ở localStorage: {summarizeKeys(localOnlyKeys)}</p>
          <p>Chỉ có ở Supabase: {summarizeKeys(supabaseOnlyKeys)}</p>
        </div>
      ) : null}

      {lastResult ? (
        <div className={styles.alert}>
          <strong>Kết quả đồng bộ gần nhất</strong>
          <p>
            Thành công: {lastResult.successKeys.length} · Lỗi: {lastResult.failedKeys.length} ·
            Bỏ qua: {lastResult.skippedKeys.length} · Chia nhỏ: {lastResult.chunkedKeys.length}
          </p>
          {lastResult.chunkedKeys.length ? (
            <p>Dữ liệu quá lớn, hệ thống đã chuyển sang đồng bộ từng phần: {lastResult.chunkedKeys.slice(0, 6).join(', ')}</p>
          ) : null}
          {lastResult.failedKeys.length ? (
            <ul>
              {lastResult.failedKeys.slice(0, 6).map((item) => (
                <li key={item.storeKey}>
                  Không đồng bộ được key: {item.storeKey}. Dữ liệu vẫn còn trong localStorage. Lý do: {item.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {hasConflict ? (
        <div className={styles.alert}>
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
