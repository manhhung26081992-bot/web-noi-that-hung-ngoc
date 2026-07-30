import { NextResponse } from 'next/server';
import { handleOAuthCallback, isAdminRequest, jsonError, unauthorized } from '../googleSearchConsoleApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  if (error) return jsonError(400, 'Google OAuth bị hủy hoặc lỗi.', error);
  if (!code) return jsonError(400, 'Thiếu OAuth code.');
  try {
    await handleOAuthCallback(code, state);
    return NextResponse.redirect(new URL('/admin/seo?gsc=connected', request.url));
  } catch (error) {
    return jsonError(500, 'Không kết nối được Search Console.', error instanceof Error ? error.message : 'Lỗi không xác định.');
  }
}
