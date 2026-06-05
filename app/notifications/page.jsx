'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import LoadingScreen from '../components/LoadingScreen';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchNotifications(parsedUser);
    }, []);

    const fetchNotifications = async (userData) => {
        try {
            const param = (userData.role === 'STUDENT')
                ? `studentId=${userData.id}`
                : `userId=${userData.id}`;

            const res = await fetch(`/api/notifications?${param}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Error fetching notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Error marking as read", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const param = (user.role === 'STUDENT')
                ? `studentId=${user.id}`
                : `userId=${user.id}`;
                
            const res = await fetch(`/api/notifications/read-all?${param}`, { method: 'PATCH' });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                toast.success('تم تحديد الكل كمقروء');
            }
        } catch (error) {
            console.error("Error marking all as read", error);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 rtl transition-colors duration-300" dir="rtl">
            <Navbar userType={user?.role?.toLowerCase() || 'student'} userName={user?.name} />

            <main className="max-w-4xl mx-auto px-4 md:px-6 pb-12 pt-44">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white">كافة الإشعارات 🔔</h1>
                        {notifications.some(n => !n.isRead) && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600 px-4 py-1.5 rounded-full font-bold transition-all hover:shadow-md active:scale-95"
                            >
                                ✔ تحديد الكل كمقروء
                            </button>
                        )}
                    </div>
                    <BackButton 
                        href="/" 
                        text="العودة للرئيسية" 
                    />
                </div>

                <div className="grid gap-4">
                    {notifications.length > 0 ? (
                        notifications.map((n) => (
                            <div 
                                key={n.id}
                                onClick={() => {
                                    if (!n.isRead) handleMarkAsRead(n.id);
                                    window.location.href = `/notifications/${n.id}`;
                                }}
                                className={`premium-glass p-6 rounded-3xl border transition-all cursor-pointer hover:scale-[1.01] active:scale-95 ${
                                    !n.isRead 
                                    ? 'border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]' 
                                    : 'border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                            n.type === 'WARNING' ? 'bg-rose-100 text-rose-600' : 
                                            n.type === 'PROPOSAL' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {n.type === 'WARNING' ? '⚠️ تنبيه' : n.type === 'PROPOSAL' ? '💡 مقترح' : '📢 إشعار'}
                                        </span>
                                        {!n.isRead && (
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400 font-bold">
                                        {new Date(n.createdAt).toLocaleDateString('ar-SA', {
                                            year: 'numeric', month: 'long', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <h3 className={`text-lg mb-2 ${!n.isRead ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>
                                    {n.title}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {n.message}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="text-6xl mb-4">📭</div>
                            <h3 className="text-xl font-bold text-slate-400">لا توجد إشعارات حالياً</h3>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
