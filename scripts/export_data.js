const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function exportData() {
    console.log('=== تصدير البيانات الحقيقية ===\n');

    // Get all data
    const users = await prisma.user.findMany();
    const halaqas = await prisma.halaqa.findMany();
    const students = await prisma.student.findMany();
    const sessions = await prisma.session.findMany();
    const attendance = await prisma.attendance.findMany();

    const data = {
        users,
        halaqas,
        students,
        sessions,
        attendance
    };

    // Create SQL INSERT statements for PostgreSQL
    console.log('-- SQL للنسخ واللصق في Vercel Postgres\n');
    console.log('-- 1. Users (المستخدمون)');
    users.forEach(u => {
        console.log(`INSERT INTO "User" (id, username, password, name, role, "createdAt") VALUES (${u.id}, '${u.username}', '${u.password}', '${u.name}', '${u.role}', '${u.createdAt.toISOString()}');`);
    });

    console.log('\n-- 2. Halaqas (الحلقات)');
    halaqas.forEach(h => {
        console.log(`INSERT INTO "Halaqa" (id, name, "teacherId", "createdAt") VALUES (${h.id}, '${h.name}', ${h.teacherId}, '${h.createdAt.toISOString()}');`);
    });

    console.log('\n-- 3. Students (الطلاب)');
    students.forEach(s => {
        console.log(`INSERT INTO "Student" (id, name, username, password, "hifzProgress", "currentHifzSurahId", "juzCount", "reviewPlan", "halaqaId", "createdAt") VALUES (${s.id}, '${s.name}', '${s.username}', '${s.password}', ${s.hifzProgress ? `'${s.hifzProgress}'` : 'NULL'}, ${s.currentHifzSurahId}, ${s.juzCount}, ${s.reviewPlan ? `'${s.reviewPlan}'` : 'NULL'}, ${s.halaqaId}, '${s.createdAt.toISOString()}');`);
    });

    console.log('\n-- 4. Sessions (الجلسات)');
    if (sessions.length > 0) {
        sessions.forEach(s => {
            console.log(`INSERT INTO "Session" (id, "studentId", date, "hifzSurah", "hifzFromPage", "hifzToPage", "hifzFromAyah", "hifzToAyah", "murajaahFromSurah", "murajaahFromAyah", "murajaahToSurah", "murajaahToAyah", "pagesCount", "resultString", notes, "errorsCount", "alertsCount", "cleanPagesCount") VALUES (...);`);
        });
    }

    console.log('\n-- 5. Attendance (الحضور)');
    if (attendance.length > 0) {
        attendance.forEach(a => {
            console.log(`INSERT INTO "Attendance" (id, "studentId", date, status) VALUES (${a.id}, ${a.studentId}, '${a.date.toISOString()}', '${a.status}');`);
        });
    }

    console.log('\n\n=== ملخص البيانات ===');
    console.log(`المستخدمون: ${users.length}`);
    console.log(`الحلقات: ${halaqas.length}`);
    console.log(`الطلاب: ${students.length}`);
    console.log(`الجلسات: ${sessions.length}`);
    console.log(`سجلات الحضور: ${attendance.length}`);

    // Also create JSON export
    const fs = require('fs');
    fs.writeFileSync('data-export.json', JSON.stringify(data, null, 2));
    console.log('\n✅ تم حفظ البيانات في: data-export.json');
}

exportData()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
