'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { useTheme } from '@/app/components/ThemeProvider';
import LoadingScreen from '@/app/components/LoadingScreen';
import BackButton from '@/app/components/BackButton';
import { toPng } from 'html-to-image';
import { toast } from 'react-hot-toast';

// Components
import LeaderboardHeader from '@/app/components/Points/LeaderboardHeader';
import TopThreePodium from '@/app/components/Points/TopThreePodium';
import LeaderboardList from '@/app/components/Points/LeaderboardList';
import LeaderboardBackground from '@/app/components/Points/LeaderboardBackground';

export default function LeaderboardPage() {
    const router = useRouter();
    const { mounted } = useTheme();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const topThreeRef = useRef(null);

    const [user, setUser] = useState(null);
    const [halaqaName, setHalaqaName] = useState('الترتيب العام');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            router.push('/login');
        }

        const params = new URLSearchParams(window.location.search);
        const hId = params.get('halaqaId');
        fetchLeaderboard(true, hId);
        
        if (hId) {
            fetchHalaqaName(hId);
        }
    }, []);

    const fetchHalaqaName = async (id) => {
        try {
            const res = await fetch(`/api/halaqas?id=${id}`);
            if (res.ok) {
                const halaqas = await res.json();
                if (halaqas.length > 0) setHalaqaName(halaqas[0].name);
            }
        } catch (e) { console.error(e); }
    };

    const fetchLeaderboard = useCallback(async (isInitial = false, hId) => {
        if (isInitial) setLoading(true);
        try {
            const params = new URLSearchParams();
            if (hId) params.append('halaqaId', hId);
            params.append('aggregate', 'true');
            
            const res = await fetch(`/api/points?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hId = params.get('halaqaId');
        
        const interval = setInterval(() => fetchLeaderboard(false, hId), 30000);
        return () => clearInterval(interval);
    }, [fetchLeaderboard]);

    const handleShare = async () => {
        if (!topThreeRef.current) return;
        
        setIsSharing(true);
        toast.loading('جاري تجهيز بطاقة التميز...', { id: 'share' });
        
        try {
            // Give time for UI state change to apply (isSharing effect)
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const dataUrl = await toPng(topThreeRef.current, {
                cacheBust: true,
                backgroundColor: '#0f172a',
                style: { padding: '60px', borderRadius: '0px' }
            });
            const link = document.createElement('a');
            link.download = `ابطال-الصيف-${new Date().toLocaleDateString('ar-EG')}.png`;
            link.href = dataUrl;
            link.click();
            toast.success('تم تحميل بطاقة التميز بنجاح! 🎉', { id: 'share' });
        } catch (err) {
            toast.error('حدث خطأ أثناء تحميل الصورة', { id: 'share' });
        } finally {
            setIsSharing(false);
        }
    };

    if (!mounted || loading) return <LoadingScreen />;

    const topThree = leaderboard.slice(0, 3);
    const theRest = leaderboard.slice(3);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 rtl font-noto pb-20 relative overflow-hidden" dir="rtl">
            <Navbar userType={user?.role === 'SUPERVISOR' ? 'supervisor' : 'teacher'} userName="لوحة الصدارة" />
            
            <LeaderboardBackground />
            
            <main className="max-w-6xl mx-auto px-4 pt-32 pb-12 relative z-10">
                <BackButton 
                    href="/teacher/points" 
                    text="العودة لنظام النقاط" 
                    className="mb-8" 
                />
                
                <LeaderboardHeader />

                <TopThreePodium 
                    ref={topThreeRef}
                    topThree={topThree}
                    isSharing={isSharing}
                    onShare={handleShare}
                    halaqaName={halaqaName}
                />

                <LeaderboardList theRest={theRest} />
            </main>
        </div>
    );
}
