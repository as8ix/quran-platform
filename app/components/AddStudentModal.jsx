'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { quranData } from '../data/quranData';

export default function AddStudentModal({ isOpen, onClose, onAdd, halaqaId, student }) {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [hifzProgress, setHifzProgress] = useState('');
    const [juzCount, setJuzCount] = useState(0);
    const [reviewPlan, setReviewPlan] = useState('');
    const [dailyTargetPages, setDailyTargetPages] = useState('1');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (student) {
            setName(student.name);
            setUsername(student.username || '');
            setPassword(student.password || '');
            setHifzProgress(student.hifzProgress || '');
            setJuzCount(student.juzCount || 0);
            setReviewPlan(student.reviewPlan || '');
            setDailyTargetPages(student.dailyTargetPages || '1');
        } else {
            // Reset if opening in "Add Mode"
            setName('');
            setUsername('');
            setPassword('');
            setHifzProgress('');
            setJuzCount(0);
            setReviewPlan('');
            setDailyTargetPages('1');
        }
    }, [student, isOpen]);

    if (!isOpen) return null;

    const handleSurahChange = (surahName) => {
        setHifzProgress(surahName);
        const surah = quranData.find(s => s.name === surahName);
        if (surah) {
            const standardJuz = Math.floor((surah.startPage - 1) / 20) + 1;
            const reversedJuz = 31 - standardJuz;
            setJuzCount(reversedJuz);
        }
    };

    const handleSubmit = async () => {
        if (!name) {
            toast.error("يرجى إدخال اسم الطالب");
            return;
        }
        if (!username || !password) {
            toast.error("يرجى إدخال اسم المستخدم وكلمة المرور");
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
            juzCount: parseInt(juzCount),
            juzCount: parseInt(juzCount),
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
            if (!student) {
                // Clear form only on fresh add
                setName('');
                setUsername('');
                setPassword('');
                setHifzProgress('');
                setJuzCount(0);
                setJuzCount(0);
                setReviewPlan('');
                setDailyTargetPages('1');
            }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-white/20 transform animate-in slide-in-from-bottom-4 duration-500"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <span className="text-8xl">🕌</span>
                    </div>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className="text-3xl font-bold font-noto text-white mb-0 mt-0">{student ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</h3>
                            <p className="text-emerald-50 opacity-80 mt-1">{student ? 'تعديل معلومات الطالب وتعقب الإنجاز' : 'قم بتعبئة بيانات الطالب للبدء في تتبعه'}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 bg-white/20 rounded-2xl hover:bg-white/30 transition-all flex items-center justify-center text-2xl backdrop-blur-sm"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">اسم الطالب الرباعي</label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl transition-all outline-none text-lg"
                                placeholder="مثال: محمد بن خالد العتيبي"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">اسم المستخدم (للدخول)</label>
                                <input
                                    type="text"
                                    dir="ltr"
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl transition-all outline-none text-left"
                                    placeholder="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">كلمة المرور</label>
                                <input
                                    type="text"
                                    dir="ltr"
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl transition-all outline-none text-left font-mono"
                                    placeholder="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">وين واصل في الحفظ؟</label>
                                <select
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl transition-all outline-none appearance-none"
                                    value={hifzProgress}
                                    onChange={(e) => handleSurahChange(e.target.value)}
                                >
                                    <option value="">اختر السورة...</option>
                                    {quranData.map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">عدد الأجزاء المحفوظة</label>
                                <input
                                    type="number"
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl transition-all outline-none font-bold text-emerald-600"
                                    placeholder="0"
                                    value={juzCount}
                                    onChange={(e) => setJuzCount(e.target.value)}
                                />
                                <p className="text-[10px] text-gray-400 mt-1 mr-1">يتم احتسابه تلقائياً (يمكنك تعديله)</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">خطة المراجعة</label>
                            <select
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl transition-all outline-none appearance-none"
                                value={reviewPlan}
                                onChange={(e) => setReviewPlan(e.target.value)}
                            >
                                <option value="">اختر خطة المراجعة...</option>
                                <option value="نصف جزء">نصف جزء</option>
                                <option value="جزء">جزء</option>
                                <option value="جزئين">جزئين</option>
                                <option value="ثلاث">ثلاث أجزاء</option>
                                <option value="تحديد خاص">تحديد خاص</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">الهدف اليومي (عدد الصفحات)</label>
                            <input
                                type="number"
                                step="0.5"
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl transition-all outline-none text-lg"
                                placeholder="مثال: 1"
                                value={dailyTargetPages}
                                onChange={(e) => setDailyTargetPages(e.target.value)}
                            />
                            <p className="text-[10px] text-gray-400 mt-1 mr-1">سيتم استخدامه لحساب "إنجاز الهدف" تلقائياً</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-6 py-4 bg-white text-gray-600 rounded-2xl font-bold hover:bg-gray-100 border-2 border-gray-200 transition-all disabled:opacity-50"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2 text-lg active:scale-95"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin text-xl">⏳</span>
                                جاري الإضافة...
                            </>
                        ) : (
                            <>
                                <span>✔</span>
                                حفظ بيانات الطالب
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
