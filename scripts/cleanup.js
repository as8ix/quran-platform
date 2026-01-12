const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Data Cleanup ---');

    // 1. Delete Dummy Students
    const dummyUsernames = ['ahmed', 'bader', 'khaled'];
    const deletedStudents = await prisma.student.deleteMany({
        where: {
            username: { in: dummyUsernames }
        }
    });
    console.log(`Deleted ${deletedStudents.count} dummy students.`);

    // 2. Delete Dummy Teacher if it exists and has no real halaqas
    const dummyTeacher = await prisma.user.findUnique({
        where: { username: 'teacher' }
    });

    if (dummyTeacher) {
        // Check if this teacher is used in any halaqas OTHER than the dummy one (id 1)
        const halaqasCount = await prisma.halaqa.count({
            where: {
                OR: [
                    { teacherId: dummyTeacher.id },
                    { assistants: { some: { id: dummyTeacher.id } } }
                ],
                NOT: { id: 1 } // Exclude the dummy halaqa
            }
        });

        if (halaqasCount === 0) {
            // Unlink from dummy halaqa first
            await prisma.halaqa.updateMany({
                where: { id: 1 },
                data: { teacherId: null }
            });

            // Delete the dummy teacher
            await prisma.user.delete({ where: { id: dummyTeacher.id } });
            console.log('Deleted dummy teacher "teacher".');
        } else {
            console.log('Dummy teacher "teacher" is being used by real halaqas, skipping deletion.');
        }
    }

    // 3. Delete Dummy Halaqa if it exists and has no real students
    const dummyHalaqa = await prisma.halaqa.findUnique({
        where: { id: 1 },
        include: { _count: { select: { students: true } } }
    });

    if (dummyHalaqa && dummyHalaqa._count.students === 0) {
        await prisma.halaqa.delete({ where: { id: 1 } });
        console.log('Deleted dummy halaqa "حلقة النور".');
    } else if (dummyHalaqa) {
        console.log('Dummy halaqa "حلقة النور" still has students, skipping deletion.');
    }

    console.log('--- Cleanup Finished! ---');
}

main()
    .catch((e) => {
        console.error('Cleanup failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
