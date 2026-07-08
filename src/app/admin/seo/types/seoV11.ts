export type SeoWorkStatus =
  | 'Đã làm'
  | 'Đang theo dõi'
  | 'Cần sửa tiếp'
  | 'Đã submit index'
  | 'Đã index'
  | 'Chưa hiệu quả'
  | 'Có tín hiệu tốt';

export type SeoWorkPriority =
  | 'Rất cao'
  | 'Cao'
  | 'Trung bình'
  | 'Thấp';

export interface SeoWorkLogItem {
  id: string;
  date: string;
  type: string;
  targetGroup: string;
  url: string;
  keyword: string;
  title: string;
  description: string;
  beforeMetric?: string;
  afterMetric?: string;
  status: SeoWorkStatus;
  priority: SeoWorkPriority;
  nextCheckDate?: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type SeoNextActionStatus =
  | 'Đề xuất mới'
  | 'Đã đưa vào task'
  | 'Đã làm'
  | 'Bỏ qua';

export interface SeoNextAction {
  id: string;
  title: string;
  reason: string;
  targetGroup: string;
  url?: string;
  keyword?: string;
  actionType: string;
  priority: SeoWorkPriority;
  status: SeoNextActionStatus;
  evidence: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SeoV11Settings {
  migratedFromV1?: boolean;
  lastAnalyzedAt?: string;
  lastDemoCreatedAt?: string;
}

export const seoWorkStatuses: SeoWorkStatus[] = [
  'Đã làm',
  'Đang theo dõi',
  'Cần sửa tiếp',
  'Đã submit index',
  'Đã index',
  'Chưa hiệu quả',
  'Có tín hiệu tốt',
];

export const seoWorkPriorities: SeoWorkPriority[] = [
  'Rất cao',
  'Cao',
  'Trung bình',
  'Thấp',
];

export const seoWorkTypes = [
  'Sửa sitemap',
  'Sửa schema',
  'Tối ưu danh mục',
  'Tối ưu sản phẩm',
  'Tối ưu bài viết',
  'Sửa lỗi 404',
  'Internal link',
  'Submit index',
  'Theo dõi Search Console',
  'Theo dõi Keyword Planner',
  'Tối ưu giao diện',
  'Tối ưu tốc độ',
  'Chống trùng keyword',
  'Tối ưu title/meta',
  'Tối ưu FAQ',
  'Khác',
] as const;

export const seoTargetGroups = [
  'Giường sắt / giường tầng sắt',
  'Bàn làm việc / bàn văn phòng',
  'Bàn ghế học sinh / nội thất trường học',
  'Ghế chân quỳ',
  'Ghế giám đốc',
  'Tủ locker',
  'Tủ quần áo',
  'Tin tức / blog',
  'Toàn website',
  'Khác',
] as const;
