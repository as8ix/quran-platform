import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const holidays = await prisma.holiday.findMany({
            orderBy: {
                startDate: 'desc'
            }
        });
        return NextResponse.json(holidays);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { name, startDate, endDate, halaqaId } = await request.json();
        
        if (!name || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const holiday = await prisma.holiday.create({
            data: {
                name,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                halaqaId: halaqaId ? parseInt(halaqaId) : null
            }
        });

        return NextResponse.json(holiday);
    } catch (error) {
        console.error('Error creating holiday:', error);
        return NextResponse.json({ 
            error: 'فشل في إضافة الإجازة في قاعدة البيانات', 
            details: error.message 
        }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'المعرف مفقود' }, { status: 400 });
        }

        const deleted = await prisma.holiday.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true, deleted });
    } catch (error) {
        console.error('API Error deleting holiday:', error);
        return NextResponse.json({ 
            error: 'فشل الحذف من قاعدة البيانات',
            details: error.message 
        }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { id, name, startDate, endDate, halaqaId } = await request.json();
        
        if (!id || !name || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const holiday = await prisma.holiday.update({
            where: { id: parseInt(id) },
            data: {
                name,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                halaqaId: halaqaId ? parseInt(halaqaId) : null
            }
        });

        return NextResponse.json(holiday);
    } catch (error) {
        console.error('Error updating holiday:', error);
        return NextResponse.json({ 
            error: 'فشل في تحديث الإجازة في قاعدة البيانات', 
            details: error.message 
        }, { status: 500 });
    }
}
