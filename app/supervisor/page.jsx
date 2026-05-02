'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import Card from '../components/Card';
import { formatHijri } from '../utils/dateUtils';
import SendNotification from '../components/SendNotification';
import ManageEvents from '../components/ManageEvents';
import { useTheme } from '../components/ThemeProvider';
import DevStats from '../components/DevStats';
import Link from 'next/link';
import AddStudentModal from '../components/AddStudentModal';


export default function SupervisorDashboard() {
    const router = useRouter();
    const { isDarkMode, mounted } = useTheme();
    const [user, setUser] = useState(null);

    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.trim().split(/\s+/)[0];
    };

    const supervisorName = user ? `أهلًا ${getFirstName(user.name)}` : 'أهلًا';

    // Data State
    const [teachers, setTeachers] = useState([]);
    const [halaqas, setHalaqas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Filter/Search State
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [showHalaqaModal, setShowHalaqaModal] = useState(false);
    const [searchTeacher, setSearchTeacher] = useState('');
    const [searchHalaqa, setSearchHalaqa] = useState('');
    const [teacherSort, setTeacherSort] = useState('assigned');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [hoveredHalaqaId, setHoveredHalaqaId] = useState(null);
    const [isQuranicDay, setIsQuranicDay] = useState(false);

    const getArabicCount = (count, singular, dual, plural, singularAccusative) => {
        if (count === 0) return `لا يوجد ${plural}`;
        if (count === 1) return singular;
        if (count === 2) return dual;
        if (count >= 3 && count <= 10) return `${count} ${plural}`;
        if (count >= 11) return `${count} ${singularAccusative}`;
        return `${count} ${singular}`;
    };

    const normalizeText = (text) => {
        if (!text) return '';
        let normalized = text.toLowerCase();
        normalized = normalized.replace(/[أإآ]/g, 'ا');
        normalized = normalized.normalize("NFD").replace(/[\u064B-\u065F]/g, "");
        return normalized;
    };

    // Students List Modal State
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [selectedHalaqaStudents, setSelectedHalaqaStudents] = useState([]);
    const [selectedHalaqaName, setSelectedHalaqaName] = useState('');
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [showReportTypeModal, setShowReportTypeModal] = useState(false);
    const [selectedHalaqaForReport, setSelectedHalaqaForReport] = useState(null);



    // Edit states
    const [isEditingTeacher, setIsEditingTeacher] = useState(false);
    const [editTeacherId, setEditTeacherId] = useState(null);
    const [newTeacher, setNewTeacher] = useState({ name: '', username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const [isEditingHalaqa, setIsEditingHalaqa] = useState(false);
    const [editHalaqaId, setEditHalaqaId] = useState(null);
    const [newHalaqa, setNewHalaqa] = useState({ name: 'حلقة: ', teacherId: '', assistantTeacherIds: [] });

    const [deletingId, setDeletingId] = useState(null);
    const [students, setStudents] = useState([]);
    const [searchTeacherInHalaqa, setSearchTeacherInHalaqa] = useState('');
    const [searchAssistantInHalaqa, setSearchAssistantInHalaqa] = useState('');

    const [showEditStudentModal, setShowEditStudentModal] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState(null);
    const [currentHalaqaIdForStudent, setCurrentHalaqaIdForStudent] = useState(null);
    const [searchStudentInModal, setSearchStudentInModal] = useState('');
    const [togglingId, setTogglingId] = useState(null);
    const [showHalaqaSettingsModal, setShowHalaqaSettingsModal] = useState(false);
    const [selectedHalaqaForSettings, setSelectedHalaqaForSettings] = useState(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }

        const userObj = JSON.parse(storedUser);
        if (userObj.role !== 'SUPERVISOR') {
            router.push('/login');
            return;
        }

        setUser(userObj);
        fetchAllData();
        checkQuranicDay();
    }, []);

    const checkQuranicDay = async () => {
        try {
            const res = await fetch('/api/quranic-days/stats');
            if (res.ok) setIsQuranicDay(true);
        } catch (e) {
            console.log('No active Quranic Day');
        }
    };

    useEffect(() => {
        if (loading) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        const timeoutId = setTimeout(() => {
            document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        }, 100);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, [loading]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [tRes, hRes, sRes] = await Promise.all([
                fetch('/api/teachers'),
                fetch('/api/halaqas'),
                fetch('/api/students')
            ]);

            if (tRes.ok) {
                const data = await tRes.json();
                setTeachers(data);
            }
            if (hRes.ok) setHalaqas(await hRes.json());
            if (sRes.ok) setStudents(await sRes.json());
        } catch (error) {
            console.error("Error fetching supervisor data", error);
            toast.error("فشل في تحميل البيانات");
        } finally {
            setLoading(false);
        }
    };

    const [activeTerm, setActiveTerm] = useState('feeStatusTerm1');
    
    const paidStudentsT1 = students.filter(s => s.feeStatusTerm1 === 'PAID').length;
    const paidStudentsT2 = students.filter(s => s.feeStatusTerm2 === 'PAID').length;
    const paidStudentsSummer = students.filter(s => s.feeStatusSummer === 'PAID').length;
    
    const currentPaidCount = activeTerm === 'feeStatusTerm1' ? paidStudentsT1 : (activeTerm === 'feeStatusTerm2' ? paidStudentsT2 : paidStudentsSummer);
    const currentPendingCount = students.length - currentPaidCount;
    const currentPercentage = students.length > 0 ? Math.round((currentPaidCount / students.length) * 100) : 0;

    const filteredTeachers = teachers
        .filter(t => normalizeText(t.name).includes(normalizeText(searchTeacher)))
        .sort((a, b) => {
            if (teacherSort === 'name-asc') return a.name.localeCompare(b.name, 'ar');
            if (teacherSort === 'name-desc') return b.name.localeCompare(a.name, 'ar');
            if (teacherSort === 'assigned') {
                const countA = (a._count?.teacherHalaqas || 0) + (a._count?.assistantHalaqas || 0);
                const countB = (b._count?.teacherHalaqas || 0) + (b._count?.assistantHalaqas || 0);
                if (countA > 0 && countB === 0) return -1;
                if (countA === 0 && countB > 0) return 1;
                return a.name.localeCompare(b.name, 'ar');
            }
            return 0;
        });

    const filteredHalaqas = halaqas
        .filter(h => normalizeText(h.name).includes(normalizeText(searchHalaqa)))
        .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    if (!mounted || loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50">
            <div className="w-12 h-12 border-4 border-emerald-100 dark:border-emerald-900 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-bold animate-pulse">جاري تحميل لوحة التحكم...</p>
        </div>
    );

    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = '/api/teachers';
            const method = isEditingTeacher ? 'PUT' : 'POST';
            const body = isEditingTeacher ? { ...newTeacher, id: editTeacherId } : newTeacher;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success(isEditingTeacher ? 'تم تعديل المعلم بنجاح' : 'تم إضافة المعلم بنجاح');
                setShowTeacherModal(false);
                setNewTeacher({ name: '', username: '', password: '' });
                setIsEditingTeacher(false);
                setEditTeacherId(null);
                fetchAllData();
            } else {
                const data = await res.json();
                toast.error(data.error || 'خطأ في العملية');
            }
        } catch (error) {
            toast.error('حدث خطأ ما');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditTeacherModal = (teacher) => {
        setNewTeacher({
            name: teacher.name,
            username: teacher.username,
            password: teacher.password || ''
        });
        setIsEditingTeacher(true);
        setEditTeacherId(teacher.id);
        setShowTeacherModal(true);
    };

    const handleCreateHalaqa = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = '/api/halaqas';
            const method = isEditingHalaqa ? 'PUT' : 'POST';
            const body = isEditingHalaqa ? { ...newHalaqa, id: editHalaqaId } : newHalaqa;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success(isEditingHalaqa ? 'تم تعديل الحلقة بنجاح' : 'تم إنشاء الحلقة بنجاح');
                setShowHalaqaModal(false);
                setNewHalaqa({ name: 'حلقة: ', teacherId: '', assistantTeacherIds: [] });
                setIsEditingHalaqa(false);
                setEditHalaqaId(null);
                fetchAllData();
            } else {
                const data = await res.json();
                toast.error(data.error || 'خطأ في العملية');
            }
        } catch (error) {
            toast.error('حدث خطأ ما');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditHalaqaModal = (halaqa) => {
        setNewHalaqa({
            name: halaqa.name,
            teacherId: halaqa.teacherId ? halaqa.teacherId.toString() : '',
            assistantTeacherIds: halaqa.assistants ? halaqa.assistants.map(a => a.id.toString()) : []
        });
        setIsEditingHalaqa(true);
        setEditHalaqaId(halaqa.id);
        setShowHalaqaModal(true);
    };

    const handleViewStudents = async (halaqa) => {
        setSelectedHalaqaName(halaqa.name);
        setShowStudentsModal(true);
        setLoadingStudents(true);
        setSelectedHalaqaStudents([]);

        try {
            const res = await fetch(`/api/students?halaqaId=${halaqa.id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedHalaqaStudents(data);
            } else {
                toast.error('فشل في جلب الطلاب');
            }
        } catch (error) {
            console.error(error);
            toast.error('خطأ في الاتصال');
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleEditStudent = (student) => {
        setStudentToEdit(student);
        setCurrentHalaqaIdForStudent(student.halaqaId);
        setShowEditStudentModal(true);
    };

    const handleToggleFee = async (studentId, fieldKey, currentStatus) => {
        const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
        setTogglingId(`${studentId}-${fieldKey}`);
        
        try {
            const response = await fetch('/api/students', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: studentId,
                    [fieldKey]: newStatus
                })
            });
            
            if (response.ok) {
                // Update local state for the modal
                setSelectedHalaqaStudents(prev => prev.map(s => 
                    s.id === studentId ? { ...s, [fieldKey]: newStatus } : s
                ));
                toast.success('تم تحديث حالة الرسوم');
            } else {
                toast.error('فشل تحديث الرسوم');
            }
        } catch (error) {
            toast.error('خطأ في الاتصال');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDeleteTeacher = (id, name) => {
        toast((t) => (
            <div className="premium-glass p-6 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 min-w-[300px]">
                <div className="font-bold text-slate-800 dark:text-white text-lg">
                    هل أنت متأكد من حذف المعلم "{name}"؟
                    <div className="text-sm text-red-500 mt-2 font-medium">سيتم حذفه نهائياً من النظام.</div>
                </div>
                <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            performDeleteTeacher(id);
                        }}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        نعم، حذف
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    };

    const performDeleteTeacher = async (id) => {
        setDeletingId(`teacher-${id}`);
        try {
            const res = await fetch(`/api/teachers?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('تم حذف المعلم بنجاح');
                fetchAllData();
            } else {
                toast.error('لم يتم الحذف (قد يكون مرتبطاً بحلقات)');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء الحذف');
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteHalaqa = (id, name) => {
        toast((t) => (
            <div className="premium-glass p-6 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 min-w-[300px]">
                <div className="font-bold text-slate-800 dark:text-white text-lg">
                    هل أنت متأكد من حذف حلقة "{name}"؟
                    <div className="text-sm text-red-500 mt-2 font-medium">سيتم إلغاء ربط الطلاب بالحلقة ولكن لن يتم حذفهم.</div>
                </div>
                <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            performDeleteHalaqa(id);
                        }}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        نعم، حذف
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    };

    const performDeleteHalaqa = async (id) => {
        setDeletingId(`halaqa-${id}`);
        try {
            const res = await fetch(`/api/halaqas?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('تم حذف الحلقة بنجاح');
                fetchAllData();
            } else {
                toast.error('حدث خطأ أثناء الحذف');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء الحذف');
        } finally {
            setDeletingId(null);
        }
    };

    const handleTogglePoints = async (halaqaId, currentStatus) => {
        setTogglingId(`points-${halaqaId}`);
        try {
            const res = await fetch('/api/halaqas', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: halaqaId,
                    pointsEnabled: !currentStatus
                })
            });

            if (res.ok) {
                setHalaqas(prev => prev.map(h => 
                    h.id === halaqaId ? { ...h, pointsEnabled: !currentStatus } : h
                ));
                // Update the modal state too
                setSelectedHalaqaForSettings(prev => prev ? { ...prev, pointsEnabled: !currentStatus } : null);
                
                toast.success(!currentStatus ? 'تم تفعيل النشاط للحلقة' : 'تم إيقاف النشاط للحلقة', {
                    icon: !currentStatus ? '✅' : '🛑'
                });
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'فشل في تحديث حالة النشاط');
            }
        } catch (error) {
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setTogglingId(null);
        }
    };

    const totalStudentsCount = students.length;
    const activeTeachersCount = teachers.filter(t => (t._count?.teacherHalaqas || 0) + (t._count?.assistantHalaqas || 0) > 0).length;

    const halaqaDistribution = halaqas.map(h => ({
        id: h.id,
        name: h.name,
        count: students.filter(s => s.halaqaId === h.id).length
    })).filter(h => h.count > 0).sort((a, b) => b.count - a.count);

    const totalStudentsInHalaqas = halaqaDistribution.reduce((sum, h) => sum + h.count, 0);
    const chartColors = ['#10b981', '#6366f1', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-noto rtl transition-colors duration-300 relative overflow-hidden" dir="rtl">
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-500/5 dark:bg-blue-500/[0.02] rounded-full blur-[150px]"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay"></div>
            </div>

            <Navbar userType="supervisor" userName={supervisorName} onLogout={() => router.push('/login')} displayId={user?.displayId} />

            <main className="max-w-7xl mx-auto px-4 pt-28 pb-12 md:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 reveal">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            مرحباً <span className="text-emerald-600 dark:text-emerald-400 font-amiri text-5xl">{user ? getFirstName(user.name) : 'بكم'}</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">إدارة المعلمين والحلقات ومتابعة الإنجاز العام</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => router.push('/quranic-days')} className={`flex items-center gap-2 px-6 py-3 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 relative overflow-hidden group/qbtn ${isQuranicDay ? 'bg-amber-500 dark:bg-amber-600 shadow-amber-200' : 'bg-slate-800 dark:bg-slate-700'}`}>
                            {isQuranicDay && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer skew-x-12 z-0"></div>}
                            <span className="relative z-10 flex items-center gap-2">
                                <svg className="w-5 h-5 group-hover/qbtn:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                الأيام القرآنية
                            </span>
                        </button>
                        <button onClick={() => { setIsEditingTeacher(false); setEditTeacherId(null); setNewTeacher({ name: '', username: '', password: '' }); setShowTeacherModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            إضافة معلم
                        </button>
                        <button onClick={() => { setIsEditingHalaqa(false); setEditHalaqaId(null); setNewHalaqa({ name: 'حلقة: ', teacherId: '', assistantTeacherIds: [] }); setShowHalaqaModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all active:scale-95">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            إنشاء حلقة
                        </button>
                        {user && <SendNotification senderRole="SUPERVISOR" senderId={user.id} students={students} teachers={teachers} />}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 reveal reveal-delay-1">
                    <StatsCard label="فئة المستخدم" value={user?.role === 'SUPERVISOR' ? 'مشرف عام' : 'معلم'} icon="🛡️" color="from-slate-700 to-slate-900" trend="صلاحيات كاملة" />
                    <StatsCard label="إجمالي الطلاب" value={totalStudentsCount} icon="👥" color="from-orange-400 to-amber-600" trend={getArabicCount(students.length, 'طالب واحد مسجل', 'طالبان مسجلان', 'طلاب مسجلين', 'طالباً مسجلاً')} />
                    <StatsCard label="عدد المعلمين" value={teachers.length} icon="👨‍🏫" color="from-emerald-400 to-teal-600" trend={getArabicCount(teachers.filter(t => (t._count?.teacherHalaqas || 0) > 0).length, 'معلم واحد لديه حلقة', 'معلمان لديهما حلقات', 'معلمين لديهم حلقات', 'معلماً لديهم حلقات')} />
                    <StatsCard label="إجمالي الحلقات" value={halaqas.length} icon="🕌" color="from-blue-500 to-indigo-600" trend="نشطة" />
                </div>

                <div className="premium-glass rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-white/20 dark:border-slate-800/50 mb-12 reveal reveal-delay-2 relative group">
                    <div className="premium-glow-emerald opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
                    <div className="premium-glow-purple opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
                    <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                        <div className="relative w-64 h-64 flex-shrink-0 group/chart">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 rounded-full blur-2xl group-hover/chart:scale-110 transition-transform duration-700"></div>
                            <div className="w-full h-full relative z-10 flex items-center justify-center">
                                {totalStudentsInHalaqas > 0 ? (
                                    <svg viewBox="0 0 256 256" className="w-full h-full transform -rotate-90 overflow-visible">
                                        {halaqaDistribution.map((h, i) => {
                                            const startPct = halaqaDistribution.slice(0, i).reduce((sum, curr) => sum + (curr.count / totalStudentsInHalaqas) * 100, 0);
                                            const endPct = startPct + (h.count / totalStudentsInHalaqas) * 100;
                                            const isHovered = hoveredHalaqaId === h.id;
                                            const color = chartColors[i % chartColors.length];
                                            const radius = 110, innerRadius = 85;
                                            const startAngle = (startPct / 100) * 360 * Math.PI / 180;
                                            const endAngle = (endPct / 100) * 360 * Math.PI / 180;
                                            const x1 = 128 + radius * Math.cos(startAngle), y1 = 128 + radius * Math.sin(startAngle);
                                            const x2 = 128 + radius * Math.cos(endAngle), y2 = 128 + radius * Math.sin(endAngle);
                                            const x3 = 128 + innerRadius * Math.cos(endAngle), y3 = 128 + innerRadius * Math.sin(endAngle);
                                            const x4 = 128 + innerRadius * Math.cos(startAngle), y4 = 128 + innerRadius * Math.sin(startAngle);
                                            const largeArcFlag = endPct - startPct > 50 ? 1 : 0;
                                            const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
                                            return <path key={h.id} d={pathData} fill={color} onMouseEnter={() => setHoveredHalaqaId(h.id)} onMouseLeave={() => setHoveredHalaqaId(null)} className="transition-all duration-500 cursor-pointer" style={{ opacity: hoveredHalaqaId && !isHovered ? 0.3 : 1, transform: isHovered ? 'scale(1.1)' : 'scale(1)', transformOrigin: '128px 128px', filter: isHovered ? `drop-shadow(0 0 12px ${color})` : 'none' }} />;
                                        })}
                                    </svg>
                                ) : <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />}
                            </div>
                            <div className="absolute inset-10 bg-[var(--card-bg)] dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner border-4 border-slate-50/50 dark:border-slate-800/50 z-40 backdrop-blur-sm pointer-events-none">
                                <span className="text-4xl font-black text-slate-800 dark:text-white leading-none mb-1">{totalStudentsCount}</span>
                                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em]">إجمالي الطلاب</span>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-4 mb-8"><div className="h-1 w-12 bg-gradient-to-r from-emerald-500 to-transparent rounded-full"></div><h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">توزيع الطلاب على الحلقات</h3></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {halaqaDistribution.map((h, i) => {
                                    const isHovered = hoveredHalaqaId === h.id;
                                    const percentage = Math.round((h.count / totalStudentsInHalaqas) * 100);
                                    return (
                                        <div key={h.id} onMouseEnter={() => setHoveredHalaqaId(h.id)} onMouseLeave={() => setHoveredHalaqaId(null)} className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all duration-500 group/item cursor-default ${isHovered ? 'bg-white dark:bg-slate-800 border-emerald-500 -translate-y-1 scale-[1.05]' : 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent shadow-sm'}`} style={{ boxShadow: isHovered ? `0 20px 40px -10px ${chartColors[i % chartColors.length]}30` : 'none' }}>
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-transform duration-500 group-hover/item:rotate-12" style={{ backgroundColor: `${chartColors[i % chartColors.length]}15`, color: chartColors[i % chartColors.length], border: `1px solid ${chartColors[i % chartColors.length]}30` }}>🏫</div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className={`font-black text-sm transition-colors ${isHovered ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{h.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/supervisor/reports/custom-list?halaqaId=${h.id}`); }}
                                                            className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400 transition-all active:scale-90"
                                                            title="عرض كشف بيانات الحلقة"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                                        </button>
                                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{percentage}%</span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`, backgroundColor: chartColors[i % chartColors.length] }}></div></div>
                                                <div className="flex justify-between items-center mt-2"><span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 italic">سعة الحلقة</span><span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg">{h.count} طالب</span></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Management Card */}
                <div className="mt-12 mb-12 reveal reveal-delay-3">
                    <div className="premium-glass rounded-[3.5rem] p-8 md:p-12 shadow-2xl border border-white/20 dark:border-slate-800/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-700"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full -ml-48 -mb-48 blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
                        
                        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                            <div className="flex-1 text-right">
                                <div className="flex items-center gap-4 mb-4 justify-end lg:justify-start lg:flex-row-reverse">
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">الإدارة المالية والرسوم</h2>
                                    <span className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-emerald-200 dark:shadow-none">💰</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-lg font-bold mb-8 max-w-2xl">
                                    تتبع حالة تحصيل الرسوم للفترة الحالية بشكل مركزي ودقيق.
                                </p>
                                
                                <div className="flex gap-2 mb-8 justify-end lg:justify-start">
                                    {[
                                        { id: 'feeStatusTerm1', label: 'الترم الأول' },
                                        { id: 'feeStatusTerm2', label: 'الترم الثاني' },
                                        { id: 'feeStatusSummer', label: 'الصيف' }
                                    ].map(term => (
                                        <button
                                            key={term.id}
                                            onClick={() => setActiveTerm(term.id)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${activeTerm === term.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                        >
                                            {term.label}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-6 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-5">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-xl font-black">✓</div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تم السداد</div>
                                            <div className="text-2xl font-black text-slate-800 dark:text-white">{currentPaidCount} طالب</div>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-5">
                                        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center text-xl font-black">!</div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">بانتظار السداد</div>
                                            <div className="text-2xl font-black text-slate-800 dark:text-white">{currentPendingCount} طالب</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="w-full lg:w-72 flex flex-col items-center gap-6 shrink-0">
                                <div className="relative w-48 h-48">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                                        <circle 
                                            cx="96" cy="96" r="80" 
                                            stroke="currentColor" strokeWidth="16" fill="transparent" 
                                            strokeDasharray={502.6}
                                            strokeDashoffset={502.6 - (502.6 * currentPercentage / 100)}
                                            className="text-emerald-500 transition-all duration-1000 ease-out" 
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black text-slate-800 dark:text-white">{currentPercentage}%</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">نسبة التحصيل</span>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => router.push(`/supervisor/reports/custom-list?preselect=${activeTerm}`)}
                                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <span>📊 عرض كشف الرسوم</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="premium-glass rounded-[3rem] p-8 shadow-2xl border border-white/20 dark:border-slate-800/50 flex flex-col reveal reveal-delay-2 relative group">
                        <div className="premium-glow-emerald opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
                        <div className="premium-glow-purple opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                    <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-xl">👨‍🏫</span>
                                    قائمة المعلمين
                                </h2>
                                <span className="bg-emerald-500/10 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black border border-emerald-500/20">
                                    {getArabicCount(teachers.length, 'معلم واحد', 'معلمان', 'معلمين', 'معلماً')}
                                </span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <div className="relative flex-1 group">
                                    <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="ابحث عن معلم بالاسم..." 
                                        className="w-full pr-14 pl-6 py-4 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 rounded-[2rem] outline-none text-sm font-bold transition-all placeholder:text-slate-400 dark:text-white" 
                                        value={searchTeacher} 
                                        onChange={(e) => setSearchTeacher(e.target.value)} 
                                    />
                                </div>
                                <div className="relative">
                                    <button 
                                        onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                                        className="h-full px-6 py-4 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] flex items-center gap-3 font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition-all text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                        </svg>
                                        {teacherSort === 'assigned' ? 'المعلمون المشرفون أولاً' : teacherSort === 'name-asc' ? 'الاسم (أ-ي)' : 'الاسم (ي-أ)'}
                                        <svg className={`w-4 h-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {isSortDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl z-[100] animate-fadeIn">
                                            {[
                                                { id: 'assigned', label: 'المعلمون المشرفون أولاً' },
                                                { id: 'name-asc', label: 'الاسم (أ-ي)' },
                                                { id: 'name-desc', label: 'الاسم (ي-أ)' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => { setTeacherSort(opt.id); setIsSortDropdownOpen(false); }}
                                                    className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-bold transition-all ${teacherSort === opt.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 max-h-[700px] overflow-y-auto custom-scrollbar px-1">
                                {filteredTeachers.map(teacher => {
                                    const teacherHalaqaCount = halaqas.filter(h => 
                                        h.teacherId?.toString() === teacher.id.toString() || 
                                        h.assistants?.some(a => a.id.toString() === teacher.id.toString())
                                    ).length;
                                    return (
                                        <div key={teacher.id} className="group p-6 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500 transition-all duration-500 relative">
                                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
                                                {/* Info Side */}
                                                <div className="flex items-center gap-5 w-full sm:w-auto">
                                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-700 dark:text-white shadow-sm group-hover:scale-105 transition-transform duration-500 shrink-0">
                                                        {teacher.name.charAt(0)}
                                                    </div>
                                                    <div className="text-right flex-1 min-w-0">
                                                        <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-2 leading-tight tracking-tight break-words">
                                                            {teacher.name}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black border border-slate-200 dark:border-slate-700">
                                                                {teacher.username}@
                                                            </div>
                                                            <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-lg text-[9px] font-bold border border-slate-200 dark:border-slate-700">
                                                                #{teacher.displayId || teacher.id}
                                                            </div>
                                                            <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-900 flex items-center gap-1.5">
                                                                <span className="text-[10px]">🔑</span>
                                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{teacher.password}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions Side */}
                                                <div className="flex flex-col items-center sm:items-end gap-4 w-full sm:w-auto">
                                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-300 ${teacherHalaqaCount > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        <span className="text-[11px] font-black tracking-tight whitespace-nowrap">
                                                            {teacherHalaqaCount > 0 
                                                                ? `${getArabicCount(teacherHalaqaCount, 'حلقة واحدة', 'حلقتان', 'حلقات', 'حلقة')} نشطة`
                                                                : 'غير نشط'
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => handleDeleteTeacher(teacher.id, teacher.name)} 
                                                            className="w-11 h-11 flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all duration-300 border border-rose-100 dark:border-rose-900/30 shadow-sm"
                                                            title="حذف"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => openEditTeacherModal(teacher)} 
                                                            className="w-11 h-11 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-300 border border-indigo-100 dark:border-indigo-900/30 shadow-sm"
                                                            title="تعديل"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2-2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="premium-glass rounded-[3rem] p-8 shadow-2xl border border-white/20 dark:border-slate-800/50 flex flex-col reveal reveal-delay-3 relative group">
                        <div className="premium-glow-emerald opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
                        <div className="premium-glow-purple opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><span className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-xl">🕌</span>الحلقات النشطة</h2><span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">{getArabicCount(halaqas.length, 'حلقة واحدة', 'حلقتان', 'حلقات', 'حلقة')}</span></div>
                            <div className="mb-8">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="بحث باسم الحلقة..." 
                                        className="w-full pr-14 pl-6 py-4 bg-white/50 dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 rounded-[2rem] outline-none text-sm font-bold transition-all placeholder:text-slate-400 dark:text-white" 
                                        value={searchHalaqa} 
                                        onChange={(e) => setSearchHalaqa(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-6 max-h-[700px] overflow-y-auto custom-scrollbar">
                                {filteredHalaqas.map(halaqa => (
                                    <div key={halaqa.id} className="group p-6 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-xl transition-all duration-500 relative">
                                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
                                                {/* Info Side */}
                                                <div className="flex items-center gap-5 w-full sm:w-auto">
                                                    <div className="w-16 h-16 bg-indigo-500 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0 font-black text-2xl">
                                                        {halaqa.name.replace('حلقة: ', '').charAt(0)}
                                                    </div>
                                                    <div className="text-right flex-1 min-w-0">
                                                        <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-2 leading-tight tracking-tight break-words">
                                                            {halaqa.name.startsWith('حلقة') ? halaqa.name : `حلقة: ${halaqa.name}`}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-bold">
                                                            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                                                <span className="text-indigo-600 dark:text-indigo-400">👤</span>
                                                                {halaqa.teacher?.name || 'غير معين'}
                                                            </div>
                                                            {halaqa.assistants && halaqa.assistants.length > 0 && (
                                                                <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-lg text-[9px] font-bold border border-slate-200 dark:border-slate-700">
                                                                    +{halaqa.assistants.length} مساعد
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions Side */}
                                                <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                                                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                            </svg>
                                                            <span className="text-[10px] font-black tracking-tight whitespace-nowrap">
                                                                {getArabicCount(students.filter(s => s.halaqaId === halaqa.id).length, 'طالب واحد', 'طالبان', 'طلاب', 'طالباً')}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedHalaqaForSettings(halaqa);
                                                                setShowHalaqaSettingsModal(true);
                                                            }}
                                                            disabled={togglingId === `points-${halaqa.id}`}
                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all shadow-sm active:scale-95 ${halaqa.pointsEnabled ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
                                                            title="إعدادات الأنشطة"
                                                        >
                                                            {togglingId === `points-${halaqa.id}` ? (
                                                                <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                                            ) : (
                                                                <>
                                                                    <span className="text-sm">⚙️</span>
                                                                    <span>الأنشطة</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                
                                                    <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/50 w-full sm:w-auto justify-center">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedHalaqaForReport(halaqa);
                                                                setShowReportTypeModal(true);
                                                            }}
                                                            className="w-9 h-9 flex items-center justify-center bg-amber-500 text-white rounded-xl hover:scale-105 transition-all shadow-sm"
                                                            title="التقارير"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => openEditHalaqaModal(halaqa)}
                                                            className="w-9 h-9 flex items-center justify-center bg-indigo-500 text-white rounded-xl hover:scale-105 transition-all shadow-sm"
                                                            title="تعديل"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteHalaqa(halaqa.id, halaqa.name)}
                                                            disabled={deletingId === `halaqa-${halaqa.id}`}
                                                            className="w-9 h-9 flex items-center justify-center bg-rose-500 text-white rounded-xl hover:scale-105 transition-all shadow-sm disabled:opacity-50"
                                                            title="حذف"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                            </svg>
                                                        </button>
                                                        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                                        <button
                                                            onClick={() => handleViewStudents(halaqa)}
                                                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black hover:opacity-90 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                                        >
                                                            عرض الطلاب
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>

                <ManageEvents teachers={teachers} students={students} />
            </main>

            {showTeacherModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-[12px] md:backdrop-blur-[20px]">
                    <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 animate-fadeIn" onClick={() => setShowTeacherModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col">
                        <div className={`p-8 ${isEditingTeacher ? 'bg-indigo-600' : 'bg-emerald-600'} text-white`}>
                            <h3 className="text-2xl font-black">{isEditingTeacher ? 'تعديل المعلم' : 'إضافة معلم'}</h3>
                        </div>
                        <div className="p-8"><form id="teacher-form" onSubmit={handleCreateTeacher} className="space-y-6">
                            <div className="space-y-2"><label className="text-[10px] font-black uppercase">الاسم</label><input type="text" required value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold dark:text-white" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-black uppercase">اسم المستخدم</label><input type="text" required value={newTeacher.username} onChange={e => setNewTeacher({...newTeacher, username: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold dark:text-white" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-black uppercase">كلمة المرور</label><input type="text" required value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold dark:text-white" /></div>
                        </form></div>
                        <div className="p-8 border-t flex gap-4"><button onClick={() => setShowTeacherModal(false)} className="flex-1 font-black">إلغاء</button><button type="submit" form="teacher-form" className={`flex-[2] py-4 rounded-2xl text-white font-black ${isEditingTeacher ? 'bg-indigo-600' : 'bg-emerald-600'}`}>حفظ</button></div>
                    </div>
                </div>
            )}

            {showHalaqaModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-[12px] md:backdrop-blur-[20px]">
                    <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 animate-fadeIn" onClick={() => { setShowHalaqaModal(false); setIsEditingHalaqa(false); setEditHalaqaId(null); setNewHalaqa({ name: 'حلقة: ', teacherId: '', assistantTeacherIds: [] }); }}></div>
                    <div className="relative w-full max-w-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Premium Header - Sticky */}
                        <div className="sticky top-0 z-[60] p-6 sm:p-8 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-[2.5rem] flex-shrink-0 shadow-md">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                                        {isEditingHalaqa ? 'تعديل بيانات الحلقة' : 'إنشاء حلقة جديدة'}
                                    </h3>
                                    <p className="text-indigo-100 font-bold mt-0.5 text-xs sm:text-sm">قم بتعيين المشرفين والمساعدين لكل حلقة</p>
                                </div>
                                <button onClick={() => {
                                    setShowHalaqaModal(false);
                                    setIsEditingHalaqa(false);
                                    setEditHalaqaId(null);
                                    setNewHalaqa({ name: 'حلقة: ', teacherId: '', assistantTeacherIds: [] });
                                }} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white/50 dark:bg-slate-900/50">
                                <form id="halaqa-form" onSubmit={handleCreateHalaqa} className="space-y-6 pb-4">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mr-1">اسم الحلقة</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="مثال: حلقة علي بن أبي طالب"
                                                className="w-full pr-12 pl-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-[1.5rem] outline-none transition-all font-bold dark:text-white"
                                                value={newHalaqa.name}
                                                onChange={(e) => setNewHalaqa({ ...newHalaqa, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between mr-1">
                                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">المعلم المشرف</label>
                                            </div>
                                            <div className="relative group mb-2">
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="ابحث عن المشرف..."
                                                    className="w-full pr-12 pl-6 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-bold dark:text-white mb-2 text-sm"
                                                    value={searchTeacherInHalaqa}
                                                    onChange={(e) => setSearchTeacherInHalaqa(e.target.value)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-slate-100 dark:border-slate-800 rounded-2xl">
                                                {teachers
                                                    .filter(t => !newHalaqa.assistantTeacherIds.includes(t.id.toString()))
                                                    .filter(t => {
                                                        const searchMatch = normalizeText(t.name).includes(normalizeText(searchTeacherInHalaqa));
                                                        const hasHalaqa = halaqas.some(h => 
                                                            h.id.toString() !== editHalaqaId?.toString() && (
                                                                h.teacherId?.toString() === t.id.toString() || 
                                                                (h.assistants && h.assistants.some(at => at.id.toString() === t.id.toString()))
                                                            )
                                                        );
                                                        if (searchTeacherInHalaqa) return searchMatch;
                                                        return !hasHalaqa;
                                                    })
                                                    .sort((a, b) => {
                                                        const isSelectedA = newHalaqa.teacherId === a.id.toString();
                                                        const isSelectedB = newHalaqa.teacherId === b.id.toString();
                                                        if (isSelectedA && !isSelectedB) return -1;
                                                        if (!isSelectedA && isSelectedB) return 1;
                                                        return a.name.localeCompare(b.name, 'ar');
                                                    })
                                                    .map(t => {
                                                        const hasHalaqa = halaqas.some(h => 
                                                            h.id.toString() !== editHalaqaId?.toString() && (
                                                                h.teacherId?.toString() === t.id.toString() || 
                                                                (h.assistants && h.assistants.some(at => at.id.toString() === t.id.toString()))
                                                            )
                                                        );
                                                        const isSelected = newHalaqa.teacherId === t.id.toString();
                                                        
                                                        return (
                                                            <label key={t.id} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${isSelected ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="relative">
                                                                        <input
                                                                            type="radio"
                                                                            name="teacher"
                                                                            disabled={hasHalaqa && !isSelected}
                                                                            checked={isSelected}
                                                                            onChange={() => setNewHalaqa({ 
                                                                                ...newHalaqa, 
                                                                                teacherId: t.id.toString(),
                                                                                assistantTeacherIds: newHalaqa.assistantTeacherIds.filter(id => id !== t.id.toString())
                                                                            })}
                                                                            className="peer sr-only"
                                                                        />
                                                                        <div className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${isSelected ? 'border-white bg-white' : hasHalaqa ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800' : 'border-slate-300 dark:border-slate-600'}`}>
                                                                            <div className={`w-1.5 h-1.5 rounded-full transition-transform ${isSelected ? 'bg-indigo-600 scale-100' : 'scale-0'}`}></div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className={`text-sm font-black transition-colors ${isSelected ? 'text-white' : hasHalaqa ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600'}`}>{t.name}</span>
                                                                        {hasHalaqa && !isSelected ? (
                                                                            <span className="text-[10px] font-bold text-amber-500">مشرف على حلقة أخرى</span>
                                                                        ) : (
                                                                            <span className="text-[10px] opacity-0 h-0">Ghost Space</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${isSelected ? 'text-indigo-100 opacity-100' : 'opacity-0'}`}>المشرف المختار</span>
                                                            </label>
                                                        );
                                                    })}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between mr-1">
                                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">المساعدين (اختياري)</label>
                                            </div>
                                            <div className="relative group mb-2">
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="ابحث عن مساعد..."
                                                    className="w-full pr-12 pl-6 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-bold dark:text-white mb-2 text-sm"
                                                    value={searchAssistantInHalaqa}
                                                    onChange={(e) => setSearchAssistantInHalaqa(e.target.value)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-slate-100 dark:border-slate-800 rounded-2xl">
                                                {teachers
                                                    .filter(t => t.id.toString() !== newHalaqa.teacherId?.toString())
                                                    .filter(t => {
                                                        const searchMatch = normalizeText(t.name).includes(normalizeText(searchAssistantInHalaqa));
                                                        const hasHalaqa = halaqas.some(h => 
                                                            h.id.toString() !== editHalaqaId?.toString() && (
                                                                h.teacherId?.toString() === t.id.toString() || 
                                                                (h.assistants && h.assistants.some(at => at.id.toString() === t.id.toString()))
                                                            )
                                                        );
                                                        if (searchAssistantInHalaqa) return searchMatch;
                                                        return !hasHalaqa;
                                                    })
                                                    .sort((a, b) => {
                                                        const isCheckedA = newHalaqa.assistantTeacherIds.includes(a.id.toString());
                                                        const isCheckedB = newHalaqa.assistantTeacherIds.includes(b.id.toString());
                                                        if (isCheckedA && !isCheckedB) return -1;
                                                        if (!isCheckedA && isCheckedB) return 1;
                                                        return a.name.localeCompare(b.name, 'ar');
                                                    })
                                                    .map(t => {
                                                        const hasHalaqa = halaqas.some(h => 
                                                            h.id.toString() !== editHalaqaId?.toString() && (
                                                                h.teacherId?.toString() === t.id.toString() || 
                                                                (h.assistants && h.assistants.some(at => at.id.toString() === t.id.toString()))
                                                            )
                                                        );
                                                        const isChecked = newHalaqa.assistantTeacherIds.includes(t.id.toString());

                                                        return (
                                                            <label key={t.id} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${isChecked ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 border' : 'hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="relative">
                                                                        <input
                                                                            type="checkbox"
                                                                            disabled={hasHalaqa && !isChecked}
                                                                            checked={isChecked}
                                                                            onChange={(e) => {
                                                                                const ids = [...newHalaqa.assistantTeacherIds];
                                                                                if (e.target.checked) ids.push(t.id.toString());
                                                                                else {
                                                                                    const idx = ids.indexOf(t.id.toString());
                                                                                    if (idx > -1) ids.splice(idx, 1);
                                                                                }
                                                                                setNewHalaqa({ ...newHalaqa, assistantTeacherIds: ids });
                                                                            }}
                                                                            className="peer sr-only"
                                                                        />
                                                                        <div className={`w-4 h-4 border-2 rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center ${isChecked ? 'border-indigo-600' : hasHalaqa ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800' : 'border-slate-300 dark:border-slate-600'}`}>
                                                                            <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className={`text-sm font-black transition-colors ${isChecked ? 'text-indigo-700 dark:text-indigo-400' : hasHalaqa ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600'}`}>{t.name}</span>
                                                                        {hasHalaqa && !isChecked ? (
                                                                            <span className="text-[10px] font-bold text-amber-500">مكلف بحلقة أخرى</span>
                                                                        ) : (
                                                                            <span className="text-[10px] opacity-0 h-0">Ghost Space</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className={`text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest transition-all ${isChecked ? 'opacity-100' : 'opacity-0'}`}>مساعد مختار</span>
                                                            </label>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-4 flex-shrink-0 z-[60] relative">
                                <button type="button" onClick={() => {
                                    setShowHalaqaModal(false);
                                    setIsEditingHalaqa(false);
                                    setEditHalaqaId(null);
                                    setNewHalaqa({ name: 'حلقة: ', teacherId: '', assistantTeacherIds: [] });
                                }} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all">إلغاء</button>
                                <button type="submit" form="halaqa-form" disabled={submitting} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50 shadow-indigo-200 dark:shadow-none">
                                    {submitting ? 'جاري الحفظ...' : (isEditingHalaqa ? 'حفظ التعديلات' : 'إنشاء الحلقة')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showStudentsModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-[12px] md:backdrop-blur-[20px]">
                    <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 animate-fadeIn" onClick={() => setShowStudentsModal(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-slideUp border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Premium Emerald Header */}
                        <div className="relative p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-[2.5rem]">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <h3 className="text-2xl font-black tracking-tight mb-1">طلاب {selectedHalaqaName}</h3>
                                <div className="mt-4 w-full max-w-xs relative">
                                    <input 
                                        type="text" 
                                        placeholder="بحث عن طالب..." 
                                        value={searchStudentInModal}
                                        onChange={(e) => setSearchStudentInModal(e.target.value)}
                                        className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 outline-none focus:bg-white/30 transition-all text-sm font-bold"
                                    />
                                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                            {loadingStudents ? (
                                <div className="flex flex-col items-center py-12">
                                    <div className="w-10 h-10 border-4 border-slate-100 dark:border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
                                    <p className="text-slate-400 font-bold mt-4">جاري التحميل...</p>
                                </div>
                            ) : selectedHalaqaStudents.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedHalaqaStudents
                                        .filter(s => s.name.toLowerCase().includes(searchStudentInModal.toLowerCase()))
                                        .map((s, idx) => (
                                        <div key={s.id} className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-[1.5rem] border border-transparent hover:border-emerald-500/20 transition-all group">
                                            <div className="w-10 h-10 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl text-[11px] font-black text-slate-400 group-hover:text-emerald-600 shadow-sm flex items-center justify-center">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-black text-sm text-slate-800 dark:text-white truncate leading-tight">{s.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">الرسوم:</span>
                                                    <div className="flex gap-1.5">
                                                        {[
                                                            { key: 'feeStatusTerm1', label: 'ت1' },
                                                            { key: 'feeStatusTerm2', label: 'ت2' },
                                                            { key: 'feeStatusSummer', label: 'ص' }
                                                        ].map(term => {
                                                            const isToggling = togglingId === `${s.id}-${term.key}`;
                                                            return (
                                                                <button
                                                                    key={term.key}
                                                                    disabled={isToggling}
                                                                    onClick={() => handleToggleFee(s.id, term.key, s[term.key])}
                                                                    title={`${term.label}: ${s[term.key] === 'PAID' ? 'تم الدفع' : 'لم يدفع'}`}
                                                                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                                                        isToggling ? 'animate-pulse bg-slate-200' :
                                                                        s[term.key] === 'PAID' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                                                    }`}
                                                                >
                                                                    {isToggling ? (
                                                                        <div className="w-2 h-2 border border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                                                    ) : (
                                                                        <span className="text-[7px] font-black">{term.label}</span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditStudent(s)}
                                                    className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-500 rounded-xl transition-all border border-transparent hover:border-emerald-500/20 shadow-sm"
                                                    title="تعديل بيانات الطالب"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <div className="relative flex h-2 w-2 flex-shrink-0">
                                                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
                                                    <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-4 opacity-20">👥</div>
                                    <h3 className="text-slate-400 dark:text-slate-500 font-bold">لا يوجد طلاب</h3>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-shrink-0">
                            <button onClick={() => setShowStudentsModal(false)} className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black rounded-[1.5rem] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-lg">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}


            <DevStats />
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
                .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.2, 1, 0.3, 1); }
                .reveal.active { opacity: 1; transform: translateY(0); }
                .premium-glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); }
                .dark .premium-glass { background: rgba(15, 23, 42, 0.6); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
                .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.2, 1, 0.3, 1); }
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                .animate-shimmer { animation: shimmer 3s infinite linear; }
            `}</style>
            {showReportTypeModal && selectedHalaqaForReport && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="absolute inset-0 bg-slate-900/60" onClick={() => setShowReportTypeModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden animate-slideUp">
                        <div className="p-8 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-center">
                            <h3 className="text-2xl font-black mb-1">اختر نوع التقرير</h3>
                            <p className="text-amber-100 font-bold text-sm">حلقة: {selectedHalaqaForReport.name.replace('حلقة: ', '')}</p>
                        </div>
                        
                        <div className="p-8 space-y-4">
                            <button 
                                onClick={() => router.push(`/supervisor/reports?teacherId=${selectedHalaqaForReport.teacherId}`)}
                                className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all group flex items-center gap-4 text-right"
                            >
                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">📊</div>
                                <div>
                                    <div className="font-black text-slate-800 dark:text-white text-lg">التقرير المجمع الشامل</div>
                                    <div className="text-xs font-bold text-slate-400">إنجاز الحفظ والمراجعة الأسبوعي</div>
                                </div>
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => router.push(`/supervisor/attendance/report?type=week&teacherId=${selectedHalaqaForReport.teacherId}`)}
                                    className="p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-amber-500/30 transition-all group flex flex-col items-center gap-3 text-center"
                                >
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">📅</div>
                                    <div>
                                        <div className="font-black text-slate-800 dark:text-white text-sm">حضور أسبوعي</div>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => router.push(`/supervisor/attendance/report?type=month&teacherId=${selectedHalaqaForReport.teacherId}`)}
                                    className="p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-amber-500/30 transition-all group flex flex-col items-center gap-3 text-center"
                                >
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">🗓️</div>
                                    <div>
                                        <div className="font-black text-slate-800 dark:text-white text-sm">حضور شهري</div>
                                    </div>
                                </button>
                            </div>

                            <button 
                                onClick={() => router.push(`/supervisor/reports/custom-list?teacherId=${selectedHalaqaForReport.teacherId}`)}
                                className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all group flex items-center gap-4 text-right"
                            >
                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">📋</div>
                                <div>
                                    <div className="font-black text-slate-800 dark:text-white text-lg">قائمة بيانات الطلاب</div>
                                    <div className="text-xs font-bold text-slate-400">اختر الحقول، انسخ كنص، أو اطبعها كجدول رسمي</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => router.push(`/supervisor/test-points/print?halaqaId=${selectedHalaqaForReport.id}`)}
                                className="w-full mt-4 p-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-3xl shadow-xl shadow-emerald-500/20 transition-all group flex items-center gap-5 text-right border-b-4 border-emerald-800"
                            >
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🖨️</div>
                                <div>
                                    <div className="font-black text-xl">طباعة بطاقات النقاط (QR)</div>
                                    <div className="text-xs font-bold text-emerald-100 opacity-80">بطاقات تعريفية للطلاب مع باركود رصد النقاط</div>
                                </div>
                            </button>

                            <button onClick={() => setShowReportTypeModal(false)} className="w-full py-4 text-slate-400 dark:text-slate-500 font-bold hover:text-slate-600 dark:hover:text-slate-300 transition-colors">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {showEditStudentModal && (
                <AddStudentModal
                    isOpen={showEditStudentModal}
                    onClose={() => setShowEditStudentModal(false)}
                    onAdd={() => {
                        setShowEditStudentModal(false);
                        fetchAllData();
                        // Re-fetch current halaqa students if modal is still open
                        if (selectedHalaqaForReport) handleViewStudents(selectedHalaqaForReport);
                    }}
                    student={studentToEdit}
                    halaqaId={currentHalaqaIdForStudent}
                />
            )}
            {showHalaqaSettingsModal && selectedHalaqaForSettings && (
                <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-slate-900/60" onClick={() => setShowHalaqaSettingsModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden">
                        <div className="p-8 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black">إعدادات الأنشطة</h3>
                                    <p className="text-slate-400 text-sm font-bold mt-1">{selectedHalaqaForSettings.name}</p>
                                </div>
                                <button onClick={() => setShowHalaqaSettingsModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-2xl hover:bg-white/20 transition-all">✕</button>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all group hover:border-emerald-500/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🪙</div>
                                    <div>
                                        <h4 className="font-black text-slate-800 dark:text-white">نشاط رصد النقاط</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-0.5">تفعيل رصد النقاط للمعلم والطلاب</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleTogglePoints(selectedHalaqaForSettings.id, selectedHalaqaForSettings.pointsEnabled)}
                                    className={`w-14 h-8 rounded-full transition-all relative ${selectedHalaqaForSettings.pointsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${selectedHalaqaForSettings.pointsEnabled ? 'right-7' : 'right-1 shadow-sm'}`}></div>
                                </button>
                            </div>

                            {/* Placeholder for future activities */}
                            <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center opacity-50">
                                <span className="text-2xl mb-2">➕</span>
                                <p className="text-slate-400 text-xs font-bold">يمكنك إضافة أنشطة برمجية أخرى مستقبلاً</p>
                            </div>
                        </div>
                        <div className="p-6 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <button onClick={() => setShowHalaqaSettingsModal(false)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-lg active:scale-95 transition-all">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
