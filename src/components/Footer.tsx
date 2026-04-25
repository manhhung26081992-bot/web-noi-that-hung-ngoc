"use client";
import { useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/Footer.module.css';

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
                  <Link href={item.url}>
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
              Nhà phân phối <strong>tủ sắt locker</strong>, <strong>bàn ghế văn phòng</strong> uy tín tại Hà Nội. Cam kết giá rẻ tận gốc, chất lượng bền bỉ.
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

      {/* KHUNG CHAT */}
      <div className={`${styles.chatWrapper} ${isChatOpen ? styles.showChat : ''}`}>
        <div className={styles.chatHeader}>
          <span>Hỗ trợ Hùng Ngọc</span>
          <button onClick={() => setIsChatOpen(false)} className={styles.closeChat}>×</button>
        </div>
        <div className={styles.chatBody}>
          <p>Chào bạn! Hùng Ngọc có thể giúp gì cho bạn ạ?</p>
          <div className={styles.autoReplies}>
            <button onClick={() => window.location.href='tel:0347227377'}>📞 Gọi Hotline</button>
            <button onClick={() => window.open('https://zalo.me/0347227377')}>✉️ Nhắn Zalo</button>
          </div>
        </div>
      </div>

      {/* NÚT LIÊN HỆ NỔI */}
      <div className={styles.fixedContact}>
        <button className={`${styles.contactBtn} ${styles.chatbot}`} onClick={() => setIsChatOpen(!isChatOpen)}>
          💬
        </button>
        <a href="https://zalo.me/0347227377" className={`${styles.contactBtn} ${styles.zaloBtn}`} target="_blank" rel="noreferrer">
          <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" alt="Zalo" />
        </a>
        <a href="tel:0347227377" className={`${styles.contactBtn} ${styles.phone}`}>📞</a>
      </div>
    </footer>
  );
}


// "use client";
// import { useState } from 'react';
// import Link from 'next/link';
// import styles from '@/styles/Footer.module.css';

// export default function Footer() {
//   const [isChatOpen, setIsChatOpen] = useState(false);

//   const footerData = [
//     {
//       title: "Chính Sách Chung",
//       links: [
//         { name: "Thanh toán & Vận chuyển", url: "/chinh-sach/van-chuyen" },
//         { name: "Chính sách bảo hành", url: "/chinh-sach/bao-hanh" },
//         { name: "Chính sách đổi trả", url: "/chinh-sach/doi-tra" },
//         { name: "Bảo mật thông tin", url: "/chinh-sach/bao-mat" }
//       ]
//     },
//     {
//       title: "Bàn Văn Phòng",
//       links: [
//         { name: "Bàn chân sắt giá rẻ", url: "/ban-chan-sat" },
//         { name: "Bàn giám đốc hiện đại", url: "/ban-giam-doc" },
//         { name: "Bàn họp văn phòng", url: "/ban-lam-viec" },
//         { name: "Bàn làm việc tại nhà", url: "/ban-lam-viec" }
//       ]
//     },
//     {
//       title: "Ghế Văn Phòng",
//       links: [
//         { name: "Ghế xoay nhân viên", url: "/ghe-xoay" },
//         { name: "Ghế chân quỳ phòng họp", url: "/ghe-chan-quy" },
//         { name: "Ghế giám đốc cao cấp", url: "/ghe-giam-doc" },
//         { name: "Ghế gấp gọn tiện dụng", url: "/ghe-gap" }
//       ]
//     },
//     {
//       title: "Bàn Ăn & Gia Đình",
//       links: [
//         { name: "Bàn ăn mặt đá sang trọng", url: "/ban-an-mat-da" },
//         { name: "Bộ bàn ăn 6 ghế", url: "/bo-ban-an-6-ghe" },
//         { name: "Giường sắt 2 tầng", url: "/giuong-tang-sat" },
//         { name: "Tủ quần áo gỗ/sắt", url: "/tu-quan-ao" }
//       ]
//     }
//   ];

//   return (
//     <footer className={styles.footer}>
//       {/* KHỐI 1: DANH MỤC SẢN PHẨM */}
//       <div className={styles.container}>
//         {footerData.map((col, index) => (
//           <div key={index} className={styles.column}>
//             <h4 className={styles.columnTitle}>{col.title}</h4>
//             <ul className={styles.linkList}>
//               {col.links.map((item, i) => (
//                 <li key={i}>
//                   <Link href={item.url}>
//                     <span className={styles.arrow}>➔</span> {item.name}
//                   </Link>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ))}
//       </div>

//       {/* KHỐI 2: THÔNG TIN THƯƠNG HIỆU & BẢN ĐỒ (Dàn hàng ngang) */}
//       <div className={styles.brandSection}>
//         <div className={styles.brandGrid}>
//           <div className={styles.brandCol}>
//             <h4 className={styles.brandTitle}>NỘI THẤT HÙNG NGỌC</h4>
//             <p className={styles.brandDesc}>
//              Nhà phân phối <strong>tủ sắt locker</strong>, <strong>bàn ghế văn phòng</strong> uy tín tại Hà Nội. Cam kết giá rẻ tận gốc, chất lượng bền bỉ.
//             </p>
//           </div>

//           <div className={styles.brandCol}>
//             <h4 className={styles.brandTitle}>TẠI SAO CHỌN CHÚNG TÔI</h4>
//             <ul className={styles.checkList}>
//               <li>✅ Bảo hành 12 tháng tận tâm</li>
//               <li>✅ Tối ưu phí vận chuyển</li>
//               <li>✅ Hàng có sẵn - Giao ngay 24h</li>
//             </ul>
//           </div>

//           <div className={styles.brandCol}>
//             <h4 className={styles.brandTitle}>VỊ TRÍ KHO HÀNG</h4>
//             <a href="https://www.google.com/maps/place/211+Nguy%E1%BB%85n+V%C4%83n+Gi%C3%A1p,+C%E1%BA%A7u+Di%E1%BB%85n,+T%E1%BB%AB+Li%C3%AAm,+H%C3%A0+N%E1%BB%99i,+Vietnam/@21.0273013,105.7541854,17z/data=!3m1!4b1!4m6!3m5!1s0x31345498236000a3:0xe668ea8d31707631!8m2!3d21.0272963!4d105.7567603!16s%2Fg%2F11vstq4zq1?entry=ttu&g_ep=EgoyMDI2MDQxNS4wIKXMDSoASAFQAw%3D%3D" target="_blank" className={styles.mapLink}>
//               <span className={styles.mapIcon}>📍</span>
//               <div className={styles.mapText}>
//                 <strong>Xem trên Google Maps</strong>
//                 <span>213 Nguyễn Văn Giáp, Nam Từ Liêm</span>
//               </div>
//             </a>
//           </div>
//         </div>
//       </div>

//       {/* KHỐI 3: COPYRIGHT */}
//      {/* KHỐI 3: COPYRIGHT - ĐÃ CHIA 2 DÒNG */}
// <div className={styles.bottomBar}>
//   <div className={styles.hotlineRow}>
//     Hotline: <a href="tel:0347227377">0347 227 377</a>
//   </div>
//   <div className={styles.copyrightRow}>
//     © 2026 Nội Thất Hùng Ngọc
//   </div>
// </div>
//       {/* KHUNG CHAT (Sửa lỗi mảng trắng) */}
//       <div className={`${styles.chatWrapper} ${isChatOpen ? styles.showChat : ''}`}>
//         <div className={styles.chatHeader}>
//           <span>Hỗ trợ Hùng Ngọc</span>
//           <button onClick={() => setIsChatOpen(false)} className={styles.closeChat}>×</button>
//         </div>
//         <div className={styles.chatBody}>
//           <p>Chào bạn! Hùng Ngọc có thể giúp gì cho bạn ạ?</p>
//           <div className={styles.autoReplies}>
//             <button onClick={() => window.location.href='tel:0347227377'}>📞 Gọi Hotline</button>
//             <button onClick={() => window.open('https://zalo.me/0347227377')}>✉️ Nhắn Zalo</button>
//           </div>
//         </div>
//       </div>

//       {/* NÚT LIÊN HỆ NỔI (Đảm bảo click được) */}
//       <div className={styles.fixedContact}>
//         <button className={`${styles.contactBtn} ${styles.chatbot}`} onClick={() => setIsChatOpen(!isChatOpen)}>
//           💬
//         </button>
//         <a href="https://zalo.me/0347227377" className={`${styles.contactBtn} ${styles.zaloBtn}`} target="_blank">
//           <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" alt="Zalo" />
//         </a>
//         <a href="tel:0347227377" className={`${styles.contactBtn} ${styles.phone}`}>📞</a>
//       </div>
//     </footer>
//   );
// }
