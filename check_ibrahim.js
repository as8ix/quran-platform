const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({
    where: {
      name: {
        contains: 'إبراهيم'
      }
    },
    include: {
      _count: {
        select: { sessions: true }
      }
    }
  });

  console.log('STUDENTS_FOUND:');
  console.log(JSON.stringify(students, null, 2));

  // Check for sessions with studentIds that don't exist
  const orphanedSessions = await prisma.$queryRaw`
    SELECT "studentId", COUNT(*) as count 
    FROM "Session" 
    WHERE "studentId" NOT IN (SELECT id FROM "Student")
    GROUP BY "studentId"
  `;
  
  console.log('ORPHANED_SESSIONS:');
  console.log(JSON.stringify(orphanedSessions, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
