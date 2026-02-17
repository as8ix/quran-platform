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
            pagesCount, resultString, notes, isFinishedSurah,
            errorsCount, alertsCount, cleanPagesCount, quranicEventId,
            hifzErrors, hifzAlerts, hifzCleanPages
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
                pagesCount: parseFloat(pagesCount) || 0,
                resultString,
                notes,
                errorsCount: parseInt(errorsCount) || 0,
                alertsCount: parseInt(alertsCount) || 0,
                hifzErrors: parseInt(hifzErrors) || 0,
                hifzAlerts: parseInt(hifzAlerts) || 0,
                hifzCleanPages: parseInt(hifzCleanPages) || 0,
                cleanPagesCount: parseInt(cleanPagesCount) || 0,
                isGoalAchieved: body.isGoalAchieved || false,
                quranicEventId: quranicEventId ? parseInt(quranicEventId) : null,
                date: new Date()
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
                        const standardJuz = Math.floor((nextSurah.startPage - 1) / 20) + 1;
                        const reversedJuz = 31 - standardJuz;

                        await prisma.student.update({
                            where: { id: parseInt(studentId) },
                            data: {
                                currentHifzSurahId: nextSurahId,
                                hifzProgress: nextSurah.name,
                                juzCount: reversedJuz
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
