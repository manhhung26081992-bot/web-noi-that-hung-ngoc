import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Lấy đầy đủ các cột cần thiết từ Supabase để tạo feed sản phẩm.
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, image, images, price, description, detailDescription')

    if (error) throw error;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Nội Thất Hùng Ngọc</title>
    <link>https://www.noithathungngoc.com</link>
    <description>Sản phẩm từ noithathungngoc.com</description>
    ${products?.map(p => {
      // 2. Xử lý Mô tả: Ưu tiên detailDescription, nếu trống thì dùng description
      // Xóa các thẻ HTML như <p>, <b> để Google Merchant không báo lỗi mô tả.
      const rawDescription = p.detailDescription || p.description || `Sản phẩm nội thất chất lượng từ Nội Thất Hùng Ngọc - ${p.name}`;
      const cleanDescription = rawDescription
        .replace(/<[^>]*>?/gm, '') // Xóa thẻ HTML
        .replace(/\s+/g, ' ')      // Dọn dẹp khoảng trắng thừa
        .trim();

      // 3. Xử lý Ảnh chính (g:image_link)
      const mainImageUrl = typeof p.image === 'string' ? p.image : (Array.isArray(p.image) ? p.image[0] : '');
      const cleanMainImage = encodeURI(mainImageUrl.replace(/"/g, '').trim());

      // 4. Xử lý nhiều ảnh sản phẩm (g:additional_image_link) từ cột images
      let additionalImagesXml = '';
      if (Array.isArray(p.images)) {
        // Lấy tối đa 10 ảnh bổ sung
        additionalImagesXml = p.images.slice(0, 10)
          .map(img => {
            const cleanImg = encodeURI(String(img).replace(/"/g, '').trim());
            // Tránh lặp lại ảnh chính trong phần ảnh bổ sung
            return cleanImg && cleanImg !== cleanMainImage 
              ? `<g:additional_image_link>${cleanImg}</g:additional_image_link>` 
              : '';
          })
          .join('');
      }

      // 5. Xử lý Giá: Xóa ký tự ₫ và chỉ giữ lại số để tránh lỗi Merchant Center
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
      headers: { 
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0' 
      }
    })
  } catch (err: any) {
    return new Response(`Lỗi hệ thống: ${err.message}`, { status: 500 })
  }
}
