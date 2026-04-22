const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixData() {
    try {
        console.log("Starting to fix historical clean pages...");
        
        const sessions = await prisma.session.findMany();
        let updatedCount = 0;

        for (const session of sessions) {
            let needsUpdate = false;
            let newClean = session.cleanPagesCount;
            let newHifzClean = session.hifzCleanPages;
            let newMinorClean = session.minorCleanPagesCount;

            // Fix major murajaah clean pages
            if (session.pagesCount > 0) {
                // Assuming pagesCount has the total major/minor, but we can't reliably split it.
                // However, we know pagesCount is usually majorVal.
                // Let's recalculate based on pagesCount
                const calcClean = Math.max(0, session.pagesCount - session.errorsCount - session.alertsCount);
                if (calcClean !== session.cleanPagesCount && calcClean > session.cleanPagesCount) {
                    newClean = calcClean;
                    needsUpdate = true;
                }
            }

            // Fix hifz clean pages
            if (session.hifzFromPage && session.hifzToPage) {
                const totalHifz = Math.max(0, (session.hifzToPage - session.hifzFromPage) + 1);
                const calcHifzClean = Math.max(0, totalHifz - session.hifzErrors - session.hifzAlerts);
                if (calcHifzClean !== session.hifzCleanPages && calcHifzClean > session.hifzCleanPages) {
                    newHifzClean = calcHifzClean;
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                await prisma.session.update({
                    where: { id: session.id },
                    data: {
                        cleanPagesCount: newClean,
                        hifzCleanPages: newHifzClean,
                        minorCleanPagesCount: newMinorClean
                    }
                });
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} sessions.`);
    } catch (e) {
        console.error("Error fixing data:", e);
    } finally {
        await prisma.$disconnect();
    }
}

fixData();
