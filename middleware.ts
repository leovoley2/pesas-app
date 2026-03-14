import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');
    const role = (token?.role as string) || 'athlete';
    const isAdminOrCoach = ['admin', 'coach'].includes(role);

    if (isAuthPage) {
        if (isAuth) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        return null;
    }

    if (!isAuth) {
        let from = req.nextUrl.pathname;
        if (req.nextUrl.search) {
            from += req.nextUrl.search;
        }
        return NextResponse.redirect(new URL(`/login?from=${encodeURIComponent(from)}`, req.url));
    }

    // Role-based Path Protection
    const adminOnlyRoutes = [
        '/dashboard/athletes/new',
        '/dashboard/plans/new',
        '/edit', // any /edit route
        '/sessions/new'
    ];

    const isTryingToAccessAdminRoute = adminOnlyRoutes.some(route => req.nextUrl.pathname.includes(route));

    if (isTryingToAccessAdminRoute && !isAdminOrCoach) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register'],
};
