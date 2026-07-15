import { addTrailingSlash, siteUrl } from '@/lib/url';
import { productRedirects } from '@/data/productRedirects';
import {
  getProductBySlug,
  getAllProductsFromSupabase,
  getRelatedProductsByCategory,
  findCanonicalProductForLegacySlug
} from '@/app/actions';
import ProductDetailClient from './ProductDetailClient';
import { notFound, permanentRedirect } from 'next/navigation';

export const dynamic = 'force-static';
export const dynamicParams = true; 
export const revalidate = 604800; 

// Táº¡o sáºµn cÃ¡c trang tÄ©nh trong lÃºc build Ä‘á»ƒ táº£i nhanh vÃ  tá»‘t cho SEO.
export async function generateStaticParams() {
  try {
    const products = await getAllProductsFromSupabase();

    // DÃ¹ng ?. Ä‘á»ƒ trÃ¡nh sáº­p build khi Supabase tráº£ vá» rá»—ng.
    const productSlugs = products?.map((p: any) => ({ slug: p.slug })) || [];
    return productSlugs;
  } catch (error) {
    console.error("Lá»—i khi cháº¡y generateStaticParams:", error);
    return [];
  }
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug); 
  
  if (!product) return { title: 'Ná»™i Tháº¥t HÃ¹ng Ngá»c' };
  
  
  const canonicalUrl = siteUrl(`/san-pham/${product.slug}`);

  return { 
    title: `${product.name} - Ná»™i Tháº¥t HÃ¹ng Ngá»c`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      url: canonicalUrl,
      title: `${product.name} - Ná»™i Tháº¥t HÃ¹ng Ngá»c`,
      images: [
        {
          // DÃ¹ng Ä‘Ãºng cá»™t product.image tá»« dá»¯ liá»‡u Supabase.
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
  
//   if (!product) return { title: 'Ná»™i Tháº¥t HÃ¹ng Ngá»c' };
//   return { title: `${product.name} - Ná»™i Tháº¥t HÃ¹ng Ngá»c` };
  
  
// }

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cleanSlug = String(slug || '').trim();
  const currentPath = addTrailingSlash(`/san-pham/${cleanSlug}`);
  const manualRedirect = productRedirects[currentPath];

  if (manualRedirect) {
    permanentRedirect(manualRedirect);
  }

  const product = await getProductBySlug(cleanSlug);

  if (!product) {
    const canonicalProduct = await findCanonicalProductForLegacySlug(cleanSlug);
    if (canonicalProduct?.slug) {
      permanentRedirect(addTrailingSlash(`/san-pham/${canonicalProduct.slug}`));
    }

    notFound();
  }

  const canonicalProductPath = addTrailingSlash(`/san-pham/${product.slug}`);
  if (currentPath !== canonicalProductPath) {
    permanentRedirect(canonicalProductPath);
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
