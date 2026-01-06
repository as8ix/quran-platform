require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.student.deleteMany({});

    const students = [
        { name: 'أحمد بن علي', hifzProgress: 'سورة البقرة', juzCount: 2, reviewPlan: 'نصف جزء يومياً' },
        { name: 'بدر العتيبي', hifzProgress: 'سورة الكهف', juzCount: 16, reviewPlan: 'جزء واحد يومياً' },
        { name: 'خالد محمد', hifzProgress: 'جزء عم كامل', juzCount: 1, reviewPlan: 'سورتين يومياً' },
        { name: 'سلطان القحطاني', hifzProgress: 'خاتم للقرآن', juzCount: 30, reviewPlan: '3 أجزاء يومياً' },
        { name: 'عبدالله السعدي', hifzProgress: 'من جزء تبارك', juzCount: 29, reviewPlan: 'نصف جزء' },
        { name: 'فهد الرشيدي', hifzProgress: 'سورة يس', juzCount: 7, reviewPlan: 'جزء' },
    ];

    for (const s of students) {
        await prisma.student.create({ data: s });
    }

    console.log('Seed completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
