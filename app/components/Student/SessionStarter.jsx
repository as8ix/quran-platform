'use client';

export default function SessionStarter({ isKhatim, isQuranicDaySession, onStartSession }) {
    return (
        <div className="premium-glass rounded-[3rem] p-12 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500">📖</div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">بدء جلسة جديدة</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed font-medium">
                    "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"
                    <br />
                    <span className="text-xs text-slate-400">جاهز لتسجيل إنجاز الطالب لليوم؟</span>
                </p>
                <button
                    onClick={onStartSession}
                    className="px-10 py-5 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
                >
                    <span>تسجيل تسميع اليوم</span>
                    <span className="text-2xl">✨</span>
                </button>
            </div>
        </div>
    );
}
