"use client";

import { createClient } from '@supabase/supabase-js';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import styles from '@/styles/Search.module.css';
import { getProductSearchScore, normalizeSearchText } from '@/utils/productSearch';
import type { Product } from '@/types/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PRODUCTS_PER_PAGE = 24;
const BATCH_SIZE = 1000;
const MAX_BATCHES = 20;
const PRODUCT_SELECT =
  'id,name,slug,image,images,realInstallImages,price,category,parent_slug,description,detailDescription,specs,features,alt';

async function fetchAllSearchProducts() {
  const products: Product[] = [];

  for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
    const from = batch * BATCH_SIZE;
    const to = from + BATCH_SIZE - 1;

    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .range(from, to);

    if (error) throw error;

    const rows = (data ?? []) as Product[];
    products.push(...rows);

    if (rows.length < BATCH_SIZE) break;
  }

  return products;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      setLoading(true);
      setCurrentPage(1);

      const normalizedQuery = normalizeSearchText(query);
      if (!normalizedQuery) {
        if (isMounted) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }

      try {
        const allProducts = await fetchAllSearchProducts();

        const filteredProducts = allProducts
          .map((product) => ({
            product,
            score: getProductSearchScore(product, normalizedQuery),
          }))
          .filter((item) => item.score > 0)
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return String(a.product.name).localeCompare(String(b.product.name), 'vi');
          })
          .map((item) => item.product);

        if (isMounted) {
          setProducts(filteredProducts);
          setLoading(false);
        }
      } catch (error) {
        console.error(
          'Lỗi tìm kiếm sản phẩm:',
          error instanceof Error ? error.message : error,
        );
        if (isMounted) {
          setProducts([]);
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return products.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [products, currentPage]);

  if (loading) {
    return <div className={styles.loading}>Đang tìm kiếm...</div>;
  }

  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumb}>
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <span>Tìm kiếm</span>
      </nav>

      <h1 className={styles.title}>Kết quả tìm kiếm cho: {query}</h1>

      {products.length === 0 ? (
        <div className={styles.noResults}>
          <p>Không tìm thấy sản phẩm phù hợp.</p>
          <p>
            Vui lòng thử lại với từ khóa khác như bàn, ghế, tủ, giường hoặc mã sản phẩm.
          </p>
        </div>
      ) : (
        <>
          <p className={styles.resultCount}>Tìm thấy {products.length} sản phẩm phù hợp</p>
          <div className={styles.productGrid}>
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  className={currentPage === page ? styles.activePage : styles.pageBtn}
                  onClick={() => setCurrentPage(page)}
                  type="button"
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Đang tải...</div>}>
      <SearchContent />
    </Suspense>
  );
}
