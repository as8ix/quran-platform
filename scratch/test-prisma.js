const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const halaqas = await prisma.halaqa.findMany();
        console.log('Halaqas count:', halaqas.length);
        if (halaqas.length > 0) {
            console.log('First halaqa pointsEnabled:', halaqas[0].pointsEnabled);
        }
    } catch (e) {
        console.error('Error accessing pointsEnabled:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
