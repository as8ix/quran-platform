const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect()
  .then(() => {
    console.log('Prisma connected successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Prisma connection error:', err);
    process.exit(1);
  });
