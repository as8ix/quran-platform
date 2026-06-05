import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Unauthorized: Only supervisors can reset teacher passwords' }, { status: 403 });
    }

    const body = await request.json();
    const { teacherId, newPassword } = body;

    if (!teacherId || !newPassword) {
      return NextResponse.json({ error: 'معرف المعلم وكلمة المرور الجديدة مطلوبان' }, { status: 400 });
    }

    const targetTeacherId = parseInt(teacherId);

    // Verify that the target user exists and has the TEACHER role
    const targetUser = await prisma.user.findUnique({
      where: { id: targetTeacherId }
    });

    if (!targetUser || targetUser.role !== 'TEACHER') {
      return NextResponse.json({ error: 'المستخدم غير موجود أو ليس معلماً' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: targetTeacherId },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ message: 'تم إعادة تعيين كلمة المرور بنجاح' });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: 'فشل في إعادة تعيين كلمة المرور' }, { status: 500 });
  }
}
