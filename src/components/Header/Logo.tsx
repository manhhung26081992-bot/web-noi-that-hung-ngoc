// (Hiển thị Logo & Brand)
import Link from 'next/link';
import Image from 'next/image';

import  styles  from './styles/logo.module.css';
export default function Logo() {
  return (
    <Link href="/" title="Nội Thất Hùng Ngọc - Bàn ghế văn phòng chất lượng cao">
      <div className={styles.logoContainer}>
        <Image src="/logo1.png" alt="Logo Nội Thất Hùng Ngọc" width={70} height={70} priority />
        <div className={styles.brandText}>
          <p className={styles.subName}>HÙNG NGỌC</p>
          <p className={styles.mainName}>furniture</p>
        </div>
      </div>
    </Link>
  );
}