import { NextResponse } from 'next/server';
import { isAdminRequest, jsonError, syncQueryPage, unauthorized } from '../googleSearchConsoleApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  try {
    const body = await request.json().catch(() => ({})) as { range?: string; force?: boolean };
    const result = await syncQueryPage(body.range, Boolean(body.force));
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(500, 'Không đồng bộ được Query+Page từ Search Console API.', error instanceof Error ? error.message : 'Lỗi không xác định.');
  }
}
