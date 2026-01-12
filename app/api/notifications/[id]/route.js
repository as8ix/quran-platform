import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(request, context) {
    try {
        // Awaiting params is required in newer Next.js versions but let's check validation
        const params = await context.params;
        const id = params.id;

        if (!id) {
            return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 });
        }

        const notification = await prisma.notification.update({
            where: { id: parseInt(id) },
            data: { isRead: true }
        });

        return NextResponse.json(notification);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
