import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function decodeBasicAuth(value: string) {
  try {
    return atob(value);
  } catch {
    return '';
  }
}

function isProtectedAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isProtectedAdminPath(pathname)) {
    return NextResponse.next();
  }

  const expectedUser = process.env.MMO_ADMIN_BASIC_USER;
  const expectedPass = process.env.MMO_ADMIN_BASIC_PASS;

  if (!expectedUser || !expectedPass) {
    return new NextResponse(
      'Basic auth is disabled because MMO_ADMIN_BASIC_USER / MMO_ADMIN_BASIC_PASS are not set.',
      { status: 500 }
    );
  }

  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="admin"',
        'Cache-Control': 'no-store',
      },
    });
  }

  const encoded = authHeader.slice(6);
  const decoded = decodeBasicAuth(encoded);
  const separatorIndex = decoded.indexOf(':');

  if (separatorIndex === -1) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="admin"',
        'Cache-Control': 'no-store',
      },
    });
  }

  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);

  if (user !== expectedUser || pass !== expectedPass) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="admin"',
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
