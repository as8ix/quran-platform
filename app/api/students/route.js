import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const juzFilter = searchParams.get('juzFilter');
        const halaqaId = searchParams.get('halaqaId');
        const teacherId = searchParams.get('teacherId');
        const id = searchParams.get('id');

        let where = {};

        if (id) {
            where.id = parseInt(id);
        } else if (teacherId) {
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

        const isFull = searchParams.get('full') === 'true';
        const selectFields = isFull ? undefined : {
            id: true,
            displayId: true,
            name: true,
            username: true,
            hifzProgress: true,
            juzCount: true,
            dailyTargetPages: true,
            reviewPlan: true,
            halaqaId: true,
            halaqa: {
                select: {
                    id: true,
                    name: true,
                    logo: true,
                    pointsEnabled: true
                }
            }
        };

        let students = await prisma.student.findMany({
            where,
            select: selectFields,
            include: isFull ? { halaqa: true } : undefined,
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

            // Get all student IDs participating in any active event
            const allActiveEventAssignments = await prisma.eventAssignment.findMany({
                where: { event: { isActive: true } },
                select: { studentId: true }
            });
            const activeEventStudentIds = new Set(allActiveEventAssignments.map(a => a.studentId));

            students = students.map(student => {
                const isMyHalaqa = myHalaqaIds.includes(student.halaqaId);
                return {
                    ...student,
                    isEventGuest: !isMyHalaqa,
                    isSpecificallyAssigned: specificIds.includes(student.id),
                    isInActiveEvent: activeEventStudentIds.has(student.id)
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
        const { name, username, password, hifzProgress, currentHifzSurahId, juzCount, reviewPlan, feeStatusTerm1, feeStatusTerm2, feeStatusSummer } = body;

        // Get next displayId
        const lastStudent = await prisma.student.findFirst({
            orderBy: { displayId: 'desc' }
        });
        const nextDisplayId = (lastStudent?.displayId || 0) + 1;

        // Generate a default username if empty to avoid unique constraint conflict on empty strings
        const finalUsername = username && username.trim() !== '' 
            ? username 
            : `std_${nextDisplayId}_${Math.floor(Math.random() * 1000)}`;

        const newStudent = await prisma.student.create({
            data: {
                name,
                username: finalUsername,
                displayId: nextDisplayId,
                password: password || '123456', // Default password if empty
                hifzProgress: hifzProgress || 'الفاتحة',
                currentHifzSurahId: parseInt(currentHifzSurahId) || 1,
                juzCount: parseFloat(juzCount) || 0,
                reviewPlan,
                dailyTargetPages: parseFloat(body.dailyTargetPages) || 1.0,
                halaqa: body.halaqaId ? { connect: { id: parseInt(body.halaqaId) } } : undefined,
                phone: body.phone,
                parentPhone: body.parentPhone,
                parentPhone2: body.parentPhone2,
                nationalId: body.nationalId,
                nationality: body.nationality,
                studentNotes: body.studentNotes,
                feeStatusTerm1: feeStatusTerm1 || 'PENDING',
                feeStatusTerm2: feeStatusTerm2 || 'PENDING',
                feeStatusSummer: feeStatusSummer || 'PENDING',
                joinDate: body.joinDate ? new Date(body.joinDate) : undefined
            }
        });
        return NextResponse.json(newStudent);
    } catch (error) {
        console.error('Error creating student:', error);
        // Handle unique constraint error
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم آخر' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to create student' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, username, password, hifzProgress, currentHifzSurahId, juzCount, reviewPlan, halaqaId, feeStatusTerm1, feeStatusTerm2, feeStatusSummer } = body;

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
                halaqa: body.hasOwnProperty('halaqaId') ? (halaqaId ? { connect: { id: parseInt(halaqaId) } } : { disconnect: true }) : undefined,
                phone: body.phone,
                parentPhone: body.parentPhone,
                parentPhone2: body.parentPhone2,
                nationalId: body.nationalId,
                nationality: body.nationality,
                studentNotes: body.studentNotes,
                feeStatusTerm1: feeStatusTerm1,
                feeStatusTerm2: feeStatusTerm2,
                feeStatusSummer: feeStatusSummer,
                joinDate: body.joinDate ? new Date(body.joinDate) : undefined
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
