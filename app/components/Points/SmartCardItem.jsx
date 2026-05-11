'use client';

import { QRCodeSVG } from 'qrcode.react';

export default function SmartCardItem({ student }) {
    return (
        <div className="card-container relative overflow-hidden bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center text-center group transition-all hover:scale-[1.02] border border-slate-800" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
            
            {/* Mosque Logo / Branding */}
            <div className="flex items-center gap-3 mb-8 self-start w-full">
                <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                    <img src="/mosque-logo-white.png" className="w-6 h-6 object-contain" alt="logo" />
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-white font-black leading-tight">جامع الحديقة</div>
                    <div className="text-[8px] text-slate-500 font-bold">منصة التحفيظ</div>
                </div>
                <div className="mr-auto">
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <span className="text-[8px] text-emerald-500 font-black uppercase tracking-tighter">بطاقة ذكية</span>
                    </div>
                </div>
            </div>

            {/* Halaqa Logo */}
            {student.halaqa?.logo && (
                <div className="w-20 h-20 mb-4 relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full"></div>
                    <img 
                        src={student.halaqa.logo} 
                        className="w-full h-full object-contain relative z-10 drop-shadow-2xl transform group-hover:scale-110 transition-transform" 
                        alt="halaqa-logo" 
                    />
                </div>
            )}

            {/* Student Info */}
            <div className="mb-6">
                <h3 className="text-xl font-black text-white mb-1 tracking-tight">{student.name}</h3>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 font-bold">حلقة:</span>
                    <span className="text-xs text-emerald-400 font-black">{student.halaqa?.name}</span>
                </div>
            </div>

            {/* QR Code Section */}
            <div className="relative p-4 bg-white rounded-[2rem] shadow-2xl mb-6 group-hover:rotate-2 transition-transform">
                <QRCodeSVG 
                    value={student.id.toString()} 
                    size={120} 
                    level="H" 
                    includeMargin={false}
                    className="relative z-10"
                />
            </div>

            {/* Card ID Footer */}
            <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-white/5">
                <div className="text-[9px] font-black text-slate-500 tracking-widest">#STU-{student.id}</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">PLATFORM</div>
            </div>
        </div>
    );
}
