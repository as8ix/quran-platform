'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../../../components/Navbar';
import { quranData } from '../../../data/quranData';
import { formatHijri } from '../../../utils/dateUtils';

import AddStudentModal from '../../../components/AddStudentModal';

export default function StudentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.id;

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);

    // Form State - Hifz
    const [hifzFromPage, setHifzFromPage] = useState('');
    const [hifzToPage, setHifzToPage] = useState('');
    const [hifzFromAyah, setHifzFromAyah] = useState(1);
    const [hifzToAyah, setHifzToAyah] = useState(1);

    // Form State - Murajaah
    const [mFromSurah, setMFromSurah] = useState(1);
    const [mFromAyah, setMFromAyah] = useState(1);
    const [mToSurah, setMToSurah] = useState(1);
    const [mToAyah, setMToAyah] = useState(1);

    const [pagesCount, setPagesCount] = useState(0);
    const [resultString, setResultString] = useState(''); // e.g. "جزء و 5 صفحات"
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [calculatedJuz, setCalculatedJuz] = useState(0);

    // Quality Metrics
    const [errorsCount, setErrorsCount] = useState(0);
    const [alertsCount, setAlertsCount] = useState(0);
    const [cleanPagesCount, setCleanPagesCount] = useState(0);

    const [showEditModal, setShowEditModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!studentId) return;
        fetchStudent();
        fetchHistory();
    }, [studentId]);

    useEffect(() => {
        if (student) {
            calculateTotalProgress();
        }
    }, [student, history]);

    const fetchStudent = async () => {
        try {
            const response = await fetch(`/api/students`);
            const students = await response.json();
            const found = students.find(s => s.id === parseInt(studentId));
            setStudent(found);

            // Set default pages based on current surah
            const surah = quranData.find(s => s.id === (found?.currentHifzSurahId || 114));
            if (surah) {
                setHifzFromPage(surah.startPage);
                setHifzToPage(surah.startPage);
                setHifzFromAyah(1);
                setHifzToAyah(surah.ayahs);
            }
        } catch (e) { console.error(e); }
    };

    const fetchHistory = async () => {
        try {
            const response = await fetch(`/api/sessions?studentId=${studentId}`);
            if (response.ok) {
                const data = await response.json();

                // Filter for sessions within the last 7 days
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const filtered = data.filter(s => new Date(s.date) >= oneWeekAgo);

                setHistory(filtered);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    // Quran Logic Helpers
    const getSurahPages = (surahId) => {
        const surah = quranData.find(s => s.id === surahId);
        if (!surah) return [];
        const nextSurah = quranData.find(s => s.id === surahId + 1);
        // Uses nextSurah.startPage to include shared pages (e.g. Mutaffifin ends 589, Inshiqaq starts 589)
        const endPage = nextSurah ? nextSurah.startPage : 604;
        const pages = [];
        for (let i = surah.startPage; i <= endPage; i++) pages.push(i);
        return pages;
    };

    const calculateMurajaah = () => {
        const fromS = quranData.find(s => s.id === mFromSurah);
        const toS = quranData.find(s => s.id === mToSurah);
        if (!fromS || !toS) return;

        // Helper: Get the page number for a specific ayah in a surah
        const getAyahPage = (surahId, ayahNum) => {
            const index = quranData.findIndex(s => s.id === surahId);
            const surah = quranData[index];
            const nextSurah = quranData[index + 1];
            // Include shared page in count
            const lastPageOfSurah = nextSurah ? nextSurah.startPage : 604;

            // Total pages in this surah
            const totalPagesInSurah = lastPageOfSurah - surah.startPage + 1;

            // Calculate which page this ayah is on
            const ayahsPerPage = surah.ayahs / totalPagesInSurah;
            const pageOffset = Math.floor((ayahNum - 1) / ayahsPerPage);

            const calculatedPage = surah.startPage + pageOffset;
            // Cap at lastPageOfSurah to avoid overflow
            return Math.min(calculatedPage, lastPageOfSurah);
        };

        // Get start and end pages
        let firstPage = getAyahPage(mFromSurah, mFromAyah);
        let lastPage = getAyahPage(mToSurah, mToAyah);

        let totalPages = 0;
        let extraAyahs = 0;

        const isFinished = mToAyah === toS.ayahs;

        if (isFinished) {
            // If finishing the surah, count the last page as a full page
            // Logic: (End - Start) + 1
            const nextSurah = quranData.find(s => s.id === mToSurah + 1);
            // Ensure we use the correct boundary if using shared pages logic
            const actualLastPage = nextSurah ? nextSurah.startPage : 604;

            // Re-calculate lastPage strictly for the 'Finish' case to capture the shared boundary
            // Actually getAyahPage already handles overlap logic reasonably well, 
            // but let's stick to the verified page counts

            // Using the user's confirmed logic: (589 - 580) + 1 = 10
            totalPages = Math.abs(lastPage - firstPage) + 1;
        } else {
            // Partial finish
            // Count pages UP TO the last page (exclusive of the last partial page)
            // But if start and end are same page?
            if (lastPage === firstPage) {
                totalPages = 0;
            } else {
                totalPages = Math.abs(lastPage - firstPage);
            }

            // Calculate extra Ayahs
            // User Rule: (Last - First) + 1
            // We apply this logic to the "remainder" ayahs
            extraAyahs = mToAyah - mFromAyah + 1;

            // If negative (e.g. Started late at 50, ended early at 10)
            // It means we didn't quite fill the last 'page block' relative to the start
            // We could subtract a page, but pages are fixed 20/juz. 
            // For now, if negative, we just show it as 0 to avoid confusion 
            // unless we want to do complex page borrowing.
            // Let's rely on the user's mental model which expects the formula:
            if (extraAyahs < 0) {
                // Option: Borrow from pages? 
                // 1 Page ~ 15 lines. 1 Page ~ depending on Ayahs.
                // Safe fallback: Just show mToAyah if negative? 
                // No, that ignores the 'From' again.
                // Let's just show signed? No.
                // Let's just set to 0. Use proper page count.
                extraAyahs = 0;
            }
        }

        setPagesCount(totalPages);

        // Result String logic (20 pages = 1 Juz)
        // If we have negative ayahs, we technically have "Less than totalPages".
        // But for simplicity in this UI:
        const juz = Math.floor(totalPages / 20);
        const pgs = totalPages % 20;

        let strArray = [];
        if (juz > 0) strArray.push(`${juz} جزء`);
        if (pgs > 0) strArray.push(`${pgs} صفحة`);
        if (extraAyahs > 0) strArray.push(`${extraAyahs} آية`);

        setResultString(strArray.length > 0 ? strArray.join(' و ') : '0 صفحة');
    };

    const calculateTotalProgress = () => {
        if (!student) return;

        // If explicitly marked as 30 in DB (Khatim), use that.
        if (student.juzCount === 30) {
            setCalculatedJuz(30);
            return;
        }

        let currentId = student.currentHifzSurahId;

        // Fallback: If ID is missing or 114 (default) using trusted Name logic
        if (student.hifzProgress) {
            let surahByName = quranData.find(s => s.name === student.hifzProgress || s.name === student.hifzProgress.replace('سورة ', ''));

            // Handle common Juz names
            if (!surahByName) {
                if (student.hifzProgress.includes('تبارك')) surahByName = quranData.find(s => s.id === 67);
                else if (student.hifzProgress.includes('عم')) surahByName = quranData.find(s => s.id === 78);
                else if (student.hifzProgress.includes('قد سمع')) surahByName = quranData.find(s => s.id === 58);
                else if (student.hifzProgress.includes('الذاريات')) surahByName = quranData.find(s => s.id === 51);
            }

            if (surahByName && (surahByName.id !== 114 || !currentId)) {
                currentId = surahByName.id;
            }
        }

        currentId = currentId || 114;

        // --- NEW LOGIC START ---
        // 1. Pages completed "below" the current Surah (Reverse Order: 114 -> CurrentId + 1)
        // This is simply: (Page 604) - (Start Page of CurrentId + 1) + 1
        // Example: If at Kahf (18). Completed 19 (Maryam) to 114 (Nas).
        // Maryam starts at 305. 604 - 305 + 1 = 300 pages.

        // Find next surah to determine the start of the "completed block"
        const nextSurah = quranData.find(s => s.id === currentId + 1);
        let completedPages = 0;

        if (nextSurah) {
            // All pages from the start of next surah to the end of the Quran (604) are finished
            completedPages = 604 - nextSurah.startPage + 1;
        } else {
            // If current is 114 (Nas), next is undefined.
            // Means we are at the very beginning (reverse).
            // Completed pages is 0 (or just whatever is within Nas)
            completedPages = 0; // Will be handled by currentSurahPages logic if any
        }

        // 2. Pages completed WITHIN the Current Surah
        let currentSurahPages = 0;
        const currentSurahObj = quranData.find(s => s.id === currentId);

        if (currentSurahObj) {
            // Check history for latest progress in this Surah
            const lastSession = history.find(s => s.hifzSurah === currentSurahObj.name);

            if (lastSession && lastSession.hifzToPage) {
                // If we have progress in this surah
                // Progress is (Reached Page - Start Page of Surah) + 1
                // We trust 'hifzToPage' is accurate for where they stopped in this surah.
                const offset = lastSession.hifzToPage - currentSurahObj.startPage + 1;
                currentSurahPages = Math.max(0, offset); // Ensure non-negative
            } else {
                // No session yet for this surah? Assume 0 progress in it.
                // Or if just "started", it's 0.
                currentSurahPages = 0;
            }
        }

        // Total Pages
        const totalPages = completedPages + currentSurahPages;
        const juz = totalPages / 20;

        // setCalculatedJuz(Number.isInteger(juz) ? juz : juz.toFixed(1));
        // Use 1 decimal place consistently for clarity unless 0
        setCalculatedJuz(juz === 0 ? 0 : juz.toFixed(1));

        // --- NEW LOGIC END ---
    };

    // Auto-calculate clean pages whenever dependencies change
    useEffect(() => {
        const total = Math.floor(pagesCount || 0);
        const clean = Math.max(0, total - (parseInt(errorsCount) || 0) - (parseInt(alertsCount) || 0));
        setCleanPagesCount(clean);
    }, [pagesCount, errorsCount, alertsCount]);

    useEffect(() => {
        calculateMurajaah();
    }, [mFromSurah, mFromAyah, mToSurah, mToAyah]);

    const handleSaveSession = async (e) => {
        e.preventDefault();
        setSaving(true);

        const currentSurah = quranData.find(s => s.id === (student?.currentHifzSurahId || 114));
        const nextSurahPages = getSurahPages(currentSurah?.id);
        const isFinishedSurah = !isKhatim && parseInt(hifzToPage) === nextSurahPages[nextSurahPages.length - 1];

        try {
            const fromSurahName = quranData.find(s => s.id === parseInt(mFromSurah))?.name;
            const toSurahName = quranData.find(s => s.id === parseInt(mToSurah))?.name;

            // Goal Calculation
            // Default goal is 1 if not set (from student props)
            const targetPages = student?.dailyTargetPages || 1.0;

            // Calculate pages done today in Hifz
            // (End - Start) + 1. If 0 pages (Khatim or none), then 0.
            let pagesDone = 0;
            if (!isKhatim && hifzToPage && hifzFromPage) {
                pagesDone = (parseInt(hifzToPage) - parseInt(hifzFromPage)) + 1;
            }

            // Simple Goal logic: Did they memorize enough pages?
            // Note: We could also include Review pages in a "Review Goal", but user asked for "Daily Goal" in context of Hifz usually.
            // Let's assume hifzGoal first. 
            // If user meant "Total Pages (Hifz + Review)" we can adjust. 
            // For now: Goal Achieved if Hifz Pages >= Target Pages.
            const isGoalAchieved = pagesDone >= targetPages;

            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    // Only send hifz data if not Khatim
                    hifzSurah: isKhatim ? null : currentSurah?.name,
                    hifzFromPage: isKhatim ? null : parseInt(hifzFromPage),
                    hifzToPage: isKhatim ? null : parseInt(hifzToPage),
                    hifzFromAyah: isKhatim ? null : parseInt(hifzFromAyah),
                    hifzToAyah: isKhatim ? null : parseInt(hifzToAyah),
                    murajaahFromSurah: fromSurahName,
                    murajaahFromAyah: parseInt(mFromAyah),
                    murajaahToSurah: toSurahName,
                    murajaahToAyah: parseInt(mToAyah),
                    pagesCount: parseFloat(pagesCount),
                    resultString,
                    notes,
                    errorsCount: parseInt(errorsCount) || 0,
                    alertsCount: parseInt(alertsCount) || 0,
                    cleanPagesCount: parseInt(cleanPagesCount) || 0,
                    isFinishedSurah, // Will be false for Khatim
                    isGoalAchieved
                })
            });

            if (response.ok) {
                toast.success('تم تسجيل التسميع بنجاح');
                setNotes('');
                setErrorsCount(0);
                setAlertsCount(0);
                setCleanPagesCount(0);
                fetchStudent();
                fetchHistory();
            }
        } catch (error) {
            toast.error('خطأ في الحفظ');
        } finally {
            setSaving(false);
        }
    };

    const currentSurah = quranData.find(s => s.id === (student?.currentHifzSurahId || 114));
    const allowedPages = getSurahPages(currentSurah?.id || 114);

    // Check if student is Khatim (completed the Quran)
    // Khatim = completed 30 Juz
    const isKhatim = student?.juzCount === 30;

    // Filtered surahs for review
    const reviewableSurahs = quranData.filter(s => {
        if (!student) return false;

        // If Khatim, all surahs are available for review
        if (isKhatim) return true;

        // For non-Khatim students:
        // In the 114 -> 1 path, higher IDs are finished surahs
        return s.id > student.currentHifzSurahId;
    });

    // Validating Murajaah Selection State
    useEffect(() => {
        if (reviewableSurahs.length > 0) {
            // If current selection is not in list, default to first item
            const isFromValid = reviewableSurahs.some(s => s.id === mFromSurah);
            const isToValid = reviewableSurahs.some(s => s.id === mToSurah);

            if (!isFromValid) {
                setMFromSurah(reviewableSurahs[0].id);
                // Also reset Ayah to 1 to avoid out of bounds
                setMFromAyah(1);
            }
            if (!isToValid) {
                setMToSurah(reviewableSurahs[0].id);
                setMToAyah(1);
            }
        }
    }, [reviewableSurahs, mFromSurah, mToSurah]);

    const handleDelete = () => {
        toast((t) => (
            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 flex flex-col gap-4 min-w-[300px]">
                <div className="font-bold text-slate-800 text-lg">
                    هل أنت متأكد من حذف هذا الطالب؟
                    <div className="text-sm text-red-500 mt-2 font-medium">سيتم حذف جميع سجلاته نهائياً.</div>
                </div>
                <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            performDelete();
                        }}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        نعم، حذف
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    };

    const performDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/students?id=${studentId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('تم حذف الطالب بنجاح');
                router.push('/teacher');
            } else {
                toast.error('حدث خطأ أثناء الحذف');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء الحذف');
        } finally {
            setDeleting(false);
        }
    };

    if (loading && !student) return <div className="p-20 text-center font-bold text-emerald-600 animate-pulse">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] font-noto rtl" dir="rtl">
            <Navbar userType="teacher" userName="أهلًا أستاذ عبدالله 👋" onLogout={() => router.push('/')} />

            <main className="max-w-6xl mx-auto px-4 py-10">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/teacher')}
                    className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors group"
                >
                    <span className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </span>
                    عودة للقائمة الرئيسية
                </button>

                {/* Actions */}
                <div className="flex justify-end gap-3 mb-4">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                    >
                        <span>✏️</span> تعديل
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <span>🗑️</span> {deleting ? 'جاري الحذف...' : 'حذف'}
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-lg shadow-slate-200"
                    >
                        <span>🖨️</span> طباعة التقرير
                    </button>
                </div>

                {/* Header Card */}
                <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-white mb-10 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-50 rounded-full -translate-x-10 -translate-y-10 opacity-50"></div>

                    <div className="flex items-center gap-8 relative z-10">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-lg shadow-emerald-200">
                            {student?.name?.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tight">{student?.name}</h1>
                            <div className="flex items-center gap-2 mt-2">
                                {isKhatim ? (
                                    <span className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 rounded-full text-sm font-black shadow-lg shadow-amber-200 flex items-center gap-2">
                                        <span>🏆</span>
                                        خاتم القرآن الكريم
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                        المحفوظ: {student?.hifzProgress}
                                    </span>
                                )}
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                    الخطة: {student?.reviewPlan}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6 relative z-10">
                        <div className="text-center bg-slate-50/80 backdrop-blur-sm px-8 py-5 rounded-3xl border border-slate-100 shadow-sm">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الأجزاء</span>
                            <span className="text-3xl font-black text-slate-700">{isKhatim ? '30' : calculatedJuz}</span>
                            {!isKhatim && <span className="text-sm font-bold text-slate-400 mr-1">جزء</span>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Recording Form */}
                    <div className="lg:col-span-2 space-y-10">
                        <form onSubmit={handleSaveSession} className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-white relative">
                            <h2 className="text-3xl font-black text-slate-800 mb-10 flex items-center gap-4">
                                <span className="p-3 bg-emerald-100 rounded-2xl">✍️</span>
                                تسجيل تسميع اليوم
                            </h2>

                            <div className="space-y-10">
                                {/* Hifz Section - Hidden for Khatim */}
                                {!isKhatim ? (
                                    <div className="p-8 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100 shadow-inner">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-emerald-800 font-black text-xl flex items-center gap-3">
                                                <span className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200"></span>
                                                الحفظ الجديد (سورة {currentSurah?.name})
                                            </h3>
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                                                صفحات السورة: {allowedPages[0]} - {allowedPages[allowedPages.length - 1]}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-emerald-600 mb-2 mr-2">من الصفحة</label>
                                                <div className="flex gap-2">
                                                    <select
                                                        value={hifzFromPage}
                                                        onChange={e => setHifzFromPage(e.target.value)}
                                                        className="w-2/3 px-4 py-4 bg-white border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-lg"
                                                    >
                                                        {allowedPages.map(p => <option key={p} value={p}>صفحة {p}</option>)}
                                                    </select>
                                                    <div className="w-1/3 relative">
                                                        <span className="absolute -top-6 right-0 text-[10px] text-emerald-400 font-bold">آية</span>
                                                        <input
                                                            type="number"
                                                            value={hifzFromAyah}
                                                            min="1"
                                                            max={currentSurah?.ayahs}
                                                            onChange={e => {
                                                                const val = parseInt(e.target.value);
                                                                const max = currentSurah?.ayahs || 286;
                                                                if (val > max) setHifzFromAyah(max);
                                                                else setHifzFromAyah(val);
                                                            }}
                                                            className="w-full px-4 py-4 bg-white border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-center"
                                                            placeholder="آية"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-emerald-600 mb-2 mr-2">إلى الصفحة</label>
                                                <div className="flex gap-2">
                                                    <select
                                                        value={hifzToPage}
                                                        onChange={e => setHifzToPage(e.target.value)}
                                                        className="w-2/3 px-4 py-4 bg-white border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-lg"
                                                    >
                                                        {allowedPages.map(p => <option key={p} value={p}>صفحة {p}</option>)}
                                                    </select>
                                                    <div className="w-1/3 relative">
                                                        <span className="absolute -top-6 right-0 text-[10px] text-emerald-400 font-bold">آية</span>
                                                        <input
                                                            type="number"
                                                            value={hifzToAyah}
                                                            min="1"
                                                            max={currentSurah?.ayahs}
                                                            onChange={e => {
                                                                const val = parseInt(e.target.value);
                                                                const max = currentSurah?.ayahs || 286;
                                                                if (val > max) setHifzToAyah(max);
                                                                else setHifzToAyah(val);
                                                            }}
                                                            className="w-full px-4 py-4 bg-white border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-center"
                                                            placeholder="آية"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-[2.5rem] border-2 border-amber-200 shadow-inner">
                                        <div className="text-center">
                                            <div className="text-6xl mb-4">🎉</div>
                                            <h3 className="text-2xl font-black text-amber-800 mb-2">مبارك! الطالب خاتم للقرآن الكريم</h3>
                                            <p className="text-amber-600 font-bold">لا يوجد حفظ جديد - تم إكمال حفظ القرآن كاملاً</p>
                                        </div>
                                    </div>
                                )}

                                {/* Review Section */}
                                <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 shadow-inner">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-indigo-800 font-black text-xl flex items-center gap-3">
                                            <span className="w-3 h-3 bg-indigo-500 rounded-full shadow-lg shadow-indigo-200"></span>
                                            المراجعة
                                        </h3>
                                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-100/50 px-3 py-1 rounded-full">
                                            السور التي انتهى منها الطالب فقط
                                        </span>
                                    </div>

                                    <div className="space-y-8">
                                        {reviewableSurahs.length > 0 ? (
                                            <>
                                                {/* From Section */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">من سورة</label>
                                                        <select
                                                            value={mFromSurah}
                                                            onChange={e => setMFromSurah(parseInt(e.target.value))}
                                                            className="w-full px-6 py-4 bg-white border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold"
                                                        >
                                                            {reviewableSurahs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">من آية</label>
                                                        <input
                                                            type="number"
                                                            value={mFromAyah}
                                                            min="1"
                                                            max={quranData.find(s => s.id === mFromSurah)?.ayahs}
                                                            onChange={e => {
                                                                const max = quranData.find(s => s.id === mFromSurah)?.ayahs || 1;
                                                                const val = parseInt(e.target.value) || 1;
                                                                setMFromAyah(val > max ? max : val);
                                                            }}
                                                            className="w-full px-6 py-4 bg-white border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold"
                                                        />
                                                    </div>
                                                </div>

                                                {/* To Section */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">إلى سورة</label>
                                                        <select
                                                            value={mToSurah}
                                                            onChange={e => setMToSurah(parseInt(e.target.value))}
                                                            className="w-full px-6 py-4 bg-white border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold"
                                                        >
                                                            {reviewableSurahs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">إلى آية</label>
                                                        <input
                                                            type="number"
                                                            value={mToAyah}
                                                            min="1"
                                                            max={quranData.find(s => s.id === mToSurah)?.ayahs}
                                                            onChange={e => {
                                                                const max = quranData.find(s => s.id === mToSurah)?.ayahs || 1;
                                                                const val = parseInt(e.target.value) || 1;
                                                                setMToAyah(val > max ? max : val);
                                                            }}
                                                            className="w-full px-6 py-4 bg-white border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Quality Metrics for Murajaah */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                    <div>
                                                        <label className="block text-xs font-bold text-orange-600 mb-2 mr-2">عدد الأخطاء</label>
                                                        <input
                                                            type="number"
                                                            value={errorsCount}
                                                            onChange={e => {
                                                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                                                setErrorsCount(val);
                                                            }}
                                                            min="0"
                                                            className="w-full px-6 py-4 bg-white border-2 border-transparent focus:border-orange-400 rounded-2xl outline-none transition-all font-bold text-lg"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-orange-600 mb-2 mr-2">عدد التنبيهات</label>
                                                        <input
                                                            type="number"
                                                            value={alertsCount}
                                                            onChange={e => {
                                                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                                                setAlertsCount(val);
                                                            }}
                                                            min="0"
                                                            className="w-full px-6 py-4 bg-white border-2 border-transparent focus:border-orange-400 rounded-2xl outline-none transition-all font-bold text-lg"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Auto Calculation Result */}
                                                <div className="bg-white/50 p-6 rounded-3xl border-2 border-dashed border-indigo-200 flex flex-col items-center">
                                                    <span className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-2">النتيجة التلقائية</span>
                                                    <div className="text-2xl font-black text-indigo-700">
                                                        {resultString}
                                                    </div>
                                                    <div className="mt-2 text-[10px] font-bold text-indigo-300">
                                                        {pagesCount} صفحات فعلياً
                                                    </div>
                                                    {pagesCount > 0 && (
                                                        <div className="mt-3 flex gap-2 text-xs flex-wrap justify-center">
                                                            {errorsCount > 0 && (
                                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg font-bold">
                                                                    ❌ {errorsCount} خطأ
                                                                </span>
                                                            )}
                                                            {alertsCount > 0 && (
                                                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg font-bold">
                                                                    ⚠️ {alertsCount} تنبيه
                                                                </span>
                                                            )}
                                                            {cleanPagesCount > 0 && (
                                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
                                                                    ✨ {cleanPagesCount} نقية
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-10 bg-white/50 rounded-3xl border-2 border-dashed border-indigo-200">
                                                <span className="text-indigo-400 font-bold italic">
                                                    لا توجد سور في المراجعة حتى الآن. سيتم إضافة السور تلقائياً بعد ختمها في "الحفظ الجديد".
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>


                                <textarea
                                    placeholder="أي ملاحظات إضافية على التسميع..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full p-8 bg-slate-50 border-2 border-transparent focus:border-slate-200 rounded-[2.5rem] outline-none min-h-[150px] transition-all text-slate-600 font-medium"
                                />

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="group relative w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-slate-300 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-4">
                                        {saving ? 'جاري الحفظ...' : 'حفظ تقرير اليوم 💎'}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Side History */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-[3rem] p-8 shadow-xl shadow-slate-200/50 border border-white sticky top-24">
                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4">
                                <span className="p-2 bg-slate-100 rounded-xl text-lg">📜</span>
                                سجل الإنجاز
                            </h3>
                            <div className="space-y-6 max-h-[calc(100vh-350px)] overflow-y-auto pl-2 custom-scrollbar rtl-scroll">
                                {history.length > 0 ? history.map((session, idx) => (
                                    <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-lg hover:shadow-emerald-50 transition-all cursor-default group relative overflow-hidden">
                                        {session.hifzSurah && (
                                            <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
                                        )}
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[10px] font-black text-slate-400 bg-slate-200 px-2 py-1 rounded-lg">
                                                {formatHijri(session.date, 'long')}
                                            </span>
                                            <span className="text-xs bg-emerald-100 text-emerald-700 font-black px-3 py-1 rounded-full">
                                                {session.pagesCount} ص
                                            </span>
                                        </div>

                                        {/* Goal Status Badge */}
                                        <div className="mb-3">
                                            {session.isGoalAchieved ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-lg border border-green-100">
                                                    <span>🎯</span> حقق الهدف اليومي
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-100">
                                                    <span>➖</span> لم يحقق الهدف
                                                </span>
                                            )}
                                        </div>

                                        {session.hifzSurah ? (
                                            <div className="mb-4">
                                                <div className="text-xs font-black text-emerald-600 mb-1 uppercase tracking-tighter">الحفظ الجديد</div>
                                                <div className="text-md font-bold text-slate-800">
                                                    سورة {session.hifzSurah} (من ص {session.hifzFromPage} إلى {session.hifzToPage})
                                                </div>
                                                {(session.hifzFromAyah || session.hifzToAyah) && (
                                                    <div className="text-xs text-emerald-600 mt-1 font-medium">
                                                        الآيات: {session.hifzFromAyah || '?'} - {session.hifzToAyah || '?'}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mb-4">
                                                <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl flex items-center gap-2">
                                                    <span className="text-lg">🏆</span>
                                                    <span className="text-xs font-bold text-amber-800">خاتم للقرآن الكريم</span>
                                                </div>
                                            </div>
                                        )}

                                        {session.murajaahFromSurah && (
                                            <div className="mb-4">
                                                <div className="text-xs font-black text-indigo-500 mb-1 uppercase tracking-tighter">المراجعة</div>
                                                <div className="text-sm font-medium text-slate-600 leading-relaxed">
                                                    <div className="mb-1 text-slate-800 font-bold">
                                                        من سورة {session.murajaahFromSurah} <span className="text-xs text-slate-500 font-normal">(آية {session.murajaahFromAyah})</span> إلى سورة {session.murajaahToSurah} <span className="text-xs text-slate-500 font-normal">(آية {session.murajaahToAyah})</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-bold">
                                                        {session.resultString}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Quality Metrics */}
                                        <div className="mb-4 p-3 bg-orange-50/50 rounded-2xl border border-orange-100">
                                            <div className="text-[10px] font-black text-orange-600 mb-2 uppercase tracking-wider">مقاييس الجودة</div>
                                            <div className="flex gap-3 text-xs flex-wrap">
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg font-bold">
                                                    ❌ {session.errorsCount || 0} خطأ
                                                </span>
                                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg font-bold">
                                                    ⚠️ {session.alertsCount || 0} تنبيه
                                                </span>
                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
                                                    ✨ {session.cleanPagesCount || 0} نقية
                                                </span>
                                            </div>
                                        </div>

                                        {session.notes && (
                                            <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-400 italic">
                                                " {session.notes} "
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-center py-20">
                                        <div className="text-6xl mb-4 opacity-20">📭</div>
                                        <div className="text-slate-300 font-black">لا يوجد سجلات بعد</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {student && (
                <AddStudentModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onAdd={() => {
                        setShowEditModal(false);
                        fetchStudent();
                    }}
                    halaqaId={student.halaqaId}
                    student={student}
                />
            )}
        </div>
    );
}
