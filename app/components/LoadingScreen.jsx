'use client';

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050b15]">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]"></div>

            <div className="relative flex flex-col items-center gap-8">
                {/* Single Elegant Spinner */}
                <div className="relative w-16 h-16">
                    {/* Inner Track */}
                    <div className="absolute inset-0 rounded-full border-4 border-slate-800/50"></div>
                    {/* Outer Spinner */}
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
                    {/* Pulse Effect */}
                    <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping opacity-20"></div>
                </div>
            </div>
        </div>
    );
}
