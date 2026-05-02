const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearNotifications() {
    try {
        console.log('Clearing all notifications...');
        const result = await prisma.notification.deleteMany({});
        console.log(`Successfully deleted ${result.count} notifications.`);
    } catch (error) {
        console.error('Error clearing notifications:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearNotifications();
