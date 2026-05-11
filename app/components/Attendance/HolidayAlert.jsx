'use client';

export default function HolidayAlert({ isHoliday, holidayName }) {
    if (!isHoliday) return null;

    return (
        <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-[2rem] flex items-center gap-4 animate-pulse">
            <span className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-amber-600 dark:text-amber-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
            </span>
            <div>
                <h3 className="text-xl font-black text-amber-800 dark:text-amber-400">إجازة رسمية: {holidayName}</h3>
                <p className="text-amber-600 dark:text-amber-500 font-bold">تم إيقاف التحضير لهذا اليوم لوجود إجازة مجدولة.</p>
            </div>
        </div>
    );
}
