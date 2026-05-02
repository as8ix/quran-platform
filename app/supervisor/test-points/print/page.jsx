'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../../../components/Navbar';
import { useTheme } from '../../../components/ThemeProvider';

export default function PrintCardsPage() {
    const { mounted } = useTheme();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/students');
            if (res.ok) {
                const allStudents = await res.json();
                const testStudents = allStudents.filter(s => s.halaqa?.name === 'حلقة التجربة الصيفية');
                setStudents(testStudents);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted || loading) return <div className="p-10 text-center">جاري تجهيز البطاقات...</div>;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 rtl font-noto" dir="rtl">
            <div className="no-print">
                <Navbar userType="supervisor" userName="طباعة البطاقات" />
                <div className="max-w-4xl mx-auto pt-28 px-4 mb-10">
                    <div className="bg-emerald-600 text-white p-8 rounded-[2rem] shadow-xl flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-black mb-2">بطاقات الطلاب الذكية 💳</h1>
                            <p className="font-bold opacity-90">جاهزة للطباعة والقص واستخدامها في نظام النقاط</p>
                        </div>
                        <button 
                            onClick={() => window.print()}
                            className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-black shadow-lg hover:scale-105 transition-all"
                        >
                            🖨️ ابدأ الطباعة الآن
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
                    {students.map(student => (
                        <div key={student.id} className="card-container relative overflow-hidden bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm print:shadow-none print:border-slate-200">
                            {/* Card Header */}
                            <div className="bg-slate-900 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <img src="/mosque-logo-white.png" className="w-8 h-8 object-contain" alt="logo" />
                                    <div className="text-[10px] text-white font-bold leading-tight">
                                        جامع الحديقة<br/>حي السلامة
                                    </div>
                                </div>
                                <div className="text-emerald-400 font-black text-[10px] uppercase tracking-tighter">
                                    بطاقة الطالب الصيفية
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mb-4">🎓</div>
                                <h3 className="text-xl font-black text-slate-800 mb-1">{student.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 mb-6">الحلقة: {student.halaqa?.name}</p>

                                <div className="p-4 bg-white rounded-3xl shadow-inner border-2 border-slate-50 mb-4">
                                    <QRCodeSVG value={student.id.toString()} size={140} level="H" includeMargin={true} />
                                </div>

                                <div className="flex items-center justify-between w-full mt-2 px-2">
                                    <div className="text-[8px] font-black text-slate-300">#STUDENT-{student.id}</div>
                                    <div className="text-[8px] font-black text-slate-300">QURAN PLATFORM 2026</div>
                                </div>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                            <div className="absolute top-1/2 -left-4 w-8 h-8 bg-slate-50 rounded-full print:hidden"></div>
                            <div className="absolute top-1/2 -right-4 w-8 h-8 bg-slate-50 rounded-full print:hidden"></div>
                        </div>
                    ))}
                </div>
            </main>

            <style jsx>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0; padding: 0; }
                    .card-container { 
                        break-inside: avoid;
                        margin-bottom: 20px;
                        page-break-inside: avoid;
                        width: 100%;
                    }
                    main { padding: 0 !important; }
                }
            `}</style>
        </div>
    );
}
