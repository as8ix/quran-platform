import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Fetch attendance for a specific date OR a range
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let whereClause = {};

        if (date) {
            whereClause.date = new Date(date);
        } else if (startDate && endDate) {
            whereClause.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        } else {
            return NextResponse.json({ error: 'Date or Range (startDate, endDate) is required' }, { status: 400 });
        }

        const attendance = await prisma.attendance.findMany({
            where: whereClause
        });

        return NextResponse.json(attendance);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Save (Upsert) attendance
export async function POST(request) {
    try {
        const body = await request.json();
        const { attendanceData } = body; // Array of { studentId, status, date }

        // We use an interactive transaction to handle the find-then-update/create logic atomically
        const results = await prisma.$transaction(async (tx) => {
            const promises = attendanceData.map(async (item) => {
                const itemDate = new Date(item.date);

                const existing = await tx.attendance.findFirst({
                    where: {
                        studentId: item.studentId,
                        date: itemDate
                    }
                });

                if (existing) {
                    return tx.attendance.update({
                        where: { id: existing.id },
                        data: { status: item.status }
                    });
                } else {
                    return tx.attendance.create({
                        data: {
                            studentId: item.studentId,
                            status: item.status,
                            date: itemDate
                        }
                    });
                }
            });

            return Promise.all(promises);
        });

        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
