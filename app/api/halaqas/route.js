import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const halaqas = await prisma.halaqa.findMany({
            include: {
                teacher: {
                    select: { id: true, name: true }
                },
                assistants: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { students: true }
                }
            }
        });

        return NextResponse.json(halaqas);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch halaqas' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, teacherId, assistantTeacherIds } = body;

        const data = {
            name,
            teacherId: teacherId ? parseInt(teacherId) : null
        };

        if (assistantTeacherIds && assistantTeacherIds.length > 0) {
            data.assistants = {
                connect: assistantTeacherIds.map(id => ({ id: parseInt(id) }))
            };
        }

        const halaqa = await prisma.halaqa.create({
            data,
            include: {
                teacher: { select: { name: true } },
                assistants: { select: { name: true } }
            }
        });

        return NextResponse.json(halaqa);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create halaqa' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, teacherId, assistantTeacherIds } = body;

        const data = {
            name,
            teacherId: teacherId ? parseInt(teacherId) : null
        };

        if (assistantTeacherIds) {
            data.assistants = {
                set: assistantTeacherIds.map(uid => ({ id: parseInt(uid) }))
            };
        }

        const halaqa = await prisma.halaqa.update({
            where: { id: parseInt(id) },
            data,
            include: {
                teacher: { select: { name: true } },
                assistants: { select: { name: true } }
            }
        });

        return NextResponse.json(halaqa);
    } catch (error) {
        console.error("Update Halaqa Error:", error);
        return NextResponse.json({ error: 'Failed to update halaqa' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        // Unlink students first
        await prisma.student.updateMany({
            where: { halaqaId: parseInt(id) },
            data: { halaqaId: null }
        });

        await prisma.halaqa.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'Halaqa deleted' });
    } catch (error) {
        console.error("Delete Halaqa Error:", error);
        return NextResponse.json({ error: 'Failed to delete halaqa' }, { status: 500 });
    }
}
