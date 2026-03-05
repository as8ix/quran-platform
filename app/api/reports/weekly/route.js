import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const teacherId = searchParams.get('teacherId');
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        if (!teacherId || !startDateStr || !endDateStr) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const startDate = new Date(startDateStr);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);

        // Find the teacher's halaqas
        const halaqas = await prisma.halaqa.findMany({
            where: {
                OR: [
                    { teacherId: parseInt(teacherId) },
                    { assistants: { some: { id: parseInt(teacherId) } } }
                ]
            },
            include: {
                students: {
                    include: {
                        attendance: {
                            where: {
                                date: {
                                    gte: startDate,
                                    lte: endDate
                                }
                            }
                        },
                        sessions: {
                            where: {
                                date: {
                                    gte: startDate,
                                    lte: endDate
                                }
                            }
                        }
                    }
                }
            }
        });

        // Combine all students from all matching halaqas (mostly 1)
        const allStudents = [];
        halaqas.forEach(h => {
            h.students.forEach(s => {
                // Avoid duplicates if a student is somehow in multiple halaqas
                if (!allStudents.some(stu => stu.id === s.id)) {
                    allStudents.push({ ...s, halaqaName: h.name });
                }
            });
        });

        return NextResponse.json(allStudents);
    } catch (error) {
        console.error("Weekly Report Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
