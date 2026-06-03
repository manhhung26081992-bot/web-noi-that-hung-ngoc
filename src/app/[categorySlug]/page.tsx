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

export const revalidate = 604800;

const CATEGORY_GROUPS: { [key: string]: string[] } = {
  'sofa': ['sofa', 'ban-sofa', 'sofa-giuong', 'sofa-da', 'sofa-ni', 'sofa-vang'],
  'ghe-van-phong': ['ghe-xoay', 'ghe-chan-quy', 'ghe-giam-doc', 'ghe-gap', 'ghe-gaming', 'ghe-van-phong'],
  'tu-van-phong': ['tu-van-phong', 'tu-locker', 'tu-tai-lieu-go', 'tu-tai-lieu-sat', 'hoc-tu-tu-phu'],
  'ke-trang-tri': ['ke-go', 'ke-sach', 'ke-ti-vi', 'ke-trang-tri'],
  'ke-go': ['ke-go', 'ke-sach', 'ke-ti-vi', 'ke-trang-tri'],
  'truong-hoc': ['ban-ghe-hoc-sinh', 'bang-tu', 'ban-ghe-giao-vien'],
  'ban-ghe-an': ['ban-ghe-an', 'ban-an-mat-da', 'ban-an-thong-minh', 'bo-ban-an-6-ghe', 'bo-ban-an-4-ghe', 'ghe-an', 'ban-eames'],
  'ban-ghe-cafe': ['ban-ghe-cafe', 'ban-an-mat-da-cafe', 'ghe-bar', 'ban-eames'],
  'ban-van-phong': ['ban-van-phong', 'ban-lam-viec', 'ban-chan-sat', 'ban-giam-doc', 'ban-hop', 'ban-nhan-vien', 'cum-ban', 'ban-gap'],
  'ban-lam-viec': ['ban-lam-viec'],
  'gia-dinh': ['gia-dinh', 'giuong-tang-sat', 'tu-quan-ao', 'tu-giay', 'ban-trang-diem', 'giuong-go', 'ke-go', 'ke-sach', 'ke-ti-vi', 'ket-sat', 'ke-de-hang'],
};

const CATEGORY_LABELS: { [key: string]: string } = {
  'ban-an-mat-da': 'Bàn ăn mặt đá',
  'ban-an-mat-da-cafe': 'Bàn cafe mặt đá',
  'ban-an-thong-minh': 'Bàn ăn thông minh',
  'ban-chan-sat': 'Bàn chân sắt',
  'ban-eames': 'Bàn Eames',
  'ban-gap': 'Bàn gấp',
  'ban-ghe-an': 'Bàn ghế ăn',
  'ban-ghe-cafe': 'Bàn ghế cafe',
  'ban-ghe-giao-vien': 'Bàn ghế giáo viên',
  'ban-ghe-hoc-sinh': 'Bàn ghế học sinh',
  'ban-giam-doc': 'Bàn giám đốc',
  'ban-hop': 'Bàn họp',
  'ban-lam-viec': 'Bàn làm việc',
  'ban-nhan-vien': 'Bàn nhân viên',
  'ban-sofa': 'Bàn sofa',
  'ban-trang-diem': 'Bàn trang điểm',
  'ban-van-phong': 'Bàn văn phòng',
  'bang-tu': 'Bảng từ',
  'bo-ban-an-4-ghe': 'Bộ bàn ăn 4 ghế',
  'bo-ban-an-6-ghe': 'Bộ bàn ăn 6 ghế',
  'cum-ban': 'Cụm bàn làm việc',
  'ghe-an': 'Ghế ăn',
  'ghe-bar': 'Ghế bar',
  'ghe-chan-quy': 'Ghế chân quỳ',
  'ghe-gaming': 'Ghế gaming',
  'ghe-gap': 'Ghế gấp',
  'ghe-giam-doc': 'Ghế giám đốc',
  'ghe-van-phong': 'Ghế văn phòng',
  'ghe-xoay': 'Ghế xoay văn phòng',
  'gia-dinh': 'Nội thất gia đình',
  'giuong-go': 'Giường gỗ',
  'giuong-tang-sat': 'Giường tầng sắt',
  'hoc-tu-tu-phu': 'Hộc tủ - tủ phụ',
  'ke-de-hang': 'Kệ để hàng',
  'ke-go': 'Kệ gỗ',
  'ke-sach': 'Kệ sách',
  'ke-ti-vi': 'Kệ tivi',
  'ke-trang-tri': 'Kệ trang trí',
  'ket-sat': 'Két sắt',
  'quay-le-tan': 'Quầy lễ tân',
  'sofa': 'Sofa',
  'sofa-da': 'Sofa da',
  'sofa-giuong': 'Sofa giường',
  'sofa-ni': 'Sofa nỉ',
  'sofa-vang': 'Sofa văng',
  'truong-hoc': 'Nội thất trường học',
  'tu-giay': 'Tủ giày',
  'tu-locker': 'Tủ locker',
  'tu-quan-ao': 'Tủ quần áo',
  'tu-tai-lieu-go': 'Tủ tài liệu gỗ',
  'tu-tai-lieu-sat': 'Tủ tài liệu sắt',
  'tu-van-phong': 'Tủ văn phòng',
};

const INTERNAL_LINK_GROUPS: { [key: string]: string[] } = {
  ...CATEGORY_GROUPS,
  'tu-locker': ['tu-van-phong', 'tu-tai-lieu-sat', 'hoc-tu-tu-phu'],
  'tu-tai-lieu-sat': ['tu-van-phong', 'tu-tai-lieu-go', 'hoc-tu-tu-phu'],
  'tu-tai-lieu-go': ['tu-van-phong', 'tu-tai-lieu-sat', 'ke-sach'],
  'hoc-tu-tu-phu': ['tu-van-phong', 'ban-lam-viec', 'ban-nhan-vien'],
  'ghe-xoay': ['ghe-van-phong', 'ghe-chan-quy', 'ghe-giam-doc'],
  'ghe-chan-quy': ['ghe-van-phong', 'ban-hop', 'ghe-giam-doc'],
  'ghe-giam-doc': ['ghe-van-phong', 'ban-giam-doc', 'ghe-xoay'],
  'ghe-gap': ['ghe-van-phong', 'ban-gap', 'truong-hoc'],
  'ghe-gaming': ['ghe-van-phong', 'ban-lam-viec'],
  'ban-chan-sat': ['ban-van-phong', 'ban-lam-viec', 'ban-nhan-vien'],
  'ban-hop': ['ban-van-phong', 'ghe-chan-quy', 'ban-giam-doc'],
  'ban-giam-doc': ['ban-van-phong', 'ghe-giam-doc', 'tu-tai-lieu-go'],
  'ban-nhan-vien': ['ban-van-phong', 'cum-ban', 'hoc-tu-tu-phu'],
  'cum-ban': ['ban-van-phong', 'ban-nhan-vien', 'ghe-xoay'],
  'ban-gap': ['ban-van-phong', 'ghe-gap', 'truong-hoc'],
  'ban-ghe-hoc-sinh': ['truong-hoc', 'bang-tu', 'ban-ghe-giao-vien'],
  'bang-tu': ['truong-hoc', 'ban-ghe-hoc-sinh'],
  'ban-ghe-giao-vien': ['truong-hoc', 'bang-tu'],
  'giuong-go': ['gia-dinh', 'tu-quan-ao', 'ban-trang-diem'],
  'giuong-tang-sat': ['gia-dinh', 'tu-quan-ao'],
  'tu-quan-ao': ['gia-dinh', 'giuong-go', 'tu-giay'],
  'tu-giay': ['gia-dinh', 'ke-go', 'ke-trang-tri'],
  'ke-sach': ['gia-dinh', 'ke-go', 'ke-trang-tri'],
  'ke-ti-vi': ['gia-dinh', 'ban-sofa', 'sofa'],
  'ket-sat': ['gia-dinh', 'tu-van-phong'],
  'sofa-da': ['sofa', 'ban-sofa', 'sofa-ni'],
  'sofa-ni': ['sofa', 'ban-sofa', 'sofa-vang'],
  'sofa-giuong': ['sofa', 'ban-sofa', 'sofa-vang'],
  'sofa-vang': ['sofa', 'ban-sofa', 'sofa-ni'],
  'ban-sofa': ['sofa', 'sofa-da', 'sofa-ni'],
  'bo-ban-an-4-ghe': ['ban-ghe-an', 'bo-ban-an-6-ghe', 'ghe-an'],
  'bo-ban-an-6-ghe': ['ban-ghe-an', 'bo-ban-an-4-ghe', 'ban-an-mat-da'],
  'ban-an-mat-da': ['ban-ghe-an', 'bo-ban-an-6-ghe', 'ghe-an'],
  'ban-an-thong-minh': ['ban-ghe-an', 'bo-ban-an-4-ghe'],
  'ghe-an': ['ban-ghe-an', 'bo-ban-an-4-ghe', 'bo-ban-an-6-ghe'],
  'ban-eames': ['ban-ghe-an', 'ban-ghe-cafe', 'ghe-an'],
  'ban-an-mat-da-cafe': ['ban-ghe-cafe', 'ghe-bar', 'ban-eames'],
  'ghe-bar': ['ban-ghe-cafe', 'ban-an-mat-da-cafe'],
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

function getCategoryName(slug: string) {
  return CATEGORY_LABELS[slug] || findCategoryInfo(slug)?.name || slug.replace(/-/g, ' ');
}

function getInternalLinks(currentSlug: string) {
  const cleanSlug = currentSlug.toLowerCase();
  const linkSlugs = INTERNAL_LINK_GROUPS[cleanSlug] || [];
  const uniqueSlugs = Array.from(new Set(linkSlugs)).filter((slug) => slug !== cleanSlug);

  return uniqueSlugs.slice(0, 8).map((slug) => ({
    slug,
    name: getCategoryName(slug),
  }));
}

export function generateStaticParams() {
  const slugs = new Set<string>();

  MENU_ITEMS.forEach((item) => {
    const itemSlug = item.link.replace(/^\/|\/$/g, '');
    if (itemSlug) slugs.add(itemSlug);

    item.submenu?.forEach((sub) => {
      const subSlug = sub.link.replace(/^\/|\/$/g, '');
      if (subSlug) slugs.add(subSlug);
    });
  });

  return Array.from(slugs).map((categorySlug) => ({ categorySlug }));
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
  const internalLinks = getInternalLinks(cleanSlug);

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
          <div className={styles.seoContent}>
            <span className={styles.seoEyebrow}>Tư vấn chọn mua</span>
            <h2>{categorySeo.seo_title}</h2>
            <p>{categorySeo.seo_content}</p>
          </div>

          {internalLinks.length > 0 && (
            <div className={styles.relatedBox}>
              <h3>Danh mục liên quan</h3>
              <div className={styles.relatedLinks}>
                {internalLinks.map((link) => (
                  <Link key={link.slug} href={`/${link.slug}`} className={styles.relatedLink}>
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
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

