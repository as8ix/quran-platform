'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import { useTheme } from '../../components/ThemeProvider';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';

export default function TestPointsPage() {
    const { isDarkMode, mounted } = useTheme();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pointsLog, setPointsLog] = useState([]);
    const [pointsData, setPointsData] = useState({ amount: 10, reason: 'حضور مبكر', category: 'ATTENDANCE' });
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        fetchTestData();
    }, []);

    useEffect(() => {
        if (isScanning) {
            const scanner = new Html5QrcodeScanner("reader", { 
                fps: 20, 
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                showZoomSliderIfSupported: true
            });
            
            scanner.render(onScanSuccess, (err) => {
                // Ignore "NotFoundException" to prevent console clutter
            });
            scannerRef.current = scanner;
        } else {
            if (scannerRef.current) {
                scannerRef.current.clear();
                scannerRef.current = null;
            }
        }
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear();
            }
        };
    }, [isScanning]);

    const onScanSuccess = (decodedText) => {
        // decodedText will be the student ID
        const studentId = parseInt(decodedText);
        if (isNaN(studentId)) {
            toast.error('كود غير صالح');
            return;
        }
        
        const student = students.find(s => s.id === studentId);
        if (!student) {
            toast.error('طالب غير مسجل في هذه الحلقة');
            return;
        }

        // Play success sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed'));

        handleAwardPoints(studentId, student.name);
    };

    const onScanError = (err) => {
        // console.warn(err);
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
                toast.success(`تم رصد ${pointsData.amount} نقطة لـ ${studentName || 'الطالب'}`);
                fetchTestData();
            } else {
                toast.error('فشل في رصد النقاط');
            }
        } catch (error) {
            toast.error('خطأ في الاتصال');
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
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-lg italic">جرب رصد النقاط عبر مسح الـ QR Code</p>
                    </div>
                    <button 
                        onClick={() => setIsScanning(!isScanning)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 ${isScanning ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-emerald-600 text-white shadow-emerald-200'}`}
                    >
                        <span className="text-2xl">{isScanning ? '🛑' : '📷'}</span>
                        {isScanning ? 'إيقاف الماسح' : 'فتح الكاميرا للرصد'}
                    </button>
                </div>

                {/* Configuration Bar */}
                <div className="premium-glass p-6 rounded-[2rem] border-2 border-emerald-500/20 mb-8 flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className="font-black text-slate-500">النقاط المراد رصدها:</span>
                        <input 
                            type="number" 
                            className="w-24 px-4 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-black text-center text-emerald-600 outline-none focus:border-emerald-500"
                            value={pointsData.amount}
                            onChange={(e) => setPointsData({...pointsData, amount: parseInt(e.target.value)})}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-black text-slate-500">التصنيف:</span>
                        <div className="flex gap-2">
                            {categories.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => setPointsData({...pointsData, category: c.id})}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${pointsData.category === c.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-emerald-200'}`}
                                >
                                    {c.icon} {c.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-1 min-w-[250px]">
                        <span className="font-black text-slate-500 shrink-0">السبب:</span>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-bold outline-none focus:border-emerald-500"
                            placeholder="مثلاً: تفوق في مسابقة..."
                            value={pointsData.reason}
                            onChange={(e) => setPointsData({...pointsData, reason: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Scanner Section */}
                    {isScanning ? (
                        <div className="space-y-6">
                            <div className="premium-glass p-8 rounded-[3rem] border-4 border-emerald-500 relative overflow-hidden bg-black/5">
                                <div className="absolute inset-0 border-[20px] border-white/10 pointer-events-none"></div>
                                <div id="reader" className="w-full overflow-hidden rounded-2xl shadow-2xl"></div>
                                <div className="mt-6 text-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black animate-pulse">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        جاري البحث عن كود...
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {students.map(student => {
                                const studentPoints = pointsLog.filter(p => p.studentId === student.id).reduce((sum, p) => sum + p.amount, 0);
                                return (
                                    <div key={student.id} className="premium-glass p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500 transition-all flex flex-col items-center text-center group">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">🎓</div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">{student.name}</h3>
                                        <div className="px-4 py-1 bg-emerald-500 text-white rounded-full text-sm font-black mb-6">
                                            {studentPoints} نقطة
                                        </div>
                                        
                                        {/* QR Code for Testing */}
                                        <div className="p-4 bg-white rounded-3xl shadow-inner border-4 border-slate-50 mb-6">
                                            <QRCodeSVG value={student.id.toString()} size={120} level="H" includeMargin={true} />
                                        </div>
                                        
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">كود الطالب: {student.id}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Points Log */}
                    <div className="space-y-6">
                        <div className="premium-glass p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                                <span className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-2xl">📜</span> 
                                سجل الرصد المباشر
                            </h2>
                            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                {pointsLog.map((log, i) => (
                                    <div key={i} className="p-5 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-5 animate-slide-in-right" style={{ animationDelay: `${i * 0.05}s` }}>
                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-sm">
                                            {categories.find(c => c.id === log.category)?.icon || '⭐'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-lg font-black text-slate-800 dark:text-slate-200">{log.student.name}</span>
                                                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-black">+{log.amount}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-400 italic">بسبب: {log.reason}</span>
                                                <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                                    {new Date(log.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {pointsLog.length === 0 && (
                                    <div className="text-center py-20">
                                        <div className="text-5xl mb-4 opacity-20">🔍</div>
                                        <p className="text-slate-400 font-bold">لا توجد عمليات رصد حالياً</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                #reader__scan_region video {
                    object-fit: cover !important;
                    border-radius: 1.5rem !important;
                }
                #reader__dashboard_section_csr button {
                    background: #10b981 !important;
                    color: white !important;
                    border: none !important;
                    padding: 8px 16px !important;
                    border-radius: 12px !important;
                    font-weight: bold !important;
                    margin: 5px !important;
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.5s ease-out forwards;
                }
                @keyframes slideInRight {
                    from { transform: translateX(30px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
