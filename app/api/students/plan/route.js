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

            // 2. Gather list of pages
            let pagesToSchedule = [];
            if (direction === 'backward') {
                // From higher pages down to lower pages (e.g. 604 down to 582)
                // When memorizing backwards, the surah sequence goes 114 down to 78, so pages decrease
                const minPage = Math.min(startPage, endPage);
                const maxPage = Math.max(startPage, endPage);
                for (let p = maxPage; p >= minPage; p--) {
                    pagesToSchedule.push(p);
                }
            } else {
                // Forward: 1 to 604
                const minPage = Math.min(startPage, endPage);
                const maxPage = Math.max(startPage, endPage);
                for (let p = minPage; p <= maxPage; p++) {
                    pagesToSchedule.push(p);
                }
            }

            // 3. Clear any existing plan entries first
            await prisma.studyPlanEntry.deleteMany({
                where: { studentId: parseInt(studentId) }
            });

            // 4. Generate plan entries for active days (Sunday to Wednesday only)
            // Sunday (0), Monday (1), Tuesday (2), Wednesday (3)
            const activeDays = [0, 1, 2, 3];
            let currentDate = new Date(startDate);
            currentDate.setHours(0, 0, 0, 0);

            const getNextActiveDate = (date) => {
                const d = new Date(date);
                while (!activeDays.includes(d.getDay())) {
                    d.setDate(d.getDate() + 1);
                }
                return d;
            };

            const entriesToCreate = [];

            let pageIdx = 0;
            while (pageIdx < pagesToSchedule.length) {
                currentDate = getNextActiveDate(currentDate);

                // Determine pages for today based on dailyPages target
                let pagesForToday = [];
                if (numDailyPages >= 1) {
                    const count = Math.min(Math.round(numDailyPages), pagesToSchedule.length - pageIdx);
                    for (let i = 0; i < count; i++) {
                        pagesForToday.push(pagesToSchedule[pageIdx + i]);
                    }
                    pageIdx += count;
                } else if (numDailyPages === 0.5) {
                    // Half a page means we schedule 1 page over 2 consecutive active days
                    const page = pagesToSchedule[pageIdx];
                    
                    // Day 1: first half
                    pagesForToday.push({ page, part: 1 });
                    
                    // Advance index only after Day 2 is scheduled (we'll handle it sequentially)
                    // Push Day 1 entries
                    const scheduledDate1 = new Date(currentDate);
                    const mapping = pageAyahMap[page.toString()];
                    if (mapping) {
                        Object.keys(mapping).forEach(surahKey => {
                            const start = parseInt(mapping[surahKey].start) || 1;
                            const end = parseInt(mapping[surahKey].end) || 1;
                            const mid = Math.round((start + end) / 2);
                            entriesToCreate.push({
                                studentId: parseInt(studentId),
                                date: scheduledDate1,
                                type: 'HIFZ',
                                surahId: parseInt(surahKey) || 114,
                                fromAyah: start,
                                toAyah: mid,
                                isCompleted: false
                            });
                        });
                    }

                    // Add Murajaah if specified
                    if (numDailyReview > 0) {
                        entriesToCreate.push({
                            studentId: parseInt(studentId),
                            date: scheduledDate1,
                            type: 'MURAJAAH',
                            surahId: 1, // Fallback/Placeholder
                            fromAyah: 1,
                            toAyah: Math.round(numDailyReview) || 1,
                            isCompleted: false
                        });
                    }

                    // Move to next active day for Day 2 (second half)
                    currentDate.setDate(currentDate.getDate() + 1);
                    currentDate = getNextActiveDate(currentDate);
                    const scheduledDate2 = new Date(currentDate);

                    if (mapping) {
                        Object.keys(mapping).forEach(surahKey => {
                            const start = parseInt(mapping[surahKey].start) || 1;
                            const end = parseInt(mapping[surahKey].end) || 1;
                            const mid = Math.round((start + end) / 2);
                            entriesToCreate.push({
                                studentId: parseInt(studentId),
                                date: scheduledDate2,
                                type: 'HIFZ',
                                surahId: parseInt(surahKey) || 114,
                                fromAyah: Math.min(mid + 1, end) || 1,
                                toAyah: end,
                                isCompleted: false
                            });
                        });
                    }

                    // Add Murajaah if specified
                    if (numDailyReview > 0) {
                        entriesToCreate.push({
                            studentId: parseInt(studentId),
                            date: scheduledDate2,
                            type: 'MURAJAAH',
                            surahId: 1,
                            fromAyah: 1,
                            toAyah: Math.round(numDailyReview) || 1,
                            isCompleted: false
                        });
                    }

                    pageIdx++;
                    currentDate.setDate(currentDate.getDate() + 1);
                    continue; // Skip the general full page scheduling block below
                } else {
                    // Fallback
                    pagesForToday.push(pagesToSchedule[pageIdx]);
                    pageIdx++;
                }

                // Create entries for the full/multiple pages assigned to today
                const scheduledDate = new Date(currentDate);
                pagesForToday.forEach(page => {
                    const mapping = pageAyahMap[page.toString()];
                    if (mapping) {
                        Object.keys(mapping).forEach(surahKey => {
                            entriesToCreate.push({
                                studentId: parseInt(studentId),
                                date: scheduledDate,
                                type: 'HIFZ',
                                surahId: parseInt(surahKey) || 114,
                                fromAyah: parseInt(mapping[surahKey].start) || 1,
                                toAyah: parseInt(mapping[surahKey].end) || 1,
                                isCompleted: false
                            });
                        });
                    }
                });

                // Add Murajaah entry for this date if specified
                if (numDailyReview > 0) {
                    entriesToCreate.push({
                        studentId: parseInt(studentId),
                        date: scheduledDate,
                        type: 'MURAJAAH',
                        surahId: 1,
                        fromAyah: 1,
                        toAyah: Math.round(numDailyReview) || 1,
                        isCompleted: false
                    });
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Create all entries in a transaction to ensure SQLite/Postgres compatibility
            if (entriesToCreate.length > 0) {
                await prisma.$transaction(
                    entriesToCreate.map(entry => 
                        prisma.studyPlanEntry.create({
                            data: {
                                Student: {
                                    connect: { id: parseInt(entry.studentId) }
                                },
                                date: entry.date,
                                type: entry.type,
                                surahId: parseInt(entry.surahId) || 114,
                                fromAyah: parseInt(entry.fromAyah) || 1,
                                toAyah: parseInt(entry.toAyah) || 1,
                                isCompleted: entry.isCompleted
                            }
                        })
                    )
                );
            }

            return NextResponse.json({
                success: true,
                message: `تم توليد الخطة بنجاح لمجموع ${pagesToSchedule.length} صفحات موزعة على الأيام النشطة.`,
                count: entriesToCreate.length
            });
        }

        return NextResponse.json({ error: 'أمر غير معروف' }, { status: 400 });
    } catch (error) {
        console.error("POST Student Plan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
