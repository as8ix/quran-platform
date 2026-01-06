import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // 1. Create Supervisor
        const supervisor = await prisma.user.upsert({
            where: { username: 'supervisor' },
            update: { name: 'عبدالله' },
            create: {
                username: 'supervisor',
                password: '123',
                name: 'عبدالله',
                role: 'SUPERVISOR',
            },
        });

        // 2. Create Teacher
        const teacher = await prisma.user.upsert({
            where: { username: 'teacher' },
            update: {},
            create: {
                username: 'teacher',
                password: '123',
                name: 'المعلم محمد',
                role: 'TEACHER',
            },
        });

        // 3. Create Halaqa
        const halaqa = await prisma.halaqa.upsert({
            where: { id: 1 },
            update: {},
            create: {
                name: 'حلقة النور',
                teacherId: teacher.id,
            },
        });

        // 4. Create Students
        const studentsData = [
            { name: 'أحمد بن علي', username: 'ahmed', password: '123', hifzProgress: 'سورة البقرة', juzCount: 2, reviewPlan: 'نصف جزء يومياً', halaqaId: halaqa.id },
            { name: 'بدر العتيبي', username: 'bader', password: '123', hifzProgress: 'سورة الكهف', juzCount: 16, reviewPlan: 'جزء واحد يومياً', halaqaId: halaqa.id },
            { name: 'خالد محمد', username: 'khaled', password: '123', hifzProgress: 'جزء عم كامل', juzCount: 1, reviewPlan: 'سورتين يومياً', halaqaId: halaqa.id },
        ];

        const createdStudents = [];
        for (const s of studentsData) {
            const student = await prisma.student.upsert({
                where: { username: s.username },
                update: {},
                create: s,
            });
            createdStudents.push(student);
        }

        return NextResponse.json({
            message: 'Database seeded successfully! ✅',
            credentials: {
                supervisor: { username: 'supervisor', password: '123' },
                teacher: { username: 'teacher', password: '123' },
                students: createdStudents.map(s => ({ username: s.username, password: '123' }))
            }
        });

    } catch (error) {
        console.error('Seeding error:', error);
        return NextResponse.json({ error: 'Failed to seed database', details: error.message }, { status: 500 });
    }
}
