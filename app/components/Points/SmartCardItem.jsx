'use client';

import { QRCodeSVG } from 'qrcode.react';

export default function SmartCardItem({ student }) {
    return (
        <div className="card-container relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[480px] w-full max-w-[340px] mx-auto transition-all hover:shadow-md print:shadow-none" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            {/* Card Header */}
            <div className="card-header-print bg-slate-900 p-2 flex items-center justify-between" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
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
            <div className="p-3 flex-1 flex flex-col items-center justify-center text-center bg-white">
                {student.halaqa?.logo ? (
                    <div className="w-16 h-16 flex items-center justify-center mb-1">
                        <img 
                            src={student.halaqa.logo} 
                            decoding="async"
                            className="max-w-full max-h-full object-contain rounded-xl transform scale-110 shadow-sm" 
                            alt="halaqa-logo" 
                        />
                    </div>
                ) : (
                    <div className="w-16 h-16 mb-1 bg-slate-50 rounded-full flex items-center justify-center text-2xl opacity-20">📖</div>
                )}
                
                <h3 className="text-lg font-black text-slate-800 mb-0.5">{student.name}</h3>
                <p className="text-[9px] font-bold text-slate-400 mb-2">الحلقة: {student.halaqa?.name}</p>

                <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-inner mb-2">
                    <QRCodeSVG value={student.id.toString()} size={90} level="H" includeMargin={false} />
                </div>

                <div className="flex items-center justify-between w-full mt-auto px-1">
                    <div className="text-[7px] font-black text-slate-300 uppercase">QURAN PLATFORM</div>
                    <div className="text-[7px] font-black text-slate-300">#STU-{student.id}</div>
                </div>
            </div>
        </div>
    );
}
