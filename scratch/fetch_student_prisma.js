const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.student.findUnique({
    where: { id: 69 },
    include: { sessions: true }
  });
  console.log('STUDENT_DATA_START');
  console.log(JSON.stringify(student, null, 2));
  console.log('STUDENT_DATA_END');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
