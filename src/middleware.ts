import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

  // Let core API triggers bypass auth so cron jobs or webhook endpoints can function
  if (
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/reminders/incoming') ||
    pathname.startsWith('/api/auth/callback')
  ) {
    return NextResponse.next();
  }

  // 1. Refresh Supabase Session (if active)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  const isSupabaseEnabled = supabaseUrl !== '' && supabaseAnonKey !== '';

  let hasSupabaseSession = false;

  if (isSupabaseEnabled) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        hasSupabaseSession = true;
      }
    } catch {
      // Ignore auth parsing exceptions in edge middleware
    }
  }

  // 2. Fallback check for custom session cookie (supports both mock users and active sessions)
  const customSession = request.cookies.get('rxremind_session');
  let hasValidCustomSession = false;
  if (customSession?.value) {
    try {
      // Safely decode cookie if JSON-encoded
      const decodedValue = decodeURIComponent(customSession.value);
      const sessionObj = JSON.parse(decodedValue);
      if (sessionObj && sessionObj.email && sessionObj.clinicId) {
        hasValidCustomSession = true;
      }
    } catch {
      // Fallback string validation in case of unencoded formats
      hasValidCustomSession = 
        customSession.value.includes('clinicId') || 
        customSession.value.includes('demo-clinic-uuid-12345') ||
        customSession.value.includes('@');
    }
  }

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  // Use the custom session cookie as the absolute, unified source of truth for auth redirections.
  // This guarantees that middleware and Server Components are always in 100% agreement,
  // completely eliminating "Too Many Redirects" loops!
  const isAuthenticated = hasValidCustomSession;

  if (!isAuthenticated && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthPage) {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api/cron|api/reminders/incoming|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp).*)',
  ],
};
