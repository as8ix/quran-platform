'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FinancialSection({ loading, students }) {
    const router = useRouter();
    const [activeTerm, setActiveTerm] = useState('feeStatusTerm1');

    const paidStudentsT1 = students.filter(s => s.feeStatusTerm1 === 'PAID').length;
    const paidStudentsT2 = students.filter(s => s.feeStatusTerm2 === 'PAID').length;
    const paidStudentsSummer = students.filter(s => s.feeStatusSummer === 'PAID').length;

    const currentPaidCount = activeTerm === 'feeStatusTerm1' ? paidStudentsT1 : (activeTerm === 'feeStatusTerm2' ? paidStudentsT2 : paidStudentsSummer);
    const currentPendingCount = students.length - currentPaidCount;
    const currentPercentage = students.length > 0 ? Math.round((currentPaidCount / students.length) * 100) : 0;

    return (
        <div className="mt-12 mb-12 reveal reveal-delay-3">
            <div className="premium-glass rounded-[3.5rem] p-8 md:p-12 shadow-2xl border border-white/20 dark:border-slate-800/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-700"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full -ml-48 -mb-48 blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-700"></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex-1 text-right">
                        <div className="flex items-center gap-4 mb-4 justify-end lg:justify-start lg:flex-row-reverse">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">الإدارة المالية والرسوم</h2>
                            <span className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-emerald-200 dark:shadow-none">💰</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-bold mb-8 max-w-2xl">
                            تتبع حالة تحصيل الرسوم للفترة الحالية بشكل مركزي ودقيق.
                        </p>

                        <div className="flex gap-2 mb-8 justify-end lg:justify-start">
                            {[
                                { id: 'feeStatusTerm1', label: 'الترم الأول' },
                                { id: 'feeStatusTerm2', label: 'الترم الثاني' },
                                { id: 'feeStatusSummer', label: 'الصيف' }
                            ].map(term => (
                                <button
                                    key={term.id}
                                    onClick={() => setActiveTerm(term.id)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${activeTerm === term.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                >
                                    {term.label}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-6 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-5">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-xl font-black">✓</div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تم السداد</div>
                                    <div className="text-2xl font-black text-slate-800 dark:text-white">{currentPaidCount} طالب</div>
                                </div>
                            </div>
                            <div className="p-6 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-5">
                                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center text-xl font-black">!</div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">بانتظار السداد</div>
                                    <div className="text-2xl font-black text-slate-800 dark:text-white">{currentPendingCount} طالب</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-72 flex flex-col items-center gap-6 shrink-0">
                        <div className="relative w-48 h-48">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                                <circle
                                    cx="96" cy="96" r="80"
                                    stroke="currentColor" strokeWidth="16" fill="transparent"
                                    strokeDasharray={502.6}
                                    strokeDashoffset={502.6 - (502.6 * currentPercentage / 100)}
                                    className="text-emerald-500 transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-slate-800 dark:text-white">{currentPercentage}%</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">نسبة التحصيل</span>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push(`/supervisor/reports/custom-list?preselect=${activeTerm}`)}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <span>📊 عرض كشف الرسوم</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
