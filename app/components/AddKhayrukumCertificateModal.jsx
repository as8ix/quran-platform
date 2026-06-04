'use client';

import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

export default function AddKhayrukumCertificateModal({ isOpen, onClose, onSuccess, student, teacher }) {
    const [title, setTitle] = useState('');
    const [branchNumber, setBranchNumber] = useState('');
    const [examDate, setExamDate] = useState('');
    const [grade, setGrade] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const maxFileSize = 5 * 1024 * 1024; // 5MB
            if (selectedFile.size > maxFileSize) {
                toast.error('حجم الملف يجب أن لا يتجاوز 5 ميجابايت');
                return;
            }
            setFile(selectedFile);
        }
    };

    const uploadFile = async (file) => {
        const presignRes = await fetch('/api/upload/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
            }),
        });

        if (!presignRes.ok) {
            throw new Error('فشل في تحضير رابط الرفع');
        }

        const { uploadUrl, fileUrl } = await presignRes.json();

        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type,
            },
            body: file,
        });

        if (!uploadRes.ok) {
            throw new Error('فشل رفع الملف إلى الخادم');
        }

        return fileUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!branchNumber || !examDate || !grade || !file) {
            toast.error('الرجاء تعبئة جميع الحقول وإرفاق الشهادة');
            return;
        }

        setLoading(true);
        try {
            toast.loading('جاري رفع الملف...', { id: 'upload' });
            const fileUrl = await uploadFile(file);
            
            toast.loading('جاري حفظ البيانات...', { id: 'upload' });
            
            const res = await fetch('/api/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: student.id,
                    teacherId: teacher.id,
                    title,
                    branchNumber: parseInt(branchNumber),
                    examDate,
                    grade: parseFloat(grade),
                    fileUrl
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'حدث خطأ أثناء حفظ الشهادة');
            }

            toast.success('تمت إضافة الشهادة وإشعار الطالب بنجاح!', { id: 'upload' });
            
            // Reset state
            setTitle('');
            setBranchNumber('');
            setExamDate('');
            setGrade('');
            setFile(null);

            const resultData = await res.json();
            if (onSuccess && resultData.certificate) {
                onSuccess(resultData.certificate);
            } else {
                onClose();
            }

        } catch (error) {
            console.error(error);
            toast.error(error.message || 'حدث خطأ غير متوقع', { id: 'upload' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm rtl font-noto" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-sky-50/50 dark:bg-sky-900/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <span>📜</span>
                            إضافة شهادة لـ {student?.name}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عنوان الشهادة (اختياري)</label>
                            <input 
                                type="text"
                                placeholder="مثال: شهادة إتمام جزء عم"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all dark:text-white"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">رقم الفرع المختبر</label>
                            <select 
                                value={branchNumber}
                                onChange={(e) => setBranchNumber(e.target.value)}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all dark:text-white"
                            >
                                <option value="">-- اختر الفرع --</option>
                                {[...Array(10)].map((_, i) => (
                                    <option key={i+1} value={i+1}>الفرع {i+1}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ الاختبار</label>
                            <input 
                                type="date"
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الدرجة (%)</label>
                            <input 
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="مثال: 95.5"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ملف الشهادة (صورة أو PDF)</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors
                                ${file ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                            `}
                        >
                            <input 
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*,application/pdf"
                                className="hidden"
                            />
                            {file ? (
                                <div className="text-sky-600 dark:text-sky-400">
                                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span className="font-bold text-sm block truncate px-4">{file.name}</span>
                                    <span className="text-xs opacity-75 mt-1">اضغط للتغيير</span>
                                </div>
                            ) : (
                                <div className="text-slate-500 dark:text-slate-400">
                                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                    <span className="font-bold text-sm block">اضغط لاختيار ملف</span>
                                    <span className="text-xs opacity-75 mt-1">الحد الأقصى 5 ميجابايت</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors w-1/3"
                        >
                            إلغاء
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-200/50 dark:shadow-none transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed w-2/3 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    جاري الحفظ...
                                </>
                            ) : 'إضافة وتوثيق الشهادة'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
