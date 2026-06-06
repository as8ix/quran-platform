import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { withCache } from '@/app/lib/cache';

export async function GET(request) {
    try {
        // SECURITY FIX (HIGH-06): Only supervisors can access platform-wide statistics
        const role = request.headers.get('x-user-role');
        if (role !== 'SUPERVISOR') {
            return NextResponse.json({ error: 'Unauthorized: Supervisor access required' }, { status: 403 });
        }

        // Cache the heavy aggregation logic for 5 minutes (300 seconds)
        const statsData = await withCache('supervisor_weekly_stats', async () => {
            // Calculate date 7 days ago
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0,0,0,0);

            const [
                inactiveStudentsRaw,
                halaqaStatsRaw,
                totalStudents,
                activeThisWeekCount,
                totalSessions,
                totalJuzAgg,
                juzCountsRaw,
                recentMilestonesRaw,
                topAchieversGroup
            ] = await Promise.all([
                prisma.student.findMany({
                    where: { sessions: { none: { date: { gte: sevenDaysAgo } } } },
                    select: { id: true, name: true, halaqa: { select: { name: true } } },
                    take: 10
                }),
                prisma.halaqa.findMany({
                    select: {
                        name: true,
                        students: {
                            select: {
                                sessions: {
                                    where: { date: { gte: sevenDaysAgo } },
                                    select: { pagesCount: true }
                                }
                            }
                        }
                    }
                }),
                prisma.student.count(),
                prisma.student.count({
                    where: { sessions: { some: { date: { gte: sevenDaysAgo } } } }
                }),
                prisma.session.count({
                    where: { date: { gte: sevenDaysAgo } }
                }),
                prisma.student.aggregate({
                    _sum: { juzCount: true }
                }),
                prisma.student.findMany({
                    select: { juzCount: true }
                }),
                prisma.session.findMany({
                    where: {
                        date: { gte: sevenDaysAgo },
                        pagesCount: { gte: 1 },
                        hifzSurah: { not: null }
                    },
                    select: { date: true, student: { select: { name: true } } },
                    orderBy: { date: 'desc' },
                    take: 5
                }),
                prisma.session.groupBy({
                    by: ['studentId'],
                    where: { date: { gte: sevenDaysAgo } },
                    _sum: { pagesCount: true },
                    _count: { id: true },
                    orderBy: { _sum: { pagesCount: 'desc' } },
                    take: 5
                })
            ]);

            // 1. Inactive Students
            const inactiveStudents = inactiveStudentsRaw.map(s => ({
                id: s.id,
                name: s.name,
                halaqaName: s.halaqa?.name || 'بدون حلقة'
            }));

            // 2. Top Achievers
            let topAchievers = [];
            if (topAchieversGroup.length > 0) {
                const topStudentIds = topAchieversGroup.map(t => t.studentId);
                const topStudents = await prisma.student.findMany({
                    where: { id: { in: topStudentIds } },
                    select: { id: true, name: true }
                });
                topAchievers = topAchieversGroup.map(t => ({
                    name: topStudents.find(s => s.id === t.studentId)?.name || 'غير معروف',
                    pages: t._sum.pagesCount || 0,
                    count: t._count.id
                }));
            }

            // 3. Halaqa Efficiency
            const halaqaStats = halaqaStatsRaw.map(h => {
                let sessionCount = 0;
                let totalPages = 0;
                h.students.forEach(student => {
                    sessionCount += student.sessions.length;
                    student.sessions.forEach(session => {
                        totalPages += (session.pagesCount || 0);
                    });
                });
                return {
                    name: h.name,
                    avgPages: sessionCount > 0 ? (totalPages / sessionCount).toFixed(1) : 0,
                    sessionCount: sessionCount
                };
            }).sort((a, b) => b.avgPages - a.avgPages);

            // 4. Progress Distribution
            const juzDistribution = {
                '0-5': 0,
                '5-15': 0,
                '15-29': 0,
                '30': 0
            };

            juzCountsRaw.forEach(s => {
                if (s.juzCount >= 30) juzDistribution['30']++;
                else if (s.juzCount >= 15) juzDistribution['15-29']++;
                else if (s.juzCount >= 5) juzDistribution['5-15']++;
                else juzDistribution['0-5']++;
            });

            // 5. Recent Milestones
            const recentMilestones = recentMilestonesRaw.map(s => ({
                studentName: s.student?.name,
                date: s.date
            }));

            return {
                inactiveStudents,
                topAchievers,
                halaqaStats,
                juzDistribution,
                recentMilestones,
                summary: {
                    totalStudents: totalStudents,
                    activeThisWeek: activeThisWeekCount,
                    inactiveCount: totalStudents - activeThisWeekCount,
                    totalSessions: totalSessions,
                    totalJuz: (totalJuzAgg._sum.juzCount || 0).toFixed(0)
                }
            };
        }, 300); // 300 seconds = 5 minutes

        return NextResponse.json(statsData);
    } catch (error) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }
}
