'use client';

import { useRouter } from 'next/navigation';

const chartColors = ['#10b981', '#6366f1', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

export default function DistributionChart({ loading, students, halaqas, hoveredHalaqaId, setHoveredHalaqaId }) {
    const router = useRouter();
    const halaqaDistribution = halaqas.map(h => ({
        id: h.id,
        name: h.name,
        count: students.filter(s => s.halaqaId === h.id).length
    })).filter(h => h.count > 0).sort((a, b) => b.count - a.count);

    const totalStudentsInHalaqas = halaqaDistribution.reduce((sum, h) => sum + h.count, 0);
    const totalStudentsCount = students.length;

    return (
        <div className={`premium-glass rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-white/20 dark:border-slate-800/50 mb-12 relative group ${loading ? '' : 'reveal reveal-delay-2'}`}>
            <div className="premium-glow-emerald opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
            <div className="premium-glow-purple opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
            <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                <div className="relative w-64 h-64 flex-shrink-0 group/chart">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 rounded-full blur-2xl group-hover/chart:scale-110 transition-transform duration-700"></div>
                    <div className="w-full h-full relative z-10 flex items-center justify-center">
                        {totalStudentsInHalaqas > 0 ? (
                            <svg viewBox="0 0 256 256" className="w-full h-full transform -rotate-90 overflow-visible">
                                {halaqaDistribution.map((h, i) => {
                                    const startPct = halaqaDistribution.slice(0, i).reduce((sum, curr) => sum + (curr.count / totalStudentsInHalaqas) * 100, 0);
                                    const endPct = startPct + (h.count / totalStudentsInHalaqas) * 100;
                                    const isHovered = hoveredHalaqaId === h.id;
                                    const color = chartColors[i % chartColors.length];
                                    const radius = 110, innerRadius = 85;
                                    const startAngle = (startPct / 100) * 360 * Math.PI / 180;
                                    const endAngle = (endPct / 100) * 360 * Math.PI / 180;
                                    const x1 = 128 + radius * Math.cos(startAngle), y1 = 128 + radius * Math.sin(startAngle);
                                    const x2 = 128 + radius * Math.cos(endAngle), y2 = 128 + radius * Math.sin(endAngle);
                                    const x3 = 128 + innerRadius * Math.cos(endAngle), y3 = 128 + innerRadius * Math.sin(endAngle);
                                    const x4 = 128 + innerRadius * Math.cos(startAngle), y4 = 128 + innerRadius * Math.sin(startAngle);
                                    const largeArcFlag = endPct - startPct > 50 ? 1 : 0;
                                    const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
                                    return <path key={h.id} d={pathData} fill={color} onMouseEnter={() => setHoveredHalaqaId(h.id)} onMouseLeave={() => setHoveredHalaqaId(null)} className="transition-all duration-500 cursor-pointer" style={{ opacity: hoveredHalaqaId && !isHovered ? 0.3 : 1, transform: isHovered ? 'scale(1.1)' : 'scale(1)', transformOrigin: '128px 128px', filter: isHovered ? `drop-shadow(0 0 12px ${color})` : 'none' }} />;
                                })}
                            </svg>
                        ) : <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />}
                    </div>
                    <div className="absolute inset-10 bg-[var(--card-bg)] dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner border-4 border-slate-50/50 dark:border-slate-800/50 z-40 backdrop-blur-sm pointer-events-none">
                        <span className="text-4xl font-black text-slate-800 dark:text-white leading-none mb-1">{totalStudentsCount}</span>
                        <span className="text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em]">إجمالي الطلاب</span>
                    </div>
                </div>
                <div className="flex-1 w-full">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-1 w-12 bg-gradient-to-r from-emerald-500 to-transparent rounded-full"></div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">توزيع الطلاب على الحلقات</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            <>
                                <div className="h-24 bg-slate-200/50 dark:bg-slate-900/30 rounded-[2rem] animate-pulse"></div>
                                <div className="h-24 bg-slate-200/50 dark:bg-slate-900/30 rounded-[2rem] animate-pulse"></div>
                                <div className="h-24 bg-slate-200/50 dark:bg-slate-900/30 rounded-[2rem] animate-pulse"></div>
                                <div className="h-24 bg-slate-200/50 dark:bg-slate-900/30 rounded-[2rem] animate-pulse"></div>
                            </>
                        ) : halaqaDistribution.map((h, i) => {
                            const isHovered = hoveredHalaqaId === h.id;
                            const percentage = Math.round((h.count / totalStudentsInHalaqas) * 100);
                            return (
                                <div key={h.id} onMouseEnter={() => setHoveredHalaqaId(h.id)} onMouseLeave={() => setHoveredHalaqaId(null)} className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all duration-500 group/item cursor-default ${isHovered ? 'bg-white dark:bg-slate-800 border-emerald-500 -translate-y-1 scale-[1.05]' : 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent shadow-sm'}`} style={{ boxShadow: isHovered ? `0 20px 40px -10px ${chartColors[i % chartColors.length]}30` : 'none' }}>
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-transform duration-500 group-hover/item:rotate-12" style={{ backgroundColor: `${chartColors[i % chartColors.length]}15`, color: chartColors[i % chartColors.length], border: `1px solid ${chartColors[i % chartColors.length]}30` }}>🏫</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`font-black text-sm transition-colors ${isHovered ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{h.name}</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/supervisor/reports/custom-list?halaqaId=${h.id}`); }}
                                                    className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400 transition-all active:scale-90"
                                                    title="عرض كشف بيانات الحلقة"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </button>
                                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`, backgroundColor: chartColors[i % chartColors.length] }}></div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 italic">سعة الحلقة</span>
                                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg">{h.count} طالب</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
