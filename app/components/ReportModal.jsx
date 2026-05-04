'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportModal({ isOpen, onClose, teacher, teacherNames }) {
    const router = useRouter();
    const [role, setRole] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setRole(JSON.parse(storedUser).role);
        }
    }, []);

    if (!isOpen) return null;

    const teacherId = teacher?.id;
    const basePath = role === 'SUPERVISOR' ? '/supervisor' : '/teacher';

    const icons = {
        reports: (
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        attendance: (
            <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        lock: (
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        )
    };

    return (
        <div className="modal-overlay animate-fadeIn" onClick={onClose}>
            <div className="modal-content animate-slideUp max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="relative overflow-hidden rounded-[2.5rem]">
                    <div className="relative z-10">
                        <div className="modal-header border-b border-slate-100 dark:border-slate-800 pb-6 mb-2 flex items-center justify-between">
                            <div className="text-right">
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">خيارات التقارير</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1">
                                    {teacherNames ? (
                                        <>المعلم: <span className="text-emerald-600 dark:text-emerald-400">{teacherNames}</span></>
                                    ) : (
                                        'اختر التقرير المطلوب عرضه'
                                    )}
                                </p>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body space-y-4 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar px-2 -mx-2">
                            <button
                                onClick={() => {
                                    const url = teacherId ? `${basePath}/reports?teacherId=${teacherId}` : `${basePath}/reports`;
                                    window.open(url, '_blank');
                                    onClose();
                                }}
                                className="w-full p-5 bg-white dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all duration-300 group"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
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
                            <div className="pt-2">
                                <div className="flex items-center gap-2 mb-3 px-2">
                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                    <h4 className="font-black text-sm text-slate-600 dark:text-slate-400">تقارير الحضور والغياب</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            const url = teacherId ? `${basePath}/attendance/report?type=week&teacherId=${teacherId}` : `${basePath}/attendance/report?type=week`;
                                            window.open(url, '_blank');
                                            onClose();
                                        }}
                                        className="p-5 bg-white dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-3 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                            {icons.attendance}
                                        </div>
                                        <div className="text-center">
                                            <div className="font-black text-slate-800 dark:text-white">التقرير الأسبوعي</div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">كشف غياب الأسبوع</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            const url = teacherId ? `${basePath}/attendance/report?type=month&teacherId=${teacherId}` : `${basePath}/attendance/report?type=month`;
                                            window.open(url, '_blank');
                                            onClose();
                                        }}
                                        className="p-5 bg-white dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-3 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                            <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v12a2 2 0 01-2 2z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h6m-6 4h6m-6 4h6" />
                                            </svg>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-black text-slate-800 dark:text-white">التقرير الشهري</div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">كشف غياب الشهر</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center gap-2 mb-3 px-2">
                                    <div className="w-1.5 h-6 bg-teal-500 rounded-full"></div>
                                    <h4 className="font-black text-sm text-slate-600 dark:text-slate-400">تقارير مخصصة</h4>
                                </div>
                                <button
                                    onClick={() => {
                                        const url = teacherId ? `${basePath}/reports/custom-list?teacherId=${teacherId}` : `${basePath}/reports/custom-list`;
                                        window.open(url, '_blank');
                                        onClose();
                                    }}
                                    className="w-full p-5 bg-white dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-lg transition-all duration-300 group"
                                >
                                    <div className="flex items-center gap-5 text-right">
                                        <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 transition-colors">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-black text-lg text-slate-800 dark:text-white">قائمة بيانات الطلاب</div>
                                            <div className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5">اختر الحقول، انسخ كنص، أو اطبعها كجدول رسمي</div>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-teal-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => {
                                        const url = teacherId ? `${basePath}/reports/custom?teacherId=${teacherId}` : `${basePath}/reports/custom`;
                                        window.open(url, '_blank');
                                        onClose();
                                    }}
                                    className="w-full p-5 mt-4 bg-white dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all duration-300 group"
                                >
                                    <div className="flex items-center gap-5 text-right">
                                        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 rounded-xl flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-black text-lg text-slate-800 dark:text-white">كشف متابعة مخصص</div>
                                            <div className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5">اصنع كشفاً سريعاً لأي غرض (استلام، مشاركة، إلخ)</div>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="modal-footer mt-2">
                            <button 
                                onClick={onClose} 
                                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }
                .modal-content {
                    background: white;
                    width: 100%;
                    border-radius: 2.5rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    padding: 2.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                :global(.dark) .modal-content {
                    background: #0f172a;
                    border-color: rgba(255, 255, 255, 0.05);
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
                .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.2, 1, 0.3, 1); }
            `}</style>
        </div>
    );
}
