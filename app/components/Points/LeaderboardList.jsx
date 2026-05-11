'use client';

export default function LeaderboardList({ theRest }) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 px-4">الترتيب العام</h2>
            {theRest.length > 0 ? theRest.map((student, index) => (
                <div key={student.id} className="premium-glass p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-6 hover:translate-x-[-8px] transition-transform">
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-md">
                            {index + 4}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">{student.name}</h3>
                        <div className="flex gap-2 mt-1">
                            {student.categories && Object.entries(student.categories).map(([cat, pts]) => (
                                <span key={cat} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-lg">
                                    {cat === 'QURAN' ? '📖' : cat === 'ATTENDANCE' ? '⏰' : '⭐'} {pts}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{student.totalPoints}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase">نقطة</div>
                    </div>
                </div>
            )) : (
                <div className="text-center py-20 premium-glass rounded-3xl border border-dashed border-slate-300">
                    <p className="text-slate-400 font-bold text-lg">بانتظار رصد أول النقاط لبدء المنافسة! 🏁</p>
                </div>
            )}
        </div>
    );
}
