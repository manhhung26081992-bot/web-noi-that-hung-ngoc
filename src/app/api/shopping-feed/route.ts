import { createClient } from '@supabase/supabase-js'

export async function GET() {
  // 1. Kết nối Supabase lấy sản phẩm
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
  const { data: products } = await supabase.from('products').select('*')

  // 2. Tạo nội dung XML chuẩn Google Shopping
  const xml = `<?xml version="1.0"?>
    <rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
      <channel>
        <title>Nội Thất Hùng Ngọc</title>
        <link>https://noithathungngoc.com</link>
        ${products?.map(p => `
          <item>
            <g:id>${p.id}</g:id>
            <g:title>${p.name}</g:title>
            <g:description>${p.description}</g:description>
            <g:link>https://noithathungngoc.com/product/${p.slug}</g:link>
            <g:image_link>${p.image_url}</g:image_link>
            <g:availability>in_stock</g:availability>
            <g:price>${p.price} VND</g:price>
            <g:brand>Nội Thất Hùng Ngọc</g:brand>
            <g:condition>new</g:condition>
          </item>
        `).join('')}
      </channel>
    </rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' }
  })
}   