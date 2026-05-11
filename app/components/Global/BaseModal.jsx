'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function BaseModal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl', titleColor = 'text-slate-800 dark:text-white', hideHeader = false, noPadding = false }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;
    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden backdrop-blur-[12px] md:backdrop-blur-[20px]">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 dark:border-slate-800/50 overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[90vh]`} dir="rtl">
                {/* Header */}
                {!hideHeader && (
                    <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30 shrink-0">
                        <h2 className={`text-xl sm:text-2xl font-black leading-tight ${titleColor}`}>
                            {title}
                        </h2>
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className={`${noPadding ? '' : 'p-6 sm:p-8 overflow-y-auto premium-scrollbar'} flex-1 bg-white dark:bg-slate-900`}>
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
