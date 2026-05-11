'use client';

export default function AttendanceTable({ students, attendance, handleStatusChange, isHoliday }) {
    return (
        <div className={`premium-glass rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden border border-white/20 dark:border-slate-800/50 ${isHoliday ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            <div className="overflow-x-auto custom-scrollbar p-1 md:p-2">
                <table className="w-full text-right border-collapse min-w-[350px] md:min-w-[600px]">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                            <th className="px-4 py-4 md:px-6 md:py-6 font-black text-slate-400 text-xs md:text-sm uppercase tracking-wider whitespace-nowrap w-[40%] md:w-auto">اسم الطالب</th>
                            <th className="px-4 py-4 md:px-6 md:py-6 font-black text-slate-400 text-xs md:text-sm uppercase tracking-wider text-center whitespace-nowrap">حالة الحضور</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 md:px-6 md:py-6">
                                    <div className="font-bold text-slate-700 dark:text-slate-200 text-base md:text-lg">{student.name}</div>
                                    <div className="text-slate-400 text-xs md:text-sm whitespace-nowrap">محفوظات: {student.juzCount} جزء</div>
                                </td>
                                <td className="px-2 py-3 md:px-6 md:py-6">
                                    <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-1.5 md:gap-2">
                                        {[
                                            { id: 'PRESENT', label: 'حاضر', color: 'bg-emerald-500', shadow: 'shadow-emerald-200' },
                                            { id: 'LATE', label: 'متأخر', color: 'bg-amber-400', shadow: 'shadow-amber-200' },
                                            { id: 'ABSENT_EXCUSED', label: 'بعذر', color: 'bg-orange-500', shadow: 'shadow-orange-200' },
                                            { id: 'ABSENT_UNEXCUSED', label: 'غياب', color: 'bg-rose-500', shadow: 'shadow-rose-200' }
                                        ].map((status) => (
                                            <button
                                                key={status.id}
                                                onClick={() => handleStatusChange(student.id, status.id)}
                                                className={`
                                                    px-2 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap flex-1 md:flex-none
                                                    ${attendance[student.id] === status.id
                                                        ? `${status.color} text-white shadow-md md:shadow-lg ${status.shadow}`
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                    }
                                                `}
                                            >
                                                {status.label}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
