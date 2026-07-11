'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MENU_ITEMS } from '@/components/Header/menuData';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/types';
import styles from '@/styles/CategorySidebar.module.css';
import { addTrailingSlash } from '@/lib/url';

const PRODUCT_FIELDS = 'id, name, slug, image, price, category';

type HotProduct = Pick<Product, 'id' | 'name' | 'slug' | 'image' | 'price' | 'category'>;

function getRandomProducts(products: HotProduct[]) {
  return [...products].sort(() => Math.random() - 0.5).slice(0, 4);
}

function getProductImage(product: HotProduct) {
  const image = Array.isArray(product.image) ? product.image[0] : product.image;
  if (!image || image.includes('default-product') || image.includes('logo.png')) {
    return '/default-product.webp';
  }

  const separator = image.includes('?') ? '&' : '?';
  return `${image}${separator}width=180&quality=70`;
}

function getProductUrl(product: HotProduct) {
  return addTrailingSlash(`/san-pham/${product.slug}`);
}

function formatPrice(price: HotProduct['price']) {
  if (!price || price === '0') return 'Liên hệ báo giá';
  if (typeof price === 'string' && Number.isNaN(Number(price))) return price;

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(price));
}

export default function CategorySidebar() {
  const [hotProducts, setHotProducts] = useState<HotProduct[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadHotProducts() {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .not('slug', 'is', null)
        .not('image', 'is', null)
        .limit(300);

      if (error) {
        console.error('Lỗi lấy sản phẩm bán chạy:', error.message);
        return;
      }

      if (isMounted) {
        setHotProducts(getRandomProducts((data || []) as HotProduct[]));
      }
    }

    loadHotProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <aside className={styles.sidebar} aria-label="Danh mục sản phẩm">
      <h2 className={styles.title}>Danh mục sản phẩm</h2>
      <nav>
        <ul className={styles.list}>
          {MENU_ITEMS.filter((item) => item.link !== '/').map((item) => (
            <li key={item.link} className={styles.item}>
              <Link href={addTrailingSlash(item.link)} className={styles.mainLink}>
                {item.name}
              </Link>
              {item.submenu && item.submenu.length > 0 && (
                <ul className={styles.subList}>
                  {item.submenu.slice(0, 6).map((sub) => (
                    <li key={sub.link}>
                      <Link href={addTrailingSlash(sub.link)}>{sub.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {hotProducts.length > 0 && (
        <section className={styles.hotBox} aria-label="Sản phẩm bán chạy">
          <h3 className={styles.hotTitle}>Sản phẩm bán chạy</h3>
          <div className={styles.hotList}>
            {hotProducts.map((product) => (
              <Link key={product.id} href={getProductUrl(product)} className={styles.hotProduct}>
                <span className={styles.hotImageWrap}>
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    width={74}
                    height={74}
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <span className={styles.hotInfo}>
                  <strong>{product.name}</strong>
                  <span>{formatPrice(product.price)}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
