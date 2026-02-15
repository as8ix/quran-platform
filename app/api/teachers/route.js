import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER'
      },
      select: {
        id: true,
        name: true,
        username: true,
        password: true,
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
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, username, password } = body;

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const teacher = await prisma.user.create({
      data: {
        name,
        username,
        password, // In a real app, hash this!
        role: 'TEACHER'
      }
    });

    return NextResponse.json(teacher);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Simple approach: Delete.
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Teacher deleted' });
  } catch (error) {
    console.error("Delete Teacher Error:", error);
    return NextResponse.json({ error: 'Failed to delete teacher (might be assigned to a Halaqa)' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
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
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (password) updateData.password = password;

    const teacher = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("Update Teacher Error:", error);
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
  }
}
