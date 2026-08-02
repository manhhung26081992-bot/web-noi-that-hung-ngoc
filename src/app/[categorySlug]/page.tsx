import { MENU_ITEMS } from '@/components/Header/menuData'; 
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProductList from '@/components/ProductList';
import CategorySchema from '@/components/CategorySchema';
import CategorySidebar from '@/components/CategorySidebar';
import styles from '@/styles/Category.module.css';
import Link from 'next/link';
import { getProductsByMultipleCategories, getCategoryBySlug  } from '@/app/actions';
import { addTrailingSlash, siteUrl } from '@/lib/url';
import { groupBedProducts } from '@/lib/bedCategoryGrouping';

interface Props {
  params: Promise<{ categorySlug: string }>;
}

export const revalidate = 86400;

const CATEGORY_GROUPS: { [key: string]: string[] } = {
  'sofa': ['sofa', 'ban-sofa', 'sofa-giuong', 'sofa-da', 'sofa-ni', 'sofa-vang'],
  'ghe-van-phong': ['ghe-xoay', 'ghe-chan-quy', 'ghe-giam-doc', 'ghe-gap', 'ghe-gaming', 'ghe-van-phong'],
  'tu-van-phong': ['tu-van-phong', 'tu-locker', 'tu-tai-lieu-go', 'tu-tai-lieu-sat', 'hoc-tu-tu-phu'],
  'ke-trang-tri': ['ke-go', 'ke-sach', 'ke-ti-vi', 'ke-trang-tri'],
  'ke-go': ['ke-go', 'ke-sach', 'ke-ti-vi', 'ke-trang-tri'],
  'truong-hoc': ['ban-ghe-hoc-sinh', 'bang-tu', 'ban-ghe-giao-vien'],
  'ban-ghe-an': ['ban-ghe-an', 'ban-an-mat-da', 'ban-an-thong-minh', 'bo-ban-an-6-ghe', 'bo-ban-an-4-ghe', 'ghe-an', 'ban-eames'],
  'ban-ghe-cafe': ['ban-ghe-cafe', 'ban-an-mat-da-cafe', 'ghe-bar', 'ban-eames'],
  'ban-van-phong': ['ban-van-phong', 'ban-chan-sat', 'ban-giam-doc', 'ban-hop', 'ban-nhan-vien', 'cum-ban', 'ban-gap'],
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
  'hoc-tu-tu-phu': ['tu-van-phong', 'ban-nhan-vien'],
  'ghe-xoay': ['ghe-van-phong', 'ghe-chan-quy', 'ghe-giam-doc'],
  'ghe-chan-quy': ['ghe-van-phong', 'ban-hop', 'ghe-giam-doc'],
  'ghe-giam-doc': ['ghe-van-phong', 'ban-giam-doc', 'ghe-xoay'],
  'ghe-gap': ['ghe-van-phong', 'ban-gap', 'truong-hoc'],
  'ghe-gaming': ['ghe-van-phong'],
  'ban-chan-sat': ['ban-van-phong', 'ban-nhan-vien'],
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

function getCategorySlugsForProducts(slug: string) {
  const cleanSlug = slug.toLowerCase();
  return Object.keys(CATEGORY_GROUPS).includes(cleanSlug) ? CATEGORY_GROUPS[cleanSlug] : [cleanSlug];
}

function normalizeWhitespace(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function stripHtml(value: string) {
  return normalizeWhitespace(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
}

function hasProductPriceText(value: string) {
  return /\d[\d.\s]*(?:₫|đ|vnd)\b/i.test(value);
}

function getSeoContentMetaDescription(value: string) {
  const content = stripHtml(value);
  const sentences = content.match(/[^.!?]+[.!?]?/g)?.map((sentence) => normalizeWhitespace(sentence)).filter(Boolean) || [];
  const candidates = sentences.filter((sentence) => !hasProductPriceText(sentence));

  return candidates.find((sentence) => sentence.length >= 140 && sentence.length <= 170)
    || candidates.find((sentence) => sentence.length <= 170)
    || '';
}

function getCategoryMetaDescription(categoryName: string, categorySeo: Awaited<ReturnType<typeof getCategoryBySlug>>) {
  const configuredDescription = normalizeWhitespace(categorySeo?.description || '');
  if (configuredDescription) return configuredDescription;

  const seoContentDescription = getSeoContentMetaDescription(categorySeo?.seo_content || '');
  if (seoContentDescription) return seoContentDescription;

  return `Mua ${categoryName} tại Nội Thất Hùng Ngọc. Sản phẩm nội thất bền đẹp, nhiều mẫu phù hợp cho văn phòng, gia đình và công trình.`;
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
  const finalSlugs = getCategorySlugsForProducts(cleanSlug);
  const productsFromSupabase = await getProductsByMultipleCategories(finalSlugs);
  const hasProducts = productsFromSupabase.length > 0;
  const title = normalizeWhitespace(categorySeo?.seo_title || category?.name || 'Danh mục sản phẩm');
  const categoryName = normalizeWhitespace(category?.name || categorySeo?.title || title);
  const description = getCategoryMetaDescription(categoryName, categorySeo);

    const canonicalUrl = siteUrl(`/${cleanSlug}`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: hasProducts
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: true,
        },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const cleanSlug = categorySlug.replace(/^\/|\/$/g, '');
  const category = findCategoryInfo(cleanSlug);

  if (!category) notFound();

  const finalSlugs = getCategorySlugsForProducts(cleanSlug);

  const productsFromSupabase = await getProductsByMultipleCategories(finalSlugs);
  const categorySeo = await getCategoryBySlug(cleanSlug);
  const internalLinks = getInternalLinks(cleanSlug);
  const bedGroups = cleanSlug === 'giuong-tang-sat'
    ? groupBedProducts(productsFromSupabase || [])
    : null;
  const schemaProducts = bedGroups ? bedGroups.allProducts : productsFromSupabase;

  return (
    <main className={styles.container}>
      {/* Schema danh mục chỉ mô tả CollectionPage/ItemList; Product + Offer nằm ở trang chi tiết. */}
      <CategorySchema
        categoryName={category.name}
        categorySlug={cleanSlug}
        products={schemaProducts || []}
      />

      <nav className={styles.breadcrumb}>
        <Link href="/">Trang chủ</Link> <span> / </span> 
        <strong className={styles.current}>{category.name}</strong>
      </nav>

      <header className={styles.categoryHeader}>
        <h1 className={styles.mainTitle}>{category.name}</h1>
      </header>

      <div className={styles.categoryLayout}>
        <div className={styles.categoryMain}>
      <div className={styles.productSection}>
        {productsFromSupabase && productsFromSupabase.length > 0 ? (
          bedGroups ? (
            <>
              <div className={styles.productGridFull}>
                <ProductList
                  title="Các mẫu giường tầng sắt nổi bật"
                  products={[...bedGroups.bunkProducts, ...bedGroups.unknownProducts]}
                  categorySlugs={finalSlugs}
                />
              </div>

              {bedGroups.singleProducts.length > 0 && (
                <div className={`${styles.productGridFull} ${styles.bedReferenceGroup}`}>
                  <div className={styles.bedReferenceIntro}>
                    <p>
                      Một số mẫu giường sắt đơn vẫn được giữ trong danh mục để khách tham khảo thêm khi cần giường ký túc xá,
                      giường phòng trọ hoặc giường cá nhân. Nhóm sản phẩm chính của trang vẫn ưu tiên giường tầng và giường lệch tầng.
                    </p>
                  </div>
                  <ProductList
                    title="Các mẫu giường sắt đơn tham khảo"
                    products={bedGroups.singleProducts}
                    categorySlugs={finalSlugs}
                  />
                </div>
              )}
            </>
          ) : (
            <div className={styles.productGridFull}>
              <ProductList
                title=""
                products={productsFromSupabase}
                categorySlugs={finalSlugs}
              />
            </div>
          )
        ) : (
          <div className={styles.noProduct}>
            <p>
              Hiện tại chúng tôi đang cập nhật thêm mẫu <strong>{category.name}</strong>.
            </p>
            <Link href="/" className={styles.backHome}>Quay lại trang chủ</Link>
          </div>
        )}
      </div>
        </div>
        <CategorySidebar />
      </div>
      {categorySeo?.seo_title && categorySeo?.seo_content && (
        <section className={styles.categorySeo}>
          <div className={styles.seoContent}>
            <span className={styles.seoEyebrow}>Tư vấn chọn mua</span>
            <h2>{categorySeo.seo_title}</h2>
            <div
              className={styles.seoHtmlContent}
              dangerouslySetInnerHTML={{ __html: categorySeo.seo_content }}
            />
          </div>

        </section>
      )}
      {internalLinks.length > 0 && (
        <section className={styles.relatedBox} aria-labelledby="related-category-title">
          <h2 id="related-category-title">Danh mục liên quan</h2>
          <div className={styles.relatedLinks}>
            {internalLinks.map((link) => (
              <Link key={link.slug} href={addTrailingSlash(`/${link.slug}`)} prefetch={false} className={styles.relatedLink}>
                {link.name}
              </Link>
            ))}
          </div>
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
