'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { useTheme } from '@/app/components/ThemeProvider';
import LoadingScreen from '@/app/components/LoadingScreen';

// Components
import CardsReportHeader from '@/app/components/Points/CardsReportHeader';
import CardsControlPanel from '@/app/components/Points/CardsControlPanel';
import SmartCardItem from '@/app/components/Points/SmartCardItem';

export default function PrintCardsPage() {
    const router = useRouter();
    const { mounted } = useTheme();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        
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
                } else if (user?.halaqaId) {
                    filtered = allStudents.filter(s => s.halaqaId === user.halaqaId);
                }
                
                setStudents(filtered);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted || loading) return <LoadingScreen message="جاري تجهيز تقرير البطاقات..." />;

    const halaqaName = students.length > 0 ? students[0].halaqa?.name : '---';

    return (
        <div className="min-h-screen bg-white rtl font-noto pt-10" dir="rtl">

            <CardsControlPanel 
                onPrint={() => window.print()} 
                onBack={() => router.back()} 
                studentsCount={students.length}
            />

            <main className="max-w-6xl mx-auto px-4 pb-20 print:p-0 print:max-w-none">
                <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 print:bg-white print:border-none print:p-[2cm] print:rounded-none">
                    <div className="no-print">
                        <CardsReportHeader 
                            halaqaName={halaqaName}
                            teacherName={user?.name}
                            studentsCount={students.length}
                        />
                    </div>

                    <div className="grid-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:gap-10 mt-16">
                        {students.map(student => (
                            <SmartCardItem key={student.id} student={student} />
                        ))}
                    </div>

                    {/* Footer Info for Report */}
                    <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold print:text-black">
                        <span>تم استخراج هذا التقرير آلياً عبر منصة تحفيظ القرآن الكريم</span>
                        <span>{new Date().toLocaleDateString('ar-SA')} م</span>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                @media print {
                    @page { 
                        size: A4 portrait;
                        margin: 2cm 1cm;
                    }
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    main { 
                        width: 100% !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                        background: white !important;
                    }
                    .grid-container {
                        width: 100% !important;
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 20px !important;
                        justify-items: center !important;
                    }
                    .card-container { 
                        break-inside: avoid;
                        page-break-inside: avoid;
                        border: 1px solid #eee !important;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    .card-header-print {
                        background-color: #0f172a !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}
