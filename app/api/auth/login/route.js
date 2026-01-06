import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const body = await request.json();
        const { username, password, role } = body;

        // Validate input
        if (!username || !password || !role) {
            return NextResponse.json(
                { error: 'جميع الحقول مطلوبة' },
                { status: 400 }
            );
        }

        // Role mapping: frontend "student" -> DB "STUDENT"
        // But wait, schema says role using uppercase string for some, let's check.
        // Schema says: role String // SUPERVISOR, TEACHER, STUDENT
        // Frontend currently sends lowercase 'student', 'teacher', 'supervisor'.
        const userRole = role.toUpperCase();

        // Check if role is STUDENT
        if (userRole === 'STUDENT') {
            const student = await prisma.student.findUnique({
                where: { username }
            });

            if (!student || student.password !== password) {
                return NextResponse.json(
                    { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
                    { status: 401 }
                );
            }

            return NextResponse.json({
                id: student.id,
                name: student.name,
                username: student.username,
                role: 'STUDENT'
            });
        }

        // Otherwise check User table (Teacher/Supervisor)
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
                { status: 401 }
            );
        }

        // Check password (plain text for now)
        if (user.password !== password) {
            return NextResponse.json(
                { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
                { status: 401 }
            );
        }

        // Check role
        if (user.role !== userRole) {
            return NextResponse.json(
                { error: `هذا المستخدم ليس مسجلاً كـ ${role === 'student' ? 'طالب' : role === 'teacher' ? 'معلم' : 'مشرف'}` },
                { status: 403 }
            );
        }

        // Login successful
        // Get teacher's first halaqa if applicable
        let halaqaId = null;
        if (user.role === 'TEACHER') {
            const teacherHalaqa = await prisma.halaqa.findFirst({
                where: {
                    OR: [
                        { teacherId: user.id },
                        { assistants: { some: { id: user.id } } }
                    ]
                }
            });
            halaqaId = teacherHalaqa?.id;
        }

        return NextResponse.json({
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            halaqaId
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'حدث خطأ أثناء تسجيل الدخول' },
            { status: 500 }
        );
    }
}
