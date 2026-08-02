import React from 'react';
import { siteUrl } from '@/lib/url';

interface CategorySchemaProps {
  categoryName: string;
  categorySlug: string;
  products: Array<{
    id?: string | number;
    name: string;
    slug: string;
    image?: string | string[];
    price?: number | string;
  }>;
}

// Lấy ảnh đầu tiên và chuyển về URL đầy đủ cho Google.
function normalizeImageUrl(image?: string | string[]) {
  const firstImage = Array.isArray(image) ? image[0] : image;
  if (!firstImage) return siteUrl("/default-product.webp");
  if (firstImage.startsWith('http')) return firstImage;
  return siteUrl(firstImage);
}

export default function CategorySchema({
  categoryName,
  categorySlug,
  products,
}: CategorySchemaProps) {
  const categoryUrl = siteUrl(`/${categorySlug}`);
  const listProducts = products.filter((product) => product.name && product.slug);

  // Trang danh mục chỉ dùng ItemList để tránh tạo nhiều Product/Offer schema không đúng ngữ cảnh.
  // Product + Offer chi tiết được đặt ở trang /san-pham/[slug].
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryName,
    url: categoryUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: listProducts.slice(0, 24).map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Thing',
            name: product.name,
            image: normalizeImageUrl(product.image),
            url: siteUrl(`/san-pham/${product.slug}`),
          },
        })),
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
