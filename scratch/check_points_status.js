const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
    try {
        const halaqas = await prisma.halaqa.findMany({
            select: { id: true, name: true, pointsEnabled: true }
        });
        console.log("Halaqas Points Status:");
        console.table(halaqas);

        const students = await prisma.student.findMany({
            take: 5,
            select: { id: true, name: true, halaqaId: true }
        });
        console.log("\nSample Students:");
        console.table(students);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkStatus();
