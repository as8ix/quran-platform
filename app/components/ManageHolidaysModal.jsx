'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function ManageHolidaysModal({ isOpen, onClose }) {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchHolidays();
        }
    }, [isOpen]);

    const fetchHolidays = async () => {
        try {
            const res = await fetch('/api/holidays');
            if (res.ok) {
                const data = await res.json();
                setHolidays(data);
            }
        } catch (error) {
            console.error('Error fetching holidays:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId 
                ? { id: editingId, name, startDate, endDate }
                : { name, startDate, endDate };

            const res = await fetch('/api/holidays', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success(editingId ? 'تم تحديث الإجازة بنجاح' : 'تمت إضافة الإجازة بنجاح');
                setName('');
                setStartDate('');
                setEndDate('');
                setEditingId(null);
                fetchHolidays();
            } else {
                toast.error(editingId ? 'فشل في تحديث الإجازة' : 'فشل في إضافة الإجازة');
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء العملية');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (h) => {
        setEditingId(h.id);
        setName(h.name);
        setStartDate(new Date(h.startDate).toISOString().split('T')[0]);
        setEndDate(new Date(h.endDate).toISOString().split('T')[0]);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setName('');
        setStartDate('');
        setEndDate('');
    };

    const handleDeleteHoliday = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        console.log('--- Start handleDeleteHoliday ---');
        console.log('Current confirmDeleteId:', confirmDeleteId);
        
        if (!confirmDeleteId) {
            console.error('No ID to delete!');
            return;
        }

        setDeleting(true);
        try {
            const apiUrl = `${window.location.origin}/api/holidays?id=${confirmDeleteId}`;
            console.log('Fetching URL:', apiUrl);

            const res = await fetch(apiUrl, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            console.log('Response Status:', res.status);
            const data = await res.json();
            console.log('Response Data:', data);

            if (res.ok) {
                toast.success('تم حذف الإجازة بنجاح');
                setConfirmDeleteId(null);
                fetchHolidays();
            } else {
                toast.error(data.error || 'فشل في الحذف');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setDeleting(false);
            console.log('--- End handleDeleteHoliday ---');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black text-slate-800 dark:text-white">إدارة الإجازات الرسمية</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 mb-10 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 relative">
                            {editingId && (
                                <div className="absolute -top-3 right-6 px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-lg animate-bounce">
                                    وضع التعديل
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-500 mb-2">اسم الإجازة / المناسبة</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="مثلاً: عيد الأضحى المبارك"
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2">من تاريخ</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2">إلى تاريخ</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'جاري الحفظ...' : (editingId ? 'تحديث الإجازة' : 'إضافة إجازة جديدة')}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="px-6 py-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 transition-all"
                                    >
                                        إلغاء
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="text-slate-400 text-sm border-b border-slate-100 dark:border-slate-800">
                                        <th className="pb-4 font-black">المناسبة</th>
                                        <th className="pb-4 font-black text-center">الفترة</th>
                                        <th className="pb-4 font-black text-left">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {holidays.map((h) => (
                                        <tr key={h.id} className="group">
                                            <td className="py-4 font-bold text-slate-700 dark:text-slate-200">{h.name}</td>
                                            <td className="py-4 text-center">
                                                <div className="text-xs font-medium text-slate-400">
                                                    {new Date(h.startDate).toLocaleDateString('ar-SA')} - {new Date(h.endDate).toLocaleDateString('ar-SA')}
                                                </div>
                                            </td>
                                            <td className="py-4 text-left flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(h)}
                                                    className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                    title="تعديل"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        console.log('Setting confirmDeleteId for holiday:', h.id);
                                                        setConfirmDeleteId(h.id);
                                                    }}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                    title="حذف"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {holidays.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="py-10 text-center text-slate-400 italic">لا توجد إجازات مضافة حالياً</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Confirmation Modal - Outside management modal container */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
                        onClick={() => setConfirmDeleteId(null)}
                    ></div>
                    <div 
                        className="relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 max-w-sm w-full text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">تأكيد الحذف</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">هل أنت متأكد؟ سيتم حذف هذه الإجازة نهائياً.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteHoliday}
                                disabled={deleting}
                                className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black shadow-lg hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {deleting ? 'جاري...' : 'نعم، احذف'}
                            </button>
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black hover:bg-slate-200 transition-all active:scale-95"
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
