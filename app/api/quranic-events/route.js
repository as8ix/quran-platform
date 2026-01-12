import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('activeOnly') === 'true';

        let where = {};
        if (activeOnly) {
            where.isActive = true;
        }

        const events = await prisma.quranicEvent.findMany({
            where,
            include: {
                teachers: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                startDate: 'desc'
            }
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error("GET QuranicEvents Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, startDate, endDate, teacherIds, isActive } = body;

        // If this is set as active, deactivate others
        if (isActive) {
            await prisma.quranicEvent.updateMany({
                where: { isActive: true },
                data: { isActive: false }
            });
        }

        const newEvent = await prisma.quranicEvent.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: isActive || false,
                teachers: {
                    connect: teacherIds?.map(id => ({ id: parseInt(id) })) || []
                }
            },
            include: {
                teachers: true
            }
        });

        return NextResponse.json(newEvent);
    } catch (error) {
        console.error("POST QuranicEvents Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, startDate, endDate, teacherIds, isActive } = body;

        if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

        // If this is being set as active, deactivate others
        if (isActive === true) {
            await prisma.quranicEvent.updateMany({
                where: { isActive: true },
                data: { isActive: false }
            });
        }

        const updatedEvent = await prisma.quranicEvent.update({
            where: { id: parseInt(id) },
            data: {
                name,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
                teachers: teacherIds ? {
                    set: teacherIds.map(id => ({ id: parseInt(id) }))
                } : undefined
            },
            include: {
                teachers: true
            }
        });

        return NextResponse.json(updatedEvent);
    } catch (error) {
        console.error("PUT QuranicEvents Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

        await prisma.quranicEvent.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error("DELETE QuranicEvents Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
