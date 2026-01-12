const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Send to Student ID 10 (or first found)
        const student = await prisma.student.findFirst();

        if (!student) {
            console.log('No students found');
            return;
        }

        console.log(`Sending notification to student: ${student.name} (ID: ${student.id})`);

        const notif = await prisma.notification.create({
            data: {
                studentId: student.id,
                message: "مرحباً! هذا إشعار تجريبي جديد للتأكد من عمل النظام.",
                type: "INFO",
                isRead: false
            }
        });

        console.log('Notification sent:', notif);

        const notifWarning = await prisma.notification.create({
            data: {
                studentId: student.id,
                message: "تنبيه: يرجى مراجعة الحفظ اليوم!",
                type: "WARNING",
                isRead: false
            }
        });
        console.log('Warning Notification sent:', notifWarning);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
