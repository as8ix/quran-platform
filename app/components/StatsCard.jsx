'use client';

export default function StatsCard({ label, value, icon, color, trend }) {
    return (
        <div className={`stat-card bg-gradient-to-br ${color}`}>
            <div className="flex items-center gap-4">
                <div className="text-5xl">{icon}</div>
                <div className="flex-1">
                    <h3 className="text-sm opacity-90 mb-1">{label}</h3>
                    <p className="text-3xl font-bold mb-1">{value}</p>
                    {trend && <p className="text-xs opacity-85">{trend}</p>}
                </div>
            </div>
        </div>
    );
}
