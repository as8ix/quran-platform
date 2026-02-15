'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../components/ThemeProvider';

export default function LoginPage() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState('student');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [notification, setNotification] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = sessionStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                router.push(`/${user.role.toLowerCase()}`);
            } else {
                setCheckingAuth(false);
            }
        }

        // Scroll reveal observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        // Observe elements with .reveal class
        // Use timeout to ensure elements are rendered
        const timeoutId = setTimeout(() => {
            document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        }, 100);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, [router, checkingAuth]);

    const roles = [
        { id: 'student', name: 'طالب', icon: '👨‍🎓', color: 'from-blue-500 to-blue-600' },
        { id: 'teacher', name: 'معلم', icon: '👨‍🏫', color: 'from-green-500 to-green-600' },
        { id: 'supervisor', name: 'مشرف عام', icon: '👔', color: 'from-purple-500 to-purple-600' },
    ];

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            showNotification('⚠️ الرجاء إدخال اسم المستخدم وكلمة المرور', 'warning');
            return;
        }

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                    role: selectedRole,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                showNotification('✓ تم تسجيل الدخول بنجاح', 'success');
                sessionStorage.setItem('user', JSON.stringify(data));

                setTimeout(() => {
                    router.push(`/${selectedRole}`);
                }, 500);
            } else {
                showNotification(`✕ ${data.error}`, 'error');
            }
        } catch (error) {
            showNotification('✕ حدث خطأ أثناء الاتصال بالخادم', 'error');
        }
    };

    const { isDarkMode, toggleDarkMode, mounted } = useTheme();

    if (!mounted || checkingAuth) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-100 dark:border-emerald-900 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-300">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-20 blur-3xl -top-48 -right-48 animate-float"></div>
                <div className="absolute w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 blur-3xl -bottom-40 -left-40 animate-float" style={{ animationDelay: '-3s' }}></div>
                <div className="absolute w-72 h-72 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float" style={{ animationDelay: '-6s' }}></div>
            </div>

            {/* Theme Toggle Button */}
            <button
                onClick={toggleDarkMode}
                className="absolute top-6 left-6 z-50 p-3 rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-amber-400 hover:scale-110 transition-all duration-300 shadow-lg"
                title={isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
            >
                {isDarkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                    </svg>
                )}
            </button>

            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 px-6 py-4 rounded-xl text-white font-semibold shadow-2xl z-50 animate-slide-in-right ${notification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    notification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        notification.type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}>
                    {notification.message}
                </div>
            )}

            {/* Login Card */}
            <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-700 reveal transition-all">
                        {/* Logo Section */}
                        <div className="text-center mb-8">
                            <img src="/mosque-logo.png" alt="شعار جامع الحديقة" className="w-24 h-24 mx-auto mb-4 object-contain dark:hidden" />
                            <img src="/mosque-logo-white.png" alt="شعار جامع الحديقة" className="w-24 h-24 mx-auto mb-4 object-contain hidden dark:block" />
                            <h1 className="font-amiri text-3xl font-bold bg-gradient-to-r from-green-600 via-green-700 to-green-800 dark:from-emerald-500 dark:via-emerald-600 dark:to-emerald-700 bg-clip-text text-transparent mb-1">
                                منصة تحفيظ القرآن الكريم
                            </h1>
                            <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">جامع الحديقة بحي السلامة</p>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">نحو حفظ متقن وإنجاز مستمر</p>
                        </div>

                        {/* Role Selector */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`p-4 rounded-2xl border-2 transition-all duration-300 ${selectedRole === role.id
                                        ? `bg-gradient-to-br ${role.color} border-transparent text-white shadow-lg transform scale-105`
                                        : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 hover:border-emerald-500 dark:hover:border-emerald-500'
                                        }`}
                                >
                                    <div className="text-3xl mb-2">{role.icon}</div>
                                    <div className="text-sm font-semibold">{role.name}</div>
                                </button>
                            ))}
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    اسم المستخدم
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-emerald-500 outline-none transition-all dark:text-white font-bold"
                                    placeholder="أدخل اسم المستخدم"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    كلمة المرور
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-emerald-500 outline-none transition-all dark:text-white font-bold"
                                    placeholder="أدخل كلمة المرور"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                <span>تسجيل الدخول</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        </form>


                    </div>
                </div>
            </div>
        </div>
    );
}
