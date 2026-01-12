const { PrismaClient } = require('@prisma/client');
const path = require('path');

async function main() {
    const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
    console.log(`Checking database at: ${dbPath}`);
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: `file:${dbPath}`
            }
        }
    });
    try {
        const students = await prisma.student.findMany({ select: { id: true, name: true, username: true, halaqaId: true } });
        console.log(`Found ${students.length} students:`, JSON.stringify(students, null, 2));
    } catch (e) {
        console.log(`Error:`, e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
