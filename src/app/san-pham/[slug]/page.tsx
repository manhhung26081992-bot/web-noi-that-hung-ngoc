import { 
  getProductBySlug, 
  getAllProductsFromSupabase,
  getRelatedProductsByCategory
} from '@/app/actions';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-static';
export const dynamicParams = true; 
export const revalidate = 604800; 

// Tạo sẵn các trang tĩnh trong lúc build để tải nhanh và tốt cho SEO.
export async function generateStaticParams() {
  try {
    const products = await getAllProductsFromSupabase();

    // Dùng ?. để tránh sập build khi Supabase trả về rỗng.
    const productSlugs = products?.map((p: any) => ({ slug: p.slug })) || [];
    return productSlugs;
  } catch (error) {
    console.error("Lỗi khi chạy generateStaticParams:", error);
    return [];
  }
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug); 
  
  if (!product) return { title: 'Nội Thất Hùng Ngọc' };
  
  return { 
    title: `${product.name} - Nội Thất Hùng Ngọc`,
    alternates: {
      canonical: `https://www.noithathungngoc.com/san-pham/${slug}`,
    },
    openGraph: {
      url: `https://www.noithathungngoc.com/san-pham/${slug}`,
      title: `${product.name} - Nội Thất Hùng Ngọc`,
      images: [
        {
          // Dùng đúng cột product.image từ dữ liệu Supabase.
          url: product.image || 'https://www.noithathungngoc.com/default-share-image.jpg',
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}
// export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
//   const { slug } = await params;
//   const product = await getProductBySlug(slug); 
  
//   if (!product) return { title: 'Nội Thất Hùng Ngọc' };
//   return { title: `${product.name} - Nội Thất Hùng Ngọc` };
  
  
// }

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProductsByCategory(
    product.category,
    product.slug,
    8
  );

  return (
    <ProductDetailClient 
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
