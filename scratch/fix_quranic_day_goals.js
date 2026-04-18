const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixGoals() {
    console.log("🎯 Correcting Quranic Day achievement goals...");
    
    const juzStartPages = [
        0, 1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
        202, 222, 242, 262, 282, 302, 322, 342, 362, 382,
        402, 422, 442, 462, 482, 502, 522, 542, 562, 582
    ];

    try {
        const activeEvent = await prisma.quranicEvent.findFirst({ where: { isActive: true } });
        if (!activeEvent) return console.log("No active event found.");

        const sessions = await prisma.session.findMany({
            where: { quranicEventId: activeEvent.id },
            include: { student: true }
        });

        console.log(`Analyzing ${sessions.length} sessions from event: ${activeEvent.name}`);

        const participatingStudentIds = [...new Set(sessions.map(s => s.studentId))];
        let fixCount = 0;

        for (const sid of participatingStudentIds) {
            const studentSessions = sessions.filter(s => s.studentId === sid);
            const student = studentSessions[0].student;
            
            // Calculate Target Portion
            const count = Math.min(30, Math.max(0, student.juzCount || 0));
            let portionTarget = 20; 
            if (count > 0) {
                const startPage = juzStartPages[31 - count];
                portionTarget = (604 - startPage + 1);
            }

            // Total recited today in this event
            const totalRecited = studentSessions.reduce((sum, s) => sum + (s.pagesCount || 0), 0);
            const isFullTargetAchieved = totalRecited >= portionTarget;

            console.log(`Student: ${student.name} | Portions: ${count} | Target: ${portionTarget} | Total: ${totalRecited} | Result: ${isFullTargetAchieved ? '✅' : '❌'}`);

            // For each session of this student today, the 'isGoalAchieved' should ideally reflect 
            // if their TOTAL for the day met the portion target.
            // (Or at least, it shouldn't be 'true' if they haven't finished their portion yet).
            for (const session of studentSessions) {
                if (session.isGoalAchieved !== isFullTargetAchieved) {
                    await prisma.session.update({
                        where: { id: session.id },
                        data: { isGoalAchieved: isFullTargetAchieved }
                    });
                    fixCount++;
                }
            }
        }

        console.log(`\n✅ Finished. Corrected ${fixCount} goals.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fixGoals();
