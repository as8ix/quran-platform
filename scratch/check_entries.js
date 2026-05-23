const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const count = await prisma.studyPlanEntry.count();
    console.log("Total studyPlanEntry count:", count);
    
    const entries = await prisma.studyPlanEntry.findMany({
        take: 10,
        orderBy: { date: 'asc' }
    });
    console.log("First 10 entries:", JSON.stringify(entries, null, 2));
}

check().finally(() => prisma.$disconnect());
