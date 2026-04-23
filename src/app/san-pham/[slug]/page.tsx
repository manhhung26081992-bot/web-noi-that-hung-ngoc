import { 
  getProductBySlug, 
  getAllProductsFromSupabase, 
  getAllCategoriesFromSupabase 
} from '@/app/actions';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

// Thay vì revalidate = 0, ta để 3600 (1 tiếng) để trang tải tức thì sau lần đầu tiên
export const revalidate = 3600; 

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Chỉ lấy 1 sản phẩm duy nhất để lấy Metadata, cực nhanh
  const product = await getProductBySlug(slug); 
  
  if (!product) return { title: 'Nội Thất Hùng Ngọc' };
  return { title: `${product.name} - Nội Thất Hùng Ngọc` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Sử dụng Promise.all để lấy dữ liệu song song, giảm thời gian chờ đợi
  const [product, allProducts, allCategories] = await Promise.all([
    getProductBySlug(slug),
    getAllProductsFromSupabase(), // Giữ lại để truyền vào ProductDetailClient cho layout cũ
    getAllCategoriesFromSupabase()
  ]);

  // Kiểm tra tồn tại dựa trên dữ liệu đã lấy
  const productExists = !!product;
  const isCategory = allCategories.some((c: any) => c.slug === slug);

  if (!productExists && !isCategory) {
    notFound();
  }

  // Giữ nguyên các props truyền vào để không làm hỏng layout của ProductDetailClient
  return (
    <ProductDetailClient 
      params={params} 
      allProducts={allProducts} 
      allCategories={allCategories} 
    />
  );
}

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
