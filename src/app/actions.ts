'use server'

import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/types'

const PRODUCT_FIELDS = `
  id,
  name,
  slug,
  image,
  price,
  category
`

export async function getProductsByMultipleCategories(
  slugs: string[],
  limit = 50 // Tăng limit lên để khi ấn "Xem tất cả" sẽ hiện đầy đủ sản phẩm
) {
  // slugs lúc này có thể là ['tu-van-phong'] hoặc ['tu-locker', 'tu-sat']
  
  // Chuyển mảng slugs thành chuỗi để dùng trong lệnh .or() của Supabase
  const slugQuery = slugs.map(s => `category.eq.${s},parent_slug.eq.${s}`).join(',');

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .or(slugQuery) // Tìm kiếm thông minh: khớp mục con HOẶC mục cha
    .order('id', { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Lỗi lấy sản phẩm từ Supabase:", error);
    return [];
  }

  return data ?? [];
}

export async function seedAllProductsAction(
  allProductsFromFile: Product[] = []
) {
  const STORAGE_URL =
    'https://oytmbjoxetmbjsvlyiph.supabase.co/storage/v1/object/public/product-images/'

  try {
    const formatPath = (path: string): string => {
      return path
        .replace(/^\//, '')
        .replace(/\.(jpg|jpeg|png)$/i, '.webp')
    }

    const processedProducts = allProductsFromFile.map((product: Product) => {
      const numericId = parseInt(String(product.id))

      return {
        ...product,
        id: isNaN(numericId) ? product.id : numericId,
        image:
          typeof product.image === 'string'
            ? product.image.startsWith('http')
              ? product.image
              : `${STORAGE_URL}${formatPath(product.image)}`
            : product.image,
        images: Array.isArray(product.images)
          ? product.images.map((img: string) =>
              img.startsWith('http')
                ? img
                : `${STORAGE_URL}${formatPath(img)}`
            )
          : []
      }
    })

    const { error } = await supabase
      .from('products')
      .upsert(processedProducts, {
        onConflict: 'id'
      })

    if (error) throw error

    return {
      success: true,
      message: `Đã đồng bộ ${processedProducts.length} sản phẩm`
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}
// Thêm vào cuối file src/app/actions.ts

// Hàm lấy toàn bộ sản phẩm
export async function getAllProductsFromSupabase() {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .order('id', { ascending: true });

  if (error) {
    console.error("Lỗi lấy sản phẩm:", error);
    return [];
  }
  return data ?? [];
}

// Hàm lấy toàn bộ danh mục (Dựa trên dữ liệu duy nhất từ bảng sản phẩm nếu bạn chưa có bảng categories riêng)
export async function getAllCategoriesFromSupabase() {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .not('category', 'is', null);

  if (error) return [];
  
  // Lọc ra các category duy nhất và tạo object có slug/title
  const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
  return uniqueCategories.map(cat => ({
    slug: cat,
    title: cat.charAt(0).toUpperCase() + cat.slice(1) // Viết hoa chữ cái đầu làm tiêu đề tạm
  }));
}
//
export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .eq('slug', slug)
    .single();
  return data;
}
// 'use server'

// import { supabase } from '@/lib/supabase'

// // --- 1. LẤY TOÀN BỘ SẢN PHẨM ---
// export async function getAllProductsFromSupabase() {
//   const { data, error } = await supabase
//     .from('products')
//     .select('id,name,slug,image,price,category')
//     .order('id', { ascending: true });

//   if (error) {
//     console.error('Lỗi lấy toàn bộ dữ liệu sản phẩm:', error);
//     return [];
//   }
//   return data || [];
// }

// // --- 2. LẤY TOÀN BỘ DANH MỤC (MỚI BỔ SUNG CHO NGỌC) ---
// export async function getAllCategoriesFromSupabase() {
//   const { data, error } = await supabase
//     .from('categories')
//     .select('*')
//     .order('title', { ascending: true }); // Sắp xếp theo tên danh mục A-Z

//   if (error) {
//     console.error('Lỗi lấy dữ liệu danh mục:', error);
//     return [];
//   }
//   return data || [];
// }

// // --- 3. LẤY SẢN PHẨM THEO DANH MỤC ---
// export async function getProductsByMultipleCategories(slugs: string[]) {
//   const { data, error } = await supabase
//     .from('products')
//     .select('*')
//     .in('category', slugs)
//     .order('id', { ascending: true });

//   if (error) {
//     console.error('Lỗi lấy dữ liệu theo danh mục:', error);
//     return [];
//   }
//   return data || [];
// }

// // --- 4. HÀM ĐỒNG BỘ AN TOÀN (GIỮ LẠI ĐỂ DÙNG KHI CẦN) ---
// // Ngọc lưu ý: Nếu xóa file data/products thì hàm này sẽ báo lỗi ở dòng 'allProducts'
// // Mình tạm thời để tham số truyền vào thay vì import cứng để Ngọc xóa được file kia.
// export async function seedAllProductsAction(allProductsFromFile?: any[]) {
//   const STORAGE_URL = "https://oytmbjoxetmbjsvlyiph.supabase.co/storage/v1/object/public/product-images/";

//   try {
//     if (!allProductsFromFile || allProductsFromFile.length === 0) {
//       return { success: false, error: "Không có dữ liệu để đồng bộ." };
//     }

//     const formatPath = (path: string) => {
//       if (!path || typeof path !== 'string') return '';
//       return path
//         .replace(/^\//, '') 
//         .replace(/\.(jpg|jpeg|png)$/i, '.webp');
//     };

//     const processedProducts = allProductsFromFile.map((product: any) => {
//       const numericId = parseInt(product.id);
//       return { 
//         ...product, 
//         id: isNaN(numericId) ? product.id : numericId, 
//         image: product.image ? (product.image.startsWith('http') ? product.image : `${STORAGE_URL}${formatPath(product.image)}`) : null,
//         images: Array.isArray(product.images) 
//           ? product.images.map((img: string) => img.startsWith('http') ? img : `${STORAGE_URL}${formatPath(img)}`)
//           : [],
//       };
//     });

//     const uniqueProducts = processedProducts.filter((p, i, self) =>
//       i === self.findIndex((obj) => 
//         String(obj.id) === String(p.id) || String(obj.slug) === String(p.slug)
//       )
//     );

//     const { error: upsertError } = await supabase
//       .from('products')
//       .upsert(uniqueProducts, { 
//         onConflict: 'id',
//         ignoreDuplicates: false 
//       });

//     if (upsertError) throw upsertError;
    
//     return { 
//       success: true, 
//       message: `Đã đồng bộ thành công ${uniqueProducts.length} sản phẩm lên Supabase!` 
//     };

//   } catch (error: any) {
//     console.error("Lỗi đồng bộ:", error.message);
//     return { success: false, error: error.message };
//   }
// }


