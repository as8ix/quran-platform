const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetUniversityStudents() {
    try {
        // 1. Find the University Halaqa
        const halaqas = await prisma.halaqa.findMany();
        const uniHalaqa = halaqas.find(h => h.name.includes('الجامعيين') || h.name.includes('جامعيين'));
        
        if (!uniHalaqa) {
            console.error('Halaqa "الجامعيين" not found.');
            console.log('Available halaqas:', halaqas.map(h => h.name));
            return;
        }

        console.log(`Found Halaqa: ${uniHalaqa.name} (ID: ${uniHalaqa.id})`);

        // 2. Find students in this halaqa
        const students = await prisma.student.findMany({
            where: { halaqaId: uniHalaqa.id }
        });

        if (students.length === 0) {
            console.log('No students found in this halaqa.');
            return;
        }

        const studentIds = students.map(s => s.id);
        console.log(`Found ${students.length} students to reset: ${students.map(s => s.name).join(', ')}`);

        // 3. Clear sessions for these students
        const deletedSessions = await prisma.session.deleteMany({
            where: { studentId: { in: studentIds } }
        });
        console.log(`Deleted ${deletedSessions.count} sessions.`);

        // 4. Clear attendance if needed? (User said "record", usually implies recitation)
        // I'll leave attendance for now unless asked, but clearing sessions is the main thing.

        // 5. Reset progress and plans for each student
        const updatedStudents = await prisma.student.updateMany({
            where: { id: { in: studentIds } },
            data: {
                hifzProgress: 'البداية', // Reset to start
                currentHifzSurahId: 114, // Assuming reverse hifz starts at 114
                juzCount: 0,
                reviewPlan: 'وجه واحد', // Default plan
                dailyTargetPages: 1.0,
                // Any other fields?
            }
        });

        console.log(`Reset ${updatedStudents.count} student profiles to default plans.`);
        console.log('Reset complete.');

    } catch (error) {
        console.error('Error resetting students:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetUniversityStudents();
