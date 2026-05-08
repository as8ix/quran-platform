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
        <div className="min-h-screen bg-white font-noto p-8 text-right" dir="rtl">
            
            {/* ===== Controls - hidden on print ===== */}
            <div className="no-print flex flex-wrap justify-between items-center gap-4 mb-8 bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-3 ml-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-slate-100">
                            📅
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800">الجدول الدراسي الزمني</h2>
                            <p className="text-sm font-bold text-slate-500">للطالب: {student.name}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => router.push(`/teacher/student/${studentId}`)}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        ← عودة لملف الطالب
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        طباعة / PDF
                    </button>
                </div>
            </div>

            {/* Main Plan Area */}
            <div className="max-w-6xl mx-auto print:max-w-none">
                <div className="bg-white rounded-[3rem] p-0 print:p-0">
                    <StudyPlan student={student} onUpdate={fetchStudent} />
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print, button {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                    }
                    .premium-glass {
                        border: none !important;
                        background: transparent !important;
                        box-shadow: none !important;
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
