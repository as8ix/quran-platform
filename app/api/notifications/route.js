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

        const whereClause = {
            OR: []
        };
        
        if (userId) {
            const parsedId = Number(userId);
            if (!isNaN(parsedId)) {
                whereClause.OR.push({ userId: parsedId });
            }
        }
        
        if (studentId) {
            const parsedId = Number(studentId);
            if (!isNaN(parsedId)) {
                whereClause.OR.push({ studentId: parsedId });
            }
        }

        // Always include global notifications (both null)
        whereClause.OR.push({
            AND: [
                { userId: null },
                { studentId: null }
            ]
        });

        const notifications = await prisma.notification.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('API Notifications GET Error:', error);
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
                userId: userId ? Number(userId) : null,
                studentId: studentId ? Number(studentId) : null,
                title,
                message,
                type: type || 'INFO',
                attachmentUrl,
                attachmentType,
                senderId: senderId ? Number(senderId) : null,
                senderRole,
                isRead: false
            }
        });

        return NextResponse.json(notification);
    } catch (error) {
        console.error('API Notifications POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
