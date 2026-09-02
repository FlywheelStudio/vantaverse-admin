import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions & { secure?: boolean };
}

/**
 * Refreshes the Auth session in the Next.js proxy and writes updated cookies
 * onto both the request (for Server Components) and the response (for the browser).
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims().
  // getClaims validates the JWT and refreshes tokens when needed.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const path = request.nextUrl.pathname;

  const regexPathPublic =
    /^(\/login$|\/auth\/callback$|\/docs(\/.*)?$|\/blog(\/.*)?$|\/legals(\/.*)?$)/;
  const isPathPublic = regexPathPublic.test(path);

  const regexPathAuth = /^\/login$|\/auth\/callback$/;
  const isPathAuth = regexPathAuth.test(path);

  if (!user && !isPathPublic) {
    const redirectUrl = new URL(
      `/login?next=${encodeURIComponent(path)}`,
      request.url,
    );
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  if (user && isPathAuth) {
    const redirectResponse = NextResponse.redirect(
      new URL('/', request.url),
    );
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
