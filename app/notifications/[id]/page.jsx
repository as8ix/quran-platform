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
        const storedUser = localStorage.getItem('user');
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

            <main className="max-w-2xl mx-auto px-4 py-10">
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                    ➡️ عودة
                </button>

                <div className={`bg-white rounded-3xl shadow-xl overflow-hidden border-t-8 ${notification.type === 'WARNING' ? 'border-red-500' : notification.type === 'PROPOSAL' ? 'border-green-500' : 'border-blue-500'}`}>

                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${getTypeColor(notification.type)}`}>
                                    {getTypeLabel(notification.type)}
                                </span>
                                <h1 className="text-3xl font-black text-slate-800 leading-tight">
                                    {notification.title}
                                </h1>
                            </div>
                            <span className="text-sm text-slate-400 font-medium">
                                {new Date(notification.createdAt).toLocaleDateString('ar-SA', {
                                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>

                        <div className="prose prose-lg max-w-none text-slate-600 leading-relaxed whitespace-pre-line mb-8">
                            {notification.message}
                        </div>

                        {notification.attachmentUrl && (
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <h3 className="font-bold text-slate-700 mb-3 text-sm">المرفقات</h3>
                                {notification.attachmentType === 'IMAGE' ? (
                                    <img
                                        src={notification.attachmentUrl}
                                        alt="مرفق"
                                        className="w-full h-auto rounded-xl shadow-sm"
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x200?text=Error+Loading+Image'; }}
                                    />
                                ) : (
                                    <a
                                        href={notification.attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all text-blue-600 font-bold"
                                    >
                                        🔗 فتح المرفق (رابط)
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-xs text-slate-400">
                        {notification.senderRole ? `المرسل: ${notification.senderRole === 'SUPERVISOR' ? 'الإدارة' : 'المعلم'}` : 'نظام المنصة'}
                    </div>
                </div>
            </main>
        </div>
    );
}
