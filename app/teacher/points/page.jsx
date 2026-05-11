'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Navbar from '@/app/components/Navbar';
import BackButton from '@/app/components/BackButton';
import { useTheme } from '@/app/components/ThemeProvider';
import LoadingScreen from '@/app/components/LoadingScreen';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

// Components
import PointsHeader from '@/app/components/Points/PointsHeader';
import PointsSettings from '@/app/components/Points/PointsSettings';
import PointsScanner from '@/app/components/Points/PointsScanner';
import PointsHistoryList from '@/app/components/Points/PointsHistoryList';
import PointsStatusBanner from '@/app/components/Points/PointsStatusBanner';

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
        }
    }, [user]);

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
        if (isScanning) {
            isProcessingRef.current = false;
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
                fps: 10, 
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1.0
            };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                onScanSuccess
            );
        } catch (err) {
            console.error("Scanner start error:", err);
            toast.error('فشل في تشغيل الكاميرا');
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
            const pRes = await fetch(`/api/points?teacherId=${user.id}`);
            if (pRes.ok) {
                const logs = await pRes.json();
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
        
        const tempLogEntry = {
            student: { name: studentName },
            amount: finalAmount,
            category: pointsData.category,
            reason: pointsData.reason,
            createdAt: new Date().toISOString(),
            isOptimistic: true 
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
                fetchTestData(false);
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'فشل في رصد النقاط');
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

    const hId = students.length > 0 ? students[0].halaqaId : user?.halaqaId;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 rtl font-noto pb-20" dir="rtl">
            <Navbar userType="teacher" userName={user?.name} />
            
            <main className="max-w-6xl mx-auto px-4 pt-28 pb-12">
                <BackButton 
                    href="/teacher" 
                    text="العودة للوحة التحكم" 
                    className="mb-8" 
                />

                <PointsHeader 
                    isPointsEnabled={isPointsEnabled}
                    isScanning={isScanning}
                    setIsScanning={setIsScanning}
                    students={students}
                    user={user}
                    onLeaderboard={() => router.push(`/teacher/points/leaderboard${hId ? `?halaqaId=${hId}` : ''}`)}
                    onPrint={() => {
                        if (hId) {
                            router.push(`/teacher/points/print?halaqaId=${hId}`);
                        } else {
                            toast.error('لم يتم العثور على حلقة لطباعة بطاقاتها');
                        }
                    }}
                />

                <PointsStatusBanner isPointsEnabled={isPointsEnabled} />

                <PointsSettings 
                    mode={mode}
                    setMode={setMode}
                    amount={pointsData.amount}
                    setAmount={(val) => setPointsData({...pointsData, amount: val})}
                    category={pointsData.category}
                    setCategory={(val) => setPointsData({...pointsData, category: val})}
                    categories={categories}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <PointsScanner 
                        isScanning={isScanning}
                        setIsScanning={setIsScanning}
                        mode={mode}
                    />

                    {!isScanning && (
                        <PointsHistoryList 
                            pointsLog={pointsLog}
                            categories={categories}
                        />
                    )}
                </div>
            </main>

            <style jsx global>{`
                #reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
                #reader { border: none !important; }
            `}</style>
        </div>
    );
}
