'use client';

import { QRCodeSVG } from 'qrcode.react';

export default function SmartCardItem({ student }) {
    return (
        <div className="card-container relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[400px] w-full max-w-[280px] mx-auto transition-all hover:shadow-md" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            {/* Card Header */}
            <div className="card-header-print bg-slate-900 p-2.5 flex items-center justify-between" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                <div className="flex items-center gap-1.5">
                    <img src="/mosque-logo-white.png" className="w-5 h-5 object-contain" alt="logo" />
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
            <div className="p-4 flex-1 flex flex-col items-center justify-center text-center bg-white">
                {student.halaqa?.logo ? (
                    <div className="w-16 h-16 flex items-center justify-center mb-2">
                        <img 
                            src={student.halaqa.logo} 
                            decoding="async"
                            className="max-w-full max-h-full object-contain rounded-full shadow-sm border border-slate-100" 
                            alt="halaqa-logo" 
                        />
                    </div>
                ) : (
                    <div className="w-16 h-16 mb-2 bg-slate-50 rounded-full flex items-center justify-center text-2xl opacity-20">📖</div>
                )}
                
                <h3 className="text-lg font-black text-slate-800 mb-0.5">{student.name}</h3>
                <p className="text-[9px] font-bold text-slate-400 mb-4">الحلقة: {student.halaqa?.name}</p>

                <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-inner mb-4">
                    <QRCodeSVG value={student.id.toString()} size={90} level="H" includeMargin={false} />
                </div>

                <div className="flex items-center justify-between w-full mt-auto px-1">
                    <div className="text-[7px] font-black text-slate-300">QURAN PLATFORM</div>
                    <div className="text-[7px] font-black text-slate-300">#STU-{student.id}</div>
                </div>
            </div>
        </div>
    );
}
