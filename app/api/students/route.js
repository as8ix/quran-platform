import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Helper function to verify if a teacher is authorized to manage a student
async function checkTeacherAccess(teacherId, studentId) {
    const [halaqaAccess, eventAccess] = await Promise.all([
        prisma.student.findFirst({
            where: {
                id: studentId,
                halaqa: {
                    OR: [
                        { teacherId: teacherId },
                        { assistants: { some: { id: teacherId } } }
                    ]
                }
            },
            select: { id: true }
        }),
        prisma.eventAssignment.findFirst({
            where: {
                teacherId: teacherId,
                studentId: studentId
            },
            select: { id: true }
        })
    ]);

    return !!(halaqaAccess || eventAccess);
}

export async function GET(request) {
    try {
        const userId = parseInt(request.headers.get('x-user-id'));
        const role = request.headers.get('x-user-role');

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

        // Security Check (IDOR validation)
        if (role === 'STUDENT') {
            // Students can only view their own record
            if (id && parseInt(id) !== userId) {
                return NextResponse.json({ error: 'غير مصرح لك بالوصول لبيانات هذا الطالب' }, { status: 403 });
            }
            where.id = userId;
        } else if (role === 'TEACHER') {
            if (id) {
                const hasAccess = await checkTeacherAccess(userId, parseInt(id));
                if (!hasAccess) {
                    return NextResponse.json({ error: 'غير مصرح لك بالوصول لبيانات هذا الطالب' }, { status: 403 });
                }
                where.id = parseInt(id);
            } else if (teacherId) {
                if (parseInt(teacherId) !== userId) {
                    return NextResponse.json({ error: 'غير مصرح لك بالوصول لطلاب معلمين آخرين' }, { status: 403 });
                }
            } else if (halaqaId) {
                const parsedHalaqaId = parseInt(halaqaId);
                const isMyHalaqa = await prisma.halaqa.findFirst({
                    where: {
                        id: parsedHalaqaId,
                        OR: [
                            { teacherId: userId },
                            { assistants: { some: { id: userId } } }
                        ]
                    }
                });
                if (!isMyHalaqa) {
                    return NextResponse.json({ error: 'غير مصرح لك بالوصول لطلاب هذه الحلقة' }, { status: 403 });
                }
                where.halaqaId = parsedHalaqaId;
            } else {
                // Force filter to this teacher's students if no specific filter is provided
                return NextResponse.json({ error: 'يجب تحديد معرف المعلم أو الحلقة لتصفية الطلاب' }, { status: 400 });
            }
        } else if (role !== 'SUPERVISOR') {
            return NextResponse.json({ error: 'دور غير صالح' }, { status: 403 });
        }

        // Apply filters if authorized
        if (role === 'SUPERVISOR' || (role === 'TEACHER' && !id)) {
            if (id) {
                where.id = parseInt(id);
            } else if (teacherId) {
                const parsedTeacherId = parseInt(teacherId);
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
        }

        // Apply juzFilter
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
            familyId: true,
            family: {
                select: {
                    id: true,
                    name: true
                }
            },
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
            include: isFull ? { halaqa: true, khayrukumCertificates: true, family: { select: { id: true, name: true } } } : undefined,
            orderBy: { name: 'asc' }
        });

        // Remove passwords if full data is requested
        if (isFull) {
            students = students.map(student => {
                const { password, ...rest } = student;
                return rest;
            });
        }

        // Mark guests using pre-fetched data
        if (role === 'TEACHER' && teacherId) {
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
        const role = request.headers.get('x-user-role');
        if (role !== 'SUPERVISOR' && role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, username, password, hifzProgress, currentHifzSurahId, juzCount, reviewPlan, feeStatusTerm1, feeStatusTerm2, feeStatusSummer } = body;

        // Get next displayId
        const lastStudent = await prisma.student.findFirst({
            orderBy: { displayId: 'desc' }
        });
        const nextDisplayId = (lastStudent?.displayId || 0) + 1;

        const finalUsername = username && username.trim() !== '' 
            ? username 
            : `std_${nextDisplayId}_${Math.floor(Math.random() * 1000)}`;

        const hashedPassword = await bcrypt.hash(password || '123', 10);

        const newStudent = await prisma.student.create({
            data: {
                name,
                username: finalUsername,
                displayId: nextDisplayId,
                password: hashedPassword,
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
        const { password: _pw, ...studentWithoutPassword } = newStudent;
        return NextResponse.json(studentWithoutPassword);
    } catch (error) {
        console.error('Error creating student:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم آخر' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to create student' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const userId = parseInt(request.headers.get('x-user-id'));
        const role = request.headers.get('x-user-role');
        if (role !== 'SUPERVISOR' && role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { id, name, username, password, hifzProgress, currentHifzSurahId, juzCount, reviewPlan, halaqaId, feeStatusTerm1, feeStatusTerm2, feeStatusSummer } = body;

        if (!id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 });

        const targetStudentId = parseInt(id);

        // Security Check (IDOR validation): Verify teacher has access to the student
        if (role === 'TEACHER') {
            const hasAccess = await checkTeacherAccess(userId, targetStudentId);
            if (!hasAccess) {
                return NextResponse.json({ error: 'غير مصرح لك بتعديل بيانات هذا الطالب' }, { status: 403 });
            }
        }

        const updatedStudent = await prisma.student.update({
            where: { id: targetStudentId },
            data: {
                name,
                username,
                ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
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

        const { password: _pw, ...studentWithoutPassword } = updatedStudent;
        return NextResponse.json(studentWithoutPassword);
    } catch (error) {
        console.error("PUT Students Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const role = request.headers.get('x-user-role');
        const userId = parseInt(request.headers.get('x-user-id'));

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 });

        const studentId = parseInt(id);

        if (role === 'TEACHER') {
            const hasAccess = await checkTeacherAccess(userId, studentId);
            if (!hasAccess) {
                return NextResponse.json({ error: 'غير مصرح لك بحذف هذا الطالب' }, { status: 403 });
            }
        } else if (role !== 'SUPERVISOR') {
            return NextResponse.json({ error: 'Unauthorized: Only supervisors and authorized teachers can delete student records' }, { status: 403 });
        }

        // Delete all student relations in a transaction to prevent constraint errors and improve performance
        await prisma.$transaction([
            prisma.attendance.deleteMany({ where: { studentId } }),
            prisma.session.deleteMany({ where: { studentId } }),
            prisma.exam.deleteMany({ where: { studentId } }),
            prisma.notification.deleteMany({ where: { studentId } }),
            prisma.eventAssignment.deleteMany({ where: { studentId } }),
            prisma.studyPlanEntry.deleteMany({ where: { studentId } }),
            prisma.point.deleteMany({ where: { studentId } }),
            prisma.student.delete({ where: { id: studentId } })
        ]);

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error("DELETE Students Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
