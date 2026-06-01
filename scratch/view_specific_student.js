const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const student = await prisma.student.findFirst({
            where: {
                OR: [
                    { id: 153 },
                    { username: { contains: 'الريمي' } }
                ]
            }
        });
        console.log(JSON.stringify(student, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
