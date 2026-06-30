import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, getAdminSessionValue } from './adminAuth';

export async function requireAdminSession() {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    redirect('/admin/login?reason=config');
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const expectedSession = await getAdminSessionValue(adminPassword);

  if (!session || session !== expectedSession) {
    redirect('/admin/login');
  }
}
