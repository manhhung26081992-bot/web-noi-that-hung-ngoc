import type { SeoNextAction, SeoV11Settings, SeoWorkLogItem, SeoWorkPriority, SeoWorkStatus } from '../types/seoV11';

export const SEO_WORK_LOG_V11_KEY = 'noithathungngoc-seo-work-log-v11';
export const SEO_WORK_LOG_V1_KEY = 'noithathungngoc-seo-work-log-v1';
export const SEO_NEXT_ACTIONS_V11_KEY = 'noithathungngoc-seo-next-actions-v11';
export const SEO_V11_SETTINGS_KEY = 'noithathungngoc-seo-v11-settings';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage có thể đầy hoặc bị chặn, dashboard không được crash.
  }
}

export function createSeoId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return prefix + '-' + crypto.randomUUID();
  }
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function now() {
  return new Date().toISOString();
}

function normalizeStatus(value: unknown): SeoWorkStatus {
  const text = String(value || '').trim();
  const allowed: SeoWorkStatus[] = ['Đã làm', 'Đang theo dõi', 'Cần sửa tiếp', 'Đã submit index', 'Đã index', 'Chưa hiệu quả', 'Có tín hiệu tốt'];
  return allowed.includes(text as SeoWorkStatus) ? (text as SeoWorkStatus) : 'Đã làm';
}

function normalizePriority(value: unknown): SeoWorkPriority {
  const text = String(value || '').trim();
  const allowed: SeoWorkPriority[] = ['Rất cao', 'Cao', 'Trung bình', 'Thấp'];
  return allowed.includes(text as SeoWorkPriority) ? (text as SeoWorkPriority) : 'Trung bình';
}

function normalizeLog(item: Partial<SeoWorkLogItem> & Record<string, unknown>, index: number): SeoWorkLogItem {
  const createdAt = String(item.createdAt || item.date || now());
  return {
    id: String(item.id || createSeoId('log-' + index)),
    date: String(item.date || today()),
    type: String(item.type || 'Khác'),
    targetGroup: String(item.targetGroup || 'Toàn website'),
    url: String(item.url || ''),
    keyword: String(item.keyword || ''),
    title: String(item.title || item.description || 'Việc SEO đã làm'),
    description: String(item.description || ''),
    beforeMetric: item.beforeMetric ? String(item.beforeMetric) : '',
    afterMetric: item.afterMetric ? String(item.afterMetric) : '',
    status: normalizeStatus(item.status),
    priority: normalizePriority(item.priority),
    nextCheckDate: item.nextCheckDate ? String(item.nextCheckDate) : '',
    note: String(item.note || ''),
    createdAt,
    updatedAt: String(item.updatedAt || createdAt),
  };
}

export function createSeoWorkLogDraft(partial: Partial<SeoWorkLogItem> = {}): SeoWorkLogItem {
  const timestamp = now();
  return normalizeLog({
    id: createSeoId('seo-log'),
    date: today(),
    type: 'Khác',
    targetGroup: 'Toàn website',
    url: '',
    keyword: '',
    title: '',
    description: '',
    beforeMetric: '',
    afterMetric: '',
    status: 'Đã làm',
    priority: 'Trung bình',
    nextCheckDate: '',
    note: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...partial,
  }, 0);
}

export function createSeoNextActionDraft(partial: Partial<SeoNextAction> = {}): SeoNextAction {
  const timestamp = now();
  return {
    id: partial.id || createSeoId('seo-action'),
    title: partial.title || 'Việc SEO cần làm',
    reason: partial.reason || '',
    targetGroup: partial.targetGroup || 'Toàn website',
    url: partial.url || '',
    keyword: partial.keyword || '',
    actionType: partial.actionType || 'Khác',
    priority: normalizePriority(partial.priority),
    status: partial.status || 'Đề xuất mới',
    evidence: Array.isArray(partial.evidence) ? partial.evidence.map(String) : [],
    createdAt: partial.createdAt || timestamp,
    updatedAt: partial.updatedAt || timestamp,
  };
}

function demoLogs(): SeoWorkLogItem[] {
  const base = [
    ['Sửa sitemap.xml hợp lệ, URL sản phẩm dùng /san-pham/[slug].', 'Sửa sitemap', 'Toàn website', 'Đã làm', 'Rất cao'],
    ['Ẩn/noindex danh mục rỗng để tránh Google đánh giá web mỏng.', 'Tối ưu danh mục', 'Toàn website', 'Đã làm', 'Cao'],
    ['Submit lại sitemap trong Search Console và không còn lỗi.', 'Submit index', 'Toàn website', 'Đã submit index', 'Cao'],
    ['Thêm Product schema cho trang sản phẩm.', 'Sửa schema', 'Toàn website', 'Đã làm', 'Cao'],
    ['Thêm Category/Collection schema cho trang danh mục.', 'Sửa schema', 'Toàn website', 'Đã làm', 'Cao'],
    ['Product snippets và Merchant listings đã xanh.', 'Theo dõi Search Console', 'Toàn website', 'Có tín hiệu tốt', 'Cao'],
    ['Bổ sung nội dung SEO cuối trang danh mục.', 'Tối ưu danh mục', 'Toàn website', 'Đã làm', 'Cao'],
    ['Sửa link sản phẩm về đúng dạng /san-pham/[slug].', 'Sửa lỗi 404', 'Toàn website', 'Đã làm', 'Rất cao'],
    ['Tối ưu ảnh sản phẩm, card sản phẩm và phân trang.', 'Tối ưu giao diện', 'Toàn website', 'Đã làm', 'Trung bình'],
    ['Thêm sản phẩm liên quan và sản phẩm bán chạy.', 'Internal link', 'Toàn website', 'Đã làm', 'Trung bình'],
    ['Kiểm tra và sửa lỗi 404 nội bộ.', 'Sửa lỗi 404', 'Toàn website', 'Đã làm', 'Cao'],
    ['Sửa lỗi blog 404.', 'Tối ưu bài viết', 'Tin tức / blog', 'Đã làm', 'Cao'],
    ['Cho seo_content hỗ trợ HTML thuần.', 'Tối ưu bài viết', 'Tin tức / blog', 'Đã làm', 'Trung bình'],
    ['Thêm lượt xem thật từ Supabase cho tin tức.', 'Tối ưu bài viết', 'Tin tức / blog', 'Đã làm', 'Trung bình'],
    ['Thêm phân trang và sidebar đọc nhiều cho trang tin tức.', 'Tối ưu bài viết', 'Tin tức / blog', 'Đã làm', 'Trung bình'],
    ['Thêm bot tư vấn miễn phí.', 'Tối ưu giao diện', 'Toàn website', 'Đã làm', 'Thấp'],
    ['Thêm validate server-side chống đơn ảo.', 'Khác', 'Toàn website', 'Đã làm', 'Rất cao'],
    ['Chỉ gửi Telegram sau khi insert Supabase thành công.', 'Khác', 'Toàn website', 'Đã làm', 'Rất cao'],
    ['Tạo SEO Dashboard admin tại /admin/seo.', 'Khác', 'Toàn website', 'Đã làm', 'Cao'],
    ['Thêm import thủ công Search Console CSV.', 'Theo dõi Search Console', 'Toàn website', 'Đã làm', 'Cao'],
    ['Thêm import thủ công Google Ads / Keyword Planner CSV.', 'Theo dõi Keyword Planner', 'Toàn website', 'Đã làm', 'Cao'],
    ['Thêm Trợ lý SEO v10.0 đọc toàn bộ dữ liệu.', 'Khác', 'Toàn website', 'Đã làm', 'Cao'],
  ] as const;

  return base.map((row, index) => {
    const date = new Date(Date.now() - index * 86400000).toISOString().slice(0, 10);
    return createSeoWorkLogDraft({
      id: createSeoId('demo-log-' + index),
      date,
      title: row[0],
      description: row[0],
      type: row[1],
      targetGroup: row[2],
      status: row[3] as SeoWorkStatus,
      priority: row[4] as SeoWorkPriority,
      note: 'Dữ liệu mẫu v11 dựa trên các việc SEO đã triển khai trước đó.',
      createdAt: date + 'T08:00:00.000Z',
      updatedAt: date + 'T08:00:00.000Z',
    });
  });
}

export function loadSeoV11Settings(): SeoV11Settings {
  return readJson<SeoV11Settings>(SEO_V11_SETTINGS_KEY, {});
}

export function saveSeoV11Settings(settings: SeoV11Settings) {
  writeJson(SEO_V11_SETTINGS_KEY, settings);
}

export function loadSeoWorkLogs(): SeoWorkLogItem[] {
  const current = readJson<unknown>(SEO_WORK_LOG_V11_KEY, null);
  if (Array.isArray(current)) return current.map((item, index) => normalizeLog(item as Record<string, unknown>, index));

  const old = readJson<unknown>(SEO_WORK_LOG_V1_KEY, null);
  if (Array.isArray(old) && old.length > 0) {
    const migrated = old.map((item, index) => normalizeLog(item as Record<string, unknown>, index));
    writeJson(SEO_WORK_LOG_V11_KEY, migrated);
    saveSeoV11Settings({ ...loadSeoV11Settings(), migratedFromV1: true });
    return migrated;
  }

  const demo = demoLogs();
  writeJson(SEO_WORK_LOG_V11_KEY, demo);
  saveSeoV11Settings({ ...loadSeoV11Settings(), lastDemoCreatedAt: now() });
  return demo;
}

export function saveSeoWorkLogs(logs: SeoWorkLogItem[]) {
  writeJson(SEO_WORK_LOG_V11_KEY, logs.map((item, index) => normalizeLog(item as unknown as Record<string, unknown>, index)));
}

export function loadSeoNextActions(): SeoNextAction[] {
  const current = readJson<unknown>(SEO_NEXT_ACTIONS_V11_KEY, []);
  if (!Array.isArray(current)) return [];
  return current.map((item) => createSeoNextActionDraft(item as Partial<SeoNextAction>));
}

export function saveSeoNextActions(actions: SeoNextAction[]) {
  writeJson(SEO_NEXT_ACTIONS_V11_KEY, actions.map((item) => createSeoNextActionDraft(item)));
}

export function resetSeoWorkLogDemo() {
  const demo = demoLogs();
  saveSeoWorkLogs(demo);
  saveSeoV11Settings({ ...loadSeoV11Settings(), lastDemoCreatedAt: now() });
  return demo;
}
