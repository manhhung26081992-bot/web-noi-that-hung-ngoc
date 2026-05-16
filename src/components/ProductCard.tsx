  "use client";

import Link from 'next/link';
import styles from '@/styles/Product.module.css';
import { Product } from '@/types/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  
  // 1. Hàm tối ưu ảnh qua Supabase (Né lỗi 402 của Vercel)
  const getOptimizedUrl = (url: any) => {
    const imageUrl = Array.isArray(url) ? url[0] : url;
    if (!imageUrl || imageUrl.includes('default-product') || imageUrl.includes('logo.png')) {
      return '/default-product.webp';
    }
    const separator = imageUrl.includes('?') ? '&' : '?';
    // Nén về 400px để trang chủ tải cực nhanh
    return `${imageUrl}${separator}width=400&quality=70`;
  };

  // 2. Định dạng giá tiền chuẩn Việt Nam
  const formatPrice = (price: string | number) => {
    if (!price || price === "0") return "Liên hệ báo giá";
    if (typeof price === "string" && isNaN(Number(price))) return price;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(price));
  };

  // 3. Logic thêm vào giỏ hàng
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Ghi nhận chuyển đổi Thêm vào giỏ hàng
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <Link 
        href={`/san-pham/${product.slug}`} 
        title={`Chi tiết sản phẩm ${product.name}`}
        className={styles.productLink}
        prefetch={false}
      >
        <div className={styles.imgBox} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
          {/* DÙNG THẺ IMG THUẦN ĐỂ NÉ LỖI 402 */}
          <img 
            src={getOptimizedUrl(product.image)}
            alt={`Nội thất Hùng Ngọc - ${product.name}`}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              display: 'block'
            }}
            loading="lazy"
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
    target.src = "https://oytmbjoxetmbjsvlyiph.supabase.co/storage/v1/object/public/product-images/logo.png";
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
        <span className={styles.cartIcon} aria-hidden="true">🛒</span> 
        THÊM VÀO GIỎ
      </button>
    </article>
  );
}
  
  