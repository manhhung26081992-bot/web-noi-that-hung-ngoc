import { NextResponse } from 'next/server';
import { getSearchConsoleData, normalizeSearchConsoleRange, normalizeSearchConsoleType } from '@/app/admin/seo/services/googleSearchConsoleService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = normalizeSearchConsoleRange(searchParams.get('range'));
  const type = normalizeSearchConsoleType(searchParams.get('type'));
  const data = await getSearchConsoleData(range, type);
  return NextResponse.json(data);
}
