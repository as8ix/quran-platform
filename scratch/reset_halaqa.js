
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetHalaqa() {
    try {
        // 1. Find the Halaqa
        const halaqa = await prisma.halaqa.findFirst({
            where: {
                name: {
                    contains: 'الجامعيين'
                }
            }
        });

        if (!halaqa) {
            console.log('Halaqa "حلقة الجامعيين" not found.');
            return;
        }

        console.log(`Found Halaqa: ${halaqa.name} (ID: ${halaqa.id})`);

        // 2. Get all students in this halaqa
        const students = await prisma.student.findMany({
            where: {
                halaqaId: halaqa.id
            },
            select: {
                id: true,
                name: true
            }
        });

        console.log(`Found ${students.length} students to reset.`);
        const studentIds = students.map(s => s.id);

        // 3. Delete all sessions for these students
        const deleteSessions = await prisma.session.deleteMany({
            where: {
                studentId: {
                    in: studentIds
                }
            }
        });

        console.log(`Deleted ${deleteSessions.count} session records.`);

        // 4. Reset student plans and progress
        const updateStudents = await prisma.student.updateMany({
            where: {
                halaqaId: halaqa.id
            },
            data: {
                reviewPlan: 'جزء', // Default plan
                dailyTargetPages: 1, // Default target
                currentHifzSurahId: 1, // Reset to Baqarah start
                hifzProgress: 'لم يبدأ',
                juzCount: 0,
                // We keep their names and halaqaId
            }
        });

        console.log(`Reset plans and progress for ${updateStudents.count} students.`);
        console.log('Reset completed successfully.');

    } catch (error) {
        console.error('Error during reset:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetHalaqa();
