const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching students and sessions...');
    const students = await prisma.student.findMany({
        include: {
            sessions: true
        }
    });

    let updatedCount = 0;

    for (const student of students) {
        const hifzTarget = student.dailyTargetPages || 0;

        let reviewTarget = 0;
        const plan = student.reviewPlan || '';
        if (plan.includes('نصف جزء')) reviewTarget = 10;
        else if (plan === 'جزء') reviewTarget = 20;
        else if (plan === 'جزئين') reviewTarget = 40;
        else if (plan.includes('ثلاث')) reviewTarget = 60;
        else if (plan === 'نصف صفحة') reviewTarget = 0.5;
        else if (plan === 'صفحة') reviewTarget = 1;
        else if (plan === 'صفحتين') reviewTarget = 2;
        else {
            if (!isNaN(parseFloat(plan))) reviewTarget = parseFloat(plan);
        }

        const sessionsByDate = {};
        for (const s of student.sessions) {
            // Form YYYY-MM-DD
            const d = new Date(s.date);
            const dateStr = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-');
            if (!sessionsByDate[dateStr]) sessionsByDate[dateStr] = [];
            sessionsByDate[dateStr].push(s);
        }

        // Check each day
        for (const dateStr of Object.keys(sessionsByDate)) {
            const dailySessions = sessionsByDate[dateStr];

            let totalHifzToday = 0;
            let totalReviewToday = 0;
            let hasQuranicDay = false;

            for (const s of dailySessions) {
                if (s.quranicEventId) hasQuranicDay = true;

                const hifzPages = (s.hifzFromPage && s.hifzToPage) ? (s.hifzToPage - s.hifzFromPage + 1) : 0;
                totalHifzToday += hifzPages;

                const sessionReview = (s.pagesCount || 0) - hifzPages;
                totalReviewToday += Math.max(0, sessionReview);
            }

            const isKhatim = student.juzCount === 30;
            const hifzMet = (isKhatim || hasQuranicDay || hifzTarget <= 0) ? true : (totalHifzToday >= hifzTarget);
            const reviewMet = (reviewTarget <= 0) ? true : (totalReviewToday >= reviewTarget);

            const isGoalAchieved = hifzMet && reviewMet;

            // update all sessions inside this day if they don't match
            for (const s of dailySessions) {
                if (s.isGoalAchieved !== isGoalAchieved) {
                    await prisma.session.update({
                        where: { id: s.id },
                        data: { isGoalAchieved }
                    });
                    updatedCount++;
                }
            }
        }
    }

    console.log(`Finished! Updated ${updatedCount} sessions.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());