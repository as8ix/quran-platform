const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const students = [
    "عبد الله كيال", "رضا علاء الرجب", "حمزة الابرش", "مؤيد تيجاني", "سليمان محمد شبير",
    "محمد يحيي", "علي تيجاني", "كرم طارق العمري", "عادل عمر العبدالله", "راكان عبد الله حافظ",
    "كريم كلوس", "احمد شحود", "عبد الملك الغيث", "ياسين اسامه أبو عيسى", "محمد اكرم محمد",
    "انس خضر", "شام فجر خالدو", "وسام محمد الشاردي", "عمر طارق", "سلمان يمان السباعي",
    "سام العبدالله", "عبد الرحمن النقيب", "وسام فجرو", "محمد السقاف", "فهد سلطان الثبيتي",
    "محمد عثمان", "حامد شادي التميمي", "محمد نايف أبو شرحة", "عمر نايف أبو شرحة",
    "أبو بكر محمد حسب الله", "خالد ذيب", "سلطان عدي", "مصطفى بهجت", "إبراهيم بخاري",
    "عبد الله زغلول", "عمر شامي", "عبد الله يوسف", "يحيى شحود", "تميم العولقي",
    "عبد الكافي ميسر", "يوسف المخلافي", "محسن العولقي", "فهمي محمد أبو لاوي",
    "اوس محمد أبو لاوي", "عبد الرحمن زغلول", "محمد غياث", "براء ضياء سراج الدين",
    "محمد رضوان الزحنوني"
];

const halaqaId = 5;

async function main() {
    console.log(`Starting to add ${students.length} students to halaqa ${halaqaId}...`);
    
    let count = 0;
    for (const name of students) {
        // Generate a simple username (e.g. first name in English + random)
        const username = `std_${Math.random().toString(36).substring(7)}_${count}`;
        
        try {
            await prisma.student.create({
                data: {
                    name: name,
                    username: username,
                    password: "123",
                    halaqaId: halaqaId,
                    hifzProgress: "لم يبدأ",
                    currentHifzSurahId: 114,
                    juzCount: 0,
                    reviewPlan: "نصف صفحة",
                    dailyTargetPages: 1,
                    joinDate: new Date(),
                    feeStatusSummer: "PENDING",
                    feeStatusTerm1: "PENDING",
                    feeStatusTerm2: "PENDING"
                }
            });
            count++;
            console.log(`Added: ${name}`);
        } catch (error) {
            console.error(`Failed to add ${name}:`, error.message);
        }
    }
    
    console.log(`Successfully added ${count} students.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
