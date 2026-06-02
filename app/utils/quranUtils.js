import { quranData } from '../data/quranData';
import { pageAyahMap } from '../data/pageAyahMap';

export const normalizeSurahName = (name) => {
    if (!name) return '';
    return name.replace('سورة ', '').trim();
};

export const getExactPosition = (surahId, ayahNum, isEnd = false) => {
    if (!surahId || isNaN(surahId) || ayahNum === '' || ayahNum === undefined) return null;
    let p = 1;
    const surahObj = quranData.find(s => s.id === surahId);
    if (surahObj) {
        p = surahObj.startPage;

        const maxPage = Math.min(604, surahObj.startPage + 50);
        for (let i = surahObj.startPage; i <= maxPage; i++) {
            if (!pageAyahMap || !pageAyahMap[i]) continue;
            const sData = pageAyahMap[i][String(surahId)];
            if (sData) {
                const start = Number((typeof sData === 'object') ? sData.start : sData);
                const end = Number((typeof sData === 'object') ? sData.end : sData);

                if (Number(ayahNum) >= start && Number(ayahNum) <= end) {
                    p = i;
                    break;
                }
            }
        }
    }

    if (!pageAyahMap || !pageAyahMap[p]) return p;

    let totalAyahsOnPage = 0;
    let ayahsBefore = 0;

    const mapKeys = Object.keys(pageAyahMap[p]).map(Number).sort((a, b) => a - b);

    for (const sId of mapKeys) {
        const sData = pageAyahMap[p][String(sId)];
        const sStart = Number((typeof sData === 'object') ? sData.start : 1);
        const sEnd = Number((typeof sData === 'object') ? sData.end : sData);
        const sWeight = (typeof sData === 'object' && sData.weight) ? sData.weight : (sEnd - sStart + 1);
        
        totalAyahsOnPage += sWeight;

        if (Number(sId) < Number(surahId)) {
            ayahsBefore += sWeight;
        } else if (Number(sId) === Number(surahId)) {
            const ayahCountInS = (sEnd - sStart + 1);
            let effectiveAyah = Number(ayahNum);
            if (effectiveAyah < sStart) effectiveAyah = sStart;
            if (effectiveAyah > sEnd) effectiveAyah = sEnd;

            const progressInSurah = isEnd ? (effectiveAyah - sStart + 1) : (effectiveAyah - sStart);
            const weightedProgress = (progressInSurah / ayahCountInS) * sWeight;
            
            ayahsBefore += weightedProgress;
        }
    }

    const totalWeightOnPage = (pageAyahMap[p] && pageAyahMap[p].totalWeight) || totalAyahsOnPage;
    if (!totalWeightOnPage || totalWeightOnPage === 0) return p;

    const finalPos = p + (ayahsBefore / totalWeightOnPage);
    return isNaN(finalPos) ? p : finalPos;
};

export const getAyahAtPosition = (pos) => {
    if (isNaN(pos) || pos === null) return null;
    let pageNum = Math.floor(pos);
    let fraction = pos - pageNum;
    
    if (fraction < 0.001 && pageNum > 1) {
        pageNum = pageNum - 1;
        fraction = 0.999;
    }

    const pageData = pageAyahMap[String(pageNum)];
    if (!pageData) return null;

    const surahsOnPage = Object.keys(pageData).filter(k => k !== 'totalWeight').map(Number).sort((a, b) => a - b);
    if (surahsOnPage.length === 0) return null;

    const totalWeight = pageData.totalWeight || 15;
    const targetWeight = fraction * totalWeight;

    let accumulatedWeight = 0;
    for (const sid of surahsOnPage) {
        const data = pageData[String(sid)];
        const start = (typeof data === 'object') ? data.start : 1;
        const end = (typeof data === 'object') ? data.end : data;
        const weight = (typeof data === 'object' && data.weight) ? data.weight : (end - start + 1);

        if (targetWeight <= accumulatedWeight + weight) {
            const weightInS = targetWeight - accumulatedWeight;
            const ayahCount = (end - start + 1);
            const ayahOffset = Math.floor((weightInS / weight) * ayahCount);
            return { surahId: sid, ayah: Math.max(start, Math.min(end, start + ayahOffset)) };
        }
        accumulatedWeight += weight;
    }

    const lastSid = surahsOnPage[surahsOnPage.length - 1];
    const lastData = pageData[String(lastSid)];
    return { surahId: lastSid, ayah: (typeof lastData === 'object' ? lastData.end : lastData) };
};

export const getSurahPages = (surahId) => {
    const surah = quranData.find(s => s.id === surahId);
    if (!surah) return [];
    const nextSurah = quranData.find(s => s.id === surahId + 1);
    let endPage = nextSurah ? nextSurah.startPage : 604;
    
    if (pageAyahMap && pageAyahMap[endPage]) {
        if (!pageAyahMap[endPage][surahId]) {
            endPage = endPage - 1;
        }
    }
    const pages = [];
    for (let i = surah.startPage; i <= endPage; i++) pages.push(i);
    return pages;
};
