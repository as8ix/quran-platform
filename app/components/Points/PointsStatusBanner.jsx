'use client';

export default function PointsStatusBanner({ isPointsEnabled }) {
    if (isPointsEnabled) return null;

    return (
        <div className="mb-8 p-6 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-500/30 rounded-3xl flex items-center gap-6 animate-pulse">
            <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center text-3xl shrink-0">🚫</div>
            <div>
                <h3 className="text-xl font-black text-rose-700 dark:text-rose-400">نشاط النقاط متوقف</h3>
                <p className="text-rose-600 dark:text-rose-500/70 font-bold">عذراً، قام المشرف بإيقاف صلاحية رصد النقاط لحلقتك حالياً. يرجى مراجعة الإدارة.</p>
            </div>
        </div>
    );
}
