import { prisma } from '../../lib/prisma';
import { NextResponse } from 'next/server';
import { quranData } from '@/app/data/quranData';

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
                quranicEventId: quranicEventId ? parseInt(quranicEventId) : null,
                date: body.sessionDate ? new Date(body.sessionDate) : new Date()
            }
        });

        /* EXAMS FEATURE DISABLED
        if (isFinishedSurah) {
             const student = await prisma.student.findUnique({ where: { id: parseInt(studentId) } });
            // ... Exam logic commented out ...
        }
        */

        // MOVED UPDATE LOGIC OUTSIDE OF COMMENTED EXAM BLOCK
        console.log("Session created. isFinishedSurah:", isFinishedSurah);

        if (isFinishedSurah) {
            const student = await prisma.student.findUnique({ where: { id: parseInt(studentId) } });
            if (student) {
                // Determine Next Surah
                let currentSurahId = student.currentHifzSurahId;

                if (currentSurahId <= 2) {
                    // Finished Baqarah (2) or Fatiha (1) -> KHATIM
                    // User requested to show Khatim immediately after Baqarah
                    await prisma.student.update({
                        where: { id: parseInt(studentId) },
                        data: {
                            juzCount: 31, // Special flag for Khatim
                            hifzProgress: "خاتم للقرآن الكريم"
                        }
                    });
                } else {
                    // Normal progression (descending order 114 -> 3)
                    let nextSurahId = currentSurahId - 1;

                    const nextSurah = quranData.find(s => s.id === nextSurahId);
                    if (nextSurah) {
                        const pagesMemorized = 605 - nextSurah.startPage;
                        let exactJuz = Math.floor(pagesMemorized / 20);
                        if (exactJuz > 30) exactJuz = 30;

                        await prisma.student.update({
                            where: { id: parseInt(studentId) },
                            data: {
                                currentHifzSurahId: nextSurahId,
                                hifzProgress: nextSurah.name,
                                juzCount: exactJuz
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
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing session id' }, { status: 400 });

        await prisma.session.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Session Delete Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
