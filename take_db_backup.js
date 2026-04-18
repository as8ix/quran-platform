const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fetching all sessions...');
    const sessions = await prisma.session.findMany();
    console.log('Fetching all students...');
    const students = await prisma.student.findMany();
    
    const backup = {
      timestamp: new Date().toISOString(),
      sessions: sessions,
      students: students
    };

    fs.writeFileSync('db_backup_before_pages_fix.json', JSON.stringify(backup, null, 2), 'utf8');
    console.log('Database backup completed successfully. Saved to db_backup_before_pages_fix.json');
    console.log('Total Sessions Backed Up:', sessions.length);
  } catch (error) {
    console.error('Backup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
