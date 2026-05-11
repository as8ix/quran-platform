'use client';

import { formatHijri } from '@/app/utils/dateUtils';

export default function CardsReportHeader({ halaqaName, teacherName, studentsCount }) {
    const todayHijri = formatHijri(new Date(), 'long');
    const printDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    return (
        <div className="report-header flex justify-between items-start mb-16 pb-10 border-b border-slate-50 print:border-slate-100">
            <div className="text-right">
                <h1 className="text-3xl font-black text-slate-900 mb-1">بطاقات التعريف الذكية {halaqaName ? `(${halaqaName})` : ''}</h1>
                <p className="text-slate-500 font-medium text-lg">تاريخ الإصدار: {todayHijri} هـ</p>
            </div>
            
            <div className="flex flex-col items-center gap-2">
                <img src="/mosque-logo.png" alt="شعار المسجد" className="w-16 h-16 object-contain opacity-80" />
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">
                    جامع الحديقة<br/>حي السلامة
                </div>
            </div>
        </div>
    );
}
