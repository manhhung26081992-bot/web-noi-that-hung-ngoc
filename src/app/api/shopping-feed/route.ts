import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Lấy dữ liệu từ bảng products
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
      // 1. Xử lý Image URL cực sạch
      let imageUrl = '';
      if (p.image) {
        if (typeof p.image === 'string') {
          imageUrl = p.image;
        } else if (Array.isArray(p.image)) {
          imageUrl = p.image[0];
        } else if (typeof p.image === 'object') {
          imageUrl = (p.image as any).url || Object.values(p.image)[0] || '';
        }
      }

      // Xóa dấu ngoặc kép, khoảng trắng và mã hóa URL chuẩn Google
      const cleanImageUrl = encodeURI(imageUrl.replace(/"/g, '').trim());

      // 2. Xử lý Giá (Tránh lỗi null trong image_2d1338.png)
      // Nếu không có giá, để mặc định là 0 hoặc một giá trị an toàn
      const displayPrice = p.price && p.price !== 'null' ? p.price : '0';

      return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:link>https://noithathungngoc.com/product/${p.slug}</g:link>
      <g:image_link>${cleanImageUrl}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${displayPrice} VND</g:price>
      <g:brand>Nội Thất Hùng Ngọc</g:brand>
      <g:condition>new</g:condition>
    </item>`;
    }).join('').trim()}
  </channel>
</rss>`

    return new Response(xml, {
      headers: { 
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0' 
      }
    })
  } catch (err: any) {
    return new Response(`Lỗi server: ${err.message}`, { status: 500 })
  }
}