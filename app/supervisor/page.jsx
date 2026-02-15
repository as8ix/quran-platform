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


export default function SupervisorDashboard() {
    const router = useRouter();
    const { isDarkMode, mounted } = useTheme();
    const [user, setUser] = useState(null);

    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.trim().split(/\s+/)[0];
    };

    const supervisorName = user ? `أهلًا ${getFirstName(user.name)} 👋` : 'أهلًا 👋';

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

    // Students List Modal State
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [selectedHalaqaStudents, setSelectedHalaqaStudents] = useState([]);
    const [selectedHalaqaName, setSelectedHalaqaName] = useState('');
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Edit states
    const [isEditingTeacher, setIsEditingTeacher] = useState(false);
    const [editTeacherId, setEditTeacherId] = useState(null);
    const [newTeacher, setNewTeacher] = useState({ name: '', username: '', password: '' });

    const [isEditingHalaqa, setIsEditingHalaqa] = useState(false);
    const [editHalaqaId, setEditHalaqaId] = useState(null);
    const [newHalaqa, setNewHalaqa] = useState({ name: '', teacherId: '', assistantTeacherIds: [] });

    const [deletingId, setDeletingId] = useState(null);
    const [students, setStudents] = useState([]);

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
    }, []);

    useEffect(() => {
        if (loading) return;

        // Scroll reveal observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        // Small timeout to ensure DOM is ready after loading state change
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

            if (tRes.ok) setTeachers(await tRes.json());
            if (hRes.ok) setHalaqas(await hRes.json());
            if (sRes.ok) setStudents(await sRes.json());
        } catch (error) {
            console.error("Error fetching supervisor data", error);
            toast.error("فشل في تحميل البيانات");
        } finally {
            setLoading(false);
        }
    };

    if (!mounted || loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50">
            <div className="w-12 h-12 border-4 border-emerald-100 dark:border-emerald-900 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-bold animate-pulse">جاري تحميل لوحة التحكم...</p>
        </div>
    );

    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        try {
            const url = isEditingTeacher ? '/api/teachers' : '/api/teachers';
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
                fetchData();
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
            const url = isEditingHalaqa ? '/api/halaqas' : '/api/halaqas';
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
                setNewHalaqa({ name: '', teacherId: '', assistantTeacherIds: [] });
                setIsEditingHalaqa(false);
                setEditHalaqaId(null);
                fetchData();
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
            teacherId: halaqa.teacherId || '',
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

    const handleDeleteTeacher = (id, name) => {
        toast((t) => (
            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 flex flex-col gap-4 min-w-[300px]">
                <div className="font-bold text-slate-800 text-lg">
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
                        className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
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
                fetchData();
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
            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 flex flex-col gap-4 min-w-[300px]">
                <div className="font-bold text-slate-800 text-lg">
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
                        className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
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
                fetchData();
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

    // Calculate dynamic stats
    const totalStudentsCount = students.filter(s => s.halaqaId !== null).length;
    const activeTeachersCount = teachers.filter(t => (t._count?.teacherHalaqas || 0) + (t._count?.assistantHalaqas || 0) > 0).length;

    // Calculate halaqa distribution
    const halaqaDistribution = halaqas.map(h => ({
        id: h.id,
        name: h.name,
        count: students.filter(s => s.halaqaId === h.id).length
    })).filter(h => h.count > 0).sort((a, b) => b.count - a.count);

    const totalStudentsInHalaqas = halaqaDistribution.reduce((sum, h) => sum + h.count, 0);
    const chartColors = ['#10b981', '#6366f1', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

    const stats = [
        { label: 'إجمالي الحلقات', value: halaqas.length, trend: 'نشطة', icon: '🕌', color: 'from-blue-500 to-blue-600' },
        { label: 'عدد المعلمين', value: teachers.length, trend: `${activeTeachersCount} لديهم حلقات`, icon: '👨‍🏫', color: 'from-green-500 to-green-600' },
        { label: 'إجمالي الطلاب', value: totalStudentsCount, trend: 'طالب مسجل', icon: '🎯', color: 'from-orange-500 to-orange-600' },
        { label: 'فئة المستخدم', value: user?.role === 'SUPERVISOR' ? 'مشرف عام' : 'مستخدم', trend: 'صلاحيات كاملة', icon: '⚡', color: 'from-teal-500 to-cyan-500' },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-noto rtl transition-colors duration-300" dir="rtl">
            <Navbar userType="supervisor" userName={supervisorName} onLogout={() => router.push('/login')} />

            <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 reveal">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            مرحباً <span className="text-emerald-600 dark:text-emerald-400 font-amiri text-5xl">{user ? getFirstName(user.name) : 'بكم'}</span> 👋
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">إدارة المعلمين والحلقات ومتابعة الإنجاز العام</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => router.push('/quranic-days')}
                            className="flex items-center gap-2 px-6 py-3 bg-amber-500 dark:bg-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-200 dark:shadow-none hover:bg-amber-600 transition-all active:scale-95"
                        >
                            <span>🏆</span> الأيام القرآنية
                        </button>
                        <button
                            onClick={() => {
                                setIsEditingTeacher(false);
                                setEditTeacherId(null);
                                setNewTeacher({ name: '', username: '', password: '' });
                                setShowTeacherModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
                        >
                            <span>➕</span> إضافة معلم
                        </button>
                        <button
                            onClick={() => {
                                setIsEditingHalaqa(false);
                                setEditHalaqaId(null);
                                setNewHalaqa({ name: '', teacherId: '', assistantTeacherIds: [] });
                                setShowHalaqaModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all active:scale-95"
                        >
                            <span>🕌</span> إنشاء حلقة
                        </button>
                        {user && (
                            <SendNotification
                                senderRole="SUPERVISOR"
                                senderId={user.id}
                                students={students}
                                teachers={teachers}
                            />
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 reveal reveal-delay-1">
                    {stats.map((stat, index) => (
                        <StatsCard key={index} {...stat} />
                    ))}
                </div>

                {/* Distribution Chart Section */}
                <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-[var(--border-main)] mb-10 reveal reveal-delay-2">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="relative w-56 h-56 flex-shrink-0">
                            <div
                                className="w-full h-full rounded-full shadow-inner transition-all duration-700 rotate-180"
                                style={{
                                    background: totalStudentsInHalaqas > 0
                                        ? `conic-gradient(${halaqaDistribution.map((h, i) => {
                                            const start = halaqaDistribution.slice(0, i).reduce((sum, curr) => sum + (curr.count / totalStudentsInHalaqas) * 100, 0);
                                            const end = start + (h.count / totalStudentsInHalaqas) * 100;
                                            return `${chartColors[i % chartColors.length]} ${start}% ${end}%`;
                                        }).join(', ')})`
                                        : (isDarkMode ? '#1e293b' : '#f1f5f9')
                                }}
                            ></div>
                            <div className="absolute inset-5 bg-[var(--card-bg)] rounded-full flex flex-col items-center justify-center shadow-lg border-2 border-slate-50 dark:border-slate-700">
                                <span className="text-4xl font-black text-slate-800 dark:text-white leading-none">{totalStudentsCount}</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">إجمالي الطلاب</span>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                            <h3 className="col-span-full text-2xl font-black text-slate-800 dark:text-white mb-4 border-r-4 border-emerald-500 pr-3">توزيع الطلاب على الحلقات</h3>
                            {halaqaDistribution.map((h, i) => (
                                <div key={h.id} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-700/50 group hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all">
                                    <div
                                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                                        style={{ backgroundColor: chartColors[i % chartColors.length] }}
                                    ></div>
                                    <div className="flex-1 flex justify-between items-center">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{h.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-xl text-xs font-black text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-50 dark:border-slate-700">
                                                {h.count} طالب
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">
                                                {Math.round((h.count / totalStudentsInHalaqas) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Teachers Section */}
                    <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-8 shadow-sm border border-[var(--border-main)] h-full flex flex-col reveal reveal-delay-2">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-xl">👨‍🏫</span>
                                قائمة المعلمين
                            </h2>
                            <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                                {teachers.length} معلم
                            </span>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pl-2 custom-scrollbar flex-1">
                            {teachers.length > 0 ? teachers.map((teacher) => (
                                <div key={teacher.id} className="group p-5 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-[var(--bg-main)] dark:bg-slate-700 border-2 border-[var(--border-main)] dark:border-slate-600 rounded-2xl flex items-center justify-center text-3xl font-black text-slate-700 dark:text-white shadow-sm group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/40 group-hover:border-emerald-200 dark:group-hover:border-emerald-500 transition-all duration-300">
                                                {teacher.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-xl text-slate-800 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{teacher.name}</div>
                                                <div className="text-xs text-slate-400 dark:text-slate-500 font-bold flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity">@{teacher.username}</span>
                                                    <span className="text-slate-200 dark:text-slate-700">|</span>
                                                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/40 px-2.5 py-1 rounded-xl border border-amber-100/50 dark:border-amber-900/30 shadow-sm">
                                                        <span className="text-sm">🔑</span>
                                                        <span className="font-mono tracking-wider">{teacher.password}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="px-5 py-2 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-2xl text-sm font-black border border-emerald-200/50 dark:border-emerald-800/50">
                                                {(teacher._count?.teacherHalaqas || 0) + (teacher._count?.assistantHalaqas || 0)} حلقات
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 duration-300">
                                                <button
                                                    onClick={() => openEditTeacherModal(teacher)}
                                                    className="w-9 h-9 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors shadow-sm"
                                                    title="تعديل المعلم"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                                                    disabled={deletingId === `teacher-${teacher.id}`}
                                                    className="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-800 transition-colors shadow-sm"
                                                    title="حذف المعلم"
                                                >
                                                    {deletingId === `teacher-${teacher.id}` ? '...' : '🗑️'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <div className="text-4xl mb-3 opacity-30">👨‍🏫</div>
                                    <h3 className="text-slate-400 font-bold">لا يوجد معلمين حالياً</h3>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Halaqas Section */}
                    <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-8 shadow-sm border border-[var(--border-main)] h-full flex flex-col reveal reveal-delay-3">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                <span className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-xl">🕌</span>
                                الحلقات النشطة
                            </h2>
                            <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">
                                {halaqas.length} حلقة
                            </span>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pl-2 custom-scrollbar flex-1">
                            {halaqas.length > 0 ? halaqas.map((halaqa) => (
                                <div key={halaqa.id} className="group p-5 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-indigo-200 dark:shadow-none group-hover:rotate-6 transition-transform">
                                                🕌
                                            </div>
                                            <div>
                                                <div className="font-bold text-xl text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{halaqa.name}</div>
                                                <div className="text-xs text-slate-400 dark:text-slate-500 font-bold flex items-center gap-2 mt-1">
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">المعلم:</span>
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-black">{halaqa.teacher?.name || 'غير معين'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-end gap-1">
                                                {halaqa._count?.assistants > 0 && (
                                                    <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-xl text-[10px] font-black border border-orange-100 dark:border-orange-800 shadow-sm">
                                                        👤 {halaqa._count.assistants} مساعدين
                                                    </span>
                                                )}
                                                <span className="px-4 py-1.5 bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 rounded-2xl text-sm font-black border border-purple-100 dark:border-purple-800 shadow-sm">
                                                    {students.filter(s => s.halaqaId === halaqa.id).length} طلاب
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                                                <button
                                                    onClick={() => openEditHalaqaModal(halaqa)}
                                                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-xl border border-slate-100 dark:border-slate-600 hover:border-indigo-500 hover:text-indigo-500 transition-all shadow-sm"
                                                    title="تعديل"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteHalaqa(halaqa.id, halaqa.name)}
                                                    disabled={deletingId === `halaqa-${halaqa.id}`}
                                                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-xl border border-slate-100 dark:border-slate-600 hover:border-red-500 hover:text-red-500 transition-all shadow-sm"
                                                >
                                                    {deletingId === `halaqa-${halaqa.id}` ? '...' : '🗑️'}
                                                </button>
                                                <button
                                                    onClick={() => handleViewStudents(halaqa)}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95"
                                                >
                                                    الطلاب ←
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <div className="text-4xl mb-3 opacity-30">🕌</div>
                                    <h3 className="text-slate-400 font-bold">لا يوجد حلقات حالياً</h3>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quranic Events Management */}
                <ManageEvents teachers={teachers} students={students} />
            </div>

            {/* Modals */}
            {showTeacherModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative animate-fadeIn">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">
                            {isEditingTeacher ? 'تعديل بيانات المعلم' : 'إضافة معلم جديد'}
                        </h3>
                        <form onSubmit={handleCreateTeacher} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">الاسم الثلاثي</label>
                                <input
                                    type="text"
                                    required
                                    value={newTeacher.name}
                                    onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-emerald-500 outline-none transition-all font-bold dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">اسم المستخدم</label>
                                <input
                                    type="text"
                                    required
                                    value={newTeacher.username}
                                    onChange={e => setNewTeacher({ ...newTeacher, username: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-emerald-500 outline-none transition-all font-bold dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">كلمة المرور</label>
                                <input
                                    type="text"
                                    required
                                    value={newTeacher.password}
                                    onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-emerald-500 outline-none transition-all font-bold dark:text-white"
                                />
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button type="button" onClick={() => {
                                    setShowTeacherModal(false);
                                    setIsEditingTeacher(false);
                                    setEditTeacherId(null);
                                    setNewTeacher({ name: '', username: '', password: '' });
                                }} className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">إلغاء</button>
                                <button type="submit" disabled={submitting} className={`flex-1 py-3 ${isEditingTeacher ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-700'} text-white rounded-xl font-bold transition-colors shadow-lg disabled:opacity-50`}>
                                    {submitting ? 'جاري التنفيذ...' : (isEditingTeacher ? 'حفظ التعديلات' : 'إضافة المعلم')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showHalaqaModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative animate-fadeIn">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">
                            {isEditingHalaqa ? 'تعديل بيانات الحلقة' : 'إنشاء حلقة جديدة'}
                        </h3>
                        <form onSubmit={handleCreateHalaqa} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">اسم الحلقة</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="مثال: حلقة أبو بكر الصديق"
                                    value={newHalaqa.name}
                                    onChange={e => setNewHalaqa({ ...newHalaqa, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">المعلم المسؤول (المشرف الأساسي)</label>
                                <select
                                    required
                                    value={newHalaqa.teacherId}
                                    onChange={e => setNewHalaqa({ ...newHalaqa, teacherId: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold dark:text-white"
                                >
                                    <option value="">اختر المعلم المسؤول...</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">المعلمين المساعدين (اختياري)</label>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-xl max-h-40 overflow-y-auto custom-scrollbar">
                                    {teachers.filter(t => t.id !== parseInt(newHalaqa.teacherId)).length > 0 ? (
                                        teachers.filter(t => t.id !== parseInt(newHalaqa.teacherId)).map(t => (
                                            <label key={t.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    value={t.id}
                                                    checked={newHalaqa.assistantTeacherIds?.includes(t.id.toString())}
                                                    onChange={e => {
                                                        const id = e.target.value;
                                                        const currentIds = newHalaqa.assistantTeacherIds || [];
                                                        if (e.target.checked) {
                                                            setNewHalaqa({ ...newHalaqa, assistantTeacherIds: [...currentIds, id] });
                                                        } else {
                                                            setNewHalaqa({ ...newHalaqa, assistantTeacherIds: currentIds.filter(tid => tid !== id) });
                                                        }
                                                    }}
                                                    className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{t.name}</span>
                                            </label>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 text-sm text-center py-2">لا يوجد معلمين آخرين للإختيار</p>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-bold">يمكنك اختيار أكثر من معلم مساعد</p>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button type="button" onClick={() => {
                                    setShowHalaqaModal(false);
                                    setIsEditingHalaqa(false);
                                    setEditHalaqaId(null);
                                    setNewHalaqa({ name: '', teacherId: '', assistantTeacherIds: [] });
                                }} className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">إلغاء</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none">
                                    {submitting ? 'جاري الإنشاء...' : (isEditingHalaqa ? 'حفظ التعديلات' : 'إنشاء الحلقة')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Students List Modal */}
            {showStudentsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl relative animate-fadeIn max-h-[800px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white">طلاب {selectedHalaqaName}</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">قائمة الطلاب المسجلين في هذه الحلقة</p>
                            </div>
                            <button onClick={() => setShowStudentsModal(false)} className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-all font-bold">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                            {loadingStudents ? (
                                <div className="py-20 flex flex-col items-center justify-center">
                                    <div className="w-10 h-10 border-4 border-indigo-100 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div>
                                    <p className="mt-4 text-slate-400 dark:text-slate-500 font-bold text-sm">جاري جلب الطلاب...</p>
                                </div>
                            ) : selectedHalaqaStudents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                                    {selectedHalaqaStudents.map((student) => (
                                        <div key={student.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all group">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 border-2 border-indigo-50 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center text-xl font-black group-hover:border-indigo-100 dark:group-hover:border-indigo-500">
                                                {student.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white">{student.name}</div>
                                                <div className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                                                    حفظ: {student.juzCount} أجزاء
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="text-4xl mb-3 opacity-30">🎓</div>
                                    <h3 className="text-slate-400 dark:text-slate-500 font-bold">لا يوجد طلاب في هذه الحلقة</h3>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
