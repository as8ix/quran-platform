const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getGoogleSheetsData } = require('../app/lib/googleSheets.js');

async function main() {
    try {
        const dbStudents = await prisma.student.findMany({
            select: {
                id: true,
                name: true,
                phone: true,
                parentPhone: true,
                nationalId: true
            }
        });

        const sheetStudents = await getGoogleSheetsData();

        console.log(`Database students count: ${dbStudents.length}`);
        console.log(`Sheet students count: ${sheetStudents.length}`);

        // Let's analyze students in DB who have null phone/nationalId
        const nullStudents = dbStudents.filter(s => !s.phone || !s.nationalId);
        console.log(`\nFound ${nullStudents.length} students in DB with null/empty phone or nationalId:`);
        
        // Take first 10 and try to find them in the sheet by name (fuzzy)
        const sample = nullStudents.slice(0, 10);
        for (const s of sample) {
            const sheetMatch = sheetStudents.find(ss => ss.name.trim().toLowerCase().includes(s.name.trim().toLowerCase()) || s.name.trim().toLowerCase().includes(ss.name.trim().toLowerCase()));
            console.log(`- DB Student: "${s.name}" (ID: ${s.id})`);
            if (sheetMatch) {
                console.log(`  -> Found in Sheet: "${sheetMatch.name}"`);
                console.log(`     Sheet Data: Phone: ${sheetMatch.phone}, Parent: ${sheetMatch.parentPhone}, NationalID: ${sheetMatch.nationalId}`);
            } else {
                console.log(`  -> NOT found in Google Sheet under this name spelling.`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
