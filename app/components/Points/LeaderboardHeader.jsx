'use client';

export default function LeaderboardHeader() {
    return (
        <div className="text-center mb-10 relative">
            <div className="inline-block animate-tada mb-6">
                <span className="text-6xl sm:text-8xl">🏆</span>
            </div>
            <div className="absolute top-0 right-0 md:right-5 flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black animate-pulse border border-emerald-500/20">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                بث مباشر للنتائج
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-800 dark:text-white mb-6 tracking-tight">
                لوحة <span className="text-amber-500">أبطال الصيف</span>
            </h1>
        </div>
    );
}
