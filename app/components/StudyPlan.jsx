
'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { quranData } from '../data/quranData';
import { pageAyahMap } from '../data/pageAyahMap';

const StudyPlan = ({ student, onUpdate }) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (student) {
            fetchPlan();
        }
    }, [student]);

    const fetchPlan = async () => {
        try {
            const res = await fetch(`/api/study-plan?studentId=${student.id}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } catch (error) {
            console.error('Error fetching plan:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPageOfAyah = (surahId, ayahNum) => {
        const surahObj = quranData.find(s => s.id === surahId);
        if (!surahObj) return 1;
        for (let i = surahObj.startPage; i <= Math.min(604, surahObj.startPage + 70); i++) {
            const sData = pageAyahMap[i]?.[surahId];
            if (sData) {
                const start = (typeof sData === 'object') ? sData.start : sData;
                const end = (typeof sData === 'object') ? sData.end : sData;
                if (ayahNum >= start && ayahNum <= end) return i;
            }
        }
        return surahObj.startPage;
    };

    const getAyahAtPageOffset = (startSId, startANum, pageOffset, direction = 'FORWARD') => {
        let currentP = getPageOfAyah(startSId, startANum);
        let targetP = direction === 'FORWARD' ? currentP + pageOffset - 1 : currentP - pageOffset + 1;
        
        if (targetP > 604) targetP = 604;
        if (targetP < 1) targetP = 1;

        const pData = pageAyahMap[targetP];
        if (!pData) return { surahId: startSId, ayah: 1 };

        const sIds = Object.keys(pData).map(Number).sort((a, b) => direction === 'FORWARD' ? b - a : a - b);
        // For forward (Nas -> Baqarah is forward in page numbers), we want the "last" surah on page
        // For reverse (if we ever need), we'd want the first.
        const sId = sIds[0] || startSId;
        const sData = pData[sId];
        const ayah = direction === 'FORWARD' ? ((typeof sData === 'object') ? sData.end : sData) : ((typeof sData === 'object') ? sData.start : 1);

        return { surahId: sId, ayah, page: targetP };
    };

    const generatePlan = async (type = 'KHATM') => {
        setGenerating(true);
        try {
            const newEntries = [];
            let currentDate = new Date();
            
            // Starting Points
            let hifzSId = student.currentHifzSurahId || 114;
            let hifzAyah = 1; 
            let hifzP = getPageOfAyah(hifzSId, hifzAyah);
            
            let murSId = 2; // Baqarah
            let murAyah = 1;
            let murP = 2;

            const hifzTarget = student.dailyTargetPages || 1;
            
            let murTarget = 20; 
            const plan = student.reviewPlan || '';
            if (plan.includes('نصف جزء')) murTarget = 10;
            else if (plan === 'جزء') murTarget = 20;
            else if (plan === 'جزئين') murTarget = 40;
            else if (plan.includes('ثلاث')) murTarget = 60;
            else if (plan === 'نصف صفحة') murTarget = 0.5;
            else if (plan === 'صفحة') murTarget = 1;
            else if (plan === 'صفحتين') murTarget = 2;
            else if (!isNaN(parseFloat(plan))) murTarget = parseFloat(plan) * 20;

            const maxDays = type === 'MONTH' ? 30 : type === 'TERM' ? 90 : 400;
            let daysCount = 0;

            while (daysCount < maxDays) {
                const day = currentDate.getDay(); 
                const isWorkDay = day >= 0 && day <= 4; // Sun to Thu

                if (isWorkDay) {
                    // 1. HIFZ Entry (Nas -> Baqarah: Pages 604 -> 1)
                    if (hifzP >= 2) { 
                        let targetHifzP = hifzP - (Math.ceil(hifzTarget) - 1);
                        if (targetHifzP < 2) targetHifzP = 2;

                        const pData = pageAyahMap[targetHifzP];
                        const sIds = Object.keys(pData).map(Number).sort((a,b)=>a-b);
                        const endSId = sIds[0]; // First surah on that page when moving backwards
                        const endAyah = (typeof pData[endSId] === 'object') ? pData[endSId].end : pData[endSId];

                        newEntries.push({
                            date: new Date(currentDate),
                            type: 'HIFZ',
                            surahId: hifzSId,
                            fromAyah: hifzAyah,
                            toAyah: endAyah,
                            toSurahId: endSId
                        });
                        
                        hifzP = targetHifzP - 1;
                        if (hifzP >= 2) {
                            const nextPData = pageAyahMap[hifzP];
                            const nextSIds = Object.keys(nextPData).map(Number).sort((a,b)=>b-a);
                            hifzSId = nextSIds[0];
                            hifzAyah = (typeof nextPData[hifzSId] === 'object') ? nextPData[hifzSId].start : 1;
                        }
                    }

                    // 2. MURAJAAH Entry (Baqarah -> Nas: Pages 2 -> 604)
                    if (murP <= 604) {
                        let targetMurP = murP + (Math.ceil(murTarget) - 1);
                        if (targetMurP > 604) targetMurP = 604;

                        const pData = pageAyahMap[targetMurP];
                        const sIds = Object.keys(pData).map(Number).sort((a,b)=>b-a);
                        const endSId = sIds[0];
                        const endAyah = (typeof pData[endSId] === 'object') ? pData[endSId].end : pData[endSId];

                        newEntries.push({
                            date: new Date(currentDate),
                            type: 'MURAJAAH',
                            surahId: murSId,
                            fromAyah: murAyah,
                            toAyah: endAyah,
                            toSurahId: endSId
                        });
                        
                        murP = targetMurP + 1;
                        if (murP > 604) murP = 2; // Loop
                        
                        const nextPData = pageAyahMap[murP];
                        const nextSIds = Object.keys(nextPData).map(Number).sort((a,b)=>a-b);
                        murSId = nextSIds[0];
                        murAyah = (typeof nextPData[murSId] === 'object') ? nextPData[murSId].start : 1;
                    }
                }

                currentDate.setDate(currentDate.getDate() + 1);
                daysCount++;
                if (hifzP < 2 && type === 'KHATM') break; 
            }

            // Save to DB
            const res = await fetch('/api/study-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: student.id,
                    entries: newEntries.map(e => ({
                        date: e.date.toISOString(),
                        type: e.type,
                        surahId: e.surahId,
                        fromAyah: e.fromAyah,
                        toAyah: e.toAyah
                    }))
                })
            });

            if (res.ok) {
                toast.success('تم توليد الخطة بنجاح');
                fetchPlan();
            }
        } catch (error) {
            toast.error('خطأ في توليد الخطة');
        } finally {
            setGenerating(false);
        }
    };

    const exportToExcel = () => {
        const worksheetData = entries.map(e => ({
            'التاريخ': new Date(e.date).toLocaleDateString('ar-SA'),
            'اليوم': new Date(e.date).toLocaleDateString('ar-SA', { weekday: 'long' }),
            'النوع': e.type === 'HIFZ' ? 'حفظ' : 'مراجعة',
            'السورة': quranData.find(s => s.id === e.surahId)?.name || '',
            'من آية': e.fromAyah,
            'إلى آية': e.toAyah,
            'الحالة': e.isCompleted ? 'تم' : 'لم يتم'
        }));

        const ws = XLSX.utils.json_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'الجدول الدراسي');
        XLSX.writeFile(wb, `جدول_${student.name}.xlsx`);
    };

    if (loading) return <div className="p-10 text-center font-bold">جاري تحميل الجدول...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">📅</span>
                    الجدول الدراسي الزمني
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (!confirm('سيتم إعادة جدولة المهام غير المكتملة لتبدأ من اليوم. هل أنت متأكد؟')) return;
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            
                            const incomplete = entries.filter(e => !e.isCompleted).sort((a,b) => new Date(a.date) - new Date(b.date));
                            if (incomplete.length === 0) return;

                            const rolledEntries = [];
                            let cursorDate = new Date();
                            
                            incomplete.forEach(entry => {
                                // Find next workday
                                while (!(cursorDate.getDay() >= 0 && cursorDate.getDay() <= 3)) {
                                    cursorDate.setDate(cursorDate.getDate() + 1);
                                }
                                rolledEntries.push({
                                    ...entry,
                                    date: new Date(cursorDate)
                                });
                                // If we have multiple entries for same day (HIFZ/MURAJAAH), don't advance date yet
                                // Wait, the original plan has them on same date.
                                // Let's check if the next entry in 'incomplete' is same date as current 'entry'
                                const nextIndex = incomplete.indexOf(entry) + 1;
                                if (nextIndex < incomplete.length) {
                                    if (new Date(incomplete[nextIndex].date).toDateString() !== new Date(entry.date).toDateString()) {
                                        cursorDate.setDate(cursorDate.getDate() + 1);
                                    }
                                }
                            });

                            // Save back
                            const res = await fetch('/api/study-plan', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    studentId: student.id,
                                    entries: [
                                        ...entries.filter(e => e.isCompleted),
                                        ...rolledEntries
                                    ]
                                })
                            });
                            if (res.ok) {
                                toast.success('تم ترحيل الجدول بنجاح');
                                fetchPlan();
                            }
                        }}
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
                    >
                        🔄 ترحيل المتأخرات
                    </button>
                    <button
                        onClick={() => generatePlan('MONTH')}
                        disabled={generating}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all disabled:opacity-50"
                    >
                        توليد خطة شهر
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-all"
                    >
                        تصدير Excel
                    </button>
                </div>
            </div>

            {entries.length === 0 ? (
                <div className="p-20 text-center premium-glass rounded-[2rem] border-2 border-dashed border-slate-200">
                    <div className="text-5xl mb-4">📝</div>
                    <p className="text-slate-500 font-bold mb-6">لا يوجد جدول دراسي حالياً لهذا الطالب</p>
                    <button
                        onClick={() => generatePlan('KHATM')}
                        disabled={generating}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        {generating ? 'جاري التوليد...' : 'توليد خطة حتى الختم'}
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {/* Group by date */}
                    {Object.entries(
                        entries.reduce((acc, entry) => {
                            const date = new Date(entry.date).toDateString();
                            if (!acc[date]) acc[date] = [];
                            acc[date].push(entry);
                            return acc;
                        }, {})
                    ).map(([date, dayEntries]) => (
                        <div key={date} className="premium-glass rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-6">
                                <div className="text-center min-w-[80px]">
                                    <span className="block text-xs font-black text-slate-400 uppercase">{new Date(date).toLocaleDateString('ar-SA', { weekday: 'short' })}</span>
                                    <span className="text-xl font-black text-slate-800 dark:text-white">{new Date(date).getDate()}</span>
                                    <span className="block text-[10px] font-bold text-emerald-500">{new Date(date).toLocaleDateString('ar-SA', { month: 'short' })}</span>
                                </div>
                                <div className="space-y-2">
                                    {dayEntries.map(entry => (
                                        <div key={entry.id} className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${entry.type === 'HIFZ' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {entry.type === 'HIFZ' ? 'حفظ' : 'مراجعة'}
                                            </span>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                {quranData.find(s => s.id === entry.surahId)?.name} (من {entry.fromAyah} إلى {entry.toAyah})
                                            </span>
                                            {entry.isCompleted && <span className="text-emerald-500">✅</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {dayEntries.every(e => e.isCompleted) ? (
                                    <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black">مكتمل ✨</span>
                                ) : (
                                    <span className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 text-slate-400 rounded-xl text-xs font-black">قيد الانتظار</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudyPlan;
