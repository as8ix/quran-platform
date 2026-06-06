import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const role = request.headers.get('x-user-role');
        if (role !== 'SUPERVISOR') {
            return NextResponse.json({ error: 'Unauthorized: Supervisor access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const timeRange = searchParams.get('timeRange') || 'week'; // week, month, all
        const halaqaId = searchParams.get('halaqaId');
        const type = searchParams.get('type') || 'pages'; // pages, mastery

        const sessionsWhere = { pagesCount: { gte: 1 } };

        if (timeRange === 'week') {
            const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0,0,0,0);
            sessionsWhere.date = { gte: d };
        } else if (timeRange === 'month') {
            const d = new Date(); d.setDate(d.getDate() - 30); d.setHours(0,0,0,0);
            sessionsWhere.date = { gte: d };
        }

        if (halaqaId && halaqaId !== 'all') {
            const students = await prisma.student.findMany({
                where: { halaqaId: parseInt(halaqaId) },
                select: { id: true }
            });
            sessionsWhere.studentId = { in: students.map(s => s.id) };
        }

        if (type === 'mastery') {
            sessionsWhere.errorsCount = 0;
            sessionsWhere.alertsCount = 0;
        }

        const topAchieversGroup = await prisma.session.groupBy({
            by: ['studentId'],
            where: sessionsWhere,
            _sum: { pagesCount: true },
            _count: { id: true },
            orderBy: { _sum: { pagesCount: 'desc' } },
            take: 10
        });

        let topAchievers = [];
        if (topAchieversGroup.length > 0) {
            const topStudentIds = topAchieversGroup.map(t => t.studentId);
            const topStudents = await prisma.student.findMany({
                where: { id: { in: topStudentIds } },
                select: { id: true, name: true, halaqa: { select: { name: true } } }
            });
            topAchievers = topAchieversGroup.map(t => {
                const s = topStudents.find(s => s.id === t.studentId);
                return {
                    id: t.studentId,
                    name: s?.name || 'غير معروف',
                    halaqaName: s?.halaqa?.name || 'بدون حلقة',
                    pages: t._sum.pagesCount || 0,
                    count: t._count.id
                };
            });
        }

        return NextResponse.json({ topAchievers });

    } catch (error) {
        console.error("Knights API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
