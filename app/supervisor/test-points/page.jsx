'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import { useTheme } from '../../components/ThemeProvider';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';

export default function TestPointsPage() {
    const { isDarkMode, mounted } = useTheme();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pointsLog, setPointsLog] = useState([]);
    const [pointsData, setPointsData] = useState({ amount: 10, reason: 'حضور مبكر', category: 'ATTENDANCE' });
    const [isScanning, setIsScanning] = useState(false);
    const html5QrCodeRef = useRef(null);

    useEffect(() => {
        fetchTestData();
    }, []);

    useEffect(() => {
        if (isScanning) {
            startScanner();
        } else {
            stopScanner();
        }
        return () => stopScanner();
    }, [isScanning]);

    const startScanner = async () => {
        try {
            const html5QrCode = new Html5Qrcode("reader");
            html5QrCodeRef.current = html5QrCode;
            
            const config = { 
                fps: 20, 
                qrbox: { width: 300, height: 300 }
            };

            await html5QrCode.start(
                { facingMode: "environment" }, // FORCE BACK CAMERA
                config,
                onScanSuccess
            );
        } catch (err) {
            console.error("Scanner start error:", err);
            toast.error('فشل في تشغيل الكاميرا الخلفية');
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (err) {
                console.error("Scanner stop error:", err);
            }
        }
    };

    const onScanSuccess = (decodedText) => {
        const studentId = parseInt(decodedText);
        if (isNaN(studentId)) return;
        
        const student = students.find(s => s.id === studentId);
        if (!student) {
            toast.error('طالب غير مسجل في هذه الحلقة');
            return;
        }

        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.play().catch(e => {});

        handleAwardPoints(studentId, student.name);
    };

    const fetchTestData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/students');
            if (res.ok) {
                const allStudents = await res.json();
                const testStudents = allStudents.filter(s => s.halaqa?.name === 'حلقة التجربة الصيفية');
                setStudents(testStudents);
            }
            const pRes = await fetch('/api/points');
            if (pRes.ok) setPointsLog(await pRes.json());
        } catch (error) {
            toast.error('خطأ في جلب البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleAwardPoints = async (studentId, studentName = '') => {
        try {
            const res = await fetch('/api/points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    ...pointsData
                })
            });

            if (res.ok) {
                toast.success(`تم رصد ${pointsData.amount} نقطة لـ ${studentName}`);
                fetchTestData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (!mounted || loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;

    const categories = [
        { id: 'ATTENDANCE', name: 'حضور', icon: '⏰' },
        { id: 'QURAN', name: 'قرآن', icon: '📖' },
        { id: 'SPORTS', name: 'رياضة', icon: '⚽' },
        { id: 'CULTURAL', name: 'ثقافي', icon: '💡' },
        { id: 'SOCIAL', name: 'اجتماعي', icon: '🤝' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 rtl font-noto pb-20" dir="rtl">
            <Navbar userType="supervisor" userName="تجربة الباركود" />
            
            <main className="max-w-6xl mx-auto px-4 pt-28 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2">نظام نقاط الباركود 🏷️</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">الآن يدعم الكاميرا الخلفية والشاشة الكاملة</p>
                    </div>
                    <button 
                        onClick={() => setIsScanning(!isScanning)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 ${isScanning ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-emerald-600 text-white shadow-emerald-200'}`}
                    >
                        <span className="text-2xl">{isScanning ? '🛑' : '📷'}</span>
                        {isScanning ? 'إغلاق الكاميرا' : 'فتح الكاميرا الخلفية'}
                    </button>
                </div>

                {/* Configuration Bar */}
                <div className="premium-glass p-6 rounded-[2rem] border-2 border-emerald-500/20 mb-8 flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className="font-black text-slate-500">النقاط:</span>
                        <input 
                            type="number" 
                            className="w-20 px-4 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-black text-center text-emerald-600 outline-none focus:border-emerald-500"
                            value={pointsData.amount}
                            onChange={(e) => setPointsData({...pointsData, amount: parseInt(e.target.value)})}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-black text-slate-500">التصنيف:</span>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => setPointsData({...pointsData, category: c.id})}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${pointsData.category === c.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-emerald-200'}`}
                                >
                                    {c.icon} {c.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Scanner Section */}
                    <div className={`space-y-6 ${isScanning ? 'fixed inset-0 z-[100] bg-black p-0 md:relative md:inset-auto md:bg-transparent' : ''}`}>
                        {isScanning && (
                            <button 
                                onClick={() => setIsScanning(false)}
                                className="absolute top-6 right-6 z-[110] w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center font-black md:hidden"
                            >
                                ✕
                            </button>
                        )}
                        <div className={`premium-glass rounded-[3rem] border-4 border-emerald-500 relative overflow-hidden bg-black ${isScanning ? 'h-full md:h-auto' : 'p-8'}`}>
                            <div id="reader" className={`w-full h-full overflow-hidden ${isScanning ? 'scale-110' : ''}`}></div>
                            {!isScanning && (
                                <div className="text-center py-20 opacity-40">
                                    <div className="text-6xl mb-4">📷</div>
                                    <p className="font-black text-slate-400">اضغط على الزر بالأعلى لبدء الرصد</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Points Log */}
                    {!isScanning && (
                        <div className="space-y-6">
                            <div className="premium-glass p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                                    <span className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-2xl">📜</span> 
                                    سجل الرصد المباشر
                                </h2>
                                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {pointsLog.map((log, i) => (
                                        <div key={i} className="p-5 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
                                                {categories.find(c => c.id === log.category)?.icon || '⭐'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-lg font-black text-slate-800 dark:text-slate-200">{log.student.name}</span>
                                                    <span className="text-emerald-600 font-black">+{log.amount}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold italic">{log.reason} - {new Date(log.createdAt).toLocaleTimeString('ar-SA')}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <style jsx global>{`
                #reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
                #reader {
                    border: none !important;
                }
            `}</style>
        </div>
    );
}
