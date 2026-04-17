import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');

        const includeDetails = {
            teachers: true,
            sessions: {
                include: {
                    student: true
                }
            },
            assignments: {
                include: {
                    student: true,
                    teacher: true
                }
            }
        };

        if (!eventId) {
            const activeEvent = await prisma.quranicEvent.findFirst({
                where: { isActive: true },
                include: includeDetails
            });

            if (!activeEvent) {
                return NextResponse.json({ error: 'No active event found' }, { status: 404 });
            }
            return calculateStats(activeEvent);
        }

        const event = await prisma.quranicEvent.findUnique({
            where: { id: parseInt(eventId) },
            include: includeDetails
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
    const teachersList = event.teachers;
    const teachersCount = teachersList.length;
    const totalSessions = sessions.length;
    const assignments = event.assignments;

    // Participating Students (unique students in sessions)
    const participatingStudentIds = [...new Set(sessions.map(s => s.studentId))];
    const actualAttendance = participatingStudentIds.length;

    // Assigned Students (the total targeted group)
    const assignedStudents = assignments.map(a => a.student);
    const uniqueAssignedStudents = assignments.reduce((acc, current) => {
        const x = acc.find(item => item.studentId === current.studentId);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []).map(a => a.student);

    // Fetch full student data for session participants
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

    // Determine the pool for target calculation
    let targetStudentIds = new Set(uniqueAssignedStudents.map(s => s.id));
    
    // If open testing is enabled, we also consider everyone who actually showed up/recited
    if (event.allowOpenTesting) {
        participatingStudentIds.forEach(id => targetStudentIds.add(id));
    }

    // Fetch full data for the target pool to get their juzCount
    const targetPoolStudents = await prisma.student.findMany({
        where: { id: { in: Array.from(targetStudentIds) } }
    });

    targetPoolStudents.forEach(student => {
        const count = Math.min(30, Math.max(0, student.juzCount || 0));
        if (count > 0) {
            const startJuzIndex = 31 - count;
            const startPage = juzStartPages[startJuzIndex];
            totalTargetPages += (604 - startPage + 1);
        }
    });

    sessions.forEach(session => {
        totalAccomplishedPages += session.pagesCount || 0;
        totalCleanPages += session.cleanPagesCount || 0;
    });

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
    const goalAchievedCount = sessions.filter(s => s.isGoalAchieved).length;
    const goalAchievementRate = totalSessions > 0 ? (goalAchievedCount / totalSessions) * 100 : 0;

    // 3. Detailed Data for Export
    const studentStats = participatingStudentIds.map(sid => {
        const studentSessions = sessions.filter(s => s.studentId === sid);
        const student = sessionStudents.find(s => s.id === sid);
        const pages = studentSessions.reduce((sum, s) => sum + (s.pagesCount || 0), 0);
        const clean = studentSessions.reduce((sum, s) => sum + (s.cleanPagesCount || 0), 0);
        const quality = pages > 0 ? (clean / pages) * 100 : 0;
        const assignment = assignments.find(a => a.studentId === sid);

        return {
            id: sid,
            name: student?.name || 'مشارك',
            teacherName: assignment?.teacher?.name || 'غير محدد',
            pages: parseFloat(pages.toFixed(1)),
            quality: parseFloat(quality.toFixed(1)),
            sessionsCount: studentSessions.length,
            isGoalAchieved: studentSessions.every(s => s.isGoalAchieved)
        };
    });

    const sessionDetails = sessions.map(s => {
        const assignment = assignments.find(a => a.studentId === s.studentId);
        return {
            date: s.date,
            studentName: s.student?.name || 'مشارك',
            teacherName: assignment?.teacher?.name || 'غير محدد',
            pagesCount: s.pagesCount,
            cleanPages: s.cleanPagesCount,
            // Quality Metrics
            hifzErrors: s.hifzErrors || 0,
            hifzAlerts: s.hifzAlerts || 0,
            murajaahErrors: s.errorsCount || 0,
            murajaahAlerts: s.alertsCount || 0,
            minorMurajaahErrors: s.minorErrorsCount || 0,
            minorMurajaahAlerts: s.minorAlertsCount || 0,
            notes: s.notes || '-',
            isGoalAchieved: s.isGoalAchieved ? 'نعم' : 'لا'
        };
    });

    const mostReciting = [...studentStats].sort((a, b) => b.pages - a.pages).slice(0, 5);
    const bestQuality = [...studentStats].filter(s => s.pages >= 5).sort((a, b) => b.quality - a.quality).slice(0, 5);

    return NextResponse.json({
        eventName: event.name,
        general: {
            teachersCount,
            totalSessions,
            actualAttendance,
            assignedStudentsCount: uniqueAssignedStudents.length
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
            generalQualityRate: parseFloat(purityRate.toFixed(1))
        },
        topReciting: mostReciting,
        topQuality: bestQuality,
        exportData: {
            teachers: teachersList.map(t => ({ name: t.name, username: t.username })),
            students: studentStats,
            sessions: sessionDetails
        }
    });
}
