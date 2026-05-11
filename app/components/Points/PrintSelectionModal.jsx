'use client';

import BaseModal from '@/app/components/Global/BaseModal';

export default function PrintSelectionModal({ 
    isOpen, 
    onClose, 
    onSelect,
    halaqas = [] 
}) {
    const options = [
        { 
            id: 'REGULAR', 
            label: 'بطاقات الطلاب', 
            icon: '🪪', 
            color: 'emerald', 
            desc: 'البطاقات الرسمية لطلاب الحلقة',
            accent: 'from-emerald-500/10 to-teal-500/10',
            border: 'hover:border-emerald-500/50',
            glow: 'group-hover:shadow-emerald-500/20',
            iconBg: 'bg-emerald-500'
        },
        { 
            id: 'UNIVERSITY', 
            label: 'بطاقات الجامعيين', 
            icon: '🎓', 
            color: 'indigo', 
            desc: 'بطاقات خاصة لطلاب المرحلة الجامعية',
            accent: 'from-indigo-500/10 to-blue-500/10',
            border: 'hover:border-indigo-500/50',
            glow: 'group-hover:shadow-indigo-500/20',
            iconBg: 'bg-indigo-500'
        },
        { 
            id: 'EVENT', 
            label: 'اليوم القرآني', 
            icon: '🌟', 
            color: 'amber', 
            desc: 'بطاقات خاصة لفعاليات اليوم القرآني',
            accent: 'from-amber-500/10 to-orange-500/10',
            border: 'hover:border-amber-500/50',
            glow: 'group-hover:shadow-amber-500/20',
            iconBg: 'bg-amber-500'
        },
    ];

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            hideHeader={true}
            maxWidth="max-w-4xl"
        >
            <div className="py-8 px-4 flex flex-col items-center bg-slate-900/90 dark:bg-slate-900/95 -m-8 min-h-[500px]">
                {/* Top Sparkle Icon */}
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-3xl mb-6 backdrop-blur-xl border border-white/10">
                    ✨
                </div>

                <h2 className="text-3xl font-black text-white mb-2 text-center">اختر نوع البطاقات؟</h2>
                <p className="text-slate-400 font-bold mb-10 text-center">اختر نوع الجلسة للبدء في الطباعة</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl px-4" dir="rtl">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => onSelect(option.id)}
                            className={`group relative p-8 rounded-[3rem] border-2 border-white/5 bg-white/5 transition-all hover:-translate-y-2 hover:shadow-2xl ${option.glow} ${option.border} active:scale-95 overflow-hidden flex flex-col items-center gap-6`}
                        >
                            {/* Gradient Background Decoration */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${option.accent} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                            
                            <div className={`w-16 h-16 ${option.iconBg} text-white rounded-2xl flex items-center justify-center text-3xl shadow-xl transition-all group-hover:scale-110 group-hover:rotate-6 relative z-10`}>
                                {option.icon}
                            </div>
                            <div className="text-center relative z-10">
                                <div className="font-black text-white text-xl mb-2">{option.label}</div>
                                <div className="text-[10px] font-bold text-slate-400 leading-relaxed px-2 line-clamp-2">{option.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {halaqas.length > 1 && (
                    <div className="mt-10 p-6 bg-white/5 rounded-[2.5rem] border border-white/5 w-full max-w-4xl">
                        <h4 className="text-sm font-black text-slate-500 mb-4 mr-2">أو اختر حسب الحلقة:</h4>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {halaqas.map(h => (
                                <button
                                    key={h.id}
                                    onClick={() => onSelect('HALAQA', h.id)}
                                    className="px-6 py-3 bg-white/5 border-2 border-white/5 rounded-2xl font-bold text-white hover:border-emerald-500 hover:bg-emerald-500/10 transition-all active:scale-95"
                                >
                                    حلقة {h.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom Close Button */}
                <button 
                    onClick={onClose}
                    className="mt-12 flex items-center gap-2 text-slate-400 hover:text-white font-black transition-colors"
                >
                    <span>إغلاق</span>
                    <span className="w-6 h-6 border-2 border-slate-700 rounded-lg flex items-center justify-center text-xs">✕</span>
                </button>
            </div>
        </BaseModal>
    );
}
