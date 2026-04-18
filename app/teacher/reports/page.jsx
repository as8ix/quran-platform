'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { formatHijri } from '../../utils/dateUtils';

function WeeklyReportContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paramTeacherId = searchParams.get('teacherId');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);

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
        wed.setDate(sun.getDate() + 3);
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
        if (user) fetchReport();
    }, [user, startDate, endDate, paramTeacherId]);

    const fetchReport = async () => {
        if (!user) return;
        const targetId = (user.role === 'SUPERVISOR' && paramTeacherId) ? paramTeacherId : user.id;
        
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/weekly?teacherId=${targetId}&startDate=${startDate}&endDate=${endDate}`);
            if (res.ok) {
                setReportData(await res.json());
            } else {
                toast.error('حدث خطأ أثناء جلب التقرير');
            }
        } catch (error) {
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    const getAttendanceStats = (records) => {
        let present = 0, late = 0, absentExcused = 0, absentUnexcused = 0;
        records.forEach(r => {
            if (r.status === 'PRESENT') present++;
            else if (r.status === 'LATE') {
                present++;
                late++;
            }
            else if (r.status === 'ABSENT_EXCUSED') absentExcused++;
            else if (r.status === 'ABSENT_UNEXCUSED') absentUnexcused++;
        });
        return { present, late, absentExcused, absentUnexcused, total: present + absentExcused + absentUnexcused };
    };

    const totalPresent = reportData.reduce((sum, s) => sum + getAttendanceStats(s.attendance).present, 0);
    const totalLate = reportData.reduce((sum, s) => sum + getAttendanceStats(s.attendance).late, 0);
    const totalAbsent = reportData.reduce((sum, s) => {
        const { absentExcused, absentUnexcused } = getAttendanceStats(s.attendance);
        return sum + absentExcused + absentUnexcused;
    }, 0);
    const totalPages = reportData.reduce((sum, s) => sum + s.sessions.reduce((acc, sess) => acc + (sess.pagesCount || 0), 0), 0);

    const startHijri = formatHijri(startDate, 'noYear');
    const endHijri = formatHijri(endDate, 'long');
    const printDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-noto pt-28 pb-12 px-8 text-right transition-colors duration-500" dir="rtl">

            {/* ===== Controls - hidden on print ===== */}
            <div className="no-print flex flex-wrap justify-between items-center gap-4 mb-10 premium-glass rounded-[2.5rem] p-7 border border-white/20 dark:border-slate-800/50 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex gap-5 items-end flex-wrap relative z-10">
                    <div>
                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 mr-1 uppercase tracking-widest">من تاريخ</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-5 py-3 bg-white/50 dark:bg-slate-900/50 border-2 border-transparent focus:border-emerald-500/50 rounded-2xl font-bold text-slate-900 dark:text-white outline-none shadow-inner transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 mr-1 uppercase tracking-widest">إلى تاريخ</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-5 py-3 bg-white/50 dark:bg-slate-900/50 border-2 border-transparent focus:border-emerald-500/50 rounded-2xl font-bold text-slate-900 dark:text-white outline-none shadow-inner transition-all"
                        />
                    </div>
                </div>
                <div className="flex gap-3 relative z-10">
                    <button
                        onClick={() => router.push(user?.role === 'SUPERVISOR' ? '/supervisor' : '/teacher')}
                        className="px-6 py-3 bg-white/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                    >
                        ← عودة
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-emerald-500/20 transition-all active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        طباعة / PDF
                    </button>
                </div>
            </div>

            {/* ===== Printable Report ===== */}
            <div className="bg-slate-50 rounded-[2rem] p-8 mb-8 border border-slate-100 shadow-sm print:shadow-none print:border-none print:bg-transparent print:p-0">

                {/* Report Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-1">التقرير المجمع الشامل</h1>
                        <p className="text-slate-500 font-medium text-lg">
                            الفترة من: {startHijri} إلى {endHijri}
                        </p>
                    </div>
                    <img src="/mosque-logo.png" alt="شعار الحلقة" className="w-16 h-16 object-contain opacity-70" />
                </div>

                {/* Summary Stats */}
                <div className="flex gap-5 mb-10 flex-wrap no-print">
                    {[
                        { label: 'عدد الطلاب', value: reportData.length, color: 'text-slate-800 dark:text-white', bg: 'bg-white/50 dark:bg-slate-900/50' },
                        { label: 'إجمالي الحضور', value: totalPresent, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-900/30' },
                        { label: 'إجمالي الغياب', value: totalAbsent, color: 'text-rose-500 hot-pink', bg: 'bg-rose-50/50 dark:bg-rose-900/30' },
                        { label: 'إجمالي التأخر', value: totalLate, color: 'text-amber-600', bg: 'bg-amber-50/50 dark:bg-amber-900/30' },
                        { label: 'الأوجه المقروءة', value: totalPages, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50/50 dark:bg-indigo-900/30' },
                    ].map((s, i) => (
                        <div key={i} className={`${s.bg} px-8 py-5 rounded-[2rem] shadow-lg border border-white/20 dark:border-slate-800/50 flex flex-col items-center min-w-[140px] transition-transform hover:scale-105 duration-300`}>
                            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{s.label}</span>
                            <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-24 text-emerald-600 font-black animate-pulse text-xl">جاري صياغة التقرير الشامل...</div>
                ) : reportData.length === 0 ? (
                    <div className="text-center py-24 premium-glass rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-black text-xl">لا توجد بيانات لهذه الفترة</div>
                ) : (
                    <div className="premium-glass rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800/50 print:shadow-none print:rounded-none print:border-0 relative">
                        <table className="w-full border-collapse text-sm relative z-10">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 print:bg-slate-100 print:border-slate-300">
                                    <th className="p-4 font-black text-slate-600 text-right min-w-[200px]">الطالب</th>
                                    <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">الحضور</th>
                                    <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">الغياب</th>
                                    <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">التأخر</th>
                                    <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">أيام الحفظ</th>
                                    <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">المراجعة الكبرى</th>
                                    <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">المراجعة الصغرى</th>
                                    <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">الأوجه</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                                {reportData.map((student, idx) => {
                                    const att = getAttendanceStats(student.attendance);
                                    const hifzDays = new Set(student.sessions.filter(s => s.hifzSurah).map(s => new Date(s.date).toISOString().split('T')[0])).size;
                                    const majorDays = new Set(student.sessions.filter(s => s.murajaahFromSurah).map(s => new Date(s.date).toISOString().split('T')[0])).size;
                                    const minorDays = new Set(student.sessions.filter(s => s.minorMurajaahFromSurah).map(s => new Date(s.date).toISOString().split('T')[0])).size;
                                    const totalStudentPages = student.sessions.reduce((sum, s) => sum + (s.pagesCount || 0), 0);
                                    const absTotal = att.absentExcused + att.absentUnexcused;

                                    return (
                                        <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                                            <td className="p-4 font-bold text-slate-800 border-r border-slate-50 print:border-slate-200">
                                                {student.name}
                                                <div className="text-[10px] text-slate-400 font-normal mt-0.5">{student.hifzProgress || 'لم يُحدَّد بعد'}</div>
                                            </td>
                                            <td className="p-4 text-center border-r border-slate-50 print:border-slate-200">
                                                <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 bg-emerald-50 text-emerald-700 font-black rounded-lg text-sm print:bg-transparent">
                                                    {att.present}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center border-r border-slate-50 print:border-slate-200">
                                                <span className={`inline-flex items-center justify-center min-w-[2rem] h-8 px-2 font-black rounded-lg text-sm print:bg-transparent ${absTotal > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    {absTotal > 0 ? absTotal : '—'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center border-r border-slate-50 print:border-slate-200">
                                                <span className={`inline-flex items-center justify-center min-w-[2rem] h-8 px-2 font-black rounded-lg text-sm print:bg-transparent ${att.late > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    {att.late > 0 ? att.late : '—'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center border-r border-slate-50 print:border-slate-200">
                                                <span className={`inline-flex items-center justify-center min-w-[2rem] h-8 px-2 font-black rounded-lg text-sm print:bg-transparent ${hifzDays > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-slate-300'}`}>
                                                    {hifzDays > 0 ? `${hifzDays} أيام` : '—'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center border-r border-slate-50 print:border-slate-200">
                                                <span className={`inline-flex items-center justify-center min-w-[2rem] h-8 px-2 font-black rounded-lg text-sm print:bg-transparent ${majorDays > 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-300'}`}>
                                                    {majorDays > 0 ? `${majorDays} أيام` : '—'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center border-r border-slate-50 print:border-slate-200">
                                                <span className={`inline-flex items-center justify-center min-w-[2rem] h-8 px-2 font-black rounded-lg text-sm print:bg-transparent ${minorDays > 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-300'}`}>
                                                    {minorDays > 0 ? `${minorDays} أيام` : '—'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center justify-center h-8 px-3 bg-slate-100 text-slate-700 font-black rounded-lg text-sm print:bg-transparent print:border print:border-slate-300">
                                                    {totalStudentPages}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 text-xs text-slate-400 flex justify-between px-2 print:text-black">
                <span>تم استخراج هذا التقرير بتاريخ {printDate}</span>
                <span>منصة تحفيظ القرآن الكريم</span>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4 landscape; margin: 0.8cm; }
                    .no-print { display: none !important; }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}

export default function WeeklyReport() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <WeeklyReportContent />
        </Suspense>
    );
}
