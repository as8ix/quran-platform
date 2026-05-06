'use client';

export default function Skeleton({ className = '', variant = 'rect' }) {
  const baseClasses = "bg-slate-200 dark:bg-slate-800/50 relative overflow-hidden";
  const variants = {
    rect: "rounded-xl",
    circle: "rounded-full",
    text: "rounded-md h-4 w-full",
    card: "rounded-[2rem] premium-glass border border-slate-100 dark:border-slate-800/50"
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent animate-shimmer-fast" />
      
      <style jsx>{`
        @keyframes shimmer-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer-fast {
          animation: shimmer-fast 1.5s infinite;
        }
      `}</style>
    </div>
  );
}

export function SkeletonCard({ className = "" }) {
    return (
        <div className={`premium-glass rounded-[2.5rem] p-7 border border-white/20 dark:border-slate-800/50 relative overflow-hidden ${className}`}>
            <div className="flex justify-between mb-6">
                <Skeleton variant="rect" className="w-16 h-16 rounded-3xl" />
                <div className="space-y-2 flex flex-col items-end">
                    <Skeleton variant="rect" className="w-20 h-6 rounded-xl" />
                    <Skeleton variant="rect" className="w-16 h-5 rounded-xl opacity-50" />
                </div>
            </div>
            <Skeleton variant="rect" className="h-8 w-3/4 mb-4 rounded-xl" />
            <Skeleton variant="rect" className="h-4 w-1/2 mb-8 rounded-lg opacity-60" />
            
            <div className="space-y-3 p-5 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-white/20 dark:border-slate-800">
                <div className="flex justify-between">
                    <Skeleton variant="rect" className="w-12 h-3 rounded" />
                    <Skeleton variant="rect" className="w-16 h-3 rounded" />
                </div>
                <Skeleton variant="rect" className="w-full h-2.5 rounded-full" />
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center opacity-40">
                <Skeleton variant="rect" className="w-24 h-4 rounded" />
                <Skeleton variant="circle" className="w-8 h-8" />
            </div>
        </div>
    );
}

export function SkeletonStat() {
    return (
        <div className="premium-glass rounded-3xl p-8 text-center shadow-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden">
            <Skeleton variant="rect" className="h-12 w-24 mb-4 mx-auto rounded-xl" />
            <Skeleton variant="rect" className="h-6 w-16 mx-auto rounded-lg opacity-60" />
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent animate-shimmer-fast" />
        </div>
    );
}
