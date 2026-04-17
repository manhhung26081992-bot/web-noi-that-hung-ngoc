import Hero from '@/components/Hero';
import ProductList from '@/components/ProductList';
import styles from './page.module.css';
// IMPORT HÀM LẤY DỮ LIỆU TỪ SUPABASE
import { getAllProductsFromSupabase } from '@/app/actions';

export default async function Home() {
  // 1. Lấy toàn bộ sản phẩm từ Supabase để chia cho các danh mục bên dưới
  const allProducts = await getAllProductsFromSupabase();

  // Các nhóm danh mục của bạn
  const sofaGroup = ['sofa', 'ban-sofa', 'sofa-giuong', 'sofa-da', 'sofa-ni', 'sofa-vang'];
  const officeChairGroup = ['ghe-xoay', 'ghe-chan-quy', 'ghe-giam-doc', 'ghe-gap', 'ghe-gaming'];
  const officeCabinetGroup = ['tu-locker', 'tu-tai-lieu-go', 'tu-tai-lieu-sat', 'hoc-tu-tu-phu'];
  const decorShelfGroup = ['ke-go', 'ke-sach', 'ke-ti-vi', 'ke-trang-tri'];
  const schoolTableGroup = ['ban-ghe-hoc-sinh', 'bang-tu', 'ban-ghe-giao-vien'];
  const diningTableGroup = ['ban-ghe-an'];
  const cafeTableGroup = ['ban-ghe-cafe', 'cafe'];
  const officeTableGroup = ['ban-chan-sat', 'ban-giam-doc', 'ban-hop', 'ban-nhan-vien', 'ban-module'];

  // Hàm lọc sản phẩm theo nhóm để truyền vào từng ProductList
  const filterByGroup = (groupSlugs: string[]) => {
    return allProducts.filter(p => {
  if (!p.category) return false; // Nếu không có category thì bỏ qua sản phẩm này
  return groupSlugs.includes(p.category?.replace(/^\/|\/$/g, ''));
});
  };

  return (
    <>
      <main className={styles.mainContainer}>
        <section className="sr-only">
          <h1>Nội Thất Hùng Ngọc - Xưởng Sản Xuất Bàn Ghế Văn Phòng & Sofa Tại Hà Nội</h1>
        </section>

        {/* Banner chính */}
        <Hero />

        <section className={styles.productSection}>
          <div className="container">
            <header className={styles.headerGroup}>
              <h2 className={styles.sectionTitle}>Sản phẩm nội thất nổi bật</h2>
              <p className={styles.sectionSubtitle}>Mẫu mới nhất 2026 - Chất lượng bền bỉ, giá xưởng trực tiếp</p>
            </header>
            
            {/* TRUYỀN DỮ LIỆU ĐÃ LỌC TỪ SUPABASE VÀO CÁC DANH MỤC */}
            <ProductList 
              title="TỦ VĂN PHÒNG" 
              products={filterByGroup(officeCabinetGroup)} 
              limit={8} 
              viewAllLink="/tu-van-phong"
            />
            
            <ProductList 
              title="BÀN VĂN PHÒNG" 
              products={filterByGroup(officeTableGroup)} 
              limit={8} 
              viewAllLink="/ban-van-phong" 
            />
            
            <ProductList 
              title="KỆ TRANG TRÍ & KỆ GỖ" 
              products={filterByGroup(decorShelfGroup)} 
              limit={8} 
              viewAllLink="/ke-trang-tri"
            />
            
            <ProductList 
              title="GHẾ VĂN PHÒNG" 
              products={filterByGroup(officeChairGroup)} 
              limit={8} 
              viewAllLink="/ghe-van-phong"
            />

            <ProductList 
              title="BÀN GHẾ CAFE" 
              products={filterByGroup(cafeTableGroup)} 
              limit={8} 
              viewAllLink="/san-pham/ban-ghe-cafe"
            />

            <ProductList 
              title="SOFA PHÒNG KHÁCH" 
              products={filterByGroup(sofaGroup)} 
              limit={8} 
              viewAllLink="/sofa" 
            />
          </div>
        </section>

        <article className={styles.aboutArticle}>
          <div className="container">
            <div className={styles.aboutContent}>
              <h2 className={styles.footerBrandTitle}>Nội Thất Hùng Ngọc - Uy tín tạo niềm tin</h2>
              <p>
                Tự hào là <strong>xưởng sản xuất trực tiếp</strong> nội thất văn phòng và sofa hàng đầu Hà Nội. 
                Chúng tôi cam kết sản phẩm <strong>giá gốc tại kho</strong>, hỗ trợ vận chuyển nhanh và bảo hành dài hạn.
              </p>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}


// import Hero from '@/components/Hero';
// import ProductList from '@/components/ProductList';
// import styles from './page.module.css';

// export default function Home() {
//   const sofaGroup = ['sofa', 'ban-sofa', 'sofa-giuong', 'sofa-da', 'sofa-ni', 'sofa-vang'];
//   const officeChairGroup = ['ghe-xoay', 'ghe-chan-quy', 'ghe-giam-doc', 'ghe-gap', 'ghe-gaming'];
//   const officeCabinetGroup = ['tu-locker', 'tu-tai-lieu-go', 'tu-tai-lieu-sat', 'hoc-tu-tu-phu'];
//   const decorShelfGroup = ['ke-go', 'ke-sach', 'ke-ti-vi', 'ke-trang-tri'];
//   const schoolTableGroup = ['ban-ghe-hoc-sinh', 'bang-tu', 'ban-ghe-giao-vien'];
//   const diningTableGroup = ['ban-ghe-an'];
//   const cafeTableGroup = ['ban-ghe-cafe', 'cafe'];
// const officeTableGroup = ['ban-chan-sat', 'ban-giam-doc', 'ban-hop', 'ban-nhan-vien', 'ban-module'];

//   return (
//     <>
//       <main className={styles.mainContainer}>
//         <section className="sr-only">
//           <h1>Nội Thất Hùng Ngọc - Xưởng Sản Xuất Bàn Ghế Văn Phòng & Sofa Tại Hà Nội</h1>
//         </section>

//         <Hero />

//         <section className={styles.productSection}>
//           <div className="container">
//             <header className={styles.headerGroup}>
//               <h2 className={styles.sectionTitle}>Sản phẩm nội thất nổi bật</h2>
//               <p className={styles.sectionSubtitle}>Mẫu mới nhất 2026 - Chất lượng bền bỉ, giá xưởng trực tiếp</p>
//             </header>
            
//             {/* Truyền limit={8} để hiển thị chuẩn 2 hàng sản phẩm */}
//             <ProductList title="TỦ VĂN PHÒNG " categorySlugs={officeCabinetGroup} limit={8} viewAllLink="/tu-van-phong"/>
//             <ProductList title="BÀN VĂN PHÒNG " categorySlugs={officeTableGroup} limit={8} viewAllLink="/ban-van-phong" />
//             <ProductList title="KỆ TRANG TRÍ & KỆ GỖ" categorySlugs={decorShelfGroup} limit={8} viewAllLink="/ke-trang-tri"/>
//             <ProductList title="GHẾ VĂN PHÒNG" categorySlugs={officeChairGroup} limit={8} viewAllLink="/ghe-van-phong"/>
//             <ProductList title="BÀN GHẾ CAFE" categorySlugs={cafeTableGroup} limit={8} viewAllLink="/san-pham/ban-ghe-cafe"/>
//             <ProductList title="SOFA PHÒNG KHÁCH" categorySlugs={sofaGroup} limit={8} viewAllLink="/sofa" />
//             <ProductList title="BÀN GHẾ HỌC SINH" categorySlugs={schoolTableGroup} limit={8} viewAllLink="/ban-ghe-hoc-sinh"/>
//             <ProductList title="BÀN GHẾ ĂN" categorySlugs={diningTableGroup} limit={8} viewAllLink="/ban-ghe-an"/>
//           </div>
//         </section>

//         <article className={styles.aboutArticle}>
//           <div className="container">
//             <div className={styles.aboutContent}>
//               <h2 className={styles.footerBrandTitle}>Nội Thất Hùng Ngọc - Uy tín tạo niềm tin</h2>
//               <p>
//                 Tự hào là <strong>xưởng sản xuất trực tiếp</strong> nội thất văn phòng và sofa hàng đầu Hà Nội. 
//                 Chúng tôi cam kết sản phẩm <strong>giá gốc tại kho</strong>, hỗ trợ vận chuyển nhanh và bảo hành dài hạn.
//               </p>
//             </div>
//           </div>
//         </article>
//       </main>
//     </>
//   );
// }