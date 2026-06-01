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
    const [halaqaFilter, setHalaqaFilter] = useState('all');

    // Student Fields Selection
    const [selectedFields, setSelectedFields] = useState({
        displayId: { label: 'رقم التسلسل', selected: false },
        name: { label: 'اسم الطالب', selected: true },
        nationalId: { label: 'رقم الهوية', selected: false },
        nationality: { label: 'الجنسية', selected: false },
        phone: { label: 'جوال الطالب', selected: false },
        parentPhone: { label: 'جوال ولي الأمر', selected: false },
        hifzProgress: { label: 'آخر وصل', selected: false },
        juzCount: { label: 'عدد الأجزاء', selected: false },
        joinDate: { label: 'تاريخ الالتحاق', selected: false }
    });

    // Custom Columns Configuration
    const [customColumns, setCustomColumns] = useState([
        { id: 'col_1', label: 'الحالة', type: 'checkbox' }
    ]);

    // Data for custom columns: studentId -> columnId -> value
    const [data, setData] = useState({}); 

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
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

            const response = await fetch(`/api/students?teacherId=${targetId}&full=true`);
            if (response.ok) {
                const fetchedStudents = await response.json();
                setStudents(fetchedStudents);
                
                // Initialize data if needed
                const initialData = {};
                fetchedStudents.forEach(s => {
                    initialData[s.id] = {};
                    customColumns.forEach(col => {
                        if (col.type === 'checkbox') initialData[s.id][col.id] = false;
                        else if (col.type === 'borrowing') initialData[s.id][col.id] = { received: '', returned: '' };
                        else initialData[s.id][col.id] = '';
                    });
                });
                setData(initialData);

                const hMap = new Map();
                fetchedStudents.forEach(s => {
                    if (s.halaqa) hMap.set(s.halaqa.id, s.halaqa.name);
                });
                if (hMap.size === 1) {
                    setHalaqaFilter(hMap.keys().next().value.toString());
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

    const handleValueChange = (studentId, columnId, value, subKey = null) => {
        setData(prev => {
            const studentData = prev[studentId] || {};
            const colData = studentData[columnId];
            
            let newValue = value;
            if (subKey) {
                newValue = typeof colData === 'object' ? { ...colData, [subKey]: value } : { [subKey]: value };
            }

            return {
                ...prev,
                [studentId]: {
                    ...studentData,
                    [columnId]: newValue
                }
            };
        });
    };

    const formatHijriDate = (date) => {
        if (!date) return '—';
        try {
            const d = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', {
                day: 'numeric',
                month: 'long'
            });
        } catch (e) {
            return '—';
        }
    };

    const getFieldValue = (student, key) => {
        switch(key) {
            case 'displayId': return student.displayId || student.id;
            case 'name': return student.name;
            case 'nationalId': return student.nationalId || '—';
            case 'nationality': return student.nationality || '—';
            case 'phone': return student.phone || '—';
            case 'parentPhone': return student.parentPhone || '—';
            case 'hifzProgress': return student.hifzProgress || 'لم يبدأ';
            case 'juzCount': return student.juzCount || 0;
            case 'joinDate': return student.joinDate ? formatHijriDate(student.joinDate) : '—';
            default: return '';
        }
    };

    const toggleField = (key) => {
        const activeCount = Object.values(selectedFields).filter(f => f.selected).length;
        const totalCount = activeCount + customColumns.length;

        // Limit is 6 because # column is fixed and counts as the 7th
        if (!selectedFields[key].selected && totalCount >= 6) {
            toast.error('عذراً، الحد الأقصى هو 7 أعمدة (بما في ذلك الترقيم) لضمان جودة التنسيق');
            return;
        }

        setSelectedFields(prev => ({
            ...prev,
            [key]: { ...prev[key], selected: !prev[key].selected }
        }));
    };

    const addCustomColumn = () => {
        const activeCount = Object.values(selectedFields).filter(f => f.selected).length;
        const totalCount = activeCount + customColumns.length;

        // Limit is 6 because # column is fixed and counts as the 7th
        if (totalCount >= 6) {
            toast.error('عذراً، الحد الأقصى هو 7 أعمدة (بما في ذلك الترقيم) لضمان جودة التنسيق');
            return;
        }
        const newId = `col_${Date.now()}`;
        const newColumn = { id: newId, label: 'عامود جديد', type: 'checkbox' };
        setCustomColumns(prev => [...prev, newColumn]);
    };

    const removeCustomColumn = (id) => {
        if (customColumns.length === 1) {
            toast.error('يجب وجود عامود واحد على الأقل');
            return;
        }
        setCustomColumns(prev => prev.filter(c => c.id !== id));
    };

    const updateColumn = (id, updates) => {
        setCustomColumns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        if (updates.type) {
            setData(prev => {
                const next = { ...prev };
                students.forEach(s => {
                    if (next[s.id]) {
                        if (updates.type === 'checkbox') next[s.id][id] = false;
                        else if (updates.type === 'borrowing') next[s.id][id] = { received: '', returned: '' };
                        else next[s.id][id] = '';
                    }
                });
                return next;
            });
        }
    };

    const handleCopyText = () => {
        const activeFields = Object.keys(selectedFields).filter(k => selectedFields[k].selected);
        let text = `${reportTitle}\n`;
        text += `التاريخ: ${formatHijriDate(new Date())}\n`;
        text += `---------------------------\n`;
        
        const headerRow = [...activeFields.map(k => selectedFields[k].label), ...customColumns.map(c => c.label)];
        text += headerRow.join(' | ') + '\n';
        text += `---------------------------\n`;
        
        filteredStudents.forEach(s => {
            const row = activeFields.map(k => getFieldValue(s, k));
            customColumns.forEach(col => {
                const val = data[s.id]?.[col.id];
                if (col.type === 'checkbox') {
                    row.push(val ? 'تم ✅' : 'لم يتم ❌');
                } else if (col.type === 'borrowing') {
                    const rec = val?.received ? formatHijriDate(val.received) : '—';
                    const ret = val?.returned ? formatHijriDate(val.returned) : '—';
                    row.push(`استلم: ${rec}، سلم: ${ret}`);
                } else if (col.type === 'date') {
                    row.push(val ? formatHijriDate(val) : '—');
                } else {
                    row.push(val || '—');
                }
            });
            text += row.join(' | ') + '\n';
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
                    <p className="font-bold text-slate-500 animate-pulse">جاري تجهيز منشئ التقارير...</p>
                </div>
            </div>
        );
    }

    const uniqueHalaqas = Array.from(new Set(students.map(s => s.halaqa?.id).filter(id => id))).map(id => {
        const student = students.find(s => s.halaqa?.id === id);
        return { id, name: student?.halaqa?.name || 'حلقة غير معروفة' };
    });

    const filteredStudents = students.filter(student => {
        return halaqaFilter === 'all' || student.halaqa?.id?.toString() === halaqaFilter.toString();
    });

    const mainMosqueLogo = '/mosque-logo.png';
    const selectedHalaqaLogo = filteredStudents.length > 0 && halaqaFilter !== 'all' 
        ? filteredStudents.find(s => s.halaqa?.id?.toString() === halaqaFilter.toString())?.halaqa?.logo 
        : null;
    
    const displayLogo = selectedHalaqaLogo || mainMosqueLogo;

    const activeFields = Object.keys(selectedFields).filter(k => selectedFields[k].selected);
    const totalColumnsUsed = activeFields.length + customColumns.length + 1; // +1 for # column

    return (
        <div className="min-h-screen bg-[#f8fafc] font-noto p-4 md:p-8 text-right" dir="rtl">
            <div className="no-print max-w-6xl mx-auto mb-10 bg-white/90 backdrop-blur-2xl rounded-[3rem] p-8 border border-white shadow-2xl shadow-slate-200/60">
                
                {/* Column Usage Clarification */}
                <div className="mb-8 flex flex-col md:flex-row items-center justify-between bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100/50 gap-4">
                    <div className="flex items-center gap-4 text-right">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-200">!</div>
                        <div>
                            <p className="text-sm font-black text-indigo-900 mb-0.5">توضيح هام حول حدود التنسيق</p>
                            <p className="text-[11px] font-bold text-indigo-700/70">لضمان خروج التقرير بشكل احترافي في صفحة واحدة، الحد الأقصى هو 7 أعمدة (تشمل الترقيم التلقائي #).</p>
                        </div>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">عدد الأعمدة الآن:</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-xl font-black ${totalColumnsUsed >= 7 ? 'text-rose-500' : 'text-indigo-600'}`}>
                                {totalColumnsUsed}
                            </span>
                            <span className="text-slate-300 font-bold">/</span>
                            <span className="text-slate-400 font-bold text-sm">7</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-black text-emerald-600 mb-2 mr-2 uppercase tracking-widest">إعدادات التقرير المخصص</label>
                        <input 
                            type="text" 
                            value={reportTitle}
                            onChange={(e) => setReportTitle(e.target.value)}
                            className="w-full text-3xl font-black text-slate-800 bg-transparent border-b-2 border-slate-100 focus:border-emerald-500 outline-none transition-all pb-2"
                        />
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => router.push('/teacher')} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">العودة للوحة</button>
                        <button onClick={() => window.print()} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            طباعة التقرير
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">1</div>
                            <h3 className="text-xl font-black text-slate-800">بيانات الطلاب المعروضة</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(selectedFields).map(([key, field]) => (
                                <button
                                    key={key}
                                    onClick={() => toggleField(key)}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border-2 ${
                                        field.selected 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                                        : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-300'
                                    }`}
                                >
                                    {field.label}
                                </button>
                            ))}
                        </div>
                        {uniqueHalaqas.length > 1 && (
                            <div className="pt-4">
                                <label className="block text-xs font-black text-slate-400 mb-3 mr-2">تصفية حسب الحلقة</label>
                                <select
                                    value={halaqaFilter}
                                    onChange={(e) => setHalaqaFilter(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="all">كل الحلقات المسندة</option>
                                    {uniqueHalaqas.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black">2</div>
                                <h3 className="text-xl font-black text-slate-800">أعمدة المتابعة المخصصة</h3>
                            </div>
                            <button 
                                onClick={addCustomColumn}
                                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-black text-xs hover:bg-amber-200 transition-all flex items-center gap-2"
                            >
                                <span>+</span> إضافة عامود
                            </button>
                        </div>
                        
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pl-2 -ml-2 custom-scrollbar">
                            {customColumns.map((col) => (
                                <div key={col.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                                    <button 
                                        onClick={() => removeCustomColumn(col.id)}
                                        className="absolute -top-2 -left-2 w-7 h-7 bg-white text-rose-500 rounded-full shadow-md flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 border border-slate-100"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 mr-1">اسم العامود</label>
                                            <input 
                                                type="text" 
                                                value={col.label}
                                                onChange={(e) => updateColumn(col.id, { label: e.target.value })}
                                                placeholder="مثلاً: الحالة، ملاحظات..."
                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 placeholder:text-slate-300 outline-none focus:border-amber-500 transition-all shadow-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 mr-1">نوع البيانات</label>
                                            <select 
                                                value={col.type}
                                                onChange={(e) => updateColumn(col.id, { type: e.target.value })}
                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 outline-none focus:border-amber-500 transition-all shadow-sm cursor-pointer"
                                            >
                                                <option value="checkbox">تم / لم يتم ✅</option>
                                                <option value="date">إدخال تاريخ 📅</option>
                                                <option value="borrowing">استعارة (تاريخين) 📚</option>
                                                <option value="text">نص حر ✏️</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center">
                    <button 
                        onClick={handleCopyText}
                        className="text-emerald-600 font-black text-sm flex items-center gap-3 hover:bg-emerald-50 px-6 py-3 rounded-2xl transition-all border border-transparent hover:border-emerald-100"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                        نسخ التقرير بالكامل كنص سريع
                    </button>
                    <p className="text-[11px] text-slate-500 font-black italic">
                        * البيانات في هذا التقرير مؤقتة ولا يتم حفظها في النظام.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto bg-white rounded-[3rem] p-12 md:p-16 shadow-2xl shadow-slate-200/50 print:shadow-none print:p-0 print:bg-white relative overflow-hidden border border-slate-50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 relative z-10 border-b-4 border-slate-900 pb-10">
                    <div className="flex items-center gap-8 text-center md:text-right mb-8 md:mb-0">
                        <img 
                            src={displayLogo} 
                            alt="Mosque Logo" 
                            className="w-32 h-32 object-contain rounded-3xl p-3 bg-white shadow-xl shadow-slate-200/40" 
                            onError={(e) => {
                                // Fallback if image fails to load
                                e.target.src = '/mosque-logo.png';
                            }}
                        />
                        <div>
                            <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tight">{reportTitle}</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-500 font-bold">
                                <span className="flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full text-sm italic">📅 {formatHijriDate(new Date())}</span>
                                {halaqaFilter !== 'all' && (
                                    <span className="flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full text-sm">📍 حلقة: {uniqueHalaqas.find(h => h.id.toString() === halaqaFilter.toString())?.name}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <div className="text-slate-300 font-black text-xs uppercase tracking-[0.4em] mb-2">Internal Report</div>
                        <div className="text-slate-900 font-black text-xl">منصة جامع الحديقة</div>
                    </div>
                </div>

                <div className="relative z-10 overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-5 text-center font-black rounded-tr-3xl w-12 border-l border-white/10">#</th>
                                {activeFields.map((k) => (
                                    <th key={k} className="p-5 text-center font-black border-l border-white/10">
                                        {selectedFields[k].label}
                                    </th>
                                ))}
                                {customColumns.map((col, idx) => (
                                    <th key={col.id} className={`p-5 text-center font-black border-l border-white/10 ${idx === customColumns.length - 1 ? 'rounded-tl-3xl' : ''}`}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-100">
                            {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => (
                                <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-emerald-50/40 transition-colors`}>
                                    <td className="p-5 font-bold text-slate-400 text-center border-r-2 border-slate-100">{idx + 1}</td>
                                    {activeFields.map(k => (
                                        <td key={k} className="p-5 text-center font-black text-slate-800 border-l-2 border-slate-100">
                                            {getFieldValue(student, k)}
                                        </td>
                                    ))}
                                    {customColumns.map(col => (
                                        <td key={col.id} className="p-5 text-center border-l-2 border-slate-100">
                                            {col.type === 'checkbox' ? (
                                                <div className="flex justify-center items-center">
                                                    <button 
                                                        onClick={() => handleValueChange(student.id, col.id, !data[student.id]?.[col.id])}
                                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all no-print ${data[student.id]?.[col.id] ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-110' : 'bg-slate-200/50 text-slate-400 hover:bg-slate-300'}`}
                                                    >
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" /></svg>
                                                    </button>
                                                    <div className="hidden print:block">
                                                        {data[student.id]?.[col.id] ? (
                                                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xl">✓</div>
                                                        ) : (
                                                            <div className="w-8 h-8 border-2 border-slate-200 rounded-lg"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : col.type === 'date' ? (
                                                <div className="max-w-[140px] mx-auto print:max-w-none w-full">
                                                    <input 
                                                        type="date" 
                                                        value={data[student.id]?.[col.id] || ''}
                                                        onChange={(e) => handleValueChange(student.id, col.id, e.target.value)}
                                                        className="w-full bg-slate-100/80 p-2.5 rounded-xl font-black text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all no-print text-center text-xs shadow-inner"
                                                    />
                                                    <span className="hidden print:block font-black text-slate-900 text-sm whitespace-nowrap">
                                                        {data[student.id]?.[col.id] ? formatHijriDate(data[student.id][col.id]) : '................'}
                                                    </span>
                                                </div>
                                            ) : col.type === 'borrowing' ? (
                                                <div className="space-y-2 min-w-[150px] print:min-w-0 w-full print:space-y-3 print:py-2">
                                                    <div className="flex items-center gap-2 print:flex print:items-center print:justify-start">
                                                        <span className="text-[10px] font-black text-emerald-700 no-print">📥 استلم:</span>
                                                        <input 
                                                            type="date" 
                                                            value={data[student.id]?.[col.id]?.received || ''}
                                                            onChange={(e) => handleValueChange(student.id, col.id, e.target.value, 'received')}
                                                            className="flex-1 bg-slate-100/80 p-1.5 rounded-lg text-[10px] font-black text-slate-900 no-print outline-none focus:bg-white border border-slate-200/50 shadow-inner"
                                                        />
                                                        <span className="hidden print:flex items-center font-black text-slate-900 text-xs">
                                                            <span className="text-emerald-700 w-[45px] text-right">استلم:</span> 
                                                            <span className="mr-2 border-b border-dotted border-slate-300 min-w-[80px] text-right">
                                                                {data[student.id]?.[col.id]?.received ? formatHijriDate(data[student.id][col.id].received) : '__________'}
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 print:flex print:items-center print:justify-start">
                                                        <span className="text-[10px] font-black text-rose-700 no-print">📤 سلم:</span>
                                                        <input 
                                                            type="date" 
                                                            value={data[student.id]?.[col.id]?.returned || ''}
                                                            onChange={(e) => handleValueChange(student.id, col.id, e.target.value, 'returned')}
                                                            className="flex-1 bg-slate-100/80 p-1.5 rounded-lg text-[10px] font-black text-slate-900 no-print outline-none focus:bg-white border border-slate-200/50 shadow-inner"
                                                        />
                                                        <span className="hidden print:flex items-center font-black text-slate-900 text-xs">
                                                            <span className="text-rose-700 w-[45px] text-right">سلم:</span> 
                                                            <span className="mr-2 border-b border-dotted border-slate-300 min-w-[80px] text-right">
                                                                {data[student.id]?.[col.id]?.returned ? formatHijriDate(data[student.id][col.id].returned) : '__________'}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="max-w-[160px] mx-auto">
                                                    <input 
                                                        type="text" 
                                                        placeholder="..."
                                                        value={data[student.id]?.[col.id] || ''}
                                                        onChange={(e) => handleValueChange(student.id, col.id, e.target.value)}
                                                        className="w-full bg-slate-100/80 p-2.5 rounded-xl font-black text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 border border-slate-200/50 focus:border-emerald-500 transition-all no-print text-center text-xs shadow-inner"
                                                    />
                                                    <span className="hidden print:block font-bold text-slate-800 border-b border-dotted border-slate-300 w-full min-h-[1.5em] block">
                                                        {data[student.id]?.[col.id] || '................'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={activeFields.length + customColumns.length + 1} className="p-32 text-center text-slate-300 font-black italic text-2xl">لا يوجد طلاب لعرضهم حالياً</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-24 flex flex-col md:flex-row justify-between items-center gap-12 border-t-4 border-slate-100 pt-16">
                    <div className="text-center w-64">
                        <p className="text-slate-400 font-black mb-12 uppercase tracking-widest text-sm">توقيع المعلم</p>
                        <div className="border-b-4 border-dotted border-slate-200"></div>
                    </div>
                    <div className="text-center w-64">
                        <p className="text-slate-400 font-black mb-12 uppercase tracking-widest text-sm">ختم الإدارة</p>
                        <div className="border-b-4 border-dotted border-slate-200"></div>
                    </div>
                    <div className="opacity-20 grayscale">
                        <img src="/mosque-logo.png" alt="Watermark" className="w-20 h-20 object-contain" />
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: landscape; margin: 0.5cm; }
                    body { background: white !important; color: black !important; }
                    .no-print { display: none !important; }
                    input[type="date"]::-webkit-calendar-picker-indicator { display: none; }
                }
                .font-noto input, .font-noto select, .font-noto textarea { color: #0f172a !important; }
                .font-noto input::placeholder { color: #94a3b8 !important; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
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
