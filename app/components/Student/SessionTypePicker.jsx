'use client';

import BaseModal from '@/app/components/Global/BaseModal';

export default function SessionTypePicker({ 
    isOpen, 
    onClose, 
    onSelectType, 
    isKhatim, 
    activeEvent, 
    isQuranicDaySession 
}) {
    const types = [
        { 
            id: 'HIFZ', 
            label: 'حفظ جديد', 
            icon: '📖', 
            color: 'emerald', 
            desc: 'تسميع المقدار اليومي',
            accent: 'from-emerald-500/10 to-teal-500/10',
            border: 'hover:border-emerald-500/50',
            glow: 'group-hover:shadow-emerald-500/20',
            iconBg: 'bg-emerald-500',
            hidden: isKhatim || isQuranicDaySession 
        },
        { 
            id: 'MURAJAAH', 
            label: 'مراجعة فقط', 
            icon: '🔄', 
            color: 'indigo', 
            desc: 'تثبيت السور السابقة',
            accent: 'from-indigo-500/10 to-blue-500/10',
            border: 'hover:border-indigo-500/50',
            glow: 'group-hover:shadow-indigo-500/20',
            iconBg: 'bg-indigo-500'
        },
        { 
            id: 'BOTH', 
            label: 'الاثنين معاً', 
            icon: '💎', 
            color: 'amber', 
            desc: 'حفظ ومراجعة شاملة',
            accent: 'from-amber-500/10 to-orange-500/10',
            border: 'hover:border-amber-500/50',
            glow: 'group-hover:shadow-amber-500/20',
            iconBg: 'bg-amber-500',
            recommended: true,
            hidden: isKhatim || isQuranicDaySession 
        },
    ].filter(t => !t.hidden);

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="ماذا سنسمع اليوم؟"
            maxWidth="max-w-3xl"
        >
            <div className="py-2 sm:py-6 px-1 sm:px-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6" dir="rtl">
                    {types.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => onSelectType(type.id)}
                            className={`group relative p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-2 border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/40 transition-all hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-xl sm:hover:shadow-2xl ${type.glow} ${type.border} active:scale-95 overflow-hidden`}
                        >
                            {/* Gradient Background Decoration */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${type.accent} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                            
                            {type.recommended && (
                                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-amber-500 text-white text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg z-10 animate-bounce">
                                    موصى به
                                </div>
                            )}

                            <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-6">
                                <div className={`w-14 h-14 sm:w-20 sm:h-20 ${type.iconBg} text-white rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-2xl sm:text-4xl shadow-xl shadow-${type.color}-200 dark:shadow-none group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                                    {type.icon}
                                </div>
                                <div className="text-center">
                                    <div className="font-black text-slate-800 dark:text-white text-lg sm:text-xl mb-1 sm:mb-2">{type.label}</div>
                                    <div className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 leading-relaxed px-1 sm:px-2 line-clamp-2">{type.desc}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Event/Campaign Banner */}
                {activeEvent && (
                    <div className="mt-6 sm:mt-10 p-5 sm:p-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-[1.5rem] sm:rounded-[2.5rem] flex items-center justify-between text-white shadow-xl shadow-amber-200 dark:shadow-none overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16 blur-2xl"></div>
                        <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                            <div className="w-12 h-12 sm:w-16 h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl backdrop-blur-md">
                                🏅
                            </div>
                            <div>
                                <h5 className="font-black text-base sm:text-xl mb-0.5 sm:mb-1">موسم نشط: {activeEvent.name}</h5>
                                <p className="font-bold text-[10px] sm:text-sm opacity-90 text-amber-50">سيتم احتساب نقاط مضاعفة!</p>
                            </div>
                        </div>
                        <div className="hidden lg:block relative z-10">
                            <div className="px-6 py-2 bg-white/20 rounded-full font-black text-xs backdrop-blur-md border border-white/30">
                                نقاط مضاعفة 🔥
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </BaseModal>
    );
}
