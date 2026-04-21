import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { MENU_ITEMS } from '@/components/Header/menuData'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://noithathungngoc.com'

  // Lấy slug + ngày cập nhật sản phẩm
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')

  // Tạo link sản phẩm
  const productUrls =
    products?.map((product) => ({
      url: `${baseUrl}/san-pham/${product.slug}`,
      lastModified: product.updated_at
        ? new Date(product.updated_at)
        : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || []

  // Tạo link danh mục từ menu
  const categoryUrls: MetadataRoute.Sitemap = []

  MENU_ITEMS.forEach((item) => {
    if (item.link && item.link !== '/') {
      categoryUrls.push({
        url: `${baseUrl}${item.link}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }

    if (item.submenu) {
      item.submenu.forEach((sub) => {
        categoryUrls.push({
          url: `${baseUrl}${sub.link}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      })
    }
  })

  // Xóa URL trùng nhau
  const uniqueUrls = Array.from(
    new Map(
      [...categoryUrls, ...productUrls].map((item) => [item.url, item])
    ).values()
  )

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...uniqueUrls,
  ]
}