import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { quranData } from '../data/quranData';

export default function AddStudentModal({ isOpen, onClose, onAdd, student, halaqaId }) {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [hifzProgress, setHifzProgress] = useState('');
    const [juzCount, setJuzCount] = useState(0);
    const [reviewPlan, setReviewPlan] = useState('');
    const [dailyTargetPages, setDailyTargetPages] = useState('1');
    const [hifzPlanType, setHifzPlanType] = useState('1'); 
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (student) {
            setName(student.name || '');
            setUsername(student.username || '');
            setPassword(student.password || '');
            setHifzProgress(student.hifzProgress || '');
            setJuzCount(student.juzCount || 0);
            setReviewPlan(student.reviewPlan || '');
            const target = String(student.dailyTargetPages || '1');
            setDailyTargetPages(target);
            
            // Map target to preset or custom
            if (['0.5', '1', '2'].includes(target)) {
                setHifzPlanType(target);
            } else {
                setHifzPlanType('custom');
            }
        } else {
            setName('');
            setUsername('');
            setPassword('');
            setHifzProgress('');
            setJuzCount(0);
            setReviewPlan('');
            setDailyTargetPages('1');
            setHifzPlanType('1');
        }
    }, [student, isOpen]);

    if (!isOpen) return null;

    const handleSurahChange = (surahName) => {
        setHifzProgress(surahName);
        const surah = quranData.find(s => s.name === surahName);
        if (surah) {
            // Calculate exact juz based on pages (604 pages total)
            const pagesMemorized = 605 - surah.startPage;
            let exactJuz = Math.floor(pagesMemorized / 20);
            if (exactJuz > 30) exactJuz = 30;
            setJuzCount(exactJuz);
        }
    };

    const handleSubmit = async () => {
        if (!name) {
            toast.error("يرجى إدخال اسم الطالب");
            return;
        }

        const selectedSurah = quranData.find(s => s.name === hifzProgress);
        const method = student ? 'PUT' : 'POST';
        const bodyData = {
            name,
            username,
            password,
            hifzProgress: hifzProgress || 'الفاتحة',
            currentHifzSurahId: selectedSurah ? selectedSurah.id : 1,
            juzCount: parseInt(juzCount) || 0,
            reviewPlan,
            dailyTargetPages: parseFloat(dailyTargetPages),
            halaqaId
        };

        if (student) {
            bodyData.id = student.id;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/students', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save student');
            }

            setLoading(false);
            toast.success(student ? "تم التعديل بنجاح" : "تم إضافة الطالب بنجاح!", { icon: '🎉' });
            onAdd();
        } catch (error) {
            console.error("Error saving student:", error);
            toast.error(error.message || "حدث خطأ أثناء الحفظ");
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 z-[10000] animate-fadeIn overflow-hidden"
            onClick={onClose}
        >
            <div
                className="modal-content max-w-xl w-full bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-slideUp border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Premium Header */}
                <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-8 text-white relative overflow-hidden flex-shrink-0 text-right">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none transform translate-x-4 -translate-y-4">
                        <span className="text-9xl">🕌</span>
                    </div>
                    <div className="flex justify-between items-center relative z-10">
                        <div className="text-right">
                            <h3 className="text-3xl sm:text-4xl font-black font-noto text-white mb-2 drop-shadow-lg leading-tight">{student ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</h3>
                            <p className="text-emerald-50 opacity-90 font-bold text-lg">{student ? 'تعديل معلومات الطالب وتعقب الإنجاز' : 'قم بتعبئة بيانات الطالب للبدء في تتبعه'}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 bg-white/20 rounded-2xl hover:bg-white/40 transition-all flex items-center justify-center text-2xl backdrop-blur-md border border-white/30 shadow-xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-800 transition-colors text-right" dir="rtl">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 mr-1">اسم الطالب الرباعي</label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none text-lg dark:text-white font-bold"
                                placeholder="مثال: محمد بن خالد العتيبي"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 mr-1">اسم المستخدم (للدخول)</label>
                                <input
                                    type="text"
                                    dir="ltr"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none text-left dark:text-white font-bold"
                                    placeholder="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 mr-1">كلمة المرور</label>
                                <input
                                    type="text"
                                    dir="ltr"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none text-left font-mono dark:text-white font-bold"
                                    placeholder="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 mr-1">وين واصل في الحفظ؟</label>
                                <select
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none appearance-none dark:text-white font-bold"
                                    value={hifzProgress}
                                    onChange={(e) => handleSurahChange(e.target.value)}
                                >
                                    <option value="" className="dark:bg-slate-800">اختر السورة...</option>
                                    {quranData.map(s => (
                                        <option key={s.id} value={s.name} className="dark:bg-slate-800">{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 mr-1">عدد الأجزاء المحفوظة</label>
                                <input
                                    type="number"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none dark:text-white font-bold text-center"
                                    value={juzCount}
                                    onChange={(e) => setJuzCount(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-3 mr-1">خطة المراجعة</label>
                                <select
                                    className="w-full px-5 py-4 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl transition-all outline-none appearance-none dark:text-white font-bold shadow-sm"
                                    value={['نصف جزء', 'جزء', 'جزئين', 'ثلاث'].includes(reviewPlan) ? reviewPlan : (reviewPlan ? 'custom' : '')}
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') setReviewPlan('صفحة');
                                        else setReviewPlan(e.target.value);
                                    }}
                                >
                                    <option value="">اختر خطة المراجعة...</option>
                                    <option value="نصف جزء">نصف جزء</option>
                                    <option value="جزء">جزء كامل</option>
                                    <option value="جزئين">جزئين</option>
                                    <option value="ثلاث">ثلاثة أجزاء</option>
                                    <option value="custom">تحديد خاص (صفحات)...</option>
                                </select>

                                {/* Custom Review Amount */}
                                {reviewPlan && !['نصف جزء', 'جزء', 'جزئين', 'ثلاث'].includes(reviewPlan) && (
                                    <div className="mt-3 animate-fadeIn">
                                        <input
                                            type="text"
                                            className="w-full px-5 py-3 bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900/30 focus:border-emerald-500 rounded-2xl outline-none dark:text-white font-bold text-center"
                                            placeholder="اكتب المقدار (مثلاً: 5 صفحات)"
                                            value={reviewPlan}
                                            onChange={(e) => setReviewPlan(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-teal-600 dark:text-teal-400 mb-3 mr-1">الهدف اليومي للمقدار الجديد</label>
                                <select
                                    className="w-full px-5 py-4 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl transition-all outline-none appearance-none dark:text-white font-bold shadow-sm"
                                    value={hifzPlanType}
                                    onChange={(e) => {
                                        setHifzPlanType(e.target.value);
                                        if (e.target.value !== 'custom') setDailyTargetPages(e.target.value);
                                    }}
                                >
                                    <option value="0.5">نصف صفحة</option>
                                    <option value="1">صفحة واحدة</option>
                                    <option value="2">صفحتين</option>
                                    <option value="custom">تحديد مخصص...</option>
                                </select>

                                {hifzPlanType === 'custom' && (
                                    <div className="mt-3 animate-fadeIn">
                                        <input
                                            type="number"
                                            step="0.5"
                                            className="w-full px-5 py-3 bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900/30 focus:border-emerald-500 rounded-2xl outline-none dark:text-white font-bold text-center"
                                            placeholder="عدد الأوجه..."
                                            value={dailyTargetPages}
                                            onChange={(e) => setDailyTargetPages(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 dark:border-slate-700 flex gap-4 flex-shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-300 dark:hover:bg-slate-600 transition-all active:scale-95"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>{student ? 'حفظ التعديلات' : 'إضافة الطالب'}</span>
                                <span>✨</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
