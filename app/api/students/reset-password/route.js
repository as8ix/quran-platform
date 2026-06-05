import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const role = request.headers.get('x-user-role');
    
    if (role !== 'SUPERVISOR' && role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized: You do not have permission to reset student passwords' }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, newPassword } = body;

    if (!studentId || !newPassword) {
      return NextResponse.json({ error: 'معرف الطالب وكلمة المرور الجديدة مطلوبان' }, { status: 400 });
    }

    const targetStudentId = parseInt(studentId);

    // Security Check (HIGH-03): Verify that the teacher has access to this student
    if (role === 'TEACHER') {
      const parsedUserId = parseInt(userId);
      
      const isStudentInTeacherHalaqa = await prisma.student.findFirst({
        where: {
          id: targetStudentId,
          halaqa: {
            OR: [
              { teacherId: parsedUserId },
              { assistants: { some: { id: parsedUserId } } }
            ]
          }
        }
      });

      const isStudentAssignedInEvent = await prisma.eventAssignment.findFirst({
        where: {
          teacherId: parsedUserId,
          studentId: targetStudentId
        }
      });

      if (!isStudentInTeacherHalaqa && !isStudentAssignedInEvent) {
        return NextResponse.json({ error: 'غير مصرح لك بإعادة تعيين كلمة مرور هذا الطالب' }, { status: 403 });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.student.update({
      where: { id: targetStudentId },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ message: 'تم إعادة تعيين كلمة المرور بنجاح' });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: 'فشل في إعادة تعيين كلمة المرور' }, { status: 500 });
  }
}
