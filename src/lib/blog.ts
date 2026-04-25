import { createClient } from '@/utils/supabase/server';

export async function getBlogBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('blog_posts') // Đúng tên bảng trong database của bạn
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    console.error("Lỗi lấy dữ liệu bài viết:", error);
    return null;
  }

  return {
    title: data.title,
    content: data.content,
    image: data.image || '/logo.png', // Sử dụng cột 'image'
    description: data.excerpt,        // Sử dụng cột 'excerpt' làm mô tả SEO
    createdAt: data.created_at
  };
}

export async function getAllBlogs() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}