import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Fetch attendance for a specific date OR a range
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const studentId = searchParams.get('studentId');
        
        let whereClause = {};

        if (studentId) {
            whereClause.studentId = parseInt(studentId);
        }

        if (date) {
            whereClause.date = new Date(date);
        } else if (startDate && endDate) {
            whereClause.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        } else if (!studentId) {
            return NextResponse.json({ error: 'Date, Range, or StudentId is required' }, { status: 400 });
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
            const savedRecords = [];
            
            // Use sequential execution instead of Promise.all to avoid exhausting connection pool
            for (const item of attendanceData) {
                const itemDate = new Date(item.date);

                const existing = await tx.attendance.findFirst({
                    where: {
                        studentId: item.studentId,
                        date: itemDate
                    }
                });

                if (existing) {
                    const updated = await tx.attendance.update({
                        where: { id: existing.id },
                        data: { status: item.status }
                    });
                    savedRecords.push(updated);
                } else {
                    const created = await tx.attendance.create({
                        data: {
                            studentId: item.studentId,
                            status: item.status,
                            date: itemDate
                        }
                    });
                    savedRecords.push(created);
                }
            }

            return savedRecords;
        });

        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
