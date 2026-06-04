import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 400 });
    }

    const certificates = await prisma.khayrukumCertificate.findMany({
      where: {
        studentId: parseInt(studentId),
      },
      orderBy: {
        branchNumber: 'asc',
      },
      include: {
        teacher: {
          select: {
            name: true,
          }
        }
      }
    });

    return NextResponse.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الشهادات' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { studentId, teacherId, title, branchNumber, examDate, grade, fileUrl } = data;

    if (!studentId || !branchNumber || !examDate || !grade || !fileUrl) {
      return NextResponse.json({ error: 'جميع الحقول المطلوبة يجب تعبئتها' }, { status: 400 });
    }

    // 1. Create Certificate
    const certificate = await prisma.khayrukumCertificate.create({
      data: {
        studentId: parseInt(studentId),
        teacherId: teacherId ? parseInt(teacherId) : null,
        title: title || null,
        branchNumber: parseInt(branchNumber),
        examDate: new Date(examDate),
        grade: parseFloat(grade),
        fileUrl,
      }
    });

    // 2. Create Notification for the student
    const certTitleStr = title ? title : `الفرع رقم ${branchNumber}`;
    await prisma.notification.create({
      data: {
        studentId: parseInt(studentId),
        title: 'شهادة جديدة! 🎉',
        message: `مبارك لك! تم رفع شهادة خيركم لاجتيازك (${certTitleStr}) بتقدير ${grade}%.`,
        type: 'CERTIFICATE',
        senderId: teacherId ? parseInt(teacherId) : null,
        senderRole: 'TEACHER',
      }
    });

    return NextResponse.json({ success: true, certificate }, { status: 201 });
  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة الشهادة' }, { status: 500 });
  }
}
