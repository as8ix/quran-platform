const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const oldIbrahimId = 16;
  const newIbrahimId = 98;

  console.log('Merging sessions from student 98 to student 16...');
  
  // 1. Move sessions
  const updatedSessions = await prisma.session.updateMany({
    where: { studentId: newIbrahimId },
    data: { studentId: oldIbrahimId }
  });
  console.log(`Moved ${updatedSessions.count} sessions.`);

  // 2. Move points
  const updatedPoints = await prisma.point.updateMany({
    where: { studentId: newIbrahimId },
    data: { studentId: oldIbrahimId }
  });
  console.log(`Moved ${updatedPoints.count} points.`);

  // 3. Move attendance
  const updatedAttendance = await prisma.attendance.updateMany({
    where: { studentId: newIbrahimId },
    data: { studentId: oldIbrahimId }
  });
  console.log(`Moved ${updatedAttendance.count} attendance records.`);

  // 4. Update old Ibrahim's Halaqa and other details if needed
  await prisma.student.update({
    where: { id: oldIbrahimId },
    data: { 
      halaqaId: 3,
      // Maybe also update juzCount or hifzProgress if the new one was more recent?
      // ID 98 had juzCount 8, ID 16 had 0.
      juzCount: 8,
      hifzProgress: 'يس',
      currentHifzSurahId: 36
    }
  });
  console.log('Updated student 16 with Halaqa 3 and progress.');

  // 5. Delete new Ibrahim
  await prisma.student.delete({
    where: { id: newIbrahimId }
  });
  console.log('Deleted duplicate student 98.');

  console.log('DONE.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
