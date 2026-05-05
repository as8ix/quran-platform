const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list() {
    const h = await prisma.halaqa.findMany();
    h.forEach(x => {
        console.log(`ID: ${x.id}, Name: ${x.name}, PointsEnabled: ${x.pointsEnabled}`);
    });
}

list().then(() => process.exit(0));
