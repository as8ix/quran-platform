import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const juzFilter = searchParams.get('juzFilter');
        const halaqaId = searchParams.get('halaqaId');
        const teacherId = searchParams.get('teacherId');

        let where = {};

        if (teacherId) {
            // Find halaqas for this teacher
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

            // Find active events where this teacher is participating
            const activeEvents = await prisma.quranicEvent.findMany({
                where: {
                    isActive: true,
                    teachers: { some: { id: parseInt(teacherId) } }
                },
                include: {
                    assignments: true
                }
            });

            // Collect student IDs:
            // 1. Specifically assigned to this teacher
            const specificAssignments = await prisma.eventAssignment.findMany({
                where: {
                    teacherId: parseInt(teacherId),
                    event: { isActive: true }
                },
                select: { studentId: true }
            });
            let allowedStudentIds = specificAssignments.map(a => a.studentId);

            // 2. If event allows open testing, include ALL students from that event
            activeEvents.forEach(event => {
                if (event.allowOpenTesting) {
                    const eventStudentIds = event.assignments.map(a => a.studentId);
                    allowedStudentIds = [...new Set([...allowedStudentIds, ...eventStudentIds])];
                }
            });

            where.OR = [
                { halaqaId: { in: myHalaqaIds } },
                { id: { in: allowedStudentIds } }
            ];
        } else if (halaqaId) {
            where.halaqaId = parseInt(halaqaId);
        }

        // Apply juzFilter if it's on top of teacher/halaqa filters
        if (juzFilter) {
            const juzWhere = {};
            if (juzFilter === 'less5') juzWhere.lt = 5;
            else if (juzFilter === '5-15') { juzWhere.gte = 5; juzWhere.lte = 15; }
            else if (juzFilter === '15-30') juzWhere.gt = 15;

            // If we already have an OR from teacherId, we must apply juzFilter to each branch or use AND
            if (where.OR) {
                where = {
                    AND: [
                        { OR: where.OR },
                        { juzCount: juzWhere }
                    ]
                };
            } else {
                where.juzCount = juzWhere;
            }
        }

        let students = await prisma.student.findMany({
            where,
            include: {
                halaqa: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        // If teacherId was used, mark guests
        if (teacherId) {
            // Re-fetch teacher halaqas to be sure
            const halaqas = await prisma.halaqa.findMany({
                where: {
                    OR: [
                        { teacherId: parseInt(teacherId) },
                        { assistants: { some: { id: parseInt(teacherId) } } }
                    ]
                },
                select: { id: true }
            });
            const myHalaqaIds = halaqas.map(h => h.id);

            // Get specifically assigned IDs again for marking
            const specificAssignments = await prisma.eventAssignment.findMany({
                where: {
                    teacherId: parseInt(teacherId),
                    event: { isActive: true }
                },
                select: { studentId: true }
            });
            const specificIds = specificAssignments.map(a => a.studentId);

            students = students.map(student => {
                const isMyHalaqa = myHalaqaIds.includes(student.halaqaId);
                return {
                    ...student,
                    isEventGuest: !isMyHalaqa,
                    isSpecificallyAssigned: specificIds.includes(student.id)
                };
            });
        }

        return NextResponse.json(students);
    } catch (error) {
        console.error("GET Students Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, username, password, hifzProgress, currentHifzSurahId, juzCount, reviewPlan } = body;

        const newStudent = await prisma.student.create({
            data: {
                name,
                username,
                password,
                hifzProgress,
                currentHifzSurahId: parseInt(currentHifzSurahId) || 1,
                juzCount: parseInt(juzCount) || 0,
                reviewPlan,
                dailyTargetPages: parseFloat(body.dailyTargetPages) || 1.0,
                halaqaId: body.halaqaId ? parseInt(body.halaqaId) : null
            }
        });

        return NextResponse.json(newStudent);
    } catch (error) {
        console.error("POST Students Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, username, password, hifzProgress, currentHifzSurahId, juzCount, reviewPlan, halaqaId } = body;

        if (!id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 });

        const updatedStudent = await prisma.student.update({
            where: { id: parseInt(id) },
            data: {
                name,
                username,
                password,
                hifzProgress,
                currentHifzSurahId: parseInt(currentHifzSurahId) || 1,
                juzCount: parseInt(juzCount) || 0,
                reviewPlan,
                dailyTargetPages: parseFloat(body.dailyTargetPages) || 1.0,
                halaqaId: halaqaId ? parseInt(halaqaId) : null
            }
        });

        return NextResponse.json(updatedStudent);
    } catch (error) {
        console.error("PUT Students Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 });

        // First delete related records (Attendance, Sessions)
        // Or if we had cascade delete, we could just delete student.
        // Let's manually delete for safety if not defined in schema (though usually prisma handles generic cascade if defined, but SQLite is picky).

        await prisma.attendance.deleteMany({ where: { studentId: parseInt(id) } });
        await prisma.session.deleteMany({ where: { studentId: parseInt(id) } });

        await prisma.student.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error("DELETE Students Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
