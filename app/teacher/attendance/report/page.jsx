'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ReportContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'week'; // 'week' | 'month'
    const dateParam = searchParams.get('date');

    const [students, setStudents] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [dateRange, setDateRange] = useState([]);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    // Get user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // 1. Calculate Hijri Date Range
                // We calculate the start/end of the *Hijri* month containing the pivot date.
                const pivotDate = dateParam ? new Date(dateParam) : new Date();

                // Helper to get Hijri Month string (e.g., "Muharram 1447")
                const getHijriMonthStr = (d) => new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', year: 'numeric' }).format(d);

                const currentHijriMonth = getHijriMonthStr(pivotDate);
                let startDate = new Date(pivotDate);
                let endDate = new Date(pivotDate);

                // Find Start of Hijri Month
                while (getHijriMonthStr(new Date(startDate.getTime() - 86400000)) === currentHijriMonth) {
                    startDate.setDate(startDate.getDate() - 1);
                }

                // Find End of Hijri Month
                while (getHijriMonthStr(new Date(endDate.getTime() + 86400000)) === currentHijriMonth) {
                    endDate.setDate(endDate.getDate() + 1);
                }

                // Title (in Arabic) including Hijri Year
                const reportTitle = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { month: 'long', year: 'numeric' }).format(pivotDate);
                if (type === 'week') {
                    const now = new Date(pivotDate);
                    const day = now.getDay();
                    const diffToSun = now.getDate() - day;
                    startDate = new Date(now);
                    startDate.setDate(diffToSun); // Sunday
                    endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 4); // Thursday

                    const startHijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long' }).format(startDate);
                    const endHijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long' }).format(endDate);
                    setTitle(`تقرير الحضور الأسبوعي: ${startHijri} - ${endHijri}`);
                } else {
                    setTitle(`تقرير الحضور الشهري: ${reportTitle}`);
                }

                // 2. Generate Headers (Hijri)
                const dates = [];
                let current = new Date(startDate);
                while (current <= endDate) {
                    dates.push({
                        iso: current.toISOString().split('T')[0],
                        display: new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { weekday: 'short', day: 'numeric' }).format(current)
                    });
                    current.setDate(current.getDate() + 1);
                }
                setDateRange(dates);

                // 3. Fetch Data
                const startStr = startDate.toISOString().split('T')[0];
                const endStr = endDate.toISOString().split('T')[0];

                // First find teacher's halaqaId
                let currentTeacherHalaqaId = null;
                const halaqasRes = await fetch('/api/halaqas');
                if (halaqasRes.ok) {
                    const allHalaqas = await halaqasRes.json();
                    const myHalaqas = allHalaqas.filter(h =>
                        h.teacherId === user.id ||
                        (h.assistants && h.assistants.some(a => a.id === user.id))
                    );
                    if (myHalaqas.length > 0) {
                        currentTeacherHalaqaId = myHalaqas[0].id;
                    }
                }

                let studentsUrl = '/api/students';
                if (currentTeacherHalaqaId) {
                    studentsUrl += `?halaqaId=${currentTeacherHalaqaId}`;
                }

                const [studentsRes, attendanceRes] = await Promise.all([
                    fetch(studentsUrl),
                    fetch(`/api/attendance?startDate=${startStr}&endDate=${endStr}`)
                ]);

                const studentsData = await studentsRes.json();
                const attendanceData = await attendanceRes.json();

                setStudents(studentsData);
                setReportData(attendanceData);
            } catch (error) {
                console.error("Error loading report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [type, dateParam, user]);

    const getStatus = (studentId, dateIso) => {
        // 1. Check if it's an Off Day (Thu=4, Fri=5, Sat=6)
        const dayOfWeek = new Date(dateIso).getDay();
        if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) return 'OFF_DAY';

        // 2. Check for actual record
        const record = reportData.find(r => r.studentId === studentId && new Date(r.date).toISOString().split('T')[0] === dateIso);

        if (record) return record.status;

        // 3. Check if future
        const today = new Date().toISOString().split('T')[0];
        if (dateIso > today) return 'NONE';

        // 4. Default Present
        return 'PRESENT';
    };

    const getStats = () => {
        let present = 0, late = 0, absent = 0, total = 0;
        students.forEach(s => {
            dateRange.forEach(d => {
                const status = getStatus(s.id, d.iso);
                if (status === 'PRESENT') present++;
                else if (status === 'LATE') late++;
                else if (status.includes('ABSENT')) absent++;

                if (status !== 'NONE' && status !== 'OFF_DAY') total++;
            });
        });
        return { present, late, absent, total };
    };

    const stats = getStats();

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'PRESENT': return {
                icon: <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
                bg: 'bg-emerald-50'
            };
            case 'LATE': return {
                icon: <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                bg: 'bg-amber-50'
            };
            case 'ABSENT_EXCUSED': return {
                icon: <span className="text-orange-500 font-bold text-lg">ع</span>,
                bg: 'bg-orange-50'
            };
            case 'ABSENT_UNEXCUSED': return {
                icon: <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
                bg: 'bg-rose-50'
            };
            case 'OFF_DAY': return {
                icon: <span className="text-slate-400/50 text-xl font-bold">.</span>,
                bg: 'bg-slate-200/70' // Darker gray
            };
            default: return { icon: <span className="text-slate-300">-</span>, bg: 'bg-slate-50' };
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-500">جاري إعداد التقرير...</div>;

    return (
        <div className="min-h-screen bg-white font-noto p-8 text-right" dir="rtl">
            {/* Header / Actions */}
            <div className="flex justify-between items-start mb-8 no-print">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    طباعة / حفظ PDF
                </button>
            </div>

            {/* Report Header */}
            <div className="bg-slate-50 rounded-[2rem] p-8 mb-8 border border-slate-100 shadow-sm print:shadow-none print:border-none print:bg-transparent print:p-0">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2">تقرير الحضور والغياب</h1>
                        <p className="text-slate-500 font-medium text-lg">{title}</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[100px] print:border-slate-300">
                            <span className="text-slate-400 text-xs font-bold mb-1">حاضر</span>
                            <span className="text-2xl font-black text-emerald-600">{stats.present}</span>
                        </div>
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[100px] print:border-slate-300">
                            <span className="text-slate-400 text-xs font-bold mb-1">متأخر</span>
                            <span className="text-2xl font-black text-amber-500">{stats.late}</span>
                        </div>
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[100px] print:border-slate-300">
                            <span className="text-slate-400 text-xs font-bold mb-1">غياب</span>
                            <span className="text-2xl font-black text-rose-500">{stats.absent}</span>
                        </div>
                    </div>
                </div>

                {/* Report Tables (Split for Print) */}
                {(() => {
                    // Split dates into chunks of 8 (approx 1 week) to fit ~4 pages per month as requested
                    const chunkSize = 8;
                    const chunks = [];
                    for (let i = 0; i < dateRange.length; i += chunkSize) {
                        chunks.push(dateRange.slice(i, i + chunkSize));
                    }

                    return chunks.map((chunk, chunkIndex) => (
                        <div key={chunkIndex} className={`bg-white rounded-[1.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 mb-8 print:shadow-none print:rounded-none print:border-0 ${chunkIndex > 0 ? 'print:break-before-page' : ''}`}>
                            <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-500 text-sm print:hidden">
                                الجزء {chunkIndex + 1} (الأيام {chunk[0].display.split(' ').pop()} - {chunk[chunk.length - 1].display.split(' ').pop()})
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 print:bg-slate-100 print:border-slate-300">
                                            <th className="p-4 font-black text-slate-600 text-right min-w-[200px] sticky right-0 bg-slate-50 z-10 print:static">
                                                الطالب
                                            </th>
                                            {chunk.map(d => (
                                                <th key={d.iso} className="p-3 font-bold text-slate-500 text-center border-l border-slate-50 last:border-0 print:border-slate-200">
                                                    <div className="flex flex-col min-w-[3rem]">
                                                        <span className="text-xs text-slate-400">{d.display.split(' ').slice(0, -1).join(' ')}</span>
                                                        <span className="text-lg text-slate-700 font-bold">{d.display.split(' ').slice(-1)}</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {students.map((student, idx) => (
                                            <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                                                <td className="p-4 font-bold text-slate-800 border-l border-slate-100 sticky right-0 z-10 print:static bg-inherit print:border-slate-200">
                                                    {student.name}
                                                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">ID: #{student.id}</div>
                                                </td>
                                                {chunk.map(d => {
                                                    const status = getStatus(student.id, d.iso);
                                                    const display = getStatusDisplay(status);
                                                    return (
                                                        <td key={d.iso} className={`p-2 text-center border-l border-slate-100 print:border-slate-200 ${display.bg}`}>
                                                            <div className="flex justify-center items-center h-full">
                                                                {display.icon}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ));
                })()}
            </div>

            <div className="mt-8 text-xs text-slate-400 text-center flex justify-between px-4 print:text-black">
                <span>تم استخراج هذا التقرير بتاريخ {new Date().toLocaleDateString('ar-SA')}</span>
                <span>منصة تحفيظ القرآن الكريم</span>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: landscape; margin: 0.5cm; }
                    .no-print { display: none !important; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-none { border: none !important; }
                    .print\\:bg-transparent { background: transparent !important; }
                }
            `}</style>
        </div>
    );
}

export default function ReportPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReportContent />
        </Suspense>
    );
}
