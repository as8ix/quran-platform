import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

        const assignments = await prisma.eventAssignment.findMany({
            where: { eventId: parseInt(eventId) },
            include: {
                teacher: { select: { id: true, name: true } },
                student: { select: { id: true, name: true } }
            }
        });

        return NextResponse.json(assignments);
    } catch (error) {
        console.error("GET Assignments Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId, teacherId, studentIds } = body;

        if (!eventId || !teacherId || !studentIds) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Transactions to ensure consistency
        const result = await prisma.$transaction(async (tx) => {
            // 1. Remove these students from any existing assignment in THIS event
            // (One student can only have one teacher per event in this logic)
            await tx.eventAssignment.deleteMany({
                where: {
                    eventId: parseInt(eventId),
                    studentId: { in: studentIds.map(id => parseInt(id)) }
                }
            });

            // 2. Create new assignments
            const creations = studentIds.map(sid => ({
                eventId: parseInt(eventId),
                teacherId: parseInt(teacherId),
                studentId: parseInt(sid)
            }));

            return await tx.eventAssignment.createMany({
                data: creations
            });
        });

        return NextResponse.json({ message: 'Assignments updated', result });
    } catch (error) {
        console.error("POST Assignments Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });

        await prisma.eventAssignment.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'Assignment removed' });
    } catch (error) {
        console.error("DELETE Assignment Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
