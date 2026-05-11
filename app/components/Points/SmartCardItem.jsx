'use client';

import { QRCodeSVG } from 'qrcode.react';

export default function SmartCardItem({ student }) {
    return (
        <div className="card-container relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm print:shadow-none transition-all hover:shadow-lg" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            {/* Card Header */}
            <div className="bg-slate-900 p-2 flex items-center justify-between" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
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
            <div className="p-3 flex-1 flex flex-col items-center justify-center text-center">
                {student.halaqa?.logo ? (
                    <div className="w-14 h-14 flex items-center justify-center mb-1">
                        <img 
                            src={student.halaqa.logo} 
                            decoding="async"
                            className="max-w-full max-h-full object-contain rounded-xl transform scale-110" 
                            alt="halaqa-logo" 
                        />
                    </div>
                ) : (
                    <div className="w-14 h-14 mb-1"></div>
                )}
                <h3 className="text-sm font-black text-slate-800 mb-0.5">{student.name}</h3>
                <p className="text-[8px] font-bold text-slate-400 mb-2">الحلقة: {student.halaqa?.name}</p>

                <div className="p-2 bg-white rounded-2xl shadow-inner border border-slate-50 mb-2 group-hover:scale-105 transition-transform">
                    <QRCodeSVG value={student.id.toString()} size={80} level="H" includeMargin={true} />
                </div>

                <div className="flex items-center justify-between w-full mt-1 px-1">
                    <div className="text-[6px] font-black text-slate-300">#STU-{student.id}</div>
                    <div className="text-[6px] font-black text-slate-300 uppercase tracking-widest">QURAN PLATFORM</div>
                </div>
            </div>
        </div>
    );
}
