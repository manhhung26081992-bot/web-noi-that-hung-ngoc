import { createClient } from '@/utils/supabase/server';

export async function getBlogBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('blog_posts') // Bảng lưu bài viết tin tức/cẩm nang.
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    console.error("Lỗi lấy dữ liệu bài viết:", error);
    return null;
  }

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    content: data.content,
    excerpt: data.excerpt || '',
    image: data.image || '/logo.png',
    description: data.excerpt || '',
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at,
  };
}

export async function getAllBlogs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Lỗi lấy danh sách bài viết:', error.message);
    return [];
  }

  return data || [];
}
