import React from 'react';

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

const siteUrl = 'https://www.noithathungngoc.com';

// Lấy ảnh đầu tiên và chuyển về URL đầy đủ cho Google.
function normalizeImageUrl(image?: string | string[]) {
  const firstImage = Array.isArray(image) ? image[0] : image;
  if (!firstImage) return `${siteUrl}/default-product.webp`;
  if (firstImage.startsWith('http')) return firstImage;
  return `${siteUrl}${firstImage.startsWith('/') ? '' : '/'}${firstImage}`;
}

// Chuẩn hóa giá về số thuần để Offer schema hợp lệ.
function normalizePrice(price?: number | string) {
  if (price === undefined || price === null) return undefined;
  if (typeof price === 'number') return price > 0 ? price : undefined;

  const numericPrice = Number(String(price).replace(/[^\d]/g, ''));
  return Number.isFinite(numericPrice) && numericPrice > 0
    ? numericPrice
    : undefined;
}

export default function CategorySchema({
  categoryName,
  categorySlug,
  products,
}: CategorySchemaProps) {
  const categoryUrl = `${siteUrl}/${categorySlug}`;
  const schemaProducts = products
    .map((product) => ({
      ...product,
      schemaPrice: normalizePrice(product.price),
    }))
    .filter((product) => product.schemaPrice);

  // Chỉ đưa sản phẩm có giá hợp lệ vào schema để Google không báo Product snippets invalid.
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryName,
    url: categoryUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: schemaProducts.slice(0, 24).map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: product.name,
            image: normalizeImageUrl(product.image),
            url: `${siteUrl}/san-pham/${product.slug}`,
            sku: product.id ? String(product.id) : product.slug,
            brand: {
              '@type': 'Brand',
              name: 'Nội Thất Hùng Ngọc',
            },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'VND',
              price: product.schemaPrice,
              availability: 'https://schema.org/InStock',
              itemCondition: 'https://schema.org/NewCondition',
              url: `${siteUrl}/san-pham/${product.slug}`,
            },
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
