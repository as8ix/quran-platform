import { prisma } from '../../lib/prisma';
import { NextResponse } from 'next/server';
import { quranData } from '@/app/data/quranData';

// Helper function to verify if a teacher is authorized to manage a student's sessions
async function checkTeacherAccess(teacherId, studentId) {
    const isStudentInTeacherHalaqa = await prisma.student.findFirst({
        where: {
            id: studentId,
            halaqa: {
                OR: [
                    { teacherId: teacherId },
                    { assistants: { some: { id: teacherId } } }
                ]
            }
        }
    });

    if (isStudentInTeacherHalaqa) return true;

    const isStudentAssignedInEvent = await prisma.eventAssignment.findFirst({
        where: {
            teacherId: teacherId,
            studentId: studentId
        }
    });

    if (isStudentAssignedInEvent) return true;

    return false;
}

export async function GET(request) {
    try {
        const userId = parseInt(request.headers.get('x-user-id'));
        const role = request.headers.get('x-user-role');

        const { searchParams } = new URL(request.url);
        let studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
        }

        const targetStudentId = parseInt(studentId);

        // Security Check (HIGH-02): IDOR validation
        if (role === 'STUDENT') {
            if (userId !== targetStudentId) {
                return NextResponse.json({ error: 'غير مصرح لك بالوصول لبيانات هذا الطالب' }, { status: 403 });
            }
        } else if (role === 'TEACHER') {
            const hasAccess = await checkTeacherAccess(userId, targetStudentId);
            if (!hasAccess) {
                return NextResponse.json({ error: 'غير مصرح لك بالوصول لبيانات هذا الطالب' }, { status: 403 });
            }
        } else if (role !== 'SUPERVISOR') {
            return NextResponse.json({ error: 'دور غير صالح' }, { status: 403 });
        }

        const sessions = await prisma.session.findMany({
            where: {
                studentId: targetStudentId
            },
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json(sessions);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = parseInt(request.headers.get('x-user-id'));
        const role = request.headers.get('x-user-role');

        const body = await request.json();
        const {
            studentId,
            hifzSurah, hifzFromPage, hifzToPage, hifzFromAyah, hifzToAyah,
            murajaahFromSurah, murajaahFromAyah, murajaahToSurah, murajaahToAyah,
            minorMurajaahFromSurah, minorMurajaahFromAyah, minorMurajaahToSurah, minorMurajaahToAyah,
            pagesCount, resultString, notes, isFinishedSurah,
            errorsCount, alertsCount, cleanPagesCount,
            minorErrorsCount, minorAlertsCount, minorCleanPagesCount,
            hifzErrors, hifzAlerts, hifzCleanPages,
            quranicEventId
        } = body;

        const targetStudentId = parseInt(studentId);

        // Security Check (HIGH-02): Only TEACHER or SUPERVISOR can create sessions
        if (role === 'STUDENT') {
            return NextResponse.json({ error: 'غير مصرح للطلاب بتسجيل الجلسات' }, { status: 403 });
        } else if (role === 'TEACHER') {
            const hasAccess = await checkTeacherAccess(userId, targetStudentId);
            if (!hasAccess) {
                return NextResponse.json({ error: 'غير مصرح لك بتسجيل جلسة لهذا الطالب' }, { status: 403 });
            }
        } else if (role !== 'SUPERVISOR') {
            return NextResponse.json({ error: 'دور غير صالح' }, { status: 403 });
        }

        const session = await prisma.session.create({
            data: {
                studentId: targetStudentId,
                hifzSurah,
                hifzFromPage: hifzFromPage ? parseInt(hifzFromPage) : null,
                hifzToPage: hifzToPage ? parseInt(hifzToPage) : null,
                hifzFromAyah: hifzFromAyah ? parseInt(hifzFromAyah) : null,
                hifzToAyah: hifzToAyah ? parseInt(hifzToAyah) : null,
                murajaahFromSurah,
                murajaahFromAyah: murajaahFromAyah ? parseInt(murajaahFromAyah) : null,
                murajaahToSurah,
                murajaahToAyah: murajaahToAyah ? parseInt(murajaahToAyah) : null,
                minorMurajaahFromSurah,
                minorMurajaahFromAyah: minorMurajaahFromAyah ? parseInt(minorMurajaahFromAyah) : null,
                minorMurajaahToSurah,
                minorMurajaahToAyah: minorMurajaahToAyah ? parseInt(minorMurajaahToAyah) : null,
                pagesCount: parseFloat(pagesCount) || 0,
                resultString,
                notes,
                errorsCount: parseInt(errorsCount) || 0,
                alertsCount: parseInt(alertsCount) || 0,
                hifzErrors: parseInt(hifzErrors) || 0,
                hifzAlerts: parseInt(hifzAlerts) || 0,
                hifzCleanPages: parseFloat(hifzCleanPages) || 0,
                cleanPagesCount: parseFloat(cleanPagesCount) || 0,
                minorErrorsCount: parseInt(minorErrorsCount) || 0,
                minorAlertsCount: parseInt(minorAlertsCount) || 0,
                minorCleanPagesCount: parseFloat(minorCleanPagesCount) || 0,
                isGoalAchieved: body.isGoalAchieved || false,
                quranicEventId: quranicEventId ? parseInt(quranicEventId) : null,
                date: body.sessionDate ? new Date(body.sessionDate) : new Date()
            }
        });

        // Auto-match Session with StudyPlanEntries for this date
        try {
            const sessionDateObj = body.sessionDate ? new Date(body.sessionDate) : new Date();
            const startOfDay = new Date(sessionDateObj);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(sessionDateObj);
            endOfDay.setHours(23, 59, 59, 999);

            const todayPlanEntries = await prisma.studyPlanEntry.findMany({
                where: {
                    studentId: targetStudentId,
                    date: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            });

            for (const entry of todayPlanEntries) {
                let isMatch = false;

                if (entry.type === 'HIFZ' && hifzSurah) {
                    const planSurah = quranData.find(s => s.id === entry.surahId);
                    if (planSurah && (
                        hifzSurah.trim() === planSurah.name.trim() ||
                        hifzSurah.replace('سورة ', '').trim() === planSurah.name.trim()
                    )) {
                        isMatch = true;
                    }
                } else if (entry.type === 'MURAJAAH' && (murajaahFromSurah || minorMurajaahFromSurah)) {
                    isMatch = true;
                }

                if (isMatch) {
                    await prisma.studyPlanEntry.update({
                        where: { id: entry.id },
                        data: {
                            isCompleted: true,
                            actualDate: new Date(),
                            sessionId: session.id
                        }
                    });
                }
            }
        } catch (planError) {
            console.error("Auto-matching plan entry error:", planError);
        }

        console.log("Session created. isFinishedSurah:", isFinishedSurah);

        if (isFinishedSurah) {
            const student = await prisma.student.findUnique({ where: { id: targetStudentId } });
            if (student) {
                // Determine Next Surah
                let currentSurahId = student.currentHifzSurahId;
                let nextSurahId = null;

                if (currentSurahId === 1) {
                    nextSurahId = 114;
                } else if (currentSurahId === 2) {
                    await prisma.student.update({
                        where: { id: targetStudentId },
                        data: {
                            juzCount: 30, 
                            hifzProgress: "خاتم للقرآن الكريم"
                        }
                    });
                } else {
                    nextSurahId = (currentSurahId || 114) - 1;
                }

                if (nextSurahId) {
                    const nextSurah = quranData.find(s => s.id === nextSurahId);
                    if (nextSurah) {
                        await prisma.student.update({
                            where: { id: targetStudentId },
                            data: {
                                currentHifzSurahId: nextSurahId,
                                hifzProgress: nextSurah.name
                            }
                        });
                    }
                }
            }
        }

        return NextResponse.json(session);
    } catch (error) {
        console.error("Session Save Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const userId = parseInt(request.headers.get('x-user-id'));
        const role = request.headers.get('x-user-role');

        const body = await request.json();
        const { id, ...fields } = body;

        if (!id) return NextResponse.json({ error: 'Missing session id' }, { status: 400 });

        const session = await prisma.session.findUnique({
            where: { id: parseInt(id) }
        });

        if (!session) {
            return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 44 });
        }

        // Security Check (HIGH-02): Only TEACHER or SUPERVISOR can edit sessions
        if (role === 'STUDENT') {
            return NextResponse.json({ error: 'غير مصرح للطلاب بتعديل الجلسات' }, { status: 403 });
        } else if (role === 'TEACHER') {
            const hasAccess = await checkTeacherAccess(userId, session.studentId);
            if (!hasAccess) {
                return NextResponse.json({ error: 'غير مصرح لك بتعديل هذه الجلسة' }, { status: 403 });
            }
        } else if (role !== 'SUPERVISOR') {
            return NextResponse.json({ error: 'دور غير صالح' }, { status: 403 });
        }

        const updateData = {};
        if (fields.hifzSurah !== undefined)                updateData.hifzSurah = fields.hifzSurah;
        if (fields.hifzFromPage !== undefined)             updateData.hifzFromPage = fields.hifzFromPage ? parseInt(fields.hifzFromPage) : null;
        if (fields.hifzToPage !== undefined)               updateData.hifzToPage = fields.hifzToPage ? parseInt(fields.hifzToPage) : null;
        if (fields.hifzFromAyah !== undefined)             updateData.hifzFromAyah = fields.hifzFromAyah ? parseInt(fields.hifzFromAyah) : null;
        if (fields.hifzToAyah !== undefined)               updateData.hifzToAyah = fields.hifzToAyah ? parseInt(fields.hifzToAyah) : null;
        if (fields.murajaahFromSurah !== undefined)        updateData.murajaahFromSurah = fields.murajaahFromSurah;
        if (fields.murajaahFromAyah !== undefined)         updateData.murajaahFromAyah = fields.murajaahFromAyah ? parseInt(fields.murajaahFromAyah) : null;
        if (fields.murajaahToSurah !== undefined)          updateData.murajaahToSurah = fields.murajaahToSurah;
        if (fields.murajaahToAyah !== undefined)           updateData.murajaahToAyah = fields.murajaahToAyah ? parseInt(fields.murajaahToAyah) : null;
        if (fields.minorMurajaahFromSurah !== undefined)   updateData.minorMurajaahFromSurah = fields.minorMurajaahFromSurah;
        if (fields.minorMurajaahFromAyah !== undefined)    updateData.minorMurajaahFromAyah = fields.minorMurajaahFromAyah ? parseInt(fields.minorMurajaahFromAyah) : null;
        if (fields.minorMurajaahToSurah !== undefined)     updateData.minorMurajaahToSurah = fields.minorMurajaahToSurah;
        if (fields.minorMurajaahToAyah !== undefined)      updateData.minorMurajaahToAyah = fields.minorMurajaahToAyah ? parseInt(fields.minorMurajaahToAyah) : null;
        if (fields.pagesCount !== undefined)               updateData.pagesCount = parseFloat(fields.pagesCount) || 0;
        if (fields.resultString !== undefined)             updateData.resultString = fields.resultString;
        if (fields.notes !== undefined)                    updateData.notes = fields.notes;
        if (fields.errorsCount !== undefined)              updateData.errorsCount = parseInt(fields.errorsCount) || 0;
        if (fields.alertsCount !== undefined)              updateData.alertsCount = parseInt(fields.alertsCount) || 0;
        if (fields.cleanPagesCount !== undefined)          updateData.cleanPagesCount = parseFloat(fields.cleanPagesCount) || 0;
        if (fields.hifzErrors !== undefined)               updateData.hifzErrors = parseInt(fields.hifzErrors) || 0;
        if (fields.hifzAlerts !== undefined)               updateData.hifzAlerts = parseInt(fields.hifzAlerts) || 0;
        if (fields.hifzCleanPages !== undefined)           updateData.hifzCleanPages = parseFloat(fields.hifzCleanPages) || 0;
        if (fields.minorErrorsCount !== undefined)         updateData.minorErrorsCount = parseInt(fields.minorErrorsCount) || 0;
        if (fields.minorAlertsCount !== undefined)         updateData.minorAlertsCount = parseInt(fields.minorAlertsCount) || 0;
        if (fields.minorCleanPagesCount !== undefined)     updateData.minorCleanPagesCount = parseFloat(fields.minorCleanPagesCount) || 0;
        if (fields.isGoalAchieved !== undefined)           updateData.isGoalAchieved = fields.isGoalAchieved;
        if (fields.quranicEventId !== undefined)           updateData.quranicEventId = fields.quranicEventId ? parseInt(fields.quranicEventId) : null;

        const updated = await prisma.session.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Session Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const userId = parseInt(request.headers.get('x-user-id'));
        const role = request.headers.get('x-user-role');

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing session id' }, { status: 400 });

        const session = await prisma.session.findUnique({
            where: { id: parseInt(id) }
        });

        if (!session) {
            return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });
        }

        // Security Check (HIGH-02): Only TEACHER or SUPERVISOR can delete sessions
        if (role === 'STUDENT') {
            return NextResponse.json({ error: 'غير مصرح للطلاب بحذف الجلسات' }, { status: 403 });
        } else if (role === 'TEACHER') {
            const hasAccess = await checkTeacherAccess(userId, session.studentId);
            if (!hasAccess) {
                return NextResponse.json({ error: 'غير مصرح لك بحذف هذه الجلسة' }, { status: 403 });
            }
        } else if (role !== 'SUPERVISOR') {
            return NextResponse.json({ error: 'دور غير صالح' }, { status: 403 });
        }

        await prisma.session.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Session Delete Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
