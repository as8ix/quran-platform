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

export async function GET(request) {
    try {
        const userId = parseInt(request.headers.get('x-user-id'));
        const role = request.headers.get('x-user-role');
        const { searchParams } = new URL(request.url);
        const halaqaId = searchParams.get('halaqaId');

        if (!halaqaId) {
            return NextResponse.json({ error: 'halaqaId required' }, { status: 400 });
        }

        const isAuthorized = await checkHalaqaAccess(userId, role, halaqaId);
        if (!isAuthorized) {
            return NextResponse.json({ error: 'غير مصرح لك بالوصول لبيانات هذه الحلقة' }, { status: 403 });
        }

        // Fetch families
        const families = await prisma.family.findMany({
            where: { halaqaId: parseInt(halaqaId) },
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        points: {
                            select: { amount: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Format families to include total points and clean up nested points structures
        const formattedFamilies = families.map(family => {
            const students = family.students.map(s => {
                const totalPoints = s.points.reduce((sum, p) => sum + p.amount, 0);
                return {
                    id: s.id,
                    name: s.name,
                    totalPoints
                };
            });

            const familyTotalPoints = students.reduce((sum, s) => sum + s.totalPoints, 0);

            return {
                id: family.id,
                name: family.name,
                halaqaId: family.halaqaId,
                createdAt: family.createdAt,
                students,
                totalPoints: familyTotalPoints
            };
        });

        return NextResponse.json(formattedFamilies);
    } catch (error) {
        console.error("GET Families Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = parseInt(request.headers.get('x-user-id'));
        const role = request.headers.get('x-user-role');

        const body = await request.json();
        const { name, halaqaId } = body;

        if (!name || !halaqaId) {
            return NextResponse.json({ error: 'name and halaqaId required' }, { status: 400 });
        }

        const isAuthorized = await checkHalaqaAccess(userId, role, halaqaId);
        if (!isAuthorized) {
            return NextResponse.json({ error: 'غير مصرح لك بإضافة أسر في هذه الحلقة' }, { status: 403 });
        }

        const family = await prisma.family.create({
            data: {
                name,
                halaqaId: parseInt(halaqaId)
            }
        });

        return NextResponse.json(family);
    } catch (error) {
        console.error("POST Family Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const userId = parseInt(request.headers.get('x-user-id'));
        const role = request.headers.get('x-user-role');
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Family ID required' }, { status: 400 });
        }

        const family = await prisma.family.findUnique({
            where: { id: parseInt(id) }
        });

        if (!family) {
            return NextResponse.json({ error: 'Family not found' }, { status: 404 });
        }

        const isAuthorized = await checkHalaqaAccess(userId, role, family.halaqaId);
        if (!isAuthorized) {
            return NextResponse.json({ error: 'غير مصرح لك بحذف أسر في هذه الحلقة' }, { status: 403 });
        }

        // Before deleting, Prisma will automatically set familyId of students to null due to nullable relation,
        // but let's make sure students are disconnected.
        await prisma.family.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error("DELETE Family Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
