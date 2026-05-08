'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { formatHijri } from '../../../../utils/dateUtils';
import { quranData } from '../../../../data/quranData';

const normalizeSurahName = (name) => {
    if (!name) return '';
    return name.replace('سورة ', '').trim();
};

export default function StudentReportPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [history, setHistory] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [reportType, setReportType] = useState('detailed'); // 'detailed' or 'comprehensive'
    
    // Date Filters (default to current week)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        const day = d.getDay(); // 0 (Sun) to 6 (Sat)
        const sun = new Date(d);
        sun.setDate(d.getDate() - day);
        return sun.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
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
            const res = await fetch(`/api/students?id=${id}`);
            if (res.ok) {
                const students = await res.json();
                const found = Array.isArray(students) ? students[0] : students;
                setStudent(found);
            } else {
                toast.error('حدث خطأ أثناء جلب بيانات الطالب');
            }

            const historyRes = await fetch(`/api/sessions?studentId=${id}`);
            if (historyRes.ok) {
                const historyData = await historyRes.json();
                setHistory(historyData);
            }

            const attendanceRes = await fetch(`/api/attendance?studentId=${id}`);
            if (attendanceRes.ok) {
                const attendanceData = await attendanceRes.json();
                setAttendance(attendanceData);
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
    }).sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        
        // Tie-breaker: Higher Surah ID first (assuming 1->114 progression)
        const sA = quranData.find(s => normalizeSurahName(s.name) === normalizeSurahName(a.murajaahFromSurah))?.id || 0;
        const sB = quranData.find(s => normalizeSurahName(s.name) === normalizeSurahName(b.murajaahFromSurah))?.id || 0;
        if (sA !== sB) return sB - sA;

        return (b.id || 0) - (a.id || 0);
    });

    const startHijri = startDate ? formatHijri(startDate, 'noYear') : '';
    const endHijri = endDate ? formatHijri(endDate, 'noYear') : '';

    const filteredAttendance = attendance.filter(record => {
        const recordDate = new Date(record.date).setHours(0, 0, 0, 0);
        if (startDate && recordDate < new Date(startDate).setHours(0, 0, 0, 0)) return false;
        if (endDate && recordDate > new Date(endDate).setHours(23, 59, 59, 999)) return false;
        return true;
    });

    // Calculations for Comprehensive Report
    const getAttendanceStats = () => {
        let presentCount = 0, lateCount = 0, absentExcused = 0, absentUnexcused = 0;
        const processedDates = new Set();

        // 1. Process explicit attendance records
        filteredAttendance.forEach(r => {
            const d = new Date(r.date).toISOString().split('T')[0];
            processedDates.add(d);
            if (r.status === 'PRESENT') presentCount++;
            else if (r.status === 'LATE') lateCount++;
            else if (r.status === 'ABSENT_EXCUSED') absentExcused++;
            else if (r.status === 'ABSENT_UNEXCUSED') absentUnexcused++;
        });

        // 2. Process sessions as evidence of presence (if no attendance record exists)
        filteredHistory.forEach(s => {
            const d = new Date(s.date).toISOString().split('T')[0];
            if (!processedDates.has(d)) {
                presentCount++;
                processedDates.add(d);
            }
        });

        const absent = absentExcused + absentUnexcused;
        return { 
            present: presentCount, 
            late: lateCount, 
            absentExcused, 
            absentUnexcused, 
            absent, 
            total: processedDates.size 
        };
    };

    const getProgressStats = () => {
        const hifzDays = new Set(filteredHistory.filter(s => s.hifzSurah).map(s => new Date(s.date).toISOString().split('T')[0])).size;
        const majorDays = new Set(filteredHistory.filter(s => s.murajaahFromSurah).map(s => new Date(s.date).toISOString().split('T')[0])).size;
        const minorDays = new Set(filteredHistory.filter(s => s.minorMurajaahFromSurah).map(s => new Date(s.date).toISOString().split('T')[0])).size;
        const totalPages = filteredHistory.reduce((sum, s) => sum + (s.pagesCount || 0), 0);
        return { hifzDays, majorDays, minorDays, totalPages };
    };

    const attStats = getAttendanceStats();
    const progStats = getProgressStats();

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
                    </div>
                    
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-inner">
                        <button
                            onClick={() => setReportType('detailed')}
                            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${reportType === 'detailed' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            تقرير مفصل
                        </button>
                        <button
                            onClick={() => setReportType('comprehensive')}
                            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${reportType === 'comprehensive' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            تقرير شامل
                        </button>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push(`/teacher/student/${id}/plan`)}
                        className="px-6 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-100 transition-colors shadow-sm"
                    >
                        📅 الجدول الدراسي
                    </button>
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
                        <span className="text-xl font-black text-emerald-600">
                            {student.dailyTargetPages === 0.5 ? 'نصف وجه' : student.dailyTargetPages === 1 ? 'وجه واحد' : `${student.dailyTargetPages || 0} أوجه`}
                        </span>
                    </div>
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[110px] print:border-slate-300 print:bg-white">
                        <span className="text-slate-400 text-xs font-bold mb-1">خطة المراجعة</span>
                        <span className="text-xl font-black text-indigo-600">{student.reviewPlan || 'غير محدد'}</span>
                    </div>
                </div>

                {/* Table or Comprehensive View */}
                {reportType === 'detailed' ? (
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
                                                <div className="text-indigo-600 font-black">
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
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                                <span className="text-slate-400 text-xs font-bold mb-2">الحضور والغياب</span>
                                <div className="flex gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-emerald-600">{attStats.present}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">حضور</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-rose-500">{attStats.absent}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">غياب</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-amber-500">{attStats.late}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">تأخر</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                                <span className="text-slate-400 text-xs font-bold mb-2">أيام الإنجاز</span>
                                <div className="text-2xl font-black text-emerald-600">{progStats.hifzDays} يوم</div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">حفظ جديد</span>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                                <span className="text-slate-400 text-xs font-bold mb-2">أيام المراجعة</span>
                                <div className="flex gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-indigo-600">{progStats.majorDays}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">كبرى</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-indigo-500">{progStats.minorDays}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">صغرى</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-slate-800">
                                <span className="text-slate-400 text-xs font-bold mb-2">إجمالي الصفحات</span>
                                <div className="text-2xl font-black">{progStats.totalPages}</div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">وجه تسميع</span>
                            </div>
                        </div>

                        {/* Summary Table Style (like General Report) */}
                        <div className="bg-white rounded-[1.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                            <table className="w-full border-collapse text-sm text-center">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-4 font-black text-slate-600">اسم الطالب</th>
                                        <th className="p-4 font-black text-slate-600 border-r border-slate-100">الحضور</th>
                                        <th className="p-4 font-black text-slate-600 border-r border-slate-100">الغياب</th>
                                        <th className="p-4 font-black text-slate-600 border-r border-slate-100">التأخر</th>
                                        <th className="p-4 font-black text-slate-600 border-r border-slate-100">الحفظ الجديد</th>
                                        <th className="p-4 font-black text-slate-600 border-r border-slate-100">أيام المراجعة</th>
                                        <th className="p-4 font-black text-slate-600 border-r border-slate-100">إجمالي الأوجه</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6 font-bold text-slate-800 text-right">
                                            {student.name}
                                            <div className="text-[10px] text-slate-400 font-normal mt-1">{student.hifzProgress || 'بداية الحفظ'}</div>
                                        </td>
                                        <td className="p-4 border-r border-slate-50"><span className="inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 bg-emerald-50 text-emerald-700 font-black rounded-xl text-lg">{attStats.present}</span></td>
                                        <td className="p-4 border-r border-slate-50"><span className={`inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 font-black rounded-xl text-lg ${attStats.absent > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-300'}`}>{attStats.absent > 0 ? attStats.absent : '—'}</span></td>
                                        <td className="p-4 border-r border-slate-50"><span className={`inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 font-black rounded-xl text-lg ${attStats.late > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-300'}`}>{attStats.late > 0 ? attStats.late : '—'}</span></td>
                                        <td className="p-4 border-r border-slate-50"><span className={`inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 font-black rounded-xl text-lg ${progStats.hifzDays > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-slate-300'}`}>{progStats.hifzDays > 0 ? progStats.hifzDays : '—'}</span></td>
                                        <td className="p-4 border-r border-slate-50"><span className={`inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 font-black rounded-xl text-lg ${progStats.majorDays + progStats.minorDays > 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-300'}`}>{progStats.majorDays + progStats.minorDays > 0 ? progStats.majorDays + progStats.minorDays : '—'}</span></td>
                                        <td className="p-4 border-r border-slate-50 font-black text-lg text-slate-800">{progStats.totalPages}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
