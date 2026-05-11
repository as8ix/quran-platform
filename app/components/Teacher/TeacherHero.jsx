'use client';

import SendNotification from '@/app/components/SendNotification';

export default function TeacherHero({ 
    user, 
    students, 
    teacherHalaqas, 
    pointsEnabled, 
    onAddStudent, 
    onShowReports, 
    getFirstName,
    router
}) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                    مرحباً بك، <span className="text-emerald-600 dark:text-emerald-500">يا {user ? getFirstName(user.name) : 'أستاذ'}!</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                    لديك {students.filter(s => !s.isInActiveEvent).length} طالب في حلقتك
                    {students.some(s => s.isInActiveEvent) && (
                        <span className="text-amber-600 dark:text-amber-500 font-black"> + {students.filter(s => s.isInActiveEvent).length} مشارك (اليوم القرآني)</span>
                    )}
                </p>
            </div>
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => router.push('/teacher/attendance')}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-100 dark:border-emerald-800 rounded-2xl font-bold text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 hover:text-emerald-700 transition-all shadow-sm active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    تحضير الطلاب
                </button>
                <button
                    onClick={onShowReports}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-100 dark:border-indigo-800 rounded-2xl font-bold text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 hover:text-indigo-700 transition-all shadow-sm active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    التقارير
                </button>
                {pointsEnabled && (
                    <button
                        onClick={() => router.push('/teacher/points')}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-100 dark:border-amber-800 rounded-2xl font-bold text-amber-600 dark:text-amber-500 hover:border-amber-400 hover:text-amber-700 transition-all shadow-sm active:scale-95"
                    >
                        <span>🪙</span>
                        رصد النقاط
                    </button>
                )}
                <button
                    onClick={onAddStudent}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    إضافة طالب
                </button>
                {user && (
                    <SendNotification
                        senderRole="TEACHER"
                        senderId={user.id}
                        students={students}
                    />
                )}
            </div>
        </div>
    );
}
