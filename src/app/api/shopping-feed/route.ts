import { createClient } from '@supabase/supabase-js'

// Ép Next.js luôn lấy dữ liệu mới nhất từ Supabase
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL!, 
    process.env.SUPABASE_ANON_KEY!
  )
  
  const { data: products, error } = await supabase.from('products').select('*')

  if (error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Nội Thất Hùng Ngọc</title>
    <link>https://noithathungngoc.com</link>
    <description>Danh sách sản phẩm nội thất văn phòng và gia đình</description>
    ${products?.map(p => `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description || 'Nội thất chất lượng cao'}]]></g:description>
      <g:link>https://noithathungngoc.com/product/${p.slug}</g:link>
      <g:image_link>${p.image_url}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${p.price} VND</g:price>
      <g:brand>Nội Thất Hùng Ngọc</g:brand>
      <g:condition>new</g:condition>
    </item>`).join('')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}