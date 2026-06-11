import styles from "./news.module.css";
import { notFound } from "next/navigation";
import { getBlogBySlug } from "@/lib/blog";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);

  if (!post) return { title: "Nội Thất Hùng Ngọc" };

  const canonicalUrl = `https://www.noithathungngoc.com/tin-tuc/${post.slug}`;
  const shareImage = post.image?.startsWith("http")
    ? post.image
    : `https://www.noithathungngoc.com${post.image || "/logo.png"}`;
  const postExcerpt =
    post.excerpt ||
    post.description ||
    "Kinh nghiệm chọn mua và bố trí nội thất từ Nội Thất Hùng Ngọc.";

  return {
    title: `${post.title} - Nội Thất Hùng Ngọc`,
    description: postExcerpt,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      url: canonicalUrl,
      title: `${post.title} - Nội Thất Hùng Ngọc`,
      description: postExcerpt,
      type: "article",
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function BlogDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);

  if (!post) return notFound();

  const canonicalUrl = `https://www.noithathungngoc.com/tin-tuc/${post.slug}`;
  const shareImage = post.image?.startsWith("http")
    ? post.image
    : `https://www.noithathungngoc.com${post.image || "/logo.png"}`;
  const description =
    post.excerpt ||
    post.description ||
    "Kinh nghiệm chọn mua và bố trí nội thất từ Nội Thất Hùng Ngọc.";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    image: [shareImage],
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    author: {
      "@type": "Organization",
      name: "Nội Thất Hùng Ngọc",
      url: "https://www.noithathungngoc.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Nội Thất Hùng Ngọc",
      logo: {
        "@type": "ImageObject",
        url: "https://www.noithathungngoc.com/logo.png",
      },
    },
  };

  return (
    <article className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }}
      />

      <h1 className={styles.title} style={{ marginBottom: '40px', textAlign: 'center' }}>
        {post.title}
      </h1>
      
      <div 
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: post.content }} 
        style={{ 
          marginTop: '20px',
          borderTop: '1px solid #eee',
          paddingTop: '30px'
        }}
      />
    </article>
  );
}

// import styles from "./news.module.css";
// import { notFound } from "next/navigation";
// import { getBlogBySlug } from "@/lib/blog";

// export default async function BlogDetail({ params }: { params: Promise<{ slug: string }> }) {
//   const { slug } = await params;
//   const post = await getBlogBySlug(slug);

//   if (!post) return notFound();

//   return (
//     <article className={styles.container}>
//       {/* 1. Tiêu đề bài viết */}
//       <h1 className={styles.title} style={{ marginBottom: '40px', textAlign: 'center' }}>
//         {post.title}
//       </h1>
      
//       {/* 2. ĐÃ BỎ PHẦN HIỂN THỊ LOGO/ẢNH TẠI ĐÂY */}

//       {/* 3. Nội dung bài viết (Chữ sẽ đẩy lên ngay dưới tiêu đề) */}
//       <div 
//         className={styles.content}
//         dangerouslySetInnerHTML={{ __html: post.content }} 
//         style={{ 
//           marginTop: '20px',
//           borderTop: '1px solid #eee',
//           paddingTop: '30px'
//         }}
//       />
//     </article>
//   );
// }
