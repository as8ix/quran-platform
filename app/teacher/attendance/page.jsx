'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import { formatHijri } from '../../utils/dateUtils';

export default function AttendancePage() {
    const router = useRouter();
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); // { studentId: status }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [user, setUser] = useState(null);

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

    // Fetch Attendance when Date Changes
    useEffect(() => {
        if (students.length > 0) {
            fetchAttendanceForDate(date, students);
        }
    }, [date]);

    const fetchAttendanceForDate = async (selectedDate, currentStudents) => {
        try {
            const response = await fetch(`/api/attendance?date=${selectedDate}`);
            if (response.ok) {
                const data = await response.json();

                // Map existing records
                const newMap = {};
                // Default all to PRESENT if no record exists for this date?
                // Or leave blank? User requests "Daily Sheet". Usually starts as default.
                // Let's start with PRESENT default, then overwrite with DB data.
                currentStudents.forEach(s => newMap[s.id] = 'PRESENT');

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
        <div className="min-h-screen bg-[#f8fafc] font-noto">
            <Navbar userType="teacher" userName={teacherName} onLogout={() => router.push('/login')} />

            <main className="max-w-4xl mx-auto px-4 py-10">
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

                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">كشف الحضور والغياب</h1>
                        <p className="text-slate-500 mt-2">قم بتحديد حالة حضور الطلاب لهذا اليوم</p>
                    </div>
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 px-4">
                        <span className="text-slate-400 font-bold">التاريخ:</span>

                        {/* Hijri Primary */}
                        <div className="font-black text-emerald-600 text-lg whitespace-nowrap">
                            {formatHijri(date, 'long')}
                        </div>

                        {/* Divider */}
                        <div className="h-8 w-[2px] bg-slate-100 mx-1"></div>

                        {/* Gregorian Secondary */}
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent font-bold text-slate-400 text-sm outline-none"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => openReport('week')}
                            className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                        >
                            <span>📄</span>
                            تقرير أسبوعي
                        </button>
                        <button
                            onClick={() => openReport('month')}
                            className="px-6 py-2 bg-purple-50 text-purple-600 rounded-xl font-bold hover:bg-purple-100 transition-colors flex items-center gap-2"
                        >
                            <span>📊</span>
                            تقرير شهري
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-6 font-black text-slate-400 text-sm uppercase tracking-wider">اسم الطالب</th>
                                    <th className="px-8 py-6 font-black text-slate-400 text-sm uppercase tracking-wider text-center">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-slate-700 text-lg">{student.name}</div>
                                            <div className="text-slate-400 text-sm">محفوظات: {student.juzCount} جزء</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleStatusChange(student.id, 'PRESENT')}
                                                    className={`px-4 py-2 rounded-xl font-bold transition-all ${attendance[student.id] === 'PRESENT' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                >
                                                    حاضر
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(student.id, 'LATE')}
                                                    className={`px-4 py-2 rounded-xl font-bold transition-all ${attendance[student.id] === 'LATE' ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                >
                                                    متأخر
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(student.id, 'ABSENT_EXCUSED')}
                                                    className={`px-4 py-2 rounded-xl font-bold transition-all ${attendance[student.id] === 'ABSENT_EXCUSED' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                >
                                                    بعذر
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(student.id, 'ABSENT_UNEXCUSED')}
                                                    className={`px-4 py-2 rounded-xl font-bold transition-all ${attendance[student.id] === 'ABSENT_UNEXCUSED' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                >
                                                    بدون عذر
                                                </button>
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
                        disabled={saving}
                        className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? 'جاري الحفظ...' : 'حفظ الكشف النهائي'}
                    </button>
                </div>
            </main>
        </div>
    );
}
