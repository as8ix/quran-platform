'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { formatHijri } from '../utils/dateUtils';
import { useTheme } from '../components/ThemeProvider';

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

        // Scroll reveal observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        // Use timeout to ensure data is likely loaded or at least skeleton is there
        const timeoutId = setTimeout(() => {
            document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        }, 800);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, []);

    const fetchData = async (id) => {
        try {
            // Fetch student data and sessions in parallel
            const [studentRes, sessionsRes] = await Promise.all([
                fetch(`/api/students`), // In a real app, use /api/students/${id}
                fetch(`/api/sessions?studentId=${id}`)
            ]);

            const allStudents = await studentRes.json();
            const myData = allStudents.find(s => s.id === id);

            if (myData) {
                setStudent(myData);
            }

            if (sessionsRes.ok) {
                const rawSessions = await sessionsRes.json();

                // Filter for sessions within the last 7 days
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const filteredSessions = rawSessions.filter(s => new Date(s.date) >= oneWeekAgo);

                setSessions(filteredSessions);
            }
        } catch (error) {
            console.error("Error fetching student data", error);
        } finally {
            setLoading(false);
        }
    };

    const { isDarkMode, mounted } = useTheme();

    if (!mounted || loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50">
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
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 dark:text-white font-noto rtl transition-colors duration-300" dir="rtl">
            <Navbar userType="student" userName={`أهلًا ${getFirstName(student.name)} 👋`} onLogout={() => router.push('/login')} />

            <main className="max-w-3xl mx-auto px-4 py-8">
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
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 relative overflow-hidden reveal reveal-delay-1 flex items-center gap-6 group hover:border-emerald-500 transition-colors">
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
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 border-b-8 border-b-amber-500 dark:border-b-amber-600 reveal reveal-delay-2 flex flex-col justify-center group hover:border-r-8 hover:border-r-amber-500 transition-all">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">خطة المراجعة</h3>
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

                {/* Achievement Log - سجل الإنجاز */}
                <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 mb-20 max-w-md mx-auto reveal reveal-delay-3">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-4">
                        <span className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-lg">📜</span>
                        سجل الإنجاز
                    </h3>

                    <div className="space-y-6 max-h-[600px] overflow-y-auto pl-2 custom-scrollbar rtl-scroll">
                        {sessions.length > 0 ? sessions.map((session, index) => (
                            <div key={session.id} className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all cursor-default group relative overflow-hidden">
                                {session.hifzSurah && (
                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
                                )}
                                {/* Top Labels */}
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                        {formatHijri(session.date, 'long')}
                                    </span>
                                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-black px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800">
                                        {session.pagesCount || 0} صفحات
                                    </span>
                                </div>

                                {/* Content Details */}
                                <div className="mb-4">
                                    {session.hifzSurah && (
                                        <div className="mb-5">
                                            <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mb-1 uppercase tracking-wider">الحفظ الجديد</div>
                                            <div className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                                                سورة {session.hifzSurah}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-bold">
                                                {session.hifzFromPage === session.hifzToPage ? `ص ${session.hifzFromPage}` : `من ص ${session.hifzFromPage} إلى ${session.hifzToPage}`}
                                            </div>
                                            {(session.hifzFromAyah || session.hifzToAyah) && (
                                                <div className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded inline-block">
                                                    الآيات: {session.hifzFromAyah || '?'} - {session.hifzToAyah || '?'}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {session.murajaahFromSurah && (
                                        <div className="mb-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                                            <div className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 mb-1 uppercase tracking-wider">المراجعة</div>
                                            <div className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                                                {session.resultString || `من ${session.murajaahFromSurah} إلى ${session.murajaahToSurah}`}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Quality Metrics Box Breakdown */}
                                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider opacity-80">مقاييس الجودة</div>

                                    <div className="space-y-4">
                                        {/* Hifz Metrics */}
                                        {session.hifzSurah && (
                                            <div>
                                                <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 mb-2">إنجاز الحفظ:</div>
                                                <div className="flex gap-2 text-[10px] flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${session.hifzErrors > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                                        <span>❌</span> {session.hifzErrors || 0} خطأ
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${session.hifzAlerts > 0 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                                        <span>⚠️</span> {session.hifzAlerts || 0} تنبيه
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${session.hifzCleanPages > 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                                        <span>✨</span> {session.hifzCleanPages || 0} نقية
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Divider if both exist */}
                                        {session.hifzSurah && session.murajaahFromSurah && (
                                            <div className="h-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                        )}

                                        {/* Murajaah Metrics */}
                                        {session.murajaahFromSurah && (
                                            <div>
                                                <div className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 mb-2">إنجاز المراجعة:</div>
                                                <div className="flex gap-2 text-[10px] flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${(session.errorsCount - (session.hifzErrors || 0)) > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                                        <span>❌</span> {(session.errorsCount - (session.hifzErrors || 0)) || 0} خطأ
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${(session.alertsCount - (session.hifzAlerts || 0)) > 0 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                                        <span>⚠️</span> {(session.alertsCount - (session.hifzAlerts || 0)) || 0} تنبيه
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${(session.cleanPagesCount - (session.hifzCleanPages || 0)) > 0 ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                                        <span>✨</span> {(session.cleanPagesCount - (session.hifzCleanPages || 0)) || 0} نقية
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notes/Comment Footer */}
                                {session.notes && (
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-400 dark:text-slate-500 italic font-medium leading-relaxed">
                                        " {session.notes} "
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <span className="text-4xl mb-4 block opacity-20">📅</span>
                                <h3 className="text-slate-400 dark:text-slate-500 font-black text-lg">لا يوجد سجل إنجاز حالياً</h3>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
