const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLogos() {
  try {
    const halaqas = await prisma.halaqa.findMany({
      select: {
        id: true,
        name: true,
        logo: true
      }
    });
    
    console.log('--- Halaqa Logos Status ---');
    halaqas.forEach(h => {
      console.log(`ID: ${h.id} | Name: ${h.name} | Logo: ${h.logo ? '✅ Saved (Length: ' + h.logo.length + ' chars)' : '❌ No Logo'}`);
    });
  } catch (error) {
    console.error('Error checking logos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogos();
