'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ProfileModal({ student, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        name: student.name || '',
        username: student.username || '',
        password: student.password || ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/students', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: student.id,
                    ...formData,
                    // Keep existing progress data to avoid resetting it
                    hifzProgress: student.hifzProgress,
                    currentHifzSurahId: student.currentHifzSurahId,
                    juzCount: student.juzCount,
                    reviewPlan: student.reviewPlan,
                    dailyTargetPages: student.dailyTargetPages,
                    halaqaId: student.halaqaId
                })
            });

            if (res.ok) {
                const updated = await res.json();
                toast.success('تم تحديث معلوماتك بنجاح');
                onUpdate(updated);
                onClose();
                
                // Also update session storage
                const storedUser = JSON.parse(sessionStorage.getItem('user'));
                sessionStorage.setItem('user', JSON.stringify({
                    ...storedUser,
                    name: updated.name,
                    username: updated.username
                }));
            } else {
                const err = await res.json();
                toast.error(err.error || 'فشل التحديث');
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء التحديث');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="premium-glass w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 left-6 text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/20">
                            👤
                        </div>
                        <div>
                            <h3 className="text-2xl font-black">إعدادات الحساب</h3>
                            <p className="text-white/70 text-sm font-medium">تعديل معلومات تسجيل الدخول</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6" dir="rtl">
                    <div className="space-y-4">
                        {/* Name Field */}
                        <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 mr-2 uppercase tracking-widest">
                                الاسم الثلاثي
                            </label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    📝
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pr-12 pl-4 py-4 bg-slate-50 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 dark:text-white"
                                    placeholder="أدخل اسمك الكامل..."
                                />
                            </div>
                        </div>

                        {/* Username Field */}
                        <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 mr-2 uppercase tracking-widest">
                                اسم المستخدم
                            </label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    🆔
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full pr-12 pl-4 py-4 bg-slate-50 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 dark:text-white"
                                    placeholder="اسم الدخول..."
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 mr-2 uppercase tracking-widest">
                                كلمة المرور
                            </label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                    🔑
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pr-12 pl-12 py-4 bg-slate-50 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 dark:text-white"
                                    placeholder="كلمة مرور جديدة..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 hover:text-emerald-500 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    جاري الحفظ...
                                </div>
                            ) : (
                                'حفظ التعديلات'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
