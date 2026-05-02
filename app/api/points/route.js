import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
