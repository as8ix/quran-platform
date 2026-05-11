'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BaseModal from '@/app/components/Global/BaseModal';

export default function ReportModal({ isOpen, onClose, teacher, teacherNames }) {
    const router = useRouter();
    const [role, setRole] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setRole(JSON.parse(storedUser).role);
        }
    }, []);

    const teacherId = teacher?.id;
    const basePath = role === 'SUPERVISOR' ? '/supervisor' : '/teacher';

    const icons = {
        reports: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        week: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        month: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v12a2 2 0 01-2 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 8h6m-6 4h6m-6 4h6" />
            </svg>
        ),
        data: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        custom: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        )
    };

    return (
        <BaseModal 
            isOpen={isOpen} 
            onClose={onClose} 
            maxWidth="max-w-lg"
            hideHeader={true}
            noPadding={true}
        >
            <div className="flex flex-col h-[min(750px,90vh)] bg-white dark:bg-slate-900 overflow-hidden" dir="rtl">
                {/* Adaptive Header */}
                <div className="bg-white dark:bg-indigo-600 p-8 sm:p-10 relative overflow-hidden shrink-0 shadow-sm dark:shadow-lg z-20 border-b border-slate-100 dark:border-transparent">
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="text-right">
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white leading-tight">خيارات التقارير</h2>
                            {teacherNames && (
                                <p className="text-indigo-600 dark:text-indigo-100 font-bold mt-1 text-xs sm:text-sm italic">
                                    المعلم: <span className="text-slate-600 dark:text-white">{teacherNames}</span>
                                </p>
                            )}
                        </div>
                        <button onClick={onClose} className="text-slate-400 dark:text-white/60 hover:text-slate-600 dark:hover:text-white transition-colors">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="hidden dark:block absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50 dark:bg-slate-950/20 z-10 space-y-8">
                    {/* Full Report Button */}
                    <button
                        onClick={() => {
                            const url = teacherId ? `${basePath}/reports?teacherId=${teacherId}` : `${basePath}/reports`;
                            window.open(url, '_blank');
                            onClose();
                        }}
                        className="w-full p-5 bg-white dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500 rounded-2xl flex items-center justify-between hover:shadow-lg transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
                                {icons.reports}
                            </div>
                            <div className="text-right">
                                <div className="font-black text-lg text-slate-800 dark:text-white">التقرير المجمع الشامل</div>
                                <div className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5">يشمل الحفظ والمراجعة والحضور الأسبوعي</div>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Attendance Reports Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 px-2">
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                            <h4 className="font-black text-sm text-slate-600 dark:text-slate-400">تقارير الحضور والغياب</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'week', label: 'التقرير الأسبوعي', desc: 'كشف غياب الأسبوع' },
                                { id: 'month', label: 'التقرير الشهري', desc: 'كشف غياب الشهر' }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        const url = teacherId ? `${basePath}/attendance/report?type=${opt.id}&teacherId=${teacherId}` : `${basePath}/attendance/report?type=${opt.id}`;
                                        window.open(url, '_blank');
                                        onClose();
                                    }}
                                    className="p-5 bg-white dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-3 hover:border-indigo-500 hover:shadow-lg transition-all duration-300 group"
                                >
                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                        {icons[opt.id]}
                                    </div>
                                    <div className="text-center">
                                        <div className="font-black text-slate-800 dark:text-white">{opt.label}</div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">{opt.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Reports Section */}
                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-3 px-2">
                            <div className="w-1.5 h-6 bg-teal-500 rounded-full"></div>
                            <h4 className="font-black text-sm text-slate-600 dark:text-slate-400">تقارير مخصصة</h4>
                        </div>
                        <div className="space-y-4">
                            {[
                                { id: 'data', path: 'custom-list', label: 'قائمة بيانات الطلاب', desc: 'اختر الحقول، انسخ كنص، أو اطبعها كجدول رسمي', color: 'teal' },
                                { id: 'custom', path: 'custom', label: 'كشف متابعة مخصص', desc: 'اصنع كشفاً سريعاً لأي غرض (استلام، مشاركة، إلخ)', color: 'amber' }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        const url = teacherId ? `${basePath}/reports/${opt.path}?teacherId=${teacherId}` : `${basePath}/reports/${opt.path}`;
                                        window.open(url, '_blank');
                                        onClose();
                                    }}
                                    className={`w-full p-5 bg-white dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:border-${opt.color}-500 hover:shadow-lg transition-all duration-300 group`}
                                >
                                    <div className="flex items-center gap-5 text-right">
                                        <div className={`w-14 h-14 bg-${opt.color}-50 dark:bg-${opt.color}-900/20 text-${opt.color}-600 dark:text-${opt.color}-400 rounded-xl flex items-center justify-center group-hover:bg-${opt.color}-100 dark:group-hover:bg-${opt.color}-900/30 transition-colors`}>
                                            {icons[opt.id]}
                                        </div>
                                        <div>
                                            <div className="font-black text-lg text-slate-800 dark:text-white">{opt.label}</div>
                                            <div className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5">{opt.desc}</div>
                                        </div>
                                    </div>
                                    <svg className={`w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-${opt.color}-500 transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-20">
                    <button 
                        onClick={onClose} 
                        className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm shadow-inner"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </BaseModal>
    );
}
