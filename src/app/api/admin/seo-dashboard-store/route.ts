import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, getAdminSessionValue } from '@/lib/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

type StorePostItem = {
  storeKey?: unknown;
  payload?: unknown;
};

async function isAdminRequest() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!session) return false;

  return session === await getAdminSessionValue(adminPassword);
}

function unauthorized() {
  return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị để đồng bộ dữ liệu SEO.' }, { status: 401 });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không xử lý được yêu cầu đồng bộ SEO.';
}

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('seo_dashboard_store')
      .select('store_key,payload,version,updated_at')
      .order('store_key', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      items: (data || []).map((item) => ({
        storeKey: item.store_key,
        payload: item.payload,
        version: item.version,
        updatedAt: item.updated_at,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return unauthorized();

  try {
    const body = await request.json().catch(() => null) as { items?: StorePostItem[] } | null;
    const items = Array.isArray(body?.items) ? body.items : [];

    const rows = items
      .filter((item) => typeof item.storeKey === 'string' && item.storeKey.trim())
      .map((item) => ({
        store_key: String(item.storeKey).trim(),
        payload: item.payload ?? {},
        version: 'v11.2',
        updated_at: new Date().toISOString(),
      }));

    if (!rows.length) {
      return NextResponse.json({ error: 'Không có dữ liệu hợp lệ để đồng bộ.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from('seo_dashboard_store')
      .upsert(rows, { onConflict: 'store_key' });

    if (error) throw error;

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest())) return unauthorized();

  try {
    const url = new URL(request.url);
    const storeKey = url.searchParams.get('storeKey');

    if (!storeKey) {
      return NextResponse.json({ error: 'Thiếu storeKey cần xóa.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from('seo_dashboard_store')
      .delete()
      .eq('store_key', storeKey);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
