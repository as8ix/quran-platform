'use client';

import StudentCard from '@/app/components/Teacher/StudentCard';

export default function StudentSections({ filteredStudents, router, loading }) {
    // Standard Skeleton Component
    const SkeletonCard = () => (
        <div className="premium-glass rounded-[2.5rem] p-7 animate-pulse border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between mb-6">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
                <div className="flex flex-col gap-2">
                    <div className="w-16 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                    <div className="w-12 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                </div>
            </div>
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/2 mb-8"></div>
            <div className="space-y-3 mb-8 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div>
            </div>
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
        </div>
    );

    // If loading, show Skeletons regardless of data
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        );
    }

    if (filteredStudents.length === 0) {
        return (
            <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="text-7xl mb-6 grayscale opacity-20">📭</div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">لا يوجد طلاب متطابقين حالياً</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">جرب تغيير الفلتر أو البحث عن اسم آخر</p>
            </div>
        );
    }

    const eventStudents = filteredStudents.filter(s => s.isInActiveEvent);
    const regularStudents = filteredStudents.filter(s => !s.isInActiveEvent);

    return (
        <div className="space-y-6 sm:space-y-12">
            {/* Quranic Active Students Section */}
            {eventStudents.length > 0 && (
                <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black text-amber-600 dark:text-amber-500 whitespace-nowrap">🌟 مشاركو اليوم القرآني</h2>
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-amber-200 to-transparent dark:from-amber-900/50"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {eventStudents.map((student) => (
                            <StudentCard key={student.id} student={student} router={router} />
                        ))}
                    </div>
                </div>
            )}

            {/* Separator if both exist */}
            {eventStudents.length > 0 && regularStudents.length > 0 && (
                <div className="py-8 flex items-center gap-6">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
                    <span className="text-slate-400 dark:text-slate-600 font-black text-[10px] uppercase tracking-[0.3em] bg-slate-50 dark:bg-slate-900/50 px-4 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                        بقية الطلاب
                    </span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
                </div>
            )}

            {/* Regular Halaqa Students Section */}
            {regularStudents.length > 0 && (
                <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black text-slate-400 dark:text-slate-500 whitespace-nowrap">👥 طلاب الحلقة</h2>
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800/50"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {regularStudents.map((student) => (
                            <StudentCard key={student.id} student={student} router={router} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
