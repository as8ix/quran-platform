const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        const sessions = await prisma.session.findMany({
            take: 10,
            orderBy: { date: 'desc' },
            include: { student: true }
        });

        console.log('\n--- Latest 10 Sessions (Backend View) ---');
        if (sessions.length === 0) {
            console.log("No sessions found in the database.");
        } else {
            sessions.forEach(s => {
                console.log(`\n[Session #${s.id}] Date: ${s.date}`);
                console.log(`Student: ${s.student ? s.student.name : 'Unknown'} (ID: ${s.studentId})`);

                if (s.hifzSurah) {
                    console.log(`   Hifz: ${s.hifzSurah} [Page ${s.hifzFromPage} -> ${s.hifzToPage}]`);
                } else {
                    console.log(`   Hifz: None`);
                }

                if (s.murajaahFromSurah) {
                    console.log(`   Review: ${s.murajaahFromSurah} -> ${s.murajaahToSurah}`);
                } else {
                    console.log(`   Review: None`);
                }

                console.log(`   Stats: ${s.pagesCount} pages | Errors: ${s.errorsCount} | Alerts: ${s.alertsCount} | Clean: ${s.cleanPagesCount}`);
                console.log(`   Goal Achieved: ${s.isGoalAchieved}`);
                console.log(`   Notes: ${s.notes || 'None'}`);
            });
        }
        console.log('\n----------------------------------------');

    } catch (e) {
        console.error("Error fetching sessions:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
