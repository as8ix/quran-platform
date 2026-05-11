'use client';

import { QRCodeSVG } from 'qrcode.react';

export default function SmartCardItem({ student }) {
    return (
        <div className="card-container relative overflow-hidden bg-slate-900 rounded-[1.5rem] shadow-xl flex flex-col items-center text-center group transition-all border border-slate-800 w-full max-w-[300px] h-[420px] mx-auto" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-12 -mt-12"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -ml-12 -mb-12"></div>
            
            {/* Mosque Logo / Branding */}
            <div className="p-4 bg-white/5 border-b border-white/5 w-full flex items-center justify-between backdrop-blur-sm relative z-10">
                <div className="flex items-center gap-2">
                    <img src="/mosque-logo-white.png" className="w-5 h-5 object-contain" alt="logo" />
                    <div className="text-right">
                        <div className="text-[8px] text-white font-black leading-tight">جامع الحديقة</div>
                        <div className="text-[6px] text-slate-500 font-bold uppercase tracking-tighter">Quran Platform</div>
                    </div>
                </div>
                <div className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-md">
                    <span className="text-[7px] text-emerald-400 font-black uppercase tracking-widest">بطاقة ذكية</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 w-full relative z-10">
                {/* Halaqa Logo */}
                {student.halaqa?.logo ? (
                    <div className="w-16 h-16 mb-4 relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                        <img 
                            src={student.halaqa.logo} 
                            className="w-full h-full object-contain relative z-10 drop-shadow-lg" 
                            alt="halaqa-logo" 
                        />
                    </div>
                ) : (
                    <div className="w-16 h-16 mb-4 bg-white/5 rounded-full flex items-center justify-center text-2xl">📖</div>
                )}

                {/* Student Info */}
                <div className="mb-6">
                    <h3 className="text-lg font-black text-white mb-1 tracking-tight line-clamp-1">{student.name}</h3>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-[8px] text-slate-500 font-bold">الحلقة:</span>
                        <span className="text-[10px] text-emerald-400 font-black">{student.halaqa?.name}</span>
                    </div>
                </div>

                {/* QR Code Section */}
                <div className="relative p-3 bg-white rounded-2xl shadow-2xl mb-4">
                    <QRCodeSVG 
                        value={student.id.toString()} 
                        size={100} 
                        level="H" 
                        includeMargin={false}
                        className="relative z-10"
                    />
                </div>
            </div>

            {/* Card ID Footer */}
            <div className="w-full p-3 bg-white/5 border-t border-white/5 flex items-center justify-between relative z-10">
                <div className="text-[8px] font-black text-slate-500 tracking-wider">#STU-{student.id}</div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-30">SAUDI ARABIA</div>
            </div>
        </div>
    );
}
