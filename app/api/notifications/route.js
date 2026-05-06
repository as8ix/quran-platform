import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

        // --- Firebase Real-time Trigger ---
        // We write a simple timestamp to a trigger document.
        // The Navbar listens to this document and refreshes when it changes.
        try {
            const triggerId = userId ? `user_${userId}` : (studentId ? `student_${studentId}` : 'global');
            await setDoc(doc(db, "notification_triggers", triggerId), {
                lastUpdate: serverTimestamp(),
                count: Math.floor(Math.random() * 1000) // Ensure a change even if same millisecond
            }, { merge: true });
        } catch (fbError) {
            console.error('Firebase Trigger Error:', fbError);
            // We don't fail the whole request if Firebase fails, just log it.
        }

        return NextResponse.json(notification);
    } catch (error) {
        console.error('API Notifications POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
