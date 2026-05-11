'use client';

export default function AttendanceFooter({ saveAttendance, saving, isHoliday }) {
    return (
        <div className="mt-8 flex justify-end">
            <button
                onClick={saveAttendance}
                disabled={saving || isHoliday}
                className="px-8 py-3 md:px-12 md:py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm md:text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
            >
                {saving ? 'جاري الحفظ...' : (isHoliday ? 'التحضير مغلق' : 'حفظ الكشف النهائي')}
            </button>
        </div>
    );
}
