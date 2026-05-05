const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdel() {
    try {
        const adel = await prisma.user.findFirst({
            where: { name: { contains: 'عادل' } }
        });
        
        if (!adel) {
            console.log("User Adel not found");
            return;
        }

        console.log(`User: ${adel.name} (ID: ${adel.id})`);

        const halaqas = await prisma.halaqa.findMany({
            where: {
                OR: [
                    { teacherId: adel.id },
                    { assistants: { some: { id: adel.id } } }
                ]
            },
            select: { id: true, name: true, pointsEnabled: true }
        });

        console.log("Adel's Halaqas:");
        console.table(halaqas);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdel();
