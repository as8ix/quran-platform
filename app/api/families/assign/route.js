import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Helper to verify teacher access to a specific Halaqa
async function checkHalaqaAccess(userId, role, halaqaId) {
    if (role === 'SUPERVISOR') return true;
    if (role === 'TEACHER') {
        const myHalaqa = await prisma.halaqa.findFirst({
            where: {
                id: parseInt(halaqaId),
                OR: [
                    { teacherId: userId },
                    { assistants: { some: { id: userId } } }
                ]
            },
            select: { id: true }
        });
        return !!myHalaqa;
    }
    return false;
}

export async function POST(request) {
    try {
        const userId = parseInt(request.headers.get('x-user-id'));
        const role = request.headers.get('x-user-role');

        const body = await request.json();
        const { assignments, halaqaId } = body; // Map: { "studentId": familyId | null }

        if (!assignments || !halaqaId) {
            return NextResponse.json({ error: 'assignments and halaqaId required' }, { status: 400 });
        }

        const isAuthorized = await checkHalaqaAccess(userId, role, halaqaId);
        if (!isAuthorized) {
            return NextResponse.json({ error: 'غير مصرح لك بتوزيع طلاب هذه الحلقة' }, { status: 403 });
        }

        // Validate that all students belong to the halaqa
        const studentIds = Object.keys(assignments).map(id => parseInt(id));
        const students = await prisma.student.findMany({
            where: {
                id: { in: studentIds },
                halaqaId: parseInt(halaqaId)
            },
            select: { id: true }
        });

        const validStudentIds = new Set(students.map(s => s.id));
        const finalAssignments = {};
        
        // Only include assignments for students that actually belong to this halaqa
        Object.entries(assignments).forEach(([studentId, familyId]) => {
            const parsedStudentId = parseInt(studentId);
            if (validStudentIds.has(parsedStudentId)) {
                finalAssignments[parsedStudentId] = familyId;
            }
        });

        // Run batch updates in a Prisma transaction
        const updatePromises = Object.entries(finalAssignments).map(([studentId, familyId]) => {
            return prisma.student.update({
                where: { id: parseInt(studentId) },
                data: {
                    familyId: familyId ? parseInt(familyId) : null
                }
            });
        });

        await prisma.$transaction(updatePromises);

        return NextResponse.json({ message: 'تم حفظ توزيع الطلاب بنجاح' });
    } catch (error) {
        console.error("POST Assign Family Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
