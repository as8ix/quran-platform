const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const students = await prisma.student.findMany({
            where: {
                name: {
                    contains: 'وليد'
                }
            },
            select: {
                id: true,
                name: true,
                username: true,
                phone: true,
                parentPhone: true,
                nationalId: true,
                halaqa: {
                    select: {
                        name: true
                    }
                }
            }
        });
        console.log("Students matching 'وليد':");
        console.log(JSON.stringify(students, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
