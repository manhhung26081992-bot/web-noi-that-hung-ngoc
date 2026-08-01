import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/adminGuard';
import AdsPlannerClient from './AdsPlannerClient';
import styles from '../seo/seo-dashboard.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Google Ads Planner - Nội Thất Hùng Ngọc',
  robots: { index: false, follow: false },
};

export default async function AdminAdsPage() {
  await requireAdminSession();

  if (process.env.NEXT_PUBLIC_ADMIN_SEO_ENABLED !== 'true') {
    return (
      <main className={styles.disabledPage}>
        <section>
          <p>Nội Thất Hùng Ngọc</p>
          <h1>Google Ads Planner đang tắt.</h1>
          <span>Bật biến NEXT_PUBLIC_ADMIN_SEO_ENABLED=true để dùng trang quản trị Ads Planner.</span>
        </section>
      </main>
    );
  }

  return <AdsPlannerClient />;
}
