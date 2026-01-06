'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import AddStudentModal from '../components/AddStudentModal';

export default function TeacherDashboard() {
    const router = useRouter();
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [juzFilter, setJuzFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);

    const [user, setUser] = useState(null);
    const [teacherHalaqas, setTeacherHalaqas] = useState([]);

    const teacherName = user ? `أهلًا أستاذ ${user.name} 👋` : 'أهلًا أستاذ 👋';

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
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

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-noto">
            <Navbar userType="teacher" userName={teacherName} onLogout={() => router.push('/')} />

            <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
                {/* Hero / Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                            مرحباً بك، <span className="text-emerald-600">يا أستاذ!</span>
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">لديك {students.length} طالب مسجل في حلقتك</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/teacher/attendance')}
                            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
                        >
                            <span>📅</span>
                            كشف الحضور
                        </button>
                        <button
                            onClick={() => {
                                if (!teacherHalaqas.length && !user?.halaqaId) {
                                    toast.error('لم يتم العثور على حلقة مرتبطة بحسابك. يرجى التواصل مع المشرف.');
                                    return;
                                }
                                setShowAddModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                        >
                            <span>➕</span>
                            إضافة طالب
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-slate-400 mb-2 mr-1">البحث عن اسم</label>
                            <div className="relative">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">🔍</span>
                                <input
                                    type="text"
                                    placeholder="ابحث باسم الطالب هنا..."
                                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl transition-all outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 lg:flex-[0.7]">
                            <label className="block text-sm font-bold text-slate-400 mb-2 mr-1">تصفية حسب الحفظ</label>
                            <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                                {[
                                    { id: 'all', label: 'الكل' },
                                    { id: 'less5', label: 'أقل من 5' },
                                    { id: '5-15', label: '5 - 15' },
                                    { id: '15-30', label: '15 - 30' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setJuzFilter(tab.id)}
                                        className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${juzFilter === tab.id
                                            ? 'bg-white text-emerald-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
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
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                        <p className="mt-4 text-slate-500 font-bold">جاري تحميل قائمة الطلاب...</p>
                    </div>
                ) : filteredStudents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStudents.map((student) => (
                            <div
                                key={student.id}
                                className="group bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300 border-b-4 border-b-transparent hover:border-b-emerald-500 cursor-pointer"
                                onClick={() => router.push(`/teacher/student/${student.id}`)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-black">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div className="bg-slate-50 px-3 py-1 rounded-full text-xs font-bold text-slate-400">
                                        ID: #{student.id}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">
                                    {student.name}
                                </h3>
                                <p className="text-slate-500 text-sm mb-4 line-clamp-1">
                                    وصل إلى: {student.hifzProgress || 'بداية الحفظ'}
                                </p>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">إجمالي الحفظ</span>
                                        <span className="font-bold text-slate-700">{student.juzCount} جزء</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${(student.juzCount / 30) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-emerald-600 font-bold">
                                    <span>تسجيل التسميع</span>
                                    <span className="text-xl">←</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-bold text-slate-800">لا يوجد طلاب متطابقين</h3>
                        <p className="text-slate-500 mt-2">جرب تغيير الفلتر أو إضافة طالب جديد</p>
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
