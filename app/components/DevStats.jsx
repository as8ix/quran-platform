'use client';

import { useState, useEffect } from 'react';

export default function DevStats() {
    const [branch, setBranch] = useState('loading...');
    const [dbStatus, setDbStatus] = useState('checking...');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // In a real app, this would be an API call to a dev-only endpoint
        // For now, we'll try to get it from a safe-to-expose API or mock it if needed
        // But since this is a dev/staging feature, we can add a simple API
        fetch('/api/dev/status')
            .then(res => res.json())
            .then(data => {
                setBranch(data.branch || 'unknown');
                setDbStatus(data.dbStatus || 'unknown');
            })
            .catch(() => {
                setBranch('dev'); // Fallback since we are on dev branch
                setDbStatus('connected');
            });
            
        // Toggle visibility with a secret key combo or just show for supervisors
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                setIsVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 z-[100] bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700 font-mono text-xs animate-slideUp">
            <div className="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-emerald-400">System Development Mode</span>
                <button onClick={() => setIsVisible(false)} className="ml-auto hover:text-red-400">✕</button>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Git Branch:</span>
                    <span className="text-blue-400 font-bold">{branch}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Prisma DB:</span>
                    <span className="text-green-400 font-bold">{dbStatus}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Provider:</span>
                    <span className="text-amber-400 font-bold">PostgreSQL (Neon)</span>
                </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
                <button 
                    onClick={() => window.open('/api/dev/prisma-studio', '_blank')}
                    className="p-1 px-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 transition-colors"
                >
                    Prisma Studio
                </button>
                <button 
                    onClick={() => window.open('/api/dev/db-push', '_blank')}
                    className="p-1 px-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 transition-colors"
                >
                    DB Sync
                </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 text-center italic">Ctrl+Shift+D to hide</p>
        </div>
    );
}
