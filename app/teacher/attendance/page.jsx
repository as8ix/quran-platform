'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import ManageHolidaysModal from '../../components/ManageHolidaysModal';
import { formatHijri } from '../../utils/dateUtils';

export default function AttendancePage() {
    const router = useRouter();
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); // { studentId: status }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [user, setUser] = useState(null);
    const [showHolidayModal, setShowHolidayModal] = useState(false);
    const [holidays, setHolidays] = useState([]);

    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.trim().split(/\s+/)[0];
    };

    const teacherName = user ? `أهلًا ${getFirstName(user.name)} 👋` : 'أهلًا 👋';

    // Helper: Generate PDF Report
    const openReport = (type) => { // type = 'week' | 'month'
        const url = `/teacher/attendance/report?type=${type}&date=${date}`;
        toast.success(type === 'week' ? 'جاري فتح التقرير الأسبوعي...' : 'جاري فتح التقرير الشهري...', { icon: '📄' });
        window.open(url, '_blank');
    };

    // Get user from localStorage on mount
    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Initial Fetch of Students
    useEffect(() => {
        const fetchStudents = async () => {
            if (!user) return;

            setLoading(true);
            try {
                // First fetch teacher's halaqas to know what to filter by
                let currentTeacherHalaqaId = null;

                const halaqasRes = await fetch('/api/halaqas');
                if (halaqasRes.ok) {
                    const allHalaqas = await halaqasRes.json();

                    // Find halaqas where teacher is lead or assistant
                    const myHalaqas = allHalaqas.filter(h =>
                        h.teacherId === user.id ||
                        (h.assistants && h.assistants.some(a => a.id === user.id))
                    );

                    if (myHalaqas.length > 0) {
                        currentTeacherHalaqaId = myHalaqas[0].id;
                    }
                }

                let url = '/api/students';
                if (currentTeacherHalaqaId) {
                    url += `?halaqaId=${currentTeacherHalaqaId}`;
                }

                const response = await fetch(url);
                const data = await response.json();
                setStudents(data);

                // After getting students, fetch attendance for today
                fetchAttendanceForDate(date, data);
            } catch (error) {
                console.error("Error fetching students:", error);
                toast.error("فشل تحميل قائمة الطلاب");
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [user]);

    useEffect(() => {
        const loadAll = async () => {
            if (students.length > 0) {
                const fetchedHolidays = await fetchHolidays();
                fetchAttendanceForDate(date, students, fetchedHolidays);
            }
        };
        loadAll();
    }, [date, students.length]);

    const fetchHolidays = async () => {
        try {
            const res = await fetch('/api/holidays');
            if (res.ok) {
                const data = await res.json();
                setHolidays(data);
                return data;
            }
        } catch (error) {}
        return [];
    };

    const isHoliday = holidays.some(h => {
        const start = new Date(h.startDate).toISOString().split('T')[0];
        const end = new Date(h.endDate).toISOString().split('T')[0];
        return date >= start && date <= end;
    });

    const currentHoliday = holidays.find(h => {
        const start = new Date(h.startDate).toISOString().split('T')[0];
        const end = new Date(h.endDate).toISOString().split('T')[0];
        return date >= start && date <= end;
    });

    const fetchAttendanceForDate = async (selectedDate, currentStudents, providedHolidays) => {
        try {
            const hList = providedHolidays || holidays;
            const isDateHoliday = hList.some(h => {
                const start = new Date(h.startDate).toISOString().split('T')[0];
                const end = new Date(h.endDate).toISOString().split('T')[0];
                return selectedDate >= start && selectedDate <= end;
            });

            const response = await fetch(`/api/attendance?date=${selectedDate}`);
            if (response.ok) {
                const data = await response.json();

                // Map existing records
                const newMap = {};
                
                // Default based on holiday status
                const defaultStatus = isDateHoliday ? 'HOLIDAY' : 'PRESENT';
                currentStudents.forEach(s => newMap[s.id] = defaultStatus);

                data.forEach(record => {
                    newMap[record.studentId] = record.status;
                });

                setAttendance(newMap);
            }
        } catch (e) {
            console.error(e);
            toast.error("فشل تحميل بيانات الحضور");
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const saveAttendance = async () => {
        setSaving(true);
        try {
            const attendanceData = Object.entries(attendance).map(([id, status]) => ({
                studentId: parseInt(id),
                status,
                date
            }));

            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attendanceData })
            });

            if (response.ok) {
                toast.success('تم تسجيل الحضور بنجاح');
                setTimeout(() => router.push('/teacher'), 1000); // Wait a bit for toast
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 font-noto transition-colors duration-300">
            <Navbar userType="teacher" userName={teacherName} onLogout={() => router.push('/login')} />

            <main className="max-w-4xl mx-auto px-4 pt-28 pb-12">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/teacher')}
                    className="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-colors group"
                >
                    <span className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:shadow-md transition-all border border-slate-100 dark:border-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </span>
                    عودة للقائمة الرئيسية
                </button>

                <div className="mb-10 space-y-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">كشف الحضور والغياب</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">قم بتحديد حالة حضور الطلاب لهذا اليوم</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="w-full md:w-auto premium-glass p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-wrap md:flex-nowrap items-center justify-center gap-3 px-4">
                            <span className="text-slate-400 font-bold text-sm">التاريخ:</span>

                            {/* Hijri Primary */}
                            <div className="font-black text-emerald-600 dark:text-emerald-400 text-base md:text-lg whitespace-nowrap">
                                {formatHijri(date, 'long')}
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block h-8 w-[2px] bg-slate-100 dark:bg-slate-700 mx-1"></div>

                            {/* Gregorian Secondary */}
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent font-bold text-slate-400 dark:text-slate-500 text-sm outline-none cursor-pointer"
                            />
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={() => openReport('week')}
                                className="flex-1 md:flex-none px-6 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <span>📄</span>
                                تقرير أسبوعي
                            </button>
                            <button
                                onClick={() => openReport('month')}
                                className="flex-1 md:flex-none px-6 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl font-bold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <span>📊</span>
                                تقرير شهري
                            </button>
                            <button
                                onClick={() => setShowHolidayModal(true)}
                                className="flex-1 md:flex-none px-6 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                </svg>
                                إدارة الإجازات
                            </button>
                        </div>
                    </div>
                </div>

                {isHoliday && (
                    <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-[2rem] flex items-center gap-4 animate-pulse">
                        <span className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-2xl">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-amber-600 dark:text-amber-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                            </svg>
                        </span>
                        <div>
                            <h3 className="text-xl font-black text-amber-800 dark:text-amber-400">إجازة رسمية: {currentHoliday.name}</h3>
                            <p className="text-amber-600 dark:text-amber-500 font-bold">تم إيقاف التحضير لهذا اليوم لوجود إجازة مجدولة.</p>
                        </div>
                    </div>
                )}

                <div className={`premium-glass rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden border border-white/20 dark:border-slate-800/50 ${isHoliday ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <div className="overflow-x-auto custom-scrollbar p-1 md:p-2">
                        <table className="w-full text-right border-collapse min-w-[350px] md:min-w-[600px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                    <th className="px-4 py-4 md:px-6 md:py-6 font-black text-slate-400 text-xs md:text-sm uppercase tracking-wider whitespace-nowrap w-[40%] md:w-auto">اسم الطالب</th>
                                    <th className="px-4 py-4 md:px-6 md:py-6 font-black text-slate-400 text-xs md:text-sm uppercase tracking-wider text-center whitespace-nowrap">حالة الحضور</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 md:px-6 md:py-6">
                                            <div className="font-bold text-slate-700 dark:text-slate-200 text-base md:text-lg">{student.name}</div>
                                            <div className="text-slate-400 text-xs md:text-sm whitespace-nowrap">محفوظات: {student.juzCount} جزء</div>
                                        </td>
                                        <td className="px-2 py-3 md:px-6 md:py-6">
                                            <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-1.5 md:gap-2">
                                                {[
                                                    { id: 'PRESENT', label: 'حاضر', color: 'bg-emerald-500', shadow: 'shadow-emerald-200' },
                                                    { id: 'LATE', label: 'متأخر', color: 'bg-amber-400', shadow: 'shadow-amber-200' },
                                                    { id: 'ABSENT_EXCUSED', label: 'بعذر', color: 'bg-orange-500', shadow: 'shadow-orange-200' },
                                                    { id: 'ABSENT_UNEXCUSED', label: 'غياب', color: 'bg-rose-500', shadow: 'shadow-rose-200' },
                                                    { id: 'HOLIDAY', label: 'إجازة', color: 'bg-blue-500', shadow: 'shadow-blue-200' }
                                                ].map((status) => (
                                                    <button
                                                        key={status.id}
                                                        onClick={() => handleStatusChange(student.id, status.id)}
                                                        className={`
                                                            px-2 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap flex-1 md:flex-none
                                                            ${attendance[student.id] === status.id
                                                                ? `${status.color} text-white shadow-md md:shadow-lg ${status.shadow}`
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                            }
                                                        `}
                                                    >
                                                        {status.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={saveAttendance}
                        disabled={saving || isHoliday}
                        className="px-8 py-3 md:px-12 md:py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm md:text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? 'جاري الحفظ...' : (isHoliday ? 'التحضير مغلق' : 'حفظ الكشف النهائي')}
                    </button>
                </div>
            </main>

            <ManageHolidaysModal 
                isOpen={showHolidayModal} 
                onClose={() => setShowHolidayModal(false)} 
            />
        </div>
    );
}
