'use client';

export default function StatsCard({ label, value, icon, color, trend }) {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-700 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-3xl shadow-lg shadow-green-200/20 dark:shadow-none transform group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{label}</h3>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mb-1 leading-none">{value}</p>
                    {trend && <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">{trend}</p>}
                </div>
            </div>
        </div>
    );
}
