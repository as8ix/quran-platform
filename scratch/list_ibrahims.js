const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const students = await prisma.student.findMany({
        where: {
            name: {
                contains: 'ابراهيم'
            }
        }
    });
    console.log(students.length);
    students.forEach(s => console.log(s.id, s.name));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
