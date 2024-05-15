import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from './utils/jwt';

// TODO: put these routes in a constant file
const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/auth/login', '/auth/signup', '/'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = cookies().get('session-auth')?.value;
  if (!cookie) {
    return isProtectedRoute
      ? NextResponse.redirect(new URL('/auth/login', req.nextUrl))
      : NextResponse.next();
  }

  const session = await verifyJwt(cookie);

  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/auth/login', req.nextUrl));
  }

  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
