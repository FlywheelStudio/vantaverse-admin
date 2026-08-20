import { updateSession } from '@/lib/supabase/core/proxy';
import { NextRequest, NextResponse } from 'next/server';

export default async function proxy(req: NextRequest): Promise<NextResponse> {
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

  return await updateSession(req);
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
