'use client';

export default function CardsControlPanel({ onPrint, onBack, studentsCount }) {
    return (
        <div className="no-print max-w-6xl mx-auto px-4 mb-8">
            <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm flex flex-wrap justify-between items-center gap-4">
                <div className="flex gap-3">
                    <button 
                        onClick={onPrint}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        طباعة / PDF
                    </button>
                    <button 
                        onClick={onBack}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                        ← عودة للوحة المعلم
                    </button>
                </div>
                
                <div className="flex items-center gap-4 text-slate-500">
                    <div className="text-sm font-bold">
                        إجمالي الطلاب: <span className="text-slate-900 font-black">{studentsCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
