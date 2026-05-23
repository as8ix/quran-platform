const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        console.log("Attempting to delete entries for studentId 74...");
        const result = await prisma.studyPlanEntry.deleteMany({
            where: { studentId: 74 }
        });
        console.log("Delete result:", result);
    } catch (err) {
        console.error("Delete failed with error:", err);
    }
}

run().finally(() => prisma.$disconnect());
