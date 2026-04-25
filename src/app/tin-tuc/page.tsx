import Image from "next/image";
import Link from "next/link";
import { getAllBlogs } from "@/lib/blog";

export const revalidate = 0;

export default async function NewsPage() {
  const posts = await getAllBlogs();

  return (
    <main className="container mx-auto px-4 py-12 min-h-screen">
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
        /* GRID 3 CỘT: ÉP CÁC BÀI VIẾT NẰM CẠNH NHAU */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: any) => {
            const isLogo = !post.image || post.image.includes('logo.png');

            return (
              <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group">
                <article className="h-full border rounded-xl overflow-hidden bg-white hover:shadow-lg transition-all flex flex-col">
                  
                  {/* KHUNG ẢNH: DÙNG CHIỀU CAO CỐ ĐỊNH 220PX ĐỂ KHÔNG BỊ TRÀN */}
                  <div style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '220px', 
                    overflow: 'hidden',
                    backgroundColor: '#f1f5f9' 
                  }}>
                    <Image
                      src={post.image || '/logo.png'}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ 
                        // Nếu là ảnh thật thì phủ kín, nếu là logo thì thu nhỏ ở giữa
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