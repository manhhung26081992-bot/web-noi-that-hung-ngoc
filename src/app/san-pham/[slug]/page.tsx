import { 
  getProductBySlug, 
  getAllProductsFromSupabase, 
  getAllCategoriesFromSupabase 
} from '@/app/actions';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-static';
export const dynamicParams = true; 
export const revalidate = 3600; 

// 🔥 Tạo sẵn trang tĩnh lúc Build
export async function generateStaticParams() {
  try {
    const [products, categories] = await Promise.all([
      getAllProductsFromSupabase(),
      getAllCategoriesFromSupabase()
    ]);

    // Thêm dấu ?. đề phòng trường hợp dữ liệu từ Supabase trả về rỗng không gây sập build
    const productSlugs = products?.map((p: any) => ({ slug: p.slug })) || [];
    const categorySlugs = categories?.map((c: any) => ({ slug: c.slug })) || [];

    return [...productSlugs, ...categorySlugs];
  } catch (error) {
    console.error("Lỗi khi chạy generateStaticParams:", error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug); 
  
  if (!product) return { title: 'Nội Thất Hùng Ngọc' };
  return { title: `${product.name} - Nội Thất Hùng Ngọc` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const [product, allProducts, allCategories] = await Promise.all([
    getProductBySlug(slug),
    getAllProductsFromSupabase(), 
    getAllCategoriesFromSupabase()
  ]);

  const productExists = !!product;
  const isCategory = allCategories?.some((c: any) => c.slug === slug) || false;

  if (!productExists && !isCategory) {
    notFound();
  }

  return (
    <ProductDetailClient 
      params={params} 
      allProducts={allProducts} 
      allCategories={allCategories} 
    />
  );
}

// import { 
//   getProductBySlug, 
//   getAllProductsFromSupabase, 
//   getAllCategoriesFromSupabase 
// } from '@/app/actions';
// import ProductDetailClient from './ProductDetailClient';
// import { notFound } from 'next/navigation';
// export const dynamic = 'force-static';
// export const dynamicParams = true; // Nếu có sản phẩm mới up sau này, nó sẽ tự động tạo tĩnh ngầm lúc khách bấm vào lần đầu
// // Cache dữ liệu 1 tiếng. Khi chạy build, Next.js sẽ biến toàn bộ trang thành HTML tĩnh.
// export const revalidate = 3600; 

// // 🔥 BÍ QUYẾT TỐC ĐỘ: Pre-render trước toàn bộ các đường link sản phẩm lúc Build. 
// // Khách bấm chuyển trang sẽ ăn ngay lập tức vào file HTML tĩnh có sẵn, tốc độ xé gió.
// export async function generateStaticParams() {
//   const [products, categories] = await Promise.all([
//     getAllProductsFromSupabase(),
//     getAllCategoriesFromSupabase()
//   ]);

//   // Gom toàn bộ slug của cả sản phẩm và danh mục lại để Next.js tạo sẵn trang tĩnh
//   const productSlugs = products.map((p: any) => ({ slug: p.slug }));
//   const categorySlugs = categories.map((c: any) => ({ slug: c.slug }));

//   return [...productSlugs, ...categorySlugs];
// }

// export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
//   const { slug } = await params;
//   const product = await getProductBySlug(slug); 
  
//   if (!product) return { title: 'Nội Thất Hùng Ngọc' };
//   return { title: `${product.name} - Nội Thất Hùng Ngọc` };
// }

// export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
//   const { slug } = await params;
  
//   // Lấy dữ liệu song song từ Server
//   const [product, allProducts, allCategories] = await Promise.all([
//     getProductBySlug(slug),
//     getAllProductsFromSupabase(), 
//     getAllCategoriesFromSupabase()
//   ]);

//   const productExists = !!product;
//   const isCategory = allCategories.some((c: any) => c.slug === slug);

//   if (!productExists && !isCategory) {
//     notFound();
//   }

//   // Giữ nguyên vẹn 100% các props để không làm lệch layout hay lỗi logic của file Client
//   return (
//     <ProductDetailClient 
//       params={params} 
//       allProducts={allProducts} 
//       allCategories={allCategories} 
//     />
//   );
// }
