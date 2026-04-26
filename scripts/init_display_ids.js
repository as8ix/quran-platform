const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- البدء في تحديث أرقام التعريف (displayId) ---');

  // 1. تحديث المشرفين
  console.log('جاري تحديث المشرفين...');
  const supervisors = await prisma.user.findMany({
    where: { role: 'SUPERVISOR' },
    orderBy: { createdAt: 'asc' }
  });
  for (let i = 0; i < supervisors.length; i++) {
    await prisma.user.update({
      where: { id: supervisors[i].id },
      data: { displayId: i + 1 }
    });
  }
  console.log(`تم تحديث ${supervisors.length} مشرف.`);

  // 2. تحديث المعلمين
  console.log('جاري تحديث المعلمين...');
  const teachers = await prisma.user.findMany({
    where: { role: 'TEACHER' },
    orderBy: { createdAt: 'asc' }
  });
  for (let i = 0; i < teachers.length; i++) {
    await prisma.user.update({
      where: { id: teachers[i].id },
      data: { displayId: i + 1 }
    });
  }
  console.log(`تم تحديث ${teachers.length} معلم.`);

  // 3. تحديث الطلاب
  console.log('جاري تحديث الطلاب...');
  const students = await prisma.student.findMany({
    orderBy: { createdAt: 'asc' }
  });
  for (let i = 0; i < students.length; i++) {
    await prisma.student.update({
      where: { id: students[i].id },
      data: { displayId: i + 1 }
    });
  }
  console.log(`تم تحديث ${students.length} طالب.`);

  console.log('--- اكتملت العملية بنجاح ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
