const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getGoogleSheetsData } = require('../app/lib/googleSheets.js');
require('dotenv').config();

function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  try {
    const dbStudents = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        parentPhone: true,
        nationalId: true,
        halaqa: { select: { name: true } }
      }
    });

    const sheetStudents = await getGoogleSheetsData();

    const dbWithoutId = dbStudents.filter(s => !s.nationalId || s.nationalId.trim() === '');
    const dbWithId = dbStudents.filter(s => s.nationalId && s.nationalId.trim() !== '');

    console.log(`Analyzing duplicates and suspects...`);
    console.log(`DB Students without National ID: ${dbWithoutId.length}`);
    console.log(`DB Students with National ID: ${dbWithId.length}`);
    console.log(`Sheet Students: ${sheetStudents.length}`);

    const suspects = [];

    for (const dbStud of dbWithoutId) {
      const dbNorm = normalizeArabic(dbStud.name);
      const dbWords = dbNorm.split(' ');
      if (dbWords.length < 1) continue;

      const dbFirst = dbWords[0];
      const dbLast = dbWords[dbWords.length - 1];

      // Find any potential matches in the Google Sheet
      for (const sheetStud of sheetStudents) {
        const sheetNorm = normalizeArabic(sheetStud.name);
        const sheetWords = sheetNorm.split(' ');
        if (sheetWords.length < 1) continue;

        const sheetFirst = sheetWords[0];
        const sheetLast = sheetWords[sheetWords.length - 1];

        // Let's define "Suspect" criteria:
        // 1. Shares the first name AND at least one other name part (middle or last name)
        // BUT they did not match 100% (e.g. not a subset)
        const firstMatch = dbFirst === sheetFirst;
        const wordIntersection = dbWords.filter(w => w.length > 2 && sheetWords.includes(w));
        
        if (firstMatch && wordIntersection.length >= 2) {
          // Check if they are already merged/identical
          const isIdentical = dbWords.every(w => sheetWords.includes(w));
          if (!isIdentical) {
            suspects.push({
              dbStudent: {
                id: dbStud.id,
                name: dbStud.name,
                username: dbStud.username,
                halaqa: dbStud.halaqa?.name || 'بدون حلقة'
              },
              sheetStudent: {
                name: sheetStud.name,
                nationalId: sheetStud.nationalId,
                phone: sheetStud.phone,
                parentPhone: sheetStud.parentPhone,
                halaqa: sheetStud.halaqaName
              },
              commonWords: wordIntersection
            });
          }
        }
      }
    }

    console.log(`\nFound ${suspects.length} suspect duplicate cases:`);
    console.log(JSON.stringify(suspects, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
