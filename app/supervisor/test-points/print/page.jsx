'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../../../components/Navbar';
import { useTheme } from '../../../components/ThemeProvider';
import LoadingScreen from '../../../components/LoadingScreen';
import BackButton from '../../../components/BackButton';

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
            const url = halaqaId ? `/api/students?halaqaId=${halaqaId}` : '/api/students';
            const res = await fetch(url);
            if (res.ok) {
                const allStudents = await res.json();
                let filtered = allStudents;
                
                if (halaqaId) {
                    filtered = allStudents.filter(s => s.halaqaId === parseInt(halaqaId));
                } else {
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

    if (!mounted || loading) return <LoadingScreen message="جاري تجهيز البطاقات..." />;

    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 rtl font-noto" dir="rtl">
            <div className="no-print">
                <Navbar userType={user.role?.toLowerCase() || 'supervisor'} userName="طباعة البطاقات" />
                <div className="max-w-4xl mx-auto pt-28 px-4 mb-6">
                    <BackButton text="رجوع" className="mb-4" />
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

            <main className="max-w-6xl mx-auto px-4 pb-20 print:p-0">
                <div className="grid-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:gap-0">
                    {students.map(student => (
                        <div key={student.id} className="card-container relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm print:shadow-none">
                            {/* Card Header */}
                            <div className="bg-slate-900 p-2 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                                        <img src="/logo.svg" decoding="async" className="max-w-full max-h-full object-contain" alt="logo" />
                                    </div>
                                    <div className="h-4 flex items-center">
                                        <img src="/logo-text-dark.png" className="h-full object-contain" alt="logo-text" />
                                    </div>
                                </div>
                                <div className="text-emerald-400 font-black text-[9px] uppercase tracking-tighter">
                                    بطاقة الطالب
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-3 flex-1 flex flex-col items-center justify-center text-center">
                                {student.halaqa?.logo ? (
                                    <div className="w-16 h-16 flex items-center justify-center mb-1">
                                        <img 
                                            src={student.halaqa.logo} 
                                            decoding="async"
                                            className="max-w-full max-h-full object-contain rounded-xl transform scale-110" 
                                            alt="halaqa-logo" 
                                        />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 mb-1"></div>
                                )}
                                <h3 className="text-sm font-black text-slate-800 mb-0.5">{student.name}</h3>
                                <p className="text-[8px] font-bold text-slate-400 mb-0.5">الحلقة: {student.halaqa?.name}</p>

                                <div className="p-2 bg-white rounded-2xl shadow-inner border border-slate-50 mb-2">
                                    <QRCodeSVG value={student.id.toString()} size={85} level="H" includeMargin={true} />
                                </div>

                                <div className="flex items-center justify-between w-full mt-1 px-1">
                                    <div className="text-[6px] font-black text-slate-300">#STU-{student.id}</div>
                                    <div className="text-left flex flex-col items-end">
                                        <div className="text-[6px] font-black text-slate-300">QURAN 2026</div>
                                        {student.family?.name && (
                                            <div className="text-[5px] font-black text-emerald-500 mt-0.5 leading-none">
                                                أسرة {student.family.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <style jsx>{`
                @media print {
                    @page { 
                        size: A4 portrait;
                        margin: 1cm;
                    }
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0; padding: 0 !important; }
                    main { 
                        width: 100% !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                        display: flex !important;
                        justify-content: center !important;
                    }
                    .grid-container {
                        width: 19cm !important;
                        display: grid !important;
                        grid-template-columns: 6cm 6cm 6cm !important;
                        gap: 0.5cm !important;
                        justify-content: center !important;
                    }
                    .card-container { 
                        break-inside: avoid;
                        page-break-inside: avoid;
                        width: 6cm !important;
                        height: 300px;
                        display: flex;
                        flex-direction: column;
                        border: 1px solid #ddd !important;
                        background: white !important;
                        margin: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
