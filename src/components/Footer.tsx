
"use client";
import { useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/Footer.module.css';
declare var window: any;
export default function Footer() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const footerData = [
    {
      title: "Hỗ Trợ Khách Hàng", // Đổi tên cho bao quát hơn
      links: [
        { name: "Cẩm nang nội thất", url: "/tin-tuc" }, // THÊM DÒNG NÀY ĐỂ TỐI ƯU SEO
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
        { name: "Bàn họp văn phòng", url: "/ban-hop" },
        { name: "Bàn làm việc tại nhà", url: "/ban-van-phong" }
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
        { name: "Tủ quần áo gỗ/sắt", url: "/tu-quan-ao" }
      ]
    }
  ];

  return (
    <footer className={styles.footer}>
      {/* KHỐI 1: DANH MỤC SẢN PHẨM */}
      <div className={styles.container}>
        {footerData.map((col, index) => (
          <div key={index} className={styles.column}>
            <h4 className={styles.columnTitle}>{col.title}</h4>
            <ul className={styles.linkList}>
              {col.links.map((item, i) => (
                <li key={i}>
                  <Link href={item.url} prefetch={false}>
                    <span className={styles.arrow}>➔</span> {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* KHỐI 2: THÔNG TIN THƯƠNG HIỆU & BẢN ĐỒ */}
      <div className={styles.brandSection}>
        <div className={styles.brandGrid}>
          <div className={styles.brandCol}>
            <h4 className={styles.brandTitle}>NỘI THẤT HÙNG NGỌC</h4>
            <p className={styles.brandDesc}>
              Tổng kho phân phối<strong> tủ sắt locker</strong>,<strong> nội thất văn phòng</strong> & <strong>gia đình</strong> uy tín tại Hà Nội. Cam kết giá gốc đại lý, chất lượng bền bỉ.
            </p>
          </div>

          <div className={styles.brandCol}>
            <h4 className={styles.brandTitle}>TẠI SAO CHỌN CHÚNG TÔI</h4>
            <ul className={styles.checkList}>
              <li>✅ Bảo hành 12 tháng tận tâm</li>
              <li>✅ Tối ưu phí vận chuyển</li>
              <li>✅ Hàng có sẵn - Giao ngay 24h</li>
            </ul>
          </div>

          <div className={styles.brandCol}>
            <h4 className={styles.brandTitle}>VỊ TRÍ KHO HÀNG</h4>
            <a href="https://www.google.com/maps/search/213+Nguy%E1%BB%83n+V%C4%83n+Gi%C3%A1p,+Nam+T%E1%BB%AB+Li%C3%AAm" target="_blank" className={styles.mapLink}>
              <span className={styles.mapIcon}>📍</span>
              <div className={styles.mapText}>
                <strong>Xem trên Google Maps</strong>
                <span>213 Nguyễn Văn Giáp, Nam Từ Liêm</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* KHỐI 3: COPYRIGHT */}
      <div className={styles.bottomBar}>
        <div className={styles.hotlineRow}>
          Hotline: <a href="tel:0347227377">0347 227 377</a>
        </div>
        <div className={styles.copyrightRow}>
          © 2026 Nội Thất Hùng Ngọc
        </div>
      </div>
 {/* Bọc tất cả vào MỘT container duy nhất  */}
<div className={styles.fixedContact}>
  
  {/* KHỐI 1: KHUNG CHAT (Nằm trên các nút) */}
  <div className={`${styles.chatWrapper} ${isChatOpen ? styles.showChat : ''}`}>
    <div className={styles.chatHeader}>
      <span>Hỗ trợ Hùng Ngọc</span>
      <button onClick={() => setIsChatOpen(false)} className={styles.closeChat}>×</button>
    </div>
    <div className={styles.chatBody}>
      <p>Chào bạn! Hùng Ngọc có thể giúp gì cho bạn ạ?</p>
      <div className={styles.autoReplies}>
        <button onClick={() => window.location.href='tel:0347227377'}>📞 Gọi Hotline</button>
        <button onClick={() => {
          if (typeof window !== "undefined" && window.gtag) {
            window.gtag('event', 'conversion', {
              'send_to': 'AW-18110246759/cY9cCNiU6aYCEOfe0btD'
            });
          }
          window.open('https://zalo.me/0347227377', '_blank');
        }}>💬 Nhắn Zalo</button>
      </div>
    </div>
  </div>

  {/* KHỐI 2: DÀN HÀNG CÁC NÚT BẤM (Không bọc thêm div trùng tên class) */}
  <button 
    className={`${styles.contactBtn} ${styles.chatbot}`} 
    onClick={() => setIsChatOpen(!isChatOpen)}
  >
    💬
  </button>

  <a 
    href="https://zalo.me/0347227377" 
    className={`${styles.contactBtn} ${styles.zaloBtn}`} 
    target="_blank" 
    rel="noreferrer"
    onClick={(e) => {
      e.preventDefault(); 
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'conversion', {
          'send_to': 'AW-18110246759',
          'event_callback': () => {
            window.open('https://zalo.me/0347227377', '_blank');
          }
        });
      } else {
        window.open('https://zalo.me/0347227377', '_blank');
      }
    }}
  >
    <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" alt="Zalo" />
  </a>

  <a href="tel:0347227377" className={`${styles.contactBtn} ${styles.phone}`}>📞</a>

</div>
    </footer>
  );
}