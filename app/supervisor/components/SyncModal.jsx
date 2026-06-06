'use client';

export default function SyncModal({ show, onClose, onSync, syncOptions, setSyncOptions }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 backdrop-blur-xl">
            <div className="absolute inset-0 bg-slate-900/60" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden animate-slideUp">
                <div className="p-8 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-center">
                    <h3 className="text-2xl font-black mb-1">تخصيص مزامنة Google Sheets</h3>
                    <p className="text-amber-100 font-bold text-sm">اختر الحقول والبيانات التي تريد مزامنتها بدقة</p>
                </div>

                <div className="p-8 space-y-4">
                    <div className="space-y-3">
                        {[
                            { key: 'syncNames', label: 'تحديث أسماء الطلاب (الأسماء الرباعية)', desc: 'تحديث صيغة الاسم لتصبح رباعية مطابقة للشيت' },
                            { key: 'syncNationalIds', label: 'مزامنة أرقام الهوية', desc: 'تحديث أرقام الهوية الوطنية أو الإقامة للطلاب المطابقين' },
                            { key: 'syncPhones', label: 'مزامنة أرقام الجوال', desc: 'تحديث جوال الطالب وجوال ولي الأمر من الشيت' },
                            { key: 'syncHalaqas', label: 'تحديث الحلقات والمراحل', desc: 'إعادة ربط وتحديث حلقات الطلاب (ما عدا التكرار)' },
                            { key: 'addNewStudents', label: 'إضافة طلاب جدد', desc: 'إنشاء حسابات جديدة للطلاب الغير مسجلين بالمنصة' }
                        ].map(opt => (
                            <label key={opt.key} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/80 text-right" style={{ direction: 'rtl' }}>
                                <input
                                    type="checkbox"
                                    checked={syncOptions[opt.key]}
                                    onChange={(e) => setSyncOptions({ ...syncOptions, [opt.key]: e.target.checked })}
                                    className="mt-1 rounded border-slate-300 text-amber-500 focus:ring-amber-500 ml-3"
                                />
                                <div>
                                    <div className="font-black text-slate-800 dark:text-white text-sm">{opt.label}</div>
                                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{opt.desc}</div>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="flex gap-4 mt-6">
                        <button onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm">إلغاء</button>
                        <button onClick={onSync} className="flex-[2] py-4 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 dark:shadow-none text-sm">بدء المزامنة 🔄</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
