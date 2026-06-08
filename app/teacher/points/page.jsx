'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import { useTheme } from '../../components/ThemeProvider';
import LoadingScreen from '../../components/LoadingScreen';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

export default function TeacherPointsPage() {
    const { isDarkMode, mounted } = useTheme();
    const router = useRouter();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pointsLog, setPointsLog] = useState([]);
    const [pointsData, setPointsData] = useState({ amount: 10, reason: 'حضور مبكر', category: 'ATTENDANCE' });
    const [isScanning, setIsScanning] = useState(false);
    const [mode, setMode] = useState('add'); // 'add' or 'deduct'
    const [user, setUser] = useState(null);
    const html5QrCodeRef = useRef(null);
    const isProcessingRef = useRef(false);
    const successAudioRef = useRef(null);

    // Preload audio for faster feedback
    useEffect(() => {
        successAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        successAudioRef.current.load();
    }, []);

    const [isPointsEnabled, setIsPointsEnabled] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            router.push('/login');
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchTestData(true);
            checkPointsStatus();
            
            // Polling for instant updates from other assistants
            const interval = setInterval(() => {
                if (isScanning || isProcessingRef.current) return;
                fetch(`/api/points?teacherId=${user.id}&t=${Date.now()}`, { cache: 'no-store' })
                    .then(res => res.json())
                    .then(logs => setPointsLog(logs))
                    .catch(e => console.error(e));
            }, 3000); // Update every 3 seconds
            
            return () => clearInterval(interval);
        }
    }, [user, isScanning]);

    const checkPointsStatus = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/halaqas?t=${Date.now()}`);
            if (res.ok) {
                const allHalaqas = await res.json();
                const myHalaqas = allHalaqas.filter(h => 
                    h.teacherId === user.id || 
                    (h.assistants && h.assistants.some(a => a.id === user.id))
                );
                // If any of the teacher's halaqas have points enabled, allow recording
                const enabled = myHalaqas.some(h => h.pointsEnabled);
                setIsPointsEnabled(enabled);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        let timeoutId;
        if (isScanning) {
            isProcessingRef.current = false;
            // Delay to allow the DOM to render the container with proper dimensions
            timeoutId = setTimeout(() => {
                startScanner();
            }, 300);
        } else {
            stopScanner();
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            stopScanner();
        };
    }, [isScanning]);

    const startScanner = async () => {
        try {
            const config = { 
                fps: 10, 
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1.0
            };

            const tryCamera = async (cameraConfig, attemptName) => {
                const container = document.getElementById("reader-container");
                if (!container) throw new Error(`Reader container not found on attempt: ${attemptName}`);
                
                // Safe cleanup of previous instance's active stream if any
                if (html5QrCodeRef.current) {
                    try {
                        if (html5QrCodeRef.current.isScanning) {
                            await html5QrCodeRef.current.stop();
                        }
                    } catch (e) {}
                    try { html5QrCodeRef.current.clear(); } catch (e) {}
                }
                
                // Completely replace the reader element to ensure a pristine DOM state for each attempt
                container.innerHTML = '<div id="reader" style="width: 100%; height: 100%;"></div>';

                const html5QrCode = new Html5Qrcode("reader");
                html5QrCodeRef.current = html5QrCode;
                await html5QrCode.start(cameraConfig, config, onScanSuccess);
            };

            let envError, userError;
            try {
                // Try back camera first
                await tryCamera({ facingMode: "environment" }, "environment");
            } catch (err) {
                envError = err;
                console.warn("Environment camera failed, trying user camera...", err);
                try {
                    // Try front camera
                    await tryCamera({ facingMode: "user" }, "user");
                } catch (err2) {
                    userError = err2;
                    console.warn("User camera failed, trying fallback to device list...", err2);
                    try {
                        // Try getting raw device IDs directly from browser (no flash)
                        const devices = await navigator.mediaDevices.enumerateDevices();
                        const videoDevices = devices.filter(d => d.kind === 'videoinput');
                        if (videoDevices.length > 0) {
                            // Avoid virtual cameras
                            const realCamera = videoDevices.find(c => !c.label.toLowerCase().includes('virtual') && !c.label.toLowerCase().includes('obs')) || videoDevices[0];
                            await tryCamera(realCamera.deviceId, "deviceId_fallback");
                        } else {
                            throw new Error("No cameras found in browser devices");
                        }
                    } catch (err3) {
                        throw new Error(`[Env: ${envError?.message || envError?.name}] [User: ${userError?.message || userError?.name}] [Fallback: ${err3?.message || err3?.name}]`);
                    }
                }
            }

        } catch (err) {
            if (!document.getElementById("reader-container")) return; // Silently ignore if component unmounted
            console.error("Scanner start error:", err);
            toast.error(`فشل الكاميرا: ${err?.message || err?.name || String(err)}`);
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

    const lastScannedRef = useRef({ id: null, time: 0 });

    const onScanSuccess = (decodedText) => {
        if (isProcessingRef.current) return;

        const studentId = parseInt(decodedText);
        if (isNaN(studentId)) return;

        isProcessingRef.current = true;
        
        const now = Date.now();
        if (lastScannedRef.current.id === studentId && (now - lastScannedRef.current.time) < 3000) {
            isProcessingRef.current = false;
            return;
        }

        lastScannedRef.current = { id: studentId, time: now };
        
        const student = students.find(s => s.id === studentId);
        if (!student) {
            toast.error('طالب غير مسجل في حلقتك');
            isProcessingRef.current = false;
            return;
        }

        setIsScanning(false);
        
        // Play sound immediately from preloaded ref
        if (successAudioRef.current) {
            successAudioRef.current.currentTime = 0;
            successAudioRef.current.play().catch(e => {});
        }

        handleAwardPoints(studentId, student.name);
    };

    const fetchTestData = async (isInitial = false) => {
        if (!user) return;
        if (isInitial) setLoading(true);
        try {
            const res = await fetch(`/api/students?teacherId=${user.id}&t=${Date.now()}`);
            if (res.ok) {
                setStudents(await res.json());
            }
            const pRes = await fetch(`/api/points?teacherId=${user.id}&t=${Date.now()}`, { cache: 'no-store' });
            if (pRes.ok) {
                const logs = await pRes.json();
                // Server now filters by teacherId, so we can use logs directly
                setPointsLog(logs);
            }
        } catch (error) {
            toast.error('خطأ في جلب البيانات');
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    const handleAwardPoints = async (studentId, studentName = '') => {
        const finalAmount = mode === 'deduct' ? -Math.abs(pointsData.amount) : Math.abs(pointsData.amount);
        
        // --- Optimistic UI Update ---
        // Add to log immediately so user sees it fast
        const tempLogEntry = {
            student: { name: studentName },
            amount: finalAmount,
            category: pointsData.category,
            reason: pointsData.reason,
            createdAt: new Date().toISOString(),
            isOptimistic: true // marker to know it's not confirmed yet
        };
        setPointsLog(prev => [tempLogEntry, ...prev]);

        try {
            const res = await fetch('/api/points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    ...pointsData,
                    amount: finalAmount
                })
            });

            if (res.ok) {
                if (mode === 'deduct') {
                    toast.error(`تم خصم ${Math.abs(finalAmount)} نقطة من ${studentName}`, { icon: '📉' });
                } else {
                    toast.success(`تم رصد ${pointsData.amount} نقطة لـ ${studentName}`);
                }
                // Silently refresh data in background to confirm
                fetchTestData(false);
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'فشل في رصد النقاط');
                // Remove the optimistic entry if failed
                setPointsLog(prev => prev.filter(log => log !== tempLogEntry));
            }
        } catch (error) {
            console.error(error);
            setPointsLog(prev => prev.filter(log => log !== tempLogEntry));
        } finally {
            isProcessingRef.current = false;
        }
    };

    if (!mounted || loading) return <LoadingScreen />;

    const categories = [
        { id: 'ATTENDANCE', name: 'حضور', icon: '⏰' },
        { id: 'QURAN', name: 'قرآن', icon: '📖' },
        { id: 'SPORTS', name: 'رياضة', icon: '⚽' },
        { id: 'CULTURAL', name: 'ثقافي', icon: '💡' },
        { id: 'SOCIAL', name: 'اجتماعي', icon: '🤝' },
        { id: 'BEHAVIOR', name: 'سلوك', icon: '⚖️' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 rtl font-noto pb-20" dir="rtl">
            <Navbar userType="teacher" userName={user?.name} />
            
            <main className="max-w-6xl mx-auto px-4 pt-28 pb-12">
                <BackButton 
                    href="/teacher" 
                    text="العودة للوحة التحكم" 
                    className="mb-8" 
                />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2">رصد نقاط طلابي 🏷️</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">قم بمسح الباركود الخاص بالطالب لرصد النقاط</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {(() => {
                            const hId = students.length > 0 ? students[0].halaqaId : user?.halaqaId;
                            return (
                                <>
                                    <button 
                                        onClick={() => window.location.href = `/teacher/points/leaderboard${hId ? `?halaqaId=${hId}` : ''}`}
                                        className="flex items-center gap-3 px-6 py-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg shadow-amber-200 transition-all active:scale-95"
                                    >
                                        <span>🏆</span>
                                        لوحة الصدارة
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (hId) {
                                                window.location.href = `/teacher/points/print?halaqaId=${hId}`;
                                            } else {
                                                toast.error('لم يتم العثور على حلقة لطباعة بطاقاتها');
                                            }
                                        }}
                                        className="flex items-center gap-3 px-6 py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 border border-slate-700"
                                    >
                                        <span>🖨️</span>
                                        طباعة البطاقات
                                    </button>
                                </>
                            );
                        })()}
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

                {!isPointsEnabled && (
                    <div className="mb-8 p-6 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-500/30 rounded-3xl flex items-center gap-6 animate-pulse">
                        <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center text-3xl shrink-0">🚫</div>
                        <div>
                            <h3 className="text-xl font-black text-rose-700 dark:text-rose-400">نشاط النقاط متوقف</h3>
                            <p className="text-rose-600 dark:text-rose-500/70 font-bold">عذراً، قام المشرف بإيقاف صلاحية رصد النقاط لحلقتك حالياً. يرجى مراجعة الإدارة.</p>
                        </div>
                    </div>
                )}

                <div className={`premium-glass p-6 rounded-[2rem] border-2 mb-8 flex flex-wrap items-center gap-6 transition-all duration-500 ${mode === 'deduct' ? 'border-rose-500/50 bg-rose-50/10' : 'border-emerald-500/20'}`}>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <button 
                            onClick={() => setMode('add')}
                            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${mode === 'add' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}
                        >
                            ➕ إضافة
                        </button>
                        <button 
                            onClick={() => setMode('deduct')}
                            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${mode === 'deduct' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400'}`}
                        >
                            ➖ خصم
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="font-black text-slate-500">النقاط:</span>
                        <input 
                            type="number" 
                            className={`w-20 px-4 py-2 bg-white dark:bg-slate-900 border-2 rounded-xl font-black text-center outline-none focus:ring-2 transition-all ${mode === 'deduct' ? 'text-rose-600 border-rose-100 dark:border-rose-900/30 focus:border-rose-500 ring-rose-500/20' : 'text-emerald-600 border-slate-100 dark:border-slate-800 focus:border-emerald-500 ring-emerald-500/20'}`}
                            value={pointsData.amount}
                            onChange={(e) => setPointsData({...pointsData, amount: Math.abs(parseInt(e.target.value) || 0)})}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-black text-slate-500">التصنيف:</span>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => setPointsData({...pointsData, category: c.id})}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${pointsData.category === c.id ? (mode === 'deduct' ? 'bg-rose-600 text-white border-rose-600' : 'bg-emerald-600 text-white border-emerald-600 shadow-md') : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-emerald-200'}`}
                                >
                                    {c.icon} {c.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className={`space-y-6 ${isScanning ? 'fixed inset-0 z-[100] bg-black p-0 md:relative md:inset-auto md:bg-transparent' : ''}`}>
                        {isScanning && (
                            <button 
                                onClick={() => setIsScanning(false)}
                                className="absolute top-6 right-6 z-[110] w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center font-black md:hidden"
                            >
                                ✕
                            </button>
                        )}
                        <div className={`premium-glass rounded-[3rem] border-4 ${mode === 'deduct' ? 'border-rose-500' : 'border-emerald-500'} relative overflow-hidden bg-black ${isScanning ? 'min-h-[400px]' : 'p-8'}`}>
                            <div id="reader-container" className="w-full min-h-[300px]"></div>
                            {!isScanning && (
                                <div className="text-center py-20 opacity-40">
                                    <div className="text-6xl mb-4">📷</div>
                                    <p className="font-black text-slate-400">اضغط على الزر بالأعلى لبدء رصد نقاط طلابك</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {!isScanning && (
                        <div className="space-y-6">
                            <div className="premium-glass p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                                    <span className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-2xl">📜</span> 
                                    آخر عمليات الرصد لطلابك
                                </h2>
                                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {pointsLog.length > 0 ? pointsLog.map((log, i) => (
                                        <div key={i} className="p-5 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
                                                {categories.find(c => c.id === log.category)?.icon || '⭐'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-lg font-black text-slate-800 dark:text-slate-200">{log.student.name}</span>
                                                    <span className={log.amount < 0 ? "text-rose-600 font-black" : "text-emerald-600 font-black"}>
                                                        {log.amount > 0 ? '+' : ''}{log.amount}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold italic">{log.reason} - {new Date(log.createdAt).toLocaleTimeString('ar-SA')}</div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10 text-slate-400 font-bold">لا يوجد عمليات رصد مسجلة مؤخراً</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <style jsx global>{`
                #reader {
                    width: 100% !important;
                    border: none !important;
                }
                #reader video {
                    display: block !important;
                    width: 100% !important;
                    height: auto !important;
                    min-height: 300px !important;
                    object-fit: cover !important;
                    position: relative !important;
                    z-index: 10 !important;
                }
                #reader canvas {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}
