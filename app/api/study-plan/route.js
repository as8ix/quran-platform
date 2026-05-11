
import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });

    try {
        const entries = await prisma.studyPlanEntry.findMany({
            where: { studentId: parseInt(studentId) },
            orderBy: { date: 'asc' }
        });
        return NextResponse.json(entries);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { studentId, entries } = body;
        console.log('API: Saving plan for student:', studentId, 'Entries count:', entries?.length);

        if (!studentId || !entries) {
            console.error('API: Missing data');
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // Delete existing plan first
        await prisma.studyPlanEntry.deleteMany({
            where: { studentId: parseInt(studentId) }
        });

        // Create new entries
        const mappedEntries = entries.map(e => {
            const sId = parseInt(e.surahId);
            const fA = parseInt(e.fromAyah);
            const tA = parseInt(e.toAyah);
            const tsId = e.toSurahId ? parseInt(e.toSurahId) : sId;
            const sIdNum = parseInt(studentId);

            if (isNaN(sId) || isNaN(fA) || isNaN(tA) || isNaN(sIdNum)) {
                console.error('API: Invalid numeric data in entry:', e);
                return null;
            }

            return {
                studentId: sIdNum,
                date: new Date(e.date),
                type: e.type,
                surahId: sId,
                fromAyah: fA,
                toAyah: tA,
                toSurahId: tsId,
                isCompleted: e.isCompleted || false,
                actualDate: e.actualDate ? new Date(e.actualDate) : null,
                sessionId: e.sessionId || null
            };
        }).filter(e => e !== null && !isNaN(e.date.getTime()));

        if (mappedEntries.length === 0) {
            return NextResponse.json({ error: 'No valid entries to save' }, { status: 400 });
        }

        const created = await prisma.studyPlanEntry.createMany({
            data: mappedEntries
        });

        return NextResponse.json({ success: true, count: created.count });
    } catch (error) {
        console.error('API Error in POST /api/study-plan:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, isCompleted, actualDate, sessionId } = body;

        const updated = await prisma.studyPlanEntry.update({
            where: { id: parseInt(id) },
            data: {
                isCompleted,
                actualDate: actualDate ? new Date(actualDate) : null,
                sessionId: sessionId || null
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });

    try {
        await prisma.studyPlanEntry.deleteMany({
            where: { studentId: parseInt(studentId) }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
