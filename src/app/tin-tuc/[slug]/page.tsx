import styles from "./news.module.css";
import { notFound } from "next/navigation";
import { getBlogBySlug } from "@/lib/blog";

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