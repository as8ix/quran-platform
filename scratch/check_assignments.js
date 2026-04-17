const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssignments() {
    try {
        const activeEvent = await prisma.quranicEvent.findFirst({
            where: { isActive: true },
            include: {
                assignments: {
                    include: {
                        student: true
                    }
                }
            }
        });

        if (!activeEvent) {
            console.log("No active event found.");
            return;
        }

        console.log("Event Name:", activeEvent.name);
        console.log("Assignment Count:", activeEvent.assignments.length);
        
        const uniqueStudents = [...new Set(activeEvent.assignments.map(a => a.studentId))];
        console.log("Unique Students Assigned:", uniqueStudents.length);

        activeEvent.assignments.forEach(a => {
            console.log(`Student: ${a.student.name}, JuzCount: ${a.student.juzCount}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAssignments();
