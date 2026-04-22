import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(request, context) {
    try {
        const params = await context.params;
        const id = parseInt(params.id);
        const body = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
        }

        const {
            hifzSurah, hifzFromPage, hifzToPage, hifzFromAyah, hifzToAyah,
            murajaahFromSurah, murajaahFromAyah, murajaahToSurah, murajaahToAyah,
            minorMurajaahFromSurah, minorMurajaahFromAyah, minorMurajaahToSurah, minorMurajaahToAyah,
            pagesCount, resultString, notes,
            errorsCount, alertsCount, cleanPagesCount,
            minorErrorsCount, minorAlertsCount, minorCleanPagesCount,
            hifzErrors, hifzAlerts, hifzCleanPages,
            isGoalAchieved, sessionDate
        } = body;

        const session = await prisma.session.update({
            where: { id },
            data: {
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
                isGoalAchieved,
                ...(sessionDate && { date: new Date(sessionDate) })
            }
        });

        return NextResponse.json(session);
    } catch (error) {
        console.error("Session Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, context) {
    try {
        const params = await context.params;
        const id = parseInt(params.id);
        
        if (!id) {
            return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
        }

        await prisma.session.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Session Delete Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
