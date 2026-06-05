import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const role = request.headers.get('x-user-role');
    
    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER'
      },
      select: {
        id: true,
        displayId: true,
        name: true,
        username: true,
        // password: true removed to fix data exposure
        createdAt: true,
        _count: {
          select: {
            teacherHalaqas: true,
            assistantHalaqas: true
          }
        }
      }
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("GET Teachers Error:", error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Unauthorized: Only supervisors can create teachers' }, { status: 403 });
    }

    const body = await request.json();
    const { name, username, password } = body;

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'اسم المستخدم محجوز مسبقاً' }, { status: 400 });
    }

    // Get next displayId
    const lastTeacher = await prisma.user.findFirst({
      where: { role: 'TEACHER' },
      orderBy: { displayId: 'desc' }
    });
    const nextDisplayId = (lastTeacher?.displayId || 0) + 1;

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await prisma.user.create({
      data: {
        name,
        username,
        displayId: nextDisplayId,
        password: hashedPassword,
        role: 'TEACHER'
      },
      select: { // Exclude password from the response
        id: true,
        name: true,
        username: true,
        displayId: true,
        role: true
      }
    });

    return NextResponse.json(teacher);
  } catch (error) {
    return NextResponse.json({ error: 'فشل في إضافة المعلم' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Unauthorized: Only supervisors can delete teachers' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'تم حذف المعلم بنجاح' });
  } catch (error) {
    console.error("Delete Teacher Error:", error);
    return NextResponse.json({ error: 'فشل حذف المعلم (قد يكون مرتبطاً بحلقة حالياً)' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Unauthorized: Only supervisors can update teachers' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, username, password } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Check if username is taken by another user
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: parseInt(id) }
        }
      });
      if (existingUser) {
        return NextResponse.json({ error: 'اسم المستخدم محجوز مسبقاً' }, { status: 400 });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const teacher = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: { // Exclude password from the response
        id: true,
        name: true,
        username: true,
        displayId: true,
        role: true
      }
    });

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("Update Teacher Error:", error);
    return NextResponse.json({ error: 'فشل في تحديث بيانات المعلم' }, { status: 500 });
  }
}
