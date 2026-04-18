const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function backupAndFix() {
    const today = new Date().toISOString().split('T')[0];
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    
    const backupPath = path.join(backupDir, `sessions_fix_backup_${today}.json`);

    console.log("🚀 Starting Bulk Fix for Clean Pages...");
    
    try {
        // 1. Fetch ALL sessions for backup and analysis
        const sessions = await prisma.session.findMany();
        console.log(`📊 Found ${sessions.length} sessions in total.`);

        // 2. Save Backup
        fs.writeFileSync(backupPath, JSON.stringify(sessions, null, 2));
        console.log(`✅ Backup saved to: ${backupPath}`);

        // 3. Process Fixes
        let fixCount = 0;
        for (const s of sessions) {
            const total = s.pagesCount || 0;
            const currentClean = s.cleanPagesCount || 0;
            const errors = s.errorsCount || 0;
            const alerts = s.alertsCount || 0;

            // Target formula: Clean = Total - Errors - Alerts
            // We only fix if total > 0 and the current clean is significantly different from expected
            const expectedClean = Math.max(0, total - errors - alerts);
            
            // Using a small epsilon for float comparison
            if (Math.abs(currentClean - expectedClean) > 0.01) {
                await prisma.session.update({
                    where: { id: s.id },
                    data: { cleanPagesCount: expectedClean }
                });
                fixCount++;
                if (fixCount % 10 === 0) console.log(`🔄 Fixed ${fixCount} sessions...`);
            }
        }

        console.log(`\n✨ TASK COMPLETED:`);
        console.log(`- Date: ${today}`);
        console.log(`- Total sessions scanned: ${sessions.length}`);
        console.log(`- Anomalies corrected: ${fixCount}`);
        console.log(`- Status: Database is now synchronized with correct clean pages logic.`);

    } catch (error) {
        console.error("❌ ERROR during execution:", error);
    } finally {
        await prisma.$disconnect();
    }
}

backupAndFix();
