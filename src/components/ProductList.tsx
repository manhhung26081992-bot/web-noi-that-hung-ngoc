"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/Product.module.css';
import ProductCard from './ProductCard'; 

// Kiểu dữ liệu đầu vào cho danh sách sản phẩm lấy từ Supabase.
interface ProductListProps {
  products: any[];
  title?: string;
  categorySlugs?: string[]; // Giữ lại để dùng cho link "Xem tất cả"
  limit?: number;
  viewAllLink?: string;
}

export default function ProductList({ title, products, categorySlugs, limit, viewAllLink }: ProductListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [categorySlugs]);

  // Không có sản phẩm thì không render để tránh tạo khoảng trắng thừa.
  if (!products || products.length === 0) return null;

  // Trang chủ dùng limit, còn trang danh mục thì phân trang theo 8 sản phẩm.
  const displayProducts = limit 
    ? products.slice(0, limit) 
    : products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(products.length / itemsPerPage);

  return (
    <section className={styles.categorySection}>
      <div className={styles.sectionHeader}>
        <div className={styles.titleBox}>
           <div className={styles.hamburgerIcon}><span></span><span></span><span></span></div>
           <h2>{title || "SẢN PHẨM"}</h2>
        </div>
        
        {/* Link "Xem tất cả" cho trang chủ */}
        {limit && (
          <Link 
            href={viewAllLink || (categorySlugs ? `/${categorySlugs[0]}` : '#')} 
            className={styles.viewAll}
          >
            + Xem tất cả
          </Link>
        )}    
      </div>

      <div className={styles.productGrid}>
        {displayProducts.map((p: any, index: number) => (
          // Dùng id từ Supabase làm key để React nhận diện từng sản phẩm ổn định.
          <ProductCard
            key={p.id}
            product={p}
            priority={!limit && currentPage === 1 && index < 2}
          />
        ))}
      </div>

      {/* Phân trang - Chỉ hiện ở trang danh mục (nếu không có limit) */}
      {!limit && totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <div className={styles.pageNumbers}>
            <button
              type="button"
              onClick={() => {
                setCurrentPage(Math.max(1, currentPage - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={styles.pageBtn}
              disabled={currentPage === 1}
              aria-label="Trang trước"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                type="button"
                onClick={() => {
                  setCurrentPage(i + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePage : ''}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setCurrentPage(Math.min(totalPages, currentPage + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={styles.pageBtn}
              disabled={currentPage === totalPages}
              aria-label="Trang sau"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
