import { NextResponse } from 'next/server';
import { getApiStatus, isAdminRequest, jsonError, unauthorized } from '../googleSearchConsoleApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    return NextResponse.json(await getApiStatus());
  } catch (error) {
    return jsonError(500, 'Không đọc được trạng thái Search Console API.', error instanceof Error ? error.message : 'Lỗi không xác định.');
  }
}
