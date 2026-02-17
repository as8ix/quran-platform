require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking for students...");
        const students = await prisma.student.findMany({ take: 1 });
        if (students.length === 0) {
            console.log("No students found. Can't test session creation.");
            return;
        }

        const student = students[0];
        console.log(`Found student: ${student.name} (ID: ${student.id})`);

        console.log("Attempting to create a test session...");
        const session = await prisma.session.create({
            data: {
                studentId: student.id,
                hifzSurah: "البقرة",
                hifzFromPage: 2,
                hifzToPage: 2,
                hifzFromAyah: 1,
                hifzToAyah: 5,
                pagesCount: 1,
                resultString: "1 صفحة",
                notes: "Test session from Antigravity",
                errorsCount: 0,
                alertsCount: 0,
                hifzErrors: 0,
                hifzAlerts: 0,
                hifzCleanPages: 1,
                cleanPagesCount: 0,
                isGoalAchieved: true,
                date: new Date()
            }
        });

        console.log("Session created successfully!", session);
    } catch (error) {
        console.error("Prisma Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
