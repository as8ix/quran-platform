import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);


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

        const userRole = role.toUpperCase();

        let userData = null;

        // Check if role is STUDENT
        if (userRole === 'STUDENT') {
            const student = await prisma.student.findUnique({
                where: { username }
            });

            if (!student) {
                return NextResponse.json(
                    { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
                    { status: 401 }
                );
            }

            const isPasswordValid = await bcrypt.compare(password, student.password);
            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
                    { status: 401 }
                );
            }

            userData = {
                id: student.id,
                displayId: student.displayId,
                name: student.name,
                username: student.username,
                role: 'STUDENT',
                halaqaId: student.halaqaId
            };
        } else {
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

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
                    { status: 401 }
                );
            }

            if (user.role !== userRole) {
                return NextResponse.json(
                    { error: `هذا المستخدم ليس مسجلاً كـ ${role === 'student' ? 'طالب' : role === 'teacher' ? 'معلم' : 'مشرف'}` },
                    { status: 403 }
                );
            }

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

            userData = {
                id: user.id,
                displayId: user.displayId,
                name: user.name,
                username: user.username,
                role: user.role,
                halaqaId
            };
        }

        // Generate JWT
        const token = await new SignJWT({ 
            id: userData.id, 
            username: userData.username, 
            role: userData.role 
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('30d')
        .sign(JWT_SECRET);

        const response = NextResponse.json(userData);

        // Set HttpOnly cookie
        response.cookies.set({
            name: 'auth-token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'حدث خطأ أثناء تسجيل الدخول' },
            { status: 500 }
        );
    }
}
