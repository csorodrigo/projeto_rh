import { type NextRequest, NextResponse } from "next/server"

/**
 * Simple middleware - allow all public routes, protect only dashboard routes
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('[Middleware] Request:', pathname);

  // List of paths that are always public (no auth required)
  const publicPaths = [
    '/vagas',
    '/sobre',
    '/privacidade',
    '/login',
    '/signup',
    '/auth',
    '/registro',
    '/recuperar-senha',
    '/recrutamento',
  ];

  // Check if current path is public
  const isPublic = publicPaths.some(path => pathname.startsWith(path));

  if (isPublic) {
    console.log('[Middleware] Public path, allowing:', pathname);
    return NextResponse.next();
  }

  // For all other paths (dashboard, etc), we would check auth here
  // For now, just allow everything to debug
  console.log('[Middleware] Other path, allowing for now:', pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
