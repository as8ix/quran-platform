import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { quranData } from '../data/quranData';
import { nationalities } from '../data/nationalities';

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
    const [phone, setPhone] = useState('');
    const [parentPhone, setParentPhone] = useState('');
    const [parentPhone2, setParentPhone2] = useState('');
    const [nationalId, setNationalId] = useState('');
    const [nationality, setNationality] = useState('');
    const [studentNotes, setStudentNotes] = useState('');
    const [joinDate, setJoinDate] = useState('');
    const [feeStatusTerm1, setFeeStatusTerm1] = useState('PENDING');
    const [feeStatusTerm2, setFeeStatusTerm2] = useState('PENDING');
    const [feeStatusSummer, setFeeStatusSummer] = useState('PENDING');

    // Custom UI States
    const [isNationalityOpen, setIsNationalityOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSecondaryFields, setShowSecondaryFields] = useState(false);

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

            // Set secondary fields
            setPhone(student.phone || '');
            setParentPhone(student.parentPhone || '');
            setParentPhone2(student.parentPhone2 || '');
            setNationalId(student.nationalId || '');
            setNationality(student.nationality || '');
            setStudentNotes(student.studentNotes || '');
            setFeeStatusTerm1(student.feeStatusTerm1 || 'PENDING');
            setFeeStatusTerm2(student.feeStatusTerm2 || 'PENDING');
            setFeeStatusSummer(student.feeStatusSummer || 'PENDING');
            setJoinDate(student.joinDate ? new Date(student.joinDate).toISOString().split('T')[0] : (student.createdAt ? new Date(student.createdAt).toISOString().split('T')[0] : ''));
        } else {
            setName('');
            setUsername('');
            setPassword('');
            setHifzProgress('');
            setJuzCount(0);
            setReviewPlan('');
            setDailyTargetPages('1');
            setHifzPlanType('1');
            
            // Reset secondary fields
            setPhone('');
            setParentPhone('');
            setParentPhone2('');
            setNationalId('');
            setNationality('');
            setStudentNotes('');
            setFeeStatusTerm1('PENDING');
            setFeeStatusTerm2('PENDING');
            setFeeStatusSummer('PENDING');
            setJoinDate(new Date().toISOString().split('T')[0]);
        }
    }, [student, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isNationalityOpen && !event.target.closest('.nationality-dropdown-container')) {
                setIsNationalityOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNationalityOpen]);

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
            halaqaId,
            phone,
            parentPhone,
            parentPhone2,
            nationalId,
            nationality,
            studentNotes,
            feeStatusTerm1,
            feeStatusTerm2,
            feeStatusSummer,
            joinDate: joinDate ? new Date(joinDate).toISOString() : undefined
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
                                <div className="relative">
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
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </div>
                                </div>
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
                                <div className="relative">
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
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </div>
                                </div>

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
                                <div className="relative">
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
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-teal-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </div>
                                </div>

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

                        {/* Secondary/Optional Data Section */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowSecondaryFields(!showSecondaryFields)}
                                className="w-full flex items-center justify-between group py-2"
                            >
                                <h4 className="text-sm font-black text-slate-400 group-hover:text-emerald-500 transition-colors uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-6 h-0.5 bg-slate-200 dark:bg-slate-800 group-hover:bg-emerald-200"></span>
                                    بيانات إضافية (اختياري)
                                    <span className="w-6 h-0.5 bg-slate-200 dark:bg-slate-800 group-hover:bg-emerald-200"></span>
                                </h4>
                                <div className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center transition-all ${showSecondaryFields ? 'rotate-180 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'text-slate-400'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </button>
                            
                            {showSecondaryFields && (
                                <div className="mt-6 space-y-6 animate-fadeIn">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 mr-1">رقم جوال الطالب</label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none text-left dark:text-white font-bold"
                                        placeholder="05xxxxxxxx"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 mr-1">رقم جوال ولي الأمر (1)</label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none text-left dark:text-white font-bold"
                                        placeholder="05xxxxxxxx"
                                        value={parentPhone}
                                        onChange={(e) => setParentPhone(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 mr-1">رقم جوال ولي الأمر (2)</label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none text-left dark:text-white font-bold"
                                        placeholder="05xxxxxxxx"
                                        value={parentPhone2}
                                        onChange={(e) => setParentPhone2(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 mr-1">رقم الهوية / الإقامة</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none dark:text-white font-bold"
                                        placeholder="1xxxxxxxxx"
                                        value={nationalId}
                                        onChange={(e) => setNationalId(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 mr-1">الجنسية</label>
                                    <div className="relative nationality-dropdown-container">
                                        <button
                                            type="button"
                                            onClick={() => setIsNationalityOpen(!isNationalityOpen)}
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 bg-white dark:bg-slate-900 rounded-2xl transition-all outline-none dark:text-white font-bold flex justify-between items-center shadow-sm"
                                        >
                                            <span className={nationality ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                                                {nationality || 'اختر الجنسية...'}
                                            </span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 transition-transform duration-300 ${isNationalityOpen ? 'rotate-180' : ''}`}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </button>

                                        {isNationalityOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="p-3 border-b border-slate-50 dark:border-slate-700">
                                                    <input
                                                        type="text"
                                                        placeholder="ابحث عن جنسية..."
                                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-sm font-bold dark:text-white"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                                                    {(() => {
                                                        const normalizeArabic = (text) => {
                                                            if (!text) return '';
                                                            return text
                                                                .replace(/[أإآ]/g, 'ا')
                                                                .replace(/ى/g, 'ي')
                                                                .replace(/ة/g, 'ه')
                                                                .replace(/[\u064B-\u0652]/g, ''); // Remove Tashkeel
                                                        };

                                                        const arabicMatch = (source, query) => {
                                                            const s = source.toLowerCase();
                                                            const q = query.toLowerCase();
                                                            if (s.includes(q)) return true;

                                                            const hasSpecificChars = /[أإآةى]/.test(q);
                                                            if (hasSpecificChars) {
                                                                // If user typed specific chars, don't normalize those out
                                                                return s.includes(q);
                                                            } else {
                                                                // If user typed generic chars, use normalization
                                                                return normalizeArabic(s).includes(normalizeArabic(q));
                                                            }
                                                        };

                                                        const query = searchQuery;

                                                        return ['arab', 'islamic', 'other'].map(group => {
                                                            const groupItems = nationalities.filter(n => {
                                                                return n.group === group && (arabicMatch(n.label, query) || arabicMatch(n.value, query));
                                                            });
                                                            
                                                            if (groupItems.length === 0) return null;
                                                            
                                                            return (
                                                                <div key={group} className="mb-2">
                                                                    <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                        {group === 'arab' ? 'الدول العربية' : group === 'islamic' ? 'الدول الإسلامية' : 'دول أخرى'}
                                                                    </div>
                                                                    {groupItems.map(n => (
                                                                        <button
                                                                            key={n.value}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setNationality(n.value);
                                                                                setIsNationalityOpen(false);
                                                                                setSearchQuery('');
                                                                            }}
                                                                            className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-between group ${nationality === n.value ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300'}`}
                                                                        >
                                                                            <span>{n.label}</span>
                                                                            {nationality === n.value && <span className="text-indigo-500">✓</span>}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                    {nationalities.filter(n => {
                                                        const normalizeArabic = (text) => {
                                                            if (!text) return '';
                                                            return text.replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[\u064B-\u0652]/g, '');
                                                        };
                                                        const arabicMatch = (source, query) => {
                                                            const s = source.toLowerCase();
                                                            const q = query.toLowerCase();
                                                            if (s.includes(q)) return true;
                                                            const hasSpecificChars = /[أإآةى]/.test(q);
                                                            if (hasSpecificChars) return s.includes(q);
                                                            return normalizeArabic(s).includes(normalizeArabic(q));
                                                        };
                                                        return arabicMatch(n.label, searchQuery);
                                                    }).length === 0 && (
                                                        <div className="p-4 text-center text-sm text-slate-400 font-bold italic">لا يوجد نتائج</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 mr-1">رسوم الترم الأول</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none appearance-none dark:text-white font-bold text-xs"
                                            value={feeStatusTerm1}
                                            onChange={(e) => setFeeStatusTerm1(e.target.value)}
                                        >
                                            <option value="PENDING">❌ لم يتم الدفع</option>
                                            <option value="PAID">✅ تم الدفع</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 mr-1">رسوم الترم الثاني</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none appearance-none dark:text-white font-bold text-xs"
                                            value={feeStatusTerm2}
                                            onChange={(e) => setFeeStatusTerm2(e.target.value)}
                                        >
                                            <option value="PENDING">❌ لم يتم الدفع</option>
                                            <option value="PAID">✅ تم الدفع</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 mr-1">رسوم الدورة الصيفية</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none appearance-none dark:text-white font-bold text-xs"
                                            value={feeStatusSummer}
                                            onChange={(e) => setFeeStatusSummer(e.target.value)}
                                        >
                                            <option value="PENDING">❌ لم يتم الدفع</option>
                                            <option value="PAID">✅ تم الدفع</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 mr-1">تاريخ الالتحاق بالحلقة</label>
                                    <input
                                        type="date"
                                        className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent rounded-2xl outline-none text-slate-500 dark:text-slate-400 font-bold cursor-not-allowed opacity-80"
                                        value={joinDate}
                                        readOnly
                                        disabled
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 mr-1">ملاحظات إضافية</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all outline-none dark:text-white font-bold resize-none min-h-[100px]"
                                    placeholder="أي ملاحظات تتعلق بحالة الطالب أو احتياجاته..."
                                    value={studentNotes}
                                    onChange={(e) => setStudentNotes(e.target.value)}
                                ></textarea>
                                </div>
                                </div>
                            )}
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
