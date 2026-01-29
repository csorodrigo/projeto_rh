import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

/**
 * Protected routes that require authentication
 */
const protectedRoutes = [
  '/dashboard',
  '/funcionarios',
  '/ponto',
  '/ausencias',
  '/pdi',
  '/saude',
  '/folha',
  '/relatorios',
  '/configuracoes',
  '/config',
];

/**
 * Public routes that don't require authentication
 */
const publicRoutes = [
  '/login',
  '/signup',
  '/auth',
  '/vagas',
  '/sobre',
  '/privacidade',
  '/recrutamento',
  '/registro',
  '/recuperar-senha',
];

/**
 * Routes that authenticated users shouldn't access
 * (redirects to dashboard if authenticated)
 */
const authRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('[Middleware] Processing:', pathname);

  // Check if route is public first (before session check)
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  console.log('[Middleware] Is public route:', isPublicRoute);

  // Allow public routes without authentication
  if (isPublicRoute) {
    console.log('[Middleware] Allowing public route:', pathname);
    return NextResponse.next({
      request,
    });
  }

  console.log('[Middleware] Checking auth for:', pathname);

  // Update Supabase session for protected routes
  const { supabaseResponse, user } = await updateSession(request);

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     * - public folder assets
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
