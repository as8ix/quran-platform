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

    // Assigned Students (the total targeted group)
    const assignedStudents = await prisma.student.findMany({
        where: {
            eventAssignments: { some: { eventId: event.id } }
        }
    });

    // Fetch full student data for session participants (for leaderboards etc)
    const sessionStudents = await prisma.student.findMany({
        where: { id: { in: participatingStudentIds } }
    });

    // 0. Precise Quran Logic for Targets
    const juzStartPages = [
        0, 1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
        202, 222, 242, 262, 282, 302, 322, 342, 362, 382,
        402, 422, 442, 462, 482, 502, 522, 542, 562, 582
    ];

    // 1. Achievements Logic
    let totalTargetPages = 0;
    let totalAccomplishedPages = 0;
    let totalCleanPages = 0;
    let totalKhatmats = 0;

    // Calculate Target: Sum of (juzCount * 20) for all students who participated
    // Calculate Target: Exact pages from Quran metadata
    assignedStudents.forEach(student => {
        const count = Math.min(30, Math.max(0, student.juzCount || 0));
        if (count > 0) {
            // Find start page of the earliest juz memorized (reverse order)
            // e.g. 1 juz = Juz 30 (page 582). 604 - 582 + 1 = 23 pages.
            // e.g. 30 juz = Juz 1 (page 1). 604 - 1 + 1 = 604 pages.
            const startJuzIndex = 31 - count;
            const startPage = juzStartPages[startJuzIndex];
            totalTargetPages += (604 - startPage + 1);
        } else {
            // If they have 0 juz but are assigned, we might count some minimum or skip
            // The user said "ask for their memorized portion", so if it's 0, target is 0.
        }
    });

    // Calculate Accomplished & Purity
    sessions.forEach(session => {
        totalAccomplishedPages += session.pagesCount || 0;
        totalCleanPages += session.cleanPagesCount || 0;
    });

    // Calculate Khatmats per student
    participatingStudentIds.forEach(sid => {
        const studentSessions = sessions.filter(s => s.studentId === sid);
        const student = sessionStudents.find(s => s.id === sid);
        const count = Math.min(30, Math.max(0, student?.juzCount || 0));

        if (student && count > 0) {
            const startJuzIndex = 31 - count;
            const startPage = juzStartPages[startJuzIndex];
            const studentFullPortionPages = (604 - startPage + 1);

            const studentTotalPages = studentSessions.reduce((sum, s) => sum + (s.pagesCount || 0), 0);
            totalKhatmats += studentTotalPages / studentFullPortionPages;
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
        const student = sessionStudents.find(s => s.id === sid);
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
