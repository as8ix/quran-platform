'use client';

export default function RecipientSelector({ 
    targetType, 
    setTargetType, 
    students, 
    teachers, 
    selectedRecipients, 
    handleRecipientToggle,
    selectAll,
    handleSelectAll,
    senderRole
}) {
    const list = targetType === 'STUDENT' ? students : teachers;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">المستلمون</label>
                {senderRole === 'SUPERVISOR' && (
                    <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-0.5 rounded-lg backdrop-blur-sm">
                        <button 
                            type="button" 
                            onClick={() => { setTargetType('STUDENT'); }} 
                            className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${targetType === 'STUDENT' ? 'bg-white/90 dark:bg-slate-700/90 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                        >
                            الطلاب
                        </button>
                        <button 
                            type="button" 
                            onClick={() => { setTargetType('TEACHER'); }} 
                            className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${targetType === 'TEACHER' ? 'bg-white/90 dark:bg-slate-700/90 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                        >
                            المعلمين
                        </button>
                    </div>
                )}
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[180px] bg-white/10 dark:bg-slate-800/10 backdrop-blur-sm shadow-sm">
                <div className="p-3 border-b border-slate-100/30 dark:border-slate-800/30 flex items-center justify-between bg-white/20 dark:bg-slate-900/30">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={selectAll} 
                            onChange={(e) => handleSelectAll(e.target.checked)} 
                            className="custom-checkbox checked:bg-indigo-600 checked:border-indigo-600" 
                        />
                        <span className="text-[10px] font-black text-slate-500 group-hover:text-indigo-600 transition-colors">الكل</span>
                    </label>
                    <span className="text-[9px] font-black bg-indigo-100/40 dark:bg-indigo-900/40 text-indigo-600 px-2.5 py-1 rounded-full">
                        {selectedRecipients.length} مختار
                    </span>
                </div>
                <div className="overflow-y-auto p-3 space-y-1.5 custom-scrollbar flex-1">
                    {list.map(item => {
                        const isSelected = selectedRecipients.includes(item.id);
                        return (
                            <label 
                                key={item.id} 
                                className="flex items-center gap-3 p-2.5 hover:bg-white/30 dark:hover:bg-slate-800/20 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-100/20 dark:hover:border-slate-700/20 group"
                            >
                                <input 
                                    type="checkbox" 
                                    checked={isSelected} 
                                    onChange={() => handleRecipientToggle(item.id)} 
                                    className="custom-checkbox checked:bg-indigo-600 checked:border-indigo-600" 
                                />
                                <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600'}`}>
                                    {item.name}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
