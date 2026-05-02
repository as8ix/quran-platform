'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import { useTheme } from '../../../components/ThemeProvider';

export default function LeaderboardPage() {
    const { isDarkMode, mounted } = useTheme();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
        
        // Live Update: Fetch every 5 seconds
        const interval = setInterval(fetchLeaderboard, 5000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/points');
            if (res.ok) {
                const points = await res.json();
                
                // Aggregate points by student
                const studentMap = {};
                points.forEach(p => {
                    if (!studentMap[p.studentId]) {
                        studentMap[p.studentId] = {
                            id: p.studentId,
                            name: p.student.name,
                            totalPoints: 0,
                            scansCount: 0,
                            categories: {}
                        };
                    }
                    studentMap[p.studentId].totalPoints += p.amount;
                    studentMap[p.studentId].scansCount += 1;
                    studentMap[p.studentId].categories[p.category] = (studentMap[p.studentId].categories[p.category] || 0) + p.amount;
                });

                const sortedData = Object.values(studentMap).sort((a, b) => b.totalPoints - a.totalPoints);
                setLeaderboard(sortedData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted || loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;

    const topThree = leaderboard.slice(0, 3);
    const theRest = leaderboard.slice(3);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 rtl font-noto pb-20" dir="rtl">
            <Navbar userType="supervisor" userName="لوحة الصدارة" />

            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px] animate-pulse"></div>
            </div>
            
            <main className="max-w-4xl mx-auto px-4 pt-28 pb-12 relative z-10">
                <div className="text-center mb-16 relative">
                    <div className="absolute top-0 right-0 md:right-10 flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black animate-pulse border border-emerald-500/20">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        بث مباشر للنتائج
                    </div>
                    <h1 className="text-5xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">🏆 لوحة أبطال الصيف</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">ترتيب الطلاب حسب مجموع النقاط المكتسبة</p>
                </div>

                {/* Podium Section */}
                {topThree.length > 0 && (
                    <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-20 px-4">
                        {/* 2nd Place */}
                        {topThree[1] && (
                            <div className="order-2 md:order-1 flex-1 w-full md:w-auto">
                                <div className="premium-glass p-6 rounded-[2.5rem] border-t-4 border-slate-300 flex flex-col items-center text-center relative group hover:scale-105 transition-all">
                                    <div className="absolute -top-6 w-12 h-12 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xl font-black shadow-lg">٢</div>
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4">🥈</div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{topThree[1].name}</h3>
                                    <div className="text-2xl font-black text-slate-400">{topThree[1].totalPoints} <span className="text-xs">نقطة</span></div>
                                </div>
                            </div>
                        )}

                        {/* 1st Place */}
                        {topThree[0] && (
                            <div className="order-1 md:order-2 flex-[1.2] w-full md:w-auto mb-6 md:mb-0">
                                <div className="premium-glass p-8 rounded-[3rem] border-t-8 border-amber-500 bg-gradient-to-b from-amber-50/50 to-white/50 dark:from-amber-900/10 dark:to-slate-900/50 flex flex-col items-center text-center relative group hover:scale-105 transition-all shadow-2xl shadow-amber-200/20">
                                    <div className="absolute -top-10 w-20 h-20 bg-amber-500 text-white rounded-full flex items-center justify-center text-4xl font-black shadow-xl animate-bounce">👑</div>
                                    <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center text-5xl mb-4">🥇</div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{topThree[0].name}</h3>
                                    <div className="text-4xl font-black text-amber-600 dark:text-amber-500">{topThree[0].totalPoints} <span className="text-sm">نقطة</span></div>
                                    <div className="mt-4 px-4 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full text-xs font-black uppercase tracking-widest">المتصدر الحالي</div>
                                </div>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {topThree[2] && (
                            <div className="order-3 flex-1 w-full md:w-auto">
                                <div className="premium-glass p-6 rounded-[2.5rem] border-t-4 border-amber-700 flex flex-col items-center text-center relative group hover:scale-105 transition-all">
                                    <div className="absolute -top-6 w-12 h-12 bg-amber-800/20 text-amber-800 rounded-full flex items-center justify-center text-xl font-black shadow-lg">٣</div>
                                    <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-3xl mb-4">🥉</div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{topThree[2].name}</h3>
                                    <div className="text-2xl font-black text-amber-700">{topThree[2].totalPoints} <span className="text-xs">نقطة</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* The Rest List */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 px-4">الترتيب العام</h2>
                    {theRest.map((student, index) => (
                        <div key={student.id} className="premium-glass p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-6 hover:translate-x-[-8px] transition-transform">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-lg font-black text-slate-500">
                                {index + 4}
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
