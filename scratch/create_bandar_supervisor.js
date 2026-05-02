const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const username = 'bandar';
  const name = 'المشرف بندر';
  const password = '123';
  const role = 'SUPERVISOR';

  // Check if username exists
  const existingUser = await prisma.user.findUnique({
    where: { username }
  });

  if (existingUser) {
    console.log(`Username "${username}" already exists.`);
    return;
  }

  // Get next displayId
  const lastSupervisor = await prisma.user.findFirst({
    where: { role: 'SUPERVISOR' },
    orderBy: { displayId: 'desc' }
  });
  const nextDisplayId = (lastSupervisor?.displayId || 0) + 1;

  const newUser = await prisma.user.create({
    data: {
      name,
      username,
      password,
      role,
      displayId: nextDisplayId
    }
  });

  console.log('Successfully created new supervisor:');
  console.log(JSON.stringify(newUser, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
