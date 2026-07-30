import { NextResponse } from 'next/server';
import { buildAuthUrl, isAdminRequest, jsonError, unauthorized } from '../googleSearchConsoleApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    return NextResponse.json({ ok: true, url: await buildAuthUrl() });
  } catch (error) {
    return jsonError(500, 'Không tạo được Google OAuth URL.', error instanceof Error ? error.message : 'Lỗi không xác định.');
  }
}
