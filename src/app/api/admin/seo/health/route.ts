import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import type { BrokenUrlItem, SeoHealthSnapshot, SystemHealthItem } from '@/app/admin/seo/types/seo';

export const dynamic = 'force-dynamic';

function siteUrl(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (envUrl) return envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;
  return new URL(request.url).origin;
}
function extractSitemapInfo(xml: string) {
  return { urlCount: (xml.match(/<loc>/g) || []).length, lastGenerated: xml.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] };
}
async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(path.join(process.cwd(), 'public', fileName), 'utf8')) as T; } catch { return fallback; }
}
async function readBrokenUrls(): Promise<BrokenUrlItem[]> {
  const log = await readJsonFile<BrokenUrlItem[]>('404-log.json', []);
  if (log.length) return log;
  const redirects = await readJsonFile<{ source: string; destination: string }[]>('redirects.json', []);
  return redirects.slice(0, 20).map((item, index) => ({ id: `${index}-${item.source}`, url: item.source, redirectTo: item.destination, status: 'redirected', source: 'redirects.json' }));
}

export async function GET(request: Request) {
  const baseUrl = siteUrl(request);
  const [sitemapResult, robotsResult, brokenUrls] = await Promise.allSettled([
    fetch(`${baseUrl}/sitemap.xml`, { cache: 'no-store' }).then((res) => res.ok ? res.text() : Promise.reject(new Error('Sitemap lỗi'))),
    fetch(`${baseUrl}/robots.txt`, { cache: 'no-store' }).then((res) => res.ok ? res.text() : Promise.reject(new Error('Robots lỗi'))),
    readBrokenUrls(),
  ]);
  const sitemapXml = sitemapResult.status === 'fulfilled' ? sitemapResult.value : '';
  const robotsTxt = robotsResult.status === 'fulfilled' ? robotsResult.value : '';
  const sitemapInfo = sitemapXml ? extractSitemapInfo(sitemapXml) : { urlCount: 0, lastGenerated: undefined };
  const hasEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const systemHealth: SystemHealthItem[] = [
    { name: 'Vercel Deploy', status: process.env.VERCEL ? 'ok' : 'pending', detail: process.env.VERCEL ? 'Đang chạy trên Vercel' : 'Local hoặc chưa có biến VERCEL' },
    { name: 'Supabase', status: hasEnv ? 'ok' : 'error', detail: hasEnv ? 'Đã có biến môi trường Supabase' : 'Thiếu cấu hình Supabase' },
    { name: 'Image', status: 'ok', detail: 'Ảnh sản phẩm dùng cấu hình hiện tại' },
    { name: 'Robots', status: robotsTxt ? 'ok' : 'warning', detail: robotsTxt ? 'robots.txt đọc được' : 'Chưa đọc được robots.txt' },
    { name: 'Sitemap', status: sitemapXml ? 'ok' : 'warning', detail: sitemapXml ? `${sitemapInfo.urlCount} URL` : 'Chưa đọc được sitemap.xml' },
    { name: 'Canonical', status: 'pending', detail: 'Sẵn sàng kiểm tra sâu khi kết nối Search Console API' },
  ];
  const payload: SeoHealthSnapshot = { brokenUrls: brokenUrls.status === 'fulfilled' ? brokenUrls.value : [], sitemap: { url: `${baseUrl}/sitemap.xml`, lastGenerated: sitemapInfo.lastGenerated, urlCount: sitemapInfo.urlCount, robotsOk: Boolean(robotsTxt), sitemapOk: Boolean(sitemapXml) }, systemHealth };
  return NextResponse.json(payload);
}
