'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

export default function QuranicDaysDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchStats();

        // Auto-refresh every 5 seconds
        const interval = setInterval(() => {
            fetchStats(true); // Silent update
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const fetchStats = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch('/api/quranic-days/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            } else {
                const data = await res.json();
                setError(data.error || 'فشل تحميل البيانات');
            }
        } catch (e) {
            setError('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((e) => {
                toast.error(`خطأ في تفعيل ملء الشاشة: ${e.message}`);
            });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const exportToCSV = () => {
        if (!stats) return;

        const rows = [
            ['بند الإحصائية', 'القيمة'],
            ['اسم الدورة', stats.eventName],
            ['عدد المعلمين', stats.general.teachersCount],
            ['إجمالي الجلسات', stats.general.totalSessions],
            ['الحضور الفعلي', stats.general.actualAttendance],
            ['المستهدف بالصفحات', stats.achievements.target],
            ['الصفحات المنجزة', stats.achievements.accomplished],
            ['صفحات بجودة عالية', stats.achievements.purity],
            ['إجمالي الختمات', stats.achievements.khatmats],
            ['جودة التلاوة %', stats.rates.purityRate],
            ['إنجاز الورد %', stats.rates.goalAchievementRate],
            ['معدل الإنجاز %', stats.rates.achievementRate],
            ['', ''],
            ['لوحة الشرف: الأكثر تسميعاً', ''],
            ['الاسم', 'الصفحات'],
            ...stats.topReciting.map(s => [s.name, s.pages]),
            ['', ''],
            ['لوحة الشرف: الأجود تسميعاً', ''],
            ['الاسم', 'الجودة %'],
            ...stats.topQuality.map(s => [s.name, s.quality])
        ];

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `تقرير_الأيام_القرآنية_${stats.eventName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-amber-900 font-black animate-pulse">جاري تجهيز الإحصائيات...</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-red-100 text-center max-w-md">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{error}</h2>
                <p className="text-slate-500 mb-6 font-bold">يرجى التأكد من وجود دورة "أيام قرآنية" نشطة حالياً وتسجيل بعض الجلسات فيها.</p>
                <button
                    onClick={() => router.push(user?.role === 'SUPERVISOR' ? '/supervisor' : '/teacher')}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
                >
                    العودة للوحة التحكم
                </button>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen ${isFullscreen ? 'h-screen overflow-hidden bg-slate-900 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]' : 'bg-[#FDFCFB]'} font-noto rtl transition-all duration-700`} dir="rtl">
            {!isFullscreen && (
                <Navbar
                    userType={user?.role?.toLowerCase() || 'teacher'}
                    userName={user ? `أهلاً ${user.name.split(' ')[0]} 👋` : ''}
                />
            )}

            <main className={`max-w-[1600px] mx-auto px-4 ${isFullscreen ? 'h-full flex flex-col py-2' : 'py-8 md:py-12'}`}>
                {/* Back Button - Hidden in FS */}
                {!isFullscreen && (
                    <button
                        onClick={() => router.push(user?.role === 'SUPERVISOR' ? '/supervisor' : '/teacher')}
                        className="mb-8 flex items-center gap-4 text-slate-500 hover:text-slate-800 font-bold transition-colors group"
                    >
                        <span className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center group-hover:shadow-xl transition-all border border-slate-50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#475569" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </span>
                        <span className="text-xl">عودة للقائمة الرئيسية</span>
                    </button>
                )}

                {/* Dashboard Header */}
                <div className={`flex flex-col md:flex-row justify-between items-center gap-6 ${isFullscreen ? 'mb-2 h-[8%]' : 'mb-12'}`}>
                    <div className="flex items-center gap-6">
                        <div className={`${isFullscreen ? 'w-12 h-12 text-2xl rounded-xl' : 'w-20 h-20 text-3xl rounded-[2rem]'} ${isFullscreen ? 'bg-amber-500' : 'bg-amber-600'} text-white flex items-center justify-center font-black shadow-xl shadow-amber-200 animate-bounce-slow`}>
                            🏆
                        </div>
                        <div>
                            <h1 className={`${isFullscreen ? 'text-2xl' : 'text-4xl md:text-5xl'} font-black ${isFullscreen ? 'text-white' : 'text-slate-900'} tracking-tight`}>
                                إحصائيات: <span className="text-amber-600">{stats.eventName}</span>
                            </h1>
                            <p className="text-slate-400 font-bold flex items-center gap-2">
                                <span className={`w-2 h-2 bg-emerald-500 rounded-full animate-ping ${isFullscreen ? 'inline-block' : ''}`}></span>
                                <span className="text-[10px] tracking-tighter text-emerald-500">مباشر • </span>
                                <span className={`${isFullscreen ? 'text-xs' : ''}`}>{isFullscreen ? 'بث مباشر للنتائج الاحترافية' : 'جاري عرض النتائج المباشرة للدورة الحالية'}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={toggleFullscreen}
                            className={`${isFullscreen ? 'bg-slate-800/80 text-white px-4 py-2 text-xs' : 'bg-white text-slate-700 px-6 py-4'} rounded-2xl font-bold border-2 ${isFullscreen ? 'border-slate-700' : 'border-slate-100'} hover:border-amber-500 transition-all flex items-center gap-2 shadow-sm`}
                        >
                            <span>{isFullscreen ? '📺 خروج' : '📺 وضع العرض (Full Screen)'}</span>
                        </button>
                        {!isFullscreen && (
                            <button
                                onClick={exportToCSV}
                                className="bg-white text-slate-700 px-6 py-4 rounded-2xl font-bold border-2 border-slate-100 hover:border-amber-500 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <span>📊</span> تصدير البيانات للـ Excel
                            </button>
                        )}
                    </div>
                </div>

                {/* Top Row: General Stats */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isFullscreen ? 'mb-2 h-[12%]' : 'mb-12'}`}>
                    <StatCard
                        label="إجمالي المعلمين"
                        value={stats.general.teachersCount}
                        icon="👨‍🏫"
                        color="bg-blue-600"
                        isFullscreen={isFullscreen}
                    />
                    <StatCard
                        label="إجمالي الجلسات"
                        value={stats.general.totalSessions}
                        icon="📖"
                        color="bg-emerald-600"
                        isFullscreen={isFullscreen}
                    />
                    <StatCard
                        label="الحضور الفعلي"
                        value={stats.general.actualAttendance}
                        icon="👥"
                        color="bg-indigo-600"
                        isFullscreen={isFullscreen}
                    />
                </div>

                {/* Middle Row: Achievements & Charts */}
                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isFullscreen ? 'mb-2 h-[35%]' : 'mb-12'}`}>
                    {/* Achievements Box */}
                    <div className={`${isFullscreen ? 'rounded-[1.5rem] p-6' : 'rounded-[3rem] p-10'} bg-white shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col justify-center overflow-hidden relative group`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -translate-x-10 -translate-y-10 opacity-50 group-hover:scale-150 transition-all duration-700"></div>

                        <h3 className={`${isFullscreen ? 'text-lg mb-4' : 'text-2xl mb-8'} font-black text-slate-800 relative z-10 flex items-center gap-3`}>
                            🎯 المنجزات
                        </h3>

                        <div className={`${isFullscreen ? 'space-y-4' : 'space-y-8'} relative z-10`}>
                            <AchievementItem label="المستهدف بالصفحات" value={stats.achievements.target} unit="صفحة" color="text-slate-400" isFullscreen={isFullscreen} />
                            <AchievementItem label="الصفحات المنجزة" value={stats.achievements.accomplished} unit="صفحة" color="text-amber-600" isMain isFullscreen={isFullscreen} />
                            <AchievementItem label="صفحات بجودة عالية" value={stats.achievements.purity} unit="صفحة" color="text-emerald-500" isFullscreen={isFullscreen} />
                            <AchievementItem label="إجمالي الختمات" value={stats.achievements.khatmats} unit="ختمة" color="text-indigo-600" isFullscreen={isFullscreen} />
                        </div>
                    </div>

                    {/* Radial Charts Box */}
                    <div className={`lg:col-span-2 bg-slate-900 ${isFullscreen ? 'rounded-[1.5rem] p-4' : 'rounded-[3rem] p-10'} shadow-2xl shadow-indigo-900/20 border border-slate-800 flex flex-col`}>
                        <h3 className={`${isFullscreen ? 'text-sm mb-2' : 'text-2xl mb-10'} font-black text-white flex items-center gap-3`}>
                            ⚡ معدلات الأداء
                        </h3>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <RadialProgress percentage={stats.rates.purityRate} label="جودة التلاوة" color="#F59E0B" isFullscreen={isFullscreen} />
                            <RadialProgress percentage={stats.rates.goalAchievementRate} label="إنجاز الورد" color="#10B981" isFullscreen={isFullscreen} />
                            <RadialProgress percentage={stats.rates.achievementRate} label="معدل الإنجاز" color="#6366F1" isFullscreen={isFullscreen} />
                        </div>

                        {!isFullscreen && (
                            <div className="mt-8 pt-8 border-t border-slate-800 flex justify-center items-center gap-8">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
                                    <span className="text-xs font-bold text-slate-400">إتقان التلاوة</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                    <span className="text-xs font-bold text-slate-400">إنجاز الورد</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Leaderboards */}
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${isFullscreen ? 'mb-0 h-[45%]' : ''}`}>
                    {/* Most Reciting */}
                    <Leaderboard
                        title="الأكثر تسميعاً"
                        icon="🔥"
                        data={stats.topReciting}
                        unit="صفحة"
                        dataKey="pages"
                        colorClass="bg-amber-600"
                        isFullscreen={isFullscreen}
                    />
                    {/* Top Quality */}
                    <Leaderboard
                        title="الأجود تسميعاً"
                        icon="💎"
                        data={stats.topQuality}
                        unit="%"
                        dataKey="quality"
                        colorClass="bg-emerald-600"
                        isFullscreen={isFullscreen}
                    />
                </div>
            </main>

            <style jsx global>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(-5px); }
                    50% { transform: translateY(5px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

function StatCard({ label, value, icon, color, isFullscreen }) {
    return (
        <div className={`${isFullscreen ? 'p-6 rounded-[1.5rem]' : 'p-8 rounded-[2.5rem]'} bg-white shadow-xl shadow-slate-100/80 border border-slate-50 flex items-center justify-between group hover:scale-[1.02] transition-all duration-300`}>
            <div className={`${isFullscreen ? 'w-12 h-12 text-2xl rounded-xl' : 'w-16 h-16 text-3xl rounded-[1.5rem]'} ${color} text-white flex items-center justify-center shadow-lg ring-4 ring-slate-50`}>
                {icon}
            </div>
            <div className="text-left">
                <span className={`${isFullscreen ? 'text-xs' : 'text-sm'} block font-black text-slate-400 mb-1 uppercase tracking-widest`}>{label}</span>
                <span className={`${isFullscreen ? 'text-3xl' : 'text-4xl'} font-black text-slate-800 tabular-nums`}>
                    {value}
                </span>
            </div>
        </div>
    );
}

function AchievementItem({ label, value, unit, color, isMain, isFullscreen }) {
    return (
        <div className={`flex justify-between items-end border-b border-slate-50 ${isFullscreen ? 'pb-3' : 'pb-4'}`}>
            <span className={`${isFullscreen ? 'text-sm' : 'text-sm'} font-bold text-slate-400`}>{label}</span>
            <div className={`flex items-baseline gap-1 ${color}`}>
                <span className={`${isMain ? (isFullscreen ? 'text-3xl' : 'text-4xl') : (isFullscreen ? 'text-2xl' : 'text-2xl')} font-black tabular-nums`}>{value}</span>
                <span className="text-xs font-black opacity-60">{unit}</span>
            </div>
        </div>
    );
}

function RadialProgress({ percentage, label, color, isFullscreen }) {
    const radius = isFullscreen ? 40 : 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const boxSize = isFullscreen ? 32 : 36;
    const viewBoxSize = isFullscreen ? 110 : 144;
    const center = viewBoxSize / 2;

    return (
        <div className="flex flex-col items-center gap-2 group">
            <div className={`${isFullscreen ? 'w-40 h-40' : 'w-36 h-36'} relative flex items-center justify-center`}>
                {/* Background Circle */}
                <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
                    <circle
                        cx={center} cy={center} r={radius}
                        className="stroke-slate-800"
                        strokeWidth={isFullscreen ? "7" : "8"} fill="transparent"
                    />
                    {/* Progress Circle with Glow */}
                    <circle
                        cx={center} cy={center} r={radius}
                        stroke={color}
                        strokeWidth={isFullscreen ? "7" : "8"}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                        style={{ filter: `drop-shadow(0 0 ${isFullscreen ? '8px' : '8px'} ${color})` }}
                    />
                </svg>
                {/* Center Value */}
                <div className="absolute flex flex-col items-center">
                    <span className={`${isFullscreen ? 'text-2xl' : 'text-2xl'} font-black text-white tabular-nums group-hover:scale-110 transition-transform`}>{percentage}%</span>
                </div>
            </div>
            <div className={`${isFullscreen ? 'text-xs' : 'text-sm'} font-black text-slate-400 text-center uppercase tracking-widest`}>{label}</div>
        </div>
    );
}

function Leaderboard({ title, icon, data, unit, dataKey, colorClass, isFullscreen }) {
    return (
        <div className={`bg-white ${isFullscreen ? 'p-6 rounded-[2.5rem]' : 'p-10 rounded-[3rem]'} shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col h-full overflow-hidden`}>
            <h3 className={`${isFullscreen ? 'text-lg mb-6' : 'text-2xl mb-8'} font-black text-slate-800 flex items-center gap-4`}>
                <span className={`${isFullscreen ? 'w-10 h-10 text-xl' : 'w-12 h-12 text-xl'} ${colorClass.replace('bg-', 'text-')} bg-slate-50 rounded-2xl flex items-center justify-center`}>{icon}</span>
                لوحة الشرف: {title}
            </h3>

            <div className={`${isFullscreen ? 'space-y-3' : 'space-y-4'} overflow-y-auto pr-2 custom-scrollbar`}>
                {data.length > 0 ? data.map((item, idx) => (
                    <div key={idx} className={`flex items-center justify-between ${isFullscreen ? 'p-4' : 'p-5'} bg-slate-50 rounded-[1.8rem] group hover:bg-white hover:shadow-lg transition-all duration-300`}>
                        <div className="flex items-center gap-5">
                            <span className={`${isFullscreen ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-sm'} ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-slate-200'} text-white rounded-xl flex items-center justify-center font-black shadow-sm`}>
                                {idx + 1}
                            </span>
                            <span className={`${isFullscreen ? 'text-lg' : 'text-lg'} font-black text-slate-700 group-hover:text-amber-950 truncate max-w-[200px]`}>{item.name}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className={`${isFullscreen ? 'text-2xl' : 'text-xl'} font-black text-slate-800 tabular-nums`}>{item[dataKey]}</span>
                            <span className="text-xs font-bold text-slate-400">{unit}</span>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-10 opacity-30 font-bold">لا توجد بيانات متاحة</div>
                )}
            </div>
        </div>
    );
}
