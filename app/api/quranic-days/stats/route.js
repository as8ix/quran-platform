import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            // Default to the first active event if none specified
            const activeEvent = await prisma.quranicEvent.findFirst({
                where: { isActive: true },
                include: {
                    teachers: true,
                    sessions: {
                        include: {
                            student: true
                        }
                    }
                }
            });

            if (!activeEvent) {
                return NextResponse.json({ error: 'No active event found' }, { status: 404 });
            }
            return calculateStats(activeEvent);
        }

        const event = await prisma.quranicEvent.findUnique({
            where: { id: parseInt(eventId) },
            include: {
                teachers: true,
                sessions: {
                    include: {
                        student: true
                    }
                }
            }
        });

        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        return calculateStats(event);
    } catch (error) {
        console.error("GET Quranic Stats Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function calculateStats(event) {
    const sessions = event.sessions;
    const teachersCount = event.teachers.length;
    const totalSessions = sessions.length;

    // Participating Students (unique students in sessions)
    const participatingStudentIds = [...new Set(sessions.map(s => s.studentId))];
    const actualAttendance = participatingStudentIds.length;

    // Fetch full student data for these students to get their juzCount
    const students = await prisma.student.findMany({
        where: { id: { in: participatingStudentIds } }
    });

    // 1. Achievements Logic
    let totalTargetPages = 0;
    let totalAccomplishedPages = 0;
    let totalCleanPages = 0;
    let totalKhatmats = 0;

    // Calculate Target: Sum of (juzCount * 20) for all students who participated
    students.forEach(student => {
        totalTargetPages += (student.juzCount || 1) * 20; // Default to 1 juz if 0 for target calc
    });

    // Calculate Accomplished & Purity
    sessions.forEach(session => {
        totalAccomplishedPages += session.pagesCount || 0;
        totalCleanPages += session.cleanPagesCount || 0;
    });

    // Calculate Khatmats per student
    participatingStudentIds.forEach(sid => {
        const studentSessions = sessions.filter(s => s.studentId === sid);
        const student = students.find(s => s.id === sid);
        if (student && student.juzCount > 0) {
            const studentTotalPages = studentSessions.reduce((sum, s) => sum + (s.pagesCount || 0), 0);
            totalKhatmats += studentTotalPages / (student.juzCount * 20);
        }
    });

    // 2. Rates Logic
    const purityRate = totalAccomplishedPages > 0 ? (totalCleanPages / totalAccomplishedPages) * 100 : 0;
    const achievementRate = totalTargetPages > 0 ? (totalAccomplishedPages / totalTargetPages) * 100 : 0;

    // Goal Achievement Rate: sessions where isGoalAchieved is true
    const goalAchievedCount = sessions.filter(s => s.isGoalAchieved).length;
    const goalAchievementRate = totalSessions > 0 ? (goalAchievedCount / totalSessions) * 100 : 0;

    // 3. Top 5 Most Reciting
    const studentStats = participatingStudentIds.map(sid => {
        const studentSessions = sessions.filter(s => s.studentId === sid);
        const student = students.find(s => s.id === sid);
        const pages = studentSessions.reduce((sum, s) => sum + (s.pagesCount || 0), 0);
        const clean = studentSessions.reduce((sum, s) => sum + (s.cleanPagesCount || 0), 0);
        const quality = pages > 0 ? (clean / pages) * 100 : 0;

        return {
            id: sid,
            name: student?.name || 'مشارك',
            pages: parseFloat(pages.toFixed(1)),
            quality: parseFloat(quality.toFixed(1))
        };
    });

    const mostReciting = [...studentStats].sort((a, b) => b.pages - a.pages).slice(0, 5);
    const bestQuality = [...studentStats].filter(s => s.pages >= 5).sort((a, b) => b.quality - a.quality).slice(0, 5);

    return NextResponse.json({
        eventName: event.name,
        general: {
            teachersCount,
            totalSessions,
            actualAttendance
        },
        achievements: {
            target: totalTargetPages,
            accomplished: parseFloat(totalAccomplishedPages.toFixed(1)),
            purity: totalCleanPages,
            khatmats: parseFloat(totalKhatmats.toFixed(1))
        },
        rates: {
            purityRate: parseFloat(purityRate.toFixed(1)),
            achievementRate: parseFloat(achievementRate.toFixed(1)),
            goalAchievementRate: parseFloat(goalAchievementRate.toFixed(1)),
            generalQualityRate: parseFloat(purityRate.toFixed(1)) // Using purity as general quality
        },
        topReciting: mostReciting,
        topQuality: bestQuality
    });
}
