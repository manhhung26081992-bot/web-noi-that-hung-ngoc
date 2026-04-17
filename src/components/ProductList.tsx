"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/Product.module.css';
import ProductCard from './ProductCard'; 

// Cập nhật Interface để nhận products từ Supabase
interface ProductListProps {
  products: any[];
  title?: string;
  categorySlugs?: string[]; // Giữ lại để dùng cho link "Xem tất cả"
  limit?: number;
  viewAllLink?: string;
}

export default function ProductList({ title, products, categorySlugs, limit, viewAllLink }: ProductListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [categorySlugs]);

  // Nếu không có sản phẩm nào từ Supabase thì không hiển thị
  if (!products || products.length === 0) return null;

  // Logic hiển thị: Nếu có limit (trang chủ) thì lấy theo limit, nếu không (trang category) thì phân trang
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
        {displayProducts.map((p: any) => (
          // SỬA LỖI KEY 51: Sử dụng p.id duy nhất từ Supabase
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* Phân trang - Chỉ hiện ở trang danh mục (nếu không có limit) */}
      {!limit && totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => {
                  setCurrentPage(i + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePage : ''}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}



// "use client";
// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
// import styles from '@/styles/Product.module.css';
// import { allProducts as products } from '@/data/products/index';
// import ProductCard from './ProductCard'; 

// // Thêm viewAllLink vào interface để nhận link từ ngoài truyền vào
// export default function ProductList({ title, categorySlugs, limit, viewAllLink }: any) {
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 8;

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [categorySlugs]);

//   // Lọc sản phẩm
//   const allMatched = products.filter(p => categorySlugs.includes(p.category));
//   if (allMatched.length === 0) return null;

//   // Logic phân trang
//   const displayProducts = limit 
//     ? allMatched.slice(0, limit) 
//     : allMatched.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   const totalPages = Math.ceil(allMatched.length / itemsPerPage);

//   return (
//     <section className={styles.categorySection}>
//       <div className={styles.sectionHeader}>
//         <div className={styles.titleBox}>
//            <div className={styles.hamburgerIcon}><span></span><span></span><span></span></div>
//            <h2>{title || "SẢN PHẨM"}</h2>
//         </div>
        
//         {/* FIX LỖI: Ưu tiên dùng viewAllLink truyền vào, nếu không có mới dùng category đầu tiên */}
//         {limit && (
//           <Link 
//             href={viewAllLink || `/${categorySlugs[0]}`} 
//             className={styles.viewAll}
//           >
//             + Xem tất cả
//           </Link>
//         )}    
//       </div>

//       <div className={styles.productGrid}>
//         {displayProducts.map((p: any) => (
//           <ProductCard key={p.id} product={p} />
//         ))}
//       </div>

//       {!limit && totalPages > 1 && (
//         <div className={styles.paginationContainer}>
//           <div className={styles.pageNumbers}>
//             {Array.from({ length: totalPages }, (_, i) => (
//               <button
//                 key={i + 1}
//                 onClick={() => {
//                   setCurrentPage(i + 1);
//                   window.scrollTo({ top: 0, behavior: 'smooth' });
//                 }}
//                 className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePage : ''}`}
//               >
//                 {i + 1}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}
//     </section>
//   );
// }