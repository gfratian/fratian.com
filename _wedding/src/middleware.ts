import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EXPECTED_PASSWORD = (
  process.env.NEXT_PUBLIC_WEDDING_PASSWORD ||
  process.env.WEDDING_PASSWORD ||
  'Cantacuzino27'
).trim();

// Alias paths that should seamlessly redirect to /may2027
const ALIAS_PATHS = new Set([
  '/',
  '/may28',
  '/may28/',
  '/wedding',
  '/wedding/',
  '/rsvp',
  '/rsvp/',
]);

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const keyParam = searchParams.get('key');

  // 1. Check if URL is an alias route
  const isAlias = ALIAS_PATHS.has(pathname);
  const isTargetBase = pathname === '/may2027' || pathname === '/may2027/';

  // 2. Handle ?key=<PASSCODE> query parameter bypass
  const isKeyValid =
    keyParam && keyParam.trim().toLowerCase() === EXPECTED_PASSWORD.toLowerCase();

  if (isKeyValid) {
    // Construct clean URL pointing to /may2027 without ?key
    const destinationUrl = new URL('/may2027', request.url);
    searchParams.forEach((value, key) => {
      if (key !== 'key') {
        destinationUrl.searchParams.set(key, value);
      }
    });

    const response = NextResponse.redirect(destinationUrl, 302);

    // Set persistent auth cookie for guest
    response.cookies.set('wedding_auth', 'valid', {
      path: '/',
      sameSite: 'lax',
      maxAge: 2592000, // 30 days
      httpOnly: false, // Accessible to client context
    });

    // Enforce strict zero-crawler header
    response.headers.set(
      'X-Robots-Tag',
      'noindex, nofollow, noarchive, nosnippet, noimageindex'
    );

    return response;
  }

  // 3. Handle route alias redirects (/may28, /wedding, /rsvp, / -> /may2027)
  if (isAlias) {
    const destinationUrl = new URL('/may2027', request.url);
    searchParams.forEach((value, key) => {
      destinationUrl.searchParams.set(key, value);
    });

    const response = NextResponse.redirect(destinationUrl, 302);
    response.headers.set(
      'X-Robots-Tag',
      'noindex, nofollow, noarchive, nosnippet, noimageindex'
    );
    return response;
  }

  // 4. Default pass-through with security headers
  const response = NextResponse.next();
  response.headers.set(
    'X-Robots-Tag',
    'noindex, nofollow, noarchive, nosnippet, noimageindex'
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, fonts
     */
    '/((?!_next/static|_next/image|images|favicon.ico).*)',
  ],
};
