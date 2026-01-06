'use client';

export default function AssignmentsPanel({
    memorizationAssignment,
    reviewAssignment
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. Memorization (الحفظ الجديد) */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                        1
                    </div>
                    <h3 className="font-bold text-gray-800">الحفظ الجديد</h3>
                </div>
                <div className="text-center mb-4">
                    {memorizationAssignment ? (
                        <>
                            <p className="font-amiri text-2xl font-bold text-green-700 mb-1">{memorizationAssignment.surah}</p>
                            <p className="text-sm text-gray-600">من ص {memorizationAssignment.startPage} إلى ص {memorizationAssignment.endPage}</p>
                        </>
                    ) : (
                        <p className="text-gray-500 italic">لا يوجد حفظ جديد اليوم</p>
                    )}
                </div>
            </div>

            {/* 2. Review (المراجعة) */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                        2
                    </div>
                    <h3 className="font-bold text-gray-800">المراجعة المقررة</h3>
                </div>
                <div className="text-center mb-4">
                    {reviewAssignment ? (
                        <>
                            <p className="font-amiri text-2xl font-bold text-orange-700 mb-1">{reviewAssignment.amount}</p>
                            <p className="text-sm text-gray-600">من {reviewAssignment.start} إلى {reviewAssignment.end}</p>
                        </>
                    ) : (
                        <p className="text-gray-500 italic">لا يوجد مراجعة اليوم</p>
                    )}
                </div>
            </div>

        </div>
    );
}
