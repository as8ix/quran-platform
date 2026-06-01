const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const students = await prisma.student.findMany({
            select: {
                id: true,
                name: true,
                username: true,
                displayId: true
            }
        });

        console.log(`Analyzing ${students.length} students...`);

        let fixedCount = 0;

        for (const student of students) {
            // Check if username consists only of digits (which means it's a national ID)
            const isNationalIdUsername = /^\d+$/.test(student.username.trim());

            if (isNationalIdUsername) {
                const firstName = student.name.trim().split(/\s+/)[0];
                const identifier = student.displayId || student.id;
                const baseUsername = `${firstName}_${identifier}`;

                let attempt = 0;
                let success = false;
                let currentUsername = baseUsername;

                while (!success && attempt < 10) {
                    try {
                        await prisma.student.update({
                            where: { id: student.id },
                            data: { username: currentUsername }
                        });
                        success = true;
                        console.log(`Updated Student ID ${student.id} ("${student.name}"): "${student.username}" -> "${currentUsername}"`);
                        fixedCount++;
                    } catch (err) {
                        if (err.code === 'P2002') {
                            attempt++;
                            currentUsername = `${baseUsername}_${Math.floor(Math.random() * 100)}`;
                        } else {
                            throw err;
                        }
                    }
                }
            }
        }

        console.log(`\nSuccessfully fixed ${fixedCount} usernames.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
