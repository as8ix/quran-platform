'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import Card from '../components/Card';
import { formatHijri } from '../utils/dateUtils';
import SendNotification from '../components/SendNotification';


export default function SupervisorDashboard() {
    const router = useRouter();
    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.trim().split(/\s+/)[0];
    };

    const supervisorName = user ? `أهلًا بالمشرف ${getFirstName(user.name)} 👋` : 'أهلًا بالمشرف 👋';

    // Data State
    const [teachers, setTeachers] = useState([]);
    const [halaqas, setHalaqas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [showHalaqaModal, setShowHalaqaModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [newTeacher, setNewTeacher] = useState({ name: '', username: '', password: '' });

    const [newHalaqa, setNewHalaqa] = useState({ name: '', teacherId: '', assistantTeacherIds: [] });
    const [isEditingHalaqa, setIsEditingHalaqa] = useState(false);
    const [editHalaqaId, setEditHalaqaId] = useState(null);

    // View Students State
    const [students, setStudents] = useState([]); // All students for stats
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [selectedHalaqaStudents, setSelectedHalaqaStudents] = useState([]);
    const [selectedHalaqaName, setSelectedHalaqaName] = useState('');
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [deletingId, setDeletingId] = useState(null); // ID of item being deleted (teacher or halaqa)

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [teachersRes, halaqasRes, studentsRes] = await Promise.all([
                fetch('/api/teachers'),
                fetch('/api/halaqas'),
                fetch('/api/students')
            ]);

            if (teachersRes.ok) setTeachers(await teachersRes.json());
            if (halaqasRes.ok) setHalaqas(await halaqasRes.json());
            if (studentsRes.ok) setStudents(await studentsRes.json());
        } catch (error) {
            console.error(error);
            toast.error('خطأ في جلب البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/teachers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTeacher)
            });

            if (res.ok) {
                toast.success('تم إضافة المعلم بنجاح');
                setShowTeacherModal(false);
                setNewTeacher({ name: '', username: '', password: '' });
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || 'خطأ في الإضافة');
            }
        } catch (error) {
            toast.error('حدث خطأ ما');
        } finally {
            setSubmitting(false);
        }
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

    const fetchHalaqaStudentCount = async (halaqaId) => {
        try {
            const res = await fetch(`/api/students?halaqaId=${halaqaId}`);
            if (res.ok) {
                const data = await res.json();
                return data.length;
            }
        } catch (e) { console.error(e); }
        return 0;
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
    const totalStudents = students.filter(s => s.halaqaId !== null).length; // Only count students assigned to halaqas
    const activeTeachers = teachers.filter(t => (t._count?.teacherHalaqas || 0) + (t._count?.assistantHalaqas || 0) > 0).length;

    const stats = [
        { label: 'إجمالي الحلقات', value: halaqas.length, trend: 'نشطة', icon: '🕌', color: 'from-blue-500 to-blue-600' },
        { label: 'عدد المعلمين', value: teachers.length, trend: `${activeTeachers} لديهم حلقات`, icon: '👨‍🏫', color: 'from-green-500 to-green-600' },
        { label: 'إجمالي الطلاب', value: totalStudents, trend: 'طالب مسجل', icon: '🎯', color: 'from-orange-500 to-orange-600' },
        { label: 'فئة المستخدم', value: user?.role === 'SUPERVISOR' ? 'مشرف عام' : 'مستخدم', trend: 'صلاحيات كاملة', icon: '⚡', color: 'from-teal-500 to-cyan-500' },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-noto rtl" dir="rtl">
            <Navbar userType="supervisor" userName={supervisorName} onLogout={() => router.push('/')} />

            <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                            مرحباً <span className="text-emerald-600">{user ? getFirstName(user.name) : 'المشرف'}</span> 👋
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">إدارة المعلمين والحلقات ومتابعة الإنجاز العام</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowTeacherModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
                        >
                            <span>➕</span>
                            إضافة معلم
                        </button>
                        <button
                            onClick={() => setShowHalaqaModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                        >
                            <span>🕌</span>
                            إنشاء حلقة
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {stats.map((stat, index) => (
                        <StatsCard key={index} {...stat} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Teachers Section */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                <span className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">👨‍🏫</span>
                                قائمة المعلمين
                            </h2>
                            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                                {teachers.length} معلم
                            </span>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pl-2 custom-scrollbar flex-1">
                            {teachers.length > 0 ? teachers.map((teacher) => (
                                <div key={teacher.id} className="group p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-emerald-50 hover:border-emerald-100 transition-all duration-300">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-700 shadow-sm group-hover:border-emerald-200 group-hover:text-emerald-600 transition-colors">
                                                {teacher.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg text-slate-800 group-hover:text-emerald-700 transition-colors">{teacher.name}</div>
                                                <div className="text-xs text-slate-400 font-bold flex items-center gap-1">
                                                    <span>@{teacher.username}</span>
                                                    <span>•</span>
                                                    <span>منذ {formatHijri(teacher.createdAt, 'long')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-xl text-sm font-bold">
                                                {(teacher._count?.teacherHalaqas || 0) + (teacher._count?.assistantHalaqas || 0)} حلقات
                                            </span>
                                            <button
                                                onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                                                disabled={deletingId === `teacher-${teacher.id}`}
                                                className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-all font-bold text-xs"
                                                title="حذف المعلم"
                                            >
                                                {deletingId === `teacher-${teacher.id}` ? '...' : '🗑️ حذف'}
                                            </button>
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
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">🕌</span>
                                الحلقات النشطة
                            </h2>
                            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                {halaqas.length} حلقة
                            </span>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pl-2 custom-scrollbar flex-1">
                            {halaqas.length > 0 ? halaqas.map((halaqa) => (
                                <div key={halaqa.id} className="group p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-indigo-50 hover:border-indigo-100 transition-all duration-300">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-200">
                                                🕌
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg text-slate-800">{halaqa.name}</div>
                                                <div className="text-xs text-slate-400 font-bold flex items-center gap-1">
                                                    <span>المعلم:</span>
                                                    <span className="text-indigo-600">{halaqa.teacher?.name || 'غير معين'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {halaqa._count?.assistants > 0 && (
                                                <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-xl text-xs font-bold flex items-center gap-1">
                                                    <span>👥</span>
                                                    {halaqa._count.assistants} مساعدين
                                                </span>
                                            )}
                                            <span className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-xl text-sm font-bold">
                                                {students.filter(s => s.halaqaId === halaqa.id).length} طالب
                                            </span>
                                            <button
                                                onClick={() => openEditHalaqaModal(halaqa)}
                                                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 duration-300 delay-75"
                                            >
                                                ✏️ تعديل
                                            </button>
                                            <button
                                                onClick={() => handleDeleteHalaqa(halaqa.id, halaqa.name)}
                                                disabled={deletingId === `halaqa-${halaqa.id}`}
                                                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 duration-300 delay-100"
                                            >
                                                {deletingId === `halaqa-${halaqa.id}` ? '...' : '🗑️ حذف'}
                                            </button>
                                            <button
                                                onClick={() => handleViewStudents(halaqa)}
                                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 duration-300"
                                            >
                                                عرض الطلاب ←
                                            </button>
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
            </div>

            {/* Modals */}
            {showTeacherModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative animate-fadeIn">
                        <h3 className="text-2xl font-black text-slate-800 mb-6">إضافة معلم جديد</h3>
                        <form onSubmit={handleCreateTeacher} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">الاسم الثلاثي</label>
                                <input
                                    type="text"
                                    required
                                    value={newTeacher.name}
                                    onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none transition-all font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">اسم المستخدم</label>
                                <input
                                    type="text"
                                    required
                                    value={newTeacher.username}
                                    onChange={e => setNewTeacher({ ...newTeacher, username: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none transition-all font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">كلمة المرور</label>
                                <input
                                    type="password"
                                    required
                                    value={newTeacher.password}
                                    onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none transition-all font-bold"
                                />
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button type="button" onClick={() => setShowTeacherModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">إلغاء</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50">
                                    {submitting ? 'جاري الإضافة...' : 'إضافة المعلم'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showHalaqaModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative animate-fadeIn">
                        <h3 className="text-2xl font-black text-slate-800 mb-6">إنشاء حلقة جديدة</h3>
                        <form onSubmit={handleCreateHalaqa} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">اسم الحلقة</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="مثال: حلقة أبو بكر الصديق"
                                    value={newHalaqa.name}
                                    onChange={e => setNewHalaqa({ ...newHalaqa, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">المعلم المسؤول (المشرف الأساسي)</label>
                                <select
                                    required
                                    value={newHalaqa.teacherId}
                                    onChange={e => setNewHalaqa({ ...newHalaqa, teacherId: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold"
                                >
                                    <option value="">اختر المعلم المسؤول...</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">المعلمين المساعدين (اختياري)</label>
                                <div className="p-3 bg-slate-50 border-2 border-slate-100 rounded-xl max-h-40 overflow-y-auto custom-scrollbar">
                                    {teachers.filter(t => t.id !== parseInt(newHalaqa.teacherId)).length > 0 ? (
                                        teachers.filter(t => t.id !== parseInt(newHalaqa.teacherId)).map(t => (
                                            <label key={t.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
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
                                                    className="w-5 h-5 rounded-md border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="font-bold text-slate-700">{t.name}</span>
                                            </label>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 text-sm text-center py-2">لا يوجد معلمين آخرين للإختيار</p>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-bold">يمكنك اختيار أكثر من معلم مساعد</p>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button type="button" onClick={() => setShowHalaqaModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">إلغاء</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                                    {submitting ? 'جاري الإنشاء...' : 'إنشاء الحلقة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Students List Modal */}
            {showStudentsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl relative animate-fadeIn max-h-[800px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">طلاب {selectedHalaqaName}</h3>
                                <p className="text-slate-500 font-bold text-sm">قائمة الطلاب المسجلين في هذه الحلقة</p>
                            </div>
                            <button onClick={() => setShowStudentsModal(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all font-bold">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                            {loadingStudents ? (
                                <div className="py-20 flex flex-col items-center justify-center">
                                    <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                    <p className="mt-4 text-slate-400 font-bold text-sm">جاري جلب الطلاب...</p>
                                </div>
                            ) : selectedHalaqaStudents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedHalaqaStudents.map((student) => (
                                        <div key={student.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 hover:bg-white hover:shadow-md transition-all group">
                                            <div className="w-12 h-12 bg-white border-2 border-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl font-black group-hover:border-indigo-100">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{student.name}</div>
                                                <div className="text-xs text-slate-400 font-bold">
                                                    حفظ: {student.juzCount} أجزاء
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <div className="text-4xl mb-3 opacity-30">🎓</div>
                                    <h3 className="text-slate-400 font-bold">لا يوجد طلاب في هذه الحلقة</h3>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
