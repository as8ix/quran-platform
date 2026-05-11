'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { quranData } from '@/app/data/quranData';
import { nationalities } from '@/app/data/nationalities';
import BaseModal from '@/app/components/Global/BaseModal';

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

    const [isNationalityOpen, setIsNationalityOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSecondaryFields, setShowSecondaryFields] = useState(false);
    const [userRole, setUserRole] = useState(null);

    const nationalityRef = useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserRole(user.role);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (nationalityRef.current && !nationalityRef.current.contains(event.target)) {
                setIsNationalityOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            setHifzPlanType(['0.5', '1', '2'].includes(target) ? target : 'custom');
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
            setName(''); setUsername(''); setPassword(''); setHifzProgress('');
            setJuzCount(0); setReviewPlan(''); setDailyTargetPages('1'); setHifzPlanType('1');
            setPhone(''); setParentPhone(''); setParentPhone2(''); setNationalId('');
            setNationality(''); setStudentNotes(''); setFeeStatusTerm1('PENDING');
            setFeeStatusTerm2('PENDING'); setFeeStatusSummer('PENDING');
            setJoinDate(new Date().toISOString().split('T')[0]);
        }
    }, [student, isOpen]);

    const handleSurahChange = (surahName) => {
        setHifzProgress(surahName);
        const surah = quranData.find(s => s.name === surahName);
        if (surah) {
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
            name, username, password,
            hifzProgress: hifzProgress || 'الفاتحة',
            currentHifzSurahId: selectedSurah ? selectedSurah.id : 1,
            juzCount: parseInt(juzCount) || 0,
            reviewPlan,
            dailyTargetPages: parseFloat(dailyTargetPages),
            halaqaId, phone, parentPhone, parentPhone2,
            nationalId, nationality, studentNotes,
            feeStatusTerm1, feeStatusTerm2, feeStatusSummer,
            joinDate: joinDate ? new Date(joinDate).toISOString() : undefined,
            id: student?.id
        };

        setLoading(true);
        try {
            const response = await fetch('/api/students', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save student');
            }

            toast.success(student ? "تم التعديل بنجاح" : "تم إضافة الطالب بنجاح!", { icon: '🎉' });
            onAdd();
        } catch (error) {
            toast.error(error.message || "حدث خطأ أثناء الحفظ");
        } finally {
            setLoading(false);
        }
    };

    const groupedNationalities = {
        'الدول العربية': nationalities.filter(n => n.group === 'arab'),
        'الدول الإسلامية': nationalities.filter(n => n.group === 'islamic'),
        'دول أخرى': nationalities.filter(n => n.group === 'other')
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl" hideHeader={true} noPadding={true}>
            <div className="flex flex-col h-[calc(90vh-1rem)] bg-white dark:bg-slate-900 overflow-hidden" dir="rtl">
                {/* Unified Header - No circle around X */}
                <div className="bg-emerald-600 p-8 sm:p-10 relative overflow-hidden shrink-0 shadow-lg z-20">
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="text-right">
                            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                                {student ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
                            </h2>
                            <p className="text-emerald-100 font-bold mt-0.5 text-xs sm:text-sm opacity-90">إدارة سجلات الطلاب وتحصيلهم الدراسي</p>
                        </div>
                        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                </div>

                {/* Body Section */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50 dark:bg-slate-950/20 z-10">
                    <div className="space-y-8 pb-4">
                        {/* Essential Info */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.2em] mr-1">اسم الطالب الرباعي</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-white/60 dark:bg-slate-800/20 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold dark:text-white text-base backdrop-blur-sm shadow-inner"
                                    placeholder="مثال: محمد بن خالد العتيبي"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.2em] mr-1">اسم المستخدم</label>
                                    <input
                                        type="text" dir="ltr"
                                        className="w-full px-6 py-4 bg-white/60 dark:bg-slate-800/20 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold dark:text-white text-base backdrop-blur-sm text-left shadow-inner"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.2em] mr-1">كلمة المرور</label>
                                    <input
                                        type="text" dir="ltr"
                                        className="w-full px-6 py-4 bg-white/60 dark:bg-slate-800/20 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 rounded-2xl outline-none transition-all font-mono dark:text-white font-bold text-base backdrop-blur-sm text-left shadow-inner"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Progress Section */}
                        <div className="bg-white/30 dark:bg-slate-900/30 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 backdrop-blur-sm shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-[0.2em] mr-1">سورة الحفظ الحالية</label>
                                    <select
                                        className="w-full px-5 py-4 bg-white/80 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 rounded-2xl outline-none dark:text-white font-bold transition-all shadow-sm appearance-none"
                                        value={hifzProgress}
                                        onChange={(e) => handleSurahChange(e.target.value)}
                                    >
                                        <option value="">اختر السورة...</option>
                                        {quranData.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-[0.2em] mr-1">الأجزاء المحفوظة</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-4 bg-white/80 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 rounded-2xl outline-none dark:text-white font-bold text-center transition-all shadow-sm"
                                        value={juzCount}
                                        onChange={(e) => setJuzCount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-teal-600 dark:text-teal-400 mb-2 uppercase tracking-[0.2em] mr-1">🔄 خطة المراجعة</label>
                                    <select
                                        className="w-full px-5 py-4 bg-white/80 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 rounded-2xl outline-none dark:text-white font-bold shadow-sm transition-all"
                                        value={['10', '20', '40', '60'].includes(reviewPlan) ? reviewPlan : (reviewPlan ? 'custom' : '')}
                                        onChange={(e) => setReviewPlan(e.target.value === 'custom' ? '1' : e.target.value)}
                                    >
                                        <option value="">اختر المقدار...</option>
                                        <option value="10">10 صفحات</option>
                                        <option value="20">جزء واحد</option>
                                        <option value="40">جزئين</option>
                                        <option value="60">٣ أجزاء</option>
                                        <option value="custom">مخصص...</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-teal-600 dark:text-teal-400 mb-2 uppercase tracking-[0.2em] mr-1">📖 خطة الحفظ</label>
                                    <select
                                        className="w-full px-5 py-4 bg-white/80 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 rounded-2xl outline-none dark:text-white font-bold shadow-sm transition-all"
                                        value={hifzPlanType}
                                        onChange={(e) => {
                                            setHifzPlanType(e.target.value);
                                            if (e.target.value !== 'custom') setDailyTargetPages(e.target.value);
                                        }}
                                    >
                                        <option value="0.5">نصف صفحة</option>
                                        <option value="1">صفحة واحدة</option>
                                        <option value="2">صفحتين</option>
                                        <option value="custom">مخصص...</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Fields */}
                        <button
                            type="button"
                            onClick={() => setShowSecondaryFields(!showSecondaryFields)}
                            className="w-full py-4 bg-white/40 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-500 hover:text-emerald-600 flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                            <span>{showSecondaryFields ? 'إخفاء البيانات الإضافية' : 'إظهار البيانات الإضافية (اختياري)'}</span>
                            <svg className={`w-4 h-4 transition-transform ${showSecondaryFields ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                        </button>

                        {showSecondaryFields && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="relative" ref={nationalityRef}>
                                        <label className="block text-[10px] font-black text-slate-400 mb-2 mr-1">الجنسية</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsNationalityOpen(!isNationalityOpen)}
                                            className="w-full px-5 py-4 bg-white/60 dark:bg-slate-800/20 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-right font-bold dark:text-white flex items-center justify-between transition-all shadow-inner"
                                        >
                                            <span>{nationality || 'اختر الجنسية...'}</span>
                                            <svg className={`w-5 h-5 transition-transform text-slate-400 ${isNationalityOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                        
                                        {isNationalityOpen && (
                                            <div className="absolute z-50 w-[120%] -right-4 mt-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                                    <input
                                                        type="text"
                                                        placeholder="بحث عن جنسية..."
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold dark:text-white"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                    {Object.entries(groupedNationalities).map(([group, items]) => {
                                                        const filteredItems = items.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()));
                                                        if (filteredItems.length === 0) return null;
                                                        return (
                                                            <div key={group} className="p-2">
                                                                <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{group}</div>
                                                                {filteredItems.map((n, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        className="w-full px-3 py-2.5 text-right hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-bold text-sm transition-colors dark:text-slate-200 rounded-lg"
                                                                        onClick={() => {
                                                                            setNationality(n.value);
                                                                            setIsNationalityOpen(false);
                                                                        }}
                                                                    >
                                                                        {n.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 mb-2 mr-1">رقم الهوية / الإقامة</label>
                                        <input
                                            type="text" dir="ltr"
                                            className="w-full px-5 py-4 bg-white/60 dark:bg-slate-800/20 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 rounded-2xl outline-none font-bold dark:text-white transition-all shadow-inner"
                                            value={nationalId} onChange={(e) => setNationalId(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 mb-2 mr-1">جوال الطالب</label>
                                        <input
                                            type="text" dir="ltr"
                                            className="w-full px-5 py-4 bg-white/60 dark:bg-slate-800/20 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 rounded-2xl outline-none font-bold dark:text-white transition-all shadow-inner"
                                            value={phone} onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 mb-2 mr-1">جوال ولي الأمر</label>
                                        <input
                                            type="text" dir="ltr"
                                            className="w-full px-5 py-4 bg-white/60 dark:bg-slate-800/20 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 rounded-2xl outline-none font-bold dark:text-white transition-all shadow-inner"
                                            value={parentPhone} onChange={(e) => setParentPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex gap-4 shrink-0 shadow-lg z-20">
                    <button onClick={onClose} className="flex-1 py-4 text-slate-500 dark:text-slate-400 font-black hover:bg-slate-100 rounded-2xl transition-all">إلغاء</button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 dark:shadow-none active:scale-[0.98]">
                        {loading ? 'جاري الحفظ...' : (student ? 'تحديث البيانات ✨' : 'حفظ الطالب ✨')}
                    </button>
                </div>
            </div>
        </BaseModal>
    );
}
