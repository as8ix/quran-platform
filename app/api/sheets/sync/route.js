import { prisma } from '@/app/lib/prisma';
import { getGoogleSheetsData } from '@/app/lib/googleSheets';
import { NextResponse } from 'next/server';

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
    // If there are multiple candidates, pick the best match (e.g. the one with more matching letters)
    return inclusionMatches.sort((a, b) => b.name.length - a.name.length)[0];
  }

  return null;
}

export async function POST(request) {
  try {
    // Read options from body (support selective sync)
    const body = await request.json().catch(() => ({}));
    const {
      syncNames = true,
      syncNationalIds = true,
      syncPhones = true,
      syncHalaqas = true,
      addNewStudents = true
    } = body;

    // 1. Fetch parsed data from the Google Sheet "لوحة التحكم"
    const sheetStudents = await getGoogleSheetsData();
    
    // 2. Fetch all existing students in the database
    const dbStudents = await prisma.student.findMany({
      include: {
        halaqa: true
      }
    });

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Cache of halaqas to avoid redundant DB calls
    const halaqaCache = {};

    // Keep track of processed national IDs in this sync batch to prevent duplicate rows in the spreadsheet from causing unique constraint errors
    const processedNationalIds = new Set();

    // Get the current max displayId to generate sequential displayIds for new students
    const lastStudent = await prisma.student.findFirst({
      orderBy: { displayId: 'desc' }
    });
    let currentMaxDisplayId = lastStudent?.displayId || 0;

    for (const sheetStudent of sheetStudents) {
      if (!sheetStudent.nationalId) {
        skippedCount++;
        continue; // National ID is our unique identifier, skip rows without it
      }

      // If we already processed this student in this batch, skip the duplicate row
      if (processedNationalIds.has(sheetStudent.nationalId)) {
        skippedCount++;
        continue;
      }
      processedNationalIds.add(sheetStudent.nationalId);

      // Check if student already exists in the database using advanced multi-step matching
      const existingStudent = findExistingStudent(sheetStudent, dbStudents);

      // Resolve their sheet halaqa (create if it doesn't exist)
      let targetHalaqaId = null;
      if (sheetStudent.halaqaName) {
        let normalizedHalaqaName = sheetStudent.halaqaName.trim();
        
        // Custom secondary school mapping rule:
        // Place "أول ثانوي" in "الأول ثانوي" halaqa, and "ثاني" & "ثالث" secondary in "زيد بن ثابت"
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
        if (syncNames) updateData.name = sheetStudent.name;
        if (syncPhones) {
          updateData.phone = sheetStudent.phone;
          updateData.parentPhone = sheetStudent.parentPhone;
        }
        if (syncNationalIds) {
          updateData.nationalId = sheetStudent.nationalId;
          if (sheetStudent.nationality) {
            updateData.nationality = sheetStudent.nationality;
          }
        }
        if (sheetStudent.joinDate) {
          updateData.joinDate = sheetStudent.joinDate;
        }
        if (sheetStudent.studentNotes) {
          updateData.studentNotes = sheetStudent.studentNotes;
        }

        // EXCEPTION RULE: Do NOT update halaqa if they are in "حلقة التكرار"
        const currentHalaqaName = existingStudent.halaqa?.name || '';
        const isTikarHalaqa = currentHalaqaName.includes('تكرار') || currentHalaqaName.includes('التكرار');

        if (syncHalaqas && !isTikarHalaqa && targetHalaqaId) {
          updateData.halaqaId = targetHalaqaId;
        }

        // Perform the update if there is any data to update
        if (Object.keys(updateData).length > 0) {
          await prisma.student.update({
            where: { id: existingStudent.id },
            data: updateData
          });
        }

        // Update in-memory cache to prevent other spreadsheet rows from double-matching this student
        if (syncNames) existingStudent.name = sheetStudent.name;
        if (syncNationalIds) {
          existingStudent.nationalId = sheetStudent.nationalId;
          if (sheetStudent.nationality) existingStudent.nationality = sheetStudent.nationality;
        }
        if (syncPhones) {
          existingStudent.phone = sheetStudent.phone;
          existingStudent.parentPhone = sheetStudent.parentPhone;
        }
        if (updateData.halaqaId) {
          existingStudent.halaqaId = updateData.halaqaId;
        }

        updatedCount++;
      } else {
        // --- CASE B: NEW STUDENT ---
        if (!addNewStudents) {
          skippedCount++;
          continue;
        }
        currentMaxDisplayId++;
        const nextDisplayId = currentMaxDisplayId;

        // Generate a clean and friendly English-only username: [Firstname_in_English]_[displayId]
        const firstName = sheetStudent.name.trim().split(/\s+/)[0];
        const finalUsername = `${transliterate(firstName)}_${nextDisplayId}`;

        const newStudentData = {
          name: sheetStudent.name,
          username: finalUsername,
          password: '123', // Default password
          displayId: nextDisplayId,
          nationalId: sheetStudent.nationalId,
          phone: sheetStudent.phone,
          parentPhone: sheetStudent.parentPhone,
          reviewPlan: sheetStudent.stage || null, // Store stage in review plan
          hifzProgress: sheetStudent.hifzProgress || 'الفاتحة', // Store current hifz progress
          juzCount: 0, // Default values
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

        // Add newly created student to our in-memory dbStudents array so they can be matched if needed
        dbStudents.push({
          ...newStudent,
          halaqa: targetHalaqaId ? { id: targetHalaqaId, name: sheetStudent.halaqaName } : null
        });

        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalProcessed: sheetStudents.length,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
      },
      message: `تمت عملية المزامنة بنجاح! إضافة ${createdCount} طالب جديد وتحديث ${updatedCount} طالب، وتخطي ${skippedCount} سطر بدون هوية أو مكرر.`
    });

  } catch (error) {
    console.error("Sheets Sync API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync Google Sheets data" },
      { status: 500 }
    );
  }
}
