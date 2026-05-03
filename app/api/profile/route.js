import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, username, password } = body;

    if (!id) return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });

    // Check if username is taken by another user
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: parseInt(id) }
        }
      });
      if (existingUser) {
        return NextResponse.json({ error: 'اسم المستخدم محجوز مسبقاً، اختر اسماً آخر' }, { status: 400 });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (password) updateData.password = password;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Return user without password for security
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث البيانات' }, { status: 500 });
  }
}
