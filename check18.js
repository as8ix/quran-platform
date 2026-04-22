const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.student.findUnique({where: {id: 18}}).then(console.log).finally(() => prisma.$disconnect());
