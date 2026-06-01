const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const students = await prisma.student.findMany({
            select: {
                id: true,
                name: true,
                nationalId: true,
                phone: true,
                parentPhone: true
            }
        });

        const withNationalId = students.filter(s => s.nationalId && s.nationalId.trim() !== '');
        const withoutNationalId = students.filter(s => !s.nationalId || s.nationalId.trim() === '');

        console.log(`Total students in DB: ${students.length}`);
        console.log(`With National ID: ${withNationalId.length}`);
        console.log(`Without National ID: ${withoutNationalId.length}`);

        console.log("\nSample students without National ID:");
        withoutNationalId.slice(0, 10).forEach(s => {
            console.log(`- ID: ${s.id}, Name: "${s.name}"`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
