"use client";

import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js'; // Giả định bạn dùng thư viện này
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { Suspense, useState, useEffect } from 'react';
import styles from '@/styles/Search.module.css';

// Khởi tạo Supabase client (Thay URL và Key của bạn vào đây hoặc dùng biến môi trường)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oytmbjoxetmbjsvlyiph.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.toLowerCase().trim() || "";

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // --- FETCH DỮ LIỆU TỪ SUPABASE ---
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Truy vấn bảng 'products'
        // Sử dụng .ilike để tìm kiếm không phân biệt hoa thường trực tiếp từ database (tốt cho SEO & hiệu năng)
        let { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
      } finally {
        setLoading(false);
        setCurrentPage(1); // Reset về trang 1 khi tìm kiếm mới
      }
    };

    if (query) {
      fetchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [query]);

  // --- LOGIC PHÂN TRANG ---
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const currentItems = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render số trang thông minh
  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(
          <button
            key={i}
            className={`${styles.pageBtn} ${currentPage === i ? styles.activePage : ''}`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push(<span key={i}>...</span>);
      }
    }
    return pages;
  };

  if (loading) return <div className="p-20 text-center">Đang tìm kiếm sản phẩm cho bạn...</div>;

  return (
    <main className={styles.container}>
      <nav className={styles.breadcrumb}>
        <Link href="/">Trang chủ</Link> 
        <span className={styles.separator}> / </span> 
        <span className={styles.current}>Kết quả tìm kiếm</span>
      </nav>

      <header className={styles.searchHeader}>
        <h1 className={styles.title}>
          {products.length > 0 
            ? `Tìm thấy ${products.length} mẫu phù hợp: "${query}"` 
            : `Kết quả tìm kiếm: "${query}"`}
        </h1>
        <p className={styles.searchStatus}>
          {products.length > 0 
            ? `Danh sách các mẫu nội thất chất lượng cao, giá xưởng tại Nội Thất Hùng Ngọc.` 
            : `Rất tiếc, chưa có sản phẩm cho "${query}". Liên hệ Zalo để đặt làm theo yêu cầu.`}
        </p>
      </header>

      {products.length > 0 ? (
        <>
          <section className={styles.productGrid}>
            {currentItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </section>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                className={styles.pageBtn} 
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              > Đầu </button>
              
              {renderPagination()}

              <button 
                className={styles.pageBtn} 
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              > Cuối </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.noResultBox}>
          <p>Không tìm thấy sản phẩm bạn yêu cầu?</p>
          <div className={styles.contactActions}>
            <a href="tel:0347227377" className={styles.hotlineBtn}>📞 Gọi tư vấn: 0974.336.571</a>
          </div>
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Đang tải...</div>}>
      <SearchContent />
    </Suspense>
  );
}

// "use client";
// import { useSearchParams } from 'next/navigation';
// import { allProducts as products, categories } from '@/data-m/products/index';
// import ProductCard from '@/components/ProductCard';
// import Link from 'next/link';
// import { Suspense, useMemo, useState, useEffect } from 'react';
// import styles from '@/styles/Search.module.css';

// function SearchContent() {
//   const searchParams = useSearchParams();
//   const query = searchParams.get('q')?.toLowerCase().trim() || "";

//   // --- LOGIC PHÂN TRANG ---
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 12; // 6 hàng x 2 cột trên mobile

//   // Tự động về trang 1 khi người dùng gõ từ khóa mới
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [query]);

//   const filteredProducts = useMemo(() => {
//     if (!query) return [];
//     const queryWords = query.split(/\s+/).filter(word => word.length > 0);

//     return products.filter(p => {
//       const productName = p.name.toLowerCase();
//       const productDesc = (p.description || "").toLowerCase();
//       const categoryTitle = categories.find(c => c.slug === p.category)?.title.toLowerCase() || "";

//       return queryWords.every(word => 
//         productName.includes(word) || 
//         productDesc.includes(word) || 
//         categoryTitle.includes(word)
//       );
//     });
//   }, [query]);

//   // Tính toán dữ liệu hiển thị cho trang hiện tại
//   const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
//   const currentItems = useMemo(() => {
//     const start = (currentPage - 1) * itemsPerPage;
//     return filteredProducts.slice(start, start + itemsPerPage);
//   }, [filteredProducts, currentPage]);

//   const handlePageChange = (page: number) => {
//     setCurrentPage(page);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   return (
//     <main className={styles.container}>
//       {/* Điều hướng Breadcrumb */}
//       <nav className={styles.breadcrumb}>
//         <Link href="/">Trang chủ</Link> 
//         <span className={styles.separator}> / </span> 
//         <span className={styles.current}>Kết quả tìm kiếm</span>
//       </nav>

//       <header className={styles.searchHeader}>
//         <h1 className={styles.title}>
//           {filteredProducts.length > 0 
//             ? `Tìm thấy ${filteredProducts.length} mẫu phù hợp: "${query}"` 
//             : `Kết quả tìm kiếm: "${query}"`}
//         </h1>
//         <div className={styles.searchStatus}>
//           {filteredProducts.length > 0 
//             ? `Danh sách các mẫu ${query} chất lượng cao, giá xưởng tại Nội Thất Hùng Ngọc.` 
//             : `Rất tiếc, chưa có sản phẩm cho "${query}". Liên hệ Zalo để đặt làm theo yêu cầu.`}
//         </div>
//       </header>

//       {filteredProducts.length > 0 ? (
//         <>
//           {/* LƯỚI SẢN PHẨM: 2 CỘT MOBILE */}
//           <section className={styles.productGrid}>
//             {currentItems.map((p) => (
//               <ProductCard key={p.slug || p.id} product={p} />
//             ))}
//           </section>

//           {/* THANH PHÂN TRANG CHUẨN MẪU */}
//           {totalPages > 1 && (
//             <div className={styles.pagination}>
//               <div className={styles.pageInfo}>Trang {currentPage} trên {totalPages}</div>
              
//               <button 
//                 className={styles.pageBtn} 
//                 onClick={() => handlePageChange(1)}
//                 disabled={currentPage === 1}
//               > 1 </button>

//               {[...Array(totalPages)].map((_, i) => {
//                 const pageNum = i + 1;
//                 // Hiển thị dải số thông minh quanh trang hiện tại
//                 if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) <= 1) {
//                   return (
//                     <button
//                       key={pageNum}
//                       className={`${styles.pageBtn} ${currentPage === pageNum ? styles.activePage : ''}`}
//                       onClick={() => handlePageChange(pageNum)}
//                     >
//                       {pageNum}
//                     </button>
//                   );
//                 }
//                 return null;
//               })}

//               {totalPages > 1 && (
//                 <button 
//                   className={`${styles.pageBtn} ${currentPage === totalPages ? styles.activePage : ''}`}
//                   onClick={() => handlePageChange(totalPages)}
//                 > {totalPages} </button>
//               )}

//               <button className={styles.pageBtn} onClick={() => handlePageChange(totalPages)}> Trang cuối » </button>
//             </div>
//           )}
//         </>
//       ) : (
//         <div className={styles.noResultBox}>
//           <p>Không tìm thấy sản phẩm bạn yêu cầu?</p>
//           <div className={styles.contactActions}>
//             <a href="tel:0347227377" className={styles.hotlineBtn}>📞 Gọi tư vấn: 0974.336.571</a>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }

// export default function SearchPage() {
//   return (
//     <Suspense fallback={<div className="p-20 text-center">Đang tải...</div>}>
//       <SearchContent />
//     </Suspense>
//   );
// }