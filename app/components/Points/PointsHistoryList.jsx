'use client';

import { formatHijri } from '@/app/utils/dateUtils';

export default function PointsHistoryList({ pointsLog, categories }) {
    return (
        <div className="space-y-6">
            <div className="premium-glass p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                    <span className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-2xl">📜</span> 
                    آخر عمليات الرصد لطلابك
                </h2>
                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {pointsLog.length > 0 ? pointsLog.map((log, i) => (
                        <div key={i} className="p-5 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
                                {categories.find(c => c.id === log.category)?.icon || '⭐'}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-black text-slate-800 dark:text-slate-200">{log.student?.name || 'طالب غير معروف'}</span>
                                    <span className={log.amount < 0 ? "text-rose-600 font-black" : "text-emerald-600 font-black"}>
                                        {log.amount > 0 ? '+' : ''}{log.amount}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <div className="text-[10px] text-slate-400 font-bold italic">{log.reason}</div>
                                    <div className="text-[10px] text-slate-400 font-black flex items-center gap-2">
                                        <span>📅 {formatHijri(log.createdAt, 'short')}</span>
                                        <span className="opacity-50">|</span>
                                        <span>🕒 {new Date(log.createdAt).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-slate-400 font-bold">لا يوجد عمليات رصد مسجلة مؤخراً</div>
                    )}
                </div>
            </div>
        </div>
    );
}
