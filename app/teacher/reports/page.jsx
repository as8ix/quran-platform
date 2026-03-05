'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { formatHijri } from '../../utils/dateUtils';

export default function WeeklyReport() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

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
    }, [user, startDate, endDate]);

    const fetchReport = async () => {
        if (!user || user.role !== 'TEACHER') return;
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/weekly?teacherId=${user.id}&startDate=${startDate}&endDate=${endDate}`);
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
        let present = 0, absentExcused = 0, absentUnexcused = 0;
        records.forEach(r => {
            if (r.status === 'PRESENT' || r.status === 'LATE') present++;
            else if (r.status === 'ABSENT_EXCUSED') absentExcused++;
            else if (r.status === 'ABSENT_UNEXCUSED') absentUnexcused++;
        });
        return { present, absentExcused, absentUnexcused, total: present + absentExcused + absentUnexcused };
    };

    const totalPresent = reportData.reduce((sum, s) => sum + getAttendanceStats(s.attendance).present, 0);
    const totalAbsent = reportData.reduce((sum, s) => {
        const { absentExcused, absentUnexcused } = getAttendanceStats(s.attendance);
        return sum + absentExcused + absentUnexcused;
    }, 0);
    const totalPages = reportData.reduce((sum, s) => sum + s.sessions.reduce((acc, sess) => acc + (sess.pagesCount || 0), 0), 0);

    const startHijri = formatHijri(startDate, 'noYear');
    const endHijri = formatHijri(endDate, 'long');
    const printDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    return (
        <div className="min-h-screen bg-white font-noto p-8 text-right" dir="rtl">

            {/* ===== Controls - hidden on print ===== */}
            <div className="no-print flex flex-wrap justify-between items-center gap-4 mb-8 bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="flex gap-4 items-end flex-wrap">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">من تاريخ</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-500 shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">إلى تاريخ</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-500 shadow-sm"
                        />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/teacher')}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        ← عودة
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
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
                <div className="flex gap-4 mb-8 flex-wrap">
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[110px] print:border-slate-300">
                        <span className="text-slate-400 text-xs font-bold mb-1">عدد الطلاب</span>
                        <span className="text-2xl font-black text-slate-800">{reportData.length}</span>
                    </div>
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[110px] print:border-slate-300">
                        <span className="text-slate-400 text-xs font-bold mb-1">إجمالي الحضور</span>
                        <span className="text-2xl font-black text-emerald-600">{totalPresent}</span>
                    </div>
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[110px] print:border-slate-300">
                        <span className="text-slate-400 text-xs font-bold mb-1">إجمالي الغياب</span>
                        <span className="text-2xl font-black text-rose-500">{totalAbsent}</span>
                    </div>
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[110px] print:border-slate-300">
                        <span className="text-slate-400 text-xs font-bold mb-1">الأوجه المقروءة</span>
                        <span className="text-2xl font-black text-indigo-600">{totalPages}</span>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-20 text-emerald-600 font-bold animate-pulse">جاري صياغة التقرير...</div>
                ) : reportData.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 font-bold">لا توجد بيانات لهذه الفترة</div>
                ) : (
                    <div className="bg-white rounded-[1.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 print:shadow-none print:rounded-none print:border-0">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 print:bg-slate-100 print:border-slate-300">
                                    <th className="p-4 font-black text-slate-600 text-right min-w-[200px]">الطالب</th>
                                    <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">الحضور</th>
                                    <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">الغياب</th>
                                    <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">أيام الحفظ</th>
                                    <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">المراجعة الكبرى</th>
                                    <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">المراجعة الصغرى</th>
                                    <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">الأوجه</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                                {reportData.map((student, idx) => {
                                    const att = getAttendanceStats(student.attendance);
                                    const hifzDays = student.sessions.filter(s => s.hifzSurah).length;
                                    const majorDays = student.sessions.filter(s => s.murajaahFromSurah).length;
                                    const minorDays = student.sessions.filter(s => s.minorMurajaahFromSurah).length;
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
