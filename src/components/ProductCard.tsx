  "use client";

import Link from 'next/link';
import styles from '@/styles/Product.module.css';
import { Product } from '@/types/types';
import { addTrailingSlash } from '@/lib/url';

interface ProductCardProps {
  product: Product;
  enableSchema?: boolean;
  priority?: boolean;
}

export default function ProductCard({ product, enableSchema = false, priority = false }: ProductCardProps) {
  
  // Tối ưu ảnh qua Supabase để giảm dung lượng và tránh vượt giới hạn Vercel.
  const getOptimizedUrl = (url: any) => {
    const imageUrl = Array.isArray(url) ? url[0] : url;
    if (!imageUrl || imageUrl.includes('default-product') || imageUrl.includes('logo.png')) {
      return '/default-product.webp';
    }
    const separator = imageUrl.includes('?') ? '&' : '?';
    // Ảnh card chỉ cần 400px để trang chủ và danh mục tải nhanh.
    return `${imageUrl}${separator}width=400&quality=70`;
  };

  // Định dạng giá tiền theo chuẩn Việt Nam.
  const formatPrice = (price: string | number) => {
    if (!price || price === "0") return "Liên hệ báo giá";
    if (typeof price === "string" && isNaN(Number(price))) return price;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(price));
  };

  // Thêm sản phẩm vào giỏ hàng và ghi nhận chuyển đổi nếu có Google Ads.
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Ghi nhận chuyển đổi khi khách bấm thêm vào giỏ hàng.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-18110246759/5w0kCNDuo6gcEOfe0btD',
      });
    }
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const productIndex = cart.findIndex((item: any) => item.slug === product.slug);


      if (productIndex > -1) {
        cart[productIndex].quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdate"));
    } catch (error) {
      console.error("Cart Error:", error);
    }
  };

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": `Mua ${product.name} chất lượng cao, giá rẻ tại Nội Thất Hùng Ngọc Hà Nội.`,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "VND",
      "price": typeof product.price === "number" ? product.price : "0",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <article className={styles.productCard}>
      {enableSchema && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      )}
      <Link 
        href={addTrailingSlash(`/san-pham/${product.slug}`)} 
        title={`Chi tiết sản phẩm ${product.name}`}
        className={styles.productLink}
      >
        <div className={styles.imgBox} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
          {/* DÙNG THẺ IMG THUẦN ĐỂ NÉ LỖI 402 */}
          <img 
            src={getOptimizedUrl(product.image)}
            alt={`Nội thất Hùng Ngọc - ${product.name}`}
              width={400}
  height={400}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              display: 'block'
            }}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onError={(e) => {
  const target = e.target as HTMLImageElement;
  
  // 1. Nếu dính bẫy lặp vô hạn (đã thử đổi sang logo mà vẫn lỗi), ngắt ngay lập tức
  if (target.dataset.error === "final") return;

  // 2. Nếu link nén lỗi, thử dùng link gốc không nén
  if (target.src.includes('width=')) {
    target.src = target.src.split('?')[0];
  } 
  // 3. Nếu ảnh gốc .webp lỗi, thử đổi sang .jpg
  else if (target.src.includes('.webp') && target.dataset.error !== "swapped") {
    target.dataset.error = "swapped"; // Đánh dấu đã thử đổi đuôi một lần
    target.src = target.src.replace('.webp', '.jpg');
  } 
  // 4. Nếu tất cả các phương án trên đều thất bại, đưa về ảnh logo hệ thống online chắc chắn sống
  else {
    target.dataset.error = "final"; // Đặt lính gác tối cao để ngắt vòng lặp
    target.src = "/logo.png";
  }
}}
            // onError={(e) => {
            //   const target = e.target as HTMLImageElement;
            //   // Nếu link nén lỗi, thử dùng link gốc không nén
            //   if (target.src.includes('width=')) {
            //     target.src = target.src.split('?')[0];
            //   } else if (target.src.includes('.webp')) {
            //     // Thử đổi sang .jpg nếu file gốc lỗi đuôi
            //     target.src = target.src.replace('.webp', '.jpg');
            //   } else {
            //     target.src = '/default-product.webp';
            //   }
            // }}
          />
        </div>
        
        <h3 className={styles.productName}>{product.name}</h3>
      </Link>
      
      <div className={styles.priceWrapper}>
        <p className={styles.price}>
          {formatPrice(product.price)}
        </p>
      </div>
      
      <button 
        className={styles.addToCartBtn} 
        onClick={handleAddToCart}
        aria-label={`Mua ngay ${product.name}`}
      >
        <span className={styles.cartIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M3.5 4.5h2.2l1.8 10.2a2 2 0 0 0 2 1.7h7.6a2 2 0 0 0 1.9-1.4l1.4-5.5H7" />
            <path d="M9.4 20.2h.1" />
            <path d="M17.2 20.2h.1" />
          </svg>
        </span> 
        THÊM VÀO GIỎ
      </button>
    </article>
  );
}
  
  



//   "use client";

// import Link from 'next/link';
// import styles from '@/styles/Product.module.css';
// import { Product } from '@/types/types';

// interface ProductCardProps {
//   product: Product;
// }

// export default function ProductCard({ product }: ProductCardProps) {
  
//   // 1. Hàm tối ưu ảnh qua Supabase (Né lỗi 402 của Vercel)
//   const getOptimizedUrl = (url: any) => {
//     const imageUrl = Array.isArray(url) ? url[0] : url;
//     if (!imageUrl || imageUrl.includes('default-product') || imageUrl.includes('logo.png')) {
//       return '/default-product.webp';
//     }
//     const separator = imageUrl.includes('?') ? '&' : '?';
//     // Nén về 400px để trang chủ tải cực nhanh
//     return `${imageUrl}${separator}width=400&quality=70`;
//   };

//   // 2. Định dạng giá tiền chuẩn Việt Nam
//   const formatPrice = (price: string | number) => {
//     if (!price || price === "0") return "Liên hệ báo giá";
//     if (typeof price === "string" && isNaN(Number(price))) return price;
//     return new Intl.NumberFormat('vi-VN', {
//       style: 'currency',
//       currency: 'VND',
//     }).format(Number(price));
//   };

//   // 3. Logic thêm vào giỏ hàng
//   const handleAddToCart = (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     // Ghi nhận chuyển đổi Thêm vào giỏ hàng
//     if (typeof window !== 'undefined' && (window as any).gtag) {
//       (window as any).gtag('event', 'conversion', {
//         'send_to': 'AW-18110246759/5w0kCNDuo6gcEOfe0btD',
//       });
//     }
//     try {
//       const cart = JSON.parse(localStorage.getItem('cart') || '[]');
//       const productIndex = cart.findIndex((item: any) => item.slug === product.slug);


//       if (productIndex > -1) {
//         cart[productIndex].quantity += 1;
//       } else {
//         cart.push({ ...product, quantity: 1 });
//       }
//       localStorage.setItem('cart', JSON.stringify(cart));
//       window.dispatchEvent(new Event("cartUpdate"));
//     } catch (error) {
//       console.error("Cart Error:", error);
//     }
//   };

//   const productSchema = {
//     "@context": "https://schema.org/",
//     "@type": "Product",
//     "name": product.name,
//     "image": product.image,
//     "description": `Mua ${product.name} chất lượng cao, giá rẻ tại Nội Thất Hùng Ngọc Hà Nội.`,
//     "offers": {
//       "@type": "Offer",
//       "priceCurrency": "VND",
//       "price": typeof product.price === "number" ? product.price : "0",
//       "availability": "https://schema.org/InStock"
//     }
//   };

//   return (
//     <article className={styles.productCard}>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
//       />

//       <Link 
//         href={addTrailingSlash(`/san-pham/${product.slug}`)} 
//         title={`Chi tiết sản phẩm ${product.name}`}
//         className={styles.productLink}
//         prefetch={false}
//       >
//         <div className={styles.imgBox} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
//           {/* DÙNG THẺ IMG THUẦN ĐỂ NÉ LỖI 402 */}
//           <img 
//             src={getOptimizedUrl(product.image)}
//             alt={`Nội thất Hùng Ngọc - ${product.name}`}
//               width={400}
//   height={400}
//             style={{ 
//               width: '100%', 
//               height: '100%', 
//               objectFit: 'contain',
//               display: 'block'
//             }}
//             loading="lazy"
//             decoding="async"
//             onError={(e) => {
//   const target = e.target as HTMLImageElement;
  
//   // 1. Nếu dính bẫy lặp vô hạn (đã thử đổi sang logo mà vẫn lỗi), ngắt ngay lập tức
//   if (target.dataset.error === "final") return;

//   // 2. Nếu link nén lỗi, thử dùng link gốc không nén
//   if (target.src.includes('width=')) {
//     target.src = target.src.split('?')[0];
//   } 
//   // 3. Nếu ảnh gốc .webp lỗi, thử đổi sang .jpg
//   else if (target.src.includes('.webp') && target.dataset.error !== "swapped") {
//     target.dataset.error = "swapped"; // Đánh dấu đã thử đổi đuôi một lần
//     target.src = target.src.replace('.webp', '.jpg');
//   } 
//   // 4. Nếu tất cả các phương án trên đều thất bại, đưa về ảnh logo hệ thống online chắc chắn sống
//   else {
//     target.dataset.error = "final"; // Đặt lính gác tối cao để ngắt vòng lặp
//     target.src = "/logo.png";
//   }
// }}
//             // onError={(e) => {
//             //   const target = e.target as HTMLImageElement;
//             //   // Nếu link nén lỗi, thử dùng link gốc không nén
//             //   if (target.src.includes('width=')) {
//             //     target.src = target.src.split('?')[0];
//             //   } else if (target.src.includes('.webp')) {
//             //     // Thử đổi sang .jpg nếu file gốc lỗi đuôi
//             //     target.src = target.src.replace('.webp', '.jpg');
//             //   } else {
//             //     target.src = '/default-product.webp';
//             //   }
//             // }}
//           />
//         </div>
        
//         <h3 className={styles.productName}>{product.name}</h3>
//       </Link>
      
//       <div className={styles.priceWrapper}>
//         <p className={styles.price}>
//           {formatPrice(product.price)}
//         </p>
//       </div>
      
//       <button 
//         className={styles.addToCartBtn} 
//         onClick={handleAddToCart}
//         aria-label={`Mua ngay ${product.name}`}
//       >
//         <span className={styles.cartIcon} aria-hidden="true">🛒</span> 
//         THÊM VÀO GIỎ
//       </button>
//     </article>
//   );
// }
  
  
