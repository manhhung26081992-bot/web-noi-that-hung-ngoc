import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function normalizeBlogSlug(value: string) {
  return decodeURIComponent(String(value || ""))
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^tin-tuc\/+/, "");
}

export async function getBlogBySlug(slug: string) {
  const cleanSlug = normalizeBlogSlug(slug);
  const slugCandidates = Array.from(
    new Set([cleanSlug, cleanSlug.replace(/-\d+$/, "")].filter(Boolean))
  );

  const results = await Promise.all(
    slugCandidates.map((candidate) =>
      supabase
        .from("blog_posts")
        .select("*")
        .ilike("slug", `${candidate}%`)
        .limit(10)
    )
  );
  const errorResult = results.find((result) => result.error);

  if (errorResult?.error) {
    console.error("Lỗi lấy dữ liệu bài viết:", {
      slug,
      cleanSlug,
      slugCandidates,
      error: errorResult.error,
    });
    return null;
  }

  const rows = results.flatMap((result) => result.data || []);
  const data = rows.find((post) => slugCandidates.includes(normalizeBlogSlug(post.slug)));

  if (!data) {
    console.error("Không tìm thấy bài viết:", { slug, cleanSlug, slugCandidates });
    return null;
  }

  return {
    id: data.id,
    slug: normalizeBlogSlug(data.slug),
    title: data.title,
    content: data.content,
    excerpt: data.excerpt || "",
    image: data.image || "/logo.png",
    description: data.excerpt || "",
    createdAt: data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || data.created_at || new Date().toISOString(),
  };
}
// export async function getBlogBySlug(slug: string) {
//   const supabase = await createClient();

//   const { data, error } = await supabase
//     .from('blog_posts') // Bảng lưu bài viết tin tức/cẩm nang.
//     .select('*')
//     .eq('slug', slug)
//     .single();

//   if (error || !data) {
//     console.error("Lỗi lấy dữ liệu bài viết:", error);
//     return null;
//   }

//   return {
//     id: data.id,
//     slug: data.slug,
//     title: data.title,
//     content: data.content,
//     excerpt: data.excerpt || '',
//     image: data.image || '/logo.png',
//     description: data.excerpt || '',
//     createdAt: data.created_at,
//     updatedAt: data.updated_at || data.created_at,
//   };
// }

export async function getAllBlogs() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Lỗi lấy danh sách bài viết:', error.message);
    return [];
  }

  return (data || []).map((post) => ({
    ...post,
    slug: normalizeBlogSlug(post.slug),
    views: Number(post.views ?? post.view_count ?? post.viewCount ?? 0),
  }));
}

export async function getPopularBlogs(limit = 8) {
  const posts = await getAllBlogs();

  return [...posts]
    .sort((a, b) => {
      const viewDiff = Number(b.views || 0) - Number(a.views || 0);
      if (viewDiff !== 0) return viewDiff;

      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    })
    .slice(0, limit);
}
