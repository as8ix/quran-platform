const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listResetStudents() {
    const halaqas = await prisma.halaqa.findMany();
    const uniHalaqa = halaqas.find(h => h.name.includes('الجامعيين') || h.name.includes('جامعيين'));
    
    if (uniHalaqa) {
        const students = await prisma.student.findMany({
            where: { halaqaId: uniHalaqa.id },
            select: { name: true, hifzProgress: true, juzCount: true }
        });
        console.log(`Halaqa: ${uniHalaqa.name}`);
        console.log('Students:', JSON.stringify(students, null, 2));
    }
    await prisma.$disconnect();
}
listResetStudents();
