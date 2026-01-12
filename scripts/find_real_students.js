const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function checkDb(dbPath) {
    if (!fs.existsSync(dbPath)) {
        console.log(`File not found: ${dbPath}`);
        return;
    }
    console.log(`\n--- Checking: ${dbPath} ---`);
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: `file:${dbPath}`
            }
        }
    });
    try {
        const students = await prisma.student.findMany({ select: { id: true, name: true, username: true } });
        console.log(`Found ${students.length} students:`);
        students.forEach(s => console.log(` - [${s.id}] ${s.name} (@${s.username})`));
    } catch (e) {
        console.log(`Error: ${e.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    const rootPath = 'c:/Users/abdal_03/OneDrive/Documents/TRYING STUFF/tester/quran-platform';
    await checkDb(path.join(rootPath, 'dev.db'));
    await checkDb(path.join(rootPath, 'prisma', 'dev.db'));
}

main();
