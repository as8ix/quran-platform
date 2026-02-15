'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import AddStudentModal from '../components/AddStudentModal';
import SendNotification from '../components/SendNotification';
import { useTheme } from '../components/ThemeProvider';

export default function TeacherDashboard() {
    const router = useRouter();
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [juzFilter, setJuzFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);

    const [user, setUser] = useState(null);
    const [teacherHalaqas, setTeacherHalaqas] = useState([]);

    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.trim().split(/\s+/)[0];
    };

    const teacherName = user ? `أهلًا ${getFirstName(user.name)} 👋` : 'أهلًا 👋';

    useEffect(() => {
        // Get user from localStorage
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // First fetch teacher's halaqas to know what to filter by
            let currentTeacherHalaqaId = null;
            if (user) {
                // Fetch all halaqas and find the ones where this teacher is lead or assistant
                const halaqasRes = await fetch('/api/halaqas');
                if (halaqasRes.ok) {
                    const allHalaqas = await halaqasRes.json();

                    // Find halaqas where teacher is lead or assistant
                    const myHalaqas = allHalaqas.filter(h =>
                        h.teacherId === user.id ||
                        (h.assistants && h.assistants.some(a => a.id === user.id))
                    );
                    setTeacherHalaqas(myHalaqas);

                    // For now, default to the first halaqa found
                    if (myHalaqas.length > 0) {
                        currentTeacherHalaqaId = myHalaqas[0].id;
                    }
                }
            }

            let url = '/api/students';
            const params = new URLSearchParams();

            if (juzFilter !== 'all') {
                params.append('juzFilter', juzFilter);
            }

            // Only filter by halaqa if we found one for this teacher
            if (currentTeacherHalaqaId) {
                params.append('halaqaId', currentTeacherHalaqaId);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.error("Error fetching students:", error);
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

    const filteredStudents = students.filter(student =>
        normalizeText(student.name).includes(normalizeText(searchTerm))
    );

    const { isDarkMode, mounted } = useTheme();

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-noto rtl transition-colors duration-300" dir="rtl">
            <Navbar userType="teacher" userName={teacherName} onLogout={() => router.push('/login')} />

            <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
                {/* Hero / Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                            مرحباً بك، <span className="text-emerald-600 dark:text-emerald-500">يا {user ? getFirstName(user.name) : 'أستاذ'}!</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">لديك {students.length} طالب مسجل في حلقتك</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => router.push('/teacher/attendance')}
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
                        >
                            <span>📅</span> كشف الحضور
                        </button>
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
                            <span>➕</span> إضافة طالب
                        </button>
                        {user && (
                            <SendNotification
                                senderRole="TEACHER"
                                senderId={user.id}
                                students={students}
                            />
                        )}
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 mb-8 transition-colors">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-2 mr-1 uppercase tracking-wider">البحث عن اسم الطالب</label>
                            <div className="relative group">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 text-xl group-focus-within:text-emerald-500 transition-colors">🔍</span>
                                <input
                                    type="text"
                                    placeholder="ابحث باسم الطالب هنا..."
                                    className="w-full pr-12 pl-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none font-bold dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 lg:flex-[0.7]">
                            <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-2 mr-1 uppercase tracking-wider">تصفية حسب الحفظ</label>
                            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl gap-1 border border-slate-200 dark:border-slate-700">
                                {[
                                    { id: 'all', label: 'الكل' },
                                    { id: 'less5', label: 'أقل من 5' },
                                    { id: '5-15', label: '5 - 15' },
                                    { id: '15-30', label: '15 - 30' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setJuzFilter(tab.id)}
                                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-black transition-all ${juzFilter === tab.id
                                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-md transform scale-[1.02]'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Students List */}
                {(!mounted || loading) ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="w-14 h-14 border-4 border-emerald-100 dark:border-emerald-900 border-t-emerald-600 rounded-full animate-spin"></div>
                        <p className="mt-5 text-slate-500 dark:text-slate-400 font-black animate-pulse">جاري تحميل قائمة الطلاب المتميزين...</p>
                    </div>
                ) : filteredStudents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStudents.map((student) => (
                            <div
                                key={student.id}
                                className="group bg-white dark:bg-slate-800 rounded-[2.5rem] p-7 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 border-b-8 border-b-transparent hover:border-b-emerald-500 cursor-pointer relative overflow-hidden"
                                onClick={() => router.push(`/teacher/student/${student.id}`)}
                            >
                                <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-br-[4rem] group-hover:scale-150 transition-transform duration-700"></div>

                                <div className="flex items-start justify-between mb-6 relative z-10">
                                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center text-3xl font-black shadow-sm group-hover:rotate-6 transition-transform">
                                        {student.name?.charAt(0)}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-xl text-[10px] font-black text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800">
                                        ID: #{student.id}
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                    {student.name}
                                </h3>
                                {student.halaqa && (
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
                                        <span>📍</span> {student.halaqa.name}
                                    </p>
                                )}
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 font-medium line-clamp-1 italic">
                                    وصل إلى: <span className="text-emerald-600 dark:text-emerald-500 font-bold">{student.hifzProgress || 'بداية الحفظ'}</span>
                                </p>

                                <div className="space-y-4 mb-8 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">إجمالي الحفظ</span>
                                        <span className="font-black text-slate-800 dark:text-white bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">{student.juzCount} أجزاء</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-100 dark:border-slate-700">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${(student.juzCount / 30) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400 font-black pt-2 border-t border-slate-50 dark:border-slate-900">
                                    <span className="group-hover:translate-x-1 transition-transform inline-block">تسجيل التسميع</span>
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center text-xl transform group-hover:rotate-45 transition-transform duration-300">
                                        ←
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="text-7xl mb-6 grayscale opacity-20">📭</div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">لا يوجد طلاب متطابقين حالياً</h3>
                        <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">جرب تغيير الفلتر أو البدء بإضافة طالب جديد للطلائع</p>
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
        </div>
    );
}
