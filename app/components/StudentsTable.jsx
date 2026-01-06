'use client';

export default function StudentsTable({ students, onEdit, onView }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <th className="px-6 py-4 text-right font-bold text-gray-700">الاسم</th>
                        <th className="px-6 py-4 text-right font-bold text-gray-700">المحفوظ</th>
                        <th className="px-6 py-4 text-right font-bold text-gray-700">المراجعة</th>
                        <th className="px-6 py-4 text-right font-bold text-gray-700">نسبة الإنجاز</th>
                        <th className="px-6 py-4 text-right font-bold text-gray-700">آخر نشاط</th>
                        <th className="px-6 py-4 text-right font-bold text-gray-700">الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student) => (
                        <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                                <span className="font-semibold text-gray-800">{student.name}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{student.memorized}</td>
                            <td className="px-6 py-4 text-gray-600">{student.review}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                                            style={{ width: `${student.progress}%` }}
                                        ></div>
                                    </div>
                                    <span className="font-bold text-green-600 min-w-[3rem] text-right">{student.progress}%</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-gray-500 text-sm">{student.lastActivity}</td>
                            <td className="px-6 py-4">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onView && onView(student)}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all"
                                    >
                                        عرض
                                    </button>
                                    <button
                                        onClick={() => onEdit && onEdit(student)}
                                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all"
                                    >
                                        تعديل
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
