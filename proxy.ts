import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function hasSessionToken(req: NextRequest) {
    return Boolean(req.cookies.get('ksp_token')?.value);
}

export function proxy(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const isAuthPage = pathname.startsWith('/auth/');
    const isProtectedPage = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
    const isAuthenticated = hasSessionToken(req);

    if (isAuthPage && isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (isProtectedPage && !isAuthenticated) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/:path*'],
};
