import { MENU_ITEMS } from '@/components/Header/menuData'; 
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProductList from '@/components/ProductList';
import CategorySchema from '@/components/CategorySchema';
import styles from '@/styles/Category.module.css';
import Link from 'next/link';
import { getProductsByMultipleCategories, getCategoryBySlug  } from '@/app/actions';

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
  'ban-ghe-an': ['ban-ghe-an','ban-an-mat-da','bo-ban-an-thong-minh','bo-ban-an-6-ghe','bo-ban-an-4-ghe','ghe-an'],
  'ban-ghe-cafe': ['ban-ghe-cafe', 'cafe'],
  'ban-van-phong': ['ban-van-phong','ban-chan-sat', 'ban-giam-doc', 'ban-hop', 'ban-nhan-vien', 'ban-module', 'cum-ban-lam-viec'],
  'ban-lam-viec': ['ban-lam-viec'],
  'gia-dinh': ['giuong-tang-sat', 'giuong-tang', 'tu-quan-ao', 'tu-giay', 'ban-trang-diem', 'giuong-go', 'ke-go', 'ban-hoc-sinh'],
};

function findCategoryInfo(slug: string) {
  const cleanSlug = slug.replace(/^\/|\/$/g, '');

  for (const item of MENU_ITEMS) {
    const menuSlug = item.link.replace(/^\/|\/$/g, '');
    if (menuSlug === cleanSlug) return item;

    if (item.submenu) {
      const sub = item.submenu.find(
        (s) => s.link.replace(/^\/|\/$/g, '') === cleanSlug
      );
      if (sub) return sub;
    }
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const cleanSlug = categorySlug.replace(/^\/|\/$/g, '');
  const category = findCategoryInfo(cleanSlug);
  const categorySeo = await getCategoryBySlug(cleanSlug);
  const title = categorySeo?.seo_title || category?.name || 'Danh mục sản phẩm';

  return {
    title,
    description:
      categorySeo?.seo_content ||
      `Mua ${title} giá tốt tại Nội Thất Hùng Ngọc. Giao hàng nhanh tại Hà Nội.`,
    alternates: {
      canonical: `/${cleanSlug}`,
    },
    openGraph: {
      title,
      description:
        categorySeo?.seo_content ||
        `Mua ${title} giá tốt tại Nội Thất Hùng Ngọc. Giao hàng nhanh tại Hà Nội.`,
      url: `https://www.noithathungngoc.com/${cleanSlug}`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const cleanSlug = categorySlug.replace(/^\/|\/$/g, '');
  const category = findCategoryInfo(cleanSlug);

  if (!category) notFound();

  const isMainGroup = Object.keys(CATEGORY_GROUPS).includes(cleanSlug.toLowerCase());
  const finalSlugs = isMainGroup ? CATEGORY_GROUPS[cleanSlug.toLowerCase()] : [cleanSlug];

  const productsFromSupabase = await getProductsByMultipleCategories(finalSlugs);
  const categorySeo = await getCategoryBySlug(cleanSlug);

  return (
    <main className={styles.container}>
      {/* Schema danh mục giúp Google hiểu trang này là danh sách sản phẩm có giá. */}
      <CategorySchema
        categoryName={category.name}
        categorySlug={cleanSlug}
        products={productsFromSupabase || []}
      />

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
            <p>
              Hiện tại chúng tôi đang cập nhật thêm mẫu <strong>{category.name}</strong>.
            </p>
            <Link href="/" className={styles.backHome}>Quay lại trang chủ</Link>
          </div>
        )}
      </div>
{categorySeo?.seo_title && categorySeo?.seo_content && (
  <section className={styles.categorySeo}>
    <h2>{categorySeo.seo_title}</h2>
    <p>{categorySeo.seo_content}</p>
  </section>
)}
    </main>
  );
}


// import { MENU_ITEMS } from '@/components/Header/menuData'; 
// import { notFound } from 'next/navigation';
// import { Metadata } from 'next';
// import ProductList from '@/components/ProductList';
// import styles from '@/styles/Category.module.css';
// import Link from 'next/link';
// // GỌI HÀM LẤY DỮ LIỆU TỪ SUPABASE
// import { getProductsByMultipleCategories } from '@/app/actions';

// interface Props {
//   params: Promise<{ categorySlug: string }>;
// }

// const CATEGORY_GROUPS: { [key: string]: string[] } = {
//   'sofa': ['sofa', 'ban-sofa', 'sofa-giuong', 'sofa-da', 'sofa-ni', 'sofa-vang'],
//   'ghe-van-phong': ['ghe-xoay', 'ghe-chan-quy', 'ghe-giam-doc', 'ghe-gap', 'ghe-gaming', 'ghe-van-phong'],
//   'tu-van-phong': ['tu-van-phong', 'tu-locker', 'tu-tai-lieu-go', 'tu-tai-lieu-sat', 'hoc-tu-tu-phu'],
//   'ke-trang-tri': ['ke-go', 'ke-sach', 'ke-ti-vi', 'ke-trang-tri'],
//   'ke-go': ['ke-go', 'ke-sach', 'ke-ti-vi', 'ke-trang-tri'],
//   'truong-hoc': ['ban-ghe-hoc-sinh', 'bang-tu', 'ban-ghe-giao-vien'],
//   'ban-ghe-an': ['ban-ghe-an','ban-an-mat-da','bo-ban-an-thong-minh','bo-ban-an-6-ghe','bo-ban-an-4-ghe','ghe-an'],
//   'ban-ghe-cafe': ['ban-ghe-cafe', 'cafe'],
//   'ban-van-phong': ['ban-van-phong','ban-chan-sat', 'ban-giam-doc', 'ban-hop', 'ban-nhan-vien', 'ban-module', 'cum-ban-lam-viec',],
//   'ban-lam-viec':['ban-lam-viec'],
//   'gia-dinh': ['giuong-tang-sat', 'giuong-tang', 'tu-quan-ao', 'tu-giay', 'ban-trang-diem', 'giuong-go', 'ke-go', 'ban-hoc-sinh'],
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

// export default async function CategoryPage({ params }: Props) {
//   const { categorySlug } = await params;
//   const cleanSlug = categorySlug.replace(/^\/|\/$/g, '');
//   const category = findCategoryInfo(cleanSlug);

//   if (!category) notFound();

  
// const isMainGroup = Object.keys(CATEGORY_GROUPS).includes(cleanSlug.toLowerCase());
// const finalSlugs = isMainGroup ? CATEGORY_GROUPS[cleanSlug.toLowerCase()] : [cleanSlug];

//   // LẤY DỮ LIỆU TỪ SUPABASE
//   const productsFromSupabase = await getProductsByMultipleCategories(finalSlugs);
  
//   return (
//     <main className={styles.container}>
//       <nav className={styles.breadcrumb}>
//         <Link href="/">Trang chủ</Link> <span> / </span> 
//         <strong className={styles.current}>{category.name}</strong>
//       </nav>

//       <header className={styles.categoryHeader}>
//         <h1 className={styles.mainTitle}>{category.name}</h1>
//       </header>

//       <div className={styles.productSection}>
//         {productsFromSupabase && productsFromSupabase.length > 0 ? (
//           <div className={styles.productGridFull}>
//             <ProductList 
//               title="" 
//               products={productsFromSupabase} 
//               categorySlugs={finalSlugs} 
//             />
//           </div>
//         ) : (
//           <div className={styles.noProduct}>
//             <p>Hiện tại chúng tôi đang cập nhật thêm mẫu <strong>{category.name}</strong>.</p>
//             <Link href="/" className={styles.backHome}>Quay lại trang chủ</Link>
//           </div>
//         )}
//       </div>
//     </main>
//   );
// }

