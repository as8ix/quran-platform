const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAnomalies() {
    console.log("🔍 Scanning for session data anomalies...");
    
    try {
        const sessions = await prisma.session.findMany({
            include: {
                student: {
                    select: { name: true }
                }
            },
            orderBy: { date: 'desc' },
            take: 100 // Check last 100 sessions
        });

        console.log(`Checking ${sessions.length} sessions...\n`);

        const anomalies = [];

        sessions.forEach(s => {
            const total = s.pagesCount || 0;
            const clean = s.cleanPagesCount || 0;
            const errors = s.errorsCount || 0;
            const alerts = s.alertsCount || 0;
            
            // Basic logic: if total > 1 and clean is 0, but errors+alerts are very low
            // e.g. 9 pages, 1 error/alert should NOT result in 0 clean pages.
            // Note: In some systems, even 1 error makes the page "not clean". 
            // So if total is 9 and errors+alerts is 1, maybe clean is 8.
            
            const expectedMinClean = Math.max(0, Math.floor(total) - (errors + alerts));
            
            if (total > 0 && clean === 0 && (errors + alerts) < total && total > 1) {
                anomalies.push({
                    id: s.id,
                    student: s.student?.name,
                    date: s.date.toISOString().split('T')[0],
                    total,
                    clean,
                    errors,
                    alerts,
                    reason: "Clean pages is 0 despite having multiple pages and few errors/alerts"
                });
            } else if (total > 0 && Math.abs(clean - expectedMinClean) > 0.1 && (errors + alerts) < total) {
                // If clean is significantly different from expected (total - errors - alerts)
                // we mark it as suspicious
                 anomalies.push({
                    id: s.id,
                    student: s.student?.name,
                    date: s.date.toISOString().split('T')[0],
                    total,
                    clean,
                    errors,
                    alerts,
                    reason: `Clean pages (${clean}) mismatch with expected (${expectedMinClean})`
                });
            }
        });

        if (anomalies.length > 0) {
            console.log(`⚠️ Found ${anomalies.length} potential anomalies:\n`);
            console.table(anomalies);
        } else {
            console.log("✅ No anomalies found in the analyzed sample.");
        }

    } catch (error) {
        console.error("Error scanning data:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAnomalies();
