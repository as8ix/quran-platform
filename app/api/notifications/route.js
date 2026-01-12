import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const studentId = searchParams.get('studentId');

        if (!userId && !studentId) {
            return NextResponse.json({ error: 'Missing userId or studentId' }, { status: 400 });
        }

        const whereClause = {};
        if (userId) whereClause.userId = parseInt(userId);
        if (studentId) whereClause.studentId = parseInt(studentId);

        const notifications = await prisma.notification.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(notifications);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            userId,
            studentId,
            title,
            message,
            type,
            attachmentUrl,
            attachmentType,
            senderId,
            senderRole
        } = body;

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and Message are required' }, { status: 400 });
        }

        const notification = await prisma.notification.create({
            data: {
                userId: userId ? parseInt(userId) : null,
                studentId: studentId ? parseInt(studentId) : null,
                title,
                message,
                type: type || 'INFO',
                attachmentUrl,
                attachmentType,
                senderId: senderId ? parseInt(senderId) : null,
                senderRole,
                isRead: false
            }
        });

        return NextResponse.json(notification);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
