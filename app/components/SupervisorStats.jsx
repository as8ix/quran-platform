'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function SupervisorStats() {
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(false);
    const [halaqas, setHalaqas] = useState([]);

    // Knights specific state
    const [knights, setKnights] = useState([]);
    const [knightsLoading, setKnightsLoading] = useState(true);
    const [knightTab, setKnightTab] = useState('pages'); // 'pages', 'mastery'
    const [knightTime, setKnightTime] = useState('week'); // 'week', 'month', 'all'
    const [knightHalaqa, setKnightHalaqa] = useState('all'); // 'all', or halaqa ID

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [res, hRes] = await Promise.all([
                fetch('/api/supervisor/stats'),
                fetch('/api/halaqas')
            ]);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
            if (hRes.ok) {
                const hData = await hRes.json();
                setHalaqas(hData);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
            toast.error("فشل تحميل الإحصائيات");
        } finally {
            setLoading(false);
        }
    };

    const fetchKnights = async () => {
        setKnightsLoading(true);
        try {
            const res = await fetch(`/api/supervisor/knights?timeRange=${knightTime}&type=${knightTab}&halaqaId=${knightHalaqa}`);
            if (res.ok) {
                const data = await res.json();
                setKnights(data.topAchievers || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setKnightsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchKnights();
    }, [knightTab, knightTime, knightHalaqa]);

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[3.5rem]"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-[3rem]"></div>
                    <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-[3rem]"></div>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-12 animate-fadeIn pb-12" dir="rtl">
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.2);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(148, 163, 184, 0.4);
                }
            `}</style>
            
            {/* Compact Info Modal */}
            {showInfo && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowInfo(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-white/20 dark:border-slate-800 animate-scaleIn">
                        <button 
                            onClick={() => setShowInfo(false)}
                            className="absolute top-6 left-6 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-sm hover:bg-rose-500 hover:text-white transition-all"
                        >✕</button>
                        
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">💡</div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">آلية الاحتساب</h3>
                        </div>

                        <ul className="space-y-4 text-right">
                            {[
                                { icon: '📅', title: 'دورة الأسبوع', desc: 'تعتمد الحسبة على آخر 7 أيام متصلة.' },
                                { icon: '⚠️', title: 'المنقطعين', desc: 'من أكملوا أسبوعاً كاملاً دون أي إنجاز.' },
                                { icon: '🏆', title: 'فرسان الإنجاز', desc: 'ترتيب حسب إجمالي الصفحات المنجزة.' },
                                { icon: '📈', title: 'معدل الكفاءة', desc: 'متوسط الصفحات لكل جلسة تسميع.' }
                            ].map((item, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                    <span className="w-8 h-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-center flex-shrink-0 text-base">{item.icon}</span>
                                    <div>
                                        <div className="font-black text-slate-800 dark:text-white text-sm">{item.title}</div>
                                        <div className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        
                        <button 
                            onClick={() => setShowInfo(false)}
                            className="w-full mt-8 py-3.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all"
                        >فهمت ذلك</button>
                    </div>
                </div>
            )}

            {/* 1. Hero Header */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-[4rem] p-10 md:p-14 text-white shadow-2xl border border-white/10">
                <div className="absolute inset-0 overflow-hidden rounded-[4rem] pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="hidden md:block absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="hidden md:block absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="text-center lg:text-right">
                        <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">نبض الإنجاز <br/><span className="text-emerald-400 font-amiri italic">لهذا الأسبوع</span></h2>
                            
                            {/* Info Button (i) - Now triggers a Modal */}
                            <button 
                                onClick={() => setShowInfo(true)}
                                className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-lg font-serif italic hover:bg-white hover:text-slate-900 transition-all mt-6 shadow-xl"
                            >i</button>
                        </div>
                        <p className="text-slate-400 text-lg font-medium max-w-xl mx-auto lg:mx-0">
                            تحليل دقيق لنشاط الطلاب وحلقات التحفيظ من الأحد إلى اليوم.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 w-full lg:w-auto">
                        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] text-center group hover:bg-white/10 transition-all">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">الطلاب النشطين</div>
                            <div className="text-5xl font-black text-white drop-shadow-lg">{stats?.summary?.activeThisWeek || 0}</div>
                            <div className="text-[10px] font-bold text-slate-500 mt-2">من أصل {stats?.summary?.totalStudents} طالب</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] text-center group hover:bg-white/10 transition-all">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">إجمالي الجلسات</div>
                            <div className="text-5xl font-black text-white drop-shadow-lg">{stats?.summary?.totalSessions || 0}</div>
                            <div className="text-[10px] font-bold text-slate-500 mt-2">رصد أسبوعي مكثف</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* 2. Action Needed - Inactive Students */}
                <div className="premium-glass rounded-[3.5rem] p-10 border border-rose-500/10 dark:border-rose-500/5 shadow-2xl relative group overflow-hidden flex flex-col h-full">
                    <div className="hidden md:block absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-rose-500/10 transition-colors"></div>
                    
                    <div className="flex justify-between items-center mb-10 relative z-10 shrink-0">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                            <span className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🚨</span>
                            تنبيه المتابعة الأسبوعي
                        </h3>
                        <span className="bg-rose-500 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg shadow-rose-200 dark:shadow-none animate-bounce">مطلوب تدخل</span>
                    </div>

                    <div className="space-y-4 relative z-10 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                        {stats?.inactiveStudents?.length > 0 ? stats.inactiveStudents.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 sm:p-5 bg-slate-800/50 backdrop-blur-md rounded-3xl border border-slate-700 hover:border-rose-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-rose-500/10 hover:-translate-y-1 group/item cursor-pointer">
                                <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-700 flex items-center justify-center text-xl font-black text-slate-300 shadow-inner overflow-hidden border-2 border-slate-600 group-hover/item:border-rose-400 group-hover/item:bg-rose-500/20 group-hover/item:text-rose-400 transition-colors">
                                            {s.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <h4 className="text-base sm:text-lg font-black text-slate-800 dark:text-white truncate pr-1 group-hover/item:text-rose-400 transition-colors">{s.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] sm:text-xs font-bold text-slate-400 bg-slate-700/50 px-2 sm:px-3 py-1 rounded-lg border border-slate-600 truncate">
                                                {s.halaqaName || 'غير محدد'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] sm:text-xs font-bold text-rose-500/80 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 whitespace-nowrap">
                                    لم ينجز
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-24 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-[3rem] border-2 border-dashed border-emerald-200 dark:border-emerald-800">
                                <div className="text-5xl mb-4">✨</div>
                                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">إنجاز رائع! جميع الطلاب نشطين</div>
                                <div className="text-sm font-medium text-slate-400 mt-2">لا يوجد طلاب متوقفين عن التسميع حالياً</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Top Achievers - "Knights 2.0" */}
                <div className="premium-glass rounded-[4rem] p-8 md:p-12 border border-amber-500/10 dark:border-amber-500/5 shadow-2xl relative group overflow-hidden flex flex-col h-full">
                    <div className="hidden md:block absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-400/10 to-orange-500/10 rounded-full blur-[80px] -ml-48 -mt-48 group-hover:from-amber-400/20 transition-colors duration-700"></div>
                    
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 relative z-10 gap-6 shrink-0">
                        <div>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-4 mb-3">
                                <span className={`w-14 h-14 text-white rounded-[1.5rem] flex items-center justify-center text-3xl shadow-lg dark:shadow-none transition-colors duration-500 ${knightTab === 'mastery' ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200' : 'bg-gradient-to-br from-amber-300 to-orange-500 shadow-amber-200'}`}>
                                    {knightTab === 'mastery' ? '💎' : '🏆'}
                                </span>
                                {knightTab === 'mastery' ? 'فرسان الإتقان' : 'فرسان الإنجاز'}
                            </h3>
                            <div className="flex items-start sm:items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-sm bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-700 w-full xl:w-fit">
                                <span className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0">💡</span> 
                                <span className="leading-relaxed">
                                    {knightTab === 'mastery' 
                                        ? 'المعيار: إجمالي عدد الصفحات النقية المتقنة (الخالية من أي خطأ أو تنبيه) ✨' 
                                        : 'المعيار: إجمالي عدد الصفحات المنجزة (حفظ ومراجعة) 📖'}
                                </span>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full xl:w-fit">
                            <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm w-fit shrink-0">
                                <button onClick={() => setKnightTab('pages')} className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${knightTab === 'pages' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>فرسان الإنجاز</button>
                                <button onClick={() => setKnightTab('mastery')} className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${knightTab === 'mastery' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>فرسان الإتقان</button>
                            </div>

                            <div className="flex flex-row flex-wrap gap-3 w-fit shrink-0">
                                <div className="relative">
                                    <select 
                                        value={knightTime} 
                                        onChange={(e) => setKnightTime(e.target.value)}
                                        className="w-full appearance-none bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 rounded-2xl pl-10 pr-5 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer backdrop-blur-md shadow-sm transition-all hover:border-amber-300 dark:hover:border-amber-700 min-w-[140px]"
                                    >
                                        <option value="week" className="bg-white dark:bg-slate-800">هذا الأسبوع</option>
                                        <option value="month" className="bg-white dark:bg-slate-800">هذا الشهر</option>
                                        <option value="all" className="bg-white dark:bg-slate-800">الدورة كاملة</option>
                                    </select>
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>

                                <div className="relative">
                                    <select 
                                        value={knightHalaqa} 
                                        onChange={(e) => setKnightHalaqa(e.target.value)}
                                        className="w-full appearance-none bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 rounded-2xl pl-10 pr-5 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer backdrop-blur-md shadow-sm transition-all hover:border-amber-300 dark:hover:border-amber-700 min-w-[160px]"
                                    >
                                        <option value="all" className="bg-white dark:bg-slate-800">جميع الحلقات</option>
                                        {halaqas.map(h => (
                                            <option key={h.id} value={h.id} className="bg-white dark:bg-slate-800">{h.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10 flex-1 min-h-0 overflow-y-auto px-2 custom-scrollbar">
                        {knightsLoading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                            </div>
                        ) : knights.length > 0 ? knights.map((s, idx) => (
                            <div 
                                key={idx} 
                                className="group relative bg-slate-800/80 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-700 hover:border-amber-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity"></div>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-2 sm:gap-5 min-w-0">
                                        <div className="relative shrink-0">
                                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-inner border-2 transition-all duration-300 ${
                                                idx === 0 ? 'bg-amber-100 border-amber-400 text-amber-600 dark:bg-amber-900/30 dark:border-amber-500/50 dark:text-amber-400' :
                                                idx === 1 ? 'bg-slate-100 border-slate-400 text-slate-600 dark:bg-slate-700/50 dark:border-slate-500 dark:text-slate-300' :
                                                idx === 2 ? 'bg-orange-100 border-orange-400 text-orange-600 dark:bg-orange-900/30 dark:border-orange-500/50 dark:text-orange-400' :
                                                'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-500'
                                            }`}>
                                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <h4 className="text-base sm:text-xl font-black text-slate-800 dark:text-white truncate pr-1">{s.name}</h4>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 sm:px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 truncate">
                                                    {s.halaqaName || 'غير محدد'}
                                                </span>
                                                <span className="text-[10px] sm:text-xs text-slate-400 font-medium whitespace-nowrap">
                                                    {s.count} جلسات
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={`text-center px-3 sm:px-6 py-2 sm:py-3 rounded-2xl border transition-all duration-300 shrink-0 ${
                                        idx === 0 
                                            ? 'bg-gradient-to-br from-amber-400/20 to-orange-500/20 border-amber-500/30 group-hover:bg-amber-400/30 shadow-lg shadow-amber-500/10' 
                                            : idx === 1
                                            ? 'bg-slate-700/50 border-slate-600 group-hover:bg-slate-700 shadow-lg'
                                            : idx === 2
                                            ? 'bg-amber-900/30 border-amber-800/50 group-hover:bg-amber-900/50 shadow-lg'
                                            : 'bg-slate-800 border-slate-700 group-hover:bg-slate-700'
                                    }`}>
                                        <div className={`text-xl sm:text-3xl font-black mb-0.5 ${
                                            idx === 0 ? 'text-amber-400 drop-shadow-md' : 
                                            idx === 1 ? 'text-slate-300' : 
                                            idx === 2 ? 'text-amber-600' : 'text-emerald-400'
                                        }`}>
                                            {s.pages}
                                        </div>
                                        <div className={`text-[10px] sm:text-sm font-bold ${
                                            idx === 0 ? 'text-amber-500/80' : 
                                            idx === 1 ? 'text-slate-400' : 
                                            idx === 2 ? 'text-amber-700/80' : 'text-emerald-500/80'
                                        }`}>صفحة</div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                                <div className="text-4xl mb-3 opacity-50">📭</div>
                                <div className="text-lg font-bold text-slate-500">لا يوجد إنجازات تطابق الفلتر الحالي</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Halaqa Efficiency */}
                <div className="lg:col-span-2 premium-glass rounded-[4rem] p-12 border border-slate-100 dark:border-slate-800 shadow-2xl relative group">
                    <div className="hidden md:block absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-48 -mb-48"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 relative z-10">
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-5">
                            <span className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-indigo-100 dark:shadow-none">📈</span>
                            كفاءة الحلقات (متوسط الإنجاز لكل جلسة)
                        </h3>
                        <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-6 py-2 rounded-full border border-indigo-200 dark:border-indigo-800">تحليل الأداء الأسبوعي</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                        {stats?.halaqaStats?.map((h, idx) => {
                            const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
                            const color = colors[idx % colors.length];
                            return (
                                <div key={idx} className="group/hcard relative p-8 bg-white/50 dark:bg-slate-900/40 rounded-[3.5rem] border-2 border-slate-50 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-500 text-center hover:-translate-y-2">
                                    <div className={`w-16 h-16 ${color}/10 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 transition-transform duration-500 group-hover/hcard:rotate-12 group-hover/hcard:scale-110 shadow-lg`} style={{ backgroundColor: `${color}15`, color: color.replace('bg-', '') }}>🏫</div>
                                    <h4 className="font-black text-slate-800 dark:text-white text-xl mb-2 truncate">{h.name}</h4>
                                    <div className="relative mb-4">
                                        <div className="text-4xl font-black text-slate-800 dark:text-white">{h.avgPages}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">صفحة / جلسة</div>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                                        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${(h.avgPages / 10) * 100}%` }}></div>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 py-2 px-4 rounded-xl inline-block">{h.sessionCount} جلسة مرصودة</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 5. Memorization Distribution - Re-added and Expanded */}
                <div className="lg:col-span-2 premium-glass rounded-[4rem] p-10 md:p-14 border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden mt-6">
                    <div className="hidden md:block absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 relative z-10">
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-5">
                            <span className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-amber-100 dark:shadow-none">📖</span>
                            مرصد الحفظ العام (توزيع طلاب المركز على الأجزاء)
                        </h3>
                        <div className="text-center bg-gradient-to-br from-amber-500 to-orange-600 text-white px-8 py-3 rounded-[2rem] shadow-xl shadow-amber-200 dark:shadow-none transition-transform hover:scale-105">
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">إجمالي الحفظ</div>
                            <div className="text-2xl font-black">{stats?.summary?.totalJuz} جزء</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 h-72 items-end px-4 relative z-10">
                        {[
                            { label: '0 - 5 أجزاء', key: '0-5', color: 'from-emerald-400 to-emerald-600', icon: '🌱' },
                            { label: '5 - 15 جزء', key: '5-15', color: 'from-blue-400 to-blue-600', icon: '🌿' },
                            { label: '15 - 29 جزء', key: '15-29', color: 'from-indigo-400 to-indigo-600', icon: '🌳' },
                            { label: '30 جزء (خاتم)', key: '30', color: 'from-amber-400 to-amber-600', icon: '👑' }
                        ].map((item, idx) => {
                            const val = stats?.juzDistribution?.[item.key] || 0;
                            const maxVal = Math.max(...Object.values(stats?.juzDistribution || {}));
                            const height = maxVal > 0 ? (val / maxVal) * 100 : 0;
                            return (
                                <div key={idx} className="flex flex-col items-center gap-6 group h-full justify-end">
                                    <div className="relative w-full flex flex-col items-center justify-end h-full">
                                        <div className="mb-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-2xl shadow-xl text-sm font-black transition-all group-hover:scale-110 group-hover:-translate-y-2">
                                            {val} طالب
                                        </div>
                                        <div 
                                            className={`w-full max-w-[70px] bg-gradient-to-t ${item.color} rounded-t-[2.5rem] rounded-b-xl transition-all duration-1000 shadow-lg group-hover:shadow-2xl relative cursor-help`}
                                            style={{ height: `${height}%`, minHeight: val > 0 ? '30px' : '6px' }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-[2.5rem] rounded-b-xl"></div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl mb-1 group-hover:scale-125 transition-transform inline-block">{item.icon}</div>
                                        <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">{item.label}</div>
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
