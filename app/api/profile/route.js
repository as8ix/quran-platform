import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function PUT(request) {
  try {
    // SECURITY FIX (HIGH-01): Always use the authenticated user's ID from the JWT token.
    // Never trust an ID supplied in the request body — that's an IDOR vulnerability.
    const authenticatedUserId = parseInt(request.headers.get('x-user-id'));
    if (!authenticatedUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, username, password } = body;

    // Check if username is taken by another user
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: authenticatedUserId }
        }
      });
      if (existingUser) {
        return NextResponse.json({ error: 'اسم المستخدم محجوز مسبقاً، اختر اسماً آخر' }, { status: 400 });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    // SECURITY FIX (HIGH-01): Hash password with bcrypt — never store plaintext
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: authenticatedUserId },
      data: updateData,
      select: { id: true, name: true, username: true, role: true, displayId: true }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث البيانات' }, { status: 500 });
  }
}
