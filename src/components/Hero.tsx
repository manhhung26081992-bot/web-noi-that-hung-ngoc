//banner

"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/Hero.module.css';

const SLIDES = [
  { 
    id: 1, 
    img: "/banner.webp", 
    title: "Nội Thất Hùng Ngọc", 
    subTitle: "Giá tại xưởng - Chất lượng hàng đầu",
    cta: "KHÁM PHÁ NGAY",
    link: "/#san-pham",
    alt: "Nội thất văn phòng Hùng Ngọc - Bàn ghế hiện đại Hà Nội"
  },
  { 
    id: 2, 
    img: "/banner2.webp", 
    title: "Bàn Giám Đốc", 
    subTitle: "Khẳng định đẳng cấp người lãnh đạo",
    cta: "XEM CHI TIẾT",
    link: "/ban-van-phong",
    alt: "Mẫu bàn giám đốc gỗ cao cấp sang trọng"
  },
  { 
    id: 3, 
    img: "/banner3.webp", 
    title: "bàn ghế văn phòng", 
    subTitle: "Thẩm mỹ & Sang trọng cho không gian sống",
    cta: "MUA NGAY",
    link: "/sofa",
    alt: "Mẫu sofa hiện đại giá rẻ tại kho Hà Nội"
  },
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  // Tự động chuyển Slide sau 5 giây (Rất quan trọng cho chuyển đổi khách hàng)
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section className={styles.hero} aria-label="Slider quảng bá nội thất">
      {/* Nút mũi tên - Tăng diện tích bấm */}
      <button 
        className={`${styles.arrow} ${styles.leftArrow}`} 
        onClick={prevSlide} 
        aria-label="Slide trước"
      >
        &#10094;
      </button>
      <button 
        className={`${styles.arrow} ${styles.rightArrow}`} 
        onClick={nextSlide} 
        aria-label="Slide tiếp theo"
      >
        &#10095;
      </button>

      <div className={styles.slideContainer}>
        {SLIDES.map((slide, index) => (
          <div 
            key={slide.id} 
            className={`${styles.slide} ${index === currentIndex ? styles.activeSlide : styles.hiddenSlide}`}
          >
            {/* SEO: Priority load cho LCP và Sizes chuẩn 100vw */}
            <Image
              src={slide.img}
              alt={slide.alt}
              fill
              priority={index === 0}
              quality={90}
              style={{ objectFit: 'cover' }}
              sizes="100vw"
              className={styles.bannerImg}
            />
            
            <div className={styles.overlay} aria-hidden="true"></div>

            <div className={styles.contentWrapper}>
              <div className={styles.textContent}>
                <p className={styles.topText}>Cùng Hùng Ngọc</p>
                {/* Dùng h2 vì h1 đã được khai báo ở trang chủ để tối ưu SEO */}
                <h2 className={styles.mainTitle}>
                  {slide.title} <br /> 
                  <span className={styles.highlightText}>{slide.subTitle}</span>
                </h2>
                <Link 
                  href={slide.link} 
                  className={styles.ctaButton}
                  title={`Xem thêm về ${slide.title}`}
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots điều hướng */}
      <div className={styles.dots}>
        {SLIDES.map((_, index) => (
          <button 
            key={index} 
            className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Chuyển đến slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </section>
  );
}



// "use client";
// import { useState } from 'react';
// import Link from 'next/link';
// import Image from 'next/image'; // Quan trọng nhất cho SEO
// import styles from '@/styles/Hero.module.css';

// const slides = [
//   { 
//     id: 1, 
//     img: "/banner.webp", 
//     title: "Chọn khác biệt", 
//     subTitle: "đậm chất riêng",
//     cta: "TRẢI NGHIỆM NGAY",
//     link: "/san-pham",
//     alt: "Bàn ghế văn phòng hiện đại Nội Thất Hùng Ngọc" // Thêm alt cụ thể
//   },
//   { 
//     id: 2, 
//     img: "/banner2.webp", 
//     title: "Bàn Giám Đốc", 
//     subTitle: "Khẳng định đẳng cấp",
//     cta: "XEM CHI TIẾT",
//     link: "/ban-giam-doc",
//     alt: "Mẫu bàn giám đốc gỗ cao cấp sang trọng"
//   },
//   { 
//     id: 3, 
//     img: "/banner3.webp", 
//     title: "Bàn làm việc", 
//     subTitle: "Thẩm mỹ & Sang trọng",
//     cta: "MUA NGAY",
//     link: "/ban",
//     alt: "Nội thất bàn làm việc văn phòng giá rẻ Hà Nội"
//   },
// ];

// export default function Hero() {
//   const [currentIndex, setCurrentIndex] = useState(0);

//   const nextSlide = () => {
//     setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
//   };

//   const prevSlide = () => {
//     setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
//   };

//   return (
//     <section className={styles.hero}>
//       {/* Nút mũi tên */}
//       <button className={`${styles.arrow} ${styles.leftArrow}`} onClick={prevSlide} aria-label="Slide trước">
//         &#10094;
//       </button>
//       <button className={`${styles.arrow} ${styles.rightArrow}`} onClick={nextSlide} aria-label="Slide tiếp theo">
//         &#10095;
//       </button>

//       <div className={styles.slideContainer}>
//         {slides.map((slide, index) => (
//           <div 
//             key={slide.id} 
//             className={`${styles.slide} ${index === currentIndex ? styles.activeSlide : styles.hiddenSlide}`}
//           >
//             {/* SEO TRICK: Dùng Next/Image thay cho Background Image */}
//             <Image
//               src={slide.img}
//               alt={slide.alt}
//               fill
//               priority={index === 0} // Ưu tiên load ảnh đầu tiên ngay lập tức (Tăng điểm LCP)
//               quality={85} // Nén ảnh xuống 85% để web nhanh nhưng vẫn nét
//               style={{ objectFit: 'cover' }}
//               sizes="100vw"
//             />
            
//             <div className={styles.overlay}></div>

//             <div className={styles.contentWrapper}>
//               <div className={styles.textContent}>
//                 {/* Dùng span hoặc p cho text nhỏ, dành H1/H2 cho từ khóa chính */}
//                 <p className={styles.topText}>“ Thế Giới Nội Thất</p>
//                 <h1 className={styles.mainTitle}>
//                   {slide.title} <br /> 
//                   <span>{slide.subTitle}</span>
//                 </h1>
//                 <Link href={slide.link} className={styles.ctaButton}>
//                   {slide.cta}
//                 </Link>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className={styles.dots}>
//         {slides.map((_, index) => (
//           <span 
//             key={index} 
//             className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
//             onClick={() => setCurrentIndex(index)}
//           ></span>
//         ))}
//       </div>
//     </section>
//   );
// }