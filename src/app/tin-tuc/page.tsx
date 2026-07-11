import Link from "next/link";
import type { Metadata } from "next";
import { getAllBlogs, getPopularBlogs } from "@/lib/blog";
import styles from "./news-list.module.css";
import { addTrailingSlash, siteUrl } from "@/lib/url";

export const revalidate = 3600;

type BlogPost = {
  id: string | number;
  slug: string;
  title: string;
  excerpt?: string;
  image?: string;
  views?: number;
};

export const metadata: Metadata = {
  title: "Tin tức & Cẩm nang nội thất - Nội Thất Hùng Ngọc",
  description:
    "Cẩm nang chọn mua bàn ghế văn phòng, tủ locker, sofa, nội thất gia đình và kinh nghiệm thi công nội thất giá tốt tại Hà Nội.",
  alternates: {
    canonical: siteUrl("/tin-tuc"),
  },
  openGraph: {
    title: "Tin tức & Cẩm nang nội thất - Nội Thất Hùng Ngọc",
    description:
      "Kinh nghiệm chọn mua, bố trí và bảo quản nội thất văn phòng, gia đình từ Nội Thất Hùng Ngọc.",
    url: siteUrl("/tin-tuc"),
    type: "website",
  },
};

function getImageSrc(post: BlogPost) {
  return post.image || "/logo.png";
}

function getExcerpt(post: BlogPost) {
  return (
    post.excerpt ||
    "Tìm hiểu thêm về cách chọn mua, bố trí và sử dụng nội thất văn phòng, gia đình bền đẹp, tiết kiệm chi phí tại Nội Thất Hùng Ngọc."
  );
}

type NewsPageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page || 1) || 1);
  const postsPerPage = 10;
  const [posts, popularPosts] = await Promise.all([
    getAllBlogs() as Promise<BlogPost[]>,
    getPopularBlogs(8) as Promise<BlogPost[]>,
  ]);
  const totalPages = Math.max(1, Math.ceil(posts.length / postsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visiblePosts = posts.slice((safeCurrentPage - 1) * postsPerPage, safeCurrentPage * postsPerPage);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tin tức & Cẩm nang nội thất",
    url: siteUrl("/tin-tuc"),
    description: metadata.description,
    publisher: {
      "@type": "Organization",
      name: "Nội Thất Hùng Ngọc",
      url: "https://www.noithathungngoc.com",
      logo: "https://www.noithathungngoc.com/logo.png",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.slice(0, 20).map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: siteUrl(`/tin-tuc/${post.slug}`),
        name: post.title,
      })),
    },
  };

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema).replace(/</g, "\\u003c") }}
      />

      <nav className={styles.breadcrumb}>
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <span>Tin tức</span>
      </nav>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <section className={styles.box}>
            <h2 className={styles.boxTitle}>Chuyên mục</h2>
            <ul className={styles.categoryList}>
              <li><Link href="/tin-tuc/">Tin tức</Link></li>
              <li><Link href="/tin-tuc/">Kinh nghiệm</Link></li>
              <li><Link href="/tu-van-phong/">Tủ văn phòng</Link></li>
              <li><Link href="/ban-van-phong/">Bàn văn phòng</Link></li>
              <li><Link href="/ghe-van-phong/">Ghế văn phòng</Link></li>
              <li><Link href="/sofa/">Sofa</Link></li>
            </ul>
          </section>

          <section className={styles.box}>
            <h2 className={styles.boxTitle}>Tin tức đọc nhiều</h2>
            <div className={styles.popularList}>
              {popularPosts.map((post) => (
                <Link key={post.id} href={addTrailingSlash(`/tin-tuc/${post.slug}`)} className={styles.popularItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getImageSrc(post)} alt={post.title} className={styles.popularThumb} loading="lazy" />
                  <span className={styles.popularName}>{post.title}</span>
                </Link>
              ))}
            </div>
          </section>
        </aside>

        <section className={styles.content}>
          <h1 className={styles.title}>Tin tức & Cẩm nang nội thất</h1>

          {posts.length === 0 ? (
            <p className={styles.empty}>Hiện chưa có bài viết nào.</p>
          ) : (
            <div className={styles.postList}>
              {visiblePosts.map((post) => (
                <Link key={post.id} href={addTrailingSlash(`/tin-tuc/${post.slug}`)} className={styles.postItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getImageSrc(post)} alt={post.title} className={styles.postImage} loading="lazy" />
                  <div className={styles.postBody}>
                    <h2 className={styles.postTitle}>{post.title}</h2>
                    <p className={styles.excerpt}>{getExcerpt(post)}</p>
                    <span className={styles.readMore}>Xem chi tiết &gt;&gt;</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Phân trang tin tức">
              {safeCurrentPage > 1 ? (
                <Link
                  className={styles.pageButton}
                  href={safeCurrentPage === 2 ? "/tin-tuc/" : addTrailingSlash(`/tin-tuc?page=${safeCurrentPage - 1}`)}
                  aria-label="Trang trước"
                >
                  ‹
                </Link>
              ) : (
                <span className={`${styles.pageButton} ${styles.disabled}`} aria-hidden="true">
                  ‹
                </span>
              )}

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <Link
                  key={pageNumber}
                  className={`${styles.pageButton} ${pageNumber === safeCurrentPage ? styles.activePage : ""}`}
                  href={pageNumber === 1 ? "/tin-tuc/" : addTrailingSlash(`/tin-tuc?page=${pageNumber}`)}
                  aria-current={pageNumber === safeCurrentPage ? "page" : undefined}
                >
                  {pageNumber}
                </Link>
              ))}

              {safeCurrentPage < totalPages ? (
                <Link
                  className={styles.pageButton}
                  href={addTrailingSlash(`/tin-tuc?page=${safeCurrentPage + 1}`)}
                  aria-label="Trang sau"
                >
                  ›
                </Link>
              ) : (
                <span className={`${styles.pageButton} ${styles.disabled}`} aria-hidden="true">
                  ›
                </span>
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
