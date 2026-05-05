const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const s = await prisma.student.findFirst({
        where: { halaqaId: 5 },
        include: { halaqa: true }
    });
    console.log(JSON.stringify(s, null, 2));
}

check().then(() => process.exit(0));
