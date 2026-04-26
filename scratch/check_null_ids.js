const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teachers = await prisma.user.findMany({
    where: { role: 'TEACHER' }
  });
  
  const nullIds = teachers.filter(t => t.displayId === null);
  console.log('Total Teachers:', teachers.length);
  console.log('Teachers with displayId NULL:', nullIds.length);
  if (nullIds.length > 0) {
    console.log('Sample NULL IDs:', nullIds.map(t => t.name));
  }
  
  const students = await prisma.student.findMany();
  const nullStudentIds = students.filter(s => s.displayId === null);
  console.log('Total Students:', students.length);
  console.log('Students with displayId NULL:', nullStudentIds.length);

  await prisma.$disconnect();
}

main();
