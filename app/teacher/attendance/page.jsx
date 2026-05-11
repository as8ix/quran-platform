'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '@/app/components/Navbar';
import LoadingScreen from '@/app/components/LoadingScreen';

// Modular Components
import AttendanceHeader from '@/app/components/Attendance/AttendanceHeader';
import HolidayAlert from '@/app/components/Attendance/HolidayAlert';
import AttendanceTable from '@/app/components/Attendance/AttendanceTable';
import AttendanceFooter from '@/app/components/Attendance/AttendanceFooter';

export default function AttendancePage() {
    const router = useRouter();
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); // { studentId: status }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [user, setUser] = useState(null);
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
        const storedUser = localStorage.getItem('user');
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

                const halaqasRes = await fetch(`/api/halaqas?teacherId=${user.id}`);
                if (halaqasRes.ok) {
                    const myHalaqas = await halaqasRes.json();
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
        const isInRange = date >= start && date <= end;
        const isRelevant = !h.halaqaId || students.some(s => s.halaqaId === h.halaqaId);
        return isInRange && isRelevant;
    });

    const currentHoliday = holidays.find(h => {
        const start = new Date(h.startDate).toISOString().split('T')[0];
        const end = new Date(h.endDate).toISOString().split('T')[0];
        const isInRange = date >= start && date <= end;
        const isRelevant = !h.halaqaId || students.some(s => s.halaqaId === h.halaqaId);
        return isInRange && isRelevant;
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
                setTimeout(() => router.push('/teacher'), 1000);
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingScreen message="جاري تحميل كشف الحضور..." />;

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-noto transition-colors duration-300 relative overflow-hidden" dir="rtl">
            {/* Premium Edge Glows */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60 dark:opacity-80">
                <div className="premium-glow-emerald"></div>
                <div className="premium-glow-purple"></div>
            </div>

            <Navbar 
                userType="teacher" 
                userName={teacherName} 
                onLogout={() => router.push('/login')} 
                displayId={user?.displayId} 
            />

            <main className="max-w-4xl mx-auto px-4 pt-28 pb-12 relative z-10">
                {/* 1. Header Component */}
                <AttendanceHeader 
                    date={date} 
                    setDate={setDate} 
                    openReport={openReport} 
                />

                {/* 2. Holiday Alert Component */}
                <HolidayAlert 
                    isHoliday={isHoliday} 
                    holidayName={currentHoliday?.name} 
                />

                {/* 3. Table Component */}
                <AttendanceTable 
                    students={students} 
                    attendance={attendance} 
                    handleStatusChange={handleStatusChange} 
                    isHoliday={isHoliday}
                />

                {/* 4. Footer Component */}
                <AttendanceFooter 
                    saveAttendance={saveAttendance} 
                    saving={saving} 
                    isHoliday={isHoliday} 
                />
            </main>
        </div>
    );
}
