'use client';

export default function TeacherModal({
    show,
    onClose,
    onSubmit,
    submitting,
    isEditing,
    teacher,
    setTeacher,
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-[12px] md:backdrop-blur-[20px]">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 animate-fadeIn" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col">
                <div className={`p-8 ${isEditing ? 'bg-indigo-600' : 'bg-emerald-600'} text-white`}>
                    <h3 className="text-2xl font-black">{isEditing ? 'تعديل المعلم' : 'إضافة معلم'}</h3>
                </div>
                <div className="p-8">
                    <form id="teacher-form" onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase">الاسم</label>
                            <input type="text" required value={teacher.name} onChange={e => setTeacher({ ...teacher, name: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold dark:text-white" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase">اسم المستخدم</label>
                            <input type="text" required value={teacher.username} onChange={e => setTeacher({ ...teacher, username: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold dark:text-white" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase">كلمة المرور</label>
                            <input type="text" required value={teacher.password} onChange={e => setTeacher({ ...teacher, password: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold dark:text-white" />
                        </div>
                    </form>
                </div>
                <div className="p-8 border-t flex gap-4">
                    <button onClick={onClose} className="flex-1 font-black text-slate-600 dark:text-slate-400">إلغاء</button>
                    <button type="submit" form="teacher-form" disabled={submitting} className={`flex-[2] py-4 rounded-2xl text-white font-black ${isEditing ? 'bg-indigo-600' : 'bg-emerald-600'} disabled:opacity-50`}>
                        {submitting ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                </div>
            </div>
        </div>
    );
}
