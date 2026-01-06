'use client';

export default function RecentActivity({ activities }) {
    return (
        <div className="space-y-4">
            {activities.map((activity, index) => (
                <div
                    key={index}
                    className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-300 transform hover:-translate-x-1"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-2xl ${activity.color}`}>
                            {activity.icon}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-800">{activity.title}</p>
                            <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
