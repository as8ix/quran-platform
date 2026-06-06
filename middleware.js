import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Simple in-memory rate limiter for Edge
const rateLimitMap = new Map();

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    
    // 1. Basic Rate Limiting for Login
    if (pathname === '/api/auth/login') {
        const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
        const currentWindow = Math.floor(Date.now() / 60000); // 1 minute window
        const key = `${ip}-${currentWindow}`;
        
        const count = rateLimitMap.get(key) || 0;
        if (count >= 10) { // Max 10 attempts per minute
            return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
        }
        rateLimitMap.set(key, count + 1);
        
        // Prevent memory leak by removing old keys
        if (rateLimitMap.size > 1000) {
            for (const [k] of rateLimitMap) {
                const limitWindow = parseInt(k.split('-').pop(), 10);
                if (limitWindow < currentWindow) {
                    rateLimitMap.delete(k);
                }
            }
        }
        
        return NextResponse.next();
    }

    // 2. Protect API Routes (Except Auth Routes)
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
        }

        // Security Check: Verify JWT_SECRET is loaded at runtime (avoids crashing build step when not set in CI/CD)
        if (!process.env.JWT_SECRET) {
            console.error('FATAL: JWT_SECRET environment variable is not set. The application cannot start securely.');
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            
            // Pass user identity via headers to downstream API routes
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-user-id', payload.id.toString());
            requestHeaders.set('x-user-role', payload.role);
            requestHeaders.set('x-user-username', payload.username);

            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        } catch (error) {
            return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*'],
};
