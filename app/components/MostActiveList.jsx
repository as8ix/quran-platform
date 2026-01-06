'use client';

export default function MostActiveList({ students }) {
    return (
        <div className="space-y-4">
            {students.map((student, index) => (
                <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-800">{student.name}</span>
                        <span className="font-bold text-green-600">{student.count} تسميع</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000"
                            style={{ width: `${student.percentage}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
