'use client';

import { useRouter } from 'next/navigation';

export default function HalaqasSection({
    loading,
    halaqas,
    students,
    searchHalaqa,
    setSearchHalaqa,
    getArabicCount,
    normalizeText,
    togglingId,
    deletingId,
    onEditHalaqa,
    onDeleteHalaqa,
    onViewStudents,
    onOpenSettings,
    onOpenReport,
}) {
    const router = useRouter();

    const filteredHalaqas = halaqas
        .filter(h => normalizeText(h.name).includes(normalizeText(searchHalaqa)))
        .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    return (
        <div className={`premium-glass rounded-[3rem] p-8 shadow-2xl border border-white/20 dark:border-slate-800/50 flex flex-col relative group ${loading ? '' : 'reveal reveal-delay-3'}`}>
            <div className="premium-glow-emerald opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
            <div className="premium-glow-purple opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-xl">🕌</span>
                        الحلقات النشطة
                    </h2>
                    <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">
                        {getArabicCount(halaqas.length, 'حلقة واحدة', 'حلقتان', 'حلقات', 'حلقة')}
                    </span>
                </div>
                <div className="mb-8">
                    <div className="relative group">
                        <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="بحث باسم الحلقة..."
                            className="w-full pr-14 pl-6 py-4 bg-white/50 dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 rounded-[2rem] outline-none text-sm font-bold transition-all placeholder:text-slate-400 dark:text-white"
                            value={searchHalaqa}
                            onChange={(e) => setSearchHalaqa(e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 max-h-[700px] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <>
                            <div className="h-28 bg-slate-200/50 dark:bg-slate-900/30 rounded-[2.5rem] animate-pulse"></div>
                            <div className="h-28 bg-slate-200/50 dark:bg-slate-900/30 rounded-[2.5rem] animate-pulse"></div>
                            <div className="h-28 bg-slate-200/50 dark:bg-slate-900/30 rounded-[2.5rem] animate-pulse"></div>
                        </>
                    ) : filteredHalaqas.map(halaqa => (
                        <div key={halaqa.id} className="group p-6 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-xl transition-all duration-500 relative">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
                                {/* Info Side */}
                                <div className="flex items-center gap-5 w-full sm:w-auto">
                                    <div className="w-16 h-16 bg-indigo-500 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0 font-black text-2xl">
                                        {halaqa.name.replace('حلقة: ', '').charAt(0)}
                                    </div>
                                    <div className="text-right flex-1 min-w-0">
                                        <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-2 leading-tight tracking-tight break-words">
                                            {halaqa.name.startsWith('حلقة') ? halaqa.name : `حلقة: ${halaqa.name}`}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-bold">
                                            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                                <span className="text-indigo-600 dark:text-indigo-400">👤</span>
                                                {halaqa.teacher?.name || 'غير معين'}
                                            </div>
                                            {halaqa.assistants && halaqa.assistants.length > 0 && (
                                                <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-lg text-[9px] font-bold border border-slate-200 dark:border-slate-700">
                                                    +{halaqa.assistants.length} مساعد
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Side */}
                                <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            <span className="text-[10px] font-black tracking-tight whitespace-nowrap">
                                                {getArabicCount(students.filter(s => s.halaqaId === halaqa.id).length, 'طالب واحد', 'طالبان', 'طلاب', 'طالباً')}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => onOpenSettings(halaqa)}
                                            disabled={togglingId === `points-${halaqa.id}`}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all shadow-sm active:scale-95 ${halaqa.pointsEnabled ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
                                            title="إعدادات الأنشطة"
                                        >
                                            {togglingId === `points-${halaqa.id}` ? (
                                                <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <span className="text-sm">⚙️</span>
                                                    <span>الأنشطة</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/50 w-full sm:w-auto justify-center">
                                        <button
                                            onClick={() => onOpenReport(halaqa)}
                                            className="w-9 h-9 flex items-center justify-center bg-amber-500 text-white rounded-xl hover:scale-105 transition-all shadow-sm"
                                            title="التقارير"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onEditHalaqa(halaqa)}
                                            className="w-9 h-9 flex items-center justify-center bg-indigo-500 text-white rounded-xl hover:scale-105 transition-all shadow-sm"
                                            title="تعديل"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onDeleteHalaqa(halaqa.id, halaqa.name)}
                                            disabled={deletingId === `halaqa-${halaqa.id}`}
                                            className="w-9 h-9 flex items-center justify-center bg-rose-500 text-white rounded-xl hover:scale-105 transition-all shadow-sm disabled:opacity-50"
                                            title="حذف"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                        <button
                                            onClick={() => onViewStudents(halaqa)}
                                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black hover:opacity-90 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                        >
                                            عرض الطلاب
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
