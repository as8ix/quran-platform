'use client';

export default function MonthlyChart({ data }) {
    return (
        <div className="space-y-4">
            {/* Chart */}
            <div className="flex items-end justify-around gap-4 h-64 px-4">
                {data.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div
                            className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-xl hover:shadow-lg transition-all duration-300 relative group cursor-pointer"
                            style={{ height: `${item.height}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.value}
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">{item.month}</span>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200">
                <div className="w-4 h-4 bg-gradient-to-r from-green-600 to-green-400 rounded"></div>
                <span className="text-sm text-gray-600">عدد الأجزاء المحفوظة</span>
            </div>
        </div>
    );
}
