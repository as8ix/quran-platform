'use client';

export default function NotificationTypePicker({ selectedType, onTypeChange }) {
    const types = [
        { id: 'INFO', label: 'إشعار', color: 'blue', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'WARNING', label: 'تنبيه', color: 'amber', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        { id: 'PROPOSAL', label: 'مقترح', color: 'emerald', icon: 'M9.663 17h4.674a1 1 0 00.922-.617l2.108-4.742A1 1 0 0016.446 10h-2.113a1 1 0 01-.992-1.138l.322-2.574a1 1 0 00-1.214-1.103L6.892 7.027A1 1 0 006.01 8.016l.322 2.574a1 1 0 01-.992 1.138H3.228a1 1 0 00-.927 1.373l2.108 4.742a1 1 0 00.922.617h4.332' }
    ];

    return (
        <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mr-1">نوع الإشعار</label>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {types.map((opt) => {
                    const isSelected = selectedType === opt.id;
                    const colorClasses = {
                        blue: 'border-blue-500/30 bg-blue-50/40 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-blue-500/5',
                        amber: 'border-amber-500/30 bg-amber-50/40 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 shadow-amber-500/5',
                        emerald: 'border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/5'
                    };

                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => onTypeChange(opt.id)}
                            className={`p-3 sm:p-4 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-2 backdrop-blur-sm ${
                                isSelected 
                                    ? `${colorClasses[opt.color]} shadow-lg scale-[1.02]` 
                                    : 'border-slate-100/50 dark:border-slate-800/30 bg-white/20 dark:bg-slate-900/20 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                            }`}
                        >
                            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={opt.icon} />
                            </svg>
                            <span className="font-black text-[10px] sm:text-xs uppercase">{opt.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
