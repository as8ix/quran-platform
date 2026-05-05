const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list() {
    const h = await prisma.halaqa.findMany();
    console.log(JSON.stringify(h, null, 2));
}

list().then(() => process.exit(0));
