const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const studentName = 'جمعة';
  const student = await prisma.student.findFirst({
    where: { name: { contains: studentName } },
    include: {
      sessions: {
        orderBy: { date: 'desc' },
        take: 5
      }
    }
  });

  if (!student) {
    console.log('Student not found');
    return;
  }

  console.log(`Student: ${student.name} (ID: ${student.id})`);
  console.log(`Juz Count: ${student.juzCount}`);
  console.log(`Review Plan: ${student.reviewPlan}`);
  
  console.log('\nRecent Sessions:');
  student.sessions.forEach(s => {
    console.log(`- ${s.date}: Type=${s.type}, Hifz=${s.hifzSurah}, Murajaah=${s.murajaahFromSurah} to ${s.murajaahToSurah}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
