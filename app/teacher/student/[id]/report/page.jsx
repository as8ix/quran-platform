'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { formatHijri } from '../../../../utils/dateUtils';

export default function StudentReportPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [history, setHistory] = useState([]);
    
    // Date Filters (default to current week)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        const day = d.getDay(); // 0 (Sun) to 6 (Sat)
        const sun = new Date(d);
        sun.setDate(d.getDate() - day);
        return sun.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        const sun = new Date(d);
        sun.setDate(d.getDate() - day);
        const wed = new Date(sun);
        wed.setDate(sun.getDate() + 3); // 0 (Sun) + 3 = 3 (Wed)
        return wed.toISOString().split('T')[0];
    });

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        if (user && id) {
            fetchStudentData();
        }
    }, [user, id]);

    const fetchStudentData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/students');
            if (res.ok) {
                const students = await res.json();
                const found = students.find(s => s.id === parseInt(id));
                setStudent(found);
            } else {
                toast.error('حدث خطأ أثناء جلب بيانات الطالب');
            }

            const historyRes = await fetch(`/api/sessions?studentId=${id}`);
            if (historyRes.ok) {
                const historyData = await historyRes.json();
                setHistory(historyData);
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-emerald-600 animate-pulse text-xl">جاري صياغة التقرير...</div>;
    }

    if (!student) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xl">الطالب غير موجود</div>;
    }

    // Filter history based on dates
    const filteredHistory = history.filter(session => {
        const sessionDate = new Date(session.date).setHours(0, 0, 0, 0);
        
        if (startDate) {
            const start = new Date(startDate).setHours(0, 0, 0, 0);
            if (sessionDate < start) return false;
        }
        
        if (endDate) {
            const end = new Date(endDate).setHours(23, 59, 59, 999);
            if (sessionDate > end) return false;
        }
        
        return true;
    });

    const startHijri = startDate ? formatHijri(startDate, 'noYear') : '';
    const endHijri = endDate ? formatHijri(endDate, 'noYear') : '';

    return (
        <div className="min-h-screen bg-white font-noto p-8 text-right" dir="rtl">

            {/* ===== Controls - hidden on print ===== */}
            <div className="no-print flex flex-wrap justify-between items-center gap-4 mb-8 bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-3 ml-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-slate-100">
                            📜
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800">تقرير سجل الإنجاز</h2>
                            <p className="text-sm font-bold text-slate-500">للطالب: {student.name}</p>
                        </div>
                    </div>

                    <div className="flex items-end gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">
                                من تاريخ <span className="text-emerald-600 font-black ml-1">{startHijri ? `(${startHijri})` : ''}</span>
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">
                                إلى تاريخ <span className="text-emerald-600 font-black ml-1">{endHijri ? `(${endHijri})` : ''}</span>
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-sm"
                            />
                        </div>
                        {(startDate || endDate) && (
                            <button 
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="px-4 py-2 text-sm text-slate-500 hover:text-red-500 font-bold transition-colors"
                            >
                                إظهار الكل
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push(`/teacher/student/${id}`)}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        ← عودة لملف الطالب
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        طباعة / PDF
                    </button>
                </div>
            </div>

            {/* ===== Printable Report ===== */}
            <div className="bg-slate-50 rounded-[2rem] p-8 mb-8 border border-slate-100 shadow-sm print:shadow-none print:border-none print:bg-transparent print:p-0">

                {/* Report Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-1">سجل إنجاز الطالب</h1>
                        <p className="text-slate-500 font-medium text-lg">
                            {student.name}
                        </p>
                        {(startDate || endDate) && (
                            <p className="text-slate-400 font-bold text-sm mt-2">
                                للفترة من: {startHijri || 'البداية'} إلى {endHijri || 'الآن'}
                            </p>
                        )}
                    </div>
                    <img src="/mosque-logo.png" alt="شعار الحلقة" className="w-16 h-16 object-contain opacity-70" />
                </div>

                {/* Summary Stats */}
                <div className="flex gap-4 mb-8 flex-wrap">
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[110px] print:border-slate-300 print:bg-white">
                        <span className="text-slate-400 text-xs font-bold mb-1">عدد الجلسات</span>
                        <span className="text-2xl font-black text-slate-800">{filteredHistory.length}</span>
                    </div>
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[110px] print:border-slate-300 print:bg-white">
                        <span className="text-slate-400 text-xs font-bold mb-1">إجمالي الحفظ</span>
                        <span className="text-2xl font-black text-emerald-600">{student.juzCount || 0} أجزاء</span>
                    </div>
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[110px] print:border-slate-300 print:bg-white">
                        <span className="text-slate-400 text-xs font-bold mb-1">خطة الحفظ</span>
                        <span className="text-xl font-black text-sky-600">
                            {student.dailyTargetPages === 0.5 ? 'نصف وجه' : student.dailyTargetPages === 1 ? 'وجه واحد' : `${student.dailyTargetPages} أوجه`}
                        </span>
                    </div>
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[110px] print:border-slate-300 print:bg-white">
                        <span className="text-slate-400 text-xs font-bold mb-1">خطة المراجعة</span>
                        <span className="text-xl font-black text-indigo-600">{student.reviewPlan || 'غير محدد'}</span>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[1.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 print:shadow-none print:rounded-none print:border-0 print:bg-transparent">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 print:bg-slate-100 print:border-slate-300">
                                <th className="p-4 font-black text-slate-600 text-right min-w-[150px]">التاريخ واليوم</th>
                                <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">الحفظ الجديد</th>
                                <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">المراجعة الكبرى</th>
                                <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">المراجعة الصغرى</th>
                                <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">الأوجه</th>
                                <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">مقاييس الجودة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                            {filteredHistory.length > 0 ? filteredHistory.map((session, idx) => {
                                const totalErrors = (session.errorsCount || 0) + (session.minorErrorsCount || 0) + (session.hifzErrors || 0);
                                const totalAlerts = (session.alertsCount || 0) + (session.minorAlertsCount || 0) + (session.hifzAlerts || 0);
                                const totalClean = (session.cleanPagesCount || 0) + (session.minorCleanPagesCount || 0) + (session.hifzCleanPages || 0);

                                return (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                                    <td className="p-4 font-bold text-slate-800 border-r border-slate-50 print:border-slate-200 text-right">
                                        {formatHijri(session.date, 'long')}
                                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">{new Date(session.date).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })}</div>
                                    </td>
                                    <td className="p-4 text-center border-r border-slate-50 print:border-slate-200">
                                        {session.hifzSurah ? (
                                            <div className="text-emerald-700 font-black">
                                                سورة {session.hifzSurah}
                                                <div className="text-xs text-emerald-600/70 font-normal mt-0.5">
                                                    {session.hifzFromPage === session.hifzToPage ? `(ص ${session.hifzFromPage})` : `(ص ${session.hifzFromPage} - ${session.hifzToPage})`}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300">—</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center border-r border-slate-50 print:border-slate-200">
                                        {session.murajaahFromSurah ? (
                                            <div className="text-indigo-700 font-black">
                                                من {session.murajaahFromSurah}
                                                <div className="text-xs font-normal mt-0.5">إلى {session.murajaahToSurah}</div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300">—</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center border-r border-slate-50 print:border-slate-200">
                                        {session.minorMurajaahFromSurah ? (
                                            <div className="text-blue-700 font-black">
                                                من {session.minorMurajaahFromSurah}
                                                <div className="text-xs font-normal mt-0.5">إلى {session.minorMurajaahToSurah}</div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300">—</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center border-r border-slate-50 print:border-slate-200">
                                        <span className="inline-flex items-center justify-center h-8 px-3 bg-slate-100 text-slate-700 font-black rounded-lg text-sm print:bg-transparent print:border print:border-slate-300">
                                            {session.pagesCount || 0}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center text-xs border-r border-slate-50 print:border-slate-200">
                                        <div className="flex flex-col gap-1 items-center">
                                            <div className="flex flex-wrap justify-center gap-1 mb-1">
                                                {totalErrors > 0 && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded font-black">أخطاء: {totalErrors}</span>}
                                                {totalAlerts > 0 && <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-black">تنبيهات: {totalAlerts}</span>}
                                                {totalClean > 0 && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black">نقية: {totalClean}</span>}
                                            </div>
                                            {session.notes && <span className="text-slate-500 mt-1 text-center border-t border-slate-100 print:border-slate-300 pt-1 w-full truncate max-w-[150px]">{session.notes}</span>}
                                            {totalErrors === 0 && totalAlerts === 0 && totalClean === 0 && !session.notes && <span className="text-slate-300">—</span>}
                                        </div>
                                    </td>
                                </tr>
                            )}) : (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400 font-bold">لا يوجد سجل إنجاز لهذا الطالب بعد</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
