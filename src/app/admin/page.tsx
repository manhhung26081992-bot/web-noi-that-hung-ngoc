import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requireAdminSession();
  redirect('/admin/seo');
}
