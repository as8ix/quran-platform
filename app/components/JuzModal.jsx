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
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 dir-rtl"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">تفاصيل اليوم {juz}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'long', weekday: 'long' }).format(new Date())}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-bold text-sm ${getStatusColor()}`}>
                        {getStatusText()}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="space-y-4 mb-8">
                    {/* Memorization Section */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <span>📖</span> الحفظ الجديد
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-400 text-xs mb-1">المطلوب</p>
                                <p className="font-semibold text-gray-800">{mockData.required.mem}</p>
                                <p className="text-xs text-blue-600 mt-1">{mockData.required.memDetails}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs mb-1">المنجز</p>
                                <p className={`font-semibold ${status === 'red' ? 'text-red-500' : 'text-gray-800'}`}>
                                    {mockData.completed.mem}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Review Section */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <span>🔄</span> المراجعة
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-400 text-xs mb-1">المطلوب</p>
                                <p className="font-semibold text-gray-800">{mockData.required.rev}</p>
                                <p className="text-xs text-blue-600 mt-1">{mockData.required.revDetails}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs mb-1">المنجز</p>
                                <p className={`font-semibold ${status === 'red' ? 'text-red-500' : 'text-gray-800'}`}>
                                    {mockData.completed.rev}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
}
