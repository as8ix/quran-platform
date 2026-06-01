const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const students = await prisma.student.findMany({
            take: 10,
            select: {
                id: true,
                name: true,
                username: true,
                phone: true,
                parentPhone: true,
                nationalId: true
            }
        });
        console.log(JSON.stringify(students, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
