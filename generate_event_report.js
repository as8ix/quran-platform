const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Find active Quranic Event
        const activeEvent = await prisma.quranicEvent.findFirst({
            where: { isActive: true }
        });

        if (!activeEvent) {
            console.log('لا يوجد يوم قرآني نشط حالياً.');
            return;
        }

        console.log(`--- تقرير اليوم القرآني: ${activeEvent.name} ---\n`);

        // Get all sessions related to this event, including student info
        const sessions = await prisma.session.findMany({
            where: { quranicEventId: activeEvent.id },
            include: { student: true }
        });

        if (sessions.length === 0) {
            console.log('لا توجد جلسات مسجلة في هذا اليوم القرآني حتى الآن.');
            return;
        }

        // Aggregate data per student
        const studentStats = {};

        for (const session of sessions) {
            const stuId = session.student.id;
            const stuName = session.student.name;

            if (!studentStats[stuId]) {
                studentStats[stuId] = {
                    name: stuName,
                    alerts: 0,
                    errors: 0,
                    pages: 0,
                    cleanPages: 0
                };
            }

            // Sum up values
            // In the Quranic Days, they might log Hifz, Major, or Minor. 
            // We aggregate all errors from the session
            const sessionErrors = (session.errorsCount || 0) + (session.minorErrorsCount || 0) + (session.hifzErrors || 0);
            const sessionAlerts = (session.alertsCount || 0) + (session.minorAlertsCount || 0) + (session.hifzAlerts || 0);
            const sessionCleanPages = (session.cleanPagesCount || 0) + (session.minorCleanPagesCount || 0) + (session.hifzCleanPages || 0);
            const sessionPages = (session.pagesCount || 0); // Assuming pagesCount encompasses the total pages read

            studentStats[stuId].errors += sessionErrors;
            studentStats[stuId].alerts += sessionAlerts;
            studentStats[stuId].pages += sessionPages;
            studentStats[stuId].cleanPages += sessionCleanPages;
        }

        // Generate output message
        let outMsg = `📊 *ملخص إنجاز الطلاب في ${activeEvent.name}*\n\n`;

        for (const stuId in studentStats) {
            const stat = studentStats[stuId];
            outMsg += `👤 الطالب: ${stat.name}\n`;
            outMsg += `📖 الصفحات المقروءة: ${stat.pages} صفحة\n`;
            outMsg += `❌ الأخطاء: ${stat.errors}\n`;
            outMsg += `⚠️ التنبيهات: ${stat.alerts}\n`;
            if (stat.cleanPages > 0) {
                outMsg += `✨ الصفحات النقية: ${stat.cleanPages} صفحة\n`;
            }
            outMsg += `---------------------\n`;
        }

        console.log(outMsg);

    } catch (e) {
        console.error('Error fetching event data:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
