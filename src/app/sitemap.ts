import { MetadataRoute } from 'next';
import { MENU_ITEMS } from '@/components/Header/menuData';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://noithathungngoc.com';

  const home = {
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  };

  const categoryUrls: MetadataRoute.Sitemap = [];
  MENU_ITEMS.forEach((item) => {
    if (item.link && item.link !== '/') {
      categoryUrls.push({
        url: `${baseUrl}${item.link}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      });
    }
    if (item.submenu) {
      item.submenu.forEach((sub) => {
        categoryUrls.push({
          url: `${baseUrl}${sub.link}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        });
      });
    }
  });

  const policies = [
    '/chinh-sach/bao-hanh',
    '/chinh-sach/van-chuyen',
    '/chinh-sach/doi-tra',
    '/chinh-sach/bao-mat',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.3,
  }));

  return [home, ...categoryUrls, ...policies];
}


// import { MetadataRoute } from 'next';
// import { allProducts } from '@/data-m/products/index';
// import { MENU_ITEMS } from '@/components/Header/menuData';

// export default function sitemap(): MetadataRoute.Sitemap {
//   const baseUrl = 'https://noithathungngoc.com';

//   // 1. Trang chủ
//   const home = {
//     url: baseUrl,
//     lastModified: new Date(),
//     changeFrequency: 'daily' as const,
//     priority: 1,
//   };

//   // 2. Lấy tất cả các danh mục từ MENU_ITEMS (cấp 1 và cấp 2)
//   const categoryUrls: MetadataRoute.Sitemap = [];
//   MENU_ITEMS.forEach((item) => {
//     // Thêm menu chính (nếu không phải Trang chủ)
//     if (item.link !== '/') {
//       categoryUrls.push({
//         url: `${baseUrl}${item.link}`,
//         lastModified: new Date(),
//         changeFrequency: 'weekly' as const,
//         priority: 0.8,
//       });
//     }
//     // Thêm các menu con (Submenu)
//     if (item.submenu) {
//       item.submenu.forEach((sub) => {
//         categoryUrls.push({
//           url: `${baseUrl}${sub.link}`,
//           lastModified: new Date(),
//           changeFrequency: 'weekly' as const,
//           priority: 0.7,
//         });
//       });
//     }
//   });

//   // 3. Lấy tất cả sản phẩm chi tiết
//   const productUrls = allProducts.map((product) => ({
//     url: `${baseUrl}/san-pham/${product.slug}`,
//     lastModified: new Date(),
//     changeFrequency: 'monthly' as const,
//     priority: 0.6,
//   }));

//   // 4. Các trang chính sách
//   const policies = [
//     '/chinh-sach/bao-hanh',
//     '/chinh-sach/van-chuyen',
//     '/chinh-sach/doi-tra',
//     '/chinh-sach/bao-mat',
//   ].map((path) => ({
//     url: `${baseUrl}${path}`,
//     lastModified: new Date(),
//     changeFrequency: 'monthly' as const,
//     priority: 0.3,
//   }));

//   return [home, ...categoryUrls, ...productUrls, ...policies];
// }