'use client';

import { useRouter } from 'next/navigation';

export default function BackButton({ 
    href, 
    text = "رجوع", 
    className = "" 
}) {
    const router = useRouter();

    const handleBack = () => {
        if (href) {
            router.push(href);
        } else {
            router.back();
        }
    };

    return (
        <button
            onClick={handleBack}
            className={`group flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold transition-all duration-300 ${className}`}
        >
            <div className="p-2.5 bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm">
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2.5} 
                    stroke="currentColor" 
                    className="w-5 h-5 rtl:rotate-0"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" 
                    />
                </svg>
            </div>
            <span className="text-sm md:text-base tracking-tight">{text}</span>
        </button>
    );
}
