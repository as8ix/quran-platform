'use client';

export default function JuzProgress({ totalJuz = 30, completedCount = 15, currentJuzStart = 16, currentJuzEnd = 17, onJuzClick, mode = 'memorization' }) {

    // Helper to determine styling based on mode and status
    const getColors = (status, isWeekend) => {
        if (isWeekend) return 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed';

        switch (status) {
            case 'excellent': // Green
                return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:shadow-md transition-all';
            case 'good': // Yellow
                return 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:shadow-md transition-all';
            case 'incomplete': // Red
                return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:shadow-md transition-all';
            case 'current': // Blue (Today/Active)
                return 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105';
            default: // Future/None
                return 'bg-white border-gray-100 text-gray-400 opacity-60 hover:opacity-100 hover:bg-gray-50 transition-all';
        }
    };

    // Get current month info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentDay = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Calculate the First Sunday of the month
    let startDay = 1;
    let tempDate = new Date(currentYear, currentMonth, 1);
    while (tempDate.getDay() !== 0) { // While not Sunday (0)
        tempDate.setDate(tempDate.getDate() + 1);
    }
    startDay = tempDate.getDate();

    // Day Names in Arabic
    const daysArabic = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    return (
        <div className="grid grid-cols-7 gap-3 direction-rtl">
            {/* Generate array from First Sunday -> End of Month */}
            {Array.from({ length: daysInMonth - startDay + 1 }, (_, i) => startDay + i).map((dayNum) => {
                // Determine Date Info
                const date = new Date(currentYear, currentMonth, dayNum);
                const dayIndex = date.getDay(); // 0 = Sunday, ... 6 = Saturday

                // Weekend Logic: Thursday(4), Friday(5), Saturday(6) are gray.
                const isWeekend = dayIndex === 4 || dayIndex === 5 || dayIndex === 6;

                // Arabic day name
                const dayName = daysArabic[dayIndex];

                // Hijri Day Calculation
                const hijriDay = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric' }).format(date);

                // --- Mock Status Logic ---
                // In a real app, this would come from a `progressMap` prop: progressMap[dayNum]?.status
                let status = 'none';

                if (!isWeekend) {
                    if (dayNum === currentDay) {
                        status = 'current';
                    } else if (dayNum < currentDay) {
                        // Simulation logic for coloring past days
                        if (dayNum % 4 === 0) status = 'incomplete'; // Some red
                        else if (dayNum % 3 === 0) status = 'good'; // Some yellow
                        else status = 'excellent'; // Mostly green
                    }
                }

                // Override for weekend
                if (isWeekend) status = 'none';

                const colorClass = getColors(status, isWeekend);

                return (
                    <button
                        key={dayNum}
                        onClick={() => !isWeekend && onJuzClick(dayNum)}
                        disabled={isWeekend}
                        className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-1 relative group ${colorClass}`}
                    >
                        <span className={`text-[10px] mb-1 ${status === 'current' ? 'text-blue-100' : 'text-gray-400'}`}>{dayName}</span>

                        <div className="flex flex-col items-center -space-y-1">
                            {/* Hijri Date (Main) */}
                            <span className="font-bold font-amiri text-2xl mb-1">
                                {hijriDay}
                            </span>
                            {/* Gregorian Date (Sub) */}
                            <span className={`text-[10px] ${status === 'current' ? 'text-blue-200' : 'opacity-50'}`}>
                                {dayNum} {new Intl.DateTimeFormat('ar', { month: 'long' }).format(date)}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
