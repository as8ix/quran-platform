const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        const students = await prisma.student.findMany({
            include: {
                halaqa: true
            }
        });

        console.log(`Total students in DB: ${students.length}`);

        // Group by normalized name
        const groups = {};
        students.forEach(s => {
            const norm = normalizeArabic(s.name);
            if (!groups[norm]) groups[norm] = [];
            groups[norm].push(s);
        });

        console.log("\nDuplicate groups found (with count > 1):");
        Object.keys(groups).forEach(norm => {
            const list = groups[norm];
            if (list.length > 1) {
                console.log(`\nName: "${list[0].name}" (${list.length} accounts):`);
                list.forEach(s => {
                    console.log(`  - ID: ${s.id}, Username: "${s.username}", Phone: "${s.phone}", Parent: "${s.parentPhone}", NationalID: "${s.nationalId}", Halaqa: "${s.halaqa?.name || 'بدون حلقة'}"`);
                });
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
