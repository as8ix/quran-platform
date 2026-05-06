import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const teacherId = searchParams.get('teacherId');

        let where = {};
        if (id) where.id = parseInt(id);
        if (teacherId) {
            where.OR = [
                { teacherId: parseInt(teacherId) },
                { assistants: { some: { id: parseInt(teacherId) } } }
            ];
        }

        const halaqas = await prisma.halaqa.findMany({
            where,
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
        const { name, teacherId, assistantTeacherIds, logo } = body;

        const data = {
            name,
            teacherId: teacherId ? parseInt(teacherId) : null,
            logo: logo || null
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
        const { id, name, teacherId, assistantTeacherIds, pointsEnabled, logo } = body;

        const data = {};
        if (name !== undefined) data.name = name;
        if (teacherId !== undefined) data.teacherId = teacherId ? parseInt(teacherId) : null;
        if (pointsEnabled !== undefined) data.pointsEnabled = pointsEnabled;
        if (logo !== undefined) data.logo = logo;

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

        // --- Firebase Real-time Trigger for Points Status ---
        if (pointsEnabled !== undefined) {
            try {
                // Trigger for the main teacher
                if (halaqa.teacherId) {
                    await setDoc(doc(db, "notification_triggers", `user_${halaqa.teacherId}`), {
                        lastUpdate: serverTimestamp(),
                        type: 'POINTS_STATUS_CHANGE'
                    }, { merge: true });
                }
                // Trigger for assistants
                if (halaqa.assistants && halaqa.assistants.length > 0) {
                    for (const assistant of halaqa.assistants) {
                        await setDoc(doc(db, "notification_triggers", `user_${assistant.id}`), {
                            lastUpdate: serverTimestamp(),
                            type: 'POINTS_STATUS_CHANGE'
                        }, { merge: true });
                    }
                }
            } catch (fbError) {
                console.error('Firebase Halaqa Trigger Error:', fbError);
            }
        }

        return NextResponse.json(halaqa);
    } catch (error) {
        console.error("Update Halaqa Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to update halaqa' }, { status: 500 });
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
