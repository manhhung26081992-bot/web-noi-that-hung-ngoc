import { getAllProductsFromSupabase, getAllCategoriesFromSupabase } from '@/app/actions';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

// Next.js sẽ luôn lấy dữ liệu mới nhất từ Supabase (không lưu cache cũ)
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const allProducts = await getAllProductsFromSupabase(); // Lấy từ Base
  const product = (allProducts as any[]).find((p) => p.slug === slug);
  
  if (!product) return { title: 'Nội Thất Hùng Ngọc' };
  return { title: `${product.name} - Nội Thất Hùng Ngọc` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // 1. Lấy dữ liệu thực tế từ Supabase (Cả sản phẩm và danh mục)
  const allProducts = await getAllProductsFromSupabase();
  const allCategories = await getAllCategoriesFromSupabase();
  
  const productExists = allProducts.some((p) => p.slug === slug);
  const isCategory = allCategories.some((c: any) => c.slug === slug);

  // 2. Kiểm tra nếu không có sản phẩm và cũng không phải danh mục thì báo 404
  if (!productExists && !isCategory) {
    notFound();
  }

  // 3. Truyền dữ liệu vào Client Component
  return (
    <ProductDetailClient 
      params={params} 
      allProducts={allProducts} 
      allCategories={allCategories} 
    />
  );
}

// import { allProducts, categories } from '@/data/products/index';
// import ProductDetailClient from './ProductDetailClient';
// import { notFound } from 'next/navigation';

// export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
//   const { slug } = await params;
//   const product = (allProducts as any[]).find((p) => p.slug === slug);
//   if (!product) return { title: 'Nội Thất Hùng Ngoc' };
//   return { title: `${product.name} - Nội Thất Hùng Ngoc` };
// }

// export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
//   const { slug } = await params;
//   const productExists = allProducts.some((p) => p.slug === slug);
//   const isCategory = categories.some((c) => c.slug === slug);

//   if (!productExists && !isCategory) notFound();

//   return (
//     <ProductDetailClient 
//       params={params} 
//       allProducts={allProducts} 
//       allCategories={categories} 
//     />
//   );
// }