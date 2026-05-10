const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const student = await prisma.student.findUnique({
        where: { id: 74 }
    });
    console.log(JSON.stringify(student, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
