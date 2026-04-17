  "use client";

  import Image from 'next/image';
  import Link from 'next/link';
  import styles from '@/styles/Product.module.css'; // Đảm bảo bạn cập nhật file CSS này
  import { Product } from '@/types/types';

  interface ProductCardProps {
    product: Product;
  }

  export default function ProductCard({ product }: ProductCardProps) {
    
    // 1. Định dạng giá tiền chuẩn Việt Nam
    const formatPrice = (price: string | number) => {
      if (!price || price === "0") return "Liên hệ báo giá";
      if (typeof price === "string" && isNaN(Number(price))) return price;
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(Number(price));
    };

    // 2. Logic thêm vào giỏ hàng (Clean & Safe)
    const handleAddToCart = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

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

    // 3. Dữ liệu cấu trúc Schema cho từng sản phẩm (SEO 0 đồng)
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
        {/* Chèn JSON-LD để Google hiển thị Rich Snippets (Giá, Ảnh) trên tìm kiếm */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />

        <Link 
          href={`/san-pham/${product.slug}`} 
          title={`Chi tiết sản phẩm ${product.name}`}
          className={styles.productLink}
        >
          <div className={styles.imgBox}>
            <Image 
              src={String(product.image || '/default-product.webp')}
              alt={`Nội thất Hùng Ngọc - ${product.name}`}
              fill
              sizes="(max-width: 600px) 45vw, (max-width: 1200px) 25vw, 250px"
              className={styles.productImg}
              loading="lazy"
              quality={85} // Tối ưu dung lượng ảnh mà vẫn nét
            />
            
            {/* LỚP WATERMARK (Đè lên ảnh - Góc phải dưới) */}
            {/* pointer-events-none để khách không bấm nhầm vào watermark */}
           
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


