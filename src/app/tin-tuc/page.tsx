import Link from "next/link";
import type { Metadata } from "next";
import { getAllBlogs } from "@/lib/blog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Tin tức & Cẩm nang nội thất - Nội Thất Hùng Ngọc",
  description:
    "Cẩm nang chọn mua bàn ghế văn phòng, tủ locker, sofa, nội thất gia đình và kinh nghiệm thi công nội thất giá tốt tại Hà Nội.",
  alternates: {
    canonical: "/tin-tuc",
  },
  openGraph: {
    title: "Tin tức & Cẩm nang nội thất - Nội Thất Hùng Ngọc",
    description:
      "Kinh nghiệm chọn mua, bố trí và bảo quản nội thất văn phòng, gia đình từ Nội Thất Hùng Ngọc.",
    url: "https://www.noithathungngoc.com/tin-tuc",
    type: "website",
  },
};

export default async function NewsPage() {
  const posts = await getAllBlogs();

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tin tức & Cẩm nang nội thất",
    url: "https://www.noithathungngoc.com/tin-tuc",
    description: metadata.description,
    publisher: {
      "@type": "Organization",
      name: "Nội Thất Hùng Ngọc",
      url: "https://www.noithathungngoc.com",
      logo: "https://www.noithathungngoc.com/logo.png",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.slice(0, 20).map((post: any, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://www.noithathungngoc.com/tin-tuc/${post.slug}`,
        name: post.title,
      })),
    },
  };

  return (
    <main className="container mx-auto px-4 py-12 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema).replace(/</g, "\\u003c") }}
      />
      <header className="mb-12 border-b pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
          Tin tức & Cẩm nang Nội thất
        </h1>
        <p className="text-slate-600 mt-2">
          Kinh nghiệm thiết kế và xu hướng nội thất mới nhất năm 2026.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500 italic">Hiện chưa có bài viết nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: any) => {
            const imageSrc = post.image || '/logo.png';
            const isLogo = !post.image || post.image.includes('logo.png');

            return (
              <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group">
                <article className="h-full border rounded-xl overflow-hidden bg-white hover:shadow-lg transition-all flex flex-col">
                  
                  {/* KHUNG ẢNH: Cố định 220px, chống tràn, chống lỗi 402 */}
                  <div style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '220px', 
                    overflow: 'hidden',
                    backgroundColor: '#f1f5f9' 
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      /* SEO 0 đồng: Tự động dùng tiêu đề làm mô tả ảnh */
                      alt={post.title} 
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: isLogo ? 'contain' : 'cover',
                        padding: isLogo ? '40px' : '0'
                      }}
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-xs text-blue-600 font-semibold mb-2 uppercase">
                      Cẩm nang nội thất
                    </div>
                    
                    <h2 className="text-lg font-bold text-slate-800 line-clamp-2 mb-3 group-hover:text-blue-700">
                      {post.title}
                    </h2>
                    
                    <p className="text-slate-600 text-sm line-clamp-3 mb-4">
                      {post.excerpt || "Tìm hiểu thêm về các mẫu nội thất văn phòng bền đẹp và tiết kiệm chi phí tại Nội Thất Hùng Ngọc..."}
                    </p>
                    
                    <div className="mt-auto text-blue-600 text-sm font-bold flex items-center">
                      Xem chi tiết 
                      <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
