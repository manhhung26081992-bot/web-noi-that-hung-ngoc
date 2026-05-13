import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Lấy đúng các cột: id, name, slug, image, price từ bảng products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, image, price')

    if (error) throw error;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Nội Thất Hùng Ngọc</title>
    <link>https://noithathungngoc.com</link>
    <description>Sản phẩm từ noithathungngoc.com</description>
    ${products?.map(p => {
      // Xử lý cột image dạng jsonb để lấy link sạch
      const imageUrl = typeof p.image === 'string' ? p.image : p.image?.[0] || '';
      
      return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:link>https://noithathungngoc.com/product/${p.slug}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${p.price} VND</g:price>
      <g:brand>Nội Thất Hùng Ngọc</g:brand>
      <g:condition>new</g:condition>
    </item>`;
    }).join('')}
  </channel>
</rss>`

    return new Response(xml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    })
  } catch (err: any) {
    return new Response(`Lỗi server: ${err.message}`, { status: 500 })
  }
}