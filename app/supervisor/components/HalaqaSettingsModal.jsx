'use client';

export default function HalaqaSettingsModal({
    show,
    onClose,
    selectedHalaqa,
    togglingId,
    isResetting,
    onTogglePoints,
    onResetPoints,
}) {
    if (!show || !selectedHalaqa) return null;

    return (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 backdrop-blur-xl">
            <div className="absolute inset-0 bg-slate-900/60" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden">
                <div className="p-8 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-black">إعدادات الأنشطة</h3>
                            <p className="text-slate-400 text-sm font-bold mt-1">{selectedHalaqa.name}</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-2xl hover:bg-white/20 transition-all">✕</button>
                    </div>
                </div>
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all group hover:border-emerald-500/30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🪙</div>
                            <div>
                                <h4 className="font-black text-slate-800 dark:text-white">نشاط رصد النقاط</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-0.5">تفعيل رصد النقاط للمعلم والطلاب</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-5 mr-4">
                            {/* Reset Points */}
                            <div className="flex flex-col items-center gap-1.5">
                                <button
                                    onClick={() => onResetPoints(selectedHalaqa.id)}
                                    disabled={isResetting}
                                    className="w-10 h-10 flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90 border border-rose-100 dark:border-rose-800 disabled:opacity-50 shadow-sm"
                                >
                                    {isResetting ? <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div> : <span className="text-lg">🧹</span>}
                                </button>
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">تصفير</span>
                            </div>

                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700/50"></div>

                            {/* Toggle */}
                            <div className="flex flex-col items-center gap-1.5">
                                <button
                                    onClick={() => onTogglePoints(selectedHalaqa.id, selectedHalaqa.pointsEnabled)}
                                    className={`w-12 h-7 rounded-full transition-all relative ${selectedHalaqa.pointsEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-all ${selectedHalaqa.pointsEnabled ? 'right-5.5' : 'right-0.5 shadow-sm'}`}></div>
                                </button>
                                <span className={`text-[9px] font-black uppercase tracking-tighter ${selectedHalaqa.pointsEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {selectedHalaqa.pointsEnabled ? 'مفعل' : 'تفعيل'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center opacity-50">
                        <span className="text-2xl mb-2">➕</span>
                        <p className="text-slate-400 text-xs font-bold">يمكنك إضافة أنشطة برمجية أخرى مستقبلاً</p>
                    </div>
                </div>
                <div className="p-6 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button onClick={onClose} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-lg active:scale-95 transition-all">إغلاق</button>
                </div>
            </div>
        </div>
    );
}
