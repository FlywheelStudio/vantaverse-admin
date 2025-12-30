import { createClient } from '@/lib/supabase/core/server';
import { NextRequest, NextResponse } from 'next/server';

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const regexPathPublic =
    /^(\/$|\/sign-in$|\/auth\/callback$|\/docs(\/.*)?$|\/blog(\/.*)?$|\/legals(\/.*)?$)/;
  const isPathPublic = regexPathPublic.test(path);

  const regexPathAuth = /^\/sign-in$|\/auth\/callback$/;
  const isPathAuth = regexPathAuth.test(path);

  if (!session && !isPathPublic) {
    const redirectUrl = new URL(
      `/sign-in?next=${encodeURIComponent(path)}`,
      req.url,
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (session && isPathAuth) {
    // TODO: Redirect to the dashboard
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!auth/callback|api|static|_next/static|_next/image|favicon.ico|manifest.json|sitemap.xml|robots.txt).*)',
  ],
};
