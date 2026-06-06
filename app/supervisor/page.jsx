'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Always-needed components (critical path)
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import LoadingScreen from '../components/LoadingScreen';
import ResetPasswordModal from '../components/ResetPasswordModal';

// Lazy-loaded heavy components
const SupervisorStats = dynamic(() => import('../components/SupervisorStats'), { ssr: false });
const SendNotification = dynamic(() => import('../components/SendNotification'), { ssr: false });
const ManageEvents = dynamic(() => import('../components/ManageEvents'), { ssr: false });
const ManageHolidaysModal = dynamic(() => import('../components/ManageHolidaysModal'), { ssr: false });
const AddStudentModal = dynamic(() => import('../components/AddStudentModal'), { ssr: false });
const DevStats = dynamic(() => import('../components/DevStats'), { ssr: false });

// Extracted supervisor sub-components (lazy)
const DistributionChart = dynamic(() => import('./components/DistributionChart'), { ssr: false });
const FinancialSection = dynamic(() => import('./components/FinancialSection'), { ssr: false });
const TeachersSection = dynamic(() => import('./components/TeachersSection'), { ssr: false });
const HalaqasSection = dynamic(() => import('./components/HalaqasSection'), { ssr: false });
const TeacherModal = dynamic(() => import('./components/TeacherModal'), { ssr: false });
const HalaqaModal = dynamic(() => import('./components/HalaqaModal'), { ssr: false });
const StudentsModal = dynamic(() => import('./components/StudentsModal'), { ssr: false });
const ReportTypeModal = dynamic(() => import('./components/ReportTypeModal'), { ssr: false });
const HalaqaSettingsModal = dynamic(() => import('./components/HalaqaSettingsModal'), { ssr: false });
const SyncModal = dynamic(() => import('./components/SyncModal'), { ssr: false });

import { useTheme } from '../components/ThemeProvider';

// --- Helper functions (stable, defined outside component) ---
const getFirstName = (fullName) => {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/)[0];
};

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

// ─────────────────────────────────────────────────
export default function SupervisorDashboard() {
    const router = useRouter();
    const { mounted } = useTheme();

    // ── Auth & top-level ──────────────────────────
    const [user, setUser] = useState(null);
    const [activeView, setActiveView] = useState('overview');
    const [isQuranicDay, setIsQuranicDay] = useState(false);

    // ── Data ──────────────────────────────────────
    const [teachers, setTeachers] = useState([]);
    const [halaqas, setHalaqas] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [isResetting, setIsResetting] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // ── Teacher CRUD ──────────────────────────────
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [isEditingTeacher, setIsEditingTeacher] = useState(false);
    const [editTeacherId, setEditTeacherId] = useState(null);
    const [newTeacher, setNewTeacher] = useState({ name: '', username: '', password: '' });

    // ── Halaqa CRUD ───────────────────────────────
    const [showHalaqaModal, setShowHalaqaModal] = useState(false);
    const [isEditingHalaqa, setIsEditingHalaqa] = useState(false);
    const [editHalaqaId, setEditHalaqaId] = useState(null);
    const [newHalaqa, setNewHalaqa] = useState({ name: 'حلقة: ', teacherId: '', assistantTeacherIds: [], logo: null });
    const [searchTeacherInHalaqa, setSearchTeacherInHalaqa] = useState('');
    const [searchAssistantInHalaqa, setSearchAssistantInHalaqa] = useState('');

    // ── Search/Sort ───────────────────────────────
    const [searchTeacher, setSearchTeacher] = useState('');
    const [searchHalaqa, setSearchHalaqa] = useState('');
    const [teacherSort, setTeacherSort] = useState('assigned');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [hoveredHalaqaId, setHoveredHalaqaId] = useState(null);

    // ── Students Modal ────────────────────────────
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [selectedHalaqaStudents, setSelectedHalaqaStudents] = useState([]);
    const [selectedHalaqaName, setSelectedHalaqaName] = useState('');
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [searchStudentInModal, setSearchStudentInModal] = useState('');
    const [showEditStudentModal, setShowEditStudentModal] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState(null);
    const [currentHalaqaIdForStudent, setCurrentHalaqaIdForStudent] = useState(null);

    // ── Modals ────────────────────────────────────
    const [showReportTypeModal, setShowReportTypeModal] = useState(false);
    const [selectedHalaqaForReport, setSelectedHalaqaForReport] = useState(null);
    const [showHalaqaSettingsModal, setShowHalaqaSettingsModal] = useState(false);
    const [selectedHalaqaForSettings, setSelectedHalaqaForSettings] = useState(null);
    const [showHolidayModal, setShowHolidayModal] = useState(false);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [syncOptions, setSyncOptions] = useState({
        syncNames: true, syncNationalIds: true, syncPhones: true, syncHalaqas: true, addNewStudents: true
    });
    const [resetModalConfig, setResetModalConfig] = useState({ isOpen: false, targetId: null, targetName: '', role: '' });

    // ── Effects ───────────────────────────────────
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { router.push('/login'); return; }
        const userObj = JSON.parse(storedUser);
        if (userObj.role !== 'SUPERVISOR') { router.push('/login'); return; }
        setUser(userObj);
        fetchAllData();
        checkQuranicDay();
    }, []);

    useEffect(() => {
        if (loading) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
        }, { threshold: 0.1 });
        const timeoutId = setTimeout(() => {
            document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        }, 100);
        return () => { observer.disconnect(); clearTimeout(timeoutId); };
    }, [loading, activeView]);

    // ── Data Fetching ─────────────────────────────
    const fetchAllData = useCallback(async () => {
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
    }, []);

    const checkQuranicDay = async () => {
        try {
            const res = await fetch('/api/quranic-days/stats');
            if (res.ok) setIsQuranicDay(true);
        } catch (e) {}
    };

    // ── Teacher Handlers ──────────────────────────
    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = '/api/teachers';
            const method = isEditingTeacher ? 'PUT' : 'POST';
            const body = isEditingTeacher ? { ...newTeacher, id: editTeacherId } : newTeacher;
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
        } catch { toast.error('حدث خطأ ما'); } finally { setSubmitting(false); }
    };

    const openEditTeacherModal = useCallback((teacher) => {
        setNewTeacher({ name: teacher.name, username: teacher.username, password: teacher.password || '' });
        setIsEditingTeacher(true);
        setEditTeacherId(teacher.id);
        setShowTeacherModal(true);
    }, []);

    const handleDeleteTeacher = useCallback((id, name) => {
        toast((t) => (
            <div className="premium-glass p-6 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 min-w-[300px]">
                <div className="font-bold text-slate-800 dark:text-white text-lg">
                    هل أنت متأكد من حذف المعلم "{name}"؟
                    <div className="text-sm text-red-500 mt-2 font-medium">سيتم حذفه نهائياً من النظام.</div>
                </div>
                <div className="flex gap-3 mt-2">
                    <button onClick={() => { toast.dismiss(t.id); performDeleteTeacher(id); }} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">نعم، حذف</button>
                    <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    }, []);

    const performDeleteTeacher = async (id) => {
        setDeletingId(`teacher-${id}`);
        try {
            const res = await fetch(`/api/teachers?id=${id}`, { method: 'DELETE' });
            if (res.ok) { toast.success('تم حذف المعلم بنجاح'); fetchAllData(); }
            else toast.error('لم يتم الحذف (قد يكون مرتبطاً بحلقات)');
        } catch { toast.error('حدث خطأ أثناء الحذف'); } finally { setDeletingId(null); }
    };

    // ── Halaqa Handlers ───────────────────────────
    const handleCreateHalaqa = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = '/api/halaqas';
            const method = isEditingHalaqa ? 'PUT' : 'POST';
            const body = isEditingHalaqa ? { ...newHalaqa, id: editHalaqaId } : newHalaqa;
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (res.ok) {
                toast.success(isEditingHalaqa ? 'تم تعديل الحلقة بنجاح' : 'تم إنشاء الحلقة بنجاح');
                setShowHalaqaModal(false);
                setNewHalaqa({ name: 'حلقة: ', teacherId: '', assistantTeacherIds: [], logo: null });
                setIsEditingHalaqa(false); setEditHalaqaId(null);
                fetchAllData();
            } else {
                const data = await res.json();
                toast.error(data.error || 'خطأ في العملية');
            }
        } catch { toast.error('حدث خطأ ما'); } finally { setSubmitting(false); }
    };

    const openEditHalaqaModal = useCallback((halaqa) => {
        setNewHalaqa({
            name: halaqa.name,
            teacherId: halaqa.teacherId ? halaqa.teacherId.toString() : '',
            assistantTeacherIds: halaqa.assistants ? halaqa.assistants.map(a => a.id.toString()) : [],
            logo: halaqa.logo || null
        });
        setIsEditingHalaqa(true);
        setEditHalaqaId(halaqa.id);
        setShowHalaqaModal(true);
    }, []);

    const handleDeleteHalaqa = useCallback((id, name) => {
        toast((t) => (
            <div className="premium-glass p-6 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 min-w-[300px]">
                <div className="font-bold text-slate-800 dark:text-white text-lg">
                    هل أنت متأكد من حذف حلقة "{name}"؟
                    <div className="text-sm text-red-500 mt-2 font-medium">سيتم إلغاء ربط الطلاب بالحلقة ولكن لن يتم حذفهم.</div>
                </div>
                <div className="flex gap-3 mt-2">
                    <button onClick={() => { toast.dismiss(t.id); performDeleteHalaqa(id); }} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">نعم، حذف</button>
                    <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    }, []);

    const performDeleteHalaqa = async (id) => {
        setDeletingId(`halaqa-${id}`);
        try {
            const res = await fetch(`/api/halaqas?id=${id}`, { method: 'DELETE' });
            if (res.ok) { toast.success('تم حذف الحلقة بنجاح'); fetchAllData(); }
            else toast.error('حدث خطأ أثناء الحذف');
        } catch { toast.error('حدث خطأ أثناء الحذف'); } finally { setDeletingId(null); }
    };

    // ── Students Handlers ─────────────────────────
    const handleViewStudents = async (halaqa) => {
        setSelectedHalaqaName(halaqa.name);
        setShowStudentsModal(true);
        setLoadingStudents(true);
        setSelectedHalaqaStudents([]);
        try {
            const res = await fetch(`/api/students?halaqaId=${halaqa.id}`);
            if (res.ok) setSelectedHalaqaStudents(await res.json());
            else toast.error('فشل في جلب الطلاب');
        } catch { toast.error('خطأ في الاتصال'); } finally { setLoadingStudents(false); }
    };

    const handleEditStudent = useCallback((student) => {
        setStudentToEdit(student);
        setCurrentHalaqaIdForStudent(student.halaqaId);
        setShowEditStudentModal(true);
    }, []);

    const handleToggleFee = async (studentId, fieldKey, currentStatus) => {
        const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
        setTogglingId(`${studentId}-${fieldKey}`);
        try {
            const response = await fetch('/api/students', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: studentId, [fieldKey]: newStatus })
            });
            if (response.ok) {
                setSelectedHalaqaStudents(prev => prev.map(s => s.id === studentId ? { ...s, [fieldKey]: newStatus } : s));
                setStudents(prev => prev.map(s => s.id === studentId ? { ...s, [fieldKey]: newStatus } : s));
                toast.success('تم تحديث حالة الرسوم');
            } else toast.error('فشل تحديث الرسوم');
        } catch { toast.error('خطأ في الاتصال'); } finally { setTogglingId(null); }
    };

    const handleDeleteStudent = useCallback((id, name) => {
        toast((t) => (
            <div className="premium-glass p-6 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 min-w-[300px]" style={{ direction: 'rtl' }}>
                <div className="font-bold text-slate-800 dark:text-white text-lg text-right">
                    هل أنت متأكد من حذف الطالب "{name}"؟
                    <div className="text-sm text-red-500 mt-2 font-medium text-right">سيتم حذفه نهائياً مع كافة سجلاته ونقاطه وحضوره من النظام.</div>
                </div>
                <div className="flex gap-3 mt-2">
                    <button onClick={() => { toast.dismiss(t.id); performDeleteStudent(id); }} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">نعم، حذف</button>
                    <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    }, []);

    const performDeleteStudent = async (id) => {
        setDeletingId(`student-${id}`);
        try {
            const res = await fetch(`/api/students?id=${id}`, { method: 'DELETE' });
            if (res.ok) { toast.success('تم حذف الطالب بنجاح'); fetchAllData(); setSelectedHalaqaStudents(prev => prev.filter(s => s.id !== id)); }
            else toast.error('حدث خطأ أثناء الحذف');
        } catch { toast.error('حدث خطأ أثناء الحذف'); } finally { setDeletingId(null); }
    };

    // ── Points Handlers ───────────────────────────
    const handleTogglePoints = async (halaqaId, currentStatus) => {
        setTogglingId(`points-${halaqaId}`);
        try {
            const res = await fetch('/api/halaqas', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: halaqaId, pointsEnabled: !currentStatus })
            });
            if (res.ok) {
                setHalaqas(prev => prev.map(h => h.id === halaqaId ? { ...h, pointsEnabled: !currentStatus } : h));
                setSelectedHalaqaForSettings(prev => prev ? { ...prev, pointsEnabled: !currentStatus } : null);
                toast.success(!currentStatus ? 'تم تفعيل النشاط للحلقة' : 'تم إيقاف النشاط للحلقة', { icon: !currentStatus ? '✅' : '🛑' });
            } else { const d = await res.json(); toast.error(d.error || 'فشل في تحديث حالة النشاط'); }
        } catch { toast.error('حدث خطأ في الاتصال'); } finally { setTogglingId(null); }
    };

    const handleResetHalaqaPoints = useCallback((halaqaId) => {
        toast((t) => (
            <div className="premium-glass p-6 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 min-w-[300px]">
                <div className="font-bold text-slate-800 dark:text-white text-lg">
                    هل أنت متأكد من تصفير نقاط حلقة "{selectedHalaqaForSettings?.name.replace('حلقة: ', '')}"؟
                    <div className="text-sm text-red-500 mt-2 font-medium">سيتم حذف جميع النقاط المسجلة لطلاب هذه الحلقة نهائياً!</div>
                </div>
                <div className="flex gap-3 mt-2">
                    <button onClick={async () => {
                        toast.dismiss(t.id); setIsResetting(true);
                        try {
                            const res = await fetch(`/api/points?halaqaId=${halaqaId}`, { method: 'DELETE' });
                            if (res.ok) { const d = await res.json(); toast.success(`تم تصفير النقاط بنجاح (حذف ${d.count} نقطة)`); fetchAllData(); }
                            else toast.error('فشل تصفير النقاط');
                        } catch { toast.error('خطأ في الاتصال'); } finally { setIsResetting(false); }
                    }} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">نعم، تصفير النقاط</button>
                    <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold">إلغاء</button>
                </div>
            </div>
        ), { duration: 8000, position: 'top-center' });
    }, [selectedHalaqaForSettings, fetchAllData]);

    // ── Sync Handler ──────────────────────────────
    const handleSyncSheets = async () => {
        setShowSyncModal(false);
        setSyncing(true);
        const toastId = toast.loading('جاري مزامنة بيانات الطلاب من Google Sheets...', { style: { borderRadius: '16px', fontFamily: 'Noto Sans Arabic', fontWeight: 'bold' } });
        try {
            const res = await fetch('/api/sheets/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(syncOptions) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل الاتصال بجوجل');
            setSyncing(false);
            toast.success(data.message || 'تمت المزامنة بنجاح!', { id: toastId, duration: 7000, style: { borderRadius: '16px', fontFamily: 'Noto Sans Arabic', fontWeight: 'bold' } });
            fetchAllData();
        } catch (err) {
            setSyncing(false);
            const errorMessage = err.message || 'حدث خطأ غير متوقع أثناء المزامنة';
            toast.dismiss(toastId);
            toast.error((t) => (
                <div className="flex flex-col gap-2 w-full text-slate-800 dark:text-slate-100 text-right" style={{ direction: 'rtl', minWidth: '280px', maxWidth: '380px' }}>
                    <div className="flex items-center justify-between gap-4">
                        <span className="font-bold text-sm">حدث خطأ أثناء المزامنة:</span>
                        <button onClick={() => { navigator.clipboard.writeText(errorMessage); toast.success('تم نسخ نص الخطأ!', { id: 'copy-success-toast' }); }} className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1 active:scale-95 shrink-0">نسخ</button>
                    </div>
                    <div className="text-xs font-mono bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed overflow-x-auto whitespace-pre-wrap break-all max-h-36 overflow-y-auto" style={{ wordBreak: 'break-all', textAlign: 'left' }}>{errorMessage}</div>
                </div>
            ), { duration: 12000, style: { minWidth: '320px', maxWidth: '420px', borderRadius: '16px', fontFamily: 'Noto Sans Arabic' } });
        }
    };

    // ── Logo Upload ───────────────────────────────
    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setNewHalaqa(prev => ({ ...prev, logo: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    // ── Memoised counts ───────────────────────────
    const supervisorName = useMemo(() => user ? `أهلًا ${getFirstName(user.name)}` : 'أهلًا', [user]);

    if (!mounted) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-noto rtl transition-colors duration-300 relative overflow-hidden" dir="rtl">
            {/* Ambient background blobs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="hidden md:block absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="hidden md:block absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-500/5 dark:bg-blue-500/[0.02] rounded-full blur-[150px]"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05]"></div>
            </div>

            <Navbar userType="supervisor" userName={supervisorName} onLogout={() => router.push('/login')} displayId={user?.displayId} />

            <main className="max-w-7xl mx-auto px-4 pt-28 pb-12 md:px-6 lg:px-8">
                {/* Header */}
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
                                <svg className="w-5 h-5 group-hover/qbtn:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                الأيام القرآنية
                            </span>
                        </button>
                        <button onClick={() => { setIsEditingTeacher(false); setEditTeacherId(null); setNewTeacher({ name: '', username: '', password: '' }); setShowTeacherModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                            إضافة معلم
                        </button>
                        <button onClick={() => { setIsEditingHalaqa(false); setEditHalaqaId(null); setNewHalaqa({ name: 'حلقة: ', teacherId: '', assistantTeacherIds: [] }); setShowHalaqaModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all active:scale-95">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            إنشاء حلقة
                        </button>
                        <button onClick={() => setShowHolidayModal(true)} className="flex items-center gap-2 px-6 py-3 bg-rose-50 dark:bg-rose-900/30 border-2 border-rose-100 dark:border-rose-800 rounded-2xl font-bold text-rose-600 dark:text-rose-400 hover:border-rose-400 hover:text-rose-700 transition-all shadow-sm active:scale-95">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            إدارة الإجازات
                        </button>
                        {user && <SendNotification senderRole="SUPERVISOR" senderId={user.id} students={students} teachers={teachers} />}
                        <button onClick={() => setShowSyncModal(true)} disabled={syncing} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-2xl font-bold shadow-lg shadow-amber-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50">
                            <svg className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                            <span>مزامنة Google Sheets</span>
                        </button>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-[2.5rem] mb-10 max-w-2xl mx-auto border border-white/20 dark:border-slate-800 backdrop-blur-md relative z-20">
                    <button onClick={() => setActiveView('overview')} className={`flex-1 py-4 px-6 rounded-[2rem] font-black text-sm transition-all flex items-center justify-center gap-3 ${activeView === 'overview' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xl scale-[1.02] z-10' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                        <span>🏠</span>الإدارة العامة
                    </button>
                    <button onClick={() => setActiveView('stats')} className={`flex-1 py-4 px-6 rounded-[2rem] font-black text-sm transition-all flex items-center justify-center gap-3 ${activeView === 'stats' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xl scale-[1.02] z-10' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                        <span>📊</span>إحصائيات شاملة
                    </button>
                </div>

                {activeView === 'stats' ? (
                    <SupervisorStats />
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 ${loading ? '' : 'reveal reveal-delay-1'}`}>
                            {loading ? (
                                <>
                                    <div className="h-32 bg-slate-200 dark:bg-slate-900 rounded-[2rem] animate-pulse"></div>
                                    <div className="h-32 bg-slate-200 dark:bg-slate-900 rounded-[2rem] animate-pulse"></div>
                                    <div className="h-32 bg-slate-200 dark:bg-slate-900 rounded-[2rem] animate-pulse"></div>
                                    <div className="h-32 bg-slate-200 dark:bg-slate-900 rounded-[2rem] animate-pulse"></div>
                                </>
                            ) : (
                                <>
                                    <StatsCard label="فئة المستخدم" value={user?.role === 'SUPERVISOR' ? 'مشرف عام' : 'معلم'} icon="🛡️" color="from-slate-700 to-slate-900" trend="صلاحيات كاملة" />
                                    <StatsCard label="إجمالي الطلاب" value={students.length} icon="👥" color="from-orange-400 to-amber-600" trend={getArabicCount(students.length, 'طالب واحد مسجل', 'طالبان مسجلان', 'طلاب مسجلين', 'طالباً مسجلاً')} />
                                    <StatsCard label="عدد المعلمين" value={teachers.length} icon="👨‍🏫" color="from-emerald-400 to-teal-600" trend={getArabicCount(teachers.filter(t => (t._count?.teacherHalaqas || 0) > 0).length, 'معلم واحد لديه حلقة', 'معلمان لديهما حلقات', 'معلمين لديهم حلقات', 'معلماً لديهم حلقات')} />
                                    <StatsCard label="إجمالي الحلقات" value={halaqas.length} icon="🕌" color="from-blue-500 to-indigo-600" trend="نشطة" />
                                </>
                            )}
                        </div>

                        {/* Distribution Chart */}
                        <DistributionChart
                            loading={loading}
                            students={students}
                            halaqas={halaqas}
                            hoveredHalaqaId={hoveredHalaqaId}
                            setHoveredHalaqaId={setHoveredHalaqaId}
                        />

                        {/* Financial Section */}
                        <FinancialSection loading={loading} students={students} />

                        {/* Teachers & Halaqas */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <TeachersSection
                                loading={loading}
                                teachers={teachers}
                                halaqas={halaqas}
                                searchTeacher={searchTeacher}
                                setSearchTeacher={setSearchTeacher}
                                teacherSort={teacherSort}
                                setTeacherSort={setTeacherSort}
                                isSortDropdownOpen={isSortDropdownOpen}
                                setIsSortDropdownOpen={setIsSortDropdownOpen}
                                getArabicCount={getArabicCount}
                                normalizeText={normalizeText}
                                onEditTeacher={openEditTeacherModal}
                                onDeleteTeacher={handleDeleteTeacher}
                                onResetPassword={(id, name, role) => setResetModalConfig({ isOpen: true, targetId: id, targetName: name, role })}
                                deletingId={deletingId}
                            />
                            <HalaqasSection
                                loading={loading}
                                halaqas={halaqas}
                                students={students}
                                searchHalaqa={searchHalaqa}
                                setSearchHalaqa={setSearchHalaqa}
                                getArabicCount={getArabicCount}
                                normalizeText={normalizeText}
                                togglingId={togglingId}
                                deletingId={deletingId}
                                onEditHalaqa={openEditHalaqaModal}
                                onDeleteHalaqa={handleDeleteHalaqa}
                                onViewStudents={handleViewStudents}
                                onOpenSettings={(h) => { setSelectedHalaqaForSettings(h); setShowHalaqaSettingsModal(true); }}
                                onOpenReport={(h) => { setSelectedHalaqaForReport(h); setShowReportTypeModal(true); }}
                            />
                        </div>

                        <ManageEvents teachers={teachers} students={students} />
                    </>
                )}
            </main>

            {/* ── Modals ── */}
            <ResetPasswordModal
                isOpen={resetModalConfig.isOpen}
                onClose={() => setResetModalConfig({ ...resetModalConfig, isOpen: false })}
                targetId={resetModalConfig.targetId}
                targetName={resetModalConfig.targetName}
                role={resetModalConfig.role}
            />

            <TeacherModal
                show={showTeacherModal}
                onClose={() => { setShowTeacherModal(false); setIsEditingTeacher(false); }}
                onSubmit={handleCreateTeacher}
                submitting={submitting}
                isEditing={isEditingTeacher}
                teacher={newTeacher}
                setTeacher={setNewTeacher}
            />

            <HalaqaModal
                show={showHalaqaModal}
                onClose={() => { setShowHalaqaModal(false); setIsEditingHalaqa(false); setEditHalaqaId(null); setNewHalaqa({ name: 'حلقة: ', teacherId: '', assistantTeacherIds: [], logo: null }); }}
                onSubmit={handleCreateHalaqa}
                submitting={submitting}
                isEditing={isEditingHalaqa}
                halaqa={newHalaqa}
                setHalaqa={setNewHalaqa}
                teachers={teachers}
                halaqas={halaqas}
                editHalaqaId={editHalaqaId}
                normalizeText={normalizeText}
                searchTeacherInHalaqa={searchTeacherInHalaqa}
                setSearchTeacherInHalaqa={setSearchTeacherInHalaqa}
                searchAssistantInHalaqa={searchAssistantInHalaqa}
                setSearchAssistantInHalaqa={setSearchAssistantInHalaqa}
                onLogoUpload={handleLogoUpload}
            />

            <StudentsModal
                show={showStudentsModal}
                onClose={() => { setShowStudentsModal(false); setSearchStudentInModal(''); }}
                selectedHalaqaName={selectedHalaqaName}
                selectedHalaqaStudents={selectedHalaqaStudents}
                loadingStudents={loadingStudents}
                searchStudentInModal={searchStudentInModal}
                setSearchStudentInModal={setSearchStudentInModal}
                togglingId={togglingId}
                deletingId={deletingId}
                onToggleFee={handleToggleFee}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                onResetPassword={(id, name, role) => setResetModalConfig({ isOpen: true, targetId: id, targetName: name, role })}
            />

            <ReportTypeModal
                show={showReportTypeModal}
                onClose={() => setShowReportTypeModal(false)}
                selectedHalaqa={selectedHalaqaForReport}
            />

            <HalaqaSettingsModal
                show={showHalaqaSettingsModal}
                onClose={() => setShowHalaqaSettingsModal(false)}
                selectedHalaqa={selectedHalaqaForSettings}
                togglingId={togglingId}
                isResetting={isResetting}
                onTogglePoints={handleTogglePoints}
                onResetPoints={handleResetHalaqaPoints}
            />

            <SyncModal
                show={showSyncModal}
                onClose={() => setShowSyncModal(false)}
                onSync={handleSyncSheets}
                syncOptions={syncOptions}
                setSyncOptions={setSyncOptions}
            />

            {showEditStudentModal && (
                <AddStudentModal
                    isOpen={showEditStudentModal}
                    onClose={() => setShowEditStudentModal(false)}
                    onAdd={() => {
                        setShowEditStudentModal(false);
                        fetchAllData();
                        if (selectedHalaqaForReport) handleViewStudents(selectedHalaqaForReport);
                    }}
                    student={studentToEdit}
                    halaqaId={currentHalaqaIdForStudent}
                />
            )}

            <ManageHolidaysModal isOpen={showHolidayModal} onClose={() => setShowHolidayModal(false)} halaqas={halaqas} />
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
        </div>
    );
}
