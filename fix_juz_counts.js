const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { quranData } = require('./app/data/quranData.js');

async function fixJuzCounts() {
    const students = await prisma.student.findMany();
    let updated = 0;
    
    for (const student of students) {
        let currentSurahId = student.currentHifzSurahId || 114;
        const surah = quranData.find(s => s.id === currentSurahId);
        
        if (surah) {
            const pagesMemorized = 605 - surah.startPage;
            let exactJuz = Math.floor(pagesMemorized / 20);
            if (exactJuz > 30) exactJuz = 30;
            
            await prisma.student.update({
                where: { id: student.id },
                data: { juzCount: exactJuz }
            });
            updated++;
        }
    }
    
    console.log(`Successfully updated ${updated} students' juz counts to exact fractions.`);
    await prisma.$disconnect();
}

fixJuzCounts().catch(console.error);
