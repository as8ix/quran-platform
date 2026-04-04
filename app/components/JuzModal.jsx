'use client';

export default function JuzModal({ juz, onClose }) {
    if (!juz) return null;

    // Mock Data for the selected day (In real app, fetch from DB based on date/day)
    // We simulate three scenarios based on the day number for variety in demo:
    let status = 'green'; // green, yellow, red
    let mockData = {
        required: { mem: 'وجهين من سورة البقرة', memDetails: 'من آية 100 إلى 115', rev: 'الجزء الأول', revDetails: 'سورة البقرة: من آية 1 إلى 141' },
        completed: { mem: 'وجهين كاملة', rev: 'الجزء الأول' },
        score: '100%'
    };

    if (juz % 3 === 0) {
        status = 'yellow';
        mockData = {
            required: { mem: 'وجهين من سورة البقرة', memDetails: 'من آية 142 إلى 157', rev: 'الجزء الثالث', revDetails: 'سورة البقرة (253) - آل عمران (92)' },
            completed: { mem: 'وجه واحد', rev: 'نصف الجزء' },
            score: '50%'
        };
    } else if (juz % 4 === 0) {
        status = 'red';
        mockData = {
            required: { mem: 'وجهين من سورة البقرة', memDetails: 'من آية 170 إلى 185', rev: 'الجزء الرابع', revDetails: 'سورة آل عمران (93) - النساء (23)' },
            completed: { mem: 'لم يحفظ', rev: 'لم يراجع' },
            score: '0%'
        };
    }

    // Border Color Logic
    const getBorderColor = () => {
        if (status === 'green') return 'border-green-500 shadow-green-100';
        if (status === 'yellow') return 'border-yellow-500 shadow-yellow-100';
        return 'border-red-500 shadow-red-100';
    };

    const getStatusText = () => {
        if (status === 'green') return 'ممتاز';
        if (status === 'yellow') return 'جيد';
        return 'غير مكتمل';
    };

    const getStatusColor = () => {
        if (status === 'green') return 'text-green-600 bg-green-50';
        if (status === 'yellow') return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <div className="modal-overlay animate-fadeIn" onClick={onClose}>
            <div className="modal-content animate-slideUp max-w-lg" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">تفاصيل اليوم {juz}</h3>
                        <p className="text-sm text-slate-500 mt-1 font-bold">
                            {new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'long', weekday: 'long' }).format(new Date())}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl font-black text-sm shadow-sm ${getStatusColor()}`}>
                        {getStatusText()}
                    </div>
                </div>

                {/* Body */}
                <div className="modal-body space-y-4">
                    {/* Memorization Section */}
                    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[1.5rem] p-5 border border-slate-100 dark:border-slate-800">
                        <h4 className="font-black text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm">📖</span> الحفظ الجديد
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-50 dark:border-slate-700">
                                <p className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-wider">المطلوب</p>
                                <p className="font-bold text-slate-800 dark:text-white">{mockData.required.mem}</p>
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1.5">{mockData.required.memDetails}</p>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-50 dark:border-slate-700">
                                <p className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-wider">المنجز</p>
                                <p className={`font-black text-sm ${status === 'red' ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                                    {mockData.completed.mem}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Review Section */}
                    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[1.5rem] p-5 border border-slate-100 dark:border-slate-800">
                        <h4 className="font-black text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm">🔄</span> المراجعة
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-50 dark:border-slate-700">
                                <p className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-wider">المطلوب</p>
                                <p className="font-bold text-slate-800 dark:text-white">{mockData.required.rev}</p>
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1.5">{mockData.required.revDetails}</p>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-50 dark:border-slate-700">
                                <p className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-wider">المنجز</p>
                                <p className={`font-black text-sm ${status === 'red' ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                                    {mockData.completed.rev}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
}
