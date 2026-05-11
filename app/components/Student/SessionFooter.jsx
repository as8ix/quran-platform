'use client';

export default function SessionFooter({ notes, setNotes, saving, editingSessionId }) {
    return (
        <div className="space-y-8">
            <textarea
                placeholder="أي ملاحظات إضافية على التسميع..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full p-8 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-slate-200 dark:focus:border-slate-700 rounded-[2.5rem] outline-none min-h-[150px] transition-all text-slate-600 dark:text-slate-300 font-medium"
            />

            <button
                type="submit"
                disabled={saving}
                className="group relative w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-slate-300 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden"
            >
                <span className="relative z-10 flex items-center justify-center gap-4">
                    {saving ? 'جاري الحفظ...' : editingSessionId ? 'تحديث تقرير اليوم 💎' : 'حفظ تقرير اليوم 💎'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
        </div>
    );
}
