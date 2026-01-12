const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Deleting Experimental Students ---');
    const usernamesToDelete = ['mohammed', 'Ali', 'basodan', 'salt', 'ashrf', 'ashir'];

    // First, delete related sessions and attendance to avoid foreign key issues
    const students = await prisma.student.findMany({
        where: { username: { in: usernamesToDelete } },
        select: { id: true }
    });

    const studentIds = students.map(s => s.id);

    if (studentIds.length > 0) {
        await prisma.attendance.deleteMany({ where: { studentId: { in: studentIds } } });
        await prisma.session.deleteMany({ where: { studentId: { in: studentIds } } });
        const deleted = await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
        console.log(`Successfully deleted ${deleted.count} students.`);
    } else {
        console.log('No students found to delete.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
