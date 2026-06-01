const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Transliteration helper same as backend
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

async function main() {
    try {
        const students = await prisma.student.findMany({
            select: {
                id: true,
                name: true,
                username: true,
                displayId: true
            }
        });

        console.log(`Analyzing ${students.length} students in database...`);

        let fixedCount = 0;

        for (const student of students) {
            const usernameTrimmed = student.username.trim();
            
            // Criteria to fix a username:
            // 1. Consists only of digits (national ID format)
            // 2. Contains any Arabic characters (e.g. "أحمد", "وليد")
            const isDigits = /^\d+$/.test(usernameTrimmed);
            const hasArabic = /[\u0600-\u06FF]/.test(usernameTrimmed);

            if (isDigits || hasArabic) {
                const firstName = student.name.trim().split(/\s+/)[0];
                const englishFirst = transliterate(firstName);
                const identifier = student.displayId || student.id;
                const baseUsername = `${englishFirst}_${identifier}`;

                let attempt = 0;
                let success = false;
                let currentUsername = baseUsername;

                while (!success && attempt < 15) {
                    try {
                        await prisma.student.update({
                            where: { id: student.id },
                            data: { username: currentUsername }
                        });
                        success = true;
                        console.log(`Fixed Student ID ${student.id} ("${student.name}"): "${student.username}" -> "${currentUsername}"`);
                        fixedCount++;
                    } catch (err) {
                        if (err.code === 'P2002') {
                            attempt++;
                            currentUsername = `${baseUsername}_${Math.floor(Math.random() * 100)}`;
                        } else {
                            throw err;
                        }
                    }
                }
            }
        }

        console.log(`\nSuccessfully converted and fixed ${fixedCount} usernames to English.`);

    } catch (e) {
        console.error("Error during username conversion:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
