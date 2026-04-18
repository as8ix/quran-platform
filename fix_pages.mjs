import { PrismaClient } from '@prisma/client';
import { quranData } from './app/data/quranData.js';
import { exactAyahMap } from './app/data/exactAyahMap.js';

const prisma = new PrismaClient();

const getSurahId = (name) => {
    if (!name) return null;
    const s = quranData.find(x => x.name === name);
    return s ? s.id : null;
};

const getExactPosition = (surahId, ayahNum, isEnd = false) => {
    if (exactAyahMap && exactAyahMap[surahId] && exactAyahMap[surahId][ayahNum]) {
        const data = exactAyahMap[surahId][ayahNum];
        if (isEnd) return (data.p - 1) + (data.e / 15);
        return (data.p - 1) + ((data.s - 1) / 15);
    }
    return null;
};

const orderBounds = (sFrom, aFrom, sTo, aTo) => {
    if (sFrom > sTo || (sFrom === sTo && aFrom > aTo)) {
        return { s1: sTo, a1: aTo, s2: sFrom, a2: aFrom };
    }
    return { s1: sFrom, a1: aFrom, s2: sTo, a2: aTo };
};

async function main() {
    console.log('Starting recalculation for all sessions...');
    const sessions = await prisma.session.findMany();
    let updatedCount = 0;

    for (const session of sessions) {
        let needsUpdate = false;
        let majorVal = 0;
        
        let mFromSurah = getSurahId(session.murajaahFromSurah);
        let mFromAyah = session.murajaahFromAyah;
        let mToSurah = getSurahId(session.murajaahToSurah);
        let mToAyah = session.murajaahToAyah;

        if (mFromSurah && mToSurah && typeof mFromAyah === 'number' && typeof mToAyah === 'number') {
            const bounds = orderBounds(mFromSurah, mFromAyah, mToSurah, mToAyah);
            const startPos = getExactPosition(bounds.s1, bounds.a1, false);
            const endPos = getExactPosition(bounds.s2, bounds.a2, true);
            
            if (startPos !== null && endPos !== null) {
                let val = endPos - startPos;
                if (val === 0 && (mFromSurah !== mToSurah || mFromAyah !== mToAyah)) val = 0.5;
                majorVal += val;
            }
        }
        
        // Also minor murajaah, though usually they are recorded into the same pagesCount
        // Currently DB only has one pagesCount float. 
        // We evaluate major and minor and sum them just like the old behavior (Wait, frontend sets pagesCount = majorVal, and minorVal is stored separately locally, but wait! There is no minorPagesCount in the DB. Result string holds the value maybe?)
        let minorVal = 0;
        let minorMFromSurah = getSurahId(session.minorMurajaahFromSurah);
        let minorMFromAyah = session.minorMurajaahFromAyah;
        let minorMToSurah = getSurahId(session.minorMurajaahToSurah);
        let minorMToAyah = session.minorMurajaahToAyah;

        if (minorMFromSurah && minorMToSurah && typeof minorMFromAyah === 'number' && typeof minorMToAyah === 'number') {
            const bounds = orderBounds(minorMFromSurah, minorMFromAyah, minorMToSurah, minorMToAyah);
            const startPos = getExactPosition(bounds.s1, bounds.a1, false);
            const endPos = getExactPosition(bounds.s2, bounds.a2, true);
            
            if (startPos !== null && endPos !== null) {
                let val = endPos - startPos;
                if (val === 0 && (minorMFromSurah !== minorMToSurah || minorMFromAyah !== minorMToAyah)) val = 0.5;
                minorVal += val;
            }
        }

        // Apply new rounding
        majorVal = Math.ceil(majorVal * 4) / 4;
        if (majorVal === 0 && (mFromSurah !== mToSurah || mFromAyah !== mToAyah)) majorVal = 0.25;

        minorVal = Math.ceil(minorVal * 4) / 4;
        if (minorVal === 0 && (minorMFromSurah !== minorMToSurah || minorMFromAyah !== minorMToAyah)) minorVal = 0.25;

        let totalPages = majorVal; 
        
        // Actually earlier code in the frontend just did setPagesCount(majorVal)
        if (totalPages > 0 && session.pagesCount !== totalPages) {
           console.log('Session ' + session.id + ': Updating pagesCount from ' + session.pagesCount + ' to ' + totalPages);
           
           // If we also want to fix resultString
           let newResultString = totalPages + ' صفحة';
           
           // We ONLY update if pagesCount or resultString needs correction.
           await prisma.session.update({
               where: { id: session.id },
               data: {
                   pagesCount: totalPages,
                   resultString: newResultString
               }
           });
           updatedCount++;
        }
    }
    
    console.log('Finished recalculation. Total records updated: ' + updatedCount);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
