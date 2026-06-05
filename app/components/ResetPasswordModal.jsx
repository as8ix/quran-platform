import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ResetPasswordModal({ isOpen, onClose, targetId, targetName, role, onResetSuccess }) {
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 3) {
            toast.error('كلمة المرور يجب أن تكون 3 أحرف على الأقل');
            return;
        }

        setIsSubmitting(true);
        try {
            const endpoint = role === 'TEACHER' ? '/api/teachers/reset-password' : '/api/students/reset-password';
            const payload = role === 'TEACHER' ? { teacherId: targetId, newPassword } : { studentId: targetId, newPassword };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('تمت إعادة تعيين كلمة المرور بنجاح');
                if (onResetSuccess) onResetSuccess();
                setNewPassword('');
                onClose();
            } else {
                const data = await res.json();
                toast.error(data.error || 'فشل في العملية');
            }
        } catch (error) {
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-[12px] md:backdrop-blur-[20px]" dir="rtl">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 animate-fadeIn" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col">
                <div className="p-6 bg-rose-600 text-white flex items-center gap-3">
                    <span className="text-2xl">🔑</span>
                    <h3 className="text-xl font-black">إعادة تعيين كلمة المرور</h3>
                </div>
                <div className="p-6">
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-6">
                        أدخل كلمة المرور الجديدة لـ: <span className="text-rose-600 dark:text-rose-400">{targetName}</span>
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <input 
                                type="text" 
                                required 
                                placeholder="كلمة المرور الجديدة"
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-rose-500 rounded-2xl outline-none font-bold dark:text-white" 
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغيير'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
