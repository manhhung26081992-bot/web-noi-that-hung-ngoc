import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { MENU_ITEMS } from '@/components/Header/menuData'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://noithathungngoc.com'

  const home: MetadataRoute.Sitemap[number] = {
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  }

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

    item.submenu?.forEach((sub) => {
      categoryUrls.push({
        url: `${baseUrl}${sub.link}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    })
  })

  const policies: MetadataRoute.Sitemap = [
    '/chinh-sach/bao-hanh',
    '/chinh-sach/van-chuyen',
    '/chinh-sach/doi-tra',
    '/chinh-sach/bao-mat',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.3,
  }))

  const { data: products } = await supabase
    .from('products')
    .select('slug, category')

  const productUrls: MetadataRoute.Sitemap =
    (products || []).map((product) => ({
      url: `${baseUrl}/${product.category}/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

  return [
    home,
    ...categoryUrls,
    ...policies,
    ...productUrls,
  ]
}