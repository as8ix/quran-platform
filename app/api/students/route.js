import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const juzFilter = searchParams.get('juzFilter');
        const halaqaId = searchParams.get('halaqaId');
        const teacherId = searchParams.get('teacherId');
        const id = searchParams.get('id');

        let where = {};
        
        // Variables to store teacher context to avoid redundant queries later
        let myHalaqaIds = [];
        let specificIds = [];
        let activeEventStudentIds = new Set();

        if (id) {
            const parsedId = parseInt(id);
            if (isNaN(parsedId)) {
                return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
            }
            where.id = parsedId;
        } else if (teacherId) {
            const parsedTeacherId = parseInt(teacherId);
            if (isNaN(parsedTeacherId)) {
                return NextResponse.json({ error: 'Invalid teacher ID format' }, { status: 400 });
            }
            
            // Execute independent queries concurrently for better performance
            const [myHalaqas, activeEvents, specificAssignments, allActiveEventAssignments] = await Promise.all([
                prisma.halaqa.findMany({
                    where: {
                        OR: [
                            { teacherId: parsedTeacherId },
                            { assistants: { some: { id: parsedTeacherId } } }
                        ]
                    },
                    select: { id: true }
                }),
                prisma.quranicEvent.findMany({
                    where: { isActive: true, teachers: { some: { id: parsedTeacherId } } },
                    include: { assignments: true }
                }),
                prisma.eventAssignment.findMany({
                    where: { teacherId: parsedTeacherId, event: { isActive: true } },
                    select: { studentId: true }
                }),
                prisma.eventAssignment.findMany({
                    where: { event: { isActive: true } },
                    select: { studentId: true }
                })
            ]);

            myHalaqaIds = myHalaqas.map(h => h.id);
            specificIds = specificAssignments.map(a => a.studentId);
            activeEventStudentIds = new Set(allActiveEventAssignments.map(a => a.studentId));

            let allowedStudentIds = [...specificIds];

            // If event allows open testing, include ALL students from that event
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
            const parsedHalaqaId = parseInt(halaqaId);
            if (isNaN(parsedHalaqaId)) {
                return NextResponse.json({ error: 'Invalid halaqa ID format' }, { status: 400 });
            }
            where.halaqaId = parsedHalaqaId;
        }

        // Apply juzFilter if it's on top of teacher/halaqa filters
        if (juzFilter) {
            const juzWhere = {};
            if (juzFilter === 'less5') juzWhere.lt = 5;
            else if (juzFilter === '5-15') { juzWhere.gte = 5; juzWhere.lte = 15; }
            else if (juzFilter === '15-30') juzWhere.gt = 15;

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
            currentHifzSurahId: true,
            juzCount: true,
            dailyTargetPages: true,
            reviewPlan: true,
            halaqaId: true,
            nationalId: true,
            phone: true,
            parentPhone: true,
            parentPhone2: true,
            nationality: true,
            studentNotes: true,
            feeStatusSummer: true,
            feeStatusTerm1: true,
            feeStatusTerm2: true,
            joinDate: true,
            halaqa: {
                select: {
                    id: true,
                    name: true,
                    logo: true,
                    pointsEnabled: true,
                    teacherId: true,
                    assistants: { select: { id: true } }
                }
            },
            khayrukumCertificates: {
                select: {
                    branchNumber: true
                }
            }
        };

        let students = await prisma.student.findMany({
            where,
            select: selectFields,
            include: isFull ? { halaqa: true, khayrukumCertificates: true } : undefined,
            orderBy: { name: 'asc' }
        });

        // Mark guests instantly using pre-fetched data
        if (teacherId) {
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
                password: password || '123', // Default password if empty
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

        const studentId = parseInt(id);

        // Delete all student relations to prevent constraint errors
        await prisma.attendance.deleteMany({ where: { studentId } });
        await prisma.session.deleteMany({ where: { studentId } });
        await prisma.exam.deleteMany({ where: { studentId } });
        await prisma.notification.deleteMany({ where: { studentId } });
        await prisma.eventAssignment.deleteMany({ where: { studentId } });
        await prisma.studyPlanEntry.deleteMany({ where: { studentId } });
        await prisma.point.deleteMany({ where: { studentId } });

        await prisma.student.delete({
            where: { id: studentId }
        });

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error("DELETE Students Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
