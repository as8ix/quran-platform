'use client';

export default function LeaderboardBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-40">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[150px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[150px] animate-pulse-slow"></div>
            <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-purple-500 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '-2s' }}></div>
        </div>
    );
}
