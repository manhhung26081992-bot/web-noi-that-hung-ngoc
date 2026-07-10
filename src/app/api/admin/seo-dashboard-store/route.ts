import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, getAdminSessionValue } from '@/lib/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

type StorePostItem = {
  storeKey?: unknown;
  payload?: unknown;
};

const MAX_REQUEST_CHARS = 900000;
const MAX_ROW_PAYLOAD_CHARS = 650000;

async function isAdminRequest() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!session) return false;

  return session === await getAdminSessionValue(adminPassword);
}

function jsonError(status: number, message: string, detail?: string) {
  return NextResponse.json({
    ok: false,
    error: message,
    message,
    detail,
  }, { status });
}

function unauthorized() {
  return jsonError(401, 'Bạn cần đăng nhập quản trị để đồng bộ dữ liệu SEO.');
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không xử lý được yêu cầu đồng bộ SEO.';
}

function getReadableSupabaseMessage(error: unknown, fallback: string) {
  const message = getErrorMessage(error);
  const lower = message.toLowerCase();
  if (lower.includes('seo_dashboard_store') && (lower.includes('does not exist') || lower.includes('relation'))) {
    return {
      message: 'Bảng seo_dashboard_store chưa tồn tại.',
      detail: 'Hãy chạy file SQL supabase/seo-dashboard-store.sql trong Supabase SQL Editor.',
    };
  }
  if (lower.includes('payload') || lower.includes('too large') || lower.includes('413')) {
    return {
      message: 'Payload quá lớn.',
      detail: 'Hãy đồng bộ từng key hoặc dùng cơ chế chia nhỏ dữ liệu.',
    };
  }
  if (lower.includes('supabase_service_role_key')) {
    return {
      message: 'Thiếu SUPABASE_SERVICE_ROLE_KEY.',
      detail: 'Hãy thêm biến SUPABASE_SERVICE_ROLE_KEY trong .env.local và Vercel Environment Variables.',
    };
  }
  return { message: fallback, detail: message };
}

function getAdminSupabaseOrError() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      client: null,
      response: jsonError(
        500,
        'Thiếu SUPABASE_SERVICE_ROLE_KEY.',
        'Hãy thêm biến SUPABASE_SERVICE_ROLE_KEY trong .env.local và Vercel Environment Variables.',
      ),
    };
  }

  try {
    return { client: getSupabaseAdminClient(), response: null };
  } catch (error) {
    const readable = getReadableSupabaseMessage(error, 'Không khởi tạo được Supabase admin client.');
    return { client: null, response: jsonError(500, readable.message, readable.detail) };
  }
}

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();

  const { client: supabase, response } = getAdminSupabaseOrError();
  if (!supabase) return response;

  try {
    const { data, error } = await supabase
      .from('seo_dashboard_store')
      .select('store_key,payload,version,updated_at')
      .order('store_key', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      items: (data || []).map((item) => ({
        storeKey: item.store_key,
        payload: item.payload,
        version: item.version,
        updatedAt: item.updated_at,
      })),
    });
  } catch (error) {
    const readable = getReadableSupabaseMessage(error, 'Lỗi đọc Supabase.');
    return jsonError(500, readable.message, readable.detail);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return unauthorized();

  const { client: supabase, response } = getAdminSupabaseOrError();
  if (!supabase) return response;

  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_REQUEST_CHARS) {
      return jsonError(
        413,
        'Payload quá lớn.',
        'Request này vượt giới hạn an toàn. Hãy đồng bộ từng key hoặc chia nhỏ payload trước khi gửi.',
      );
    }

    const body = JSON.parse(rawBody || '{}') as { items?: StorePostItem[] };
    const items = Array.isArray(body?.items) ? body.items : [];

    const rows = items
      .filter((item) => typeof item.storeKey === 'string' && item.storeKey.trim())
      .map((item) => {
        const payload = item.payload ?? {};
        const payloadSize = JSON.stringify(payload).length;
        if (payloadSize > MAX_ROW_PAYLOAD_CHARS) {
          throw new Error('Payload quá lớn cho storeKey ' + String(item.storeKey));
        }
        return {
          store_key: String(item.storeKey).trim(),
          payload,
          version: 'v11.2.3',
          updated_at: new Date().toISOString(),
        };
      });

    if (!rows.length) {
      return jsonError(400, 'Không có dữ liệu hợp lệ để đồng bộ.');
    }

    const { error } = await supabase
      .from('seo_dashboard_store')
      .upsert(rows, { onConflict: 'store_key' });

    if (error) throw error;

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (error) {
    const readable = getReadableSupabaseMessage(error, 'Lỗi ghi Supabase.');
    const status = readable.message.includes('Payload quá lớn') ? 413 : 500;
    return jsonError(status, readable.message, readable.detail);
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest())) return unauthorized();

  const { client: supabase, response } = getAdminSupabaseOrError();
  if (!supabase) return response;

  try {
    const url = new URL(request.url);
    const storeKey = url.searchParams.get('storeKey');

    if (!storeKey) {
      return jsonError(400, 'Thiếu storeKey cần xóa.');
    }

    const { error } = await supabase
      .from('seo_dashboard_store')
      .delete()
      .eq('store_key', storeKey);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const readable = getReadableSupabaseMessage(error, 'Lỗi xóa Supabase.');
    return jsonError(500, readable.message, readable.detail);
  }
}
