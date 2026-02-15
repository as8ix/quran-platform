'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useTheme } from './ThemeProvider';

export default function Navbar({ userType, userName, onLogout }) {
    const { isDarkMode, toggleDarkMode, mounted } = useTheme();
    const titles = {
        student: 'لوحة الطالب',
        teacher: 'لوحة المعلم',
        supervisor: 'لوحة المشرف العام'
    };

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const lastNotificationsRef = useRef([]);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);

            // Initial fetch
            fetchNotifications(user);

            // Set up polling interval (every 15 seconds)
            const interval = setInterval(() => {
                fetchNotifications(user);
            }, 15000);

            return () => clearInterval(interval);
        }
    }, [userType]);

    const fetchNotifications = async (user) => {
        try {
            const param = (userType === 'student' || user.role === 'STUDENT')
                ? `studentId=${user.id}`
                : `userId=${user.id}`;

            const res = await fetch(`/api/notifications?${param}`);
            if (res.ok) {
                const data = await res.json();

                // Check if there are NEW notifications to show a toast
                if (lastNotificationsRef.current.length > 0) {
                    const newNotifications = data.filter(
                        newN => !lastNotificationsRef.current.some(oldN => oldN.id === newN.id)
                    );

                    if (newNotifications.length > 0) {
                        const latest = newNotifications[0];
                        toast.success(`إشعار جديد: ${latest.title || 'رسالة جديدة'}`, {
                            duration: 5000,
                            position: 'top-left',
                            icon: '🔔',
                        });
                    }
                }

                setNotifications(data);
                lastNotificationsRef.current = data;
                const unread = data.filter(n => !n.isRead).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error marking as read", error);
        }
    };

    return (
        <nav className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg shadow-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/mosque-logo.png" alt="شعار الجامع" className="w-10 h-10 object-contain dark:hidden" />
                        <img src="/mosque-logo-white.png" alt="شعار الجامع" className="w-10 h-10 object-contain hidden dark:block" />
                        <span className="font-amiri text-2xl font-bold text-green-600 dark:text-green-500">
                            {titles[userType] || 'المنصة'}
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:scale-110 transition-all duration-300 min-w-[40px] flex items-center justify-center"
                            title={isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
                        >
                            {!mounted ? (
                                <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : isDarkMode ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                                </svg>
                            )}
                        </button>

                        {/* Notifications Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-2xl hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown */}
                            {showNotifications && (
                                <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:left-0 top-[75px] md:top-full mt-2 md:mt-4 md:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl md:shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[100]">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-700 dark:text-slate-200">الإشعارات</h3>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} غير مقروء</span>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {notifications.length > 0 ? (
                                            notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => {
                                                        if (!n.isRead) handleMarkAsRead(n.id);
                                                        window.location.href = `/notifications/${n.id}`;
                                                    }}
                                                    className={`p-4 border-b border-slate-50 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${!n.isRead ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${n.type === 'WARNING' ? 'bg-orange-100 text-orange-600' : n.type === 'PROPOSAL' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {n.type === 'WARNING' ? 'تنبيه' : n.type === 'PROPOSAL' ? 'مقترح' : 'إشعار'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(n.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm ${!n.isRead ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                        {n.message}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-slate-400 text-sm">
                                                لا توجد إشعارات حالياً
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-700 dark:text-slate-200 hidden md:block">{userName}</span>
                            <button
                                onClick={() => {
                                    sessionStorage.removeItem('user');
                                    if (onLogout) onLogout();
                                }}
                                className="px-3 py-2 md:px-4 md:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                                aria-label="خروج"
                            >
                                <span className="hidden md:inline">خروج</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:hidden">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
