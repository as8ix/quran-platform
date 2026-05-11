'use client';

import React, { forwardRef } from 'react';

const TopThreePodium = forwardRef(({ topThree, isSharing, onShare, halaqaName }, ref) => {
    if (!topThree || topThree.length === 0) return null;

    return (
        <div className="mb-24">
            <div className="flex justify-between items-center mb-8 px-4 no-print">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">أبطال الصدارة ✨</h2>
                {!isSharing && (
                    <button 
                        onClick={onShare}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all border border-emerald-100 dark:border-emerald-900/50"
                    >
                        <span>📸 مشاركة التميز</span>
                    </button>
                )}
            </div>

            {/* Capture Area */}
            <div ref={ref} className={`relative flex flex-col items-center ${isSharing ? 'p-16 bg-[#0f172a]' : ''}`}>
                {isSharing && (
                    <div className="text-center mb-16">
                        <div className="text-8xl mb-6">🏆</div>
                        <h1 className="text-5xl font-black text-white mb-4">لوحة أبطال الصيف</h1>
                        <p className="text-amber-500 font-black text-2xl tracking-[0.1em]">{halaqaName}</p>
                    </div>
                )}
                <div className="flex flex-col md:flex-row items-end justify-center gap-8 w-full max-w-5xl px-4">
                    {/* Second Place */}
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

                    {/* First Place */}
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

                    {/* Third Place */}
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
    );
});

TopThreePodium.displayName = 'TopThreePodium';
export default TopThreePodium;
