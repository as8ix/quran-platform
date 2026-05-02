const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const supervisors = await prisma.user.findMany({
    where: { role: 'SUPERVISOR' }
  });
  console.log('Supervisors:', JSON.stringify(supervisors, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
