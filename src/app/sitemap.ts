// import { MetadataRoute } from 'next'
// import { createClient } from '@supabase/supabase-js'
// import { MENU_ITEMS } from '@/components/Header/menuData'

// export const dynamic = 'force-dynamic'

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// )

// export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
//   const baseUrl = 'https://noithathungngoc.com'

//   const home = {
//     url: baseUrl,
//     lastModified: new Date(),
//     changeFrequency: 'daily' as const,
//     priority: 1,
//   }

//   const categoryUrls: MetadataRoute.Sitemap = []

//   MENU_ITEMS.forEach((item) => {
//     if (item.link && item.link !== '/') {
//       categoryUrls.push({
//         url: `${baseUrl}${item.link}`,
//         lastModified: new Date(),
//         changeFrequency: 'weekly',
//         priority: 0.8,
//       })
//     }

//     item.submenu?.forEach((sub) => {
//       categoryUrls.push({
//         url: `${baseUrl}${sub.link}`,
//         lastModified: new Date(),
//         changeFrequency: 'weekly',
//         priority: 0.7,
//       })
//     })
//   })

//   const { data: products } = await supabase
//     .from('products')
//     .select('slug, category')

//   const productUrls: MetadataRoute.Sitemap =
//     products?.map((product) => ({
//       url: `${baseUrl}/${product.category}/${product.slug}`,
//       lastModified: new Date(),
//       changeFrequency: 'weekly',
//       priority: 0.8,
//     })) || []

//   return [
//     home,
//     ...categoryUrls,
//     ...productUrls,
//   ]
// }
import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://noithathungngoc.com'

  const { data: products, error } = await supabase
    .from('products')
    .select('slug, category')

  console.log('products count:', products?.length)
  console.log('products sample:', products?.slice(0, 3))
  console.log('error:', error)

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
...(products || []).map((product) => ({
  url: `${baseUrl}/${product.category}/${product.slug}`,
  lastModified: new Date(),
  changeFrequency: 'weekly' as const,
  priority: 0.8,
})),
  ]
}