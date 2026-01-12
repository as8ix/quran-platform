'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

export default function Navbar({ userType, userName, onLogout }) {
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
        const storedUser = localStorage.getItem('user');
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
        <nav className="bg-white shadow-md sticky top-0 z-50 backdrop-blur-lg bg-opacity-90">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">📖</span>
                        <span className="font-amiri text-2xl font-bold text-green-600">
                            {titles[userType] || 'المنصة'}
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Notifications Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-2xl hover:bg-slate-100 rounded-full transition-colors"
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown */}
                            {showNotifications && (
                                <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:left-0 top-[75px] md:top-full mt-2 md:mt-4 md:w-80 bg-white rounded-2xl shadow-2xl md:shadow-xl border border-slate-100 overflow-hidden z-[100]">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-700">الإشعارات</h3>
                                        <span className="text-xs text-slate-500">{unreadCount} غير مقروء</span>
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
                                                    className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-emerald-50/50' : ''}`}
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
                            <span className="font-semibold text-gray-700 hidden md:block">{userName}</span>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('user');
                                    if (onLogout) onLogout();
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                خروج
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
