import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { MENU_ITEMS } from '@/components/Header/menuData';
import { siteUrl } from '@/lib/url';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function cleanPathPart(value?: string | null) {
  return (value || '').trim().replace(/^\/+|\/+$/g, '');
}

function getValidDate(value?: string | Date | null) {
  if (!value) {
    return new Date();
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls = new Map<string, MetadataRoute.Sitemap[number]>();

  const addUrl = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: number,
    lastModified?: string | Date | null
  ) => {
    const url = siteUrl(path);

    urls.set(url, {
      url,
      lastModified: getValidDate(lastModified),
      changeFrequency,
      priority,
    });
  };

  // Trang chủ.
  addUrl('/', 'daily', 1);
  addUrl('/tin-tuc', 'weekly', 0.8);

  // Các trang danh mục lấy từ menu chính và menu con.
  const { data: products, error } = await supabase
    .from('products')
    .select('slug, category, parent_slug');

  if (error) {
    console.error('Lỗi tạo sitemap sản phẩm:', error.message);
  }

  // URL sản phẩm đang hoạt động trong code hiện tại là /san-pham/[slug].
  const activeCategorySlugs = new Set<string>();

  (products || []).forEach((product) => {
    const category = cleanPathPart(product.category);
    const parentSlug = cleanPathPart(product.parent_slug);

    if (category) activeCategorySlugs.add(category);
    if (parentSlug) activeCategorySlugs.add(parentSlug);
  });

  // Chi dua danh muc vao sitemap khi danh muc do dang co san pham that.
  MENU_ITEMS.forEach((item) => {
    const itemSlug = cleanPathPart(item.link);

    if (item.link && item.link !== '/' && activeCategorySlugs.has(itemSlug)) {
      addUrl(item.link, 'weekly', 0.8);
    }

    item.submenu?.forEach((sub) => {
      const subSlug = cleanPathPart(sub.link);

      if (activeCategorySlugs.has(subSlug)) {
        addUrl(sub.link, 'weekly', 0.7);
      }
    });
  });

  (products || []).forEach((product) => {
    const slug = cleanPathPart(product.slug);

    if (slug) {
      addUrl(`/san-pham/${slug}`, 'weekly', 0.8);
    }
  });

  const { data: posts, error: blogError } = await supabase
    .from('blog_posts')
    .select('slug, created_at');

  if (blogError) {
    console.error('Lỗi tạo sitemap tin tức:', blogError.message);
  }

  (posts || []).forEach((post) => {
    const slug = cleanPathPart(post.slug);

    if (slug) {
      addUrl(`/tin-tuc/${slug}`, 'monthly', 0.6, post.created_at);
    }
  });

  return Array.from(urls.values());
}
