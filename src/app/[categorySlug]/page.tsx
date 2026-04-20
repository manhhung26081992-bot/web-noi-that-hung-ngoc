import { MENU_ITEMS } from '@/components/Header/menuData'; 
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ProductList from '@/components/ProductList';
import styles from '@/styles/Category.module.css';
import Link from 'next/link';
// GỌI HÀM LẤY DỮ LIỆU TỪ SUPABASE
import { getProductsByMultipleCategories } from '@/app/actions';

interface Props {
  params: Promise<{ categorySlug: string }>;
}

const CATEGORY_GROUPS: { [key: string]: string[] } = {
  'sofa': ['sofa', 'ban-sofa', 'sofa-giuong', 'sofa-da', 'sofa-ni', 'sofa-vang'],
  'ghe-van-phong': ['ghe-xoay', 'ghe-chan-quy', 'ghe-giam-doc', 'ghe-gap', 'ghe-gaming', 'ghe-van-phong'],
  'tu-van-phong': ['tu-van-phong', 'tu-locker', 'tu-tai-lieu-go', 'tu-tai-lieu-sat', 'hoc-tu-tu-phu'],
  'ke-trang-tri': ['ke-go', 'ke-sach', 'ke-ti-vi', 'ke-trang-tri'],
  'ke-go': ['ke-go', 'ke-sach', 'ke-ti-vi', 'ke-trang-tri'],
  'truong-hoc': ['ban-ghe-hoc-sinh', 'bang-tu', 'ban-ghe-giao-vien'],
  'ban-ghe-an': ['ban-ghe-an','bo-ban-an-mat-da','bo-ban-an-thong-minh','bo-ban-an-6-ghe','bo-ban-an-4-ghe','ghe-an'],
  'ban-ghe-cafe': ['ban-ghe-cafe', 'cafe'],
  'ban-van-phong': ['ban-van-phong','ban-chan-sat', 'ban-giam-doc', 'ban-hop', 'ban-nhan-vien', 'ban-module', 'cum-ban-lam-viec', 'ban-lam-viec'],
  'gia-dinh': ['giuong-tang-sat', 'giuong-go', 'tu-go-quan-ao', 'tu-sat-quan-ao'],
};

function findCategoryInfo(slug: string) {
  const cleanSlug = slug.replace(/^\/|\/$/g, '');
  for (const item of MENU_ITEMS) {
    const menuSlug = item.link.replace(/^\/|\/$/g, '');
    if (menuSlug === cleanSlug) return item;
    if (item.submenu) {
      const sub = item.submenu.find(s => s.link.replace(/^\/|\/$/g, '') === cleanSlug);
      if (sub) return sub;
    }
  }
  return null;
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const cleanSlug = categorySlug.replace(/^\/|\/$/g, '');
  const category = findCategoryInfo(cleanSlug);

  if (!category) notFound();

  const isMainGroup = Object.keys(CATEGORY_GROUPS).includes(cleanSlug);
  const finalSlugs = isMainGroup ? CATEGORY_GROUPS[cleanSlug] : [cleanSlug];

  // LẤY DỮ LIỆU TỪ SUPABASE
  const productsFromSupabase = await getProductsByMultipleCategories(finalSlugs);

  return (
    <main className={styles.container}>
      <nav className={styles.breadcrumb}>
        <Link href="/">Trang chủ</Link> <span> / </span> 
        <strong className={styles.current}>{category.name}</strong>
      </nav>

      <header className={styles.categoryHeader}>
        <h1 className={styles.mainTitle}>{category.name}</h1>
      </header>

      <div className={styles.productSection}>
        {productsFromSupabase && productsFromSupabase.length > 0 ? (
          <div className={styles.productGridFull}>
            <ProductList 
              title="" 
              products={productsFromSupabase} 
              categorySlugs={finalSlugs} 
            />
          </div>
        ) : (
          <div className={styles.noProduct}>
            <p>Hiện tại chúng tôi đang cập nhật thêm mẫu <strong>{category.name}</strong>.</p>
            <Link href="/" className={styles.backHome}>Quay lại trang chủ</Link>
          </div>
        )}
      </div>
    </main>
  );
}

// import { allProducts as products } from '@/data/products/index';
// import { MENU_ITEMS } from '@/components/Header/menuData'; 
// import { notFound } from 'next/navigation';
// import { Metadata } from 'next';
// import ProductList from '@/components/ProductList';
// import styles from '@/styles/Category.module.css';
// import Link from 'next/link';


// interface Props {
//   params: Promise<{ categorySlug: string }>;
// }

// const CATEGORY_GROUPS: { [key: string]: string[] } = {
//   'sofa': ['sofa', 'ban-sofa', 'sofa-giuong', 'sofa-da', 'sofa-ni', 'sofa-vang'],
//   'ghe-van-phong': ['ghe-xoay', 'ghe-chan-quy', 'ghe-giam-doc', 'ghe-gap', 'ghe-gaming', 'ghe-van-phong'],
//   'tu-van-phong': ['tu-van-phong', 'tu-locker', 'tu-tai-lieu-go', 'tu-tai-lieu-sat', 'hoc-tu-tu-phu'],
//   'ke-go': ['ke-go', 'ke-sach', 'ke-ti-vi', 'ke-trang-tri'],
//   'truong-hoc': ['ban-ghe-hoc-sinh', 'bang-tu', 'ban-ghe-giao-vien'],
//   'ban-ghe-an': ['ban-ghe-an','bo-ban-an-mat-da','bo-ban-an-thong-minh','bo-ban-an-6-ghe','bo-ban-an-4-ghe','ghe-an'],
//   'ban-ghe-cafe': ['ban-ghe-cafe', 'cafe'],
//   'ban-van-phong': ['ban-van-phong','ban-chan-sat', 'ban-giam-doc', 'ban-hop', 'ban-nhan-vien', 'ban-module', 'cum-ban-lam-viec', 'ban-lam-viec'],
//   'gia-dinh': ['giuong-tang-sat', 'giuong-go', 'tu-go-quan-ao', 'tu-sat-quan-ao'],

// };

// function findCategoryInfo(slug: string) {
//   const cleanSlug = slug.replace(/^\/|\/$/g, '');
//   for (const item of MENU_ITEMS) {
//     const menuSlug = item.link.replace(/^\/|\/$/g, '');
//     if (menuSlug === cleanSlug) return item;
//     if (item.submenu) {
//       const sub = item.submenu.find(s => s.link.replace(/^\/|\/$/g, '') === cleanSlug);
//       if (sub) return sub;
//     }
//   }
//   return null;
// }

// export async function generateMetadata({ params }: Props): Promise<Metadata> {
//   const { categorySlug } = await params;
//   const category = findCategoryInfo(categorySlug);
//   if (!category) return { title: 'Nội Thất Hùng Ngọc' };
//   return {
//     title: `${category.name} Giá Rẻ, Bền Đẹp | Nội Thất Hùng Ngọc`,
//     description: `Tổng kho phân phối ${category.name.toLowerCase()} tại Hà Nội.`,
//   };
// }

// export default async function CategoryPage({ params }: Props) {
//   const { categorySlug } = await params;
//   const cleanSlug = categorySlug.replace(/^\/|\/$/g, '');
//   const category = findCategoryInfo(cleanSlug);

//   if (!category) notFound();

//   // FIX LỖI: Chỉ gom nhóm nếu là danh mục chính. Nếu là mục con, chỉ lọc đúng mục đó.
//   const isMainGroup = Object.keys(CATEGORY_GROUPS).includes(cleanSlug);
//   const slugsToFilter = isMainGroup ? CATEGORY_GROUPS[cleanSlug] : [cleanSlug];
//   const finalSlugs = slugsToFilter.map(s => s.replace(/^\/|\/$/g, ''));

//   const hasProducts = products.some(p => finalSlugs.includes(p.category.replace(/^\/|\/$/g, '')));
// console.log("TỔNG SỐ SẢN PHẨM TRONG KHO:", products.length);
//   return (
//     <>
//       <main className={styles.container}>
//         <nav className={styles.breadcrumb}>
//           <Link href="/">Trang chủ</Link> <span> / </span> 
//           <strong className={styles.current}>{category.name}</strong>
//         </nav>

//         <header className={styles.categoryHeader}>
//           <h1 className={styles.mainTitle}>{category.name}</h1>
//           <p className={styles.categoryDescription}>
//             Chào mừng bạn đến với tổng kho <strong>{category.name.toLowerCase()}</strong> Hùng Ngọc. 
//           </p>
//         </header>

//         <div className={styles.productSection}>
//           {hasProducts ? (
//             <div className={styles.productGridFull}>
//               <ProductList title="" categorySlugs={finalSlugs} />
//             </div>
//           ) : (
//             <div className={styles.noProduct}>
//               <p>Hiện tại chúng tôi đang cập nhật thêm mẫu <strong>{category.name}</strong>.</p>
//               <Link href="/" className={styles.backHome}>Quay lại trang chủ</Link>
//             </div>
//           )}
//         </div>
        
//         {/* PHẦN EXTRA INFO ĐẦY ĐỦ */}
//         <section className={styles.categoryExtraInfo}>
//           <h2 className={styles.subTitle}>Ưu đãi khi mua {category.name} tại Hùng Ngọc</h2>
//           <div className={styles.infoGrid}>
//             <div className={styles.infoItem}>
//               <strong>⭐ Giá gốc tại xưởng</strong>
//               <p>Tiết kiệm 20-30% chi phí so với cửa hàng bán lẻ.</p>
//             </div>
//             <div className={styles.infoItem}>
//               <strong>⭐ Giao hàng thần tốc</strong>
//               <p>Miễn phí vận chuyển và lắp đặt bán kính 3km.</p>
//             </div>
//             <div className={styles.infoItem}>
//               <strong>⭐ Bảo hành uy tín</strong>
//               <p>Cam kết chất lượng, bảo hành dài hạn.</p>
//             </div>
//             <div className={styles.infoItem}>
//               <strong>⭐ Tư vấn 24/7</strong>
//               <p>Đội ngũ kỹ thuật hỗ trợ khảo sát và tư vấn tận nơi.</p>
//             </div>
//           </div>
//         </section>
//       </main>
//     </>
//   );
// }