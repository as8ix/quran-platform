
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

        if (!studentId || !entries) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

        // Delete existing plan first
        await prisma.studyPlanEntry.deleteMany({
            where: { studentId: parseInt(studentId) }
        });

        // Create new entries
        const created = await prisma.studyPlanEntry.createMany({
            data: entries.map(e => ({
                studentId: parseInt(studentId),
                date: new Date(e.date),
                type: e.type,
                surahId: e.surahId,
                fromAyah: e.fromAyah,
                toAyah: e.toAyah,
                isCompleted: e.isCompleted || false,
                actualDate: e.actualDate ? new Date(e.actualDate) : null,
                sessionId: e.sessionId || null
            }))
        });

        return NextResponse.json({ success: true, count: created.count });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
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
