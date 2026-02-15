import { prisma } from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });

    try {
        console.log("Prisma keys in API:", Object.keys(prisma));
        const exams = await prisma.exam.findMany({
            where: { studentId: parseInt(studentId) },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(exams);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, status, examDate, examTime, notes } = body;

        const dataToUpdate = {};
        if (status) dataToUpdate.status = status;
        if (examDate !== undefined) dataToUpdate.examDate = examDate ? new Date(examDate) : null;
        if (examTime !== undefined) dataToUpdate.examTime = examTime;
        if (notes !== undefined) dataToUpdate.notes = notes;

        const exam = await prisma.exam.update({
            where: { id: parseInt(id) },
            data: dataToUpdate
        });

        return NextResponse.json(exam);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
