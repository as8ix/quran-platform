'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

function CustomDynamicReportContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paramTeacherId = searchParams.get('teacherId');

    const [user, setUser] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportTitle, setReportTitle] = useState('تقرير متابعة مخصص');
    const [columnType, setColumnType] = useState('checkbox'); // 'checkbox' or 'date'
    const [columnLabel, setColumnLabel] = useState('الحالة');
    const [data, setData] = useState({}); // studentId -> value
    const [halaqaFilter, setHalaqaFilter] = useState('all');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed.role !== 'TEACHER') {
                router.push('/login');
            }
            setUser(parsed);
        } else {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        if (user) {
            fetchStudents();
        }
    }, [user]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const targetId = paramTeacherId || user?.id;
            if (!targetId) return;

            const response = await fetch(`/api/students?teacherId=${targetId}`);
            if (response.ok) {
                const fetchedStudents = await response.json();
                setStudents(fetchedStudents);
                
                // Initialize data
                const initialData = {};
                fetchedStudents.forEach(s => {
                    initialData[s.id] = columnType === 'checkbox' ? false : '';
                });
                setData(initialData);

                // Automatically set halaqa filter if there's only one unique halaqa
                const hMap = new Map();
                fetchedStudents.forEach(s => {
                    if (s.halaqa) hMap.set(s.halaqa.id, s.halaqa.name);
                });
                if (hMap.size === 1) {
                    const firstId = hMap.keys().next().value;
                    setHalaqaFilter(firstId.toString());
                }

            } else {
                toast.error('فشل في جلب بيانات الطلاب');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (studentId, value) => {
        setData(prev => ({
            ...prev,
            [studentId]: value
        }));
    };

    const handleColumnTypeChange = (type) => {
        setColumnType(type);
        setColumnLabel(type === 'checkbox' ? 'الحالة' : 'التاريخ');
        
        // Reset data for new type
        const newData = {};
        students.forEach(s => {
            newData[s.id] = type === 'checkbox' ? false : '';
        });
        setData(newData);
    };

    const uniqueHalaqas = Array.from(new Set(students.map(s => s.halaqa?.id).filter(id => id))).map(id => {
        const student = students.find(s => s.halaqa?.id === id);
        return { id, name: student.halaqa.name };
    });

    const filteredStudents = students.filter(student => {
        return halaqaFilter === 'all' || student.halaqa?.id?.toString() === halaqaFilter.toString();
    });

    const handleCopyText = () => {
        let text = `${reportTitle}\n`;
        text += `التاريخ: ${new Date().toLocaleDateString('ar-SA')}\n`;
        text += `---------------------------\n`;
        text += `الاسم | ${columnLabel}\n`;
        text += `---------------------------\n`;
        
        filteredStudents.forEach(s => {
            const val = data[s.id];
            let displayVal = '';
            if (columnType === 'checkbox') {
                displayVal = val ? 'تم ✅' : 'لم يتم ❌';
            } else {
                displayVal = val || '—';
            }
            text += `${s.name} | ${displayVal}\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            toast.success('تم نسخ التقرير بنجاح!');
        }).catch(() => {
            toast.error('فشل في نسخ التقرير');
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-500 animate-pulse">جاري تجهيز كشف الطلاب...</p>
                </div>
            </div>
        );
    }

    const halaqaLogo = filteredStudents.length > 0 && halaqaFilter !== 'all' 
        ? filteredStudents[0].halaqa?.logo 
        : null;

    return (
        <div className="min-h-screen bg-[#f8fafc] font-noto p-4 md:p-8 text-right" dir="rtl">
            {/* Header / Config Panel */}
            <div className="no-print max-w-5xl mx-auto mb-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 border border-white shadow-2xl shadow-slate-200/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-black text-slate-400 mb-2 mr-2">عنوان التقرير</label>
                        <input 
                            type="text" 
                            value={reportTitle}
                            onChange={(e) => setReportTitle(e.target.value)}
                            placeholder="مثلاً: كشف استلام الكتب، كشف مشاركة النشاط..."
                            className="w-full text-2xl md:text-3xl font-black text-slate-800 bg-transparent border-b-2 border-slate-100 focus:border-emerald-500 outline-none transition-all pb-2"
                        />
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button 
                            onClick={() => router.push('/teacher')} 
                            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                        >
                            <span>لوحة المعلم</span>
                        </button>
                        <button 
                            onClick={() => window.print()} 
                            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            <span>طباعة التقرير</span>
                        </button>
                    </div>
                </div>

                <div className={`grid grid-cols-1 ${uniqueHalaqas.length > 1 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            نوع العمود الإضافي:
                        </label>
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                            <button 
                                onClick={() => handleColumnTypeChange('checkbox')}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${columnType === 'checkbox' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                خيار تم/لم يتم
                            </button>
                            <button 
                                onClick={() => handleColumnTypeChange('date')}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${columnType === 'date' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                إدخال تاريخ
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            تسمية العمود:
                        </label>
                        <input 
                            type="text" 
                            value={columnLabel}
                            onChange={(e) => setColumnLabel(e.target.value)}
                            className="w-full p-3 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl outline-none font-bold text-slate-700 transition-all"
                        />
                    </div>

                    {uniqueHalaqas.length > 1 && (
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-500 flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                تصفية الحلقة:
                            </label>
                            <select
                                value={halaqaFilter}
                                onChange={(e) => setHalaqaFilter(e.target.value)}
                                className="w-full p-3 bg-slate-50 border-2 border-slate-100 focus:border-amber-500 rounded-2xl outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">جميع الحلقات المسندة</option>
                                {uniqueHalaqas.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-xs text-slate-400 font-medium italic">
                        * البيانات في هذا التقرير مؤقتة لأغراض الطباعة والنسخ فقط ولا يتم حفظها في النظام.
                    </p>
                    <button 
                        onClick={handleCopyText}
                        className="text-emerald-600 font-black text-sm flex items-center gap-2 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                        نسخ كنص سريع
                    </button>
                </div>
            </div>

            {/* Printable Report Section */}
            <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200/40 print:shadow-none print:p-0 print:bg-white overflow-hidden relative border border-slate-100">
                
                {/* Watermark/Background Decoration */}
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none select-none no-print">
                    <svg className="w-96 h-96" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM3.89 9L12 4.57 20.11 9 12 13.43 3.89 9zM12 17l-6.31-3.45-1.06 1.7L12 19.3l7.37-4.05-1.06-1.7L12 17z"/></svg>
                </div>

                {/* Report Header */}
                <div className="flex justify-between items-start mb-12 relative z-10 border-b-2 border-slate-900 pb-8">
                    <div className="flex items-center gap-6">
                        {halaqaLogo ? (
                            <img src={halaqaLogo} alt="شعار الحلقة" className="w-24 h-24 object-contain rounded-2xl shadow-sm bg-white p-2" />
                        ) : (
                            <img src="/mosque-logo.png" alt="شعار المسجد" className="w-20 h-20 object-contain opacity-80" />
                        )}
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 mb-2 leading-tight">{reportTitle}</h1>
                            <div className="flex gap-4 text-slate-500 font-bold">
                                <p className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    تاريخ الكشف: {new Date().toLocaleDateString('ar-SA')}
                                </p>
                                {halaqaFilter !== 'all' && (
                                    <p className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                        حلقة: {uniqueHalaqas.find(h => h.id.toString() === halaqaFilter.toString())?.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-left">
                        <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-1">Teacher Dashboard</p>
                        <p className="text-slate-900 font-black text-lg">منصة تحفيظ القرآن</p>
                    </div>
                </div>

                {/* Table */}
                <div className="relative z-10">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-5 text-right font-black rounded-tr-2xl w-16">#</th>
                                <th className="p-5 text-right font-black">اسم الطالب</th>
                                <th className="p-5 text-center font-black rounded-tl-2xl min-w-[150px]">{columnLabel}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => (
                                <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-emerald-50/30 transition-colors`}>
                                    <td className="p-5 font-bold text-slate-500 text-center border-r border-slate-100">{idx + 1}</td>
                                    <td className="p-5">
                                        <div className="font-black text-slate-800 text-lg">{student.name}</div>
                                        <div className="text-xs text-slate-400 font-bold mt-1">{student.halaqa?.name || '—'}</div>
                                    </td>
                                    <td className="p-5 text-center border-l border-slate-100">
                                        {columnType === 'checkbox' ? (
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => handleValueChange(student.id, !data[student.id])}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all no-print ${data[student.id] ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-110' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                                                >
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                </button>
                                                <div className="hidden print:block">
                                                    {data[student.id] ? (
                                                        <div className="w-6 h-6 border-2 border-slate-900 mx-auto rounded flex items-center justify-center bg-slate-900 text-white">✓</div>
                                                    ) : (
                                                        <div className="w-6 h-6 border-2 border-slate-300 mx-auto rounded"></div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="max-w-[140px] mx-auto">
                                                <input 
                                                    type="date" 
                                                    value={data[student.id] || ''}
                                                    onChange={(e) => handleValueChange(student.id, e.target.value)}
                                                    className="w-full bg-slate-100/50 p-2 rounded-lg font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all no-print text-center"
                                                />
                                                <span className="hidden print:block font-bold text-slate-800">
                                                    {data[student.id] ? new Date(data[student.id]).toLocaleDateString('ar-SA') : '....................'}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="p-20 text-center text-slate-400 font-black italic text-xl">
                                        لا يوجد طلاب لعرضهم
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Signature */}
                <div className="mt-16 flex justify-between items-end border-t-2 border-slate-100 pt-12">
                    <div className="text-center w-48">
                        <p className="text-slate-400 font-bold mb-10">توقيع المعلم</p>
                        <div className="border-b-2 border-dotted border-slate-300"></div>
                    </div>
                    <div className="text-center w-48">
                        <p className="text-slate-400 font-bold mb-10">ختم الحلقة</p>
                        <div className="border-b-2 border-dotted border-slate-300"></div>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Quran Platform - Reporting Engine</p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 1cm; }
                    body { background: white !important; }
                    .no-print { display: none !important; }
                    input[type="date"]::-webkit-calendar-picker-indicator { display: none; }
                }
            `}</style>
        </div>
    );
}

export default function CustomDynamicReport() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div></div>}>
            <CustomDynamicReportContent />
        </Suspense>
    );
}
