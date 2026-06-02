const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const halaqaId = 5;

  console.log('Finding students for halaqah', halaqaId);
  const students = await prisma.student.findMany({
    where: { halaqaId }
  });
  const studentIds = students.map(s => s.id);
  console.log(`Found ${studentIds.length} students`);

  if (studentIds.length > 0) {
    console.log('Deleting attendances...');
    await prisma.attendance.deleteMany({ where: { studentId: { in: studentIds } } });
    
    console.log('Deleting sessions...');
    await prisma.session.deleteMany({ where: { studentId: { in: studentIds } } });
    
    console.log('Deleting exams...');
    await prisma.exam.deleteMany({ where: { studentId: { in: studentIds } } });
    
    console.log('Deleting notifications...');
    await prisma.notification.deleteMany({ where: { studentId: { in: studentIds } } });

    console.log('Deleting students...');
    await prisma.student.deleteMany({ where: { halaqaId } });
  }

  console.log('Deleting halaqah...');
  await prisma.halaqa.delete({ where: { id: halaqaId } });
  
  console.log('Done successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
