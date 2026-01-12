const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting seed process...');

    // Read data-export.json
    const dataPath = path.join(__dirname, '..', 'data-export.json');
    if (!fs.existsSync(dataPath)) {
        console.error('❌ Error: data-export.json not found!');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`📦 Loaded data: ${data.users.length} users, ${data.halaqas.length} halaqas, ${data.students.length} students`);

    // Helper to parse date
    const toDate = (d) => d ? new Date(d) : undefined;

    // 1. Seed Users
    console.log('\n-- Seeding Users --');
    for (const u of data.users) {
        process.stdout.write(`Processing User: ${u.username}... `);
        await prisma.user.upsert({
            where: { username: u.username },
            update: {
                password: u.password,
                name: u.name,
                role: u.role,
                createdAt: toDate(u.createdAt)
            },
            create: {
                id: u.id,
                username: u.username,
                password: u.password,
                name: u.name,
                role: u.role,
                createdAt: toDate(u.createdAt)
            }
        });
        console.log('✅');
    }

    // 2. Seed Halaqas
    console.log('\n-- Seeding Halaqas --');
    for (const h of data.halaqas) {
        process.stdout.write(`Processing Halaqa: ${h.name}... `);
        await prisma.halaqa.upsert({
            where: { id: h.id },
            update: {
                name: h.name,
                teacherId: h.teacherId,
                createdAt: toDate(h.createdAt)
            },
            create: {
                id: h.id,
                name: h.name,
                teacherId: h.teacherId,
                createdAt: toDate(h.createdAt)
            }
        });
        console.log('✅');
    }

    // 3. Seed Students
    console.log('\n-- Seeding Students --');
    for (const s of data.students) {
        process.stdout.write(`Processing Student: ${s.name}... `);
        await prisma.student.upsert({
            where: { username: s.username },
            update: {
                name: s.name,
                password: s.password,
                hifzProgress: s.hifzProgress,
                currentHifzSurahId: s.currentHifzSurahId,
                juzCount: s.juzCount,
                reviewPlan: s.reviewPlan,
                halaqaId: s.halaqaId,
                createdAt: toDate(s.createdAt)
            },
            create: {
                id: s.id,
                name: s.name,
                username: s.username,
                password: s.password,
                hifzProgress: s.hifzProgress,
                currentHifzSurahId: s.currentHifzSurahId,
                juzCount: s.juzCount,
                reviewPlan: s.reviewPlan,
                halaqaId: s.halaqaId,
                createdAt: toDate(s.createdAt)
            }
        });
        console.log('✅');
    }

    // 4. Seed Sessions
    console.log('\n-- Seeding Sessions --');
    for (const sess of data.sessions) {
        const existing = await prisma.session.findUnique({ where: { id: sess.id } });
        if (!existing) {
            await prisma.session.create({
                data: {
                    id: sess.id,
                    studentId: sess.studentId,
                    date: toDate(sess.date),
                    hifzSurah: sess.hifzSurah,
                    hifzFromPage: sess.hifzFromPage,
                    hifzToPage: sess.hifzToPage,
                    hifzFromAyah: sess.hifzFromAyah,
                    hifzToAyah: sess.hifzToAyah,
                    murajaahFromSurah: sess.murajaahFromSurah,
                    murajaahFromAyah: sess.murajaahFromAyah,
                    murajaahToSurah: sess.murajaahToSurah,
                    murajaahToAyah: sess.murajaahToAyah,
                    pagesCount: sess.pagesCount,
                    resultString: sess.resultString,
                    notes: sess.notes,
                    errorsCount: sess.errorsCount || 0,
                    alertsCount: sess.alertsCount || 0,
                    cleanPagesCount: sess.cleanPagesCount || 0
                }
            });
        }
    }
    console.log(`Initialized ${data.sessions.length} sessions.`);

    // 5. Seed Attendance
    console.log('\n-- Seeding Attendance --');
    for (const att of data.attendance) {
        const existing = await prisma.attendance.findUnique({ where: { id: att.id } });
        if (!existing) {
            await prisma.attendance.create({
                data: {
                    id: att.id,
                    studentId: att.studentId,
                    date: toDate(att.date),
                    status: att.status
                }
            });
        }
    }
    console.log(`Initialized ${data.attendance.length} attendance records.`);

    console.log('\n✅ Database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
