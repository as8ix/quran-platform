const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("--- Creating Test Student ---");

        // Find or create the halaqa
        let halaqa = await prisma.halaqa.findFirst();
        if (!halaqa) {
            halaqa = await prisma.halaqa.create({
                data: {
                    name: "حلقة الاختبار",
                    teacherId: 10 // Assuming teacher ID 10 exists from seed
                }
            });
        }

        const student = await prisma.student.upsert({
            where: { username: "test_student" },
            update: {},
            create: {
                name: "طالب تجريبي",
                username: "test_student",
                password: "123",
                halaqaId: halaqa.id,
                juzCount: 5,
                hifzProgress: "البقرة"
            }
        });

        console.log(`✅ Student created: ${student.name} (@${student.username})`);
    } catch (e) {
        console.error("❌ Error creating student:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
