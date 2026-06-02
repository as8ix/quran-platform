const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const halaqas = await prisma.halaqa.findMany({
    include: { _count: { select: { students: true } } }
  });
  const filtered = halaqas.filter(h => h.name.includes('ابتدائ') || h.name.includes('إبتدائ'));
  console.log(JSON.stringify(filtered, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
