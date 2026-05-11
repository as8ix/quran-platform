'use client';

import { toast } from 'react-hot-toast';

export default function PointsHeader({ 
    isPointsEnabled, 
    isScanning, 
    setIsScanning, 
    students, 
    user,
    onLeaderboard,
    onPrint
}) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2">رصد نقاط طلابي 🏷️</h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">قم بمسح الباركود الخاص بالطالب لرصد النقاط</p>
            </div>
            <div className="flex flex-wrap gap-3">
                <button 
                    onClick={onLeaderboard}
                    className="flex items-center gap-3 px-6 py-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg shadow-amber-200 transition-all active:scale-95"
                >
                    <span>🏆</span>
                    لوحة الصدارة
                </button>
                <button 
                    onClick={onPrint}
                    className="flex items-center gap-3 px-6 py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 border border-slate-700"
                >
                    <span>🖨️</span>
                    طباعة البطاقات
                </button>
                <button 
                    onClick={() => isPointsEnabled && setIsScanning(!isScanning)}
                    disabled={!isPointsEnabled}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 ${!isPointsEnabled ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : (isScanning ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-emerald-600 text-white shadow-emerald-200')}`}
                >
                    <span className="text-2xl">{!isPointsEnabled ? '🔒' : (isScanning ? '🛑' : '📷')}</span>
                    {!isPointsEnabled ? 'النشاط متوقف حالياً' : (isScanning ? 'إغلاق الكاميرا' : 'فتح الكاميرا للرصد')}
                </button>
            </div>
        </div>
    );
}
