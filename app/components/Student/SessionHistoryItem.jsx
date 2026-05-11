'use client';

import { formatHijri } from '@/app/utils/dateUtils';

export default function SessionHistoryItem({ 
    session, 
    onEdit, 
    onDelete, 
    isKhatim,
    normalizeSurahName
}) {
    return (
        <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-emerald-50 dark:hover:shadow-none transition-all cursor-default group relative overflow-hidden">
            {session.hifzSurah && (
                <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        {new Date(session.date).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <button
                        type="button"
                        onClick={() => onEdit(session)}
                        className="text-slate-300 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                        title="تعديل الجلسة"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(session.id)}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        title="حذف الجلسة"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 font-black px-3 py-1 rounded-full shadow-sm">
                    {session.pagesCount} ص
                </span>
            </div>

            {session.hifzSurah ? (
                <div className="mb-4">
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-500 mb-1 uppercase tracking-tighter">الحفظ الجديد</div>
                    <div className="text-md font-bold text-slate-800 dark:text-slate-200">
                        سورة {session.hifzSurah} {session.hifzFromPage === session.hifzToPage ? `(ص ${session.hifzFromPage})` : `(من ص ${session.hifzFromPage} إلى ${session.hifzToPage})`}
                    </div>
                    {(session.hifzFromAyah || session.hifzToAyah) && (
                        <div className="text-xs text-emerald-600 mt-1 font-medium">
                            الآيات: {session.hifzFromAyah || '?'} - {session.hifzToAyah || '?'}
                        </div>
                    )}
                </div>
            ) : (session.hifzToPage === 604 || isKhatim) ? (
                <div className="mb-4">
                    <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl flex items-center gap-2">
                        <span className="text-lg">🏆</span>
                        <span className="text-xs font-bold text-amber-800">خاتم للقرآن الكريم</span>
                    </div>
                </div>
            ) : null}

            {session.murajaahFromSurah && (
                <div className="mb-4">
                    <div className="text-xs font-black text-indigo-500 dark:text-indigo-400 mb-1 uppercase tracking-tighter">المراجعة الكبرى</div>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                        <div className="mb-1 text-slate-800 dark:text-slate-200 font-bold">
                            من سورة {session.murajaahFromSurah} <span className="text-xs text-slate-500 font-normal">(آية {session.murajaahFromAyah})</span> إلى سورة {session.murajaahToSurah} <span className="text-xs text-slate-500 font-normal">(آية {session.murajaahToAyah})</span>
                        </div>
                    </div>
                </div>
            )}

            {session.minorMurajaahFromSurah && (
                <div className="mb-4">
                    <div className="text-xs font-black text-indigo-500 dark:text-indigo-400 mb-1 uppercase tracking-tighter">المراجعة الصغرى</div>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                        <div className="mb-1 text-slate-800 dark:text-slate-200 font-bold">
                            من سورة {session.minorMurajaahFromSurah} <span className="text-xs text-slate-500 font-normal">(آية {session.minorMurajaahFromAyah})</span> إلى سورة {session.minorMurajaahToSurah} <span className="text-xs text-slate-500 font-normal">(آية {session.minorMurajaahToAyah})</span>
                        </div>
                    </div>
                </div>
            )}

            {(session.murajaahFromSurah || session.minorMurajaahFromSurah || session.hifzSurah) && (
                <div className="mb-4 flex items-center justify-between">
                    <div className="text-xs text-slate-400 font-bold">
                        {session.resultString}
                    </div>
                    {((session.cleanPagesCount || 0) + (session.hifzCleanPages || 0) + (session.minorCleanPagesCount || 0)) > 0 && (
                        <div className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                            <span>✨</span>
                            <span>{((session.cleanPagesCount || 0) + (session.hifzCleanPages || 0) + (session.minorCleanPagesCount || 0))} نقية</span>
                        </div>
                    )}
                </div>
            )}

            {/* Quality Metrics Breakdown */}
            <div className="mb-4 p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-wider">مقاييس الجودة</div>

                <div className="space-y-4">
                    {/* Hifz Metrics */}
                    {session.hifzSurah && (
                        <div>
                            <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 mb-2">إنجاز الحفظ:</div>
                            <div className="flex gap-2 text-[11px] flex-wrap">
                                <span className={`px-2 py-0.5 rounded-lg font-bold ${session.hifzErrors > 0 ? 'bg-red-50 text-red-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                    ❌ {session.hifzErrors || 0} خطأ
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg font-bold ${session.hifzAlerts > 0 ? 'bg-orange-50 text-orange-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                    ⚠️ {session.hifzAlerts || 0} تنبيه
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg font-bold ${session.hifzCleanPages > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                    ✨ {session.hifzCleanPages || 0} نقية
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Divider if both exist */}
                    {session.hifzSurah && session.murajaahFromSurah && (
                        <div className="h-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                    )}

                    {/* Murajaah Metrics (Major) */}
                    {session.murajaahFromSurah && (
                        <div>
                            <div className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 mb-2">إنجاز المراجعة الكبرى:</div>
                            <div className="flex gap-2 text-[11px] flex-wrap">
                                <span className={`px-2 py-0.5 rounded-lg font-bold ${session.errorsCount > 0 ? 'bg-red-50 text-red-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                    ❌ {session.errorsCount || 0} خطأ
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg font-bold ${session.alertsCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                    ⚠️ {session.alertsCount || 0} تنبيه
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg font-bold ${session.cleanPagesCount > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                    ✨ {session.cleanPagesCount || 0} نقية
                                </span>
                            </div>
                        </div>
                    )}

                    {session.minorMurajaahFromSurah && (
                        <div>
                            <div className="text-[9px] font-bold text-blue-500 dark:text-blue-400 mb-2">إنجاز المراجعة الصغرى:</div>
                            <div className="flex gap-2 text-[11px] flex-wrap">
                                <span className={`px-2 py-0.5 rounded-lg font-bold ${(session.minorErrorsCount || 0) > 0 ? 'bg-red-50 text-red-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                    ❌ {session.minorErrorsCount || 0} خطأ
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg font-bold ${(session.minorAlertsCount || 0) > 0 ? 'bg-orange-50 text-orange-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                    ⚠️ {session.minorAlertsCount || 0} تنبيه
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg font-bold ${(session.minorCleanPagesCount || 0) > 0 ? 'bg-blue-50 text-blue-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                    ✨ {session.minorCleanPagesCount || 0} نقية
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {session.notes && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 italic">
                    " {session.notes} "
                </div>
            )}
        </div>
    );
}
