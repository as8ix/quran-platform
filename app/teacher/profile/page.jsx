'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import BackButton from '../../components/BackButton';
import { useTheme } from '../../components/ThemeProvider';
import LoadingScreen from '../../components/LoadingScreen';

export default function TeacherProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setName(parsedUser.name || '');
            setUsername(parsedUser.username || '');
            setLoading(false);
        } else {
            router.push('/login');
        }
    }, [router]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        
        if (password && password !== confirmPassword) {
            toast.error('كلمات المرور غير متطابقة');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    name,
                    username,
                    password: password || undefined
                })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                // Update local storage
                const newUser = { ...user, name: updatedUser.name, username: updatedUser.username };
                localStorage.setItem('user', JSON.stringify(newUser));
                setUser(newUser);
                toast.success('تم تحديث الملف الشخصي بنجاح');
                setPassword('');
                setConfirmPassword('');
            } else {
                const error = await res.json();
                toast.error(error.error || 'حدث خطأ أثناء التحديث');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-noto rtl" dir="rtl">
            <Navbar userType="teacher" userName={user?.name} onLogout={() => router.push('/login')} displayId={user?.displayId} />
            
            <main className="max-w-4xl mx-auto px-4 pt-32 pb-12">
                <BackButton href="/teacher" text="رجوع للوحة التحكم" className="mb-8" />
                <div className="premium-glass p-8 rounded-[3rem] shadow-2xl border border-white/20 dark:border-slate-800/50">
                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg shadow-emerald-200 dark:shadow-none">
                            👤
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 dark:text-white">إعدادات الحساب</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">تعديل بياناتك الشخصية وكلمة المرور</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-black text-slate-500 dark:text-slate-400 mb-3 mr-1">الاسم الكامل</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 rounded-2xl outline-none font-bold transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-500 dark:text-slate-400 mb-3 mr-1">اسم المستخدم</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-6 py-4 bg-white/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 rounded-2xl outline-none font-bold transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50/50 dark:bg-slate-900/30 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <span className="text-xl">🔐</span> تغيير كلمة المرور
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-black text-slate-500 dark:text-slate-400 mb-3 mr-1">كلمة المرور الجديدة</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="اتركها فارغة إذا لم ترد التغيير"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 rounded-2xl outline-none font-bold transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
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
                                <div>
                                    <label className="block text-sm font-black text-slate-500 dark:text-slate-400 mb-3 mr-1">تأكيد كلمة المرور</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="أعد كتابة كلمة المرور"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 rounded-2xl outline-none font-bold transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
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
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 dark:shadow-none transition-all disabled:opacity-50 active:scale-95"
                            >
                                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات ✨'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/teacher')}
                                className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-2xl font-black transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
