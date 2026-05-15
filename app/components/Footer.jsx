'use client';

import { useState, useEffect } from 'react';

export default function Footer() {
    const [year, setYear] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setYear(new Date().getFullYear().toString());
        setMounted(true);
    }, []);

    return (
        <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <div className="flex flex-col items-center gap-6">
                    {/* Logo and Brand */}
                    <div className="flex items-center justify-center gap-3">
                        <img src="/mosque-logo.png" alt="شعار الجامع" className="w-12 h-12 object-contain inline-block dark:hidden" />
                        <img src="/mosque-logo-white.png" alt="شعار الجامع" className="w-12 h-12 object-contain hidden dark:inline-block" />
                        <div className="text-right">
                            <h2 className="font-amiri text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                                منصة تحفيظ القرآن الكريم
                            </h2>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                                جامع الحديقة بحي السلامة
                            </p>
                        </div>
                    </div>

                    {/* Assistance Link */}
                    <div className="flex items-center justify-center gap-2 text-sm bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400">هل تحتاج إلى مساعدة؟</span>
                        <a
                            href="https://wa.me/966509762389"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 font-bold transition-colors"
                        >
                            <span>تواصل معنا عبر واتساب</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .57 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.03 12.03 0 0 0 2.81.57A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                        </a>
                    </div>

                    {/* Copyright */}
                    <div className="pt-8 border-t border-slate-200 dark:border-slate-800 w-full max-w-2xl">
                        <p className="text-slate-500 dark:text-slate-400 mb-2">
                            نحو حفظ متقن وإنجاز مستمر
                        </p>
                        <div className="text-xs text-slate-400 dark:text-slate-600 font-medium">
                            © {year} جميع الحقوق محفوظة
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
