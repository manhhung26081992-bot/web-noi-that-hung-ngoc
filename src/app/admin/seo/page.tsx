import type { Metadata } from 'next';
import SeoDashboard from './components/SeoDashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'SEO Dashboard - Nội Thất Hùng Ngọc', robots: { index: false, follow: false } };

export default function AdminSeoPage() { return <SeoDashboard />; }
