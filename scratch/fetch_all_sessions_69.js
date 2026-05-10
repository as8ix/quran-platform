const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.session.findMany({
    where: { studentId: 69 },
    orderBy: { date: 'desc' }
  });
  console.log('SESSIONS_COUNT:', sessions.length);
  sessions.forEach(s => {
    console.log(`ID: ${s.id}, Date: ${s.date}, FromS: ${s.murajaahFromSurah}, ToS: ${s.murajaahToSurah}, Pages: ${s.pagesCount}, Result: ${s.resultString}`);
  });
}

main().catch(e => console.error(e)).finally(async () => { await prisma.$disconnect(); });
