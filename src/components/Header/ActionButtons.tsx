// (Hotline & Giỏ hàng)
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './styles/actionButtons.module.css';

export default function ActionButtons() {
  const [count, setCount] = useState(0);

  // Hàm tính tổng số lượng (Xử lý đồng bộ dữ liệu)
  const updateCartCount = () => {
    if (typeof window !== 'undefined') {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      // Tính tổng quantity để hiện số chuẩn như ảnh mẫu
      const total = cart.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
      setCount(total);
    }
  };

  useEffect(() => {
    updateCartCount();
    // Lắng nghe sự kiện để nhảy số ngay lập tức khi nhấn "Thêm vào giỏ"
    window.addEventListener("cartUpdate", updateCartCount);
    // Lắng nghe thay đổi từ các tab khác
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdate", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  return (
    <div className={styles.contactInfo}>
      {/* Hotline chuẩn SEO: Giúp khách gọi ngay trên Mobile */}
      <a href="tel:0347227377" className={styles.hotline} title="Gọi tư vấn Nội Thất Hùng Ngọc">
        <span className={styles.iconPulse}>📞</span> 
        <span className={styles.phoneNum}>0777353192</span>  
      </a>
      
      {/* Link giỏ hàng: Giữ nguyên class của bạn và thêm badge đỏ */}
      <Link href="/gio-hang" className={styles.cartBtn} title="Giỏ hàng của bạn">
        <div className={styles.cartWrapper}>
          <span className={styles.cartIcon}>
            <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth="1.5" 
    stroke="currentColor" 
    width="24" 
    height="24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.11 11.222A2.25 2.25 0 0 1 18.477 22.5H5.523a2.25 2.25 0 0 1-2.244-2.771l1.11-11.222A2.25 2.25 0 0 1 5.523 7.5h12.954a2.25 2.25 0 0 1 2.244 2.007Z" />
  </svg>
          </span>
          {count > 0 && (
            <span className={styles.cartCount}>{count}</span>
          )}
        </div>
      </Link>
    </div>
  );
}