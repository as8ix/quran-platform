import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Embedded Data from data-export.json
const DATA = {
    "users": [
        {
            "id": 1,
            "username": "supervisor",
            "password": "123",
            "name": "المشرف العام",
            "role": "SUPERVISOR",
            "createdAt": "2026-01-06T03:29:11.481Z"
        },
        {
            "id": 10,
            "username": "bassam",
            "password": "123",
            "name": "بسام فوزي حوذان",
            "role": "TEACHER",
            "createdAt": "2026-01-06T03:39:11.244Z"
        }
    ],
    "halaqas": [
        {
            "id": 5,
            "name": "زيد بن ثابت",
            "teacherId": 10,
            "createdAt": "2026-01-06T03:39:16.351Z"
        }
    ],
    "students": [],
    "sessions": [],
    "attendance": []
};

export async function GET() {
    try {
        console.log('🚀 Starting DB Seed via API...');

        // Helper to process date strings
        const toDate = (d) => d ? new Date(d) : new Date();

        // 1. Users
        for (const u of DATA.users) {
            await prisma.user.upsert({
                where: { username: u.username },
                update: {
                    password: u.password,
                    name: u.name,
                    role: u.role,
                    createdAt: toDate(u.createdAt)
                },
                create: {
                    id: u.id,
                    username: u.username,
                    password: u.password,
                    name: u.name,
                    role: u.role,
                    createdAt: toDate(u.createdAt)
                }
            });
        }

        // 2. Halaqas
        for (const h of DATA.halaqas) {
            await prisma.halaqa.upsert({
                where: { id: h.id },
                update: {
                    name: h.name,
                    teacherId: h.teacherId, // Assumes user exists
                    createdAt: toDate(h.createdAt)
                },
                create: {
                    id: h.id,
                    name: h.name,
                    teacherId: h.teacherId,
                    createdAt: toDate(h.createdAt)
                }
            });
        }

        // 3. Students
        for (const s of DATA.students) {
            await prisma.student.upsert({
                where: { username: s.username },
                update: {
                    name: s.name,
                    password: s.password,
                    hifzProgress: s.hifzProgress,
                    currentHifzSurahId: s.currentHifzSurahId,
                    juzCount: s.juzCount,
                    reviewPlan: s.reviewPlan,
                    halaqaId: s.halaqaId,
                    createdAt: toDate(s.createdAt)
                },
                create: {
                    id: s.id,
                    name: s.name,
                    username: s.username,
                    password: s.password,
                    hifzProgress: s.hifzProgress,
                    currentHifzSurahId: s.currentHifzSurahId,
                    juzCount: s.juzCount,
                    reviewPlan: s.reviewPlan,
                    halaqaId: s.halaqaId,
                    createdAt: toDate(s.createdAt)
                }
            });
        }

        // Sessions & Attendance skipped if empty arrays

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully!',
            counts: {
                users: DATA.users.length,
                halaqas: DATA.halaqas.length,
                students: DATA.students.length
            }
        });

    } catch (error) {
        console.error('Seed Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
