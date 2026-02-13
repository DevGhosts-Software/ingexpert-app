import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // If user is logged in and tries to access auth pages, redirect to dashboard
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Note: We don't redirect TO login here because we want to allow
  // the DashboardLayout to handle it with a proper loading state
  // and tRPC query verification (in case the cookie is invalid).

  return NextResponse.next();
}

export const config = {
  matcher: ['/login'],
};
