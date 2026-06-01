const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Fetch students who have empty or '-' passwords
    const targetStudents = await prisma.student.findMany({
      where: {
        OR: [
          { password: '' },
          { password: '-' }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        password: true
      }
    });

    console.log(`Found ${targetStudents.length} students with empty or unregistered passwords.`);

    if (targetStudents.length === 0) {
      console.log("No students to update.");
      return;
    }

    console.log("Students to be updated:");
    targetStudents.forEach(s => {
      console.log(`- ID: ${s.id}, Name: "${s.name}", Username: "${s.username}", Current Password: "${s.password}"`);
    });

    // 2. Update their passwords to '123'
    const updateResult = await prisma.student.updateMany({
      where: {
        OR: [
          { password: '' },
          { password: '-' }
        ]
      },
      data: {
        password: '123'
      }
    });

    console.log(`Successfully updated ${updateResult.count} students' passwords to "123".`);

    // Verify
    const remaining = await prisma.student.count({
      where: {
        OR: [
          { password: '' },
          { password: '-' }
        ]
      }
    });
    console.log(`Remaining empty/unregistered passwords count: ${remaining}`);

  } catch (err) {
    console.error("Error during update:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
