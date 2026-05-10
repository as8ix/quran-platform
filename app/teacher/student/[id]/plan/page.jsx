'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import StudyPlan from '../../../../components/StudyPlan';

export default function StudentPlanPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.id;
    
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudent();
    }, [studentId]);

    const fetchStudent = async () => {
        try {
            const res = await fetch(`/api/students?id=${studentId}`);
            if (res.ok) {
                const data = await res.json();
                setStudent(Array.isArray(data) ? data[0] : data);
            } else {
                toast.error('خطأ في جلب بيانات الطالب');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-indigo-600 animate-pulse text-xl">
                جاري صياغة الجدول الزمني...
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xl">
                الطالب غير موجود
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 pt-24 pb-20 px-4" dir="rtl">
            
            {/* Action Bar - Hidden on Print */}
            <div className="max-w-6xl mx-auto no-print mb-6 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none sticky top-24 z-10">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.push(`/teacher/student/${studentId}`)}
                        className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                    >
                        ← عودة لملف الطالب
                    </button>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200/50"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        طباعة / PDF
                    </button>
                </div>
            </div>

            {/* Official Report Card */}
            <main className="max-w-6xl mx-auto bg-white dark:bg-slate-950 p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 print:shadow-none print:border-none print:p-0">
                
                {/* Official Branded Header */}
                <div className="mb-12 flex flex-col md:flex-row justify-between items-center gap-8 border-b-4 border-emerald-600 pb-8">
                    <div className="flex items-center gap-6">
                        <img src="/logo_transparent.png" alt="Logo" className="h-24 w-auto" />
                        <div className="text-right">
                            <h1 className="text-4xl font-black text-emerald-700 mb-1">الخطة القرآنية</h1>
                            <p className="text-sm font-bold text-slate-400">جميع الحقوق محفوظة لبرنامج مفصل</p>
                        </div>
                    </div>
                    
                    <div className="text-center md:text-left">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                            <div className="text-2xl font-black text-slate-800 dark:text-white mb-1">{student.name}</div>
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">خطة متابعة الحفظ والمراجعة الزمانية</div>
                        </div>
                    </div>
                </div>

                {/* The Plan Component */}
                <StudyPlan student={student} onUpdate={fetchStudent} />

                {/* Footer (for print) */}
                <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center opacity-50 text-[10px] font-bold text-slate-400">
                    <div>تم استخراج هذا التقرير بتاريخ: {new Date().toLocaleDateString('ar-SA')}</div>
                    <div>منصة "مفصل" لمتابعة حفظ القرآن الكريم</div>
                </div>
            </main>

            <style jsx global>{`
                @media print {
                    .no-print, .no-print * {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    main {
                        box-shadow: none !important;
                        border: none !important;
                        max-width: 100% !important;
                        width: 100% !important;
                        padding: 0 !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}
