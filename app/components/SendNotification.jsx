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
    const [attachmentType, setAttachmentType] = useState('IMAGE'); // IMAGE, LINK
    const [attachmentMode, setAttachmentMode] = useState('URL'); // URL, FILE

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
                    console.error("Detailed Firebase Storage Error:", error);
                    let errorMessage = `خطأ في رفع الملف: ${error.code || 'unknown'}`;
                    
                    if (error.code === 'storage/unknown') {
                        errorMessage = "خطأ غير معروف (Unknown): غالباً بسبب عدم تفعيل Storage في Firebase Console أو خطأ في اسم الـ Bucket";
                    } else if (error.code === 'storage/unauthorized') {
                        errorMessage = "خطأ في الصلاحيات: تأكد من ضبط الـ Rules لتسمح بالرفع";
                    }
                    
                    toast.error(errorMessage, { duration: 6000 });
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
            // Only try to delete from Firebase if it's a firebase URL
            if (attachmentUrl.includes('firebasestorage.googleapis.com')) {
                const fileRef = ref(storage, attachmentUrl);
                await deleteObject(fileRef);
            }
            setAttachmentUrl('');
            toast.success('تم حذف الملف بنجاح');
        } catch (error) {
            console.error("Delete Error:", error);
            toast.error('حدث خطأ أثناء حذف الملف من التخزين');
            // Still clear the URL locally if there's an error (e.g. file already deleted)
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
            toast.error('الرجاء تعبئة جميع الحقول المطلوبة واختيار مستلم واحد على الأقل');
            return;
        }

        setLoading(true);
        try {
            // Send requests in parallel
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
            toast.success('تم إرسال الإشعارات بنجاح ✅');
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء الإرسال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-100 flex items-center gap-2"
            >
                <span>📢</span>
                <span>إضافة إشعار جديد</span>
            </button>

            {isOpen && mounted && createPortal(
                <div className="modal-overlay animate-fadeIn" onClick={() => setIsOpen(false)}>
                    <div className="modal-content animate-slideUp max-w-4xl" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header bg-gradient-to-r from-emerald-600 to-teal-600 text-white relative">
                            <h3 className="text-xl sm:text-2xl font-black mb-1">📢 إرسال إشعار جديد</h3>
                            <p className="text-emerald-50/80 text-xs sm:text-sm font-bold">تواصل مباشرة مع الطلاب أو المعلمين</p>
                        </div>

                        <div className="modal-body">
                            <form id="notification-form" onSubmit={handleSubmit} className="space-y-8">
                                {/* Type Selection */}
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setType('WARNING')}
                                        className={`p-3 md:p-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${type === 'WARNING' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <span className="text-lg">⚠️</span>
                                        <span className="text-sm">تنبيه</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('INFO')}
                                        className={`p-3 md:p-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${type === 'INFO' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <span className="text-lg">📢</span>
                                        <span className="text-sm">إشعار</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('PROPOSAL')}
                                        className={`p-3 md:p-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${type === 'PROPOSAL' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <span className="text-lg">💡</span>
                                        <span className="text-sm">مقترح</span>
                                    </button>
                                </div>

                                {/* Content Section */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 mr-1">عنوان الإشعار <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold dark:text-white text-sm sm:text-base"
                                            placeholder="مثال: موعد الاختبار القادم"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 mr-1">محتوى الإشعار <span className="text-red-500">*</span></label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-indigo-500 outline-none transition h-32 sm:h-40 resize-none font-bold dark:text-white text-sm sm:text-base"
                                            placeholder="اكتب تفاصيل الإشعار هنا..."
                                            required
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Attachments & Recipients Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Attachments Section */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">مرفقات (اختياري)</label>
                                            <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-900/50 p-1">
                                                <button type="button" onClick={() => setAttachmentMode('URL')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${attachmentMode === 'URL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>رابط مباشر</button>
                                                <button type="button" onClick={() => setAttachmentMode('FILE')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${attachmentMode === 'FILE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>رفع ملف</button>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-slate-100 dark:border-slate-700 min-h-[140px] flex flex-col justify-center">
                                            {attachmentMode === 'URL' ? (
                                                <div className="space-y-3">
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => setAttachmentType('IMAGE')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${attachmentType === 'IMAGE' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700'}`}>صورة</button>
                                                        <button type="button" onClick={() => setAttachmentType('LINK')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${attachmentType === 'LINK' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700'}`}>رابط / فيديو</button>
                                                    </div>
                                                    <input
                                                        type="url"
                                                        value={attachmentUrl}
                                                        onChange={(e) => setAttachmentUrl(e.target.value)}
                                                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 premium-glass text-slate-800 dark:text-white text-sm ltr outline-none focus:border-indigo-500"
                                                        placeholder={attachmentType === 'IMAGE' ? 'رابط الصورة...' : 'رابط الملف...'}
                                                        dir="ltr"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 transition hover:border-indigo-400 group cursor-pointer">
                                                    <input
                                                        type="file"
                                                        onChange={handleFileUpload}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        disabled={uploading}
                                                    />
                                                    <div className="text-center">
                                                        {uploading ? (
                                                            <div className="flex flex-col items-center">
                                                                <div className="relative w-12 h-12 flex items-center justify-center mb-3">
                                                                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                                                                    <div 
                                                                        className="absolute inset-0 border-4 border-indigo-600 rounded-full transition-all duration-300"
                                                                        style={{ 
                                                                            clipPath: `inset(0 0 0 ${100 - uploadProgress}%)`,
                                                                            transform: 'rotate(0deg)'
                                                                        }}
                                                                    ></div>
                                                                    <span className="text-[10px] font-black text-indigo-600">{uploadProgress}%</span>
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-400">جاري الرفع...</span>
                                                            </div>
                                                        ) : attachmentUrl ? (
                                                            <div className="flex flex-col items-center gap-3">
                                                                {attachmentType === 'IMAGE' ? (
                                                                    <div className="relative">
                                                                        <img src={attachmentUrl} alt="Preview" className="w-20 h-20 object-cover rounded-xl shadow-md border-2 border-white" />
                                                                        <button type="button" onClick={handleFileDelete} className="absolute -top-2 -left-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm">✕</button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                                        <span className="text-green-600 text-xl">📄</span>
                                                                        <button type="button" onClick={handleFileDelete} className="text-red-500 text-xs font-black">حذف الملف</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">📁</div>
                                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">اضغط لرفع ملف</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recipients Section */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">إلى من تريد الإرسال؟</label>
                                            {senderRole === 'SUPERVISOR' && (
                                                <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-900/50 p-1">
                                                    <button type="button" onClick={() => { setTargetType('STUDENT'); setSelectedRecipients([]); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${targetType === 'STUDENT' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>الطلاب</button>
                                                    <button type="button" onClick={() => { setTargetType('TEACHER'); setSelectedRecipients([]); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${targetType === 'TEACHER' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>المعلمين</button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-2 border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden flex flex-col h-[200px]">
                                            <div className="overflow-y-auto p-3 space-y-1 custom-scrollbar flex-1 bg-white dark:bg-transparent">
                                                {(targetType === 'STUDENT' ? students : teachers).map(item => (
                                                    <label key={item.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors group">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRecipients.includes(item.id)}
                                                            onChange={() => handleRecipientToggle(item.id)}
                                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm text-slate-700 dark:text-slate-300 font-bold group-hover:text-indigo-600 transition-colors">{item.name}</span>
                                                    </label>
                                                ))}
                                                {((targetType === 'STUDENT' ? students : teachers).length === 0) && (
                                                    <div className="p-8 text-center text-xs text-slate-400 font-bold italic">لا يوجد مستلمين متاحين</div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <input id="select-all" type="checkbox" checked={selectAll} onChange={(e) => handleSelectAll(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                                    <label htmlFor="select-all" className="text-xs font-bold text-slate-500 cursor-pointer">تحديد الكل</label>
                                                </div>
                                                <span className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 text-indigo-600 font-bold">{selectedRecipients.length} محدد</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="modal-footer flex gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    resetForm();
                                    setIsOpen(false);
                                }}
                                className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                form="notification-form"
                                disabled={loading || uploading}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none"
                            >
                                {loading ? 'جاري الإرسال...' : 'إرسال'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
