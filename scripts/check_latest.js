require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const latestSession = await prisma.session.findFirst({
            orderBy: { date: 'desc' }
        });
        console.log("Latest Session in DB:", JSON.stringify(latestSession, null, 2));
    } catch (error) {
        console.error("Error fetching session:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
