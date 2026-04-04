import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '@/app/lib/prisma';

const execAsync = promisify(exec);

export async function GET() {
    // Only allow in development or for specific user roles (not implemented here for simplicity)
    
    let branch = 'unknown';
    let dbStatus = 'disconnected';
    
    try {
        const { stdout } = await execAsync('git branch --show-current');
        branch = stdout.trim();
    } catch (error) {
        branch = 'dev'; // Default for quran-platform dev branch
    }

    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (error) {
        dbStatus = 'error: ' + (error.message || 'connection failed');
    }

    return new Response(JSON.stringify({
        branch,
        dbStatus,
        provider: 'postgresql',
        database: 'Neon PostgreSQL'
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        }
    });
}
