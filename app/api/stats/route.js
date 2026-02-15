import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const [studentsCount, teachersCount, halaqatCount, students] = await Promise.all([
            prisma.student.count(),
            prisma.user.count({ where: { role: 'TEACHER' } }),
            prisma.halaqa.count(),
            prisma.student.findMany({
                select: { juzCount: true }
            })
        ]);

        const totalJuz = students.reduce((sum, s) => sum + (s.juzCount || 0), 0);

        return NextResponse.json({
            studentsCount,
            teachersCount,
            totalJuz: Number(totalJuz.toFixed(1)),
            halaqatCount
        });
    } catch (error) {
        console.error('Stats API Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
