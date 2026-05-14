import { 
  getProductBySlug, 
  getAllProductsFromSupabase, 
  getAllCategoriesFromSupabase 
} from '@/app/actions';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

// Cache dữ liệu 1 tiếng. Khi chạy build, Next.js sẽ biến toàn bộ trang thành HTML tĩnh.
export const revalidate = 3600; 

// 🔥 BÍ QUYẾT TỐC ĐỘ: Pre-render trước toàn bộ các đường link sản phẩm lúc Build. 
// Khách bấm chuyển trang sẽ ăn ngay lập tức vào file HTML tĩnh có sẵn, tốc độ xé gió.
export async function generateStaticParams() {
  const [products, categories] = await Promise.all([
    getAllProductsFromSupabase(),
    getAllCategoriesFromSupabase()
  ]);

  // Gom toàn bộ slug của cả sản phẩm và danh mục lại để Next.js tạo sẵn trang tĩnh
  const productSlugs = products.map((p: any) => ({ slug: p.slug }));
  const categorySlugs = categories.map((c: any) => ({ slug: c.slug }));

  return [...productSlugs, ...categorySlugs];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug); 
  
  if (!product) return { title: 'Nội Thất Hùng Ngọc' };
  return { title: `${product.name} - Nội Thất Hùng Ngọc` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Lấy dữ liệu song song từ Server
  const [product, allProducts, allCategories] = await Promise.all([
    getProductBySlug(slug),
    getAllProductsFromSupabase(), 
    getAllCategoriesFromSupabase()
  ]);

  const productExists = !!product;
  const isCategory = allCategories.some((c: any) => c.slug === slug);

  if (!productExists && !isCategory) {
    notFound();
  }

  // Giữ nguyên vẹn 100% các props để không làm lệch layout hay lỗi logic của file Client
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

// // Thay vì revalidate = 0, ta để 3600 (1 tiếng) để trang tải tức thì sau lần đầu tiên
// export const revalidate = 3600; 

// export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
//   const { slug } = await params;
//   // Chỉ lấy 1 sản phẩm duy nhất để lấy Metadata, cực nhanh
//   const product = await getProductBySlug(slug); 
  
//   if (!product) return { title: 'Nội Thất Hùng Ngọc' };
//   return { title: `${product.name} - Nội Thất Hùng Ngọc` };
// }

// export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
//   const { slug } = await params;
  
//   // Sử dụng Promise.all để lấy dữ liệu song song, giảm thời gian chờ đợi
//   const [product, allProducts, allCategories] = await Promise.all([
//     getProductBySlug(slug),
//     getAllProductsFromSupabase(), // Giữ lại để truyền vào ProductDetailClient cho layout cũ
//     getAllCategoriesFromSupabase()
//   ]);

//   // Kiểm tra tồn tại dựa trên dữ liệu đã lấy
//   const productExists = !!product;
//   const isCategory = allCategories.some((c: any) => c.slug === slug);

//   if (!productExists && !isCategory) {
//     notFound();
//   }

//   // Giữ nguyên các props truyền vào để không làm hỏng layout của ProductDetailClient
//   return (
//     <ProductDetailClient 
//       params={params} 
//       allProducts={allProducts} 
//       allCategories={allCategories} 
//     />
//   );
// }

// import { getAllProductsFromSupabase, getAllCategoriesFromSupabase } from '@/app/actions';
// import ProductDetailClient from './ProductDetailClient';
// import { notFound } from 'next/navigation';

// // Next.js sẽ luôn lấy dữ liệu mới nhất từ Supabase (không lưu cache cũ)
// export const revalidate = 0;

// export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
//   const { slug } = await params;
//   const allProducts = await getAllProductsFromSupabase(); // Lấy từ Base
//   const product = (allProducts as any[]).find((p) => p.slug === slug);
  
//   if (!product) return { title: 'Nội Thất Hùng Ngọc' };
//   return { title: `${product.name} - Nội Thất Hùng Ngọc` };
// }

// export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
//   const { slug } = await params;
  
//   // 1. Lấy dữ liệu thực tế từ Supabase (Cả sản phẩm và danh mục)
//   const allProducts = await getAllProductsFromSupabase();
//   const allCategories = await getAllCategoriesFromSupabase();
  
//   const productExists = allProducts.some((p) => p.slug === slug);
//   const isCategory = allCategories.some((c: any) => c.slug === slug);

//   // 2. Kiểm tra nếu không có sản phẩm và cũng không phải danh mục thì báo 404
//   if (!productExists && !isCategory) {
//     notFound();
//   }

//   // 3. Truyền dữ liệu vào Client Component
//   return (
//     <ProductDetailClient 
//       params={params} 
//       allProducts={allProducts} 
//       allCategories={allCategories} 
//     />
//   );
// }
