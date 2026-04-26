'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { formatHijri } from '../utils/dateUtils';
import { useTheme } from '../components/ThemeProvider';
import { quranData } from '../data/quranData';
import { pageAyahMap } from '../data/pageAyahMap';
import ProfileModal from '../components/ProfileModal';

export default function StudentDashboard() {
    const router = useRouter();
    const [student, setStudent] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);

    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.trim().split(/\s+/)[0];
    };

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(storedUser);
        if (user.role !== 'STUDENT') {
            router.push('/login');
            return;
        }

        fetchData(user.id);
    }, []);

    const reinitObserver = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px 100px 0px' });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        return observer;
    };

    // Re-run observer when data changes
    useEffect(() => {
        if (!loading && (student || sessions.length > 0)) {
            const timeoutId = setTimeout(() => {
                const observer = reinitObserver();
                return () => observer.disconnect();
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [loading, student, sessions]);

    const fetchData = async (id) => {
        try {
            const [studentRes, sessionsRes] = await Promise.all([
                fetch(`/api/students`),
                fetch(`/api/sessions?studentId=${id}`)
            ]);
            const allStudents = await studentRes.json();
            const myData = allStudents.find(s => s.id === id);
            if (myData) setStudent(myData);
            
            if (sessionsRes.ok) {
                const rawSessions = await sessionsRes.json();
                
                // Calculate the most recent Sunday (Start of Study Week)
                const today = new Date();
                const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
                const lastSunday = new Date(today);
                lastSunday.setDate(today.getDate() - dayOfWeek);
                lastSunday.setHours(0, 0, 0, 0);

                // Filter sessions: only if date is >= lastSunday AND day is Sun, Mon, Tue, Wed
                const filteredSessions = rawSessions.filter(session => {
                    const sessionDate = new Date(session.date);
                    const day = sessionDate.getDay();
                    const isStudyDay = day >= 0 && day <= 3; // 0=Sun, 1=Mon, 2=Tue, 3=Wed
                    return sessionDate >= lastSunday && isStudyDay;
                });

                const sortedSessions = filteredSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
                setSessions(sortedSessions);
            }
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const juzData = [
        { juz: 1, startPage: 2 }, { juz: 2, startPage: 22 }, { juz: 3, startPage: 42 },
        { juz: 4, startPage: 62 }, { juz: 5, startPage: 82 }, { juz: 6, startPage: 102 },
        { juz: 7, startPage: 122 }, { juz: 8, startPage: 142 }, { juz: 9, startPage: 162 },
        { juz: 10, startPage: 182 }, { juz: 11, startPage: 202 }, { juz: 12, startPage: 222 },
        { juz: 13, startPage: 242 }, { juz: 14, startPage: 262 }, { juz: 15, startPage: 282 },
        { juz: 16, startPage: 302 }, { juz: 17, startPage: 322 }, { juz: 18, startPage: 342 },
        { juz: 19, startPage: 362 }, { juz: 20, startPage: 382 }, { juz: 21, startPage: 402 },
        { juz: 22, startPage: 422 }, { juz: 23, startPage: 442 }, { juz: 24, startPage: 462 },
        { juz: 25, startPage: 482 }, { juz: 26, startPage: 502 }, { juz: 27, startPage: 522 },
        { juz: 28, startPage: 542 }, { juz: 29, startPage: 562 }, { juz: 30, startPage: 582 },
        { juz: 31, startPage: 605 }
    ];

    const getSurahPages = (surahId) => {
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

    const calculateIntelligence = () => {
        if (!student) return null;

        // --- Logic synced with Teacher Dashboard ---
        const currentSurahId = student.currentHifzSurahId || 114;
        const surah = quranData.find(s => s.id === currentSurahId) || quranData[113];
        const allowedPages = getSurahPages(currentSurahId);

        // Find last session for THIS SPECIFIC SURAH in history
        // Note: 'sessions' are already sorted by date desc
        const lastSessionForSurah = sessions.find(s => s.hifzSurah === surah.name);

        let hifzFromPage = surah.startPage;
        let hifzToPage = surah.startPage;
        let hifzFromAyah = 1;
        let hifzToAyah = surah.ayahs;

        if (lastSessionForSurah && lastSessionForSurah.hifzToPage) {
            const lastPage = lastSessionForSurah.hifzToPage;
            const nextPage = lastPage + 1;

            if (allowedPages.includes(nextPage)) {
                hifzFromPage = nextPage;
                
                // Get Start Ayah for nextPage
                if (pageAyahMap && pageAyahMap[nextPage] && pageAyahMap[nextPage][currentSurahId]) {
                    const pageData = pageAyahMap[nextPage][currentSurahId];
                    hifzFromAyah = (typeof pageData === 'object') ? pageData.start : 1;
                }

                // Calculate ToPage based on target
                const target = student.dailyTargetPages || 1;
                let potentialToPage = hifzFromPage + (Math.ceil(target) - 1);
                const lastAllowed = allowedPages[allowedPages.length - 1];
                if (potentialToPage > lastAllowed) potentialToPage = lastAllowed;
                
                hifzToPage = potentialToPage;

                // Get End Ayah for hifzToPage
                if (pageAyahMap && pageAyahMap[hifzToPage] && pageAyahMap[hifzToPage][currentSurahId]) {
                    const pageData = pageAyahMap[hifzToPage][currentSurahId];
                    hifzToAyah = (typeof pageData === 'object') ? pageData.end : pageData;
                }
            } else {
                // Finished Surah or edge case, stay at last
                hifzFromPage = allowedPages[allowedPages.length - 1];
                hifzToPage = hifzFromPage;
                if (pageAyahMap && pageAyahMap[hifzFromPage] && pageAyahMap[hifzFromPage][currentSurahId]) {
                    const pageData = pageAyahMap[hifzFromPage][currentSurahId];
                    hifzFromAyah = (typeof pageData === 'object') ? pageData.start : 1;
                    hifzToAyah = (typeof pageData === 'object') ? pageData.end : pageData;
                }
            }
        } else {
            // Fresh start for this surah
            hifzFromPage = surah.startPage;
            const target = student.dailyTargetPages || 1;
            let potentialToPage = hifzFromPage + (Math.ceil(target) - 1);
            const lastAllowed = allowedPages[allowedPages.length - 1];
            if (potentialToPage > lastAllowed) potentialToPage = lastAllowed;
            
            hifzToPage = potentialToPage;

            // Set From/To Ayahs
            if (pageAyahMap && pageAyahMap[hifzFromPage] && pageAyahMap[hifzFromPage][currentSurahId]) {
                const pageData = pageAyahMap[hifzFromPage][currentSurahId];
                hifzFromAyah = (typeof pageData === 'object') ? pageData.start : 1;
            }
            if (pageAyahMap && pageAyahMap[hifzToPage] && pageAyahMap[hifzToPage][currentSurahId]) {
                const pageData = pageAyahMap[hifzToPage][currentSurahId];
                hifzToAyah = (typeof pageData === 'object') ? pageData.end : pageData;
            }
        }

        // --- Review Logic ---
        const latestSessionOverall = sessions[0];
        const lastReviewSurahName = latestSessionOverall?.murajaahToSurah || student.hifzProgress || 'الفاتحة';
        const lastReviewSurah = quranData.find(s => s.name === lastReviewSurahName) || quranData[0];
        const nextReviewStartSurah = quranData.find(s => s.id === lastReviewSurah.id + 1) || lastReviewSurah;
        
        let reviewGoal = `من سورة ${nextReviewStartSurah.name}`;
        if (student.reviewPlan?.includes('جزء')) {
            const currentJuzIdx = juzData.findIndex(j => j.startPage > (lastReviewSurah.startPage || 1));
            const targetJuzIncrement = student.reviewPlan.includes('جزئين') ? 2 : (student.reviewPlan.includes('ثلاث') ? 3 : 1);
            const targetJuzIdx = Math.min(currentJuzIdx + targetJuzIncrement - 1, 30);
            const targetSurah = quranData.find(s => s.startPage >= juzData[targetJuzIdx].startPage) || quranData[113];
            reviewGoal = `من ${nextReviewStartSurah.name} إلى ${targetSurah.name}`;
        } else {
            reviewGoal = student.reviewPlan || 'مراجعة عامة';
        }

        // --- Lag Status Logic ---
        const lastDate = sessions.length > 0 ? new Date(sessions[0].date) : null;
        const today = new Date();
        const getPlanDaysBetween = (start, end) => {
            if (!start) return 5;
            let count = 0; let cur = new Date(start); cur.setHours(0,0,0,0);
            let targetEnd = new Date(end); targetEnd.setHours(0,0,0,0);
            cur.setDate(cur.getDate() + 1);
            while (cur <= targetEnd) {
                const day = cur.getDay(); if (day >= 0 && day <= 3) count++;
                cur.setDate(cur.getDate() + 1);
            }
            return count;
        };

        const missedDays = getPlanDaysBetween(lastDate, today);
        let status = 'green'; let label = 'أنت مبدع ومستمر!';
        if (missedDays === 1) { status = 'orange'; label = 'متأخر يوماً واحداً'; }
        else if (missedDays > 1) { status = 'red'; label = `متأخر ${missedDays} أيام!`; }
        
        return {
            hifz: {
                surah: surah.name,
                fromPage: hifzFromPage,
                toPage: hifzToPage,
                fromAyah: hifzFromAyah,
                toAyah: hifzToAyah,
                range: `ص ${hifzFromPage} - ص ${hifzToPage}`,
                surahPages: `${allowedPages[0]} - ${allowedPages[allowedPages.length - 1]}`
            },
            review: reviewGoal,
            status,
            label
        };
    };

    const intel = calculateIntelligence();
    const { isDarkMode, mounted } = useTheme();

    if (!mounted || loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="w-12 h-12 border-4 border-emerald-100 dark:border-emerald-900 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-bold animate-pulse">جاري تحميل بياناتك...</p>
        </div>
    );

    if (!student) {
        const handleLogout = () => {
            sessionStorage.removeItem('user');
            router.push('/login');
        };
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)]">
                <div className="w-12 h-12 border-4 border-red-500 border-t-red-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-red-500 font-bold">حدث خطأ في تحميل البيانات</p>
                <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
                    تسجيل الخروج
                </button>
            </div>
        );
    }

    const isKhatim = student.juzCount === 30;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-noto rtl transition-colors duration-300" dir="rtl">
            <Navbar userType="student" userName={`أهلًا ${student.name} 👋`} onLogout={() => router.push('/login')} displayId={student.displayId} />

            {showProfileModal && (
                <ProfileModal 
                    student={student} 
                    onClose={() => setShowProfileModal(false)} 
                    onUpdate={(updated) => setStudent(updated)} 
                />
            )}

            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Hero Header */}
                <div className={`relative overflow-hidden bg-gradient-to-br ${isKhatim ? 'from-amber-500 to-yellow-700' : 'from-emerald-600 to-teal-700'} rounded-[2.5rem] p-8 md:p-12 text-white mb-8 shadow-2xl ${isKhatim ? 'shadow-amber-100' : 'shadow-emerald-100'} reveal group`}>
                    {/* Profile Settings Button */}
                    <button 
                        onClick={() => setShowProfileModal(true)}
                        className="absolute top-6 left-6 z-20 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95 group/btn overflow-hidden"
                        title="إعدادات الحساب"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 group-hover/btn:rotate-45 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-9.75 0h9.75" />
                        </svg>
                    </button>

                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                        <span className="text-9xl">{isKhatim ? '🏆' : '📖'}</span>
                    </div>
                    <div className="relative z-10 text-center md:text-right">
                        <div className="flex flex-col md:flex-row items-center gap-6 mb-4">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-white/20 animate-bounce-subtle">
                                {isKhatim ? '👑' : '🌟'}
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                                    {isKhatim ? 'مبارك الختم يا بطل!' : 'مرحباً يا بطل!'}
                                </h1>
                                <p className="text-lg text-white/80 mt-2 font-medium">
                                    {isKhatim ? 'هنيئاً لك هذا الإنجاز العظيم في حفظ كتاب الله' : 'واصل تقدمك الممتاز في حفظ كتاب الله 🤲'}
                                </p>
                            </div>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold bg-white/10 inline-block px-4 py-2 rounded-xl border border-white/10">{student.name}</h2>
                    </div>
                </div>

                {/* Next Assignment Card (الورد القادم) - Improved Design */}
                <div className="mb-10 reveal reveal-delay-1">
                    <div className="bg-[#0f172a] rounded-[3rem] p-1 shadow-2xl shadow-red-500/10 border border-red-500/20 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[100px] pointer-events-none rounded-full"></div>
                        
                        <div className="p-8 md:p-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                                <h3 className="text-3xl font-black text-white flex items-center gap-4">
                                    <span className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse-slow">
                                        📌
                                    </span>
                                    الورد القادم (للتحضير)
                                </h3>
                                <div className={`px-6 py-2 rounded-2xl text-sm font-black border backdrop-blur-md transition-all ${
                                    intel.status === 'green' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                                    intel.status === 'orange' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 
                                    'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                                }`}>
                                    {intel.label}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Next Hifz - Form Style */}
                                <div className="p-8 bg-slate-900/50 rounded-[2.5rem] border border-emerald-500/20 shadow-inner group/card hover:bg-slate-900 transition-all text-right" dir="rtl">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="text-sm font-black text-emerald-400 flex items-center gap-3">
                                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                            الحفظ القادم (سورة {intel.hifz.surah})
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-500/60 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
                                            صفحات السورة: {intel.hifz.surahPages}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <span className="block text-[10px] font-black text-emerald-400/60 mr-2 uppercase tracking-wide text-right">من الصفحة</span>
                                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center font-black text-xl text-white">
                                                {intel.hifz.fromPage}
                                                <span className="block text-[8px] text-slate-500 mt-1 uppercase">آية {intel.hifz.fromAyah}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="block text-[10px] font-black text-emerald-400/60 mr-2 uppercase tracking-wide text-right">إلى الصفحة</span>
                                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center font-black text-xl text-white">
                                                {intel.hifz.toPage}
                                                <span className="block text-[8px] text-slate-500 mt-1 uppercase">آية {intel.hifz.toAyah}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-6 text-xs text-slate-400 font-bold italic opacity-60 text-center">
                                        "إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ"
                                    </p>
                                </div>
                                
                                {/* Next Review */}
                                <div className="p-8 bg-slate-900/50 rounded-[2.5rem] border border-amber-500/20 shadow-inner group/card hover:bg-slate-900 transition-all flex flex-col justify-between text-right" dir="rtl">
                                    <div>
                                        <div className="text-sm font-black text-amber-500 flex items-center gap-3 mb-6">
                                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                                            المراجعة القادمة
                                        </div>
                                        <div className="text-2xl font-black text-white leading-tight mb-2 text-right">
                                            {intel.review}
                                        </div>
                                        <div className="text-sm text-slate-400 font-bold italic bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 inline-block mt-2">
                                            المراجعة حياة الحفظ 🔄
                                        </div>
                                    </div>
                                    <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-amber-500/40 uppercase tracking-widest">
                                        <span>تثبيت اليوم .. طمأنينة الغد</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Khatim Special Card */}
                {isKhatim && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-[2.5rem] p-8 mb-10 text-center shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5 pointer-events-none select-none overflow-hidden flex flex-wrap gap-4 items-center justify-center text-4xl">
                            {Array(20).fill('🏆')}
                        </div>
                        <div className="relative z-10">
                            <div className="text-6xl mb-4 animate-tada inline-block">🎓</div>
                            <h3 className="text-3xl font-black text-amber-900 dark:text-amber-100 mb-2">لقد أتممت حفظ القرآن كاملاً!</h3>
                            <p className="text-amber-700 dark:text-amber-400 font-bold max-w-2xl mx-auto">
                                "خيركم من تعلم القرآن وعلمه"، نفع الله بك وبعلمك الأمة.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {/* Hifz Progress Card */}
                    <div className="premium-glass p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 relative overflow-hidden reveal reveal-delay-2 flex items-center gap-6 group hover:border-emerald-500 transition-colors">
                        {/* Circular Progress SVG */}
                        <div className="relative w-32 h-32 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                {/* Background Circle */}
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="52"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    className="text-slate-100 dark:text-slate-700"
                                />
                                {/* Progress Circle */}
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="52"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    strokeDasharray={2 * Math.PI * 52}
                                    strokeDashoffset={2 * Math.PI * 52 - ((student.juzCount / 30) * 2 * Math.PI * 52)}
                                    strokeLinecap="round"
                                    className={`${isKhatim ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000 ease-out`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-2xl font-black ${isKhatim ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {Math.round((student.juzCount / 30) * 100)}%
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">إلى الختم</span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">الحفظ الحالي</h3>
                                    <div className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                                        {isKhatim ? (
                                            <span className="text-amber-600">كامل القرآن</span>
                                        ) : (
                                            <>سورة <span className="text-emerald-600 dark:text-emerald-500">{student.hifzProgress || 'الفاتحة'}</span></>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-black ${isKhatim ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'} border border-emerald-200/50 dark:border-emerald-800`}>
                                    {student.juzCount} / 30 جزء
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Review Plan Card */}
                    <div className="premium-glass p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 border-b-8 border-b-amber-500 dark:border-b-amber-600 reveal reveal-delay-3 flex flex-col justify-center group hover:border-r-8 hover:border-r-amber-500 transition-all">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">خطة المراجعة الكلية</h3>
                                <div className="text-3xl font-black text-amber-600 dark:text-amber-500">
                                    {student.reviewPlan || 'لم تحدد'}
                                </div>
                            </div>
                            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 rounded-3xl flex items-center justify-center text-3xl shadow-inner border border-amber-100 dark:border-amber-800 transform group-hover:rotate-12 transition-transform">
                                🔄
                            </div>
                        </div>
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold mt-4 italic">المراجعة حياة الحفظ 🤍</p>
                    </div>
                </div>

                    {/* Achievement Log - Detailed View like Teacher's Recording Form */}
                    <div className="bg-[#0f172a] rounded-[3rem] p-6 md:p-10 shadow-2xl border border-slate-800/60 mb-20 max-w-2xl mx-auto reveal reveal-delay-3 relative overflow-hidden text-right" dir="rtl">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[80px] rounded-full"></div>
                        
                        <h3 className="text-2xl font-black text-white mb-10 flex justify-between items-center relative z-10 text-right">
                            <span className="flex items-center gap-4">
                                <span className="p-3 bg-slate-800 rounded-2xl text-xl shadow-lg border border-slate-700">📜</span>
                                سجل الإنجاز
                            </span>
                            <span className="text-xs font-bold text-slate-500 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                                {sessions.length} جلسة مؤخراً
                            </span>
                        </h3>

                        <div className="space-y-12 max-h-[1000px] overflow-y-auto pl-2 custom-scrollbar rtl-scroll relative z-10">
                            {sessions.length > 0 ? sessions.map((session, idx) => {
                                const currentDateFormatted = formatHijri(new Date(session.date), 'long');
                                const prevDateFormatted = idx > 0 ? formatHijri(new Date(sessions[idx - 1].date), 'long') : null;
                                const showDateSeparator = currentDateFormatted !== prevDateFormatted;

                                return (
                                    <div key={session.id || idx} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                        {showDateSeparator && (
                                            <div className="flex items-center gap-4 py-4 mt-8 first:mt-0">
                                                <div className="h-px bg-slate-800 flex-1"></div>
                                                <div className="text-xs font-black text-slate-400 bg-slate-900 px-6 py-2 rounded-2xl border border-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                                    📅 {currentDateFormatted}
                                                </div>
                                                <div className="h-px bg-slate-800 flex-1"></div>
                                            </div>
                                        )}
                                        
                                        <div className="bg-slate-900/40 rounded-[3rem] p-8 border border-white/5 backdrop-blur-sm relative group hover:border-indigo-500/30 transition-all duration-500 shadow-xl overflow-hidden text-right">
                                            {/* Header Section */}
                                            <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5 text-right">
                                                <div className="flex items-center gap-4 text-right">
                                                    <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex flex-col items-center justify-center border border-indigo-500/20 shadow-inner">
                                                        <span className="text-xl font-black">{session.pagesCount || 0}</span>
                                                        <span className="text-[8px] font-bold uppercase tracking-widest">صفحة</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-black text-slate-500 uppercase tracking-widest text-right">توقيت الجلسة</div>
                                                        <div className="text-white font-black text-sm text-right">
                                                            {new Date(session.date).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                                {session.isGoalAchieved && (
                                                    <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-2xl text-[10px] font-black border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center gap-2">
                                                        <span>🎯</span> حقق الهدف
                                                    </div>
                                                )}
                                            </div>

                                            {/* Hifz Details (Detailed Layout like Image 2) */}
                                            {session.hifzSurah && (
                                                <div className="mb-10 animate-in fade-in slide-in-from-right-2 duration-700 text-right">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h4 className="text-lg font-black text-emerald-400 flex items-center gap-3 text-right">
                                                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                                            الحفظ الجديد (سورة {session.hifzSurah})
                                                        </h4>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                                        <div className="space-y-2 text-right">
                                                            <span className="block text-[10px] font-black text-slate-500 mr-2 uppercase tracking-wide text-right">من الصفحة</span>
                                                            <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 text-center relative">
                                                                <div className="text-2xl font-black text-white">{session.hifzFromPage}</div>
                                                                <div className="text-[10px] font-bold text-emerald-500 uppercase mt-1">آية {session.hifzFromAyah || 1}</div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 text-right">
                                                            <span className="block text-[10px] font-black text-slate-500 mr-2 uppercase tracking-wide text-right">إلى الصفحة</span>
                                                            <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 text-center relative">
                                                                <div className="text-2xl font-black text-white">{session.hifzToPage}</div>
                                                                <div className="text-[10px] font-bold text-emerald-500 uppercase mt-1">آية {session.hifzToAyah || '؟'}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Quality Stats Grid for Hifz */}
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <div className="text-[9px] font-black text-red-500 mb-2 uppercase">أخطاء</div>
                                                            <div className="text-xl font-black text-white">{session.hifzErrors || 0}</div>
                                                        </div>
                                                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <div className="text-[9px] font-black text-amber-500 mb-2 uppercase">تنبيهات</div>
                                                            <div className="text-xl font-black text-white">{session.hifzAlerts || 0}</div>
                                                        </div>
                                                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <div className="text-[9px] font-black text-emerald-500 mb-2 uppercase">نقية</div>
                                                            <div className="text-xl font-black text-white">{session.hifzCleanPages || 0}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Murajaah Details */}
                                            {session.murajaahToSurah && (
                                                <div className="mb-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-right-2 duration-700 text-right">
                                                    <h4 className="text-lg font-black text-indigo-400 flex items-center gap-3 mb-6 text-right">
                                                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                                                        المراجعة الكبرى
                                                    </h4>
                                                    <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800 mb-4">
                                                        <div className="flex justify-between items-center">
                                                            <div className="text-center flex-1">
                                                                <div className="text-[10px] text-slate-500 font-bold mb-1">من سورة</div>
                                                                <div className="text-lg font-black text-white">{session.murajaahFromSurah}</div>
                                                                <div className="text-[9px] text-indigo-400 font-bold uppercase mt-1">آية {session.murajaahFromAyah || 1}</div>
                                                            </div>
                                                            <div className="px-4 text-slate-700">←</div>
                                                            <div className="text-center flex-1">
                                                                <div className="text-[10px] text-slate-500 font-bold mb-1">إلى سورة</div>
                                                                <div className="text-lg font-black text-white">{session.murajaahToSurah}</div>
                                                                <div className="text-[9px] text-indigo-400 font-bold uppercase mt-1">آية {session.murajaahToAyah || '؟'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Quality Stats Grid for Murajaah */}
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <div className="text-[9px] font-black text-red-500 mb-2 uppercase">أخطاء</div>
                                                            <div className="text-xl font-black text-white">{session.errorsCount || 0}</div>
                                                        </div>
                                                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <div className="text-[9px] font-black text-amber-500 mb-2 uppercase">تنبيهات</div>
                                                            <div className="text-xl font-black text-white">{session.alertsCount || 0}</div>
                                                        </div>
                                                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <div className="text-[9px] font-black text-indigo-500 mb-2 uppercase">نقية</div>
                                                            <div className="text-xl font-black text-white">{session.cleanPagesCount || 0}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {session.notes && (
                                                <div className="mt-8 pt-6 border-t border-white/5 text-xs text-slate-400 italic font-medium text-right">
                                                    <div className="text-[10px] font-black text-slate-600 mb-2 tracking-widest uppercase text-right">ملاحظات المعلم:</div>
                                                    " {session.notes} "
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-32 bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-800">
                                    <div className="text-6xl mb-6 opacity-20">📅</div>
                                    <h4 className="text-xl font-black text-slate-700">لا يوجد سجلات حالياً</h4>
                                    <p className="text-slate-500 mt-2 font-medium">ستظهر تقارير يوميتك هنا بمجرد تسجيلها</p>
                                </div>
                            )}
                        </div>
                    </div>
            </main>
        </div>
    );
}
