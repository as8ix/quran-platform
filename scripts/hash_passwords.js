const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log("Starting password hashing migration...");

    // 1. Hash Users (Teachers/Supervisors)
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users to migrate.`);
    let userCount = 0;
    for (const user of users) {
        // Only hash if not already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
        if (!user.password.startsWith('$2')) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });
            userCount++;
        }
    }
    console.log(`Successfully hashed ${userCount} user passwords.`);

    // 2. Hash Students
    const students = await prisma.student.findMany();
    console.log(`Found ${students.length} students to migrate.`);
    let studentCount = 0;
    for (const student of students) {
        if (!student.password.startsWith('$2')) {
            const hashedPassword = await bcrypt.hash(student.password, 10);
            await prisma.student.update({
                where: { id: student.id },
                data: { password: hashedPassword }
            });
            studentCount++;
        }
    }
    console.log(`Successfully hashed ${studentCount} student passwords.`);

    console.log("Password hashing migration completed successfully.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
