'use client';

import { QRCodeSVG } from 'qrcode.react';

export default function SmartCardItem({ student }) {
    return (
        <div className="group card-container relative overflow-hidden bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col h-[320px] w-full max-w-[350px] mx-auto transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-emerald-500/30 print:shadow-none print:border-slate-200 print:rounded-2xl print:translate-y-0" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            {/* Hover Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"></div>
            
            {/* Card Header */}
            <div className="relative z-10 card-header-print bg-slate-900 p-2 flex items-center justify-between" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                        <img src="/mosque-logo-white.png" className="max-w-full max-h-full object-contain" alt="logo" />
                    </div>
                    <div className="text-[7px] text-white font-bold leading-tight">
                        جامع الحديقة<br/>
                        <span className="text-slate-400">حي السلامة</span>
                    </div>
                </div>
                <div className="text-emerald-400 font-black text-[9px] uppercase tracking-tighter">
                    بطاقة الطالب
                </div>
            </div>

            {/* Card Body */}
            <div className="relative z-10 p-3 flex-1 flex flex-col items-center justify-center text-center bg-transparent">
                {student.halaqa?.logo ? (
                    <div className="w-16 h-16 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-500">
                        <img 
                            src={student.halaqa.logo} 
                            decoding="async"
                            className="max-w-full max-h-full object-contain rounded-xl transform scale-110 shadow-sm" 
                            alt="halaqa-logo" 
                        />
                    </div>
                ) : (
                    <div className="w-16 h-16 mb-1 bg-slate-50 rounded-full flex items-center justify-center text-2xl opacity-20 group-hover:scale-110 transition-transform duration-500">📖</div>
                )}
                
                <h3 className="text-lg font-black text-slate-800 mb-0.5 group-hover:text-emerald-700 transition-colors">{student.name}</h3>
                <p className="text-[9px] font-bold text-slate-400 mb-2">الحلقة: {student.halaqa?.name}</p>

                <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-inner mb-2">
                    <QRCodeSVG value={student.id.toString()} size={70} level="H" includeMargin={false} />
                </div>

                <div className="flex items-center justify-between w-full mt-auto px-1">
                    <div className="text-[7px] font-black text-slate-300 uppercase">QURAN PLATFORM</div>
                    <div className="text-[7px] font-black text-slate-300">#STU-{student.id}</div>
                </div>
            </div>
        </div>
    );
}
