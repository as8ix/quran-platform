const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const students = await prisma.student.findMany();
    console.log(students.filter(x => x.nationalId && x.nationalId.length > 0).map(x => ({name: x.name, nationalId: x.nationalId})));
}

check().finally(() => prisma.$disconnect());
