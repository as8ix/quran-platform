'use client';

export default function TeachersSection({
    loading,
    teachers,
    halaqas,
    searchTeacher,
    setSearchTeacher,
    teacherSort,
    setTeacherSort,
    isSortDropdownOpen,
    setIsSortDropdownOpen,
    getArabicCount,
    normalizeText,
    onEditTeacher,
    onDeleteTeacher,
    onResetPassword,
    deletingId,
}) {
    const filteredTeachers = teachers
        .filter(t => normalizeText(t.name).includes(normalizeText(searchTeacher)))
        .sort((a, b) => {
            if (teacherSort === 'name-asc') return a.name.localeCompare(b.name, 'ar');
            if (teacherSort === 'name-desc') return b.name.localeCompare(a.name, 'ar');
            if (teacherSort === 'assigned') {
                const countA = (a._count?.teacherHalaqas || 0) + (a._count?.assistantHalaqas || 0);
                const countB = (b._count?.teacherHalaqas || 0) + (b._count?.assistantHalaqas || 0);
                if (countA > 0 && countB === 0) return -1;
                if (countA === 0 && countB > 0) return 1;
                return a.name.localeCompare(b.name, 'ar');
            }
            return 0;
        });

    return (
        <div className={`premium-glass rounded-[3rem] p-8 shadow-2xl border border-white/20 dark:border-slate-800/50 flex flex-col relative group ${loading ? '' : 'reveal reveal-delay-2'}`}>
            <div className="premium-glow-emerald opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
            <div className="premium-glow-purple opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-xl">👨‍🏫</span>
                        قائمة المعلمين
                    </h2>
                    <span className="bg-emerald-500/10 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black border border-emerald-500/20">
                        {getArabicCount(teachers.length, 'معلم واحد', 'معلمان', 'معلمين', 'معلماً')}
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="ابحث عن معلم بالاسم..."
                            className="w-full pr-14 pl-6 py-4 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 rounded-[2rem] outline-none text-sm font-bold transition-all placeholder:text-slate-400 dark:text-white"
                            value={searchTeacher}
                            onChange={(e) => setSearchTeacher(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            className="h-full px-6 py-4 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] flex items-center gap-3 font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition-all text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                            {teacherSort === 'assigned' ? 'المعلمون المشرفون أولاً' : teacherSort === 'name-asc' ? 'الاسم (أ-ي)' : 'الاسم (ي-أ)'}
                            <svg className={`w-4 h-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isSortDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl z-[100] animate-fadeIn">
                                {[
                                    { id: 'assigned', label: 'المعلمون المشرفون أولاً' },
                                    { id: 'name-asc', label: 'الاسم (أ-ي)' },
                                    { id: 'name-desc', label: 'الاسم (ي-أ)' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => { setTeacherSort(opt.id); setIsSortDropdownOpen(false); }}
                                        className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-bold transition-all ${teacherSort === opt.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 max-h-[700px] overflow-y-auto custom-scrollbar px-1">
                    {loading ? (
                        <>
                            <div className="h-28 bg-slate-200/50 dark:bg-slate-900/30 rounded-[2.5rem] animate-pulse"></div>
                            <div className="h-28 bg-slate-200/50 dark:bg-slate-900/30 rounded-[2.5rem] animate-pulse"></div>
                            <div className="h-28 bg-slate-200/50 dark:bg-slate-900/30 rounded-[2.5rem] animate-pulse"></div>
                        </>
                    ) : filteredTeachers.map(teacher => {
                        const teacherHalaqaCount = halaqas.filter(h =>
                            h.teacherId?.toString() === teacher.id.toString() ||
                            h.assistants?.some(a => a.id.toString() === teacher.id.toString())
                        ).length;
                        return (
                            <div key={teacher.id} className="group p-6 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500 transition-all duration-500 relative">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
                                    <div className="flex items-center gap-5 w-full sm:w-auto">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-700 dark:text-white shadow-sm group-hover:scale-105 transition-transform duration-500 shrink-0">
                                            {teacher.name.charAt(0)}
                                        </div>
                                        <div className="text-right flex-1 min-w-0">
                                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-2 leading-tight tracking-tight break-words">
                                                {teacher.name}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black border border-slate-200 dark:border-slate-700">
                                                    {teacher.username}@
                                                </div>
                                                <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-lg text-[9px] font-bold border border-slate-200 dark:border-slate-700">
                                                    #{teacher.displayId || teacher.id}
                                                </div>
                                                <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-900 flex items-center gap-1.5">
                                                    <span className="text-[10px]">🔑</span>
                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{teacher.password}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center sm:items-end gap-4 w-full sm:w-auto">
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-300 ${teacherHalaqaCount > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span className="text-[11px] font-black tracking-tight whitespace-nowrap">
                                                {teacherHalaqaCount > 0
                                                    ? `${getArabicCount(teacherHalaqaCount, 'حلقة واحدة', 'حلقتان', 'حلقات', 'حلقة')} نشطة`
                                                    : 'غير نشط'
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => onResetPassword(teacher.id, teacher.name, 'TEACHER')}
                                                className="w-11 h-11 flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all duration-300 border border-amber-100 dark:border-amber-900/30 shadow-sm"
                                                title="إعادة تعيين كلمة المرور"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onDeleteTeacher(teacher.id, teacher.name)}
                                                className="w-11 h-11 flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all duration-300 border border-rose-100 dark:border-rose-900/30 shadow-sm"
                                                title="حذف"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onEditTeacher(teacher)}
                                                className="w-11 h-11 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-300 border border-indigo-100 dark:border-indigo-900/30 shadow-sm"
                                                title="تعديل"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2-2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
