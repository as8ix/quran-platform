const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting full database backup...");
  
  const tables = [
    'user', 'student', 'halaqa', 'point', 'attendance', 'session', 
    'quranicEvent', 'eventAssignment', 'notification', 'exam', 'holiday', 
    'studyPlanEntry', 'khayrukumCertificate'
  ];

  const backupData = {};

  for (const table of tables) {
    console.log(`Exporting ${table}...`);
    backupData[table] = await prisma[table].findMany();
  }

  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(backupDir, `db_backup_${timestamp}.json`);
  
  fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));
  console.log(`Backup completed successfully to ${filename}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
