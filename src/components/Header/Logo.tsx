// (Hiển thị Logo & Brand)
import Link from 'next/link';
import Image from 'next/image';

import  styles  from './styles/logo.module.css';
export default function Logo() {
  return (
    <Link href="/" title="Nội Thất Hùng Ngọc - Bàn ghế văn phòng chất lượng cao">
      <div className={styles.logoContainer}>
        <div className={styles.logoWrapper}>
        <Image src="/logo.png" alt="Logo Nội Thất Hùng Ngọc" width={70} height={70} priority className={styles.logoImage}
        sizes="(max-width: 768px) 50px, 70px"/>
        </div>
        <div className={styles.brandText}>
          <p className={styles.subName}>HÙNG NGỌC</p>
          <p className={styles.mainName}>furniture</p>
        </div>
      </div>
    </Link>
  );
}