import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { MENU_ITEMS } from '@/components/Header/menuData';

export const dynamic = 'force-dynamic';

const baseUrl = 'https://www.noithathungngoc.com';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls = new Map<string, MetadataRoute.Sitemap[number]>();

  const addUrl = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: number
  ) => {
    const cleanPath = path === '/' ? '' : path.replace(/\/$/, '');
    const url = `${baseUrl}${cleanPath}/`;

    urls.set(url, {
      url,
      lastModified: new Date(),
      changeFrequency,
      priority,
    });
  };

  // Trang chủ.
  addUrl('/', 'daily', 1);

  // Các trang danh mục lấy từ menu chính và menu con.
  MENU_ITEMS.forEach((item) => {
    if (item.link && item.link !== '/') {
      addUrl(item.link, 'weekly', 0.8);
    }

    item.submenu?.forEach((sub) => {
      addUrl(sub.link, 'weekly', 0.7);
    });
  });

  const { data: products, error } = await supabase
    .from('products')
    .select('slug');

  if (error) {
    console.error('Lỗi tạo sitemap sản phẩm:', error.message);
  }

  // Trang chi tiết sản phẩm đang dùng route /san-pham/[slug].
  (products || []).forEach((product) => {
    if (product.slug) {
      addUrl(`/san-pham/${product.slug}`, 'weekly', 0.8);
    }
  });

  return Array.from(urls.values());
}
