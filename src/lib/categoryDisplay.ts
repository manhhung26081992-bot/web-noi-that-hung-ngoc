const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'ban-an-mat-da': 'Bàn ăn mặt đá',
  'ban-an-mat-da-cafe': 'Bàn cafe mặt đá',
  'ban-an-thong-minh': 'Bàn ăn thông minh',
  'ban-chan-sat': 'Bàn chân sắt',
  'ban-eames': 'Bàn Eames',
  'ban-gap': 'Bàn gấp',
  'ban-ghe-an': 'Bàn ghế ăn',
  'ban-ghe-cafe': 'Bàn ghế cafe',
  'ban-ghe-giao-vien': 'Bàn ghế giáo viên',
  'ban-ghe-hoc-sinh': 'Bàn ghế học sinh',
  'ban-giam-doc': 'Bàn giám đốc',
  'ban-hop': 'Bàn họp',
  'ban-lam-viec': 'Bàn làm việc',
  'ban-nhan-vien': 'Bàn nhân viên',
  'ban-sofa': 'Bàn sofa',
  'ban-trang-diem': 'Bàn trang điểm',
  'ban-van-phong': 'Bàn văn phòng',
  'bang-tu': 'Bảng từ',
  'bo-ban-an-4-ghe': 'Bộ bàn ăn 4 ghế',
  'bo-ban-an-6-ghe': 'Bộ bàn ăn 6 ghế',
  'cum-ban': 'Cụm bàn làm việc',
  'cum-ban-lam-viec': 'Cụm bàn làm việc',
  'ghe-an': 'Ghế ăn',
  'ghe-bar': 'Ghế bar',
  'ghe-chan-quy': 'Ghế chân quỳ',
  'ghe-gaming': 'Ghế gaming',
  'ghe-gap': 'Ghế gấp',
  'ghe-giam-doc': 'Ghế giám đốc',
  'ghe-van-phong': 'Ghế văn phòng',
  'ghe-xoay': 'Ghế xoay văn phòng',
  'ghe-xoay-van-phong': 'Ghế xoay văn phòng',
  'gia-dinh': 'Nội thất gia đình',
  'giuong-go': 'Giường gỗ',
  'giuong-sat': 'Giường sắt',
  'giuong-tang': 'Giường tầng',
  'giuong-tang-sat': 'Giường tầng sắt',
  'hoc-tu-tu-phu': 'Hộc tủ - tủ phụ',
  'ke-de-hang': 'Kệ để hàng',
  'ke-go': 'Kệ gỗ',
  'ke-sach': 'Kệ sách',
  'ke-ti-vi': 'Kệ tivi',
  'ke-tivi': 'Kệ tivi',
  'ke-trang-tri': 'Kệ trang trí',
  'ket-sat': 'Két sắt',
  'quay-le-tan': 'Quầy lễ tân',
  'sofa': 'Sofa',
  'sofa-da': 'Sofa da',
  'sofa-giuong': 'Sofa giường',
  'sofa-ni': 'Sofa nỉ',
  'sofa-van-phong': 'Sofa văn phòng',
  'sofa-vang': 'Sofa văng',
  'truong-hoc': 'Nội thất trường học',
  'tu-giay': 'Tủ giày',
  'tu-locker': 'Tủ locker',
  'tu-quan-ao': 'Tủ quần áo',
  'tu-tai-lieu-go': 'Tủ tài liệu gỗ',
  'tu-tai-lieu-sat': 'Tủ tài liệu sắt',
  'tu-van-phong': 'Tủ văn phòng',
};

function cleanCategorySlug(category?: string | null) {
  return String(category || '').trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

function fallbackCategoryName(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => (word.length <= 3 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

export function getCategoryDisplayName(category?: string | null) {
  const slug = cleanCategorySlug(category);
  if (!slug) return '';

  return CATEGORY_DISPLAY_NAMES[slug] || fallbackCategoryName(slug);
}
