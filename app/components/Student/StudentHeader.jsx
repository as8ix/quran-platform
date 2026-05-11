'use client';

import BackButton from '../BackButton';

export default function StudentHeader({ 
    student, 
    isKhatim, 
    calculatedJuz, 
    onEdit, 
    onDelete, 
    onPrint, 
    deleting,
    getFirstName
}) {
    return (
        <>
            {/* Back Button */}
            <BackButton
                href="/teacher"
                text="عودة للقائمة الرئيسية"
                className="mb-6"
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 mb-4">
                <button
                    onClick={onEdit}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                >
                    <span>✏️</span> تعديل
                </button>
                <button
                    onClick={onDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <span>🗑️</span> {deleting ? 'جاري الحذف...' : 'حذف'}
                </button>
                <button
                    onClick={onPrint}
                    className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 shadow-lg shadow-slate-200 dark:shadow-none"
                >
                    <span>🖨️</span> طباعة التقرير
                </button>
            </div>

            {/* Header Card */}
            <div className="premium-glass rounded-[3rem] p-10 mb-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-50 rounded-full -translate-x-10 -translate-y-10 opacity-50"></div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-lg shadow-emerald-200">
                            {student?.name?.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{student?.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {isKhatim ? (
                                    <span className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 rounded-full text-sm font-black shadow-lg shadow-amber-200 flex items-center gap-2">
                                        <span>🏆</span>
                                        خاتم القرآن الكريم
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                        المحفوظ: {student?.hifzProgress}
                                    </span>
                                )}
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                    الخطة: {student?.reviewPlan}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="text-center bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm px-8 py-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">إجمالي الأجزاء</span>
                            <span className="text-3xl font-black text-slate-700 dark:text-white">{isKhatim ? '30' : calculatedJuz}</span>
                            {!isKhatim && <span className="text-sm font-bold text-slate-400 dark:text-slate-500 mr-1">جزء</span>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
