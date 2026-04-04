'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { formatHijri } from '../utils/dateUtils';
import { useTheme } from '../components/ThemeProvider';
import { quranData } from '../data/quranData';

export default function StudentDashboard() {
    const router = useRouter();
    const [student, setStudent] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const calculateIntelligence = () => {
        if (!student || !sessions || sessions.length === 0) return { hifz: 'ابدأ من الص 1', review: student?.reviewPlan || 'جزء كامل', status: 'green', label: 'جاهز للانطلاق' };
        
        const latestSession = sessions[0];
        const targetPages = student.dailyTargetPages || 1;
        const hifzStart = latestSession.hifzToPage ? latestSession.hifzToPage + 1 : 1;
        const hifzTarget = hifzStart + (targetPages > 1 ? targetPages - 1 : 0);
        
        const lastSurahName = latestSession.murajaahToSurah || student.hifzProgress || 'الفاتحة';
        const lastSurah = quranData.find(s => s.name === lastSurahName) || quranData[0];
        const nextSurah = quranData.find(s => s.id === lastSurah.id + 1) || lastSurah;
        
        let reviewGoal = `من سورة ${nextSurah.name}`;
        if (student.reviewPlan?.includes('جزء')) {
            const currentJuz = juzData.findIndex(j => j.startPage > (lastSurah.startPage || 1)) || 1;
            const targetJuzIdx = student.reviewPlan.includes('جزئين') ? currentJuz + 1 : currentJuz;
            const targetSurah = quranData.find(s => s.startPage >= juzData[Math.min(targetJuzIdx, 30)].startPage) || quranData[113];
            reviewGoal = `من ${nextSurah.name} إلى ${targetSurah.name}`;
        }

        const lastDate = new Date(latestSession.date);
        const today = new Date();
        const getPlanDaysBetween = (start, end) => {
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
            hifz: hifzStart === hifzTarget ? `ص ${hifzStart}` : `من ص ${hifzStart} إلى ${Math.floor(hifzTarget)}`,
            review: reviewGoal, status, label
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
            <Navbar userType="student" userName={`أهلًا ${student.name} 👋`} onLogout={() => router.push('/login')} />

            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Hero Header */}
                <div className={`relative overflow-hidden bg-gradient-to-br ${isKhatim ? 'from-amber-500 to-yellow-700' : 'from-emerald-600 to-teal-700'} rounded-[2.5rem] p-8 md:p-12 text-white mb-8 shadow-2xl ${isKhatim ? 'shadow-amber-100' : 'shadow-emerald-100'} reveal`}>
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

                {/* Next Assignment Card (الورد القادم) */}
                <div className="mb-10 reveal reveal-delay-1">
                    <div className={`p-8 rounded-[2.5rem] border-2 relative overflow-hidden transition-all duration-500 ${
                        intel.status === 'green' ? 'bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/30' : 
                        intel.status === 'orange' ? 'bg-amber-500/10 border-amber-500/20 dark:border-amber-500/30' : 
                        'bg-red-500/10 border-red-500/20 dark:border-red-500/30'
                    }`}>
                       <div className="absolute top-4 left-4 text-4xl opacity-20 transform -rotate-12">🎯</div>
                       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                           <h3 className={`text-xl font-black flex items-center gap-3 ${
                               intel.status === 'green' ? 'text-emerald-700 dark:text-emerald-400' : 
                               intel.status === 'orange' ? 'text-amber-700 dark:text-amber-400' : 
                               'text-red-700 dark:text-red-400'
                           }`}>
                               <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-lg ${
                                   intel.status === 'green' ? 'bg-emerald-500' : 
                                   intel.status === 'orange' ? 'bg-amber-500' : 
                                   'bg-red-500'
                               } text-white`}>📌</span>
                               الورد القادم (للتحضير)
                           </h3>
                           <span className={`px-4 py-1.5 rounded-full text-xs font-black border backdrop-blur-sm ${
                               intel.status === 'green' ? 'bg-emerald-100/50 dark:bg-emerald-900/40 border-emerald-200 text-emerald-700 dark:text-emerald-400' : 
                               intel.status === 'orange' ? 'bg-amber-100/50 dark:bg-amber-900/40 border-amber-200 text-amber-700 dark:text-amber-400' : 
                               'bg-red-100/50 dark:bg-red-900/40 border-red-200 text-red-700 dark:text-red-400'
                           }`}>
                               {intel.label}
                           </span>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* Next Hifz */}
                           <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all group hover:border-emerald-500/50">
                               <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 mb-1 uppercase tracking-widest flex items-center gap-2">
                                   <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                   الحفظ القادم
                               </div>
                               <div className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                                   سورة {student.hifzProgress || 'الفاتحة'}
                               </div>
                               <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold">
                                   {intel.hifz}
                               </div>
                           </div>
                           
                           {/* Next Review */}
                           <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all group hover:border-amber-500/50">
                               <div className="text-[10px] font-black text-amber-600 dark:text-amber-500 mb-1 uppercase tracking-widest flex items-center gap-2">
                                   <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                   المراجعة القادمة
                               </div>
                               <div className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                                   {intel.review}
                               </div>
                               <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold italic opacity-80">
                                   المراجعة حياة الحفظ 🔄
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
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 relative overflow-hidden reveal reveal-delay-2 flex items-center gap-6 group hover:border-emerald-500 transition-colors">
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
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 border-b-8 border-b-amber-500 dark:border-b-amber-600 reveal reveal-delay-3 flex flex-col justify-center group hover:border-r-8 hover:border-r-amber-500 transition-all">
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

                {/* Achievement Log - سجل الإنجاز (نسخة المعلم) */}
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 mb-20 max-w-2xl mx-auto reveal reveal-delay-3">
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-6 md:mb-8 flex items-center gap-3">
                        <span className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-md md:text-lg">📜</span>
                        سجل الإنجاز
                    </h3>
                    <div className="space-y-5 md:space-y-6 max-h-[800px] overflow-y-auto pl-2 custom-scrollbar rtl-scroll">
                        {sessions.length > 0 ? sessions.map((session, idx) => {
                            const currentDateFormatted = formatHijri(new Date(session.date), 'long');
                            const prevDateFormatted = idx > 0 ? formatHijri(new Date(sessions[idx - 1].date), 'long') : null;
                            const showDateSeparator = currentDateFormatted !== prevDateFormatted;

                            return (
                                <div key={session.id} className="space-y-5 md:space-y-6">
                                    {showDateSeparator && (
                                        <div className="flex items-center gap-3 py-2 mt-2 first:mt-0 relative">
                                            <div className="h-px bg-slate-100 dark:bg-slate-700 flex-1"></div>
                                            <div className="flex flex-col items-center gap-1.5 text-center">
                                                <div className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
                                                    📅 {currentDateFormatted}
                                                </div>
                                            </div>
                                            <div className="h-px bg-slate-100 dark:bg-slate-700 flex-1"></div>
                                        </div>
                                    )}
                                    <div className="p-4 md:p-6 bg-slate-950/40 dark:bg-slate-950/60 rounded-[1.8rem] md:rounded-[2.5rem] border border-slate-800/60 hover:border-slate-700 transition-all cursor-default group relative overflow-hidden mb-4">
                                        {/* Vertical line indicator */}
                                        <div className="absolute top-4 bottom-4 right-0 w-1.5 bg-slate-700/80 rounded-l-full"></div>
                                        
                                        <div className="flex justify-between items-center mb-5 md:mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-emerald-500/10 text-emerald-400 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-black border border-emerald-500/20">
                                                    {session.pagesCount || 0} ص
                                                </div>
                                                {session.isGoalAchieved && (
                                                    <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-lg text-[9px] font-black border border-green-500/20 flex items-center gap-1 shadow-sm">
                                                        <span>🎯</span>
                                                        <span className="hidden sm:inline">حقق الهدف</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="bg-slate-800/60 text-slate-400 px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-[10px] md:text-xs font-bold border border-slate-700/50">
                                                {new Date(session.date).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        {session.hifzSurah && (
                                            <div className="mb-6 mr-4">
                                                <div className="text-sm font-black text-emerald-400 mb-1">الحفظ الجديد</div>
                                                <div className="text-lg font-bold text-white mb-1">
                                                    من سورة {session.hifzSurah} (آية {session.hifzFromAyah || 1}) إلى سورة {session.hifzSurah} (آية {session.hifzToAyah || '؟'})
                                                </div>
                                                <div className="text-sm text-slate-400 font-bold">
                                                    {(session.hifzToPage - session.hifzFromPage) + 1} صفحة
                                                </div>
                                            </div>
                                        )}

                                        {session.murajaahToSurah && (
                                            <div className="mb-6 mr-4">
                                                <div className="text-sm font-black text-indigo-400 mb-1">المراجعة الكبرى</div>
                                                <div className="text-lg font-bold text-white mb-1 leading-relaxed">
                                                    من سورة {session.murajaahFromSurah} ({session.murajaahFromAyah ? `آية ${session.murajaahFromAyah}` : 'بداية السورة'}) إلى سورة {session.murajaahToSurah} ({session.murajaahToAyah ? `آية ${session.murajaahToAyah}` : 'نهاية السورة'})
                                                </div>
                                                <div className="text-sm text-slate-400 font-black mt-2">
                                                    {session.pagesCount - (session.hifzPages || 0) - (session.murajaahSughraPages || 0)} صفحة
                                                </div>
                                            </div>
                                        )}

                                        {session.minorMurajaahToSurah && (
                                            <div className="mb-6 mr-4">
                                                <div className="text-sm font-black text-amber-500 mb-1">المراجعة الصغرى</div>
                                                <div className="text-lg font-bold text-white mb-1 leading-relaxed">
                                                    من سورة {session.minorMurajaahFromSurah} إلى سورة {session.minorMurajaahToSurah}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quality Metrics Box (Exactly like image) */}
                                        <div className="bg-slate-800/30 rounded-[2rem] p-6 border border-slate-700/50 mt-4 mr-4">
                                            <div className="text-[11px] font-black text-slate-500 mb-4 text-center">مقاييس الجودة</div>
                                            
                                            <div className="space-y-6">
                                                {session.murajaahToSurah && (
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-[10px] font-black text-indigo-400 mb-3 tracking-tighter">إنجاز المراجعة الكبرى:</div>
                                                        <div className="flex flex-wrap justify-center gap-2 mb-3">
                                                            <div className="bg-slate-900/60 px-4 py-1.5 rounded-xl border border-slate-700 text-xs font-black text-white flex items-center gap-2">
                                                                <span className="text-red-500">❌</span> {session.errorsCount || 0} خطأ
                                                            </div>
                                                            <div className="bg-slate-900/60 px-4 py-1.5 rounded-xl border border-slate-700 text-xs font-black text-white flex items-center gap-2">
                                                                <span className="text-amber-500">⚠️</span> {session.alertsCount || 0} تنبيه
                                                            </div>
                                                        </div>
                                                        <div className="bg-white px-6 py-1.5 rounded-xl text-xs font-black text-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-500/10">
                                                            <span className="text-indigo-500 font-bold">✨</span> {session.cleanPagesCount || 0} نقية
                                                        </div>
                                                    </div>
                                                )}

                                                {session.hifzSurah && (
                                                    <div className="flex flex-col items-center pt-4 border-t border-slate-700/30">
                                                        <div className="text-[10px] font-black text-emerald-400 mb-3 tracking-tighter">إنجاز الحفظ:</div>
                                                        <div className="flex flex-wrap justify-center gap-2 mb-3">
                                                            <div className="bg-slate-900/60 px-4 py-1.5 rounded-xl border border-slate-700 text-xs font-black text-white flex items-center gap-2">
                                                                <span className="text-red-500">❌</span> {session.hifzErrors || 0} خطأ
                                                            </div>
                                                            <div className="bg-slate-900/60 px-4 py-1.5 rounded-xl border border-slate-700 text-xs font-black text-white flex items-center gap-2">
                                                                <span className="text-amber-500">⚠️</span> {session.hifzAlerts || 0} تنبيه
                                                            </div>
                                                        </div>
                                                        <div className="bg-white px-6 py-1.5 rounded-xl text-xs font-black text-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-500/10">
                                                            <span className="text-emerald-500 font-bold">✨</span> {session.hifzCleanPages || 0} نقية
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {session.notes && (
                                            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500 italic mr-4">
                                                " {session.notes} "
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-20 text-slate-400">
                                <span className="text-4xl mb-4 block">📅</span>
                                لا توجد سجلات حالياً
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
