import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('admin_session');
  const secret = process.env.ADMIN_SECRET;
  const isAuthenticated = session?.value === secret && !!secret;

  // Admin UI routes (except /admin itself which is the login page)
  if (pathname.startsWith('/admin/')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // If already logged in and visiting /admin login page, redirect to upload
  if (pathname === '/admin' && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin/upload', request.url));
  }

  // Protect admin API routes — but not the login/logout endpoints themselves
  const isPublicAdminApi = pathname === '/api/admin/login' || pathname === '/api/admin/logout';
  if (pathname.startsWith('/api/admin/') && !isPublicAdminApi) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
