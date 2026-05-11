'use client';

import { formatHijri } from '@/app/utils/dateUtils';
import SessionHistoryItem from './SessionHistoryItem';

export default function SessionHistoryList({ 
    history, 
    showAllHistory, 
    setShowAllHistory, 
    onEditSession, 
    onDeleteSession, 
    isKhatim,
    quranData,
    normalizeSurahName
}) {
    let displayedHistory = [...history];
    if (!showAllHistory) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        displayedHistory = displayedHistory.filter(s => new Date(s.date) >= oneWeekAgo);
    }

    // Sort by date (desc) and then by Surah ID (desc) for precise latest-first ordering
    displayedHistory.sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        
        // Tie-breaker: Higher Surah ID first (assuming 1->114 progression)
        const sA = quranData.find(s => normalizeSurahName(s.name) === normalizeSurahName(a.murajaahFromSurah))?.id || 0;
        const sB = quranData.find(s => normalizeSurahName(s.name) === normalizeSurahName(b.murajaahFromSurah))?.id || 0;
        if (sA !== sB) return sB - sA;

        return (b.id || 0) - (a.id || 0);
    });

    return (
        <div className="premium-glass rounded-[3rem] p-8 sticky top-24">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-4">
                <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-lg">📜</span>
                سجل الإنجاز
                <button
                    type="button"
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="mr-auto text-[10px] font-black px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 rounded-full transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                    {showAllHistory ? 'عرض الأسبوع فقط' : 'إظهار السجل الكامل'}
                </button>
            </h3>
            <div className="space-y-6 max-h-[calc(100vh-350px)] overflow-y-auto pl-2 custom-scrollbar rtl-scroll">
                {displayedHistory.length > 0 ? displayedHistory.map((session, idx) => {
                    const currentDateFormatted = formatHijri(session.date, 'long');
                    const prevDateFormatted = idx > 0 ? formatHijri(displayedHistory[idx - 1].date, 'long') : null;
                    const showDateSeparator = currentDateFormatted !== prevDateFormatted;

                    // Check if ANY session on this day achieved the goal
                    let dayAchieved = false;
                    if (showDateSeparator) {
                        const sessionsOnThisDay = displayedHistory.filter(s => formatHijri(s.date, 'long') === currentDateFormatted);
                        dayAchieved = sessionsOnThisDay.some(s => s.isGoalAchieved);
                    }

                    return (
                        <div key={session.id || idx} className="space-y-6">
                            {showDateSeparator && (
                                <div className="flex items-center gap-4 py-2 mt-4 first:mt-0 relative">
                                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                                            📅 {currentDateFormatted}
                                        </div>
                                        {dayAchieved && (
                                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-lg border border-green-200 shadow-sm z-10">
                                                <span>🎯</span> حقق هدف اليوم
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                                </div>
                            )}
                            <SessionHistoryItem 
                                session={session}
                                onEdit={onEditSession}
                                onDelete={onDeleteSession}
                                isKhatim={isKhatim}
                                normalizeSurahName={normalizeSurahName}
                            />
                        </div>
                    );
                }) : (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4 opacity-20">📭</div>
                        <div className="text-slate-300 font-black">
                            {showAllHistory ? 'لا يوجد سجلات بعد' : 'لا يوجد سجلات في هذا الأسبوع'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
