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
        const params = new URLSearchParams(window.location.search);
        const halaqaId = params.get('halaqaId');
        fetchStudents(halaqaId);
    }, []);

    const fetchStudents = async (halaqaId) => {
        try {
            const res = await fetch('/api/students');
            if (res.ok) {
                const allStudents = await res.json();
                let filtered = allStudents;
                
                if (halaqaId) {
                    filtered = allStudents.filter(s => s.halaqaId === parseInt(halaqaId));
                } else {
                    // Fallback to the old name if no ID provided (for safety)
                    filtered = allStudents.filter(s => s.halaqa?.name === 'حلقة التجربة الصيفية');
                }
                
                setStudents(filtered);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted || loading) return <div className="p-10 text-center">جاري تجهيز البطاقات...</div>;

    const user = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('user') || '{}') : {};

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 rtl font-noto" dir="rtl">
            <div className="no-print">
                <Navbar userType={user.role?.toLowerCase() || 'teacher'} userName="طباعة البطاقات" />
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

            <main className="max-w-6xl mx-auto px-4 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
                    {students.map(student => (
                        <div key={student.id} className="card-container relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm print:shadow-none print:m-1">
                            {/* Card Header */}
                            <div className="bg-slate-900 p-2 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <img src="/mosque-logo-white.png" className="w-5 h-5 object-contain" alt="logo" />
                                    <div className="text-[7px] text-white font-bold leading-tight">
                                        جامع الحديقة<br/>حي السلامة
                                    </div>
                                </div>
                                <div className="text-emerald-400 font-black text-[7px] uppercase tracking-tighter">
                                    بطاقة الطالب الصيفية
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-3 flex flex-col items-center text-center">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl mb-2">🎓</div>
                                <h3 className="text-sm font-black text-slate-800 mb-0.5">{student.name}</h3>
                                <p className="text-[8px] font-bold text-slate-400 mb-0.5">الحلقة: {student.halaqa?.name}</p>
                                <p className="text-[8px] font-bold text-emerald-600 mb-3 italic">المعلم: {user.name || '---'}</p>

                                <div className="p-2 bg-white rounded-2xl shadow-inner border border-slate-50 mb-2">
                                    <QRCodeSVG value={student.id.toString()} size={85} level="H" includeMargin={true} />
                                </div>

                                <div className="flex items-center justify-between w-full mt-1 px-1">
                                    <div className="text-[6px] font-black text-slate-300">#STU-{student.id}</div>
                                    <div className="text-[6px] font-black text-slate-300">QURAN 2026</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <style jsx>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0; padding: 10px; }
                    .card-container { 
                        break-inside: avoid;
                        page-break-inside: avoid;
                        width: 100%;
                        height: 280px;
                        display: flex;
                        flex-direction: column;
                    }
                    main { padding: 0 !important; width: 100% !important; }
                }
            `}</style>
        </div>
    );
}
