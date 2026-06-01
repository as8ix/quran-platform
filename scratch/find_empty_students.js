const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const students = await prisma.student.findMany({
            select: {
                id: true,
                displayId: true,
                name: true,
                username: true,
                halaqaId: true,
                halaqa: {
                    select: {
                        name: true
                    }
                }
            }
        });

        const emptyStudents = students.filter(s => {
            return !s.name || s.name.trim() === '';
        });

        console.log(`Found ${emptyStudents.length} students with empty/null names:`);
        console.log(JSON.stringify(emptyStudents, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
