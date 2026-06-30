import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, getAdminSessionValue } from './src/lib/adminAuth';

function withNoIndex(response: NextResponse) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

function isPublicAdminPath(pathname: string) {
  return [
    '/admin/login',
    '/admin/login/',
    '/admin/auth/login',
    '/admin/auth/login/',
    '/admin/logout',
    '/admin/logout/',
  ].includes(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (isPublicAdminPath(pathname)) {
    return withNoIndex(NextResponse.next());
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const nextPath = pathname + search;

  if (!adminPassword) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('reason', 'config');
    loginUrl.searchParams.set('next', nextPath);
    return withNoIndex(NextResponse.redirect(loginUrl));
  }

  const expectedSession = await getAdminSessionValue(adminPassword);
  const currentSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (currentSession === expectedSession) {
    return withNoIndex(NextResponse.next());
  }

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', nextPath);
  return withNoIndex(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
