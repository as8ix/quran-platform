'use client';

export default function SessionManagement({
    sessionType,
    sessionDate,
    setSessionDate,
    setShowCancelModal,
    activeEvent,
    isQuranicDaySession,
    children
}) {
    return (
        <div className="premium-glass rounded-[3rem] p-10 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Title and Date */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
                <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                    <span className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">✍️</span>
                    {sessionType === 'HIFZ' ? 'تسجيل حفظ جديد' : sessionType === 'MURAJAAH' ? 'تسجيل مراجعة' : 'تسجيل حفظ ومراجعة'}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-2 whitespace-nowrap">تاريخ الجلسة</label>
                        <input
                            type="datetime-local"
                            value={sessionDate}
                            onChange={(e) => setSessionDate(e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-emerald-400 rounded-xl outline-none font-bold text-sm text-slate-700 dark:text-slate-200 shadow-sm w-full md:w-auto"
                            required
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-xs font-black hover:bg-red-100 transition-colors"
                    >
                        إلغاء ✕
                    </button>
                </div>
            </div>

            {/* Quranic Day Active Banner */}
            {activeEvent && isQuranicDaySession && (
                <div className="mb-8 p-6 rounded-[2rem] border-2 bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800 shadow-lg shadow-amber-100 dark:shadow-none flex justify-between items-center animate-pulse-slow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-amber-100 dark:bg-amber-900/30">🏆</div>
                        <div>
                            <div className="font-black text-amber-900 dark:text-amber-200 leading-tight">دورة الأيام القرآنية: {activeEvent.name}</div>
                            <div className="text-xs font-bold text-amber-600 dark:text-amber-400">هذا الطالب مسند إليك في هذه الدورة. سيتم احتساب الجلسة في الإحصائيات.</div>
                        </div>
                    </div>
                    <div className="bg-amber-500 dark:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm">
                        تسجيل معتمد
                    </div>
                </div>
            )}

            <div className="space-y-10">
                {/* Premium Quality Warning Banner */}
                <div className="mb-8 p-5 rounded-[2rem] bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative group transition-all duration-500 hover:scale-[1.01]">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 dark:bg-red-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                    <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>

                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-amber-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-red-500/20 animate-pulse-slow">
                            ⚠️
                        </div>
                        <div className="flex-1 text-right">
                            <div className="text-sm sm:text-base font-black text-slate-800 dark:text-white leading-tight mb-1">
                                معيار جودة الجلسة والتقييم
                            </div>
                            <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-wide">
                                "الصفحة الواحدة مسموح فيها خطأ واحد وتنبيهان" <span className="text-red-500 dark:text-red-400 font-black">- غير ذلك يرجع الطالب -</span>
                            </div>
                        </div>
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
}
