'use client';

export default function StudentFilters({ 
    searchTerm, 
    setSearchTerm, 
    juzFilter, 
    setJuzFilter 
}) {
    return (
        <div className="premium-glass p-6 sm:p-8 rounded-[3rem] shadow-xl border border-white/20 dark:border-slate-800/50 mb-10 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/5 dark:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                <div className="flex-1">
                    <label className="block text-sm font-black text-slate-500 dark:text-slate-400 mb-3 mr-1 uppercase tracking-[0.2em]">البحث عن اسم الطالب</label>
                    <div className="relative group/search">
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xl group-focus-within/search:text-emerald-500 transition-colors">🔍</span>
                        <input
                            type="text"
                            placeholder="ابحث باسم الطالب هنا..."
                            className="w-full pr-14 pl-6 py-5 bg-white/50 dark:bg-slate-900/80 border-2 border-transparent focus:border-emerald-500/50 focus:bg-white dark:focus:bg-slate-950 rounded-3xl shadow-inner transition-all outline-none font-bold dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 lg:flex-[0.7]">
                    <label className="block text-sm font-black text-slate-500 dark:text-slate-400 mb-3 mr-1 uppercase tracking-[0.2em]">تصفية حسب الحفظ</label>
                    <div className="flex p-2 bg-slate-100/50 dark:bg-slate-900/80 rounded-3xl gap-2 border border-white/10 dark:border-slate-800">
                        {[
                            { id: 'all', label: 'الكل' },
                            { id: 'less5', label: 'أقل من 5' },
                            { id: '5-15', label: '5 - 15' },
                            { id: '15-30', label: '15 - 30' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setJuzFilter(tab.id)}
                                className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 ${juzFilter === tab.id
                                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-primary shadow-xl shadow-emerald-500/10 transform scale-[1.05] z-10'
                                    : 'text-slate-500 dark:text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
