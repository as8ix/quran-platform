'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { toast } from 'react-hot-toast';

export default function SendNotification({ senderRole, senderId, students = [], teachers = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Form States
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('INFO');
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [attachmentType, setAttachmentType] = useState('IMAGE'); // IMAGE, LINK, VIDEO
    const [attachmentMode, setAttachmentMode] = useState('URL'); // URL, FILE

    const getYouTubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Target Selection
    const [targetType, setTargetType] = useState('STUDENT'); // STUDENT, TEACHER
    const [selectedRecipients, setSelectedRecipients] = useState([]); // IDs
    const [selectAll, setSelectAll] = useState(false);

    const resetForm = () => {
        setTitle('');
        setMessage('');
        setType('INFO');
        setAttachmentUrl('');
        setAttachmentType('IMAGE');
        setAttachmentMode('URL');
        setSelectedRecipients([]);
        setSelectAll(false);
        setIsOpen(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type.startsWith('video/')) {
            toast.error('عذراً، لا يُسمح برفع ملفات الفيديو');
            e.target.value = '';
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        
        try {
            const { uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
            const fileRef = ref(storage, `notifications/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(fileRef, file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(Math.round(progress));
                }, 
                (error) => {
                    console.error("Firebase Storage Error:", error);
                    toast.error("حدث خطأ أثناء رفع الملف");
                    setUploading(false);
                }, 
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    setAttachmentUrl(url);
                    if (file.type.startsWith('image/')) setAttachmentType('IMAGE');
                    else setAttachmentType('LINK');
                    setUploading(false);
                    setUploadProgress(100);
                    toast.success('تم رفع الملف بنجاح');
                }
            );
        } catch (error) {
            console.error("Firebase Storage Error:", error);
            toast.error("حدث خطأ في الاتصال بخدمة التخزين");
            setUploading(false);
        }
    };

    const handleFileDelete = async () => {
        if (!attachmentUrl) return;
        try {
            if (attachmentUrl.includes('firebasestorage.googleapis.com')) {
                const fileRef = ref(storage, attachmentUrl);
                await deleteObject(fileRef);
            }
            setAttachmentUrl('');
            toast.success('تم حذف الملف');
        } catch (error) {
            setAttachmentUrl('');
        }
    };

    const handleSelectAll = (checked) => {
        setSelectAll(checked);
        if (checked) {
            const list = targetType === 'STUDENT' ? students : teachers;
            setSelectedRecipients(list.map(i => i.id));
        } else {
            setSelectedRecipients([]);
        }
    };

    const handleRecipientToggle = (id) => {
        if (selectedRecipients.includes(id)) {
            setSelectedRecipients(prev => prev.filter(i => i !== id));
            setSelectAll(false);
        } else {
            setSelectedRecipients(prev => [...prev, id]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !message || selectedRecipients.length === 0) {
            toast.error('الرجاء إكمال البيانات المطلوبة');
            return;
        }

        setLoading(true);
        try {
            const promises = selectedRecipients.map(recipientId => {
                const payload = {
                    title,
                    message,
                    type,
                    attachmentUrl: attachmentUrl || null,
                    attachmentType: attachmentUrl ? attachmentType : null,
                    senderId,
                    senderRole,
                };
                if (targetType === 'STUDENT') payload.studentId = recipientId;
                else payload.userId = recipientId;

                return fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            });

            await Promise.all(promises);
            toast.success('تم إرسال الإشعارات بنجاح');
            resetForm();
        } catch (error) {
            toast.error('حدث خطأ أثناء الإرسال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-500/80 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all active:scale-95"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>إرسال إشعار</span>
            </button>

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 md:p-10 backdrop-blur-[12px] md:backdrop-blur-[20px]">
                    <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 animate-fadeIn" onClick={() => setIsOpen(false)}></div>
                    
                    <div className="relative w-full max-w-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] animate-slideUp border border-white/20 dark:border-slate-800 flex flex-col max-h-[90vh]">
                        {/* Premium Header */}
                        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-indigo-600/90 to-indigo-700/90 text-white flex-shrink-0 rounded-t-[2.5rem]">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight">إرسال إشعار جديد</h3>
                                    <p className="text-indigo-100 font-bold mt-0.5 text-xs sm:text-sm">تواصل بفعالية مع مجتمع الحلقات</p>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                            <form id="notification-form" onSubmit={handleSubmit} className="space-y-8">
                                {/* Type Selection */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mr-1">نوع الإشعار</label>
                                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                                        {[
                                            { id: 'INFO', label: 'إشعار', color: 'blue', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                                            { id: 'WARNING', label: 'تنبيه', color: 'amber', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
                                            { id: 'PROPOSAL', label: 'مقترح', color: 'emerald', icon: 'M9.663 17h4.674a1 1 0 00.922-.617l2.108-4.742A1 1 0 0016.446 10h-2.113a1 1 0 01-.992-1.138l.322-2.574a1 1 0 00-1.214-1.103L6.892 7.027A1 1 0 006.01 8.016l.322 2.574a1 1 0 01-.992 1.138H3.228a1 1 0 00-.927 1.373l2.108 4.742a1 1 0 00.922.617h4.332' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setType(opt.id)}
                                                className={`p-3 sm:p-4 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-2 ${type === opt.id 
                                                    ? `border-${opt.color}-500/50 bg-${opt.color}-50/50 dark:bg-${opt.color}-900/30 text-${opt.color}-600 dark:text-${opt.color}-400 shadow-lg shadow-${opt.color}-500/10 scale-[1.02]` 
                                                    : 'border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/30 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'}`}
                                            >
                                                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={opt.icon} />
                                                </svg>
                                                <span className="font-black text-[10px] sm:text-xs uppercase">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="space-y-5">
                                    <div className="relative group">
                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.2em] mr-1">عنوان الإشعار <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white/80 dark:focus:bg-slate-900/80 rounded-2xl outline-none transition-all font-bold dark:text-white text-sm sm:text-base"
                                            placeholder="عنوان الإشعار..."
                                            required
                                        />
                                    </div>
                                    <div className="relative group">
                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.2em] mr-1">محتوى الإشعار <span className="text-red-500">*</span></label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="w-full px-6 py-5 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white/80 dark:focus:bg-slate-900/80 rounded-3xl outline-none transition-all h-32 resize-none font-bold dark:text-white text-sm sm:text-base"
                                            placeholder="اكتب المحتوى هنا..."
                                            required
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Attachments & Recipients Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Attachments Section */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">المرفقات</label>
                                            <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-0.5 rounded-lg">
                                                <button type="button" onClick={() => setAttachmentMode('URL')} className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${attachmentMode === 'URL' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>رابط</button>
                                                <button type="button" onClick={() => setAttachmentMode('FILE')} className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${attachmentMode === 'FILE' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>ملف</button>
                                            </div>
                                        </div>

                                        <div className="p-5 bg-white/30 dark:bg-slate-800/20 rounded-3xl border border-slate-200 dark:border-slate-800">
                                            {attachmentMode === 'URL' ? (
                                                <div className="space-y-3">
                                                    <div className="flex gap-1.5">
                                                        <button type="button" onClick={() => setAttachmentType('IMAGE')} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${attachmentType === 'IMAGE' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>صورة</button>
                                                        <button type="button" onClick={() => setAttachmentType('LINK')} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${attachmentType === 'LINK' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>رابط</button>
                                                        <button type="button" onClick={() => setAttachmentType('VIDEO')} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${attachmentType === 'VIDEO' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>فيديو</button>
                                                    </div>
                                                    <input
                                                        type="url"
                                                        value={attachmentUrl}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setAttachmentUrl(val);
                                                            if (getYouTubeId(val)) setAttachmentType('VIDEO');
                                                        }}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white text-xs ltr outline-none focus:border-indigo-500 font-bold"
                                                        placeholder={attachmentType === 'IMAGE' ? 'https://...' : attachmentType === 'VIDEO' ? 'رابط يوتيوب...' : 'رابط...'}
                                                        dir="ltr"
                                                    />
                                                    {attachmentType === 'VIDEO' && getYouTubeId(attachmentUrl) && (
                                                        <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm mt-2">
                                                            <iframe
                                                                width="100%"
                                                                height="100%"
                                                                src={`https://www.youtube.com/embed/${getYouTubeId(attachmentUrl)}`}
                                                                title="Preview"
                                                                frameBorder="0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            ></iframe>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 transition-all hover:border-indigo-400 group cursor-pointer text-center">
                                                    <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading} />
                                                    {uploading ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                            <span className="text-[10px] font-black text-indigo-600">{uploadProgress}%</span>
                                                        </div>
                                                    ) : attachmentUrl ? (
                                                        <div className="flex flex-col items-center gap-3">
                                                            {attachmentType === 'IMAGE' ? (
                                                                <img src={attachmentUrl} className="w-16 h-16 object-cover rounded-xl shadow-lg" />
                                                            ) : (
                                                                <div className="w-12 h-12 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center text-xl">📄</div>
                                                            )}
                                                            <button type="button" onClick={handleFileDelete} className="text-[10px] font-black text-red-500 hover:underline">حذف</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="w-10 h-10 bg-white/50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📁</div>
                                                            <span className="text-[10px] font-black text-slate-400">انقر للرفع</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recipients Section */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">المستلمون</label>
                                            {senderRole === 'SUPERVISOR' && (
                                                <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-0.5 rounded-lg">
                                                    <button type="button" onClick={() => { setTargetType('STUDENT'); setSelectedRecipients([]); }} className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${targetType === 'STUDENT' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>الطلاب</button>
                                                    <button type="button" onClick={() => { setTargetType('TEACHER'); setSelectedRecipients([]); }} className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${targetType === 'TEACHER' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>المعلمين</button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[180px] bg-white/30 dark:bg-slate-800/20">
                                            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <div className="relative">
                                                        <input type="checkbox" checked={selectAll} onChange={(e) => handleSelectAll(e.target.checked)} className="peer sr-only" />
                                                        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                                                            <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-500">الكل</span>
                                                </label>
                                                <span className="text-[9px] font-black bg-indigo-100/50 dark:bg-indigo-900/40 text-indigo-600 px-2.5 py-1 rounded-full">{selectedRecipients.length} مختار</span>
                                            </div>
                                            <div className="overflow-y-auto p-3 space-y-1.5 custom-scrollbar flex-1">
                                                {(targetType === 'STUDENT' ? students : teachers).map(item => (
                                                    <label key={item.id} className="flex items-center gap-3 p-2.5 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-100/50 dark:hover:border-slate-700/50 group">
                                                        <div className="relative">
                                                            <input type="checkbox" checked={selectedRecipients.includes(item.id)} onChange={() => handleRecipientToggle(item.id)} className="peer sr-only" />
                                                            <div className="w-4.5 h-4.5 border-2 border-slate-200 dark:border-slate-700 rounded peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-slate-700 dark:text-slate-300 font-bold group-hover:text-indigo-600 transition-colors">{item.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl flex gap-4 flex-shrink-0">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex-1 py-4 text-slate-500 dark:text-slate-400 font-black hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-sm"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                form="notification-form"
                                disabled={loading || uploading}
                                className="flex-[2] py-4 bg-indigo-600 dark:bg-indigo-500/80 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-xl shadow-indigo-500/20 active:scale-[0.98] text-sm"
                            >
                                {loading ? 'جاري الإرسال...' : 'إرسال الإشعار'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
