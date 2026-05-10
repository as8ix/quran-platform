const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const updated = await prisma.student.update({
        where: { id: 74 },
        data: { juzCount: 0 }
    });
    console.log('Student 74 updated: juzCount is now 0');
}

main().catch(console.error).finally(() => prisma.$disconnect());
