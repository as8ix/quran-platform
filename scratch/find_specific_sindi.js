const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const students = await prisma.student.findMany({
            where: {
                name: {
                    contains: 'سندي'
                }
            },
            include: {
                halaqa: true
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
