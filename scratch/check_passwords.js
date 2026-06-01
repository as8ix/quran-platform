const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        password: true
      }
    });

    console.log(`Total students: ${students.length}`);
    const emptyPasswords = students.filter(s => !s.password || s.password.trim() === '');
    console.log(`Empty/null password students count: ${emptyPasswords.length}`);
    if (emptyPasswords.length > 0) {
      console.log("Some empty password students:", emptyPasswords.slice(0, 5));
    }

    const uniquePasswords = [...new Set(students.map(s => s.password))];
    console.log("Unique passwords count:", uniquePasswords.length);
    console.log("Unique passwords:", uniquePasswords);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
