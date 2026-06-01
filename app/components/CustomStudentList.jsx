'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function CustomStudentList({ userRole, initialTeacherId, initialHalaqaId }) {
    const router = useRouter();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [halaqaFilter, setHalaqaFilter] = useState(initialHalaqaId ? initialHalaqaId.toString() : 'all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [paymentFilterTerm, setPaymentFilterTerm] = useState('feeStatusTerm1');
    const [financeMode, setFinanceMode] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [halaqaLogo, setHalaqaLogo] = useState(null);

    useEffect(() => {
        if (initialHalaqaId) {
            setHalaqaFilter(initialHalaqaId.toString());
        }
    }, [initialHalaqaId]);
    
    // Available fields to select
    const initialFields = {
        displayId: { label: 'رقم التسلسل', selected: false },
        name: { label: 'اسم الطالب', selected: true },
        nationalId: { label: 'رقم الهوية', selected: true },
        nationality: { label: 'الجنسية', selected: true },
        phone: { label: 'جوال الطالب', selected: false },
        parentPhone: { label: 'جوال ولي الأمر (1)', selected: false },
        parentPhone2: { label: 'جوال ولي الأمر (2)', selected: false },
        halaqa: { label: 'الحلقة', selected: false },
        joinDate: { label: 'تاريخ الالتحاق', selected: false },
        feeStatusTerm1: { label: 'رسوم الترم 1', selected: false, isFinance: true },
        feeStatusTerm2: { label: 'رسوم الترم 2', selected: false, isFinance: true },
        feeStatusSummer: { label: 'رسوم الصيف', selected: false, isFinance: true }
    };

    const [fields, setFields] = useState(() => {
        if (userRole !== 'SUPERVISOR') {
            const filtered = { ...initialFields };
            delete filtered.feeStatusTerm1;
            delete filtered.feeStatusTerm2;
            delete filtered.feeStatusSummer;
            return filtered;
        }
        return initialFields;
    });

    useEffect(() => {
        fetchStudents();
        
        // Handle URL parameters for pre-selecting fields
        const searchParams = new URLSearchParams(window.location.search);
        const preselect = searchParams.get('preselect');
        
        setFields(prev => {
            const newFields = { ...prev };
            
            // If we have a specific halaqa, show the halaqa column by default
            if (initialHalaqaId) {
                newFields.halaqa = { ...newFields.halaqa, selected: true };
            }
            
            // Handle preselect from URL
            if (preselect && newFields[preselect]) {
                newFields[preselect] = { ...newFields[preselect], selected: true };
                
                // If preselecting a fee term, also set the filter term
                if (preselect.startsWith('feeStatus')) {
                    setPaymentFilterTerm(preselect);
                }
            }
            
            return newFields;
        });
    }, [initialTeacherId, initialHalaqaId]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            let url = '/api/students?full=true';
            if (initialTeacherId) {
                // If it's a teacher, get their specific students.
                url += `&teacherId=${initialTeacherId}`;
            }
            // For supervisor, we might want all students, or filter by teacher if passed.
            
            const response = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                cache: 'no-store'
            });
            if (response.ok) {
                const data = await response.json();
                setStudents(data);

                // Automatically set halaqa filter if there's only one unique halaqa and no filter is set yet
                if (halaqaFilter === 'all' && !initialHalaqaId) {
                    const hMap = new Map();
                    data.forEach(s => {
                        if (s.halaqa) hMap.set(s.halaqa.id, s.halaqa.name);
                    });
                    if (hMap.size === 1) {
                        const firstId = hMap.keys().next().value;
                        setHalaqaFilter(firstId.toString());
                    }
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

    const handleToggleFee = async (studentId, fieldKey, currentStatus) => {
        if (userRole !== 'SUPERVISOR') return;
        
        const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
        setTogglingId(`${studentId}-${fieldKey}`);
        
        try {
            const response = await fetch('/api/students', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: studentId,
                    [fieldKey]: newStatus
                })
            });
            
            if (response.ok) {
                setStudents(prev => prev.map(s => 
                    s.id === studentId ? { ...s, [fieldKey]: newStatus } : s
                ));
                toast.success('تم تحديث حالة الرسوم');
            } else {
                toast.error('فشل تحديث الرسوم');
            }
        } catch (error) {
            toast.error('خطأ في الاتصال');
        } finally {
            setTogglingId(null);
        }
    };

    const toggleFinanceMode = () => {
        const newMode = !financeMode;
        setFinanceMode(newMode);
        
        setFields(prev => {
            const next = { ...prev };
            const feeKeys = ['feeStatusTerm1', 'feeStatusTerm2', 'feeStatusSummer'];
            feeKeys.forEach(k => {
                next[k] = { ...next[k], selected: newMode };
            });
            return next;
        });
    };

    const toggleField = (fieldKey) => {
        setFields(prev => ({
            ...prev,
            [fieldKey]: { ...prev[fieldKey], selected: !prev[fieldKey].selected }
        }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'غير محدد';
        const d = new Date(dateString);
        return d.toLocaleDateString('ar-SA');
    };

    const getFieldValue = (student, key) => {
        switch(key) {
            case 'displayId': return student.displayId || student.id;
            case 'name': return student.name;
            case 'nationalId': return student.nationalId || 'غير مسجل';
            case 'nationality': return student.nationality || 'غير مسجل';
            case 'phone': return student.phone || 'غير مسجل';
            case 'parentPhone': return student.parentPhone || 'غير مسجل';
            case 'parentPhone2': return student.parentPhone2 || 'غير مسجل';
            case 'halaqa': return student.halaqa?.name || 'غير محدد';
            case 'joinDate': return formatDate(student.joinDate);
            case 'feeStatusTerm1': return student.feeStatusTerm1 === 'PAID' ? 'سدد ✅' : 'لم يسدد ❌';
            case 'feeStatusTerm2': return student.feeStatusTerm2 === 'PAID' ? 'سدد ✅' : 'لم يسدد ❌';
            case 'feeStatusSummer': return student.feeStatusSummer === 'PAID' ? 'سدد ✅' : 'لم يسدد ❌';
            default: return '';
        }
    };

    const uniqueHalaqas = Array.from(new Set(students.map(s => s.halaqa?.id).filter(id => id))).map(id => {
        const student = students.find(s => s.halaqa?.id === id);
        return { id, name: student?.halaqa?.name || 'حلقة غير معروفة' };
    });

    const filteredStudents = students.filter(student => {
        const matchesHalaqa = halaqaFilter === 'all' || student.halaqa?.id?.toString() === halaqaFilter.toString();
        const matchesPayment = paymentFilter === 'all' || 
            (paymentFilter === 'PAID' && student[paymentFilterTerm] === 'PAID') ||
            (paymentFilter === 'PENDING' && student[paymentFilterTerm] !== 'PAID');
        return matchesHalaqa && matchesPayment;
    });

    useEffect(() => {
        if (halaqaFilter !== 'all' && halaqaFilter !== 'none') {
            const studentWithHalaqa = students.find(s => s.halaqa?.id?.toString() === halaqaFilter.toString());
            if (studentWithHalaqa && studentWithHalaqa.halaqa.logo) {
                setHalaqaLogo(studentWithHalaqa.halaqa.logo);
            } else {
                setHalaqaLogo(null);
            }
        } else {
            setHalaqaLogo(null);
        }
    }, [halaqaFilter, students]);

    const handleCopyText = () => {
        const selectedKeys = Object.keys(fields).filter(k => fields[k].selected);
        
        // Header
        let text = selectedKeys.map(k => fields[k].label).join(' | ') + '\n';
        text += '-'.repeat(text.length) + '\n';
        
        // Rows
        filteredStudents.forEach((student, index) => {
            text += selectedKeys.map(k => getFieldValue(student, k)).join(' | ') + '\n';
        });

        navigator.clipboard.writeText(text).then(() => {
            toast.success('تم نسخ البيانات بنجاح!');
        }).catch(() => {
            toast.error('فشل في نسخ البيانات');
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const selectedKeys = Object.keys(fields).filter(k => fields[k].selected);

    return (
        <div className="min-h-screen bg-white font-noto p-8 text-right" dir="rtl">
            
            <div className="no-print flex flex-col gap-6 mb-8 bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">قائمة بيانات الطلاب</h1>
                        <p className="text-slate-500 text-sm mt-1 font-medium">حدد المعلومات التي ترغب في عرضها وطباعتها أو نسخها.</p>
                    </div>
                    <div className="flex gap-3">
                        {userRole === 'SUPERVISOR' && (
                            <button 
                                onClick={toggleFinanceMode}
                                className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 ${financeMode ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                {financeMode ? 'إيقاف وضع المالية' : 'وضع المالية السريع'}
                            </button>
                        )}
                        <button 
                            onClick={() => router.push(userRole === 'SUPERVISOR' ? '/supervisor' : '/teacher')} 
                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            ← عودة
                        </button>
                        <button 
                            onClick={handleCopyText} 
                            className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                            نسخ كنص
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

                <div className="flex flex-col gap-3 pt-4 border-t border-slate-200/60">
                    <label className="text-xs font-black text-slate-500">الحقول المعروضة:</label>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(fields).map(([key, field]) => (
                            <button
                                key={key}
                                onClick={() => toggleField(key)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                    field.selected 
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                                }`}
                            >
                                {field.selected && <span className="ml-1">✓</span>}
                                {field.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="no-print mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {userRole === 'SUPERVISOR' && (
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3">
                        <label className="text-xs font-black text-slate-500 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            تصفية حسب الحلقة:
                        </label>
                        <select
                            value={halaqaFilter}
                            onChange={(e) => setHalaqaFilter(e.target.value)}
                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 1.5rem center', backgroundSize: '1rem' }}
                        >
                            <option value="all">كل الحلقات</option>
                            <option value="none">طلاب بدون حلقة</option>
                            {uniqueHalaqas.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                {userRole === 'SUPERVISOR' && (
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3">
                        <label className="text-xs font-black text-slate-500 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            تصفية حسب حالة الرسوم:
                        </label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {[
                                { id: 'feeStatusTerm1', label: 'الترم 1' },
                                { id: 'feeStatusTerm2', label: 'الترم 2' },
                                { id: 'feeStatusSummer', label: 'الصيف' }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setPaymentFilterTerm(t.id)}
                                    className={`py-2 rounded-xl text-[10px] font-black transition-all border ${paymentFilterTerm === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            {[
                                { id: 'all', label: 'الكل' },
                                { id: 'PAID', label: 'المسددين ✅' },
                                { id: 'PENDING', label: 'المتأخرين ❌' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setPaymentFilter(opt.id)}
                                    className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all border-2 ${paymentFilter === opt.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-8 mb-8 border border-slate-100 shadow-sm print:shadow-none print:border-none print:bg-transparent print:p-0">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 mb-1">قائمة بيانات الطلاب</h1>
                            <p className="text-slate-500 font-medium text-lg">تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</p>
                        </div>
                        {halaqaLogo ? (
                            <img src={halaqaLogo} alt="شعار الحلقة" className="w-20 h-20 object-contain shadow-sm rounded-xl" />
                        ) : (
                            <img src="/mosque-logo.png" alt="شعار المسجد" className="w-16 h-16 object-contain opacity-70" />
                        )}
                    </div>
                </div>
                
                <div className="bg-white rounded-[1.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 print:shadow-none print:rounded-none print:border-0 print:bg-transparent">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 print:bg-slate-100 print:border-slate-300">
                                <th className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300 w-16">#</th>
                                {selectedKeys.map(k => (
                                    <th key={k} className="p-4 font-black text-slate-600 text-center border-r border-slate-100 print:border-slate-300">
                                        {fields[k].label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                            {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => (
                                <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                                    <td className="p-4 font-bold text-center text-slate-800 border-r border-slate-50 print:border-slate-200">
                                        {idx + 1}
                                    </td>
                                    {selectedKeys.map(k => {
                                        const isFeeField = k.startsWith('feeStatus');
                                        const val = student[k];
                                        
                                        if (isFeeField && userRole === 'SUPERVISOR') {
                                            const isToggling = togglingId === `${student.id}-${k}`;
                                            return (
                                                <td key={k} className="p-2 text-center border-r border-slate-50 print:border-slate-200">
                                                    <button
                                                        disabled={isToggling}
                                                        onClick={() => handleToggleFee(student.id, k, val)}
                                                        className={`w-full py-2 px-3 rounded-xl text-xs font-black transition-all transform active:scale-95 flex items-center justify-center gap-2 no-print ${
                                                            val === 'PAID' 
                                                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                                            : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                                        } ${isToggling ? 'opacity-50' : ''}`}
                                                    >
                                                        {isToggling ? (
                                                            <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                                                        ) : (
                                                            <>
                                                                {val === 'PAID' ? 'سدد ✅' : 'لم يسدد ❌'}
                                                            </>
                                                        )}
                                                    </button>
                                                    <span className="hidden print:block font-bold">
                                                        {val === 'PAID' ? 'سدد ✅' : 'لم يسدد ❌'}
                                                    </span>
                                                </td>
                                            );
                                        }

                                        return (
                                            <td key={k} className="p-4 text-center font-bold text-slate-800 border-r border-slate-50 print:border-slate-200">
                                                {getFieldValue(student, k)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={selectedKeys.length + 1} className="p-8 text-center text-slate-500 font-bold italic">
                                        لا توجد بيانات تطابق الفلاتر المختارة
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            <style jsx global>{`
                @media print {
                    @page { size: landscape; margin: 0.5cm; }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
}
