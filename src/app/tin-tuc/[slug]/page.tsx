import styles from "./news.module.css";
import { notFound } from "next/navigation";
import { getBlogBySlug } from "@/lib/blog";

// 🔥 1. Hàm generateMetadata chuẩn cấu trúc Promise params của anh Hùng
// 🔥 1. Hàm generateMetadata chuẩn cấu trúc Promise params của anh Hùng
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);

  if (!post) return { title: "Nội Thất Hùng Ngọc" };

  // Ép kiểu (post as any) để TypeScript không bắt bẻ thuộc tính image và excerpt nữa
  const shareImage = (post as any).image || "https://www.noithathungngoc.com/logo.png";
  const postExcerpt = (post as any).excerpt || "Kinh nghiệm thiết kế và xu hướng nội thất mới nhất từ Nội Thất Hùng Ngọc.";

  return {
    title: `${post.title} - Nội Thất Hùng Ngọc`,
    description: postExcerpt,
    type: "article",
    alternates: {
      canonical: `https://www.noithathungngoc.com/tin-tuc/${slug}`,
    },
    openGraph: {
      url: `https://www.noithathungngoc.com/tin-tuc/${slug}`,
      title: `${post.title} - Nội Thất Hùng Ngọc`,
      description: postExcerpt,
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

// 2. Giao diện gốc anh viết giữ nguyên 100%
export default async function BlogDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);

  if (!post) return notFound();

  return (
    <article className={styles.container}>
      {/* 1. Tiêu đề bài viết */}
      <h1 className={styles.title} style={{ marginBottom: '40px', textAlign: 'center' }}>
        {post.title}
      </h1>
      
      {/* 2. ĐÃ BỎ PHẦN HIỂN THỊ LOGO/ẢNH TẠI ĐÂY */}

      {/* 3. Nội dung bài viết (Chữ sẽ đẩy lên ngay dưới tiêu đề) */}
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