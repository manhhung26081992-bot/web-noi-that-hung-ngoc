import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // 1. Lấy thêm cột 'images' từ Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, image, images, price')

    if (error) throw error;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Nội Thất Hùng Ngọc</title>
    <link>https://www.noithathungngoc.com</link>
    <description>Sản phẩm từ noithathungngoc.com</description>
    ${products?.map(p => {
      // 2. Xử lý Ảnh chính (g:image_link)
      let mainImageUrl = '';
      if (p.image) {
        mainImageUrl = typeof p.image === 'string' ? p.image : (Array.isArray(p.image) ? p.image[0] : '');
      }
      const cleanMainImage = encodeURI(mainImageUrl.replace(/"/g, '').trim());

      // 3. Xử lý Ảnh bổ sung (g:additional_image_link) từ cột images
      let additionalImagesXml = '';
      if (Array.isArray(p.images)) {
        // Lấy từ ảnh thứ 2 trở đi (vì ảnh 1 thường trùng với ảnh chính)
        const extraImages = p.images.slice(1, 11); 
        additionalImagesXml = extraImages
          .map(img => {
            const cleanImg = encodeURI(String(img).replace(/"/g, '').trim());
            return cleanImg ? `<g:additional_image_link>${cleanImg}</g:additional_image_link>` : '';
          })
          .join('');
      }

      // 4. Xử lý Giá và Link
      const displayPrice = p.price && p.price !== 'null' ? String(p.price).replace(/[^\d]/g, '') : '0';

      return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
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
      headers: { 
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0' 
      }
    })
  } catch (err: any) {
    return new Response(`Lỗi server: ${err.message}`, { status: 500 })
  }
}