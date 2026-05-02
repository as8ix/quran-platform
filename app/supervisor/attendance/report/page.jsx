'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const getHParts = (d) => {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', year: 'numeric' }).formatToParts(d);
    const m = parts.find(p => p.type === 'month')?.value;
    const y = parts.find(p => p.type === 'relatedYear' || p.type === 'year')?.value;
    return { m: parseInt(m), y: parseInt(y) };
};

const getGregorianDateFromHijri = (hijriYear, hijriMonthIndex) => {
    const estimateGYear = Math.floor(hijriYear - hijriYear / 33 + 622);
    let current = new Date(estimateGYear, 0, 1);
    
    let h = getHParts(current);
    let diff = (hijriYear - h.y) * 12 + (hijriMonthIndex - h.m);
    current.setDate(current.getDate() + diff * 29);
    
    current.setDate(current.getDate() - 35);
    let matches = [];
    for(let i=0; i<70; i++) {
        h = getHParts(current);
        if (h.y === hijriYear && h.m === hijriMonthIndex) {
            matches.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
    }
    
    const safeDate = matches[14] || matches[0] || new Date();
    const yyyy = safeDate.getFullYear();
    const mm = String(safeDate.getMonth() + 1).padStart(2, '0');
    const dd = String(safeDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const HIJRI_MONTHS = [
    { value: 1, label: 'محرم' },
    { value: 2, label: 'صفر' },
    { value: 3, label: 'ربيع الأول' },
    { value: 4, label: 'ربيع الآخر' },
    { value: 5, label: 'جمادى الأولى' },
    { value: 6, label: 'جمادى الآخرة' },
    { value: 7, label: 'رجب' },
    { value: 8, label: 'شعبان' },
    { value: 9, label: 'رمضان' },
    { value: 10, label: 'شوال' },
    { value: 11, label: 'ذو القعدة' },
    { value: 12, label: 'ذو الحجة' }
];

function SupervisorAttendanceReportContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'week';
    const dateParam = searchParams.get('date');
    const pivotDateForInput = dateParam ? new Date(dateParam) : new Date();
    
    const currentHParts = getHParts(pivotDateForInput);
    const [hijriYearInput, setHijriYearInput] = useState(currentHParts.y);

    useEffect(() => {
        setHijriYearInput(getHParts(pivotDateForInput).y);
    }, [pivotDateForInput]);

    const handleHijriChange = (newYear, newMonth) => {
        const newDate = getGregorianDateFromHijri(newYear, newMonth);
        router.push(`?type=month&date=${newDate}&teacherId=${searchParams.get('teacherId') || ''}`);
    };

    const [students, setStudents] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [dateRange, setDateRange] = useState([]);
    const [title, setTitle] = useState('');
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [halaqaLogo, setHalaqaLogo] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed.role !== 'SUPERVISOR') {
                router.push('/login');
            }
            setUser(parsed);
        } else {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const pivotDate = dateParam ? new Date(dateParam) : new Date();
                const getHijriMonthStr = (d) => new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', year: 'numeric' }).format(d);

                const currentHijriMonth = getHijriMonthStr(pivotDate);
                let startDate = new Date(pivotDate);
                let endDate = new Date(pivotDate);

                while (getHijriMonthStr(new Date(startDate.getTime() - 86400000)) === currentHijriMonth) {
                    startDate.setDate(startDate.getDate() - 1);
                }
                while (getHijriMonthStr(new Date(endDate.getTime() + 86400000)) === currentHijriMonth) {
                    endDate.setDate(endDate.getDate() + 1);
                }

                const reportTitle = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { month: 'long', year: 'numeric' }).format(pivotDate);
                if (type === 'week') {
                    const now = new Date(pivotDate);
                    const day = now.getDay();
                    const diffToSun = now.getDate() - day;
                    startDate = new Date(now);
                    startDate.setDate(diffToSun);
                    endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 3);

                    const startHijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long' }).format(startDate);
                    const endHijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long' }).format(endDate);
                    setTitle(`تقرير الحضور الأسبوعي: ${startHijri} - ${endHijri}`);
                } else {
                    setTitle(`تقرير الحضور الشهري: ${reportTitle}`);
                }

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

                const startStr = startDate.toISOString().split('T')[0];
                const endStr = endDate.toISOString().split('T')[0];

                const paramTeacherId = searchParams.get('teacherId');
                if (!paramTeacherId) {
                    setLoading(false);
                    return;
                }
                const targetTeacherId = parseInt(paramTeacherId);

                // Find teacher's halaqaId
                let currentTeacherHalaqaId = null;
                const halaqasRes = await fetch('/api/halaqas');
                if (halaqasRes.ok) {
                    const allHalaqas = await halaqasRes.json();
                    const myHalaqas = allHalaqas.filter(h =>
                        h.teacherId === targetTeacherId ||
                        (h.assistants && h.assistants.some(a => a.id === targetTeacherId))
                    );
                    if (myHalaqas.length > 0) {
                        currentTeacherHalaqaId = myHalaqas[0].id;
                        setHalaqaLogo(myHalaqas[0].logo || null);
                    }
                }

                let studentsUrl = '/api/students';
                if (currentTeacherHalaqaId) {
                    studentsUrl += `?halaqaId=${currentTeacherHalaqaId}`;
                }

                const [studentsRes, attendanceRes, holidaysRes] = await Promise.all([
                    fetch(studentsUrl),
                    fetch(`/api/attendance?startDate=${startStr}&endDate=${endStr}`),
                    fetch('/api/holidays')
                ]);

                setStudents(await studentsRes.json());
                setReportData(await attendanceRes.json());
                setHolidays(await holidaysRes.json());
            } catch (error) {
                console.error("Error loading report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [type, dateParam, user, searchParams]);

    const getStatus = (studentId, dateIso) => {
        const holiday = holidays.find(h => {
            const start = new Date(h.startDate).toISOString().split('T')[0];
            const end = new Date(h.endDate).toISOString().split('T')[0];
            return dateIso >= start && dateIso <= end;
        });
        if (holiday) return { type: 'HOLIDAY', name: holiday.name };

        const dayOfWeek = new Date(dateIso).getDay();
        if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) return 'OFF_DAY';

        const record = reportData.find(r => r.studentId === studentId && new Date(r.date).toISOString().split('T')[0] === dateIso);
        if (record) return record.status;

        const today = new Date().toISOString().split('T')[0];
        if (dateIso > today) return 'NONE';

        return 'PRESENT';
    };

    const getStats = () => {
        let present = 0, late = 0, absent = 0, total = 0;
        students.forEach(s => {
            dateRange.forEach(d => {
                const status = getStatus(s.id, d.iso);
                const statusType = typeof status === 'object' ? status.type : status;
                if (statusType === 'PRESENT') present++;
                else if (statusType === 'LATE') late++;
                else if (statusType && statusType.includes('ABSENT')) absent++;

                if (statusType !== 'NONE' && statusType !== 'OFF_DAY' && statusType !== 'HOLIDAY') total++;
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
            case 'ABSENT_EXCUSED': return { icon: <span className="text-orange-500 font-bold text-lg">ع</span>, bg: 'bg-orange-50' };
            case 'ABSENT_UNEXCUSED': return { icon: <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>, bg: 'bg-rose-50' };
            case 'OFF_DAY': return { icon: <span className="text-slate-400/50 text-xl font-bold">.</span>, bg: 'bg-slate-200/70' };
            case 'HOLIDAY': return { icon: null, bg: 'bg-slate-300' };
            default: return { icon: <span className="text-slate-300">-</span>, bg: 'bg-slate-50' };
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-500">جاري إعداد تقرير المشرف...</div>;

    return (
        <div className="min-h-screen bg-white font-noto p-8 text-right" dir="rtl">
            <div className="flex justify-between items-start mb-8 no-print">
                <div className="flex gap-4 items-center">
                    {type === 'month' ? (
                        <div className="flex items-center gap-1 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
                            <label className="text-sm font-bold text-slate-600 px-2 pl-3 border-l border-slate-100">اختر الشهر الهجري</label>
                            <select 
                                value={currentHParts.m}
                                onChange={(e) => handleHijriChange(currentHParts.y, parseInt(e.target.value))}
                                className="px-2 py-1 bg-transparent font-bold text-slate-900 outline-none hover:bg-slate-50 cursor-pointer rounded"
                            >
                                {HIJRI_MONTHS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <span className="text-slate-300">/</span>
                            <input 
                                type="number" 
                                value={hijriYearInput || ''}
                                onChange={(e) => setHijriYearInput(e.target.value)}
                                onBlur={(e) => {
                                     const year = parseInt(e.target.value);
                                     if(year >= 1400 && year <= 1500 && year !== currentHParts.y) {
                                         handleHijriChange(year, currentHParts.m);
                                     } else {
                                         setHijriYearInput(currentHParts.y);
                                     }
                                }}
                                className="w-[4.5rem] text-center px-1 py-1 bg-transparent font-bold text-slate-900 outline-none hover:bg-slate-50 rounded select-all"
                                min="1400" max="1500"
                            />
                            <span className="text-sm font-bold text-slate-500 pr-1">هـ</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-bold text-slate-600">اختر تاريخاً ضمن الأسبوع:</label>
                            <input 
                                type="date"
                                value={pivotDateForInput.toISOString().substring(0, 10)}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        router.push(`?type=week&date=${e.target.value}&teacherId=${searchParams.get('teacherId') || ''}`);
                                    }
                                }}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-sm"
                            />
                        </div>
                    )}
                    <button onClick={() => router.push('/supervisor')} className="mr-4 px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">← عودة للوحة المشرف</button>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    طباعة / حفظ PDF
                </button>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-8 mb-8 border border-slate-100 shadow-sm print:shadow-none print:border-none print:bg-transparent print:p-0">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2">تقرير الحضور والغياب (إدارة عامة)</h1>
                        <p className="text-slate-500 font-medium text-lg">{title}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        {halaqaLogo ? (
                            <img src={halaqaLogo} alt="شعار الحلقة" className="w-20 h-20 object-contain shadow-sm rounded-xl" />
                        ) : (
                            <img src="/mosque-logo.png" alt="شعار المسجد" className="w-16 h-16 object-contain opacity-70" />
                        )}
                        <div className="flex gap-4">
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[100px] print:border-slate-300 print:bg-white text-emerald-600">
                            <span className="text-slate-400 text-xs font-bold mb-1">حاضر</span>
                            <span className="text-2xl font-black">{stats.present}</span>
                        </div>
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[100px] print:border-slate-300 print:bg-white text-amber-500">
                            <span className="text-slate-400 text-xs font-bold mb-1">متأخر</span>
                            <span className="text-2xl font-black">{stats.late}</span>
                        </div>
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[100px] print:border-slate-300 print:bg-white text-rose-500">
                            <span className="text-slate-400 text-xs font-bold mb-1">غياب</span>
                            <span className="text-2xl font-black">{stats.absent}</span>
                        </div>
                    </div>
                </div>
            </div>

                {(() => {
                    const chunkSize = 8;
                    const chunks = [];
                    for (let i = 0; i < dateRange.length; i += chunkSize) {
                        chunks.push(dateRange.slice(i, i + chunkSize));
                    }

                    return chunks.map((chunk, chunkIndex) => (
                        <div key={chunkIndex} className={`bg-white rounded-[1.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 mb-8 print:shadow-none print:rounded-none print:border-0 ${chunkIndex > 0 ? 'print:break-before-page' : ''}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 print:bg-slate-100 print:border-slate-300">
                                            <th className="p-4 font-black text-slate-600 text-right min-w-[200px] sticky right-0 bg-slate-50 z-10 print:static">الطالب</th>
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
                                                </td>
                                                {chunk.map(d => {
                                                    const status = getStatus(student.id, d.iso);
                                                    const statusType = typeof status === 'object' ? status.type : status;
                                                    const display = getStatusDisplay(statusType);
                                                    return (
                                                        <td key={d.iso} className={`p-2 text-center border-l border-slate-100 print:border-slate-200 relative ${display.bg}`}>
                                                            <div className="flex justify-center items-center h-full min-h-[40px]">
                                                                {statusType === 'HOLIDAY' ? (
                                                                    idx === 0 ? (
                                                                        <div className="absolute inset-0 flex items-center justify-center z-20" style={{ height: `${students.length * 56}px`, width: '100%' }}>
                                                                            <span className="whitespace-nowrap font-black text-slate-700 text-lg uppercase tracking-widest" style={{ transform: 'rotate(-90deg)' }}>{status.name}</span>
                                                                        </div>
                                                                    ) : null
                                                                ) : display.icon}
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
            <style jsx global>{`
                @media print {
                    @page { size: landscape; margin: 0.5cm; }
                    .no-print { display: none !important; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                }
            `}</style>
        </div>
    );
}

export default function SupervisorAttendanceReport() {
    return (
        <Suspense fallback={<div className="p-10 text-center">جاري التحميل...</div>}>
            <SupervisorAttendanceReportContent />
        </Suspense>
    );
}
