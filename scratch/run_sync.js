const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

// Helper to normalize Arabic names for robust fuzzy matching
function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove diacritics
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper to normalize phone numbers to standard digit formats
function normalizePhone(p) {
  if (!p) return '';
  let clean = p.toString().replace(/\D/g, ''); // keep only digits
  if (clean.startsWith('966')) clean = clean.substring(3);
  if (clean.startsWith('0')) clean = clean.substring(1);
  return clean;
}

// Transliterate Arabic first name to English for standardized usernames
function transliterate(text) {
  if (!text) return '';
  const mapping = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
    'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
    'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'dh',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
    'ة': 'h', 'ء': 'a', 'ئ': 'e', 'ؤ': 'o',
    ' ': '_'
  };
  
  let clean = text.trim().toLowerCase();
  
  const commonNames = {
    'محمد': 'mohammed',
    'احمد': 'ahmed',
    'أحمد': 'ahmed',
    'عبدالله': 'abdullah',
    'عبد الله': 'abdullah',
    'عبدالرحمن': 'abdulrahman',
    'عبد الرحمن': 'abdulrahman',
    'عبدالعزيز': 'abdulaziz',
    'عبد العزيز': 'abdulaziz',
    'علي': 'ali',
    'عمر': 'omar',
    'ابراهيم': 'ibrahim',
    'إبراهيم': 'ibrahim',
    'اسماعيل': 'ismail',
    'إسماعيل': 'ismail',
    'يوسف': 'yousef',
    'خالد': 'khaled',
    'سلمان': 'salman',
    'اسامه': 'osama',
    'أسامة': 'osama',
    'انس': 'anas',
    'أنس': 'anas',
    'وليد': 'walid',
    'زياد': 'ziyad',
    'البراء': 'albaraa',
    'ابو بكر': 'abubakr',
    'أبو بكر': 'abubakr',
    'أبوبكر': 'abubakr',
    'فيصل': 'faisal',
    'سعد': 'saad'
  };

  if (commonNames[clean]) {
    return commonNames[clean];
  }

  let result = '';
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    result += mapping[char] || char;
  }
  return result.replace(/[^a-z0-9_]/g, '');
}

// Advanced multi-step matcher to associate spreadsheet rows with existing platform accounts
function findExistingStudent(sheetStudent, dbStudents) {
  // Step 1: Direct match by National ID or Username (highest precision)
  let match = dbStudents.find(s => 
    (s.nationalId && s.nationalId === sheetStudent.nationalId) || 
    (s.username && s.username === sheetStudent.nationalId)
  );
  if (match) return match;

  // Step 2: Match by Phone / Parent Phone (very high precision)
  const sheetPhone = normalizePhone(sheetStudent.phone);
  const sheetParentPhone = normalizePhone(sheetStudent.parentPhone);

  if (sheetPhone || sheetParentPhone) {
    match = dbStudents.find(s => {
      // Skip if they already have a different non-empty nationalId
      if (s.nationalId && s.nationalId !== sheetStudent.nationalId) {
        return false;
      }

      const dbPhone = normalizePhone(s.phone);
      const dbParentPhone = normalizePhone(s.parentPhone);
      
      return (sheetPhone && (dbPhone === sheetPhone || dbParentPhone === sheetPhone)) ||
             (sheetParentPhone && (dbPhone === sheetParentPhone || dbParentPhone === sheetParentPhone));
    });
    if (match) return match;
  }

  // Step 3: Match by Name Similarity (Inclusion and word order matching for short/partial names)
  const sheetNameNorm = normalizeArabic(sheetStudent.name);
  const sheetNameWords = sheetNameNorm.split(' ');

  const inclusionMatches = dbStudents.filter(s => {
    // If this DB student already has a different non-empty nationalId, they are not a candidate
    if (s.nationalId && s.nationalId !== sheetStudent.nationalId) {
      return false;
    }

    const dbNameNorm = normalizeArabic(s.name);
    const dbNameWords = dbNameNorm.split(' ');
    
    if (dbNameWords.length >= 2) {
      // Check if all DB words appear in the Sheet name in order
      let lastIndex = -1;
      const allWordsMatch = dbNameWords.every(word => {
        const index = sheetNameWords.indexOf(word, lastIndex + 1);
        if (index > lastIndex) {
          lastIndex = index;
          return true;
        }
        return false;
      });
      if (allWordsMatch) return true;
    }
    return false;
  });

  if (inclusionMatches.length === 1) {
    return inclusionMatches[0]; // Unique match!
  } else if (inclusionMatches.length > 1) {
    // If there are multiple candidates, pick the best match
    return inclusionMatches.sort((a, b) => b.name.length - a.name.length)[0];
  }

  return null;
}

async function runSync() {
  console.log("Starting Google Sheets direct synchronization...");

  try {
    // Load ESM getGoogleSheetsData
    const { getGoogleSheetsData } = await import('../app/lib/googleSheets.js');
    
    // 1. Fetch spreadsheet students
    const sheetStudents = await getGoogleSheetsData();
    console.log(`Successfully fetched ${sheetStudents.length} rows from Google Sheets.`);

    // 2. Fetch DB students
    const dbStudents = await prisma.student.findMany({
      include: {
        halaqa: true
      }
    });
    console.log(`Found ${dbStudents.length} existing students in the database.`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const halaqaCache = {};
    const processedNationalIds = new Set();

    const lastStudent = await prisma.student.findFirst({
      orderBy: { displayId: 'desc' }
    });
    let currentMaxDisplayId = lastStudent?.displayId || 0;

    for (const sheetStudent of sheetStudents) {
      if (!sheetStudent.nationalId) {
        skippedCount++;
        continue;
      }

      if (processedNationalIds.has(sheetStudent.nationalId)) {
        skippedCount++;
        continue;
      }
      processedNationalIds.add(sheetStudent.nationalId);

      const existingStudent = findExistingStudent(sheetStudent, dbStudents);

      let targetHalaqaId = null;
      if (sheetStudent.halaqaName) {
        let normalizedHalaqaName = sheetStudent.halaqaName.trim();
        
        const isSecondaryHalaqa = normalizedHalaqaName === 'الثانوية' || 
                                   normalizedHalaqaName === 'الثانوي' || 
                                   normalizedHalaqaName === 'ثانوي' ||
                                   normalizedHalaqaName === 'زيد بن ثابت' ||
                                   normalizedHalaqaName === 'الأول ثانوي';

        if (isSecondaryHalaqa) {
          const studentStage = sheetStudent.stage ? sheetStudent.stage.trim() : '';
          const isFirstSecondary = studentStage.includes('أول') || studentStage.includes('اول');
          
          if (isFirstSecondary) {
            normalizedHalaqaName = 'الأول ثانوي';
          } else {
            normalizedHalaqaName = 'زيد بن ثابت';
          }
        }

        if (halaqaCache[normalizedHalaqaName]) {
          targetHalaqaId = halaqaCache[normalizedHalaqaName];
        } else {
          let dbHalaqa = await prisma.halaqa.findFirst({
            where: { name: normalizedHalaqaName }
          });
          if (!dbHalaqa) {
            dbHalaqa = await prisma.halaqa.create({
              data: { name: normalizedHalaqaName }
            });
          }
          halaqaCache[normalizedHalaqaName] = dbHalaqa.id;
          targetHalaqaId = dbHalaqa.id;
        }
      }

      if (existingStudent) {
        // --- CASE A: STUDENT ALREADY EXISTS ---
        const updateData = {};
        // Sync everything by default
        updateData.name = sheetStudent.name;
        updateData.phone = sheetStudent.phone;
        updateData.parentPhone = sheetStudent.parentPhone;
        updateData.nationalId = sheetStudent.nationalId;
        
        if (sheetStudent.nationality) {
          updateData.nationality = sheetStudent.nationality;
        }
        if (sheetStudent.joinDate) {
          updateData.joinDate = sheetStudent.joinDate;
        }
        if (sheetStudent.studentNotes) {
          updateData.studentNotes = sheetStudent.studentNotes;
        }

        const currentHalaqaName = existingStudent.halaqa?.name || '';
        const isTikarHalaqa = currentHalaqaName.includes('تكرار') || currentHalaqaName.includes('التكرار');

        if (!isTikarHalaqa && targetHalaqaId) {
          updateData.halaqaId = targetHalaqaId;
        }

        // Perform update
        await prisma.student.update({
          where: { id: existingStudent.id },
          data: updateData
        });

        // Update cache
        existingStudent.name = sheetStudent.name;
        existingStudent.nationalId = sheetStudent.nationalId;
        existingStudent.phone = sheetStudent.phone;
        existingStudent.parentPhone = sheetStudent.parentPhone;
        if (sheetStudent.nationality) existingStudent.nationality = sheetStudent.nationality;
        if (updateData.halaqaId) existingStudent.halaqaId = updateData.halaqaId;

        updatedCount++;
      } else {
        // --- CASE B: NEW STUDENT ---
        currentMaxDisplayId++;
        const nextDisplayId = currentMaxDisplayId;

        const firstName = sheetStudent.name.trim().split(/\s+/)[0];
        const finalUsername = `${transliterate(firstName)}_${nextDisplayId}`;

        const newStudentData = {
          name: sheetStudent.name,
          username: finalUsername,
          password: '123',
          displayId: nextDisplayId,
          nationalId: sheetStudent.nationalId,
          phone: sheetStudent.phone,
          parentPhone: sheetStudent.parentPhone,
          reviewPlan: sheetStudent.stage || null,
          hifzProgress: sheetStudent.hifzProgress || 'الفاتحة',
          juzCount: 0,
          nationality: sheetStudent.nationality || null,
          joinDate: sheetStudent.joinDate || new Date(),
          studentNotes: sheetStudent.studentNotes || null,
        };

        if (targetHalaqaId) {
          newStudentData.halaqaId = targetHalaqaId;
        }

        const newStudent = await prisma.student.create({
          data: newStudentData
        });

        dbStudents.push({
          ...newStudent,
          halaqa: targetHalaqaId ? { id: targetHalaqaId, name: sheetStudent.halaqaName } : null
        });

        createdCount++;
      }
    }

    console.log("\n================ SYNC SUMMARY ================");
    console.log(`Total processed spreadsheet rows: ${sheetStudents.length}`);
    console.log(`Created new students: ${createdCount}`);
    console.log(`Updated existing students: ${updatedCount}`);
    console.log(`Skipped rows (empty/duplicate): ${skippedCount}`);
    console.log("==============================================\n");

  } catch (error) {
    console.error("Synchronization failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runSync();
