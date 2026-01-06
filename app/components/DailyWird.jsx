'use client';

export default function DailyWird({ surah, pages, onComplete }) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1 text-center md:text-right">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">الورد اليومي</h2>
                <p className="font-amiri text-3xl font-bold text-green-600 mb-2">{surah}</p>
                <p className="text-gray-600">{pages}</p>
            </div>
            <button
                onClick={onComplete}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2"
            >
                <span>✓</span>
                <span>تم الإنجاز</span>
            </button>
        </div>
    );
}
