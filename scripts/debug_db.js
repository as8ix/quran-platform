require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Testing database connection and session creation...");

        // Check if the columns exist by fetching one session
        const sessions = await prisma.session.findMany({ take: 1 });
        console.log("Successfully connected and fetched sessions.");
        if (sessions.length > 0) {
            console.log("Existing session sample:", sessions[0]);
        } else {
            console.log("No sessions found in database.");
        }

        // Try creating a minimalist session to see if it works
        const students = await prisma.student.findMany({ take: 1 });
        if (students.length > 0) {
            const sid = students[0].id;
            console.log(`Attempting to create session for student ID: ${sid}`);
            const newSession = await prisma.session.create({
                data: {
                    studentId: sid,
                    pagesCount: 0,
                    isGoalAchieved: false,
                    date: new Date()
                }
            });
            console.log("Successfully created session!", newSession.id);
        } else {
            console.log("No students found to create a session for.");
        }

    } catch (error) {
        console.error("DATABASE ERROR FOUND:");
        console.error(error.message);
        if (error.code === 'P2021') console.log("Suggestion: Table does not exist.");
        if (error.message.includes('column') || error.message.includes('field')) {
            console.log("Suggestion: Schema/DB mismatch. You likely need to run 'npx prisma db push'.");
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
