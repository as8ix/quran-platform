import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
    // SECURITY: Disabled in production — exposes infra details and runs shell commands.
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    // Only reachable in development:
    let dbStatus = 'disconnected';
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (error) {
        dbStatus = 'error';
    }

    return NextResponse.json({
        dbStatus,
        provider: 'postgresql',
        env: process.env.NODE_ENV
    }, {
        headers: { 'Cache-Control': 'no-store' }
    });
}
