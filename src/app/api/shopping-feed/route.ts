import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // 1. Phải thêm 'description' vào lệnh select
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, image, images, price, description')

    if (error) throw error;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Nội Thất Hùng Ngọc</title>
    <link>https://www.noithathungngoc.com</link>
    <description>Sản phẩm từ noithathungngoc.com</description>
    ${products?.map(p => {
      // 2. Xử lý Mô tả sạch sẽ (Xóa code HTML nếu có)
      const cleanDescription = p.description 
        ? p.description.replace(/<[^>]*>?/gm, '').trim() 
        : `Sản phẩm chất lượng từ Nội Thất Hùng Ngọc - ${p.name}`;

      // 3. Xử lý Ảnh chính và Ảnh phụ
      const mainImageUrl = typeof p.image === 'string' ? p.image : (Array.isArray(p.image) ? p.image[0] : '');
      const cleanMainImage = encodeURI(mainImageUrl.replace(/"/g, '').trim());

      let additionalImagesXml = '';
      if (Array.isArray(p.images)) {
        additionalImagesXml = p.images.slice(1, 11)
          .map(img => `<g:additional_image_link>${encodeURI(String(img).replace(/"/g, '').trim())}</g:additional_image_link>`)
          .join('');
      }

      // 4. Xử lý Giá
      const displayPrice = p.price ? String(p.price).replace(/[^\d]/g, '') : '0';

      return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${cleanDescription}]]></g:description>
      <g:link>https://www.noithathungngoc.com/san-pham/${p.slug}</g:link>
      <g:image_link>${cleanMainImage}</g:image_link>
      ${additionalImagesXml}
      <g:availability>in_stock</g:availability>
      <g:price>${displayPrice} VND</g:price>
      <g:brand>Nội Thất Hùng Ngọc</g:brand>
      <g:condition>new</g:condition>
    </item>`;
    }).join('').trim()}
  </channel>
</rss>`

    return new Response(xml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    })
  } catch (err: any) {
    return new Response(`Lỗi: ${err.message}`, { status: 500 })
  }
}