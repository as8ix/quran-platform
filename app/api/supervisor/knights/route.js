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

        const sessionsWhere = {};

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

        // Fetch all matching sessions
        const sessions = await prisma.session.findMany({
            where: sessionsWhere,
            select: {
                studentId: true,
                pagesCount: true,
                hifzCleanPages: true,
                cleanPagesCount: true,
                minorCleanPagesCount: true,
            }
        });

        // Group by student in JS to allow complex summing
        const studentStats = {};
        sessions.forEach(s => {
            if (!studentStats[s.studentId]) {
                studentStats[s.studentId] = { studentId: s.studentId, totalPages: 0, totalCleanPages: 0, sessionCount: 0 };
            }
            studentStats[s.studentId].sessionCount += 1;
            studentStats[s.studentId].totalPages += (s.pagesCount || 0);
            studentStats[s.studentId].totalCleanPages += ((s.hifzCleanPages || 0) + (s.cleanPagesCount || 0) + (s.minorCleanPagesCount || 0));
        });

        let sortedAchievers = Object.values(studentStats);

        if (type === 'mastery') {
            sortedAchievers = sortedAchievers.filter(s => s.totalCleanPages > 0).sort((a, b) => b.totalCleanPages - a.totalCleanPages).slice(0, 10);
        } else {
            sortedAchievers = sortedAchievers.filter(s => s.totalPages > 0).sort((a, b) => b.totalPages - a.totalPages).slice(0, 10);
        }

        let topAchievers = [];
        if (sortedAchievers.length > 0) {
            const topStudentIds = sortedAchievers.map(t => t.studentId);
            const topStudents = await prisma.student.findMany({
                where: { id: { in: topStudentIds } },
                select: { id: true, name: true, halaqa: { select: { name: true } } }
            });
            topAchievers = sortedAchievers.map(t => {
                const s = topStudents.find(st => st.id === t.studentId);
                return {
                    id: t.studentId,
                    name: s?.name || 'غير معروف',
                    halaqaName: s?.halaqa?.name || 'بدون حلقة',
                    pages: parseFloat((type === 'mastery' ? t.totalCleanPages : t.totalPages).toFixed(1)),
                    count: t.sessionCount
                };
            });
        }

        return NextResponse.json({ topAchievers });

    } catch (error) {
        console.error("Knights API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
