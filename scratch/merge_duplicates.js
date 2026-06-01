const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Normalization function same as backend
function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function mergeStudents(incompleteId, completeId) {
  console.log(`  Merging Student ID ${incompleteId} -> ID ${completeId}...`);

  // Move Attendance
  await prisma.attendance.updateMany({
    where: { studentId: incompleteId },
    data: { studentId: completeId }
  });

  // Move Sessions
  await prisma.session.updateMany({
    where: { studentId: incompleteId },
    data: { studentId: completeId }
  });

  // Move Exams
  await prisma.exam.updateMany({
    where: { studentId: incompleteId },
    data: { studentId: completeId }
  });

  // Move Notifications
  await prisma.notification.updateMany({
    where: { studentId: incompleteId },
    data: { studentId: completeId }
  });

  // Move Points
  await prisma.point.updateMany({
    where: { studentId: incompleteId },
    data: { studentId: completeId }
  });

  // Move StudyPlanEntries
  await prisma.studyPlanEntry.updateMany({
    where: { studentId: incompleteId },
    data: { studentId: completeId }
  });

  // Move EventAssignments (handles @@unique gracefully)
  const assignments = await prisma.eventAssignment.findMany({
    where: { studentId: incompleteId }
  });
  for (const assoc of assignments) {
    try {
      await prisma.eventAssignment.update({
        where: { id: assoc.id },
        data: { studentId: completeId }
      });
    } catch (e) {
      // If complete student already assigned, just delete duplicate assignment
      await prisma.eventAssignment.delete({ where: { id: assoc.id } });
    }
  }

  // Finally delete the duplicate incomplete student account
  await prisma.student.delete({
    where: { id: incompleteId }
  });
}

async function main() {
  try {
    const students = await prisma.student.findMany({
      include: {
        halaqa: true
      }
    });

    console.log(`Total students in DB: ${students.length}`);

    const completeStudents = students.filter(s => s.nationalId && s.nationalId.trim() !== '');
    const incompleteStudents = students.filter(s => !s.nationalId || s.nationalId.trim() === '');

    console.log(`Complete accounts (have national ID): ${completeStudents.length}`);
    console.log(`Incomplete accounts (no national ID): ${incompleteStudents.length}`);

    let mergedCount = 0;

    for (const incomplete of incompleteStudents) {
      const dbNameNorm = normalizeArabic(incomplete.name);
      const dbNameWords = dbNameNorm.split(' ');
      if (dbNameWords.length < 2) continue;

      // Find if there is a matching complete account
      const match = completeStudents.find(complete => {
        const sheetNameNorm = normalizeArabic(complete.name);
        const sheetNameWords = sheetNameNorm.split(' ');
        
        let lastIndex = -1;
        return dbNameWords.every(word => {
          const index = sheetNameWords.indexOf(word, lastIndex + 1);
          if (index > lastIndex) {
            lastIndex = index;
            return true;
          }
          return false;
        });
      });

      if (match) {
        console.log(`\nDuplicate Found:`);
        console.log(`- Incomplete Account: "${incomplete.name}" (ID: ${incomplete.id})`);
        console.log(`- Complete Account:   "${match.name}" (ID: ${match.id})`);
        
        await mergeStudents(incomplete.id, match.id);
        mergedCount++;
      }
    }

    console.log(`\nSuccessfully merged and cleaned up ${mergedCount} duplicate students.`);

  } catch (error) {
    console.error("Merge error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
