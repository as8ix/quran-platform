import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // 1. Create Supervisor (البيانات الحقيقية)
        const supervisor = await prisma.user.upsert({
            where: { username: 'supervisor' },
            update: {},
            create: {
                username: 'supervisor',
                password: '123',
                name: 'المشرف العام',
                role: 'SUPERVISOR',
            },
        });

        // 2. Create Teacher (البيانات الحقيقية)
        const teacher = await prisma.user.upsert({
            where: { username: 'bassam' },
            update: {},
            create: {
                username: 'bassam',
                password: '123',
                name: 'بسام فوزي حوذان',
                role: 'TEACHER',
            },
        });

        // 3. Create Halaqa (البيانات الحقيقية)
        const halaqa = await prisma.halaqa.upsert({
            where: { id: 5 },
            update: {},
            create: {
                id: 5,
                name: 'زيد بن ثابت',
                teacherId: teacher.id,
            },
        });

        return NextResponse.json({
            message: 'تم ملء قاعدة البيانات بالبيانات الحقيقية بنجاح! ✅',
            credentials: {
                supervisor: { username: 'supervisor', password: '123', name: 'المشرف العام' },
                teacher: { username: 'bassam', password: '123', name: 'بسام فوزي حوذان' },
                halaqa: { name: 'زيد بن ثابت' }
            },
            note: 'يمكنك الآن إضافة الطلاب من لوحة المعلم'
        });

    } catch (error) {
        console.error('Seeding error:', error);
        return NextResponse.json({ error: 'Failed to seed database', details: error.message }, { status: 500 });
    }
}
