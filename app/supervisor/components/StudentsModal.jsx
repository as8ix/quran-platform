'use client';

export default function StudentsModal({
    show,
    onClose,
    selectedHalaqaName,
    selectedHalaqaStudents,
    loadingStudents,
    searchStudentInModal,
    setSearchStudentInModal,
    togglingId,
    deletingId,
    onToggleFee,
    onEditStudent,
    onDeleteStudent,
    onResetPassword,
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-[12px] md:backdrop-blur-[20px]">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 animate-fadeIn" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-slideUp border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-[2.5rem]">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <h3 className="text-2xl font-black tracking-tight mb-1">طلاب {selectedHalaqaName}</h3>
                        <div className="mt-4 w-full max-w-xs relative">
                            <input
                                type="text"
                                placeholder="بحث عن طالب..."
                                value={searchStudentInModal}
                                onChange={(e) => setSearchStudentInModal(e.target.value)}
                                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 outline-none focus:bg-white/30 transition-all text-sm font-bold"
                            />
                            <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                    {loadingStudents ? (
                        <div className="flex flex-col items-center py-12">
                            <div className="w-10 h-10 border-4 border-slate-100 dark:border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
                            <p className="text-slate-400 font-bold mt-4">جاري التحميل...</p>
                        </div>
                    ) : selectedHalaqaStudents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {selectedHalaqaStudents
                                .filter(s => s.name.toLowerCase().includes(searchStudentInModal.toLowerCase()))
                                .map((s, idx) => (
                                <div key={s.id} className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-[1.5rem] border border-transparent hover:border-emerald-500/20 transition-all group">
                                    <div className="w-10 h-10 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl text-[11px] font-black text-slate-400 group-hover:text-emerald-600 shadow-sm flex items-center justify-center">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-black text-sm text-slate-800 dark:text-white truncate leading-tight">{s.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">الرسوم:</span>
                                            <div className="flex gap-1.5">
                                                {[
                                                    { key: 'feeStatusTerm1', label: 'ت1' },
                                                    { key: 'feeStatusTerm2', label: 'ت2' },
                                                    { key: 'feeStatusSummer', label: 'ص' }
                                                ].map(term => {
                                                    const isToggling = togglingId === `${s.id}-${term.key}`;
                                                    return (
                                                        <button
                                                            key={term.key}
                                                            disabled={isToggling}
                                                            onClick={() => onToggleFee(s.id, term.key, s[term.key])}
                                                            title={`${term.label}: ${s[term.key] === 'PAID' ? 'تم الدفع' : 'لم يدفع'}`}
                                                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                                                isToggling ? 'animate-pulse bg-slate-200' :
                                                                s[term.key] === 'PAID' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                                            }`}
                                                        >
                                                            {isToggling ? (
                                                                <div className="w-2 h-2 border border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                                            ) : (
                                                                <span className="text-[7px] font-black">{term.label}</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onResetPassword(s.id, s.name, 'STUDENT')}
                                            className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:text-white hover:bg-amber-600 rounded-xl transition-all border border-transparent shadow-sm"
                                            title="إعادة تعيين كلمة المرور"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onEditStudent(s)}
                                            className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-500 rounded-xl transition-all border border-transparent hover:border-emerald-500/20 shadow-sm"
                                            title="تعديل بيانات الطالب"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onDeleteStudent(s.id, s.name)}
                                            disabled={deletingId === `student-${s.id}`}
                                            className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/20 shadow-sm disabled:opacity-50"
                                            title="حذف الطالب نهائياً"
                                        >
                                            {deletingId === `student-${s.id}` ? (
                                                <div className="w-4 h-4 border border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            )}
                                        </button>
                                        <div className="relative flex h-2 w-2 flex-shrink-0">
                                            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
                                            <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4 opacity-20">👥</div>
                            <h3 className="text-slate-400 dark:text-slate-500 font-bold">لا يوجد طلاب</h3>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-shrink-0">
                    <button onClick={onClose} className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black rounded-[1.5rem] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-lg">إغلاق</button>
                </div>
            </div>
        </div>
    );
}
