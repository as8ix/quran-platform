'use client';

import { formatHijri } from '@/app/utils/dateUtils';
import BackButton from '@/app/components/BackButton';

export default function AttendanceHeader({ date, setDate, openReport }) {
    return (
        <>
            <BackButton 
                href="/teacher" 
                text="عودة للقائمة الرئيسية" 
                className="mb-6" 
            />

            <div className="mb-10 space-y-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">كشف الحضور والغياب</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">قم بتحديد حالة حضور الطلاب لهذا اليوم</p>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="w-full md:w-auto premium-glass p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-wrap md:flex-nowrap items-center justify-center gap-3 px-4">
                        <span className="text-slate-400 font-bold text-sm">التاريخ:</span>

                        {/* Hijri Primary */}
                        <div className="font-black text-emerald-600 dark:text-emerald-400 text-base md:text-lg whitespace-nowrap">
                            {formatHijri(date, 'long')}
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block h-8 w-[2px] bg-slate-100 dark:bg-slate-700 mx-1"></div>

                        {/* Gregorian Secondary */}
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent font-bold text-slate-400 dark:text-slate-500 text-sm outline-none cursor-pointer"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <button
                            onClick={() => openReport('week')}
                            className="flex-1 md:flex-none px-4 md:px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap text-xs md:text-sm"
                        >
                            <span>📄</span>
                            تقرير أسبوعي
                        </button>
                        <button
                            onClick={() => openReport('month')}
                            className="flex-1 md:flex-none px-4 md:px-6 py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl font-bold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap text-xs md:text-sm"
                        >
                            <span>📊</span>
                            تقرير شهري
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
