import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function PATCH(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const studentId = searchParams.get('studentId');

        if (!userId && !studentId) {
            return NextResponse.json({ error: 'Missing userId or studentId' }, { status: 400 });
        }

        const whereClause = { isRead: false, OR: [] };
        
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

        // Include global notifications 
        whereClause.OR.push({
            AND: [
                { userId: null },
                { studentId: null }
            ]
        });

        await prisma.notification.updateMany({
            where: whereClause,
            data: { isRead: true }
        });

        // Trigger firebase refresh
        try {
            const triggerId = userId ? `user_${userId}` : (studentId ? `student_${studentId}` : 'global');
            await setDoc(doc(db, "notification_triggers", triggerId), {
                lastUpdate: serverTimestamp(),
                count: Math.floor(Math.random() * 1000)
            }, { merge: true });
        } catch (fbError) {
            console.error('Firebase Trigger Error:', fbError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Notifications Read All Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
