'use client';

export default function StatsCard({ label, value, icon, color, trend, isGolden }) {
    const goldGlow = "from-amber-400 via-yellow-500 to-amber-600";
    const activeColor = isGolden ? goldGlow : color;

    return (
        <div className={`premium-glass p-8 rounded-[2.5rem] shadow-xl border ${isGolden ? 'border-amber-400/50 shadow-amber-500/20' : 'border-white/20 dark:border-slate-800/50'} hover:shadow-22xl transition-all duration-500 group relative overflow-hidden flex flex-col h-full justify-between min-h-[180px]`}>
            {/* Background Decorative Elements */}
            <div className={`absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-br ${activeColor} ${isGolden ? 'opacity-30 animate-pulse-slow' : 'opacity-10'} blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>
            <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${activeColor} ${isGolden ? 'opacity-20 animate-pulse-slow' : 'opacity-5'} blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>
            {isGolden && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 dark:via-amber-400/10 to-transparent animate-shimmer skew-x-12"></div>
            )}
            <div className="absolute inset-0 bg-white/5 dark:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeColor} flex items-center justify-center text-2xl shadow-lg ${isGolden ? 'shadow-amber-500/50' : 'shadow-indigo-500/10'} transform group-hover:rotate-6 transition-all duration-500`}>
                        {icon}
                    </div>
                    <div className="text-left">
                        <span className={`text-[10px] font-black ${isGolden ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'} uppercase tracking-[0.2em]`}>{trend}</span>
                    </div>
                </div>

                <div className="mt-auto">
                    <h3 className={`text-xs font-black ${isGolden ? 'text-amber-700 dark:text-amber-500' : 'text-slate-500 dark:text-slate-400'} mb-2 tracking-wide uppercase`}>{label}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-black ${isGolden ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-white'} leading-none tracking-tight`}>{value}</span>
                    </div>
                </div>
            </div>

            {/* Subtle bottom accent line */}
            <div className={`absolute bottom-0 right-0 left-0 h-1.5 bg-gradient-to-r ${activeColor} ${isGolden ? 'opacity-60' : 'opacity-30'}`}></div>
        </div>
    );
}
