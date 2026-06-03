import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

        if (!attendanceData || attendanceData.length === 0) {
            return NextResponse.json([]);
        }

        // Get common date (assuming all records in the payload share the same date for attendance)
        const commonDate = new Date(attendanceData[0].date);
        const studentIds = attendanceData.map(item => item.studentId);

        // 1. Fetch all existing attendance records for these students on this date in ONE query
        const existingRecords = await prisma.attendance.findMany({
            where: {
                date: commonDate,
                studentId: { in: studentIds }
            }
        });

        const existingMap = new Map();
        existingRecords.forEach(record => existingMap.set(record.studentId, record.id));

        // 2. Prepare all create and update queries in memory
        const transactionQueries = attendanceData.map(item => {
            const existingId = existingMap.get(item.studentId);
            
            if (existingId) {
                // Prepare Update query
                return prisma.attendance.update({
                    where: { id: existingId },
                    data: { status: item.status }
                });
            } else {
                // Prepare Create query
                return prisma.attendance.create({
                    data: {
                        studentId: item.studentId,
                        status: item.status,
                        date: commonDate
                    }
                });
            }
        });

        // 3. Execute all queries atomically in a single database transaction using exactly ONE connection!
        // This is 100x faster than sequential queries and safe for Neon.
        const results = await prisma.$transaction(transactionQueries);

        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
