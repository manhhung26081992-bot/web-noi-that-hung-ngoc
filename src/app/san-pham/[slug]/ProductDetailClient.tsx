"use client";

import { useState, use, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import styles from '@/styles/ProductDetail.module.css';
import { Product, CartItem } from '@/types/types';

export default function ProductDetailClient({ params, allProducts, allCategories }: any) {
  const { slug } = use(params) as { slug: string };
  
  const products = (allProducts as any) as Product[];
  const categories = (allCategories as any) as any[];

  const product = useMemo(() => products.find((p) => p.slug === slug), [slug, products]);
  const isCategory = useMemo(() => categories.some((c) => c.slug === slug), [slug, categories]);
  const categoryProducts = useMemo(() => products.filter((p) => p.category === slug), [slug, products]);

  // --- LOGIC ZOOM & SLIDER ---
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setMousePosition({ x, y });
  };

  const getOptimizedUrl = (url: string) => {
  if (!url || url.startsWith('/') || url.includes('logo.png')) return url;
  
  try {
    const separator = url.includes('?') ? '&' : '?';
    // Thêm các tham số nén của Supabase
    return `${url}${separator}width=800&quality=75`;
  } catch (e) {
    return url;
  }
};
  const allImages = useMemo(() => {
  // Ưu tiên mảng images, sau đó đến image đơn lẻ
  const images = product?.images?.length ? product.images : 
                 Array.isArray(product?.image) ? product.image : 
                 typeof product?.image === 'string' && product.image !== "" ? [product.image] : 
                 ['/logo.png']; // Dùng logo làm ảnh mặc định thay vì default-product.png
  return images;
}, [product]);

  useEffect(() => {
    setActiveImgIndex(0);
    setQuantity(1);
  }, [slug]);

  // --- GIỎ HÀNG ---
  const handleAddToCart = () => {
    if (!product) return;
    const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex((item) => item.id === product.id);
    const numericPrice = typeof product.price === 'number' 
      ? product.price : parseInt(String(product.price).replace(/\D/g, '') || "0");

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        id: product.id, name: product.name, price: numericPrice,
        image: allImages[0], quantity: quantity, slug: product.slug
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdate"));
    alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
  };

  if (isCategory) {
    const currentCat = categories.find(c => c.slug === slug);
    return (
      <main className={styles.container}>
        <h1 className={styles.categoryTitle}>{currentCat?.title}</h1>
        <div className={styles.productGrid}>
          {categoryProducts.map((p) => <ProductCard key={p.id} product={p as any} />)}
        </div>
      </main>
    );
  }

  if (!product) return null;

  const parentCategory = categories.find(c => c.slug === product.category);
  const relatedProducts = products.filter(p => p.category === product.category && p.slug !== slug).slice(0, 8);

  return (
    <main className={styles.container}>
      {/* 1. Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <ul>
          <li><Link href="/">Trang chủ</Link></li>
          <li className={styles.separator}>/</li>
          <li><Link href={`/san-pham/${product.category}`}>{parentCategory?.title || "Sản phẩm"}</Link></li>
          <li className={styles.separator}>/</li>
          <li><strong>{product.name}</strong></li>
        </ul>
      </nav>

      <div className={styles.productTopWrapper}>
        {/* 2. Ảnh & Zoom */}
        <div className={styles.imageSection}>
          <div className={styles.mainImageWrapper}>
            <div 
              className={styles.zoomMagnifyContainer}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
            >
             <img 
  src={getOptimizedUrl(allImages[activeImgIndex] || '/logo.png')} 
  alt={product.name}
  className={styles.actualImage}
  style={{ 
    width: '100%', 
    height: 'auto', 
    aspectRatio: '1/1', 
    objectFit: 'contain' 
  }}
  onError={(e) => {
    const target = e.target as HTMLImageElement;
    
    // Nếu nén bị lỗi (402/404), quay về dùng ảnh gốc không nén
    if (target.src.includes('width=')) {
      target.src = target.src.split('?')[0];
      return;
    }

    // Nếu ảnh gốc vẫn lỗi, thử đổi đuôi file (xử lý vụ terminal đổi tên)
    if (target.src.includes('.webp')) {
      target.src = target.src.replace('.webp', '.jpg');
    } else if (target.src.includes('.jpg')) {
      target.src = target.src.replace('.jpg', '.png');
    } else {
      // Cuối cùng mới hiện logo dự phòng
      target.src = '/logo.png';
    }
  }}
/>
              {isZooming && (
                <div 
                  className={styles.magnifiedImage}
                  style={{ 
                    backgroundImage: `url(${allImages[activeImgIndex]})`, 
                    backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%` 
                  }}
                />
              )}
            </div>
          </div>
          {allImages.length > 1 && (
            <div className={styles.thumbnailList}>
              {allImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`${styles.thumbItem} ${idx === activeImgIndex ? styles.thumbActive : ''}`} 
                  onClick={() => setActiveImgIndex(idx)}
                >
                  <Image src={img ||'/logo.png'} alt={`${product.name} thumbnail ${idx + 1}`} width={80} height={80} loading="lazy"/>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Thông tin chính */}
        <div className={styles.infoSection}>
          <h1 className={styles.title}>{product.name}</h1>
          <div className={styles.priceRow}>
            {product.price && Number(String(product.price).replace(/\D/g, '')) > 0 ? (
              <p className={styles.priceValue}>{Number(String(product.price).replace(/\D/g, '')).toLocaleString('vi-VN')}₫</p>
            ) : (
              <a href="tel:0347227377" className={styles.contactPrice}>Giá liên hệ: 0777.353.192</a>
            )}
          </div>
          
          <ul className={styles.shortSpecs}>
  <li>
    <strong><span>Chất liệu</span><span>:</span></strong>
    <div>{product.specs?.material || "Đang Cập Nhật"}</div>
  </li>
  <li>
    <strong><span>Kích thước</span><span>:</span></strong>
    <div>{product.specs?.size || "Liên hệ"}</div>
  </li>
  <li>
    <strong><span>Bảo hành</span><span>:</span></strong>
    <div>{product.specs?.warranty || "6 tháng"}</div>
  </li>
  <li>
    <strong><span>Tình trạng</span><span>:</span></strong>
    <div>Còn hàng</div>
  </li>
</ul>

          <div className={styles.actionBox}>
            <div className={styles.quantityWrapper}>
              <button onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)}>-</button>
             <input
              type="number"
              className={styles.quantityInput}
              value={Number(quantity)}
              onChange={() => {}}
              readOnly
              {...({} as any)} 
            />
              <button onClick={() => setQuantity(q => q + 1)}>+</button>
            </div>
            <button className={styles.addToCartBtn} onClick={handleAddToCart}>THÊM VÀO GIỎ HÀNG</button>
          </div>
          <p className={styles.catInfo}>Danh mục: <span>{parentCategory?.title}</span></p>
        </div>

        <aside className={styles.trustSidebar}>
          <div className={styles.trustHeader}>NỘI THẤT Hùng Ngoc</div>
          <div className={styles.trustItem}>✅ Miễn Phí Giao Hàng Bán Kính 3km</div>
          <div className={styles.trustItem}>✅ Sản phẩm chuẩn hình 100%</div>
          <div className={styles.trustItem}>✅ Giá xưởng cạnh tranh nhất</div>
          <div className={styles.trustItem}>✅ Bảo hành bảo trì tận tâm</div>
        </aside>
      </div>

      {/* 4. TABS CHI TIẾT SẢN PHẨM */}
      <section className={styles.detailDescription}>
        <div className={styles.tabs}>
          <button className={styles.activeTab}>MÔ TẢ SẢN PHẨM</button>
        </div>
        
        <div className={styles.contentBody}>
          <article className={styles.article}>
            <h2 className={styles.descTitle}>
              <span className={styles.orangeBar}>|</span> Chi tiết sản phẩm {product.name}
            </h2>
            
            <div 
              className={styles.descriptionText} 
              dangerouslySetInnerHTML={{ 
                __html: product.detailDescription || product.description || "Thông tin sản phẩm đang được cập nhật." 
              }}
            />

            {/* PHẦN ẢNH THỰC TẾ: Tối ưu chuyên nghiệp */}
            <div className={styles.realInstallSection}>
              <h3 className={styles.realInstallTitle}>
                📸 Hình ảnh lắp đặt thực tế cho khách hàng
              </h3>
              
              {/* Nếu có mảng ảnh thực tế riêng (realInstallImages), ta ưu tiên dùng nó */}
              <div className={styles.realImageGrid}>
                {(product as any).realInstallImages && (product as any).realInstallImages.length > 0 ? (
                  (product as any).realInstallImages.map((img: string, index: number) => (
                    <div key={index} className={styles.realImageCard}>
                      <img 
                        src={img} 
                        alt={`Ảnh thực tế ${product.name}`} 
                        width={600} height={450} 
                        className={styles.realImage} 
                        loading="lazy"
                      />
                      <div className={styles.imageBadge}>Ảnh thực tế</div>
                    </div>
                  ))
                ) : (
                  /* Nếu không có, dùng tạm ảnh đầu tiên nhưng hiển thị theo style thực tế */
                  <div className={styles.realImageCard}>
                    <img
                      src={allImages[0]} 
                      alt={`Hình ảnh thực tế ${product.name}`} 
                      width={800} height={600} 
                      className={styles.realImage} 
                      loading="lazy"
                    />
                    <div className={styles.imageBadge}>Hùng Ngoc Furniture</div>
                  </div>
                )}
              </div>
              <p className={styles.articleImageCaption}>Sản phẩm được thi công và bàn giao hoàn thiện bởi đội ngũ Nội Thất Hùng Ngoc</p>
            </div>

            <div className={styles.specsTableWrapper}>
              <h3 className={styles.subTitle}>Thông số kỹ thuật chi tiết:</h3>
              <table className={styles.specsTable}>
                <tbody>
                  <tr>
                    <td><strong>Chất liệu : </strong></td>
                    <td>{product.specs?.material || "Gỗ MDF phủ Melamine cao cấp"}</td>
                  </tr>
                  <tr>
                    <td><strong>Kích thước :</strong></td>
                    <td>{product.specs?.size || "Theo yêu cầu khách hàng"}</td>
                  </tr>
                  <tr>
                    <td><strong>Bảo hành :</strong></td>
                    <td>{product.specs?.warranty || "12 tháng"}</td>
                  </tr>
                  <tr>
                    <td><strong>Màu sắc : </strong></td>
                    <td>{product.specs?.color || "Vân gỗ / Trắng / Theo mẫu"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {product.features && product.features.length > 0 && (
              <div className={styles.featuresSection}>
                <h3 className={styles.featuresTitle}>Đặc điểm nổi bật:</h3>
                <ul className={styles.featuresList}>
                  {product.features.map((f, i) => (
                   <li key={i}>
  <span className={styles.checkIcon}>✅</span> 
  <span dangerouslySetInnerHTML={{ __html: f }} />
</li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        </div>
      </section>

      <section className={styles.relatedSection}>
        <h2 className={styles.relatedTitle}>SẢN PHẨM CÙNG DANH MỤC</h2>
        <div className={styles.productGrid}>
          {relatedProducts.map((p) => <ProductCard key={p.id} product={p as any} />)}
        </div>
      </section>
    </main>
  );
}



// "use client";

// import { useState, use, useMemo, useEffect } from 'react';
// import Image from 'next/image';
// import Link from 'next/link';
// import ProductCard from '@/components/ProductCard';
// import styles from '@/styles/ProductDetail.module.css';
// import { Product, CartItem } from '@/data/products/types';

// export default function ProductDetailClient({ params, allProducts, allCategories }: any) {
//   const { slug } = use(params) as { slug: string };
  
//   const products = (allProducts as any) as Product[];
//   const categories = (allCategories as any) as any[];

//   const product = useMemo(() => products.find((p) => p.slug === slug), [slug, products]);
//   const isCategory = useMemo(() => categories.some((c) => c.slug === slug), [slug, categories]);
//   const categoryProducts = useMemo(() => products.filter((p) => p.category === slug), [slug, products]);

//   // --- LOGIC ZOOM & SLIDER ---
//   const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
//   const [isZooming, setIsZooming] = useState(false);
//   const [activeImgIndex, setActiveImgIndex] = useState(0);
//   const [quantity, setQuantity] = useState(1);

//   const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
//     const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
//     const x = ((e.pageX - left - window.scrollX) / width) * 100;
//     const y = ((e.pageY - top - window.scrollY) / height) * 100;
//     setMousePosition({ x, y });
//   };

//   const allImages = useMemo(() => {
//     if (product?.images?.length) return product.images;
//     if (Array.isArray(product?.image)) return product.image;
//     if (typeof product?.image === 'string') return [product.image];
//     return ['/default-product.png'];
//   }, [product]);

//   useEffect(() => {
//     setActiveImgIndex(0);
//     setQuantity(1);
//   }, [slug]);

//   // --- GIỎ HÀNG ---
//   const handleAddToCart = () => {
//     if (!product) return;
//     const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
//     const existingIndex = cart.findIndex((item) => item.id === product.id);
//     const numericPrice = typeof product.price === 'number' 
//       ? product.price : parseInt(String(product.price).replace(/\D/g, '') || "0");

//     if (existingIndex > -1) {
//       cart[existingIndex].quantity += quantity;
//     } else {
//       cart.push({
//         id: product.id, name: product.name, price: numericPrice,
//         image: allImages[0], quantity: quantity, slug: product.slug
//       });
//     }
//     localStorage.setItem('cart', JSON.stringify(cart));
//     window.dispatchEvent(new Event("cartUpdate"));
//     alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
//   };

//   if (isCategory) {
//     const currentCat = categories.find(c => c.slug === slug);
//     return (
//       <main className={styles.container}>
//         <h1 className={styles.categoryTitle}>{currentCat?.title}</h1>
//         <div className={styles.productGrid}>
//           {categoryProducts.map((p) => <ProductCard key={p.id} product={p as any} />)}
//         </div>
//       </main>
//     );
//   }

//   if (!product) return null;

//   const parentCategory = categories.find(c => c.slug === product.category);
//   const relatedProducts = products.filter(p => p.category === product.category && p.slug !== slug).slice(0, 8);

//   return (
//     <main className={styles.container}>
//       {/* 1. Breadcrumb */}
//       <nav className={styles.breadcrumb}>
//         <ul>
//           <li><Link href="/">Trang chủ</Link></li>
//           <li className={styles.separator}>/</li>
//           <li><Link href={`/san-pham/${product.category}`}>{parentCategory?.title || "Sản phẩm"}</Link></li>
//           <li className={styles.separator}>/</li>
//           <li><strong>{product.name}</strong></li>
//         </ul>
//       </nav>

//       <div className={styles.productTopWrapper}>
//         {/* 2. Ảnh & Zoom */}
//         <div className={styles.imageSection}>
//           <div className={styles.mainImageWrapper}>
//             <div 
//               className={styles.zoomMagnifyContainer}
//               onMouseMove={handleMouseMove}
//               onMouseEnter={() => setIsZooming(true)}
//               onMouseLeave={() => setIsZooming(false)}
//             >
//               <Image 
//                 src={allImages[activeImgIndex]} 
//                 alt={product.name} 
//                 width={700} height={700} 
//                 priority 
//                 className={styles.actualImage} 
//               />
//               {isZooming && (
//                 <div 
//                   className={styles.magnifiedImage}
//                   style={{ 
//                     backgroundImage: `url(${allImages[activeImgIndex]})`, 
//                     backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%` 
//                   }}
//                 />
//               )}
//             </div>
//           </div>
//           {allImages.length > 1 && (
//             <div className={styles.thumbnailList}>
//               {allImages.map((img, idx) => (
//                 <div 
//                   key={idx} 
//                   className={`${styles.thumbItem} ${idx === activeImgIndex ? styles.thumbActive : ''}`} 
//                   onClick={() => setActiveImgIndex(idx)}
//                 >
//                   <Image src={img} alt="thumb" width={80} height={80} />
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* 3. Thông tin chính */}
//         <div className={styles.infoSection}>
//           <h1 className={styles.title}>{product.name}</h1>
//           <div className={styles.priceRow}>
//             {product.price && Number(String(product.price).replace(/\D/g, '')) > 0 ? (
//               <p className={styles.priceValue}>{Number(String(product.price).replace(/\D/g, '')).toLocaleString('vi-VN')}₫</p>
//             ) : (
//               <a href="tel:0347227377" className={styles.contactPrice}>Giá liên hệ: 0777.353.192</a>
//             )}
//           </div>
          
//           <ul className={styles.shortSpecs}>
//             <li>• <strong>Chất liệu:</strong> {product.specs?.material || "Đang Cập Nhật"}</li>
//             <li>• <strong>Kích thước:</strong> {product.specs?.size || "Liên hệ"}</li>
//             <li>• <strong>Bảo hành:</strong> {product.specs?.warranty || "12 tháng"}</li>
//             <li>• <strong>Tình trạng:</strong> Còn hàng</li>
//           </ul>

//           <div className={styles.actionBox}>
//             <div className={styles.quantityWrapper}>
//               <button onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)}>-</button>
//               <input type="number" value={quantity} readOnly />
//               <button onClick={() => setQuantity(q => q + 1)}>+</button>
//             </div>
//             <button className={styles.addToCartBtn} onClick={handleAddToCart}>THÊM VÀO GIỎ HÀNG</button>
//           </div>
//           <p className={styles.catInfo}>Danh mục: <span>{parentCategory?.title}</span></p>
//         </div>

//         <aside className={styles.trustSidebar}>
//           <div className={styles.trustHeader}>NỘI THẤT Hùng Ngoc</div>
//           <div className={styles.trustItem}>✅ Miễn Phí Giao Hàng Bán Kính 3km</div>
//           <div className={styles.trustItem}>✅ Sản phẩm chuẩn hình 100%</div>
//           <div className={styles.trustItem}>✅ Giá xưởng cạnh tranh nhất</div>
//           <div className={styles.trustItem}>✅ Bảo hành bảo trì tận tâm</div>
//         </aside>
//       </div>

//       {/* 4. TABS CHI TIẾT SẢN PHẨM */}
//       <section className={styles.detailDescription}>
//         <div className={styles.tabs}>
//           <button className={styles.activeTab}>MÔ TẢ SẢN PHẨM</button>
//         </div>
        
//         <div className={styles.contentBody}>
//           <article className={styles.article}>
//             <h2 className={styles.descTitle}>
//               <span className={styles.orangeBar}>|</span> Chi tiết sản phẩm {product.name}
//             </h2>
            
//             {/* FIX: Render HTML từ detailDescription */}
//             <div 
//               className={styles.descriptionText} 
//               dangerouslySetInnerHTML={{ 
//                 __html: product.detailDescription || product.description || "Thông tin sản phẩm đang được cập nhật." 
//               }}
//             />

//             <div className={styles.articleImageContainer}>
//               <Image 
//                 src={allImages[0]} 
//                 alt={`Hình ảnh thực tế ${product.name}`} 
//                 width={800} height={600} 
//                 className={styles.articleImage} 
//               />
//               <p className={styles.articleImageCaption}>Hình ảnh lắp đặt thực tế cho khách hàng của Nội Thất Hùng Ngoc</p>
//             </div>

//             <div className={styles.specsTableWrapper}>
//               <h3 className={styles.subTitle}>Thông số kỹ thuật chi tiết:</h3>
//               <table className={styles.specsTable}>
//                 <tbody>
//                   <tr>
//                     <td><strong>Chất liệu</strong></td>
//                     <td>{product.specs?.material || "Gỗ MDF phủ Melamine cao cấp"}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Kích thước</strong></td>
//                     <td>{product.specs?.size || "Theo yêu cầu khách hàng"}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Bảo hành</strong></td>
//                     <td>{product.specs?.warranty || "12 tháng"}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Màu sắc</strong></td>
//                     <td>{product.specs?.color || "Vân gỗ / Trắng / Theo mẫu"}</td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>

//             {product.features && product.features.length > 0 && (
//               <div className={styles.featuresSection}>
//                 <h3 className={styles.featuresTitle}>Đặc điểm nổi bật:</h3>
//                 <ul className={styles.featuresList}>
//                   {product.features.map((f, i) => (
//                     <li key={i}><span className={styles.checkIcon}>✅</span> {f}</li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </article>
//         </div>
//       </section>

//       {/* 5. Sản phẩm liên quan */}
//       <section className={styles.relatedSection}>
//         <h2 className={styles.relatedTitle}>SẢN PHẨM CÙNG DANH MỤC</h2>
//         <div className={styles.productGrid}>
//           {relatedProducts.map((p) => <ProductCard key={p.id} product={p as any} />)}
//         </div>
//       </section>
//     </main>
//   );
// }