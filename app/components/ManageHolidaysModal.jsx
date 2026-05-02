'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function ManageHolidaysModal({ isOpen, onClose, halaqas = [] }) {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [halaqaId, setHalaqaId] = useState(''); // New field
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
        
        if (!name || !startDate || !endDate) {
            toast.error('يرجى تعبئة كافة الحقول المطلوبة');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            toast.error('تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية');
            return;
        }

        setLoading(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId 
                ? { id: editingId, name, startDate, endDate, halaqaId }
                : { name, startDate, endDate, halaqaId };

            const res = await fetch('/api/holidays', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success(editingId ? 'تم تحديث الإجازة بنجاح' : 'تمت إضافة الإجازة بنجاح');
                resetForm();
                fetchHolidays();
            } else {
                const errorData = await res.json();
                toast.error(errorData.details || errorData.error || (editingId ? 'فشل في تحديث الإجازة' : 'فشل في إضافة الإجازة'));
            }
        } catch (error) {
            toast.error('حدث خطأ غير متوقع');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setStartDate('');
        setEndDate('');
        setHalaqaId('');
        setEditingId(null);
    };

    const handleEditClick = (h) => {
        setEditingId(h.id);
        setName(h.name);
        setStartDate(new Date(h.startDate).toISOString().split('T')[0]);
        setEndDate(new Date(h.endDate).toISOString().split('T')[0]);
        setHalaqaId(h.halaqaId ? h.halaqaId.toString() : '');
    };

    const handleDeleteHoliday = async () => {
        if (!confirmDeleteId) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/holidays?id=${confirmDeleteId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('تم حذف الإجازة بنجاح');
                setConfirmDeleteId(null);
                fetchHolidays();
            } else {
                const data = await res.json();
                toast.error(data.error || 'فشل في الحذف');
            }
        } catch (error) {
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 md:p-10 backdrop-blur-[12px] md:backdrop-blur-[20px] animate-fadeIn">
                <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl max-h-[90vh] bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] animate-slideUp border border-white/20 dark:border-slate-800 flex flex-col overflow-hidden">
                    <div className="p-8 pb-4 flex justify-between items-center shrink-0">
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">إدارة الإجازات</h2>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-2">
                        <form onSubmit={handleSubmit} className="space-y-6 mb-10 bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative group">
                            {editingId && (
                                <div className="absolute -top-3 right-6 px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-lg">
                                    وضع التعديل
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-400 mb-2">اسم الإجازة</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="مثلاً: إجازة عيد الفطر"
                                        className="w-full px-5 py-4 bg-white dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 outline-none font-bold dark:text-white transition-all hover:border-slate-200 dark:hover:border-slate-700"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">من تاريخ</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-5 py-4 bg-white dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 outline-none font-bold dark:text-white transition-all hover:border-slate-200 dark:hover:border-slate-700"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">إلى تاريخ</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-5 py-4 bg-white dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 outline-none font-bold dark:text-white transition-all hover:border-slate-200 dark:hover:border-slate-700"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-400 mb-2">تطبيق على</label>
                                    <div className="relative group">
                                        <select
                                            value={halaqaId}
                                            onChange={(e) => setHalaqaId(e.target.value)}
                                            className="w-full px-5 py-4 bg-white dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 outline-none font-bold dark:text-white appearance-none transition-all cursor-pointer group-hover:border-slate-200 dark:group-hover:border-slate-700"
                                        >
                                            <option value="" className="dark:bg-slate-900">كافة الحلقات (إجازة عامة)</option>
                                            {halaqas.map(h => (
                                                <option key={h.id} value={h.id} className="dark:bg-slate-900">{h.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'جاري الحفظ...' : (editingId ? 'حفظ التعديلات' : 'إضافة الإجازة')}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-300 transition-all"
                                    >
                                        إلغاء
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <th className="pb-4 font-black">المناسبة</th>
                                        <th className="pb-4 font-black">النطاق</th>
                                        <th className="pb-4 font-black text-center">الفترة</th>
                                        <th className="pb-4 font-black text-left">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {holidays.map((h) => {
                                        const hHalaqa = halaqas.find(hal => hal.id === h.halaqaId);
                                        return (
                                            <tr key={h.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-5 font-bold text-slate-700 dark:text-slate-200 text-sm">{h.name}</td>
                                                <td className="py-5">
                                                    <span className={`text-[9px] font-black px-3 py-1.5 rounded-full ${h.halaqaId ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                                        {hHalaqa ? hHalaqa.name : 'إجازة عامة'}
                                                    </span>
                                                </td>
                                                <td className="py-5 text-center">
                                                    <div className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded-lg">
                                                        {new Date(h.startDate).toLocaleDateString('ar-EG')} - {new Date(h.endDate).toLocaleDateString('ar-EG')}
                                                    </div>
                                                </td>
                                                <td className="py-5 text-left flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleEditClick(h)}
                                                        className="w-9 h-9 flex items-center justify-center text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-xl transition-all"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(h.id)}
                                                        className="w-9 h-9 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {holidays.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-10 text-center text-slate-400 italic text-sm">لا توجد إجازات مضافة</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {confirmDeleteId && (
                <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setConfirmDeleteId(null)}></div>
                    <div className="relative bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-white/20 dark:border-slate-800 max-w-sm w-full text-center backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner">⚠️</div>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">حذف الإجازة</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed">هل أنت متأكد من حذف هذه الإجازة؟ لا يمكن التراجع عن هذا الإجراء.</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleDeleteHoliday}
                                disabled={deleting}
                                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {deleting ? 'جاري الحذف...' : 'نعم، احذف الإجازة'}
                            </button>
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
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
