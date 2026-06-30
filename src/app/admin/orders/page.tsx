import { requireAdminSession } from '@/lib/adminGuard';
import AdminOrdersClient from './AdminOrdersClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  await requireAdminSession();
  return <AdminOrdersClient />;
}
