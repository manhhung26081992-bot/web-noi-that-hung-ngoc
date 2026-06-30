import type { Metadata } from 'next';
import styles from './login.module.css';

export const metadata: Metadata = {
  title: 'Đăng nhập quản trị - Nội Thất Hùng Ngọc',
  robots: {
    index: false,
    follow: false,
  },
};

type LoginSearchParams = {
  error?: string;
  reason?: string;
  next?: string;
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<LoginSearchParams>;
}) {
  const params = searchParams ? await searchParams : {};
  const nextPath = typeof params.next === 'string' && params.next.startsWith('/admin')
    ? params.next
    : '/admin/seo';
  const missingConfig = params.reason === 'config' || !process.env.ADMIN_PASSWORD;

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginCard}>
        <p className={styles.eyebrow}>Nội Thất Hùng Ngọc</p>
        <h1>Đăng nhập quản trị</h1>
        <p className={styles.description}>
          Nhập mật khẩu quản trị để mở khu vực admin.
        </p>

        {missingConfig ? (
          <div className={styles.warning}>Chưa cấu hình ADMIN_PASSWORD.</div>
        ) : null}

        {params.error === '1' ? (
          <div className={styles.error}>Sai mật khẩu quản trị.</div>
        ) : null}

        <form action="/admin/auth/login" method="post" className={styles.form}>
          <input type="hidden" name="next" value={nextPath} />
          <label>
            <span>Mật khẩu</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={missingConfig}
            />
          </label>
          <button type="submit" disabled={missingConfig}>
            Đăng nhập
          </button>
        </form>
      </section>
    </main>
  );
}
