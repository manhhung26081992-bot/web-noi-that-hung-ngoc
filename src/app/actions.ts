'use server'

import { supabase } from '@/lib/supabase'

// --- 1. LẤY TOÀN BỘ SẢN PHẨM ---
export async function getAllProductsFromSupabase() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Lỗi lấy toàn bộ dữ liệu sản phẩm:', error);
    return [];
  }
  return data || [];
}

// --- 2. LẤY TOÀN BỘ DANH MỤC (MỚI BỔ SUNG CHO NGỌC) ---
export async function getAllCategoriesFromSupabase() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('title', { ascending: true }); // Sắp xếp theo tên danh mục A-Z

  if (error) {
    console.error('Lỗi lấy dữ liệu danh mục:', error);
    return [];
  }
  return data || [];
}

// --- 3. LẤY SẢN PHẨM THEO DANH MỤC ---
export async function getProductsByMultipleCategories(slugs: string[]) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('category', slugs)
    .order('id', { ascending: true });

  if (error) {
    console.error('Lỗi lấy dữ liệu theo danh mục:', error);
    return [];
  }
  return data || [];
}

// --- 4. HÀM ĐỒNG BỘ AN TOÀN (GIỮ LẠI ĐỂ DÙNG KHI CẦN) ---
// Ngọc lưu ý: Nếu xóa file data/products thì hàm này sẽ báo lỗi ở dòng 'allProducts'
// Mình tạm thời để tham số truyền vào thay vì import cứng để Ngọc xóa được file kia.
export async function seedAllProductsAction(allProductsFromFile?: any[]) {
  const STORAGE_URL = "https://oytmbjoxetmbjsvlyiph.supabase.co/storage/v1/object/public/product-images/";

  try {
    if (!allProductsFromFile || allProductsFromFile.length === 0) {
      return { success: false, error: "Không có dữ liệu để đồng bộ." };
    }

    const formatPath = (path: string) => {
      if (!path || typeof path !== 'string') return '';
      return path
        .replace(/^\//, '') 
        .replace(/\.(jpg|jpeg|png)$/i, '.webp');
    };

    const processedProducts = allProductsFromFile.map((product: any) => {
      const numericId = parseInt(product.id);
      return { 
        ...product, 
        id: isNaN(numericId) ? product.id : numericId, 
        image: product.image ? (product.image.startsWith('http') ? product.image : `${STORAGE_URL}${formatPath(product.image)}`) : null,
        images: Array.isArray(product.images) 
          ? product.images.map((img: string) => img.startsWith('http') ? img : `${STORAGE_URL}${formatPath(img)}`)
          : [],
      };
    });

    const uniqueProducts = processedProducts.filter((p, i, self) =>
      i === self.findIndex((obj) => 
        String(obj.id) === String(p.id) || String(obj.slug) === String(p.slug)
      )
    );

    const { error: upsertError } = await supabase
      .from('products')
      .upsert(uniqueProducts, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (upsertError) throw upsertError;
    
    return { 
      success: true, 
      message: `Đã đồng bộ thành công ${uniqueProducts.length} sản phẩm lên Supabase!` 
    };

  } catch (error: any) {
    console.error("Lỗi đồng bộ:", error.message);
    return { success: false, error: error.message };
  }
}



// 'use server'

// import { supabase } from '@/lib/supabase'
// import { allProducts } from '@/data/products'

// // 1. LẤY SẢN PHẨM THEO DANH MỤC
// export async function getProductsByMultipleCategories(slugs: string[]) {
//   const { data, error } = await supabase
//     .from('products')
//     .select('*')
//     .in('category', slugs)
//     .order('id', { ascending: true }); // ID số tăng dần giúp quản lý dễ dàng

//   if (error) {
//     console.error('Lỗi lấy dữ liệu theo danh mục:', error);
//     return [];
//   }
//   return data || [];
// }

// // 2. LẤY TOÀN BỘ SẢN PHẨM
// export async function getAllProductsFromSupabase() {
//   const { data, error } = await supabase
//     .from('products')
//     .select('*')
//     .order('id', { ascending: true }); // Sắp xếp chuẩn số 1, 2, 3...

//   if (error) {
//     console.error('Lỗi lấy toàn bộ dữ liệu:', error);
//     return [];
//   }
//   return data || [];
// }

// // 3. HÀM ĐỒNG BỘ AN TOÀN (UPSERT)
// // Hàm này không xóa dữ liệu cũ, chỉ cập nhật hoặc thêm mới
// export async function seedAllProductsAction() {
//   const STORAGE_URL = "https://oytmbjoxetmbjsvlyiph.supabase.co/storage/v1/object/public/product-images/";

//   try {
//     if (!allProducts || allProducts.length === 0) {
//       return { success: false, error: "Dữ liệu file products.ts đang trống." };
//     }

//     const formatPath = (path: string) => {
//       if (!path || typeof path !== 'string') return '';
//       return path
//         .replace(/^\//, '') 
//         .replace(/\.(jpg|jpeg|png)$/i, '.webp');
//     };

//     const processedProducts = allProducts.map((product: any) => {
//       const numericId = parseInt(product.id);
//       return { 
//         ...product, 
//         id: isNaN(numericId) ? product.id : numericId, 
//         image: product.image ? `${STORAGE_URL}${formatPath(product.image)}` : null,
//         images: Array.isArray(product.images) 
//           ? product.images.map((img: string) => `${STORAGE_URL}${formatPath(img)}`)
//           : [],
//         realInstallImages: Array.isArray(product.realInstallImages)
//           ? product.realInstallImages.map((img: string) => `${STORAGE_URL}${formatPath(img)}`)
//           : []
//       };
//     });

//     // Lọc trùng sản phẩm trong file code trước khi đẩy lên
//     const uniqueProducts = processedProducts.filter((p, i, self) =>
//       i === self.findIndex((obj) => 
//         String(obj.id) === String(p.id) || String(obj.slug) === String(p.slug)
//       )
//     );

//     // --- PHẦN THAY ĐỔI QUAN TRỌNG NHẤT ĐỂ AN TOÀN ---
    
//     // BƯỚC 1: KHÔNG DÙNG .delete() nữa để tránh mất dữ liệu đã sửa trên Base.

//     // BƯỚC 2: Dùng .upsert()
//     // - Nếu ID đã tồn tại: Nó cập nhật thông tin mới nhất từ file code.
//     // - Nếu ID chưa có: Nó thêm mới vào.
//     // - Những sản phẩm bạn thêm tay trên Supabase mà không có trong file code sẽ KHÔNG bị mất.
//     const { error: upsertError } = await supabase
//       .from('products')
//       .upsert(uniqueProducts, { 
//         onConflict: 'id', // Dựa vào ID số để biết sản phẩm nào đã tồn tại
//         ignoreDuplicates: false // false có nghĩa là sẽ cập nhật nội dung mới nếu trùng ID
//       });

//     if (upsertError) throw upsertError;
    
//     return { 
//       success: true, 
//       message: `Đã đồng bộ an toàn ${uniqueProducts.length} sản phẩm. Những sửa đổi trực tiếp trên Base đã được bảo vệ!` 
//     };

//   } catch (error: any) {
//     console.error("Lỗi đồng bộ:", error.message);
//     return { success: false, error: error.message };
//   }
// }

