import { prisma } from '../../lib/prisma';
import { NextResponse } from 'next/server';
import { quranData } from '@/app/data/quranData';
// Refresh trigger for Prisma Client update

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
        }

        const sessions = await prisma.session.findMany({
            where: {
                studentId: parseInt(studentId)
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

        const session = await prisma.session.create({
            data: {
                studentId: parseInt(studentId),
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
                isFinishedSurah: isFinishedSurah || false,
                quranicEventId: quranicEventId ? parseInt(quranicEventId) : null,
                date: body.sessionDate ? new Date(body.sessionDate) : new Date()
            }
        });

        console.log("Session created. isFinishedSurah:", isFinishedSurah);

        // 1. ALWAYS Update Progress to the last recorded ToSurah/ToAyah
        const hifzToSurahIdNum = hifzSurah ? quranData.find(s => s.name === hifzSurah.replace('سورة ', '').trim())?.id : null;
        
        if (hifzToSurahIdNum) {
            await prisma.student.update({
                where: { id: parseInt(studentId) },
                data: {
                    currentHifzSurahId: hifzToSurahIdNum,
                    currentHifzAyah: hifzToAyah ? parseInt(hifzToAyah) : 1,
                }
            });
        }

        // 2. Handle Surah Completion Logic
        if (isFinishedSurah) {
            const student = await prisma.student.findUnique({ where: { id: parseInt(studentId) } });
            if (student) {
                const currentSurahId = Number(student.currentHifzSurahId);
                let nextSurahId = null;

                if (currentSurahId === 1) {
                    // Finished Fatiha, wrap to Nas (114)
                    nextSurahId = 114;
                } else if (currentSurahId === 2) {
                    // Finished Baqarah -> KHATIM (Stop here)
                    await prisma.student.update({
                        where: { id: parseInt(studentId) },
                        data: {
                            juzCount: 30,
                            hifzProgress: "خاتم للقرآن الكريم",
                            currentHifzSurahId: 2,
                            currentHifzAyah: 286 // Baqarah has 286 ayahs
                        }
                    });
                } else {
                    // Move to previous surah in reverse order
                    nextSurahId = (currentSurahId || 114) - 1;
                }

                if (nextSurahId) {
                    const nextSurah = quranData.find(s => s.id === nextSurahId);
                    if (nextSurah) {
                        await prisma.student.update({
                            where: { id: parseInt(studentId) },
                            data: {
                                currentHifzSurahId: nextSurahId,
                                currentHifzAyah: 1,
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
        const body = await request.json();
        const { id, ...fields } = body;

        if (!id) return NextResponse.json({ error: 'Missing session id' }, { status: 400 });

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
        if (fields.isFinishedSurah !== undefined)          updateData.isFinishedSurah = fields.isFinishedSurah;
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
        const { searchParams } = new URL(request.url);
        const idStr = searchParams.get('id');
        if (!idStr) return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
        
        const id = parseInt(idStr);
        console.log('Attempting to delete session:', id);

        // 1. Nullify any references in StudyPlanEntry to avoid potential constraints or logical orphans
        await prisma.studyPlanEntry.updateMany({
            where: { sessionId: id },
            data: { sessionId: null }
        });

        // 2. Delete the session (using deleteMany to avoid 404/P2025 error if already deleted)
        const result = await prisma.session.deleteMany({
            where: { id: id }
        });

        console.log('Session delete result:', result);

        if (result.count === 0) {
            // Already deleted or never existed, but we return success to the UI to stay in sync
            return NextResponse.json({ success: true, message: 'Already deleted' });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Session Delete Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
