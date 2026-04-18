'use client';

export default function StatsCard({ label, value, icon, color, trend }) {
    return (
        <div className="premium-glass p-7 rounded-[2.5rem] shadow-xl border border-white/20 dark:border-slate-800/50 hover:shadow-22xl transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 dark:bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-5 relative z-10">
                <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${color} flex items-center justify-center text-3xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 mb-1 tracking-wide uppercase">{label}</h3>
                    <p className="text-4xl font-black text-slate-800 dark:text-white mb-1 leading-none">{value}</p>
                    {trend && <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-2 bg-slate-100/50 dark:bg-slate-900/50 px-2 py-1 rounded-lg inline-block">{trend}</p>}
                </div>
            </div>
        </div>
    );
}
