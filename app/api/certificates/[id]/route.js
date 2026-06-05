import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PATCH(request, context) {
  try {
    const params = await context.params;
    const id = params.id;
    const data = await request.json();
    const { title, branchNumber, examType, examDate, grade, fileUrl } = data;

    if (!branchNumber || !examDate || !grade) {
      return NextResponse.json({ error: 'الحقول المطلوبة مفقودة' }, { status: 400 });
    }

    const updateData = {
      title: title || null,
      branchNumber: parseInt(branchNumber),
      examType: examType || 'حضوري',
      examDate: new Date(examDate),
      grade: parseFloat(grade),
    };

    if (fileUrl) {
      updateData.fileUrl = fileUrl;
    }

    const updatedCertificate = await prisma.khayrukumCertificate.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json({ success: true, certificate: updatedCertificate }, { status: 200 });
  } catch (error) {
    console.error('Error updating certificate:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث الشهادة' }, { status: 500 });
  }
}
