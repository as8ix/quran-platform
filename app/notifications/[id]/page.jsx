'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useParams } from 'next/navigation';

export default function NotificationDetails() {
    const router = useRouter();
    const params = useParams();
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const getYouTubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const extractYouTubeIds = (text) => {
        if (!text) return [];
        const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/g;
        const matches = [...text.matchAll(regExp)];
        return matches.map(m => m[1]);
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchNotification(params.id);
    }, [params.id]);

    const fetchNotification = async (id) => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (!storedUser) return;

            const param = (storedUser.role === 'STUDENT')
                ? `studentId=${storedUser.id}`
                : `userId=${storedUser.id}`;

            const res = await fetch(`/api/notifications?${param}`);
            if (res.ok) {
                const data = await res.json();
                const found = data.find(n => n.id === parseInt(id));
                if (found) {
                    setNotification(found);
                    if (!found.isRead) {
                        await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching notification", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500">جاري التحميل...</div>;
    if (!notification) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-10">
            <h1 className="text-2xl font-bold text-red-500 mb-4">لم يتم العثور على الإشعار</h1>
            <button onClick={() => router.back()} className="px-6 py-2 bg-emerald-600 text-white rounded-xl">عودة</button>
        </div>
    );

    const getTypeColor = (type) => {
        switch (type) {
            case 'WARNING': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400';
            case 'PROPOSAL': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400';
            default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'WARNING': return '⚠️ تنبيه مهم';
            case 'PROPOSAL': return '💡 مقترح جديد';
            default: return '📢 إشعار رسمي';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 rtl transition-colors duration-300" dir="rtl">
            <Navbar userType={user?.role?.toLowerCase() || 'student'} userName={user?.name} onLogout={() => router.push('/login')} />

            <main className="max-w-2xl mx-auto px-4 md:px-6 pb-12 pt-44">
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <button
                        onClick={() => window.location.replace('/notifications')}
                        className="flex-1 flex items-center justify-center gap-3 py-3 px-6 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all font-bold shadow-sm"
                    >
                        <span>🔙</span> قائمة الإشعارات
                    </button>
                    <button
                        onClick={() => {
                            try {
                                const stored = JSON.parse(localStorage.getItem('user'));
                                const path = stored?.role === 'SUPERVISOR' ? '/supervisor' : stored?.role === 'TEACHER' ? '/teacher' : '/student';
                                window.location.replace(path);
                            } catch (e) {
                                window.location.replace('/');
                            }
                        }}
                        className="flex-1 flex items-center justify-center gap-3 py-3 px-6 bg-emerald-600 text-white rounded-2xl border border-emerald-600 hover:bg-emerald-700 transition-all font-bold shadow-lg"
                    >
                        <span>🏠</span> العودة للرئيسية
                    </button>
                </div>

                <div className={`premium-glass rounded-[2.5rem] shadow-2xl overflow-hidden border-t-8 transition-all ${
                    notification.type === 'WARNING' ? 'border-red-500' : 
                    notification.type === 'PROPOSAL' ? 'border-green-500' : 'border-blue-500'
                }`}>

                    <div className="p-6 md:p-10">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                            <div>
                                <span className={`inline-block px-4 py-1 rounded-full text-[10px] md:text-xs font-black mb-3 border ${getTypeColor(notification.type)}`}>
                                    {getTypeLabel(notification.type)}
                                </span>
                                <h1 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white leading-tight tracking-tight">
                                    {notification.title}
                                </h1>
                            </div>
                            <span className="text-xs md:text-sm text-slate-400 dark:text-slate-500 font-bold whitespace-nowrap bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-lg">
                                {new Date(notification.createdAt).toLocaleDateString('ar-SA', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </span>
                        </div>

                        {notification.attachmentUrl && (
                            <div className="mb-8 md:mb-10 -mx-6 md:mx-0">
                                {notification.attachmentType === 'IMAGE' ? (
                                    <div className="relative group">
                                        <img
                                            src={notification.attachmentUrl}
                                            alt="مرفق"
                                            className="w-full h-auto md:rounded-[2rem] shadow-2xl max-h-[500px] object-contain bg-slate-50 dark:bg-slate-800 border-y md:border border-slate-100 dark:border-slate-800 transition-transform duration-300"
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/800x400?text=Error+Loading+Image'; }}
                                        />
                                    </div>
                                ) : getYouTubeId(notification.attachmentUrl) ? (
                                    <div className="px-6 md:px-0">
                                        <div className="aspect-video w-full overflow-hidden rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-800">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={`https://www.youtube.com/embed/${getYouTubeId(notification.attachmentUrl)}`}
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="w-full h-full"
                                            ></iframe>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-6 md:px-0">
                                        <a
                                            href={notification.attachmentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-5 p-5 md:p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] border-2 border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:shadow-xl transition-all text-emerald-700 dark:text-emerald-400 font-black group"
                                            download
                                        >
                                            <span className="text-3xl md:text-4xl group-hover:scale-125 transition-transform duration-300 drop-shadow-md">📂</span>
                                            <div className="flex flex-col">
                                                <span className="text-sm md:text-lg">تحميل المرفق الرسمي</span>
                                                <span className="text-[10px] md:text-xs text-emerald-500/70 font-bold">اضغط للمعاينة أو الحفظ للجهاز</span>
                                            </div>
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="prose prose-sm md:prose-xl max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line mb-8 md:mb-10 px-1 font-medium">
                            {notification.message}
                        </div>

                        {/* Additional Video Previews from Message Links */}
                        {(() => {
                            const messageYoutubeIds = extractYouTubeIds(notification.message);
                            const attachmentYoutubeId = getYouTubeId(notification.attachmentUrl);
                            
                            // Filter out the ID if it's already shown as an attachment
                            const uniqueIds = messageYoutubeIds.filter(id => id !== attachmentYoutubeId);
                            
                            if (uniqueIds.length > 0) {
                                return (
                                    <div className="space-y-6 mb-8 md:mb-10">
                                        <h4 className="text-sm font-black text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                            <span className="w-8 h-[2px] bg-slate-200 dark:bg-slate-800"></span>
                                            مقاطع فيديو مرتبطة
                                        </h4>
                                        <div className="grid gap-6">
                                            {uniqueIds.map((id, index) => (
                                                <div key={index} className="aspect-video w-full overflow-hidden rounded-[2.5rem] shadow-xl border-4 border-white dark:border-slate-800">
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        src={`https://www.youtube.com/embed/${id}`}
                                                        title={`YouTube video player ${index}`}
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        className="w-full h-full"
                                                    ></iframe>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs md:text-sm text-slate-400 dark:text-slate-500 font-bold">
                        {notification.senderRole ? `جهة الإصدار: ${notification.senderRole === 'SUPERVISOR' ? 'الإدارة العامة' : 'المعلم المشرف'}` : 'نظام التنبيهات الآمن'}
                    </div>
                </div>
            </main>
        </div>
    );
}
