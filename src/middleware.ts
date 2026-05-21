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

  // Gracefully redirect /dashboard requests to the main root dashboard
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Let core API triggers bypass auth so cron jobs or webhook endpoints can function
  if (
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/reminders/incoming') ||
    pathname.startsWith('/api/auth/callback') ||
    pathname.startsWith('/api/webhooks/stripe')
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

  // Gracefully bypass Supabase validation for the mock demo account to guarantee it works instantly (development/staging only)
  const isProduction = process.env.NODE_ENV === 'production';
  let isDemoSession = false;
  if (!isProduction && customSession?.value) {
    try {
      const decodedValue = decodeURIComponent(customSession.value);
      const sessionObj = JSON.parse(decodedValue);
      if (sessionObj && sessionObj.email === 'owner@rxremind-demo.com') {
        isDemoSession = true;
      }
    } catch {
      // ignore
    }
  }

  // Use active Supabase session as the absolute source of truth when enabled,
  // EXCEPT for the demo walkthrough session which is allowed to bypass Supabase.
  const isAuthenticated = isDemoSession 
    ? true 
    : (isSupabaseEnabled ? hasSupabaseSession : (!isProduction && hasValidCustomSession));

  if (!isAuthenticated && !isAuthPage) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    // If we have a valid custom cookie session but no Supabase session, the token is stale/expired.
    // Redirect with a database access denied flag to prompt email check or session re-login.
    if (hasValidCustomSession && isSupabaseEnabled) {
      loginUrl.searchParams.set('error', 'database_access_denied');
    }
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
    '/((?!api/cron|api/reminders/incoming|api/webhooks/stripe|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp).*)',
  ],
};
