const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStats() {
    try {
        console.log("Fetching counts...");
        const [
            studentCount,
            teacherCount,
            halaqaCount,
            allStudents,
            allPoints,
            attendanceStats
        ] = await Promise.all([
            prisma.student.count(),
            prisma.teacher.count(), // wait, is it 'teacher' or 'user' with role teacher?
            prisma.halaqa.count(),
            prisma.student.findMany({
                select: { juzCount: true, halaqaId: true }
            }),
            prisma.point.aggregate({
                _sum: { amount: true }
            }),
            prisma.attendance.groupBy({
                by: ['status'],
                _count: { id: true }
            })
        ]);

        console.log("Results:", {
            studentCount,
            teacherCount,
            halaqaCount,
            points: allPoints,
            attendance: attendanceStats
        });
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

testStats();
