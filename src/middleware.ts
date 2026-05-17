import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('rxremind_session');
  const { pathname } = request.nextUrl;

  // Let core API triggers bypass auth so cron jobs or webhook endpoints can function
  if (
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/reminders/incoming')
  ) {
    return NextResponse.next();
  }

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (!session && !isAuthPage) {
    // Force login if no session is present
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isAuthPage) {
    // Redirect already authenticated users away from login/signup
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - API routes starting with cron or incoming webhook
     * - Static assets and static directories (_next/static, _next/image, favicon.ico)
     */
    '/((?!api/cron|api/reminders/incoming|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp).*)',
  ],
};
