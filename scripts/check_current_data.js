const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== فحص البيانات الحالية ===\n');

    // Check Students
    const students = await prisma.student.findMany({
        select: {
            id: true,
            name: true,
            username: true,
            halaqaId: true,
            halaqa: { select: { name: true } }
        }
    });
    console.log(`📚 الطلاب (${students.length}):`);
    students.forEach(s => {
        const halaqaInfo = s.halaqaId ? `في حلقة: ${s.halaqa?.name}` : '❌ غير مسجل في حلقة';
        console.log(`  - [${s.id}] ${s.name} (@${s.username}) - ${halaqaInfo}`);
    });

    // Check Teachers
    const teachers = await prisma.user.findMany({
        where: { role: 'TEACHER' },
        select: {
            id: true,
            name: true,
            username: true,
            _count: {
                select: {
                    teacherHalaqas: true,
                    assistantHalaqas: true
                }
            }
        }
    });
    console.log(`\n👨‍🏫 المعلمون (${teachers.length}):`);
    teachers.forEach(t => {
        const halaqasCount = t._count.teacherHalaqas + t._count.assistantHalaqas;
        console.log(`  - [${t.id}] ${t.name} (@${t.username}) - ${halaqasCount} حلقات`);
    });

    // Check Halaqas
    const halaqas = await prisma.halaqa.findMany({
        include: {
            teacher: { select: { name: true } },
            _count: { select: { students: true } }
        }
    });
    console.log(`\n🕌 الحلقات (${halaqas.length}):`);
    halaqas.forEach(h => {
        console.log(`  - [${h.id}] ${h.name} - المعلم: ${h.teacher?.name || 'غير معين'} - ${h._count.students} طالب`);
    });

    // Summary
    const studentsInHalaqas = students.filter(s => s.halaqaId !== null).length;
    const studentsWithoutHalaqa = students.filter(s => s.halaqaId === null).length;

    console.log('\n=== ملخص ===');
    console.log(`✅ طلاب مسجلين في حلقات: ${studentsInHalaqas}`);
    console.log(`❌ طلاب غير مسجلين في حلقات: ${studentsWithoutHalaqa}`);
    console.log(`📊 إجمالي الطلاب: ${students.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
