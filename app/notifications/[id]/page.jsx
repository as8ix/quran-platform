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

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchNotification(params.id);
    }, [params.id]);

    const fetchNotification = async (id) => {
        try {
            // Note: In a real app we should have a get-by-id endpoint to limit what is returned 
            // but for now we filter locally if we fetch all? No we need single fetch.
            // But we don't have a single GET endpoint yet except checking permissions.
            // Let's rely on finding it in the array or better, use the patch endpoint logic/create new get.
            // Actually, I can update GET to accept 'id' or just fetch all and find. 
            // Given the complexity, let's just create a GET by ID or simpler, just handle it here.

            // Wait, I only have GET all for user. I should filter the one I want.
            // Or better, let's assume the user has access.
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const param = (storedUser.role === 'STUDENT')
                ? `studentId=${storedUser.id}`
                : `userId=${storedUser.id}`;

            const res = await fetch(`/api/notifications?${param}`);
            if (res.ok) {
                const data = await res.json();
                const found = data.find(n => n.id === parseInt(id));
                if (found) {
                    setNotification(found);
                    // Mark as read if not already
                    if (!found.isRead) {
                        await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
                    }
                } else {
                    console.error("Notification not found");
                }
            }
        } catch (error) {
            console.error("Error fetching notification", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;
    if (!notification) return <div className="p-10 text-center text-red-500">لم يتم العثور على الإشعار</div>;

    const getTypeColor = (type) => {
        switch (type) {
            case 'WARNING': return 'bg-red-50 border-red-200 text-red-800'; // تنبيه
            case 'PROPOSAL': return 'bg-green-50 border-green-200 text-green-800'; // مقترح
            default: return 'bg-blue-50 border-blue-200 text-blue-800'; // إشعار
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'WARNING': return '⚠️ تنبيه';
            case 'PROPOSAL': return '💡 مقترح';
            default: return '📢 إشعار';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 rtl" dir="rtl">
            <Navbar userType={user?.role?.toLowerCase() || 'student'} userName={user?.name} onLogout={() => router.push('/')} />

            <main className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10">
                <button
                    onClick={() => router.back()}
                    className="mb-8 flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-all group"
                >
                    <span className="font-bold text-sm md:text-base">عودة للقائمة الرئيسية</span>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </button>

                <div className={`bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border-t-8 ${notification.type === 'WARNING' ? 'border-red-500' : notification.type === 'PROPOSAL' ? 'border-green-500' : 'border-blue-500'}`}>

                    <div className="p-5 md:p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                            <div>
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] md:text-xs font-bold mb-2 md:mb-3 ${getTypeColor(notification.type)}`}>
                                    {getTypeLabel(notification.type)}
                                </span>
                                <h1 className="text-xl md:text-3xl font-black text-slate-800 leading-tight">
                                    {notification.title}
                                </h1>
                            </div>
                            <span className="text-xs md:text-sm text-slate-400 font-medium whitespace-nowrap">
                                {new Date(notification.createdAt).toLocaleDateString('ar-SA', {
                                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>

                        {notification.attachmentUrl && (
                            <div className="mb-6 md:mb-8 -mx-5 md:mx-0">
                                {notification.attachmentType === 'IMAGE' ? (
                                    <img
                                        src={notification.attachmentUrl}
                                        alt="مرفق"
                                        className="w-full h-auto md:rounded-3xl shadow-lg max-h-[400px] md:max-h-[600px] object-contain bg-white border-y md:border border-slate-100"
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x200?text=Error+Loading+Image'; }}
                                    />
                                ) : (
                                    <div className="px-5 md:px-0">
                                        <a
                                            href={notification.attachmentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 p-4 md:p-5 bg-indigo-50 rounded-2xl border border-indigo-100 hover:shadow-md transition-all text-indigo-700 font-bold group"
                                            download
                                        >
                                            <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform">📂</span>
                                            <div className="flex flex-col">
                                                <span className="text-xs md:text-sm">تحميل المرفق</span>
                                                <span className="text-[9px] md:text-[10px] text-indigo-400 font-normal">اضغط للفتح أو التحميل</span>
                                            </div>
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="prose prose-sm md:prose-lg max-w-none text-slate-600 leading-relaxed whitespace-pre-line mb-6 md:mb-8 px-1 md:px-2">
                            {notification.message}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-xs text-slate-400">
                        {notification.senderRole ? `المرسل: ${notification.senderRole === 'SUPERVISOR' ? 'الإدارة' : 'المعلم'}` : 'نظام المنصة'}
                    </div>
                </div>
            </main>
        </div>
    );
}
