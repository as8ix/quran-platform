const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({
    select: {
      name: true,
      username: true,
      password: true,
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log('--- بيانات الطلاب ---');
  students.forEach((s, i) => {
    console.log(`${i + 1}. الاسم: ${s.name}`);
    console.log(`   المستخدم: ${s.username}`);
    console.log(`   الكلمة: ${s.password}`);
    console.log('---');
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
