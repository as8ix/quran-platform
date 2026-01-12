const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("--- Starting Notification System Test ---");

        // 1. Get a Student
        const student = await prisma.student.findFirst();
        if (!student) {
            console.log("❌ No students found to test with.");
            return;
        }
        console.log(`Checking student: ${student.name} (ID: ${student.id})`);

        // 2. Simulate Supervisor Sending 'WARNING' Notification
        console.log("\n--- Test 1: Supervisor sending WARNING ---");
        const supervisorNotif = await prisma.notification.create({
            data: {
                studentId: student.id,
                title: "تنبيه هام جداً",
                message: "يرجى الحضور مبكراً للاختبار.",
                type: "WARNING",
                senderRole: "SUPERVISOR",
                senderId: 1, // Assumptions
                attachmentUrl: "https://example.com/warning.png",
                attachmentType: "IMAGE",
                isRead: false
            }
        });
        console.log("✅ Supervisor Notification Created:");
        console.log(`   Title: ${supervisorNotif.title}`);
        console.log(`   Type: ${supervisorNotif.type} (Should be WARNING)`);
        console.log(`   Attachment: ${supervisorNotif.attachmentUrl}`);

        // 3. Simulate Teacher Sending 'PROPOSAL' Notification
        console.log("\n--- Test 2: Teacher sending PROPOSAL ---");
        const teacherNotif = await prisma.notification.create({
            data: {
                studentId: student.id,
                title: "مقترح لحفظك",
                message: "أنصحك بالاستماع للشيخ الحصري.",
                type: "PROPOSAL",
                senderRole: "TEACHER",
                senderId: 2, // Assumption
                attachmentUrl: "https://youtube.com/watch?v=123",
                attachmentType: "LINK",
                isRead: false
            }
        });
        console.log("✅ Teacher Notification Created:");
        console.log(`   Title: ${teacherNotif.title}`);
        console.log(`   Type: ${teacherNotif.type} (Should be PROPOSAL)`);
        console.log(`   Attachment: ${teacherNotif.attachmentType}`);

        // 4. Verify Fetching (Simulate Navbar fetch)
        console.log("\n--- Test 3: Fetching Notifications for Student ---");
        const notifications = await prisma.notification.findMany({
            where: { studentId: student.id },
            orderBy: { createdAt: 'desc' },
            take: 2
        });

        if (notifications.length >= 2) {
            console.log(`✅ Successfully fetched ${notifications.length} notifications.`);
            console.log(`   Latest: "${notifications[0].title}"`);
        } else {
            console.log("❌ Failed to fetch notifications.");
        }

    } catch (e) {
        console.error("❌ Test Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
