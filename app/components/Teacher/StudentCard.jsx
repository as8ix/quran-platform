'use client';

const StudentCard = ({ student, router }) => (
    <div
        className="group premium-glass rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 cursor-pointer relative overflow-hidden border border-white/20 dark:border-slate-800/50"
        onClick={() => router.push(`/teacher/student/${student.id}`)}
    >
        {/* Glow Effects */}
        <div className="absolute -top-10 -right-10 w-24 h-24 sm:w-32 sm:h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 sm:w-32 sm:h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700"></div>

        <div className="flex items-start justify-between mb-4 sm:mb-6 relative z-10">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/40 dark:to-slate-900 text-emerald-600 dark:text-emerald-400 rounded-2xl sm:rounded-3xl flex items-center justify-center text-xl sm:text-3xl font-black shadow-inner group-hover:rotate-6 transition-transform">
                {student.name?.charAt(0)}
            </div>
            <div className="flex flex-col items-end gap-1.5 sm:gap-2">
                <div className="bg-white/50 dark:bg-slate-900/50 px-2.5 py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 border border-white/20 dark:border-slate-800">
                    ID: #{student.displayId || student.id}
                </div>
                {student.isEventGuest && (
                    <div className={`px-2.5 py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black border ${
                        student.isSpecificallyAssigned 
                        ? 'bg-amber-500/10 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 border-amber-500/20 dark:border-amber-800 animate-pulse'
                        : 'bg-indigo-500/10 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-800'
                    }`}>
                        🏆 {student.isSpecificallyAssigned ? 'ضيف: مسند' : 'متاح (عام)'}
                    </div>
                )}
            </div>
        </div>

        <h3 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white mb-0.5 sm:mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors relative z-10">
            {student.name}
        </h3>
        {student.halaqa && (
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5 sm:mb-2 flex items-center gap-1 relative z-10">
                <span>📍</span> {student.halaqa.name}
            </p>
        )}
        <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-sm mb-4 sm:mb-6 font-medium line-clamp-1 italic relative z-10">
            وصل إلى: <span className="text-emerald-600 dark:text-emerald-500 font-bold">{student.hifzProgress || 'بداية الحفظ'}</span>
        </p>

        <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-8 bg-white/30 dark:bg-slate-950/40 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/20 dark:border-slate-800/50 relative z-10">
            <div className="flex justify-between items-center text-[10px] sm:text-xs">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">إجمالي الحفظ</span>
                <span className="font-black text-slate-800 dark:text-white bg-white/50 dark:bg-slate-800/50 px-2 sm:py-1 rounded-lg border border-white/20 dark:border-slate-700 shadow-sm">{student.juzCount} أجزاء</span>
            </div>
            <div className="w-full h-2 sm:h-2.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-full overflow-hidden p-0.5 border border-white/10 dark:border-slate-700">
                <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(student.juzCount / 30) * 100}%` }}
                ></div>
            </div>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-black pt-2 border-t border-white/10 dark:border-slate-900/50 relative z-10">
            <span className="group-hover:translate-x-1 transition-transform inline-block">تسجيل التسميع</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/50 dark:bg-emerald-900/40 flex items-center justify-center text-lg sm:text-xl transform group-hover:rotate-45 transition-transform duration-300 shadow-sm">
                ←
            </div>
        </div>
    </div>
);

export default StudentCard;
