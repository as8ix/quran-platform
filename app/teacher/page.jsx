'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import AddStudentModal from '../components/AddStudentModal';
import SendNotification from '../components/SendNotification';
import ReportModal from '../components/ReportModal';
import { useTheme } from '../components/ThemeProvider';
import LoadingScreen from '../components/LoadingScreen';

const formatStudentName = (studentName, allStudents) => {
    if (!studentName) return '';
    const words = studentName.trim().split(/\s+/);
    if (words.length < 2) return studentName;

    const first = words[0];
    const last = words[words.length - 1];

    // Check if there is another student in the list who has the same first and last name
    const hasConflict = allStudents.some(s => {
        if (s.name === studentName) return false;
        const sWords = (s.name || '').trim().split(/\s+/);
        if (sWords.length < 2) return false;
        const sFirst = sWords[0];
        const sLast = sWords[sWords.length - 1];
        return sFirst === first && sLast === last;
    });

    if (hasConflict && words.length >= 3) {
        return `${first} ${words[1]} ${last}`;
    }

    return `${first} ${last}`;
};

const StudentCard = ({ student, router, displayName }) => (
    <div
        className="group premium-glass rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 cursor-pointer relative overflow-hidden border border-white/20 dark:border-slate-800/50"
        onClick={() => router.push(`/teacher/student/${student.id}`)}
    >
        {/* Glow Effects */}
        <div className="absolute -top-10 -right-10 w-24 h-24 sm:w-32 sm:h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 sm:w-32 sm:h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700"></div>

        <div className="flex items-start justify-between mb-4 sm:mb-6 relative z-10">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/40 dark:to-slate-900 text-emerald-600 dark:text-emerald-400 rounded-2xl sm:rounded-3xl flex items-center justify-center text-xl sm:text-3xl font-black shadow-inner group-hover:rotate-6 transition-transform">
                {student.name?.charAt(0)}
            </div>
            <div className="flex flex-col items-end gap-1.5 sm:gap-2">
                <div className="bg-white/50 dark:bg-slate-900/50 px-2.5 py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 border border-white/20 dark:border-slate-800">
                    ID: #{student.displayId || student.id}
                </div>
                {student.isEventGuest && (
                    <div className={`px-2.5 py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black border ${
                        student.isSpecificallyAssigned 
                        ? 'bg-amber-500/10 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 border-amber-500/20 dark:border-amber-800 animate-pulse'
                        : 'bg-indigo-500/10 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-800'
                    }`}>
                        🏆 {student.isSpecificallyAssigned ? 'ضيف: مسند' : 'متاح (عام)'}
                    </div>
                )}
            </div>
        </div>

        <h3 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white mb-0.5 sm:mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors relative z-10">
            {displayName || student.name}
        </h3>
        {student.halaqa && (
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5 sm:mb-2 flex items-center gap-1 relative z-10">
                <span>📍</span> {student.halaqa.name}
            </p>
        )}
        <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-sm mb-4 sm:mb-6 font-medium line-clamp-1 italic relative z-10">
            وصل إلى: <span className="text-emerald-600 dark:text-emerald-500 font-bold">{student.hifzProgress || 'بداية الحفظ'}</span>
        </p>

        <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-8 bg-white/30 dark:bg-slate-950/40 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/20 dark:border-slate-800/50 relative z-10">
            <div className="flex justify-between items-center text-[10px] sm:text-xs">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">إجمالي الحفظ</span>
                <span className="font-black text-slate-800 dark:text-white bg-white/50 dark:bg-slate-800/50 px-2 sm:py-1 rounded-lg border border-white/20 dark:border-slate-700 shadow-sm">{student.juzCount} أجزاء</span>
            </div>
            <div className="w-full h-2 sm:h-2.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-full overflow-hidden p-0.5 border border-white/10 dark:border-slate-700">
                <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(student.juzCount / 30) * 100}%` }}
                ></div>
            </div>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-black pt-2 border-t border-white/10 dark:border-slate-900/50 relative z-10">
            <span className="group-hover:translate-x-1 transition-transform inline-block">تسجيل التسميع</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/50 dark:bg-emerald-900/40 flex items-center justify-center text-lg sm:text-xl transform group-hover:rotate-45 transition-transform duration-300 shadow-sm">
                ←
            </div>
        </div>
    </div>
);

const StudentSkeleton = () => (
    <div className="premium-glass rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 relative overflow-hidden border border-white/20 dark:border-slate-800/50 animate-pulse">
        <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl sm:rounded-3xl"></div>
            <div className="w-16 h-6 bg-slate-100 dark:bg-slate-900 rounded-xl"></div>
        </div>
        <div className="h-7 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg mb-3"></div>
        <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-900 rounded-lg mb-4"></div>
        <div className="space-y-3 mb-8 bg-white/30 dark:bg-slate-950/40 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/20 dark:border-slate-800/50">
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full"></div>
        </div>
        <div className="h-8 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
    </div>
);

export default function TeacherDashboard() {
    const router = useRouter();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [juzFilter, setJuzFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);

    const [user, setUser] = useState(null);
    const [teacherHalaqas, setTeacherHalaqas] = useState([]);
    const [pointsEnabled, setPointsEnabled] = useState(false);

    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.trim().split(/\s+/)[0];
    };

    const teacherName = user ? `أهلًا ${getFirstName(user.name)} 👋` : 'أهلًا 👋';

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        const fetchTeacherData = async () => {
            if (!user) return;
            try {
                const halaqasRes = await fetch(`/api/halaqas?teacherId=${user.id}`);
                if (halaqasRes.ok) {
                    const myHalaqas = await halaqasRes.json();
                    setTeacherHalaqas(myHalaqas);
                    setPointsEnabled(myHalaqas.some(h => h.pointsEnabled));
                }
            } catch (error) {
                console.error("Error fetching teacher data:", error);
            }
        };
        fetchTeacherData();
    }, [user]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            let url = '/api/students';
            const params = new URLSearchParams();

            if (juzFilter !== 'all') {
                params.append('juzFilter', juzFilter);
            }

            if (user) {
                params.append('teacherId', user.id);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, { cache: 'no-store' });
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setStudents(data);
            } else {
                setStudents([]);
                toast.error(data?.error || 'حدث خطأ أثناء تحميل الطلاب');
            }
        } catch (error) {
            console.error("Error fetching students:", error);
            setStudents([]);
            toast.error('حدث خطأ في الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStudents();
        }
    }, [user, juzFilter]);

    const normalizeText = (text) => {
        if (!text) return '';
        let normalized = text.toLowerCase();
        // Replace Alef variants with plain Alef
        normalized = normalized.replace(/[أإآ]/g, 'ا');
        // Remove Tashkeel (diacritics)
        normalized = normalized.normalize("NFD").replace(/[\u064B-\u065F]/g, "");
        return normalized;
    };

    const filteredStudents = Array.isArray(students) ? students.filter(student =>
        normalizeText(student.name).includes(normalizeText(searchTerm))
    ) : [];

    const { isDarkMode, mounted } = useTheme();

    if (!mounted) return <LoadingScreen />;
    
    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-noto rtl transition-colors duration-300 relative overflow-hidden" dir="rtl">
            {/* Premium Edge Glows */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60 dark:opacity-80">
                <div className="premium-glow-emerald"></div>
                <div className="premium-glow-purple"></div>
            </div>

            <Navbar userType="teacher" userName={teacherName} onLogout={() => router.push('/login')} displayId={user?.displayId} />

            <main className="max-w-7xl mx-auto px-4 pt-28 pb-12 md:px-6 lg:px-8 relative z-10">
                {/* Hero / Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                            مرحباً بك، <span className="text-emerald-600 dark:text-emerald-500">يا {user ? getFirstName(user.name) : 'أستاذ'}!</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                            لديك {Array.isArray(students) ? students.filter(s => !s.isInActiveEvent).length : 0} طالب في حلقتك
                            {Array.isArray(students) && students.some(s => s.isInActiveEvent) && (
                                <span className="text-amber-600 dark:text-amber-500 font-black"> + {students.filter(s => s.isInActiveEvent).length} مشارك (اليوم القرآني)</span>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => router.push('/teacher/attendance')}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-100 dark:border-emerald-800 rounded-2xl font-bold text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 hover:text-emerald-700 transition-all shadow-sm active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            تحضير الطلاب
                        </button>
                        <button
                            onClick={() => router.push('/teacher/certificates')}
                            className="flex items-center gap-2 px-6 py-3 bg-sky-50 dark:bg-sky-900/30 border-2 border-sky-100 dark:border-sky-800 rounded-2xl font-bold text-sky-600 dark:text-sky-400 hover:border-sky-400 hover:text-sky-700 transition-all shadow-sm active:scale-95"
                        >
                            <span className="text-xl">📜</span>
                            شهادات خيركم
                        </button>
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-100 dark:border-indigo-800 rounded-2xl font-bold text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 hover:text-indigo-700 transition-all shadow-sm active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            التقارير
                        </button>
                        {pointsEnabled && (
                            <button
                                onClick={() => router.push('/teacher/points')}
                                className="flex items-center gap-2 px-6 py-3 bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-100 dark:border-amber-800 rounded-2xl font-bold text-amber-600 dark:text-amber-500 hover:border-amber-400 hover:text-amber-700 transition-all shadow-sm active:scale-95"
                            >
                                <span>🪙</span>
                                رصد النقاط
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (!teacherHalaqas.length && !user?.halaqaId) {
                                    toast.error('لم يتم العثور على حلقة مرتبطة بحسابك. يرجى التواصل مع المشرف.');
                                    return;
                                }
                                setShowAddModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            إضافة طالب
                        </button>
                        {user && (
                            <SendNotification
                                senderRole="TEACHER"
                                senderId={user.id}
                                students={Array.isArray(students) ? students : []}
                            />
                        )}
                    </div>
                </div>

                {/* Filters Section */}
                <div className="premium-glass p-6 sm:p-8 rounded-[3rem] shadow-xl border border-white/20 dark:border-slate-800/50 mb-10 transition-all relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/5 dark:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                        <div className="flex-1">
                            <label className="block text-sm font-black text-slate-500 dark:text-slate-400 mb-3 mr-1 uppercase tracking-[0.2em]">البحث عن اسم الطالب</label>
                            <div className="relative group/search">
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xl group-focus-within/search:text-emerald-500 transition-colors">🔍</span>
                                <input
                                    type="text"
                                    placeholder="ابحث باسم الطالب هنا..."
                                    className="w-full pr-14 pl-6 py-5 bg-white/50 dark:bg-slate-900/80 border-2 border-transparent focus:border-emerald-500/50 focus:bg-white dark:focus:bg-slate-950 rounded-3xl shadow-inner transition-all outline-none font-bold dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 lg:flex-[0.7]">
                            <label className="block text-sm font-black text-slate-500 dark:text-slate-400 mb-3 mr-1 uppercase tracking-[0.2em]">تصفية حسب الحفظ</label>
                            <div className="flex p-2 bg-slate-100/50 dark:bg-slate-900/80 rounded-3xl gap-2 border border-white/10 dark:border-slate-800">
                                {[
                                    { id: 'all', label: 'الكل' },
                                    { id: 'less5', label: 'أقل من 5' },
                                    { id: '5-15', label: '5 - 15' },
                                    { id: '15-30', label: '15 - 30' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setJuzFilter(tab.id)}
                                        className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 ${juzFilter === tab.id
                                            ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-primary shadow-xl shadow-emerald-500/10 transform scale-[1.05] z-10'
                                            : 'text-slate-500 dark:text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <StudentSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredStudents.length > 0 ? (
                    <div className="space-y-6 sm:space-y-12">
                        {/* Quranic Active Students Section */}
                        {filteredStudents.some(s => s.isInActiveEvent) && (
                            <div className="space-y-4 sm:space-y-6">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-black text-amber-600 dark:text-amber-500 whitespace-nowrap">🌟 مشاركو اليوم القرآني</h2>
                                    <div className="h-0.5 flex-1 bg-gradient-to-r from-amber-200 to-transparent dark:from-amber-900/50"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {filteredStudents.filter(s => s.isInActiveEvent).map((student) => (
                                        <StudentCard 
                                            key={student.id} 
                                            student={student} 
                                            router={router} 
                                            displayName={formatStudentName(student.name, filteredStudents)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
 
                        {/* Separator if both exist */}
                        {filteredStudents.some(s => s.isInActiveEvent) && filteredStudents.some(s => !s.isInActiveEvent) && (
                            <div className="py-8 flex items-center gap-6">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
                                <span className="text-slate-400 dark:text-slate-600 font-black text-[10px] uppercase tracking-[0.3em] bg-slate-50 dark:bg-slate-900/50 px-4 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                                    بقية الطلاب
                                </span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
                            </div>
                        )}
 
                        {/* Regular Halaqa Students Section */}
                        {filteredStudents.some(s => !s.isInActiveEvent) && (
                            <div className="space-y-4 sm:space-y-6">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-black text-slate-400 dark:text-slate-500 whitespace-nowrap">👥 طلاب الحلقة</h2>
                                    <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800/50"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {filteredStudents.filter(s => !s.isInActiveEvent).map((student) => (
                                        <StudentCard 
                                            key={student.id} 
                                            student={student} 
                                            router={router} 
                                            displayName={formatStudentName(student.name, filteredStudents)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="text-7xl mb-6 grayscale opacity-20">📭</div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">لا يوجد طلاب متطابقين حالياً</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">جرب تغيير الفلتر أو البحث عن اسم آخر</p>
                    </div>
                )}
            </main>

            <AddStudentModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={() => {
                    setShowAddModal(false);
                    fetchStudents();
                }}
                halaqaId={teacherHalaqas.length > 0 ? teacherHalaqas[0].id : (user?.halaqaId || null)}
            />

            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                teacher={user}
                teacherNames={user?.name}
            />
        </div>
    );
}
