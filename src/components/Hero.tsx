 //banner
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "@/styles/Hero.module.css";

const SLIDES = [
  {
    img: "/banner.webp",
    title: "BÀN GHẾ VĂN PHÒNG GIÁ XƯỞNG",
    sub: "Giảm đến 30% - Giao nhanh trong ngày",
    cta: "MUA NGAY",
    link: "/ban-van-phong",
  },
  {
    img: "/banner2.webp",
    title: "SOFA CAO CẤP GIÁ RẺ",
    sub: "Bảo hành 1 năm - Lắp đặt miễn phí",
    cta: "XEM NGAY",
    link: "/sofa",
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearTimeout(t);
  }, [index]);

  const slide = SLIDES[index];

  return (
    <section className={styles.hero}>
      <Image
        src={slide.img}
        alt="banner nội thất"
        fill
        priority
        className={styles.img}
      />

      <div className={styles.overlay}></div>

   <div className={styles.content}>
  <div className={styles.box}>   {/* 🔥 thêm cái này */}
    <h2 className={styles.title}>{slide.title}</h2>
    <p className={styles.sub}>{slide.sub}</p>

    <div className={styles.actions}>
      <Link href={slide.link} className={styles.cta}>
        {slide.cta}
      </Link>

      <a href="tel:0347227377" className={styles.hotline}>
        📞 GỌI NGAY
      </a>
    </div>
  </div>
</div>
    </section>
  );
}


// "use client";
// import { useState, useEffect, useCallback } from 'react';
// import Link from 'next/link';
// import Image from 'next/image';
// import styles from '@/styles/Hero.module.css';

// const SLIDES = [
//   { 
//     id: 1, 
//     img: "/banner.webp", 
//     title: "Nội Thất Hùng Ngọc", 
//     subTitle: "Giá tại xưởng - Chất lượng hàng đầu",
//     cta: "KHÁM PHÁ NGAY",
//     link: "/#san-pham",
//     alt: "Nội thất văn phòng Hùng Ngọc - Bàn ghế hiện đại Hà Nội"
//   },
//   { 
//     id: 2, 
//     img: "/banner2.webp", 
//     title: "Bàn Giám Đốc", 
//     subTitle: "Khẳng định đẳng cấp người lãnh đạo",
//     cta: "XEM CHI TIẾT",
//     link: "/ban-van-phong",
//     alt: "Mẫu bàn giám đốc gỗ cao cấp sang trọng"
//   },
//   { 
//     id: 3, 
//     img: "/banner3.webp", 
//     title: "bàn ghế văn phòng", 
//     subTitle: "Thẩm mỹ & Sang trọng cho không gian sống",
//     cta: "MUA NGAY",
//     link: "/sofa",
//     alt: "Mẫu sofa hiện đại giá rẻ tại kho Hà Nội"
//   },
// ];

// export default function Hero() {
//   const [currentIndex, setCurrentIndex] = useState(0);

//   const nextSlide = useCallback(() => {
//     setCurrentIndex((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
//   }, []);

//   const prevSlide = () => {
//     setCurrentIndex((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
//   };

//   // Tự động chuyển Slide sau 5 giây (Rất quan trọng cho chuyển đổi khách hàng)
//   useEffect(() => {
//     const timer = setInterval(nextSlide, 5000);
//     return () => clearInterval(timer);
//   }, [nextSlide]);

//   return (
//     <section className={styles.hero} aria-label="Slider quảng bá nội thất">
//       {/* Nút mũi tên - Tăng diện tích bấm */}
//       <button 
//         className={`${styles.arrow} ${styles.leftArrow}`} 
//         onClick={prevSlide} 
//         aria-label="Slide trước"
//       >
//         &#10094;
//       </button>
//       <button 
//         className={`${styles.arrow} ${styles.rightArrow}`} 
//         onClick={nextSlide} 
//         aria-label="Slide tiếp theo"
//       >
//         &#10095;
//       </button>

//       <div className={styles.slideContainer}>
//         {SLIDES.map((slide, index) => (
//           <div 
//             key={slide.id} 
//             className={`${styles.slide} ${index === currentIndex ? styles.activeSlide : styles.hiddenSlide}`}
//           >
//             {/* SEO: Priority load cho LCP và Sizes chuẩn 100vw */}
//             <Image
//               src={slide.img}
//               alt={slide.alt}
//               fill
//               priority={index === 0}
//               quality={90}
//               style={{ objectFit: 'cover' }}
//               sizes="100vw"
//               className={styles.bannerImg}
//             />
            
//             <div className={styles.overlay} aria-hidden="true"></div>

//             <div className={styles.contentWrapper}>
//               <div className={styles.textContent}>
//                 <p className={styles.topText}>Cùng Hùng Ngọc</p>
//                 {/* Dùng h2 vì h1 đã được khai báo ở trang chủ để tối ưu SEO */}
//                 <h2 className={styles.mainTitle}>
//                   {slide.title} <br /> 
//                   <span className={styles.highlightText}>{slide.subTitle}</span>
//                 </h2>
//                 <Link 
//                   href={slide.link} 
//                   className={styles.ctaButton}
//                   title={`Xem thêm về ${slide.title}`}
//                 >
//                   {slide.cta}
//                 </Link>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Dots điều hướng */}
//       <div className={styles.dots}>
//         {SLIDES.map((_, index) => (
//           <button 
//             key={index} 
//             className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
//             onClick={() => setCurrentIndex(index)}
//             aria-label={`Chuyển đến slide ${index + 1}`}
//           ></button>
//         ))}
//       </div>
//     </section>
//   );
// }
