import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, getAdminSessionValue } from '@/lib/adminAuth';

function getSafeNext(value: FormDataEntryValue | null) {
  if (typeof value === 'string' && value.startsWith('/admin') && !value.startsWith('/admin/login')) {
    return value;
  }

  return '/admin/seo';
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const password = String(form.get('password') || '');
  const adminPassword = process.env.ADMIN_PASSWORD;
  const nextPath = getSafeNext(form.get('next'));

  if (!adminPassword) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('reason', 'config');
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl, 303);
  }

  if (password !== adminPassword) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('error', '1');
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl, 303);
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
  response.cookies.set(ADMIN_SESSION_COOKIE, await getAdminSessionValue(adminPassword), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');

  return response;
}
