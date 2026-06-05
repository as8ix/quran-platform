import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
    // SECURITY: This endpoint is strictly disabled in production.
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    try {
        const hashedPassword = await bcrypt.hash('123', 10);

        // 1. Create Supervisor
        const supervisor = await prisma.user.upsert({
            where: { username: 'supervisor' },
            update: {},
            create: {
                username: 'supervisor',
                password: hashedPassword,
                name: 'المشرف العام',
                role: 'SUPERVISOR',
            },
        });

        // 2. Create Teacher
        const teacher = await prisma.user.upsert({
            where: { username: 'bassam' },
            update: {},
            create: {
                username: 'bassam',
                password: hashedPassword,
                name: 'بسام فوزي حوذان',
                role: 'TEACHER',
            },
        });

        // 3. Create Halaqa
        const halaqa = await prisma.halaqa.upsert({
            where: { id: 5 },
            update: {},
            create: {
                id: 5,
                name: 'زيد بن ثابت',
                teacherId: teacher.id,
            },
        });

        // NOTE: Credentials are NOT returned in the response for security.
        return NextResponse.json({
            message: 'تم ملء قاعدة البيانات بنجاح! ✅ (بيئة التطوير فقط)',
            note: 'بيانات الاعتماد لا تُعرض هنا. استخدم: supervisor/123 و bassam/123'
        });

    } catch (error) {
        console.error('Seeding error:', error);
        return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
    }
}
