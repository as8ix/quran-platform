'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { formatHijri } from '../utils/dateUtils';

export default function StudentDashboard() {
    const router = useRouter();
    const [student, setStudent] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
            return;
        }

        const user = JSON.parse(storedUser);
        if (user.role !== 'STUDENT') {
            router.push('/');
            return;
        }

        fetchData(user.id);
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

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-bold animate-pulse">جاري تحميل بياناتك...</p>
        </div>
    );

    if (!student) {
        const handleLogout = () => {
            // Clear session storage and redirect to login/home
            sessionStorage.removeItem('user');
            router.push('/');
        };
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
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
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-noto rtl" dir="rtl">
            <Navbar userType="student" userName={student.name} onLogout={() => router.push('/')} />

            <main className="max-w-3xl mx-auto px-4 py-8">
                {/* Hero Header */}
                <div className={`relative overflow-hidden bg-gradient-to-br ${isKhatim ? 'from-amber-500 to-yellow-700' : 'from-emerald-600 to-teal-700'} rounded-[2.5rem] p-8 md:p-12 text-white mb-8 shadow-2xl ${isKhatim ? 'shadow-amber-100' : 'shadow-emerald-100'}`}>
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
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-[2.5rem] p-8 mb-10 text-center shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5 pointer-events-none select-none overflow-hidden flex flex-wrap gap-4 items-center justify-center text-4xl">
                            {Array(20).fill('🏆')}
                        </div>
                        <div className="relative z-10">
                            <div className="text-6xl mb-4 animate-tada inline-block">🎓</div>
                            <h3 className="text-3xl font-black text-amber-900 mb-2">لقد أتممت حفظ القرآن كاملاً!</h3>
                            <p className="text-amber-700 font-bold max-w-2xl mx-auto">
                                "خيركم من تعلم القرآن وعلمه"، نفع الله بك وبعلمك الأمة.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {/* Hifz Progress Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">الحفظ الحالي</h3>
                                <div className="text-xl font-black text-slate-800">
                                    {isKhatim ? (
                                        <span className="text-amber-600">كامل القرآن</span>
                                    ) : (
                                        <>سورة <span className="text-emerald-600">{student.hifzProgress || 'الفاتحة'}</span></>
                                    )}
                                </div>
                            </div>
                            <div className={`w-12 h-12 ${isKhatim ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'} rounded-2xl flex items-center justify-center text-2xl shadow-sm border`}>
                                {isKhatim ? '🏆' : '📖'}
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${isKhatim ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${(student.juzCount / 30) * 100}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
                            <span>البداية</span>
                            <span>{student.juzCount} جزء</span>
                        </div>
                    </div>

                    {/* Review Plan Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-b-4 border-b-amber-500">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">خطة المراجعة</h3>
                                <div className="text-xl font-black text-amber-600">
                                    {student.reviewPlan || 'لم تحدد'}
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-amber-100">
                                🔄
                            </div>
                        </div>
                        <p className="text-slate-400 text-xs font-bold italic">المراجعة حياة الحفظ 🤍</p>
                    </div>
                </div>

                {/* Achievement Log - سجل الإنجاز */}
                <div className="bg-white rounded-[3rem] p-8 shadow-xl shadow-slate-200/50 border border-white mb-20 max-w-md mx-auto">
                    <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4">
                        <span className="p-2 bg-slate-100 rounded-xl text-lg">📜</span>
                        سجل الإنجاز
                    </h3>

                    <div className="space-y-6 max-h-[600px] overflow-y-auto pl-2 custom-scrollbar rtl-scroll">
                        {sessions.length > 0 ? sessions.map((session, index) => (
                            <div key={session.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-lg hover:shadow-emerald-50 transition-all cursor-default group relative overflow-hidden">
                                {session.hifzSurah && (
                                    <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
                                )}
                                {/* Top Labels */}
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-200 px-2 py-1 rounded-lg">
                                        {formatHijri(session.date, 'long')}
                                    </span>
                                    <span className="text-xs bg-emerald-100 text-emerald-700 font-black px-3 py-1 rounded-full">
                                        {session.pagesCount || 0} ص
                                    </span>
                                </div>

                                {/* Content Details */}
                                <div className="mb-4">
                                    {session.hifzSurah && (
                                        <div className="mb-4">
                                            <div className="text-xs font-black text-emerald-600 mb-1 uppercase tracking-tighter">الحفظ الجديد</div>
                                            <div className="text-md font-bold text-slate-800 leading-tight">
                                                سورة {session.hifzSurah} (من ص {session.hifzFromPage} إلى {session.hifzToPage})
                                            </div>
                                            {(session.hifzFromAyah || session.hifzToAyah) && (
                                                <div className="text-[10px] text-emerald-600 mt-1 font-medium">
                                                    الآيات: {session.hifzFromAyah || '?'} - {session.hifzToAyah || '?'}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {session.murajaahFromSurah && (
                                        <div className="mb-4">
                                            <div className="text-xs font-black text-indigo-500 mb-1 uppercase tracking-tighter">المراجعة</div>
                                            <div className="text-sm font-medium text-slate-600 leading-relaxed">
                                                {session.resultString || `من ${session.murajaahFromSurah} إلى ${session.murajaahToSurah}`}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Quality Metrics Box */}
                                <div className="mb-4 p-3 bg-orange-50/50 rounded-2xl border border-orange-100">
                                    <div className="text-[10px] font-black text-orange-600 mb-2 uppercase tracking-wider">مقاييس الجودة</div>
                                    <div className="flex gap-2 text-[10px] flex-wrap">
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

                                {/* Notes/Comment Footer */}
                                {session.notes && (
                                    <div className="mt-4 pt-4 border-t border-slate-200 text-[11px] text-slate-400 italic font-medium leading-relaxed">
                                        " {session.notes} "
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                <span className="text-4xl mb-4 block opacity-20">📅</span>
                                <h3 className="text-slate-400 font-black text-lg">لا يوجد سجل إنجاز حالياً</h3>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
