import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || '', 
      process.env.SUPABASE_ANON_KEY || ''
    )
    
    const { data: products, error } = await supabase.from('products').select('*')

    if (error) throw error;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Nội Thất Hùng Ngọc</title>
    <link>https://noithathungngoc.com</link>
    <description>Sản phẩm từ noithathungngoc.com</description>
    ${products?.map(p => `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:link>https://noithathungngoc.com/product/${p.slug}</g:link>
      <g:image_link>${p.image_url}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${p.price} VND</g:price>
      <g:brand>Nội Thất Hùng Ngọc</g:brand>
    </item>`).join('')}
  </channel>
</rss>`

    return new Response(xml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    })
  } catch (err: any) {
    return new Response(`Lỗi server: ${err.message}`, { status: 500 })
  }
}