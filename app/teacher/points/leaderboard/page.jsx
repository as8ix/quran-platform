'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { useTheme } from '../../../components/ThemeProvider';
import LoadingScreen from '../../../components/LoadingScreen';
import { toPng } from 'html-to-image';
import { toast } from 'react-hot-toast';

export default function LeaderboardPage() {
    const router = useRouter();
    const { isDarkMode, mounted } = useTheme();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const topThreeRef = useRef(null);

    const [user, setUser] = useState(null);
    const [halaqaName, setHalaqaName] = useState('الترتيب العام');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            router.push('/login');
        }

        const params = new URLSearchParams(window.location.search);
        const hId = params.get('halaqaId');
        fetchLeaderboard(true, hId);
        
        if (hId) {
            fetchHalaqaName(hId);
        }
    }, []);

    const fetchHalaqaName = async (id) => {
        try {
            const res = await fetch(`/api/halaqas?id=${id}`);
            if (res.ok) {
                const halaqas = await res.json();
                if (halaqas.length > 0) setHalaqaName(halaqas[0].name);
            }
        } catch (e) { console.error(e); }
    };

    const fetchLeaderboard = useCallback(async (isInitial = false, hId) => {
        if (isInitial) setLoading(true);
        try {
            const params = new URLSearchParams();
            if (hId) params.append('halaqaId', hId);
            params.append('aggregate', 'true');
            
            const res = await fetch(`/api/points?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hId = params.get('halaqaId');
        
        // Refresh every 30 seconds instead of 5
        const interval = setInterval(() => fetchLeaderboard(false, hId), 30000);
        return () => clearInterval(interval);
    }, [fetchLeaderboard]);

    const handleShare = async () => {
        if (!topThreeRef.current) return;
        
        setIsSharing(true);
        toast.loading('جاري تجهيز بطاقة التميز...', { id: 'share' });
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const dataUrl = await toPng(topThreeRef.current, {
                cacheBust: true,
                backgroundColor: '#0f172a',
                style: { padding: '60px', borderRadius: '0px' }
            });
            const link = document.createElement('a');
            link.download = `ابطال-الصيف-${new Date().toLocaleDateString('ar-EG')}.png`;
            link.href = dataUrl;
            link.click();
            toast.success('تم تحميل بطاقة التميز بنجاح! 🎉', { id: 'share' });
        } catch (err) {
            toast.error('حدث خطأ أثناء تحميل الصورة', { id: 'share' });
        } finally {
            setIsSharing(false);
        }
    };

    if (!mounted || loading) return <LoadingScreen />;

    const topThree = leaderboard.slice(0, 3);
    const theRest = leaderboard.slice(3);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 rtl font-noto pb-20 relative overflow-hidden" dir="rtl">
            <Navbar userType={user?.role === 'SUPERVISOR' ? 'supervisor' : 'teacher'} userName="لوحة الصدارة" />

            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[150px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[150px] animate-pulse-slow"></div>
                <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-purple-500 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '-2s' }}></div>
            </div>
            
            <main className="max-w-4xl mx-auto px-4 pt-28 pb-12 relative z-10">
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

                {topThree.length > 0 && (
                    <div className="mb-24">
                        <div className="flex justify-between items-center mb-8 px-4">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">أبطال الصدارة ✨</h2>
                            {!isSharing && (
                                <button 
                                    onClick={handleShare}
                                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all border border-emerald-100 dark:border-emerald-900/50"
                                >
                                    <span>📸 مشاركة التميز</span>
                                </button>
                            )}
                        </div>

                        {/* Capture Area */}
                        <div ref={topThreeRef} className={`relative flex flex-col items-center ${isSharing ? 'p-16 bg-[#0f172a]' : ''}`}>
                            {isSharing && (
                                <div className="text-center mb-16">
                                    <div className="text-8xl mb-6">🏆</div>
                                    <h1 className="text-5xl font-black text-white mb-4">لوحة أبطال الصيف</h1>
                                    <p className="text-amber-500 font-black text-2xl tracking-[0.1em]">{halaqaName}</p>
                                </div>
                            )}
                            <div className="flex flex-col md:flex-row items-end justify-center gap-8 w-full max-w-5xl px-4">
                                {topThree[1] && (
                                    <div className="order-2 md:order-1 flex-1 w-full md:w-auto">
                                        <div className={`${isSharing ? 'bg-slate-800' : 'bg-slate-900/50 backdrop-blur-2xl'} p-10 rounded-[3rem] border-2 border-slate-700 flex flex-col items-center text-center relative shadow-2xl min-h-[320px] justify-center`}>
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-slate-400 text-white rounded-full flex items-center justify-center text-2xl font-black border-4 border-slate-950 shadow-xl">٢</div>
                                            <div className="text-7xl mb-6" style={{ fontFamily: 'Arial, sans-serif' }}>🥈</div>
                                            <h3 className="text-2xl font-black text-white mb-2 leading-tight">{topThree[1].name}</h3>
                                            <div className="text-4xl font-black text-slate-300">
                                                {topThree[1].totalPoints} <span className="text-lg opacity-60">نقطة</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {topThree[0] && (
                                    <div className="order-1 md:order-2 flex-[1.2] w-full md:w-auto mb-16 md:mb-0">
                                        <div className={`${isSharing ? 'bg-slate-800' : 'bg-slate-900/80 backdrop-blur-3xl'} p-12 rounded-[3.5rem] border-4 border-amber-500 flex flex-col items-center text-center relative shadow-[0_0_50px_rgba(245,158,11,0.2)] scale-110 min-h-[400px] justify-center`}>
                                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-8xl drop-shadow-2xl" style={{ fontFamily: 'Arial, sans-serif' }}>👑</div>
                                            <div className="text-9xl mb-8" style={{ fontFamily: 'Arial, sans-serif' }}>🥇</div>
                                            <h3 className="text-3xl font-black text-white mb-4 leading-tight">{topThree[0].name}</h3>
                                            <div className="text-6xl font-black text-amber-500 mb-8">
                                                {topThree[0].totalPoints} <span className="text-xl text-amber-500/60">نقطة</span>
                                            </div>
                                            <div className="px-10 py-4 bg-amber-500 text-white rounded-full text-sm font-black uppercase tracking-widest shadow-xl">بطل الأسبوع</div>
                                        </div>
                                    </div>
                                )}

                                {topThree[2] && (
                                    <div className="order-3 flex-1 w-full md:w-auto">
                                        <div className={`${isSharing ? 'bg-slate-800' : 'bg-slate-900/50 backdrop-blur-2xl'} p-10 rounded-[3rem] border-2 border-slate-700 flex flex-col items-center text-center relative shadow-2xl min-h-[320px] justify-center`}>
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-amber-800 text-white rounded-full flex items-center justify-center text-2xl font-black border-4 border-slate-950 shadow-xl">٣</div>
                                            <div className="text-7xl mb-6" style={{ fontFamily: 'Arial, sans-serif' }}>🥉</div>
                                            <h3 className="text-2xl font-black text-white mb-2 leading-tight">{topThree[2].name}</h3>
                                            <div className="text-4xl font-black text-amber-700">
                                                {topThree[2].totalPoints} <span className="text-lg opacity-60">نقطة</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 px-4">الترتيب العام</h2>
                    {theRest.map((student, index) => (
                        <div key={student.id} className="premium-glass p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-6 hover:translate-x-[-8px] transition-transform">
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-12 h-12 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-md">
                                    {index + 4}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-slate-800 dark:text-white">{student.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    {Object.entries(student.categories).map(([cat, pts]) => (
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
                    ))}
                    
                    {leaderboard.length === 0 && (
                        <div className="text-center py-20 premium-glass rounded-3xl border border-dashed border-slate-300">
                            <p className="text-slate-400 font-bold text-lg">بانتظار رصد أول النقاط لبدء المنافسة! 🏁</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
