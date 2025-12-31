import { createClient } from '@/lib/supabase/core/server';
import { NextRequest, NextResponse } from 'next/server';

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip middleware for static files
  const staticFileExtensions =
    /\.(png|jpg|jpeg|gif|svg|webp|avif|ico|mp4|webm|mov|woff|woff2|ttf|otf|eot|json|xml|txt)$/i;
  if (staticFileExtensions.test(path)) {
    return NextResponse.next();
  }

  // Skip middleware for Next.js internal routes and public assets
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path === '/favicon.ico' ||
    path === '/sitemap.xml' ||
    path === '/robots.txt' ||
    path === '/bg_gates_open.mp4'
  ) {
    return NextResponse.next();
  }

  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const regexPathPublic =
    /^(\/login$|\/auth\/callback$|\/docs(\/.*)?$|\/blog(\/.*)?$|\/legals(\/.*)?$)/;
  const isPathPublic = regexPathPublic.test(path);

  const regexPathAuth = /^\/login$|\/auth\/callback$/;
  const isPathAuth = regexPathAuth.test(path);

  if (!session && !isPathPublic) {
    const redirectUrl = new URL(
      `/login?next=${encodeURIComponent(path)}`,
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
