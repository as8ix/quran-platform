'use client';

export default function Leaderboard({ students }) {
    return (
        <div className="space-y-3">
            {students.map((student) => (
                <div
                    key={student.rank}
                    className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-300"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${student.color} flex items-center justify-center shadow-lg text-2xl font-bold ${student.rank <= 3 ? '' : 'text-white'}`}>
                            {student.rank <= 3 ? student.medal : student.rank}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-800 text-lg">{student.name}</p>
                            <p className="text-sm text-gray-600">{student.stats}</p>
                        </div>
                        <div className="text-3xl">{student.medal}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
