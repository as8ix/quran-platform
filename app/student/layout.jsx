'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentLayout({ children }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(storedUser);
        if (user.role.toLowerCase() !== 'student') {
            router.push('/login');
            return;
        }

        setAuthorized(true);
    }, [router]);

    if (!authorized) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-3 text-center font-bold text-sm border-b border-amber-200 dark:border-amber-800/50 shadow-sm flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>ملاحظة: حساب الطالب لا يزال قيد التطوير. قد تواجه بعض النواقص في الميزات الحالية.</span>
            </div>
            <div className="flex-grow">
                {children}
            </div>
        </div>
    );
}
