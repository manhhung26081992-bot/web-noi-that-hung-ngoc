import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase'; // Đường dẫn tới file bạn tạo ở Bước 2
import { MENU_ITEMS } from '@/components/Header/menuData';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://noithathungngoc.com';

  // 1. Lấy toàn bộ sản phẩm từ Supabase
  const { data: products } = await supabase
    .from('products')
    .select('slug');

  const productUrls = (products || []).map((product) => ({
    url: `${baseUrl}/san-pham/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // 2. Trang chủ & Danh mục từ Menu (Giữ nguyên phần bạn đã làm tốt)
  const home = {
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0,
  };

  const categoryUrls: MetadataRoute.Sitemap = [];
  MENU_ITEMS.forEach((item) => {
    if (item.link && item.link !== '/') {
      categoryUrls.push({ url: `${baseUrl}${item.link}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 });
    }
    if (item.submenu) {
      item.submenu.forEach((sub) => {
        categoryUrls.push({ url: `${baseUrl}${sub.link}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 });
      });
    }
  });

  // Hợp nhất tất cả: Giờ đây Sitemap của bạn sẽ có hàng trăm link sản phẩm chi tiết
  return [home, ...categoryUrls, ...productUrls];
}