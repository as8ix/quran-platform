const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== بيانات تسجيل الدخول ===\n');

    const supervisor = await prisma.user.findUnique({
        where: { username: 'supervisor' }
    });

    if (supervisor) {
        console.log('✅ المشرف:');
        console.log(`   الاسم: ${supervisor.name}`);
        console.log(`   اسم المستخدم: ${supervisor.username}`);
        console.log(`   كلمة المرور: ${supervisor.password}`);
        console.log(`   الدور: ${supervisor.role}`);
    }

    const admin = await prisma.user.findUnique({
        where: { username: 'admin' }
    });

    if (admin) {
        console.log('\n✅ Admin:');
        console.log(`   الاسم: ${admin.name}`);
        console.log(`   اسم المستخدم: ${admin.username}`);
        console.log(`   كلمة المرور: ${admin.password}`);
        console.log(`   الدور: ${admin.role}`);
    } else {
        console.log('\n❌ لا يوجد مستخدم باسم "admin"');
        console.log('   استخدم: supervisor / admin123');
    }

    const teacher = await prisma.user.findUnique({
        where: { username: 'bassam' }
    });

    if (teacher) {
        console.log('\n✅ المعلم:');
        console.log(`   الاسم: ${teacher.name}`);
        console.log(`   اسم المستخدم: ${teacher.username}`);
        console.log(`   كلمة المرور: ${teacher.password}`);
        console.log(`   الدور: ${teacher.role}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
