'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { formatHijri } from '../../../../utils/dateUtils';
import { quranData } from '../../../../data/quranData';
import Navbar from '../../../../components/Navbar';
import BackButton from '../../../../components/BackButton';

// Helper to get first name
const getFirstName = (name) => {
    if (!name) return '';
    return name.split(' ')[0];
};

export default function StudentQuranPlanPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [planEntries, setPlanEntries] = useState([]);
    
    // Generator parameters
    const [startSurahId, setStartSurahId] = useState(114); // Default to An-Nas for backward
    const [endSurahId, setEndSurahId] = useState(78); // Default to An-Naba for backward
    const [dailyPages, setDailyPages] = useState('1.0');
    const [dailyReview, setDailyReview] = useState('2.0');

    const [startDate, setStartDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });

    // Custom searchable dropdown states for Surah Selectors
    const [isStartSurahOpen, setIsStartSurahOpen] = useState(false);
    const [startSurahSearch, setStartSurahSearch] = useState('');
    const [isEndSurahOpen, setIsEndSurahOpen] = useState(false);
    const [endSurahSearch, setEndSurahSearch] = useState('');

    // Operations states
    const [generating, setGenerating] = useState(false);
    const [clearing, setClearing] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        if (user && id) {
            fetchData();
        }
    }, [user, id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch student profile
            const res = await fetch(`/api/students?id=${id}`);
            if (res.ok) {
                const students = await res.json();
                const found = Array.isArray(students) ? students[0] : students;
                setStudent(found);
                if (found && found.currentHifzSurahId) {
                    setStartSurahId(found.currentHifzSurahId);
                }
            } else {
                toast.error('حدث خطأ في جلب بيانات الطالب');
            }

            // Fetch current plan entries
            const planRes = await fetch(`/api/students/plan?studentId=${id}`);
            if (planRes.ok) {
                const data = await planRes.json();
                setPlanEntries(data);
            }
        } catch (error) {
            console.error(error);
            toast.error('خطأ في الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePlan = async (e) => {
        e.preventDefault();
        setGenerating(true);
        try {
            const res = await fetch('/api/students/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate',
                    studentId: id,
                    startSurahId,
                    endSurahId,
                    dailyPages,
                    dailyReview,
                    startDate,
                    direction: 'backward'
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('تم توليد الخطة القرآنية بنجاح! 🎉');
                // Refresh plan entries
                fetchData();
            } else {
                toast.error(data.error || 'حدث خطأ أثناء توليد الخطة');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ في الاتصال بالخادم');
        } finally {
            setGenerating(false);
        }
    };

    const handleClearPlan = async () => {
        if (!window.confirm('هل أنت متأكد من رغبتك في حذف الخطة الحالية بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) {
            return;
        }

        setClearing(true);
        try {
            const res = await fetch(`/api/students/plan?studentId=${id}&clearAll=true`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('تم مسح الخطة القرآنية بنجاح');
                setPlanEntries([]);
            } else {
                toast.error('حدث خطأ أثناء مسح الخطة');
            }
        } catch (error) {
            console.error(error);
            toast.error('خطأ في الاتصال بالخادم');
        } finally {
            setClearing(false);
        }
    };

    const handleDeleteEntry = async (entryId) => {
        try {
            const res = await fetch(`/api/students/plan?id=${entryId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('تم حذف البند بنجاح');
                setPlanEntries(planEntries.filter(entry => entry.id !== entryId));
            } else {
                toast.error('حدث خطأ أثناء حذف البند');
            }
        } catch (error) {
            console.error(error);
            toast.error('خطأ في الاتصال');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-emerald-600 animate-pulse text-xl">
                جاري تحميل الخطة القرآنية...
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xl">
                الطالب غير موجود
            </div>
        );
    }

    // Filter surahs list based on searches
    const filteredStartSurahs = quranData.filter(s => s.name.includes(startSurahSearch));
    const filteredEndSurahs = quranData.filter(s => s.name.includes(endSurahSearch));

    const selectedStartSurahName = quranData.find(s => s.id === startSurahId)?.name || 'غير محدد';
    const selectedEndSurahName = quranData.find(s => s.id === endSurahId)?.name || 'غير محدد';

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-noto rtl transition-colors duration-300" dir="rtl">
            <Navbar
                userType="teacher"
                userName={user ? `أهلًا أستاذ ${getFirstName(user.name)} 👋` : 'أهلًا أستاذ 👋'}
                onLogout={() => router.push('/login')}
            />

            <main className="max-w-6xl mx-auto px-4 pt-28 pb-12">
                {/* Back & Print Controls - Hidden on print */}
                <div className="no-print flex justify-between items-center gap-4 mb-6">
                    <BackButton
                        href={`/teacher/student/${id}`}
                        text="عودة لملف الطالب"
                    />
                    {planEntries.length > 0 && (
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all transform hover:-translate-y-0.5"
                        >
                            <span>🖨️</span> طباعة الخطة القرآنية / PDF
                        </button>
                    )}
                </div>

                {/* Header Profile Card - Sleek Glassmorphism */}
                <div className="premium-glass rounded-[2.5rem] p-8 mb-8 relative overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-56 h-56 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg shadow-emerald-200 dark:shadow-none">
                                📅
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 dark:text-white">الخطة القرآنية للطالب</h1>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">الطالب: {student.name} • {student.hifzProgress || 'بداية الحفظ'}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-black border border-emerald-100/50 dark:border-emerald-900/30">
                                🎯 الخطة المعتمدة: الأحد إلى الأربعاء
                            </span>
                        </div>
                    </div>
                </div>

                {/* Auto Plan Generator Form - Hidden on print */}
                <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-1 premium-glass rounded-[2rem] p-6 border border-white/20 dark:border-slate-800 relative">
                        <h2 className="text-lg font-black text-emerald-800 dark:text-emerald-400 mb-5 flex items-center gap-2">
                            <span>⚡</span> توليد خطة تلقائية ذكية
                        </h2>

                        <form onSubmit={handleGeneratePlan} className="space-y-4">
                            {/* Start Surah Dropdown */}
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 mr-1">سورة البداية</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsStartSurahOpen(!isStartSurahOpen);
                                        setIsEndSurahOpen(false);
                                    }}
                                    className="w-full flex justify-between items-center px-4 py-3 bg-white/70 dark:bg-slate-900/70 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none transition-all font-bold dark:text-white text-right shadow-sm hover:bg-white dark:hover:bg-slate-800"
                                >
                                    <span>سورة {selectedStartSurahName}</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 text-xs">▼</span>
                                </button>

                                {isStartSurahOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsStartSurahOpen(false)} />
                                        <div className="absolute z-50 right-0 left-0 mt-2 max-h-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden">
                                            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                                <input
                                                    type="text"
                                                    placeholder="ابحث عن السورة..."
                                                    value={startSurahSearch}
                                                    onChange={(e) => setStartSurahSearch(e.target.value)}
                                                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 font-bold dark:text-white"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="overflow-y-auto flex-1 py-1 custom-scrollbar">
                                                {filteredStartSurahs.map(s => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setStartSurahId(s.id);
                                                            setIsStartSurahOpen(false);
                                                            setStartSurahSearch('');
                                                        }}
                                                        className={`w-full text-right px-4 py-2 text-xs font-bold transition-all ${startSurahId === s.id ? 'bg-emerald-500 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'}`}
                                                    >
                                                        سورة {s.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* End Surah Dropdown */}
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 mr-1">سورة النهاية</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEndSurahOpen(!isEndSurahOpen);
                                        setIsStartSurahOpen(false);
                                    }}
                                    className="w-full flex justify-between items-center px-4 py-3 bg-white/70 dark:bg-slate-900/70 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none transition-all font-bold dark:text-white text-right shadow-sm hover:bg-white dark:hover:bg-slate-800"
                                >
                                    <span>سورة {selectedEndSurahName}</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 text-xs">▼</span>
                                </button>

                                {isEndSurahOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsEndSurahOpen(false)} />
                                        <div className="absolute z-50 right-0 left-0 mt-2 max-h-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden">
                                            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                                <input
                                                    type="text"
                                                    placeholder="ابحث عن السورة..."
                                                    value={endSurahSearch}
                                                    onChange={(e) => setEndSurahSearch(e.target.value)}
                                                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 font-bold dark:text-white"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="overflow-y-auto flex-1 py-1 custom-scrollbar">
                                                {filteredEndSurahs.map(s => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setEndSurahId(s.id);
                                                            setIsEndSurahOpen(false);
                                                            setEndSurahSearch('');
                                                        }}
                                                        className={`w-full text-right px-4 py-2 text-xs font-bold transition-all ${endSurahId === s.id ? 'bg-emerald-500 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'}`}
                                                    >
                                                        سورة {s.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Daily Pages & Review Options */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 mr-1">الحفظ اليومي</label>
                                    <select
                                        value={dailyPages}
                                        onChange={(e) => setDailyPages(e.target.value)}
                                        className="w-full px-3 py-3 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-750 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-200 text-sm shadow-sm"
                                    >
                                        <option value="0.5">وجه نصف ص</option>
                                        <option value="1.0">وجه كامل</option>
                                        <option value="2.0">صفحتين (وجهين)</option>
                                        <option value="3.0">3 صفحات</option>
                                        <option value="4.0">4 صفحات</option>
                                        <option value="5.0">5 صفحات</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 mr-1">المراجعة اليومية</label>
                                    <select
                                        value={dailyReview}
                                        onChange={(e) => setDailyReview(e.target.value)}
                                        className="w-full px-3 py-3 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-750 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-200 text-sm shadow-sm"
                                    >
                                        <option value="0.0">بدون مراجعة</option>
                                        <option value="1.0">صفحة واحدة</option>
                                        <option value="2.0">صفحتين</option>
                                        <option value="3.0">3 صفحات</option>
                                        <option value="5.0">5 صفحات</option>
                                        <option value="10.0">10 صفحات</option>
                                    </select>
                                </div>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 mr-1">تاريخ البدء</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-200 text-sm shadow-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={generating}
                                className="w-full py-3.5 bg-gradient-to-br from-emerald-600 to-green-500 hover:shadow-lg text-white font-black rounded-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 text-sm shadow-md mt-4 flex items-center justify-center gap-2"
                            >
                                {generating ? '⚡ جاري التوليد التلقائي...' : 'توليد الخطة القرآنية ⚡'}
                            </button>
                        </form>
                    </div>

                    {/* Quick Guidance / Instructions Card */}
                    <div className="lg:col-span-2 flex flex-col justify-between">
                        <div className="premium-glass rounded-[2rem] p-8 border border-white/20 dark:border-slate-800/50 flex-1 flex flex-col justify-center">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4">💡 ذكاء الخطة القرآنية المخصصة:</h3>
                            <ul className="space-y-3.5 text-slate-600 dark:text-slate-400 font-medium text-sm leading-relaxed">
                                <li className="flex items-start gap-2.5">
                                    <span className="text-emerald-500 mt-1">✓</span>
                                    <span>**جدول الحضور والعمل:** تمت هندسة المولد ليعتمد فقط الدوام الرسمي **(الأحد إلى الأربعاء)**، وسيتم تلقائياً ترحيل وتخطّي الخميس، الجمعة والسبت من التسميع!</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="text-emerald-500 mt-1">✓</span>
                                    <span>**محاذاة نصف الوجه:** عند اختيار نصف وجه، سيقوم النظام تلقائياً بقسمة آيات الصفحة بشكل عادل ودقيق جداً على مدى يومين متتاليين!</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="text-emerald-500 mt-1">✓</span>
                                    <span>**التناغم والتوافق:** الخطة مدمجة تماماً مع الاتجاه التنازلي للحفظ المعتمد للطالب في المنصة لمتابعة دقيقة.</span>
                                </li>
                            </ul>
                        </div>

                        {planEntries.length > 0 && (
                            <div className="mt-6 flex justify-end gap-3 no-print">
                                <button
                                    onClick={handleClearPlan}
                                    disabled={clearing}
                                    className="px-6 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    <span>🗑️</span> مسح الخطة بالكامل
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Plan Overview Table */}
                <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800/80 shadow-xl shadow-slate-200/50 dark:shadow-none print:shadow-none print:border-none print:bg-transparent print:p-0">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <span>📅</span> جدول تفاصيل الخطة
                        <span className="text-xs font-bold text-slate-400">({planEntries.length} بند مدرج)</span>
                    </h2>

                    {planEntries.length > 0 ? (
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 print:border-slate-300">
                            <table className="w-full border-collapse text-sm text-right">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 print:bg-slate-100 print:border-slate-300">
                                        <th className="p-4 font-black text-slate-600 dark:text-slate-400">اليوم والتاريخ</th>
                                        <th className="p-4 font-black text-slate-600 dark:text-slate-400 text-center border-r border-slate-100/50 dark:border-slate-800">نوع البند</th>
                                        <th className="p-4 font-black text-slate-600 dark:text-slate-400 text-center border-r border-slate-100/50 dark:border-slate-800">السورة والآيات المطلوبة</th>
                                        <th className="p-4 font-black text-slate-600 dark:text-slate-400 text-center border-r border-slate-100/50 dark:border-slate-800">حالة الإنجاز</th>
                                        <th className="p-4 font-black text-slate-600 dark:text-slate-400 text-center border-r border-slate-100/50 dark:border-slate-800 no-print">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
                                    {planEntries.map((entry, idx) => {
                                        const entryDate = new Date(entry.date);
                                        const surah = quranData.find(s => s.id === entry.surahId);

                                        return (
                                            <tr key={entry.id} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900/10' : 'bg-slate-50/30 dark:bg-slate-800/20'}>
                                                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                                                    {formatHijri(entry.date, 'long')}
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-normal mr-2">
                                                        ({entryDate.toLocaleDateString('ar-SA', { weekday: 'long' })})
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-100/50 dark:border-slate-800">
                                                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black ${entry.type === 'HIFZ' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'}`}>
                                                        {entry.type === 'HIFZ' ? 'حفظ جديد' : 'مراجعة'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-100/50 dark:border-slate-800 font-black text-slate-700 dark:text-slate-300">
                                                    {entry.type === 'HIFZ' ? (
                                                        <span>
                                                            سورة {surah ? surah.name : `مجهولة (${entry.surahId})`} 
                                                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mr-2">
                                                                (الآيات: {entry.fromAyah} - {entry.toAyah})
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span>مراجعة مقررة بمعدل ({entry.toAyah}) صفحات</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-100/50 dark:border-slate-800">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black ${entry.isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-450'}`}>
                                                        {entry.isCompleted ? '✅ مكتمل' : '⏳ قيد الانتظار'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-100/50 dark:border-slate-800 no-print">
                                                    <button
                                                        onClick={() => handleDeleteEntry(entry.id)}
                                                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                                        title="حذف البند"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <span className="text-4xl mb-4 block">📅</span>
                            لا توجد خطة قرآنية معينة لهذا الطالب حالياً. 
                            <span className="block text-xs text-slate-400 dark:text-slate-500 mt-2">استخدم نموذج التوليد التلقائي لإنشاء خطة مخصصة في ثوانٍ!</span>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
