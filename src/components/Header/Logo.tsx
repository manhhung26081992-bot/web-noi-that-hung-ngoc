// (Hiển thị Logo & Brand)
import Link from 'next/link';
// Xóa dòng import Image từ next/image vì không dùng nữa
import styles from './styles/logo.module.css';

export default function Logo() {
  return (
    <Link href="/" title="Nội Thất Hùng Ngọc - Bàn ghế văn phòng chất lượng cao">
      <div className={styles.logoContainer}>
        <div className={styles.logoWrapper}>
          {/* DÙNG THẺ IMG THUẦN: né lỗi 402 và tải logo cực nhanh */}
          <img 
            src="/logo.png" 
            alt="Logo Nội Thất Hùng Ngọc" 
            width={70} 
            height={70} 
            className={styles.logoImage}
          />
        </div>
        <div className={styles.brandText}>
          <p className={styles.subName}>HÙNG NGỌC</p>
          <p className={styles.mainName}>furniture</p>
        </div>
      </div>
    </Link>
  );
}