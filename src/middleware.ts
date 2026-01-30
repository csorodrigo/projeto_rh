import { type NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = [
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
