'use client';

export default function PointsSettings({ 
    mode, 
    setMode, 
    amount, 
    setAmount, 
    category, 
    setCategory, 
    categories 
}) {
    return (
        <div className={`premium-glass p-6 rounded-[2rem] border-2 mb-8 flex flex-wrap items-center gap-6 transition-all duration-500 ${mode === 'deduct' ? 'border-rose-500/50 bg-rose-50/10' : 'border-emerald-500/20'}`}>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button 
                    onClick={() => setMode('add')}
                    className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${mode === 'add' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}
                >
                    ➕ إضافة
                </button>
                <button 
                    onClick={() => setMode('deduct')}
                    className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${mode === 'deduct' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400'}`}
                >
                    ➖ خصم
                </button>
            </div>

            <div className="flex items-center gap-3">
                <span className="font-black text-slate-500">النقاط:</span>
                <input 
                    type="number" 
                    className={`w-20 px-4 py-2 bg-white dark:bg-slate-900 border-2 rounded-xl font-black text-center outline-none focus:ring-2 transition-all ${mode === 'deduct' ? 'text-rose-600 border-rose-100 dark:border-rose-900/30 focus:border-rose-500 ring-rose-500/20' : 'text-emerald-600 border-slate-100 dark:border-slate-800 focus:border-emerald-500 ring-emerald-500/20'}`}
                    value={amount}
                    onChange={(e) => setAmount(Math.abs(parseInt(e.target.value) || 0))}
                />
            </div>
            <div className="flex items-center gap-3">
                <span className="font-black text-slate-500">التصنيف:</span>
                <div className="flex flex-wrap gap-2">
                    {categories.map(c => (
                        <button 
                            key={c.id}
                            onClick={() => setCategory(c.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${category === c.id ? (mode === 'deduct' ? 'bg-rose-600 text-white border-rose-600' : 'bg-emerald-600 text-white border-emerald-600 shadow-md') : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-emerald-200'}`}
                        >
                            {c.icon} {c.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
