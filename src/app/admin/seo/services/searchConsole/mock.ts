import type { SearchConsoleTrendPoint, SearchConsoleV5Data } from './types';

function days(count: number): SearchConsoleTrendPoint[] {
  return Array.from({ length: count }).map((_, index) => {
    const date = new Date(Date.now() - (count - index - 1) * 86400000).toISOString().slice(0, 10);
    return {
      date,
      clicks: Math.max(0, 8 + index * 2),
      impressions: 180 + index * 38,
      position: Number((18 - index * 0.45).toFixed(1)),
    };
  });
}

export function getMockSearchConsoleV5Data(): SearchConsoleV5Data {
  return {
    status: 'mock',
    message: 'Chưa import dữ liệu Search Console - đang dùng dữ liệu thủ công/mock.',
    overview: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    topQueries: [
      { query: 'ghế chân quỳ giá rẻ', page: '/ghe-chan-quy', clicks: 0, impressions: 0, ctr: 0, position: 0, device: 'MOBILE', country: 'VNM' },
      { query: 'bàn giám đốc giá xưởng', page: '/ban-giam-doc', clicks: 0, impressions: 0, ctr: 0, position: 0, device: 'DESKTOP', country: 'VNM' },
      { query: 'tủ locker sắt hà nội', page: '/tu-locker', clicks: 0, impressions: 0, ctr: 0, position: 0, device: 'MOBILE', country: 'VNM' },
    ],
    topPages: [
      { page: '/ghe-chan-quy', clicks: 0, impressions: 0, ctr: 0, position: 0 },
      { page: '/ban-giam-doc', clicks: 0, impressions: 0, ctr: 0, position: 0 },
      { page: '/tu-locker', clicks: 0, impressions: 0, ctr: 0, position: 0 },
    ],
    keywordTrend: days(28),
    pageTrend: days(28).map((item) => ({ ...item, impressions: item.impressions + 70, clicks: item.clicks + 3 })),
    newQueries: [
      { query: 'bàn làm việc 1m2 chân sắt', page: '/ban-van-phong', clicks: 0, impressions: 0, ctr: 0, position: 0 },
      { query: 'giường sắt 2 tầng học sinh', page: '/giuong-tang-sat', clicks: 0, impressions: 0, ctr: 0, position: 0 },
    ],
    pagesLosingImpression: [
      { page: '/tin-tuc', query: 'tin tức nội thất văn phòng', clicks: 0, impressions: 0, ctr: 0, position: 0 },
    ],
  };
}

