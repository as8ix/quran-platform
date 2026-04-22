const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log("Testing Prisma DB push effect...");
        
        // Find a session
        const session = await prisma.session.findFirst();
        if (!session) {
            console.log("No sessions found.");
            return;
        }

        // Try to update cleanPagesCount to 0.5
        const updated = await prisma.session.update({
            where: { id: session.id },
            data: { cleanPagesCount: 0.5 }
        });

        console.log("Updated session cleanPagesCount:", updated.cleanPagesCount);

        // Try to update back to whatever it was
        await prisma.session.update({
            where: { id: session.id },
            data: { cleanPagesCount: session.cleanPagesCount }
        });

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
