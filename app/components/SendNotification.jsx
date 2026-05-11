'use client';

import { useState } from 'react';
import { storage } from '@/app/lib/firebase';
import { ref } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import BaseModal from '@/app/components/Global/BaseModal';

// Sub-components
import NotificationTypePicker from './Notifications/NotificationTypePicker';
import NotificationForm from './Notifications/NotificationForm';
import AttachmentManager from './Notifications/AttachmentManager';
import RecipientSelector from './Notifications/RecipientSelector';

export default function SendNotification({ senderRole, senderId, students = [], teachers = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Form States
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('INFO');
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [attachmentType, setAttachmentType] = useState('IMAGE');
    const [attachmentMode, setAttachmentMode] = useState('URL');

    // Target Selection
    const [targetType, setTargetType] = useState('STUDENT');
    const [selectedRecipients, setSelectedRecipients] = useState([]);
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
                    toast.error("حدث خطأ أثناء رفع الملف");
                    setUploading(false);
                }, 
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    setAttachmentUrl(url);
                    setAttachmentType(file.type.startsWith('image/') ? 'IMAGE' : 'LINK');
                    setUploading(false);
                    setUploadProgress(100);
                    toast.success('تم رفع الملف بنجاح');
                }
            );
        } catch (error) {
            toast.error("حدث خطأ في الاتصال بخدمة التخزين");
            setUploading(false);
        }
    };

    const handleSelectAll = (checked) => {
        setSelectAll(checked);
        const list = targetType === 'STUDENT' ? students : teachers;
        setSelectedRecipients(checked ? list.map(i => i.id) : []);
    };

    const handleRecipientToggle = (id) => {
        setSelectedRecipients(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
        setSelectAll(false);
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
                    title, message, type,
                    attachmentUrl: attachmentUrl || null,
                    attachmentType: attachmentUrl ? attachmentType : null,
                    senderId, senderRole,
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
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-500/80 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>إرسال إشعار</span>
            </button>

            <BaseModal 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)} 
                maxWidth="max-w-2xl"
                hideHeader={true}
                noPadding={true}
            >
                <div className="flex flex-col h-[calc(90vh-1rem)] bg-white dark:bg-slate-900 overflow-hidden" dir="rtl">
                    {/* Header Section */}
                    <div className="bg-indigo-600 p-8 sm:p-10 relative overflow-hidden shrink-0 shadow-lg z-20">
                        <div className="relative z-10 flex justify-between items-center">
                            <div className="text-right">
                                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">إرسال إشعار جديد</h2>
                                <p className="text-indigo-100 font-bold mt-0.5 text-xs sm:text-sm">تواصل بفعالية مع مجتمع الحلقات</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                    </div>

                    {/* Body Section with subtle "Shade" separation */}
                    <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50 dark:bg-slate-950/20 z-10">
                        <form id="notification-form" onSubmit={handleSubmit} className="space-y-8 pb-4">
                            <NotificationTypePicker 
                                selectedType={type} 
                                onTypeChange={setType} 
                            />

                            <NotificationForm 
                                title={title} 
                                setTitle={setTitle} 
                                message={message} 
                                setMessage={setMessage} 
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <RecipientSelector 
                                    targetType={targetType}
                                    setTargetType={setTargetType}
                                    students={students}
                                    teachers={teachers}
                                    selectedRecipients={selectedRecipients}
                                    handleRecipientToggle={handleRecipientToggle}
                                    selectAll={selectAll}
                                    handleSelectAll={handleSelectAll}
                                    senderRole={senderRole}
                                />

                                <AttachmentManager 
                                    attachmentMode={attachmentMode}
                                    setAttachmentMode={setAttachmentMode}
                                    attachmentUrl={attachmentUrl}
                                    setAttachmentUrl={setAttachmentUrl}
                                    attachmentType={attachmentType}
                                    setAttachmentType={setAttachmentType}
                                    handleFileUpload={handleFileUpload}
                                    uploading={uploading}
                                    uploadProgress={uploadProgress}
                                />
                            </div>
                        </form>
                    </div>

                    {/* Footer Section */}
                    <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex gap-4 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-20">
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
            </BaseModal>
        </>
    );
}
