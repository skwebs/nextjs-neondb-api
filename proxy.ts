import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT, getToken } from '@/lib/auth';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/register' ||
    pathname === '/api/auth/refresh' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/health' ||
    !pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const token = getToken(request);

  if (!token) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, 
      { status: 401 }
    );
  }

  const { payload, error } = await verifyJWT(token);

  if (error === 'TOKEN_EXPIRED') {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED' 
      }, 
      { status: 401 }
    );
  }

  if (!payload) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Invalid access token',
        code: 'INVALID_TOKEN' 
      }, 
      { status: 401 }
    );
  }

  // Add userId to headers so routes can access it easily
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: '/api/:path*',
};
