import type { Metadata } from 'next';
import SeoDashboard from './components/SeoDashboard';
import styles from './seo-dashboard.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'SEO Dashboard - Nội Thất Hùng Ngọc', robots: { index: false, follow: false } };

export default function AdminSeoPage() {
  if (process.env.NEXT_PUBLIC_ADMIN_SEO_ENABLED !== 'true') {
    return <main className={styles.disabledPage}><section><p>Nội Thất Hùng Ngọc</p><h1>SEO Dashboard đang tắt.</h1><span>Bật biến môi trường NEXT_PUBLIC_ADMIN_SEO_ENABLED=true để sử dụng trang quản trị SEO.</span></section></main>;
  }

  return <SeoDashboard />;
}
