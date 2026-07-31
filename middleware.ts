import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, getAdminSessionValue } from './src/lib/adminAuth';


const legacySemanticRedirects: Record<string, string> = {
  '/ghe-bar': '/ban-ghe-cafe/',
  '/tin-tuc/ghe-xoay': '/ghe-xoay/',
  '/ban-an-mat-da-cafe': '/ban-ghe-cafe/',
  '/san-pham/ban-chan-sat': '/ban-chan-sat/',
  '/san-pham/sofa-da': '/sofa-da/',
  '/san-pham/ban-hop': '/ban-hop/',
  '/san-pham/cum-ban': '/cum-ban/',
  '/san-pham/ke-sach': '/ke-sach/',
  '/san-pham/tu-giay': '/tu-giay/',
  '/san-pham/ghe-bar': '/ban-ghe-cafe/',
  '/san-pham/ban-an-mat-da-cafe': '/ban-ghe-cafe/',
  '/san-pham/ke-tivi': '/ke-ti-vi/',
  '/san-pham/tu-locker-sat': '/tu-locker/',
  '/ke-tivi': '/ke-ti-vi/',
  '/tu-locker-sat': '/tu-locker/',
  '/danh-muc/ban-sofa': '/ban-sofa/',
};

function normalizeLegacyPath(pathname: string) {
  const cleanPath = pathname === '/' ? pathname : pathname.replace(/\/+$/g, '');
  return cleanPath.toLowerCase();
}

function getLegacyRedirectTarget(pathname: string) {
  return legacySemanticRedirects[normalizeLegacyPath(pathname)];
}

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
  const legacyRedirectTarget = getLegacyRedirectTarget(pathname);

  if (legacyRedirectTarget) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = legacyRedirectTarget;
    return NextResponse.redirect(redirectUrl, 308);
  }

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
  matcher: ['/admin', '/admin/:path*', '/san-pham/:path*', '/tin-tuc/:path*', '/ghe-bar', '/ghe-bar/:path*', '/ban-an-mat-da-cafe', '/ban-an-mat-da-cafe/:path*', '/ban-nhan-vien/', '/ban-nhan-vien/:path*', '/ke-tivi', '/ke-tivi/:path*', '/tu-locker-sat', '/tu-locker-sat/:path*', '/danh-muc/:path*'],
};
