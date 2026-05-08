'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import StudyPlan from '../../../../components/StudyPlan';
import Navbar from '../../../../components/Navbar';
import LoadingScreen from '../../../../components/LoadingScreen';
import BackButton from '../../../../components/BackButton';

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

    if (loading) return <LoadingScreen />;
    if (!student) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400">الطالب غير موجود</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-noto rtl transition-colors duration-300" dir="rtl">
            <Navbar 
                userType="teacher" 
                userName={student ? `خطة الطالب: ${student.name}` : 'الخطة الدراسية'} 
                onLogout={() => router.push('/login')} 
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-indigo-100 dark:shadow-none">
                            📅
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">الجدول الدراسي الزمني</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2 text-lg">
                                للطالب: <span className="text-indigo-600 dark:text-indigo-400">{student.name}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push(`/teacher/student/${studentId}`)}
                            className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                        >
                            ← العودة للملف
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            طباعة الخطة
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none print:shadow-none print:border-none print:bg-transparent print:p-0">
                    <StudyPlan student={student} onUpdate={fetchStudent} />
                </div>
            </main>

            <style jsx global>{`
                @media print {
                    .no-print, nav, button {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                    }
                    main {
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .premium-glass {
                        border: none !important;
                        background: transparent !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
