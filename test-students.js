const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const students = await prisma.student.findMany({
        where: {
            OR: [
                { nationalId: { not: null, not: "" } },
                { phone: { not: null, not: "" } },
                { parentPhone: { not: null, not: "" } }
            ]
        }
    });
    console.log(students.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        parentPhone: s.parentPhone,
        nationalId: s.nationalId
    })));
}

check().finally(() => prisma.$disconnect());
