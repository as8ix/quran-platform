'use client';

import { useRouter } from 'next/navigation';

export default function ReportTypeModal({ show, onClose, selectedHalaqa }) {
    const router = useRouter();
    if (!show || !selectedHalaqa) return null;

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="absolute inset-0 bg-slate-900/60" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden animate-slideUp">
                <div className="p-8 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-center">
                    <h3 className="text-2xl font-black mb-1">اختر نوع التقرير</h3>
                    <p className="text-amber-100 font-bold text-sm">حلقة: {selectedHalaqa.name.replace('حلقة: ', '')}</p>
                </div>

                <div className="p-8 space-y-4">
                    <button
                        onClick={() => router.push(`/supervisor/reports?teacherId=${selectedHalaqa.teacherId}`)}
                        className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all group flex items-center gap-4 text-right"
                    >
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">📊</div>
                        <div>
                            <div className="font-black text-slate-800 dark:text-white text-lg">التقرير المجمع الشامل</div>
                            <div className="text-xs font-bold text-slate-400">إنجاز الحفظ والمراجعة الأسبوعي</div>
                        </div>
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => router.push(`/supervisor/attendance/report?type=week&teacherId=${selectedHalaqa.teacherId}`)}
                            className="p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-amber-500/30 transition-all group flex flex-col items-center gap-3 text-center"
                        >
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">📅</div>
                            <div className="font-black text-slate-800 dark:text-white text-sm">حضور أسبوعي</div>
                        </button>
                        <button
                            onClick={() => router.push(`/supervisor/attendance/report?type=month&teacherId=${selectedHalaqa.teacherId}`)}
                            className="p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-amber-500/30 transition-all group flex flex-col items-center gap-3 text-center"
                        >
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">🗓️</div>
                            <div className="font-black text-slate-800 dark:text-white text-sm">حضور شهري</div>
                        </button>
                    </div>

                    <button
                        onClick={() => router.push(`/supervisor/reports/custom-list?teacherId=${selectedHalaqa.teacherId}`)}
                        className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all group flex items-center gap-4 text-right"
                    >
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">📋</div>
                        <div>
                            <div className="font-black text-slate-800 dark:text-white text-lg">قائمة بيانات الطلاب</div>
                            <div className="text-xs font-bold text-slate-400">اختر الحقول، انسخ كنص، أو اطبعها كجدول رسمي</div>
                        </div>
                    </button>

                    <button
                        onClick={() => router.push(`/supervisor/test-points/print?halaqaId=${selectedHalaqa.id}`)}
                        className="w-full mt-4 p-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-3xl shadow-xl shadow-emerald-500/20 transition-all group flex items-center gap-5 text-right border-b-4 border-emerald-800"
                    >
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🖨️</div>
                        <div>
                            <div className="font-black text-xl">طباعة بطاقات النقاط (QR)</div>
                            <div className="text-xs font-bold text-emerald-100 opacity-80">بطاقات تعريفية للطلاب مع باركود رصد النقاط</div>
                        </div>
                    </button>

                    <button onClick={onClose} className="w-full py-4 text-slate-400 dark:text-slate-500 font-bold hover:text-slate-600 dark:hover:text-slate-300 transition-colors">إلغاء</button>
                </div>
            </div>
        </div>
    );
}
