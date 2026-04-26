const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const s = await prisma.student.update({where: {id: 12}, data: {nationalId: '1234567890'}}); 
    console.log("Updated ID 12:", s.nationalId);
}

check().finally(() => prisma.$disconnect());
