"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/Footer.module.css';

export default function Footer() {
  const [isChatOpen, setIsChatOpen] = useState(false);
const footerData = [
  {
    title: "Chính Sách Chung",
    links: [
      { name: "Thanh toán & Vận chuyển", url: "/chinh-sach/van-chuyen" },
      { name: "Chính sách bảo hành", url: "/chinh-sach/bao-hanh" },
      { name: "Chính sách đổi trả", url: "/chinh-sach/doi-tra" },
      { name: "Bảo mật thông tin", url: "/chinh-sach/bao-mat" }
    ]
  },
  {
    title: "Bàn Văn Phòng",
    links: [
      { name: "Bàn chân sắt giá rẻ", url: "/ban-chan-sat" },
      { name: "Bàn giám đốc hiện đại", url: "/ban-giam-doc" },
      { name: "Bàn họp văn phòng", url: "/ban-lam-viec" },
      { name: "Bàn làm việc tại nhà", url: "/ban-lam-viec" }
    ]
  },
  {
    title: "Ghế Văn Phòng",
    links: [
      { name: "Ghế xoay nhân viên", url: "/ghe-xoay" },
      { name: "Ghế chân quỳ phòng họp", url: "/ghe-chan-quy" },
      { name: "Ghế giám đốc cao cấp", url: "/ghe-giam-doc" },
      { name: "Ghế gấp gọn tiện dụng", url: "/ghe-gap" }
    ]
  },
  {
    title: "Bàn Ăn & Gia Đình",
    links: [
      { name: "Bàn ăn mặt đá sang trọng", url: "/ban-an-mat-da" },
      { name: "Bộ bàn ăn 6 ghế", url: "/bo-ban-an-6-ghe" },
      { name: "Giường sắt 2 tầng", url: "/giuong-tang-sat" },
      { name: "Tủ quần áo gỗ/sắt", url: " /tu-quan-ao" }
    ]
  }
];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {footerData.map((col, index) => (
          <div key={index} className={styles.column}>
            <h4 className={styles.columnTitle}>{col.title}</h4>
            <ul className={styles.linkList}>
              {col.links.map((item, i) => (
                <li key={i}>
                  <Link href={item.url} title={item.name}>
                    <span className={styles.arrow} aria-hidden="true">➔</span>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.infoWrapper}>
          <div className={styles.addressBox}>
            <p><strong>Địa chỉ:</strong> Số 211 Đường Nguyễn Văn Giáp, P. Cầu Diễn, Q. Nam Từ Liêm, Hà Nội</p>
          </div>
          <div className={styles.copyrightBox}>
            <p>Hotline: <a href="tel:0347227377">0974 336 571</a> | <strong>© 2026 Nội Thất Hùng Ngọc</strong></p>
          </div>
        </div>
      </div>

      {/* KHUNG CHAT TỰ ĐỘNG */}
       <div className={`${styles.chatWrapper} ${isChatOpen ? styles.showChat : ''}`}>
        <div className={styles.chatHeader}>
  <span>Hỗ trợ Hùng Ngọc</span>
  <button 
    onClick={() => setIsChatOpen(false)} 
    aria-label="Đóng chat"
    type="button" 
  >
    <span aria-hidden="true">×</span>
  </button>
</div>
      
        <div className={styles.chatBody}>
          <p>Chào bạn! Hùng Ngọc có thể giúp gì cho bạn về nội thất giá xưởng ạ?</p>
          <div className={styles.autoReplies}>
            <button onClick={() => window.location.href='tel:0347227377'}>📞 Gọi Hotline báo giá</button>
            <button onClick={() => window.open('https://zalo.me/0347227377')}>✉️ Nhắn Zalo tư vấn</button>
            <Link href="/search?q=ban-van-phong" className={styles.chatLink} onClick={() => setIsChatOpen(false)}>🏢 Xem mẫu bàn mới nhất</Link>
          </div>
        </div>
      </div> 

      {/* HỆ THỐNG NÚT LIÊN HỆ NỔI (Sticky Actions) */}
      <div className={styles.fixedContact}>
        <button 
          className={`${styles.contactBtn} ${styles.chatbot}`} 
          onClick={() => setIsChatOpen(!isChatOpen)}
          aria-label="Mở chat hỗ trợ"
        >
          💬
        </button>

        <a 
          href="https://zalo.me/0347227377" 
          className={`${styles.contactBtn} ${styles.zaloBtn}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Nhắn Zalo"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" alt="Zalo Nội Thất Hùng Ngọc" />
        </a>

        <a href="tel:0347227377" className={`${styles.contactBtn} ${styles.phone}`} aria-label="Gọi điện">
          <span className={styles.phoneIcon}>📞</span>
        </a>
      </div>
    </footer>
  );
}


