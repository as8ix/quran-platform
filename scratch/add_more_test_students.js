const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get the test halaqa ID
  const halaqa = await prisma.halaqa.findFirst({
    where: { name: 'حلقة التجربة الصيفية' }
  });

  if (!halaqa) {
    console.error('Halaqa not found!');
    return;
  }

  // Create 7 more students
  const studentsData = [
    { name: 'عبدالله بن أحمد', username: 'student_4', password: '123', halaqaId: halaqa.id },
    { name: 'محمد الخالد', username: 'student_5', password: '123', halaqaId: halaqa.id },
    { name: 'سعد العبدالعزيز', username: 'student_6', password: '123', halaqaId: halaqa.id },
    { name: 'عمر الفاروق', username: 'student_7', password: '123', halaqaId: halaqa.id },
    { name: 'فهد المنصور', username: 'student_8', password: '123', halaqaId: halaqa.id },
    { name: 'علي حسن', username: 'student_9', password: '123', halaqaId: halaqa.id },
    { name: 'ياسر العتيبي', username: 'student_10', password: '123', halaqaId: halaqa.id },
  ];

  for (const data of studentsData) {
    const s = await prisma.student.create({ data });
    console.log('Created Student:', s.name);
  }
  
  console.log('Successfully added 7 more students to the test halaqa.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
