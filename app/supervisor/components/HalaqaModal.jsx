'use client';

export default function HalaqaModal({
    show,
    onClose,
    onSubmit,
    submitting,
    isEditing,
    halaqa,
    setHalaqa,
    teachers,
    halaqas,
    editHalaqaId,
    normalizeText,
    searchTeacherInHalaqa,
    setSearchTeacherInHalaqa,
    searchAssistantInHalaqa,
    setSearchAssistantInHalaqa,
    onLogoUpload,
}) {
    if (!show) return null;

    const closeModal = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-[12px] md:backdrop-blur-[20px]">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 animate-fadeIn" onClick={closeModal}></div>
            <div className="relative w-full max-w-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="sticky top-0 z-[60] p-6 sm:p-8 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-[2.5rem] flex-shrink-0 shadow-md">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                                {isEditing ? 'تعديل بيانات الحلقة' : 'إنشاء حلقة جديدة'}
                            </h3>
                            <p className="text-indigo-100 font-bold mt-0.5 text-xs sm:text-sm">قم بتعيين المشرفين والمساعدين لكل حلقة</p>
                        </div>
                        <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white/50 dark:bg-slate-900/50">
                        <form id="halaqa-form" onSubmit={onSubmit} className="space-y-6 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mr-1">اسم الحلقة</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="مثال: حلقة علي بن أبي طالب"
                                            className="w-full pr-12 pl-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-[1.5rem] outline-none transition-all font-bold dark:text-white"
                                            value={halaqa.name}
                                            onChange={(e) => setHalaqa({ ...halaqa, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Logo */}
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mr-1">شعار الحلقة (اختياري)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-dashed border-slate-300 dark:border-slate-700">
                                            {halaqa.logo ? (
                                                <img src={halaqa.logo} className="w-full h-full object-contain" alt="Logo preview" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">🖼️</div>
                                            )}
                                        </div>
                                        <label className="flex-1 cursor-pointer">
                                            <div className="py-3 px-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-center text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                                                {halaqa.logo ? 'تغيير الشعار' : 'اختر شعار'}
                                            </div>
                                            <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                                        </label>
                                        {halaqa.logo && (
                                            <button
                                                type="button"
                                                onClick={() => setHalaqa({ ...halaqa, logo: null })}
                                                className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Main Teacher */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between mr-1">
                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">المعلم المشرف</label>
                                    </div>
                                    <div className="relative group mb-2">
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="ابحث عن المشرف..."
                                            className="w-full pr-12 pl-6 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-bold dark:text-white mb-2 text-sm"
                                            value={searchTeacherInHalaqa}
                                            onChange={(e) => setSearchTeacherInHalaqa(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-slate-100 dark:border-slate-800 rounded-2xl max-h-64 overflow-y-auto custom-scrollbar">
                                        {teachers
                                            .filter(t => !halaqa.assistantTeacherIds.includes(t.id.toString()))
                                            .filter(t => {
                                                const searchMatch = normalizeText(t.name).includes(normalizeText(searchTeacherInHalaqa));
                                                const hasHalaqa = halaqas.some(h =>
                                                    h.id.toString() !== editHalaqaId?.toString() && (
                                                        h.teacherId?.toString() === t.id.toString() ||
                                                        (h.assistants && h.assistants.some(at => at.id.toString() === t.id.toString()))
                                                    )
                                                );
                                                if (searchTeacherInHalaqa) return searchMatch;
                                                return !hasHalaqa;
                                            })
                                            .sort((a, b) => {
                                                const isSelectedA = halaqa.teacherId === a.id.toString();
                                                const isSelectedB = halaqa.teacherId === b.id.toString();
                                                if (isSelectedA && !isSelectedB) return -1;
                                                if (!isSelectedA && isSelectedB) return 1;
                                                return a.name.localeCompare(b.name, 'ar');
                                            })
                                            .map(t => {
                                                const hasHalaqa = halaqas.some(h =>
                                                    h.id.toString() !== editHalaqaId?.toString() && (
                                                        h.teacherId?.toString() === t.id.toString() ||
                                                        (h.assistants && h.assistants.some(at => at.id.toString() === t.id.toString()))
                                                    )
                                                );
                                                const isSelected = halaqa.teacherId === t.id.toString();
                                                return (
                                                    <label key={t.id} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${isSelected ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <input
                                                                    type="radio"
                                                                    name="teacher"
                                                                    disabled={hasHalaqa && !isSelected}
                                                                    checked={isSelected}
                                                                    onChange={() => setHalaqa({
                                                                        ...halaqa,
                                                                        teacherId: t.id.toString(),
                                                                        assistantTeacherIds: halaqa.assistantTeacherIds.filter(id => id !== t.id.toString())
                                                                    })}
                                                                    className="peer sr-only"
                                                                />
                                                                <div className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${isSelected ? 'border-white bg-white' : hasHalaqa ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800' : 'border-slate-300 dark:border-slate-600'}`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full transition-transform ${isSelected ? 'bg-indigo-600 scale-100' : 'scale-0'}`}></div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className={`text-sm font-black transition-colors ${isSelected ? 'text-white' : hasHalaqa ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600'}`}>{t.name}</span>
                                                                {hasHalaqa && !isSelected ? (
                                                                    <span className="text-[10px] font-bold text-amber-500">مشرف على حلقة أخرى</span>
                                                                ) : (
                                                                    <span className="text-[10px] opacity-0 h-0">Ghost Space</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${isSelected ? 'text-indigo-100 opacity-100' : 'opacity-0'}`}>المشرف المختار</span>
                                                    </label>
                                                );
                                            })}
                                    </div>
                                </div>

                                {/* Assistants */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between mr-1">
                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">المساعدين (اختياري)</label>
                                    </div>
                                    <div className="relative group mb-2">
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="ابحث عن مساعد..."
                                            className="w-full pr-12 pl-6 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-bold dark:text-white mb-2 text-sm"
                                            value={searchAssistantInHalaqa}
                                            onChange={(e) => setSearchAssistantInHalaqa(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-slate-100 dark:border-slate-800 rounded-2xl max-h-64 overflow-y-auto custom-scrollbar">
                                        {teachers
                                            .filter(t => t.id.toString() !== halaqa.teacherId?.toString())
                                            .filter(t => {
                                                const searchMatch = normalizeText(t.name).includes(normalizeText(searchAssistantInHalaqa));
                                                const hasHalaqa = halaqas.some(h =>
                                                    h.id.toString() !== editHalaqaId?.toString() && (
                                                        h.teacherId?.toString() === t.id.toString() ||
                                                        (h.assistants && h.assistants.some(at => at.id.toString() === t.id.toString()))
                                                    )
                                                );
                                                if (searchAssistantInHalaqa) return searchMatch;
                                                return !hasHalaqa;
                                            })
                                            .sort((a, b) => {
                                                const isCheckedA = halaqa.assistantTeacherIds.includes(a.id.toString());
                                                const isCheckedB = halaqa.assistantTeacherIds.includes(b.id.toString());
                                                if (isCheckedA && !isCheckedB) return -1;
                                                if (!isCheckedA && isCheckedB) return 1;
                                                return a.name.localeCompare(b.name, 'ar');
                                            })
                                            .map(t => {
                                                const hasHalaqa = halaqas.some(h =>
                                                    h.id.toString() !== editHalaqaId?.toString() && (
                                                        h.teacherId?.toString() === t.id.toString() ||
                                                        (h.assistants && h.assistants.some(at => at.id.toString() === t.id.toString()))
                                                    )
                                                );
                                                const isChecked = halaqa.assistantTeacherIds.includes(t.id.toString());
                                                return (
                                                    <label key={t.id} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${isChecked ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 border' : 'hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <input
                                                                    type="checkbox"
                                                                    disabled={hasHalaqa && !isChecked}
                                                                    checked={isChecked}
                                                                    onChange={(e) => {
                                                                        const ids = [...halaqa.assistantTeacherIds];
                                                                        if (e.target.checked) ids.push(t.id.toString());
                                                                        else {
                                                                            const idx = ids.indexOf(t.id.toString());
                                                                            if (idx > -1) ids.splice(idx, 1);
                                                                        }
                                                                        setHalaqa({ ...halaqa, assistantTeacherIds: ids });
                                                                    }}
                                                                    className="peer sr-only"
                                                                />
                                                                <div className={`w-4 h-4 border-2 rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center ${isChecked ? 'border-indigo-600' : hasHalaqa ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800' : 'border-slate-300 dark:border-slate-600'}`}>
                                                                    <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className={`text-sm font-black transition-colors ${isChecked ? 'text-indigo-700 dark:text-indigo-400' : hasHalaqa ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600'}`}>{t.name}</span>
                                                                {hasHalaqa && !isChecked ? (
                                                                    <span className="text-[10px] font-bold text-amber-500">مكلف بحلقة أخرى</span>
                                                                ) : (
                                                                    <span className="text-[10px] opacity-0 h-0">Ghost Space</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest transition-all ${isChecked ? 'opacity-100' : 'opacity-0'}`}>مساعد مختار</span>
                                                    </label>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-4 flex-shrink-0 z-[60] relative">
                        <button type="button" onClick={closeModal} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all">إلغاء</button>
                        <button type="submit" form="halaqa-form" disabled={submitting} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50 shadow-indigo-200 dark:shadow-none">
                            {submitting ? 'جاري الحفظ...' : (isEditing ? 'حفظ التعديلات' : 'إنشاء الحلقة')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
