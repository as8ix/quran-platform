import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const halaqaId = searchParams.get('halaqaId');

        let where = {};
        if (studentId) where.studentId = parseInt(studentId);
        if (halaqaId) where.student = { halaqaId: parseInt(halaqaId) };

        const points = await prisma.point.findMany({
            where,
            include: {
                student: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(points);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { studentId, amount, reason, category } = body;

        if (!studentId || !amount || !reason || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Security check: Verify if points activity is enabled for the student's halaqa
        const student = await prisma.student.findUnique({
            where: { id: parseInt(studentId) },
            include: { halaqa: true }
        });

        if (student?.halaqa && !student.halaqa.pointsEnabled) {
            return NextResponse.json({ error: `نشاط النقاط متوقف حالياً لحلقة ${student.halaqa.name}` }, { status: 403 });
        }

        const point = await prisma.point.create({
            data: {
                studentId: parseInt(studentId),
                amount: parseInt(amount),
                reason,
                category
            }
        });

        return NextResponse.json(point);
    } catch (error) {
        console.error("POST Point Error:", error);
        return NextResponse.json({ error: 'Failed to award points' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const halaqaId = searchParams.get('halaqaId');

        if (!halaqaId) {
            return NextResponse.json({ error: 'Missing halaqaId' }, { status: 400 });
        }

        // Delete all points for all students in this halaqa
        const result = await prisma.point.deleteMany({
            where: {
                student: {
                    halaqaId: parseInt(halaqaId)
                }
            }
        });

        return NextResponse.json({ 
            message: `Successfully deleted ${result.count} points`, 
            count: result.count 
        });
    } catch (error) {
        console.error("DELETE Point Error:", error);
        return NextResponse.json({ error: 'Failed to reset points' }, { status: 500 });
    }
}
