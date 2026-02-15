'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SupervisorLayout({ children }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(storedUser);
        if (user.role.toLowerCase() !== 'supervisor') {
            router.push('/login');
            return;
        }

        setAuthorized(true);
    }, [router]);

    if (!authorized) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-300">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-100 dark:border-emerald-900 border-t-emerald-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
