import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { quranData } from '@/app/data/quranData';
import { pageAyahMap } from '@/app/data/pageAyahMap';

// GET: Fetch student plan entries
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'studentId required' }, { status: 400 });
        }

        const entries = await prisma.studyPlanEntry.findMany({
            where: { studentId: parseInt(studentId) },
            orderBy: { date: 'asc' }
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error("GET Student Plan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete single or clear entire plan
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const studentId = searchParams.get('studentId');
        const clearAll = searchParams.get('clearAll') === 'true';

        if (clearAll) {
            if (!studentId) {
                return NextResponse.json({ error: 'studentId required to clear plan' }, { status: 400 });
            }
            await prisma.studyPlanEntry.deleteMany({
                where: { studentId: parseInt(studentId) }
            });
            return NextResponse.json({ message: 'تم مسح الخطة بالكامل بنجاح' });
        }

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        await prisma.studyPlanEntry.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'تم حذف البند بنجاح' });
    } catch (error) {
        console.error("DELETE Student Plan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Add custom entry OR Auto-generate plan
export async function POST(request) {
    try {
        const body = await request.json();
        const { action, studentId } = body;

        if (!studentId) {
            return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
        }

        if (action === 'create') {
            const { date, type, surahId, fromAyah, toAyah } = body;
            const newEntry = await prisma.studyPlanEntry.create({
                data: {
                    Student: {
                        connect: { id: parseInt(studentId) }
                    },
                    date: new Date(date),
                    type,
                    surahId: parseInt(surahId),
                    fromAyah: parseInt(fromAyah),
                    toAyah: parseInt(toAyah),
                    isCompleted: false
                }
            });
            return NextResponse.json(newEntry);
        }

        if (action === 'generate') {
            const { startSurahId, endSurahId, dailyPages, dailyReview, startDate, direction } = body;
            
            const startSId = parseInt(startSurahId);
            const endSId = parseInt(endSurahId);
            const numDailyPages = parseFloat(dailyPages) || 1.0;
            const numDailyReview = parseFloat(dailyReview) || 0.0;

            const startSurah = quranData.find(s => s.id === startSId);
            const endSurah = quranData.find(s => s.id === endSId);

            if (!startSurah || !endSurah) {
                return NextResponse.json({ error: 'السورة المحددة غير صالحة' }, { status: 400 });
            }

            // 1. Get page boundaries
            const getSurahEndPage = (sId) => {
                const nextS = quranData.find(s => s.id === sId + 1);
                return nextS ? nextS.startPage - 1 : 604;
            };

            const startPage = startSurah.startPage;
            const endPage = getSurahEndPage(endSId);

            // 2. Gather list of portions (surah-page portions) to schedule
            const portionsToSchedule = [];
            const isBackward = direction === 'backward';
            
            const minSurahId = Math.min(startSId, endSId);
            const maxSurahId = Math.max(startSId, endSId);
            const surahIds = [];
            if (isBackward) {
                for (let s = maxSurahId; s >= minSurahId; s--) {
                    surahIds.push(s);
                }
            } else {
                for (let s = minSurahId; s <= maxSurahId; s++) {
                    surahIds.push(s);
                }
            }

            surahIds.forEach(sId => {
                const pages = [];
                Object.keys(pageAyahMap).forEach(pageStr => {
                    const pageMapping = pageAyahMap[pageStr];
                    if (pageMapping && pageMapping[sId.toString()]) {
                        pages.push(parseInt(pageStr));
                    }
                });
                
                // Sort pages ascending so we memorize this surah from start to end (beginning to end)
                pages.sort((a, b) => a - b);
                
                pages.forEach(p => {
                    const pageMapping = pageAyahMap[p.toString()];
                    if (pageMapping && pageMapping[sId.toString()]) {
                        const port = pageMapping[sId.toString()];
                        portionsToSchedule.push({
                            surahId: sId,
                            page: p,
                            start: parseInt(port.start) || 1,
                            end: parseInt(port.end) || 1
                        });
                    }
                });
            });

            // Group consecutive portions that share the same page to allow small surahs (like An-Nas, Al-Falaq, Al-Ikhlas) to be memorized together on a single page-day
            const groupedDays = [];
            let currentGroup = [];
            
            portionsToSchedule.forEach(portion => {
                if (currentGroup.length === 0) {
                    currentGroup.push(portion);
                } else {
                    if (portion.page === currentGroup[0].page) {
                        currentGroup.push(portion);
                    } else {
                        groupedDays.push({
                            page: currentGroup[0].page,
                            portions: [...currentGroup]
                        });
                        currentGroup = [portion];
                    }
                }
            });
            
            if (currentGroup.length > 0) {
                groupedDays.push({
                    page: currentGroup[0].page,
                    portions: [...currentGroup]
                });
            }

            await prisma.studyPlanEntry.deleteMany({
                where: { studentId: parseInt(studentId) }
            });

            // 4. Generate plan entries for active days (Sunday to Wednesday only)
            const allowedPlanDays = [0, 1, 2, 3];
            let currentDate = new Date(startDate || new Date());
            if (isNaN(currentDate.getTime())) {
                currentDate = new Date();
            }
            currentDate.setHours(0, 0, 0, 0);

            const getNextActiveDate = (date) => {
                const d = new Date(date);
                if (isNaN(d.getTime())) {
                    return new Date();
                }
                let safety = 0;
                while (!allowedPlanDays.includes(d.getDay()) && safety < 100) {
                    d.setDate(d.getDate() + 1);
                    safety++;
                }
                return d;
            };

            // Build cumulative memorized pool of pages before starting to simulate real review boundaries
            const cumulativePool = [];
            if (isBackward) {
                for (let p = startPage + 1; p <= 604; p++) {
                    cumulativePool.push(p);
                }
            } else {
                for (let p = 1; p < startPage; p++) {
                    cumulativePool.push(p);
                }
            }

            const getSurahAtPage = (page) => {
                const surahsOnPage = [...quranData]
                    .filter(s => s.startPage <= page)
                    .sort((a, b) => b.startPage - a.startPage);
                return surahsOnPage[0]?.id || 114;
            };

            let reviewPointer = 0;

            const getReviewEntryForDate = (dateToUse) => {
                if (numDailyReview <= 0 || cumulativePool.length === 0) {
                    return null;
                }
                const targetReviewCount = Math.min(Math.round(numDailyReview), cumulativePool.length);
                const reviewPages = [];
                for (let i = 0; i < targetReviewCount; i++) {
                    const pIdx = (reviewPointer + i) % cumulativePool.length;
                    reviewPages.push(cumulativePool[pIdx]);
                }
                reviewPointer = (reviewPointer + targetReviewCount) % cumulativePool.length;
                
                const minPage = Math.min(...reviewPages);
                const maxPage = Math.max(...reviewPages);
                const reviewSurahId = getSurahAtPage(minPage);

                return {
                    studentId: parseInt(studentId),
                    date: dateToUse,
                    type: 'MURAJAAH',
                    surahId: reviewSurahId,
                    fromAyah: minPage,
                    toAyah: maxPage,
                    isCompleted: false
                };
            };

            const entriesToCreate = [];

            let dayIdx = 0;
            while (dayIdx < groupedDays.length) {
                currentDate = getNextActiveDate(currentDate);

                if (numDailyPages >= 1) {
                    const group = groupedDays[dayIdx];
                    const rEntry = getReviewEntryForDate(currentDate);
                    if (rEntry) {
                        entriesToCreate.push(rEntry);
                    }
                    group.portions.forEach(portion => {
                        entriesToCreate.push({
                            studentId: parseInt(studentId),
                            date: new Date(currentDate),
                            type: 'HIFZ',
                            surahId: portion.surahId,
                            fromAyah: portion.start,
                            toAyah: portion.end,
                            isCompleted: false
                        });
                    });

                    if (!cumulativePool.includes(group.page)) {
                        cumulativePool.push(group.page);
                    }
                    dayIdx++;
                } else if (numDailyPages === 0.5) {
                    const group = groupedDays[dayIdx];

                    // Day 1: first half of all portions in the group
                    const scheduledDate1 = new Date(currentDate);
                    const rEntry1 = getReviewEntryForDate(scheduledDate1);
                    if (rEntry1) {
                        entriesToCreate.push(rEntry1);
                    }
                    group.portions.forEach(portion => {
                        const mid = Math.round((portion.start + portion.end) / 2);
                        entriesToCreate.push({
                            studentId: parseInt(studentId),
                            date: scheduledDate1,
                            type: 'HIFZ',
                            surahId: portion.surahId,
                            fromAyah: portion.start,
                            toAyah: mid,
                            isCompleted: false
                        });
                    });

                    // Day 2: second half of all portions in the group
                    currentDate.setDate(currentDate.getDate() + 1);
                    currentDate = getNextActiveDate(currentDate);
                    const scheduledDate2 = new Date(currentDate);
                    const rEntry2 = getReviewEntryForDate(scheduledDate2);
                    if (rEntry2) {
                        entriesToCreate.push(rEntry2);
                    }
                    group.portions.forEach(portion => {
                        const mid = Math.round((portion.start + portion.end) / 2);
                        entriesToCreate.push({
                            studentId: parseInt(studentId),
                            date: scheduledDate2,
                            type: 'HIFZ',
                            surahId: portion.surahId,
                            fromAyah: Math.min(mid + 1, portion.end),
                            toAyah: portion.end,
                            isCompleted: false
                        });
                    });

                    if (!cumulativePool.includes(group.page)) {
                        cumulativePool.push(group.page);
                    }
                    dayIdx++;
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Create all entries in a single high-performance bulk insertion (takes milliseconds)
            if (entriesToCreate.length > 0) {
                await prisma.studyPlanEntry.createMany({
                    data: entriesToCreate.map(entry => ({
                        studentId: parseInt(entry.studentId),
                        date: entry.date,
                        type: entry.type,
                        surahId: parseInt(entry.surahId) || 114,
                        fromAyah: parseInt(entry.fromAyah) || 1,
                        toAyah: parseInt(entry.toAyah) || 1,
                        isCompleted: entry.isCompleted
                    }))
                });
            }

            return NextResponse.json({
                success: true,
                message: `تم توليد الخطة بنجاح لمجموع ${portionsToSchedule.length} أجزاء موزعة على الأيام النشطة.`,
                count: entriesToCreate.length
            });
        }

        return NextResponse.json({ error: 'أمر غير معروف' }, { status: 400 });
    } catch (error) {
        console.error("POST Student Plan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
