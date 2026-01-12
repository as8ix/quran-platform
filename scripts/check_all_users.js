const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== فحص جميع المستخدمين ===\n');

    // Check all users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            username: true,
            role: true
        }
    });

    console.log(`👥 جميع المستخدمين (${users.length}):`);
    users.forEach(u => {
        console.log(`  - [${u.id}] ${u.name} (@${u.username}) - ${u.role}`);
    });

    // Check specifically for admin/supervisor
    const supervisor = users.find(u => u.role === 'SUPERVISOR');
    if (supervisor) {
        console.log(`\n✅ المشرف موجود: ${supervisor.name} (@${supervisor.username})`);
    } else {
        console.log('\n❌ لا يوجد مشرف في النظام!');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
