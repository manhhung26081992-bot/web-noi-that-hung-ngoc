import React from 'react';
import { siteUrl } from '@/lib/url';

interface ProductSchemaProps {
  product: {
    id: string | number;
    name: string;
    description?: string;
    image?: string | string[];
    image_url?: string;
    price: number | string;
    sku?: string;
    slug: string;
    category?: string;
  };
}

// Chuyển ảnh về URL đầy đủ để Google đọc được trong structured data.
function normalizeImageUrl(image?: string) {
  if (!image) return siteUrl("/default-product.webp");
  if (image.startsWith('http')) return image;
  return siteUrl(image);
}

// Schema cần giá dạng số thuần, không nên để "1.400.000đ".
function normalizePrice(price: number | string) {
  if (typeof price === 'number') return price;

  const numericPrice = Number(String(price).replace(/[^\d]/g, ''));
  return Number.isFinite(numericPrice) && numericPrice > 0
    ? numericPrice
    : undefined;
}

export default function ProductSchema({ product }: ProductSchemaProps) {
  const productUrl = siteUrl(`/san-pham/${product.slug}`);

  // Ưu tiên image_url nếu có, nếu không thì lấy image/image[] từ sản phẩm.
  const rawImages = product.image_url
    ? [product.image_url]
    : Array.isArray(product.image)
      ? product.image
      : [product.image];

  const imageUrls = rawImages
    .filter((image): image is string => Boolean(image))
    .map(normalizeImageUrl);

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: imageUrls.length > 0 ? imageUrls : [siteUrl("/default-product.webp")],
    description:
      product.description ||
      `Mua ${product.name} giá tốt tại Nội Thất Hùng Ngọc. Giao hàng nhanh tại Hà Nội.`,
    sku: product.sku || String(product.id),
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: 'Nội Thất Hùng Ngọc',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'VND',
      price: normalizePrice(product.price),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceValidUntil: '2027-12-31',
      seller: {
        '@type': 'Organization',
        name: 'Nội Thất Hùng Ngọc',
        url: siteUrl(),
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData).replace(/</g, '\\u003c'),
      }}
    />
  );
}
