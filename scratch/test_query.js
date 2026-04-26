const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      select: {
        id: true,
        displayId: true,
        name: true,
        username: true,
        _count: {
          select: {
            teacherHalaqas: true,
            assistantHalaqas: true
          }
        }
      }
    });
    console.log('Success:', teachers.length, 'teachers found');
  } catch (error) {
    console.error('FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
