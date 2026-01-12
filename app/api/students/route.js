import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const juzFilter = searchParams.get('juzFilter'); // "less5", "5-15", "15-30"
        const halaqaId = searchParams.get('halaqaId');

        let where = {};

        // Halaqa Filter
        if (halaqaId) {
            where.halaqaId = parseInt(halaqaId);
        }

        // Juz Filter
        if (juzFilter === 'less5') {
            where.juzCount = { lt: 5 };
        } else if (juzFilter === '5-15') {
            where.juzCount = { gte: 5, lte: 15 };
        } else if (juzFilter === '15-30') {
            where.juzCount = { gt: 15 };
        }

        const students = await prisma.student.findMany({
            where,
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(students);
    } catch (error) {
        console.error("GET Students Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, username, password, hifzProgress, currentHifzSurahId, juzCount, reviewPlan } = body;

        const newStudent = await prisma.student.create({
            data: {
                name,
                username,
                password,
                hifzProgress,
                currentHifzSurahId: parseInt(currentHifzSurahId) || 1,
                juzCount: parseInt(juzCount) || 0,
                reviewPlan,
                dailyTargetPages: parseFloat(body.dailyTargetPages) || 1.0,
                halaqaId: body.halaqaId ? parseInt(body.halaqaId) : null
            }
        });

        return NextResponse.json(newStudent);
    } catch (error) {
        console.error("POST Students Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, username, password, hifzProgress, currentHifzSurahId, juzCount, reviewPlan, halaqaId } = body;

        if (!id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 });

        const updatedStudent = await prisma.student.update({
            where: { id: parseInt(id) },
            data: {
                name,
                username,
                password,
                hifzProgress,
                currentHifzSurahId: parseInt(currentHifzSurahId) || 1,
                juzCount: parseInt(juzCount) || 0,
                reviewPlan,
                dailyTargetPages: parseFloat(body.dailyTargetPages) || 1.0,
                halaqaId: halaqaId ? parseInt(halaqaId) : null
            }
        });

        return NextResponse.json(updatedStudent);
    } catch (error) {
        console.error("PUT Students Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 });

        // First delete related records (Attendance, Sessions)
        // Or if we had cascade delete, we could just delete student.
        // Let's manually delete for safety if not defined in schema (though usually prisma handles generic cascade if defined, but SQLite is picky).

        await prisma.attendance.deleteMany({ where: { studentId: parseInt(id) } });
        await prisma.session.deleteMany({ where: { studentId: parseInt(id) } });

        await prisma.student.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error("DELETE Students Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
