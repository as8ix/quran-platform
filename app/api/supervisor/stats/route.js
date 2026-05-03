import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Calculate date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0,0,0,0);

        const [
            allStudents,
            weeklySessions,
            halaqas
        ] = await Promise.all([
            prisma.student.findMany({
                select: { id: true, name: true, halaqaId: true, juzCount: true }
            }),
            prisma.session.findMany({
                where: { date: { gte: sevenDaysAgo } },
                include: { student: { select: { name: true } } }
            }),
            prisma.halaqa.findMany({
                select: { id: true, name: true }
            })
        ]);

        // 1. Inactive Students (No sessions in the last 7 days)
        const studentIdsWithSessions = new Set(weeklySessions.map(s => s.studentId));
        const inactiveStudents = allStudents
            .filter(s => !studentIdsWithSessions.has(s.id))
            .map(s => ({
                id: s.id,
                name: s.name,
                halaqaName: halaqas.find(h => h.id === s.halaqaId)?.name || 'بدون حلقة'
            }))
            .slice(0, 10); // Show top 10 inactive

        // 2. Top Achievers by Pages Count
        const studentProgress = {};
        weeklySessions.forEach(s => {
            if (!studentProgress[s.studentId]) {
                studentProgress[s.studentId] = { name: s.student?.name, pages: 0, count: 0 };
            }
            studentProgress[s.studentId].pages += (s.pagesCount || 0);
            studentProgress[s.studentId].count += 1;
        });

        const topAchievers = Object.values(studentProgress)
            .sort((a, b) => b.pages - a.pages)
            .slice(0, 5);

        // 3. Halaqa Efficiency (Avg pages per session)
        const halaqaStats = halaqas.map(h => {
            const hSessions = weeklySessions.filter(s => {
                const student = allStudents.find(st => st.id === s.studentId);
                return student?.halaqaId === h.id;
            });
            const totalPages = hSessions.reduce((acc, s) => acc + (s.pagesCount || 0), 0);
            return {
                name: h.name,
                avgPages: hSessions.length > 0 ? (totalPages / hSessions.length).toFixed(1) : 0,
                sessionCount: hSessions.length
            };
        }).sort((a, b) => b.avgPages - a.avgPages);

        // 4. Progress Distribution (Memorization Stats)
        const juzDistribution = {
            '0-5': 0,
            '5-15': 0,
            '15-29': 0,
            '30': 0
        };

        let totalJuz = 0;
        allStudents.forEach(s => {
            totalJuz += s.juzCount;
            if (s.juzCount >= 30) juzDistribution['30']++;
            else if (s.juzCount >= 15) juzDistribution['15-29']++;
            else if (s.juzCount >= 5) juzDistribution['5-15']++;
            else juzDistribution['0-5']++;
        });

        // 5. Recent Milestones (Finished a Juz this week)
        // We assume a milestone is a session where juzCount was updated or just a high-quality session
        const recentMilestones = weeklySessions
            .filter(s => s.type === 'MEMORIZATION' && s.pagesCount >= 1) // Simple heuristic
            .slice(0, 5)
            .map(s => ({
                studentName: s.student?.name,
                date: s.date
            }));

        return NextResponse.json({
            inactiveStudents,
            topAchievers,
            halaqaStats,
            juzDistribution,
            recentMilestones,
            summary: {
                totalStudents: allStudents.length,
                activeThisWeek: studentIdsWithSessions.size,
                inactiveCount: allStudents.length - studentIdsWithSessions.size,
                totalSessions: weeklySessions.length,
                totalJuz: totalJuz.toFixed(0)
            }
        });
    } catch (error) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }
}
