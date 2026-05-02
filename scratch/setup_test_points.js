const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Create Test Halaqa
  const halaqa = await prisma.halaqa.create({
    data: {
      name: 'حلقة التجربة الصيفية',
    }
  });
  console.log('Created Halaqa:', halaqa.name);

  // 2. Create 3 Test Students
  const studentsData = [
    { name: 'طالب تجربة 1', username: 'test_student_1', password: '123', halaqaId: halaqa.id },
    { name: 'طالب تجربة 2', username: 'test_student_2', password: '123', halaqaId: halaqa.id },
    { name: 'طالب تجربة 3', username: 'test_student_3', password: '123', halaqaId: halaqa.id },
  ];

  for (const data of studentsData) {
    const s = await prisma.student.create({ data });
    console.log('Created Student:', s.name);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
