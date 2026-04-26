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

