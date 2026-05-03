import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const halaqaId = searchParams.get('halaqaId');
        const teacherId = searchParams.get('teacherId');

        let where = {};
        if (studentId) where.studentId = parseInt(studentId);
        if (halaqaId) where.student = { halaqaId: parseInt(halaqaId) };
        
        if (teacherId) {
            // Find halaqas where this user is teacher or assistant
            const myHalaqas = await prisma.halaqa.findMany({
                where: {
                    OR: [
                        { teacherId: parseInt(teacherId) },
                        { assistants: { some: { id: parseInt(teacherId) } } }
                    ]
                },
                select: { id: true }
            });
            const myHalaqaIds = myHalaqas.map(h => h.id);

            // Find specific event assignments for this teacher
            const specificAssignments = await prisma.eventAssignment.findMany({
                where: {
                    teacherId: parseInt(teacherId),
                    event: { isActive: true }
                },
                select: { studentId: true }
            });
            const allowedStudentIds = specificAssignments.map(a => a.studentId);

            where.student = {
                OR: [
                    { halaqaId: { in: myHalaqaIds } },
                    { id: { in: allowedStudentIds } }
                ]
            };
        }

        const isAggregate = searchParams.get('aggregate') === 'true';

        if (isAggregate) {
            // Server-side aggregation for leaderboard
            const summary = await prisma.point.groupBy({
                by: ['studentId', 'category'],
                where,
                _sum: { amount: true },
                _count: { id: true }
            });

            // Get student names for the summary
            const students = await prisma.student.findMany({
                where: where.student || {},
                select: { id: true, name: true }
            });

            const studentMap = {};
            students.forEach(s => {
                studentMap[s.id] = { 
                    id: s.id, 
                    name: s.name, 
                    totalPoints: 0, 
                    scansCount: 0, 
                    categories: {} 
                };
            });

            summary.forEach(item => {
                if (studentMap[item.studentId]) {
                    studentMap[item.studentId].totalPoints += item._sum.amount;
                    studentMap[item.studentId].scansCount += item._count.id;
                    studentMap[item.studentId].categories[item.category] = item._sum.amount;
                }
            });

            const result = Object.values(studentMap).sort((a, b) => b.totalPoints - a.totalPoints);
            return NextResponse.json(result);
        }

        const points = await prisma.point.findMany({
            where,
            include: {
                student: {
                    select: { 
                        name: true,
                        halaqa: {
                            select: {
                                id: true,
                                teacherId: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100 // Keep the limit for regular history feed
        });

        return NextResponse.json(points);
    } catch (error) {
        console.error("GET Points Error:", error);
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
