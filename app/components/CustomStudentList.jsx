'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function CustomStudentList({ userRole, initialTeacherId }) {
    const router = useRouter();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Available fields to select
    const [fields, setFields] = useState({
        displayId: { label: 'رقم التسلسل', selected: true },
        name: { label: 'اسم الطالب', selected: true },
        nationalId: { label: 'رقم الهوية', selected: true },
        nationality: { label: 'الجنسية', selected: true },
        phone: { label: 'جوال الطالب', selected: false },
        parentPhone: { label: 'جوال ولي الأمر (1)', selected: false },
        parentPhone2: { label: 'جوال ولي الأمر (2)', selected: false },
        halaqa: { label: 'الحلقة', selected: false },
        joinDate: { label: 'تاريخ الالتحاق', selected: false }
    });

    useEffect(() => {
        fetchStudents();
    }, [initialTeacherId]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            let url = '/api/students';
            if (initialTeacherId) {
                // If it's a teacher, get their specific students.
                url += `?teacherId=${initialTeacherId}`;
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
            default: return '';
        }
    };

    const handleCopyText = () => {
        const selectedKeys = Object.keys(fields).filter(k => fields[k].selected);
        
        // Header
        let text = selectedKeys.map(k => fields[k].label).join(' | ') + '\n';
        text += '-'.repeat(text.length) + '\n';
        
        // Rows
        students.forEach((student, index) => {
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

            <div className="bg-slate-50 rounded-[2rem] p-8 mb-8 border border-slate-100 shadow-sm print:shadow-none print:border-none print:bg-transparent print:p-0">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-1">قائمة بيانات الطلاب</h1>
                        <p className="text-slate-500 font-medium text-lg">تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</p>
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
                            {students.length > 0 ? students.map((student, idx) => (
                                <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                                    <td className="p-4 font-bold text-center text-slate-800 border-r border-slate-50 print:border-slate-200">
                                        {idx + 1}
                                    </td>
                                    {selectedKeys.map(k => (
                                        <td key={k} className="p-4 text-center font-bold text-slate-800 border-r border-slate-50 print:border-slate-200">
                                            {getFieldValue(student, k)}
                                        </td>
                                    ))}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={selectedKeys.length + 1} className="p-8 text-center text-slate-500 font-bold">
                                        لا توجد بيانات للطلاب
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
