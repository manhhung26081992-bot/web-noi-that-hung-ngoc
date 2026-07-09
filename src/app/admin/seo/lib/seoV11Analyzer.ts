import type { SeoNextAction, SeoWorkLogItem, SeoWorkPriority } from '../types/seoV11';
import { createSeoId } from './seoWorkLogStorage';

type Row = Record<string, unknown>;

export interface SeoV11AnalyzerInput {
  products?: Row[];
  blogs?: Row[];
  categories?: Row[];
  keywords?: Row[];
  clusters?: Row[];
  tasks?: Row[];
  logs?: SeoWorkLogItem[];
  searchConsole?: unknown;
  googleAds?: unknown;
  indexSummary?: unknown;
}

function text(value: unknown): string {
  return String(value || '').trim();
}

function normalize(value: unknown): string {
  return text(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

function numberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = text(value).replace(/%/g, '').replace(/\s/g, '').replace(/,/g, '.');
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asRows(value: unknown): Row[] {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => item as Row);
  return [];
}

function nestedRows(source: unknown, keys: string[]): Row[] {
  if (!source || typeof source !== 'object') return [];
  const obj = source as Row;
  for (const key of keys) {
    const rows = asRows(obj[key]);
    if (rows.length) return rows;
  }
  return [];
}

function searchRows(source: unknown): Row[] {
  const rows = [
    ...nestedRows(source, ['queries', 'queryRows']),
    ...nestedRows(source, ['pages', 'pageRows']),
    ...nestedRows(source, ['combined', 'items', 'rows']),
  ];
  return rows;
}

function adsRows(source: unknown): Row[] {
  return [
    ...nestedRows(source, ['items', 'keywords', 'rows', 'data']),
    ...asRows(source),
  ];
}

function mainText(row: Row) {
  return [row.keyword, row.query, row.page, row.url, row.title, row.name, row.slug, row.category].map(text).join(' ');
}

export function detectSeoTargetGroup(value: unknown): string {
  const source = normalize(value);
  if (/giuong|giuong sat|giuong tang/.test(source)) return 'Giường sắt / giường tầng sắt';
  if (/ban lam viec|ban van phong|ban nhan vien|ban chan sat|ban hop/.test(source)) return 'Bàn làm việc / bàn văn phòng';
  if (/ban hoc sinh|ban ghe hoc sinh|truong hoc|bang tu/.test(source)) return 'Bàn ghế học sinh / nội thất trường học';
  if (/ghe chan quy/.test(source)) return 'Ghế chân quỳ';
  if (/ghe giam doc/.test(source)) return 'Ghế giám đốc';
  if (/tu locker|locker/.test(source)) return 'Tủ locker';
  if (/tu quan ao/.test(source)) return 'Tủ quần áo';
  if (/tin tuc|blog|bai viet/.test(source)) return 'Tin tức / blog';
  return 'Toàn website';
}

function isMainGroup(group: string) {
  return group === 'Giường sắt / giường tầng sắt' || group === 'Bàn làm việc / bàn văn phòng' || group === 'Bàn ghế học sinh / nội thất trường học';
}

function groupBonus(group: string) {
  return isMainGroup(group) ? 18 : group === 'Toàn website' ? 4 : 0;
}

function priorityFromScore(score: number): SeoWorkPriority {
  if (score >= 85) return 'Rất cao';
  if (score >= 70) return 'Cao';
  if (score >= 45) return 'Trung bình';
  return 'Thấp';
}

function addUnique(actions: SeoNextAction[], action: Omit<SeoNextAction, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'priority'> & { score: number }) {
  const now = new Date().toISOString();
  const key = normalize([action.title, action.keyword, action.url, action.targetGroup].join('|'));
  if (actions.some((item) => normalize([item.title, item.keyword, item.url, item.targetGroup].join('|')) === key)) return;
  actions.push({
    id: createSeoId('next-action'),
    title: action.title,
    reason: action.reason,
    targetGroup: action.targetGroup,
    url: action.url,
    keyword: action.keyword,
    actionType: action.actionType,
    priority: priorityFromScore(action.score),
    status: 'Đề xuất mới',
    evidence: action.evidence,
    createdAt: now,
    updatedAt: now,
  });
}

function rowUrl(row: Row) {
  return text(row.page || row.url || row.target_url || row.targetUrl);
}

function rowKeyword(row: Row) {
  return text(row.query || row.keyword || row['Top queries'] || row['Từ khóa']);
}

function looksLikeUrl(value: unknown): boolean {
  const source = text(value).toLowerCase();
  return source.startsWith('http://') || source.startsWith('https://');
}

function searchKeywordAndUrl(row: Row) {
  const rawKeyword = rowKeyword(row);
  const rawUrl = rowUrl(row);

  if (looksLikeUrl(rawKeyword)) {
    return {
      keyword: '',
      url: rawUrl || rawKeyword,
    };
  }

  return {
    keyword: rawKeyword,
    url: rawUrl,
  };
}

function positionActionTitle(position: number, keyword: string, url: string) {
  const positionText = position.toFixed(1);
  if (keyword) return 'Đẩy từ khóa đang ở vị trí ' + positionText + ': ' + keyword;
  if (url) return 'Đẩy URL đang ở vị trí ' + positionText;
  return 'Đẩy trang đang ở vị trí ' + positionText;
}

export function buildSeoNextActionsV11(input: SeoV11AnalyzerInput): SeoNextAction[] {
  const actions: SeoNextAction[] = [];
  const products = input.products || [];
  const blogs = input.blogs || [];
  const logs = input.logs || [];
  const scRows = searchRows(input.searchConsole);
  const plannerRows = adsRows(input.googleAds);
  const sevenDaysAgo = Date.now() - 7 * 86400000;

  for (const row of scRows.slice(0, 300)) {
    const { keyword, url } = searchKeywordAndUrl(row);
    const label = keyword || url;
    if (!label) continue;
    const group = detectSeoTargetGroup(label + ' ' + url);
    const impressions = numberValue(row.impressions);
    const clicks = numberValue(row.clicks);
    const ctr = row.ctr !== undefined ? numberValue(row.ctr) : impressions ? (clicks / impressions) * 100 : 0;
    const position = numberValue(row.position);

    if (impressions >= 80 && ctr <= 1.5) {
      addUnique(actions, {
        score: 64 + groupBonus(group) + Math.min(12, impressions / 100),
        title: keyword ? 'Tối ưu title/meta cho từ khóa ' + keyword : 'Tối ưu title/meta cho URL có CTR thấp',
        reason: 'Dữ liệu Search Console import cho thấy lượt hiển thị cao nhưng CTR còn thấp.',
        targetGroup: group,
        url,
        keyword,
        actionType: 'Tối ưu title/meta',
        evidence: ['Nguồn: Search Console import', 'Impressions: ' + impressions, 'Clicks: ' + clicks, 'CTR: ' + ctr.toFixed(2) + '%'],
      });
    }

    if (position >= 8 && position <= 30) {
      addUnique(actions, {
        score: 60 + groupBonus(group) + (position <= 20 ? 12 : 4),
        title: positionActionTitle(position, keyword, url),
        reason: keyword
          ? 'Từ khóa đang ở vùng có thể đẩy thêm bằng nội dung phụ và liên kết nội bộ.'
          : 'URL đang ở vùng có thể đẩy thêm bằng nội dung phụ và liên kết nội bộ.',
        targetGroup: group,
        url,
        keyword,
        actionType: 'Internal link',
        evidence: ['Nguồn: Search Console import', 'Vị trí trung bình: ' + position.toFixed(1)],
      });
    }
  }

  const mainGroups = ['Giường sắt / giường tầng sắt', 'Bàn làm việc / bàn văn phòng', 'Bàn ghế học sinh / nội thất trường học'];
  for (const group of mainGroups) {
    const hasRecentLog = logs.some((log) => log.targetGroup === group && new Date(log.date || log.updatedAt).getTime() >= sevenDaysAgo);
    if (!hasRecentLog) {
      addUnique(actions, {
        score: 82,
        title: 'Tạo việc SEO mới cho nhóm ' + group,
        reason: 'Nhóm hàng chủ đạo chưa có nhật ký SEO trong 7 ngày gần nhất.',
        targetGroup: group,
        actionType: 'Tối ưu danh mục',
        evidence: ['Nguồn: Nhật ký SEO v11', 'Không thấy log mới trong 7 ngày'],
      });
    }
  }

  for (const log of logs) {
    const date = new Date(log.date || log.updatedAt).getTime();
    const hasSignal = logs.some((item) => item.targetGroup === log.targetGroup && item.status === 'Có tín hiệu tốt' && new Date(item.date || item.updatedAt).getTime() >= date);
    if (log.status === 'Đã submit index' && date < sevenDaysAgo && !hasSignal) {
      addUnique(actions, {
        score: 72 + groupBonus(log.targetGroup),
        title: 'Kiểm tra lại URL đã submit index: ' + (log.title || log.url || log.keyword),
        reason: 'Đã submit index quá 7 ngày nhưng chưa có nhật ký ghi nhận tín hiệu tốt.',
        targetGroup: log.targetGroup,
        url: log.url,
        keyword: log.keyword,
        actionType: 'Theo dõi Search Console',
        evidence: ['Nguồn: Nhật ký SEO v11', 'Ngày submit: ' + log.date],
      });
    }
  }

  for (const group of mainGroups) {
    const normGroup = normalize(group);
    const productCount = products.filter((item) => detectSeoTargetGroup(mainText(item)) === group).length;
    const blogCount = blogs.filter((item) => normalize(mainText(item)).includes(normGroup.split('/')[0].trim())).length;
    if (productCount >= 8 && blogCount < 3) {
      addUnique(actions, {
        score: 76,
        title: 'Viết bài hỗ trợ cho nhóm ' + group,
        reason: 'Nhóm này có nhiều sản phẩm nhưng số bài viết hỗ trợ còn ít.',
        targetGroup: group,
        actionType: 'Tối ưu bài viết',
        evidence: ['Nguồn: Supabase', 'Sản phẩm liên quan: ' + productCount, 'Bài viết liên quan ước tính: ' + blogCount],
      });
    }
  }

  for (const row of plannerRows.slice(0, 400)) {
    const keyword = rowKeyword(row);
    if (!keyword) continue;
    const group = detectSeoTargetGroup(keyword);
    const volume = numberValue(row.searchVolume || row.avg_monthly_searches || row.avgMonthlySearches);
    const lowBid = numberValue(row.lowBid || row.cpc || row.low_top_of_page_bid);
    if (volume >= 100) {
      addUnique(actions, {
        score: 58 + groupBonus(group) + Math.min(18, volume / 400) + (lowBid > 0 ? 6 : 0),
        title: 'Chọn URL chính cho keyword: ' + keyword,
        reason: 'Keyword Planner có dữ liệu tìm kiếm, cần tránh để nhiều URL cùng tranh một keyword.',
        targetGroup: group,
        keyword,
        actionType: 'Chống trùng keyword',
        evidence: ['Nguồn: Keyword Planner import', 'Volume: ' + volume, lowBid ? 'Giá thầu thấp: ' + lowBid : 'Chưa có CPC'],
      });
    }
  }

  const needFixByGroup = new Map<string, number>();
  for (const log of logs) {
    if (log.status === 'Cần sửa tiếp') needFixByGroup.set(log.targetGroup, (needFixByGroup.get(log.targetGroup) || 0) + 1);
  }
  needFixByGroup.forEach((count, group) => {
    if (count >= 2) {
      addUnique(actions, {
        score: 74 + groupBonus(group),
        title: 'Xử lý các việc cần sửa tiếp của nhóm ' + group,
        reason: 'Nhóm này có nhiều nhật ký đang ở trạng thái cần sửa tiếp, nên ổn định trang cũ trước.',
        targetGroup: group,
        actionType: 'Khác',
        evidence: ['Nguồn: Nhật ký SEO v11', 'Số việc cần sửa tiếp: ' + count],
      });
    }
  });

  return actions
    .sort((a, b) => {
      const groupDiff = groupBonus(b.targetGroup) - groupBonus(a.targetGroup);
      if (groupDiff !== 0) return groupDiff;
      const priorityRank = { 'Rất cao': 4, Cao: 3, 'Trung bình': 2, Thấp: 1 };
      return priorityRank[b.priority] - priorityRank[a.priority];
    })
    .slice(0, 40);
}
