// constants for khayrukum branches and logic to determine eligibility

export const KHAYRUKUM_BRANCHES = [
    { number: 1,  label: 'الفرع الأول',        parts: 'جزء واحد',            juzRequired: 1,  endSurah: 'النبأ (78)',       endSurahId: 78 },
    { number: 2,  label: 'الفرع الثاني',       parts: 'جزءان',               juzRequired: 2,  endSurah: 'الملك (67)',       endSurahId: 67 },
    { number: 3,  label: 'الفرع الثالث',       parts: 'ثلاثة أجزاء',         juzRequired: 3,  endSurah: 'المجادلة (58)',    endSurahId: 58 },
    { number: 4,  label: 'الفرع الرابع',       parts: 'خمسة أجزاء',          juzRequired: 5,  endSurah: 'الأحقاف (46)',    endSurahId: 46 },
    { number: 5,  label: 'الفرع الخامس',       parts: 'ثمانية أجزاء',        juzRequired: 8,  endSurah: 'يس (36)',          endSurahId: 36 },
    { number: 6,  label: 'الفرع السادس',       parts: 'عشرة أجزاء',          juzRequired: 10, endSurah: 'الروم (30)',       endSurahId: 30 },
    { number: 7,  label: 'الفرع السابع',       parts: 'ثلاثة عشر جزءاً',    juzRequired: 13, endSurah: 'المؤمنون (23)',    endSurahId: 23 },
    { number: 8,  label: 'الفرع الثامن',       parts: 'خمسة عشر جزءاً',     juzRequired: 15, endSurah: 'مريم (19)',        endSurahId: 19 },
    { number: 9,  label: 'الفرع التاسع',       parts: 'عشرون جزءاً',         juzRequired: 20, endSurah: 'يونس (10)',        endSurahId: 10 },
    { number: 10, label: 'الفرع العاشر',       parts: 'خمسة وعشرون جزءاً',  juzRequired: 25, endSurah: 'المائدة (5)',      endSurahId: 5 },
    { number: 11, label: 'الفرع الحادي عشر',  parts: 'القرآن كاملاً',        juzRequired: 30, endSurah: 'الفاتحة (1)',      endSurahId: 1 },
];

/**
 * Returns the highest branch a student is eligible for based on their juz count
 * @param {number} juzCount - The number of juz the student has memorized
 * @returns {object|null} - The branch object or null if not eligible for any
 */
export const getHighestEligibleBranch = (juzCount) => {
    if (typeof juzCount !== 'number' || juzCount < 1) return null;
    
    // Sort descending to find highest first
    const sortedBranches = [...KHAYRUKUM_BRANCHES].sort((a, b) => b.juzRequired - a.juzRequired);
    return sortedBranches.find(branch => juzCount >= branch.juzRequired) || null;
};

/**
 * Returns the branches a student is fully eligible for but hasn't earned yet.
 * @param {number} juzCount - The student's total juz count
 * @param {number} currentSurahId - Current surah ID the student is memorizing
 * @param {Array} certificates - Array of certificate objects {branchNumber: number}
 * @returns {Array} - Array of branch objects
 */
export const getPendingEligibleBranches = (juzCount, currentSurahId, certificates = []) => {
    const earnedBranchNumbers = certificates.map(cert => parseInt(cert.branchNumber));
    
    return KHAYRUKUM_BRANCHES.filter(branch => {
        const hasJuz = juzCount >= branch.juzRequired;
        // Since memorization goes from 114 to 1, reaching past the branch means currentSurahId < endSurahId
        // Exception: Branch 11 (Whole Quran) where endSurahId is 1, and there is no surah < 1.
        const hasPassedSurah = currentSurahId ? 
            (branch.number === 11 && juzCount >= 30 ? true : currentSurahId < branch.endSurahId) 
            : true;
        
        return hasJuz && hasPassedSurah && !earnedBranchNumbers.includes(branch.number);
    });
};

/**
 * Returns the next branch the student is very close to completing (within 1-2 surahs)
 * @param {number} currentSurahId - Current surah ID the student is memorizing
 * @param {Array} certificates - Array of certificate objects {branchNumber: number}
 * @returns {object|null} - The branch object or null
 */
export const getAlmostEligibleBranch = (currentSurahId, certificates = []) => {
    if (!currentSurahId) return null;
    
    const earnedBranchNumbers = certificates.map(cert => parseInt(cert.branchNumber));
    
    // Find the first branch they haven't earned yet
    const nextUnearnedBranch = KHAYRUKUM_BRANCHES.find(b => !earnedBranchNumbers.includes(b.number));
    
    if (!nextUnearnedBranch) return null;

    // Check if the student is currently memorizing the endSurah of that branch,
    // OR the surah exactly preceding it (e.g., endSurahId + 1 because they memorize backwards from 114 to 1)
    if (currentSurahId === nextUnearnedBranch.endSurahId || currentSurahId === nextUnearnedBranch.endSurahId + 1) {
        return nextUnearnedBranch;
    }
    
    return null;
};
