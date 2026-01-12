const { PrismaClient } = require('@prisma/client');

async function listFor(path) {
    console.log(`--- Checking: ${path} ---`);
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: `file:${path}`
            }
        }
    });
    try {
        const students = await prisma.student.findMany({ select: { id: true, name: true, username: true } });
        console.log(`Found ${students.length} students:`, JSON.stringify(students, null, 2));
    } catch (e) {
        console.log(`Error reading ${path}:`, e.message);
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    await listFor('./dev.db');
    await listFor('./prisma/dev.db');
}

main();
