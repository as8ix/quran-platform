
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
            console.log('StudyPlan Component - Current Student Data:', student);
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
        console.log('Generating plan for student:', student?.name, 'ID:', student?.id);
        
        setGenerating(true);
        try {
            const newEntries = [];
            let currentDate = new Date();
            currentDate.setHours(0,0,0,0);
            
            // 1. Determine Hifz Direction
            // If at Surah 1, direction is Forward (1 -> 604).
            // If at Surah 114, direction is Backward (604 -> 1).
            let hifzSId = student.currentHifzSurahId || 114;
            const hifzDirection = hifzSId <= 5 ? 'FORWARD' : 'BACKWARD'; // Simple heuristic
            
            let hifzAyah = 1; 
            let hifzP = getPageOfAyah(hifzSId, hifzAyah);
            
            // 2. Murajaah Starting Point
            // Usually starts from the opposite end of Hifz
            let murSId = hifzDirection === 'BACKWARD' ? 2 : 114;
            let murAyah = 1;
            let murP = getPageOfAyah(murSId, murAyah);

            const hifzTarget = parseFloat(student.dailyTargetPages) || 1;
            
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

            console.log('Direction:', hifzDirection, 'HifzP:', hifzP, 'MurTarget:', murTarget);

            const maxDays = type === 'MONTH' ? 30 : type === 'TERM' ? 90 : 400;
            let daysCount = 0;

            while (daysCount < maxDays) {
                const day = currentDate.getDay(); 
                const isWorkDay = day >= 0 && day <= 4; // Sun to Thu

                if (isWorkDay) {
                    // --- HIFZ GENERATION ---
                    const canHifz = hifzDirection === 'FORWARD' ? hifzP <= 604 : hifzP >= 2;
                    if (canHifz) {
                        let targetHifzP;
                        if (hifzDirection === 'FORWARD') {
                            targetHifzP = hifzP + (Math.ceil(hifzTarget) - 1);
                            if (targetHifzP > 604) targetHifzP = 604;
                        } else {
                            targetHifzP = hifzP - (Math.ceil(hifzTarget) - 1);
                            if (targetHifzP < 2) targetHifzP = 2;
                        }

                        const pData = pageAyahMap[targetHifzP];
                        if (pData) {
                            const sIds = Object.keys(pData).map(Number).sort((a,b) => hifzDirection === 'FORWARD' ? b - a : a - b);
                            const endSId = sIds[0];
                            const endAyah = (typeof pData[endSId] === 'object') ? pData[endSId].end : pData[endSId];

                            newEntries.push({
                                date: new Date(currentDate),
                                type: 'HIFZ',
                                surahId: hifzSId,
                                fromAyah: hifzAyah,
                                toAyah: endAyah,
                                toSurahId: endSId
                            });
                            
                            hifzP = hifzDirection === 'FORWARD' ? targetHifzP + 1 : targetHifzP - 1;
                            if ((hifzDirection === 'FORWARD' && hifzP <= 604) || (hifzDirection === 'BACKWARD' && hifzP >= 2)) {
                                const nextPData = pageAyahMap[hifzP];
                                const nextSIds = Object.keys(nextPData).map(Number).sort((a,b) => hifzDirection === 'FORWARD' ? a - b : b - a);
                                hifzSId = nextSIds[0];
                                hifzAyah = (typeof nextPData[hifzSId] === 'object') ? nextPData[hifzSId].start : 1;
                            }
                        }
                    }

                    // --- MURAJAAH GENERATION ---
                    // Revision only starts if the student has memorized at least 1 Juz
                    const hasMemorizedEnough = (student.juzCount >= 1);
                    if (hasMemorizedEnough || (type === 'KHATM' && student.juzCount > 0)) {
                        let targetMurP = murP + (Math.ceil(murTarget) - 1);
                        if (targetMurP > 604) targetMurP = 604;

                        const pData = pageAyahMap[targetMurP];
                        if (pData) {
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
                            if (murP > 604) murP = 2; 
                            
                            const nextPData = pageAyahMap[murP];
                            if (nextPData) {
                                const nextSIds = Object.keys(nextPData).map(Number).sort((a,b)=>a-b);
                                murSId = nextSIds[0];
                                murAyah = (typeof nextPData[murSId] === 'object') ? nextPData[murSId].start : 1;
                            }
                        }
                    }
                }

                currentDate.setDate(currentDate.getDate() + 1);
                daysCount++;
                
                const hifzFinished = hifzDirection === 'FORWARD' ? hifzP > 604 : hifzP < 2;
                if (hifzFinished && type === 'KHATM') break; 
            }

            console.log('Final entries count:', newEntries.length);
            if (newEntries.length === 0) {
                toast.error('لم يتم توليد أي مهام. تأكد من إعدادات الطالب.');
                setGenerating(false);
                return;
            }

            toast.loading('جاري حفظ الجدول في قاعدة البيانات...', { id: 'save-plan' });
            
            // Save to DB
            const res = await fetch('/api/study-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: student.id,
                    entries: newEntries
                })
            });

            if (res.ok) {
                toast.success('تم توليد وحفظ الجدول بنجاح!', { id: 'save-plan' });
                fetchPlan();
            } else {
                const errData = await res.json();
                toast.error(`فشل الحفظ: ${errData.error || 'خطأ غير معروف'}`, { id: 'save-plan' });
            }
        } catch (error) {
            toast.error('خطأ في توليد الخطة');
        } finally {
            setGenerating(false);
        }
    };

    const exportToExcel = () => {
        try {
            const worksheetData = entries.map(e => ({
                'التاريخ': new Date(e.date).toLocaleDateString('ar-SA'),
                'اليوم': new Date(e.date).toLocaleDateString('ar-SA', { weekday: 'long' }),
                'النوع': e.type === 'HIFZ' ? 'حفظ' : 'مراجعة',
                'من سورة': quranData.find(s => s.id === e.surahId)?.name || '',
                'من آية': e.fromAyah,
                'إلى سورة': quranData.find(s => s.id === (e.toSurahId || e.surahId))?.name || '',
                'إلى آية': e.toAyah,
                'الحالة': e.isCompleted ? 'تم' : 'لم يتم'
            }));

            const ws = XLSX.utils.json_to_sheet(worksheetData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'الجدول الدراسي');
            
            const fileName = `جدول_دراسي_${student.name.replace(/\s+/g, '_')}.xlsx`;
            XLSX.writeFile(wb, fileName);
            toast.success('تم تصدير ملف Excel بنجاح');
        } catch (error) {
            console.error('Excel Export Error:', error);
            toast.error('فشل تصدير ملف Excel');
        }
    };

    if (loading) return <div className="p-10 text-center font-bold">جاري تحميل الجدول...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-end items-center gap-4 no-print mb-10">
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
                <div className="p-20 text-center premium-glass rounded-[2rem] border-2 border-dashed border-slate-200 no-print">
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
                <div className="overflow-hidden rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 shadow-2xl">
                    <table className="w-full text-center border-collapse bg-white dark:bg-slate-950">
                        <thead>
                            <tr className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-b-2 border-emerald-600">
                                <th className="p-4 text-xs font-black border-l border-emerald-100 dark:border-emerald-800/50" rowSpan="2">التاريخ</th>
                                <th className="p-4 text-xs font-black border-l border-emerald-100 dark:border-emerald-800/50" rowSpan="2">اليوم</th>
                                <th className="p-2 text-xs font-black border-l border-emerald-100 dark:border-emerald-800/50 border-b border-emerald-100 dark:border-emerald-800/50" colSpan="2">الحفظ الجديد</th>
                                <th className="p-2 text-xs font-black border-l border-emerald-100 dark:border-emerald-800/50 border-b border-emerald-100 dark:border-emerald-800/50" colSpan="2">المراجعة</th>
                                <th className="p-4 text-xs font-black" rowSpan="2">الإنجاز</th>
                            </tr>
                            <tr className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200">
                                <th className="p-2 text-[10px] font-bold border-l border-emerald-100 dark:border-emerald-800/50">من</th>
                                <th className="p-2 text-[10px] font-bold border-l border-emerald-100 dark:border-emerald-800/50">إلى</th>
                                <th className="p-2 text-[10px] font-bold border-l border-emerald-100 dark:border-emerald-800/50">من</th>
                                <th className="p-2 text-[10px] font-bold border-l border-emerald-100 dark:border-emerald-800/50">إلى</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(
                                entries.reduce((acc, entry) => {
                                    const d = new Date(entry.date).toDateString();
                                    if (!acc[d]) acc[d] = { HIFZ: null, MURAJAAH: null, date: entry.date };
                                    acc[d][entry.type] = entry;
                                    return acc;
                                }, {})
                            ).map(([dKey, dayData], idx) => {
                                const entryDate = new Date(dayData.date);
                                return (
                                    <tr key={dKey} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-emerald-50/30 dark:bg-emerald-900/10'}>
                                        <td className="p-3 text-xs font-black text-slate-700 dark:text-slate-200 border-l border-emerald-100 dark:border-emerald-900/20">
                                            {entryDate.toLocaleDateString('ar-SA')}
                                        </td>
                                        <td className="p-3 text-[10px] font-bold text-slate-500 border-l border-emerald-100 dark:border-emerald-900/20">
                                            {entryDate.toLocaleDateString('ar-SA', { weekday: 'long' })}
                                        </td>
                                        
                                        {/* HIFZ */}
                                        <td className="p-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 border-l border-emerald-100 dark:border-emerald-900/20">
                                            {dayData.HIFZ ? `${quranData.find(s => s.id === dayData.HIFZ.surahId)?.name} (${dayData.HIFZ.fromAyah})` : '-'}
                                        </td>
                                        <td className="p-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 border-l border-emerald-100 dark:border-emerald-900/20">
                                            {dayData.HIFZ ? `${quranData.find(s => s.id === (dayData.HIFZ.toSurahId || dayData.HIFZ.surahId))?.name} (${dayData.HIFZ.toAyah})` : '-'}
                                        </td>

                                        {/* MURAJAAH */}
                                        <td className="p-3 text-xs font-bold text-indigo-700 dark:text-indigo-400 border-l border-emerald-100 dark:border-emerald-900/20">
                                            {dayData.MURAJAAH ? `${quranData.find(s => s.id === dayData.MURAJAAH.surahId)?.name} (${dayData.MURAJAAH.fromAyah})` : '-'}
                                        </td>
                                        <td className="p-3 text-xs font-bold text-indigo-700 dark:text-indigo-400 border-l border-emerald-100 dark:border-emerald-900/20">
                                            {dayData.MURAJAAH ? `${quranData.find(s => s.id === (dayData.MURAJAAH.toSurahId || dayData.MURAJAAH.surahId))?.name} (${dayData.MURAJAAH.toAyah})` : '-'}
                                        </td>

                                        <td className="p-3 text-center">
                                            {(dayData.HIFZ?.isCompleted || dayData.MURAJAAH?.isCompleted) ? (
                                                <span className="text-emerald-500">✔</span>
                                            ) : (
                                                <div className="w-4 h-4 border border-slate-300 rounded mx-auto"></div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StudyPlan;
