'use client';

import { useState, useEffect } from 'react';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function SendNotification({ senderRole, senderId, students = [], teachers = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

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

        setUploading(true);
        try {
            const fileRef = ref(storage, `notifications/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            setAttachmentUrl(url);
            // Auto-detect image
            if (file.type.startsWith('image/')) {
                setAttachmentType('IMAGE');
            } else {
                setAttachmentType('LINK');
            }
        } catch (error) {
            console.error(error);
            alert('خطأ في رفع الملف');
        } finally {
            setUploading(false);
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
            alert('الرجاء تعبئة جميع الحقول المطلوبة واختيار مستلم واحد على الأقل');
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
            alert('تم إرسال الإشعارات بنجاح ✅');
            resetForm();
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الإرسال');
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

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                            <h3 className="text-xl font-black text-slate-800">إرسال إشعار جديد</h3>
                            <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition">✕</button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Type Selection */}
                                <div className="grid grid-cols-3 gap-3">
                                    <button type="button" onClick={() => setType('WARNING')} className={`p-3 rounded-xl border-2 font-bold text-sm transition ${type === 'WARNING' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 text-slate-400'}`}>
                                        ⚠️ تنبيه (أحمر)
                                    </button>
                                    <button type="button" onClick={() => setType('INFO')} className={`p-3 rounded-xl border-2 font-bold text-sm transition ${type === 'INFO' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}>
                                        📢 إشعار (أزرق)
                                    </button>
                                    <button type="button" onClick={() => setType('PROPOSAL')} className={`p-3 rounded-xl border-2 font-bold text-sm transition ${type === 'PROPOSAL' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-400'}`}>
                                        💡 مقترح (أخضر)
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الإشعار <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition font-bold"
                                            placeholder="مثال: موعد الاختبار القادم"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">محتوى الإشعار <span className="text-red-500">*</span></label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition h-32 resize-none"
                                            placeholder="اكتب تفاصيل الإشعار هنا..."
                                            required
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Attachments */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-bold text-slate-700">مرفقات (اختياري)</label>
                                        <div className="flex gap-2 rounded-lg bg-white shadow-sm p-1">
                                            <button type="button" onClick={() => setAttachmentMode('URL')} className={`px-3 py-1 rounded-md text-xs font-bold transition ${attachmentMode === 'URL' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>رابط مباشر</button>
                                            <button type="button" onClick={() => setAttachmentMode('FILE')} className={`px-3 py-1 rounded-md text-xs font-bold transition ${attachmentMode === 'FILE' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>رفع ملف</button>
                                        </div>
                                    </div>

                                    {attachmentMode === 'URL' ? (
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setAttachmentType('IMAGE')} className={`px-3 py-1 rounded-lg text-xs font-bold ${attachmentType === 'IMAGE' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-500 border'}`}>صورة</button>
                                                <button type="button" onClick={() => setAttachmentType('LINK')} className={`px-3 py-1 rounded-lg text-xs font-bold ${attachmentType === 'LINK' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-500 border'}`}>رابط / فيديو</button>
                                            </div>
                                            <input
                                                type="url"
                                                value={attachmentUrl}
                                                onChange={(e) => setAttachmentUrl(e.target.value)}
                                                className="w-full p-2 rounded-lg border border-slate-200 text-sm ltr direction-force-ltr placeholder:text-right"
                                                placeholder={attachmentType === 'IMAGE' ? 'رابط الصورة...' : 'رابط الفيديو أو الملف...'}
                                                dir="ltr"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 transition hover:border-indigo-300">
                                                <input
                                                    type="file"
                                                    onChange={handleFileUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    disabled={uploading}
                                                />
                                                <div className="text-center">
                                                    {uploading ? (
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                                                            <span className="text-xs font-bold text-slate-500">جاري الرفع...</span>
                                                        </div>
                                                    ) : attachmentUrl ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className="text-green-600 text-lg">✅</span>
                                                            <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">تم رفع الملف بنجاح</span>
                                                            <button type="button" onClick={() => setAttachmentUrl('')} className="text-red-500 hover:text-red-700 underline text-xs">حذف</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-2xl mb-1">📁</span>
                                                            <span className="text-xs font-bold text-slate-500 text-center">اضغط هنا أو اسحب الملف لرفعه</span>
                                                            <span className="text-[10px] text-slate-400 mt-1">صور، ملفات، فيديوهات قصيرة</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Recipients */}
                                <div>
                                    <h4 className="font-bold text-slate-700 mb-3 flex justify-between items-center">
                                        <span>إلى من تريد الإرسال؟</span>
                                        {senderRole === 'SUPERVISOR' && (
                                            <div className="flex gap-2 rounded-lg bg-slate-100 p-1">
                                                <button type="button" onClick={() => { setTargetType('STUDENT'); setSelectedRecipients([]); }} className={`px-3 py-1 rounded-md text-xs font-bold ${targetType === 'STUDENT' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>الطلاب</button>
                                                <button type="button" onClick={() => { setTargetType('TEACHER'); setSelectedRecipients([]); }} className={`px-3 py-1 rounded-md text-xs font-bold ${targetType === 'TEACHER' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>المعلمين</button>
                                            </div>
                                        )}
                                    </h4>

                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-3">
                                            <input type="checkbox" checked={selectAll} onChange={(e) => handleSelectAll(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-sm font-bold text-slate-600">تحديد الكل</span>
                                            <span className="text-xs text-slate-400 mr-auto">{selectedRecipients.length} محدد</span>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                            {(targetType === 'STUDENT' ? students : teachers).map(item => (
                                                <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRecipients.includes(item.id)}
                                                        onChange={() => handleRecipientToggle(item.id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-slate-700 font-medium">{item.name}</span>
                                                </label>
                                            ))}
                                            {((targetType === 'STUDENT' ? students : teachers).length === 0) && (
                                                <div className="p-4 text-center text-sm text-slate-400">لا يوجد بيانات للعرض</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || uploading}
                                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'جاري الإرسال...' : 'إرسال الإشعار 🚀'}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
