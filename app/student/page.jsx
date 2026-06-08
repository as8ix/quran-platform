'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { formatHijri } from '../utils/dateUtils';
import { useTheme } from '../components/ThemeProvider';
import { quranData } from '../data/quranData';
import { pageAyahMap } from '../data/pageAyahMap';
import { getExactPosition, getAyahAtPosition } from '../utils/quranUtils';
import ProfileModal from '../components/ProfileModal';
import { QRCodeSVG } from 'qrcode.react';
import ViewKhayrukumCertificateModal from '../components/ViewKhayrukumCertificateModal';
import { KHAYRUKUM_BRANCHES, getPendingEligibleBranches } from '../utils/khayrukumBranches';

export default function StudentDashboard() {
    const router = useRouter();
    const [student, setStudent] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [certificates, setCertificates] = useState([]);
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [currentCertIndex, setCurrentCertIndex] = useState(0);

    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.trim().split(/\s+/)[0];
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(storedUser);
        if (user.role !== 'STUDENT') {
            router.push('/login');
            return;
        }

        fetchData(user.id);

        // Polling for instant points updates
        const interval = setInterval(() => {
            fetch(`/api/points?studentId=${user.id}&aggregate=true&t=${Date.now()}`, { cache: 'no-store' })
                .then(res => res.json())
                .then(pointsData => {
                    const myPoints = pointsData.find(p => p.id === user.id || p.id === parseInt(user.id));
                    setPoints(myPoints ? myPoints.totalPoints : 0);
                })
                .catch(e => console.error(e));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const reinitObserver = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px 100px 0px' });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        return observer;
    };

    // Re-run observer when data changes
    useEffect(() => {
        if (!loading && (student || sessions.length > 0)) {
            const timeoutId = setTimeout(() => {
                const observer = reinitObserver();
                return () => observer.disconnect();
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [loading, student, sessions]);

    const [displaySessions, setDisplaySessions] = useState([]);

    const fetchData = async (id) => {
        try {
            const [studentRes, sessionsRes, holidaysRes, pointsRes, certsRes] = await Promise.all([
                fetch(`/api/students?id=${id}&full=true`),
                fetch(`/api/sessions?studentId=${id}`),
                fetch(`/api/holidays`),
                fetch(`/api/points?studentId=${id}&aggregate=true`),
                fetch(`/api/certificates?studentId=${id}`)
            ]);
            
            if (studentRes.ok) {
                const studentData = await studentRes.json();
                // API returns array with one student or the student object directly
                const myData = Array.isArray(studentData) ? studentData.find(s => s.id === id || s.id === parseInt(id)) : studentData;
                if (myData && !myData.error) setStudent(myData);
            }
            
            if (holidaysRes.ok) {
                setHolidays(await holidaysRes.json());
            }

            if (pointsRes.ok) {
                const pointsData = await pointsRes.json();
                const myPoints = pointsData.find(p => p.id === id || p.id === parseInt(id));
                setPoints(myPoints ? myPoints.totalPoints : 0);
            }
            
            if (certsRes.ok) {
                const certsData = await certsRes.json();
                // Sort by highest branch number first
                const sortedCerts = (certsData || []).sort((a, b) => parseInt(b.branchNumber) - parseInt(a.branchNumber));
                setCertificates(sortedCerts);
                setCurrentCertIndex(0); // Default to the highest branch
            }
            
            if (sessionsRes.ok) {
                const rawSessions = await sessionsRes.json();
                
                // Sort all sessions by date desc for logic
                const sortedAll = [...rawSessions].sort((a, b) => new Date(b.date) - new Date(a.date));
                setSessions(sortedAll); // Used for intelligence
                
                // Filter sessions for DISPLAY LOG: show last 20 sessions instead of just this week
                const filtered = sortedAll.slice(0, 20);

                setDisplaySessions(filtered);
            }
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const juzData = [
        { juz: 1, startPage: 2 }, { juz: 2, startPage: 22 }, { juz: 3, startPage: 42 },
        { juz: 4, startPage: 62 }, { juz: 5, startPage: 82 }, { juz: 6, startPage: 102 },
        { juz: 7, startPage: 122 }, { juz: 8, startPage: 142 }, { juz: 9, startPage: 162 },
        { juz: 10, startPage: 182 }, { juz: 11, startPage: 202 }, { juz: 12, startPage: 222 },
        { juz: 13, startPage: 242 }, { juz: 14, startPage: 262 }, { juz: 15, startPage: 282 },
        { juz: 16, startPage: 302 }, { juz: 17, startPage: 322 }, { juz: 18, startPage: 342 },
        { juz: 19, startPage: 362 }, { juz: 20, startPage: 382 }, { juz: 21, startPage: 402 },
        { juz: 22, startPage: 422 }, { juz: 23, startPage: 442 }, { juz: 24, startPage: 462 },
        { juz: 25, startPage: 482 }, { juz: 26, startPage: 502 }, { juz: 27, startPage: 522 },
        { juz: 28, startPage: 542 }, { juz: 29, startPage: 562 }, { juz: 30, startPage: 582 },
        { juz: 31, startPage: 605 }
    ];

    const getSurahPages = (surahId) => {
        const surah = quranData.find(s => s.id === surahId);
        if (!surah) return [];
        const nextSurah = quranData.find(s => s.id === surahId + 1);
        let endPage = nextSurah ? nextSurah.startPage : 604;
        
        if (pageAyahMap && pageAyahMap[endPage]) {
            if (!pageAyahMap[endPage][surahId]) {
                endPage = endPage - 1;
            }
        }
        const pages = [];
        for (let i = surah.startPage; i <= endPage; i++) pages.push(i);
        return pages;
    };

    const calculateIntelligence = () => {
        if (!student) return null;

        // --- Hifz Logic with Direction Detection ---
        const currentSurahId = student.currentHifzSurahId || 114;
        const surah = quranData.find(s => s.id === currentSurahId) || quranData[113];
        const allowedPages = getSurahPages(currentSurahId);

        // Filter sessions for this specific surah to detect direction
        const hifzHistory = sessions.filter(s => s.hifzSurah === surah.name && s.hifzToPage);
        let hifzDirection = 'ASC'; // Default: 1 -> 604
        if (hifzHistory.length >= 2) {
            // If latest page is GREATER than previous, we are moving ASCENDING (Forward)
            if (hifzHistory[0].hifzToPage > hifzHistory[1].hifzToPage) {
                hifzDirection = 'ASC';
            } else if (hifzHistory[0].hifzToPage < hifzHistory[1].hifzToPage) {
                hifzDirection = 'DESC';
            }
        }

        const lastSessionForSurah = hifzHistory[0];

        let hifzFromPage = surah.startPage;
        let hifzToPage = surah.startPage;
        let hifzFromAyah = 1;
        let hifzToAyah = surah.ayahs;

        if (lastSessionForSurah && lastSessionForSurah.hifzToPage) {
            const lastPage = lastSessionForSurah.hifzToPage;
            const nextPage = (hifzDirection === 'ASC') ? lastPage + 1 : lastPage - 1;

            if (allowedPages.includes(nextPage)) {
                hifzFromPage = nextPage;
                
                // Get Start Ayah for nextPage
                if (pageAyahMap && pageAyahMap[nextPage] && pageAyahMap[nextPage][currentSurahId]) {
                    const pageData = pageAyahMap[nextPage][currentSurahId];
                    hifzFromAyah = (typeof pageData === 'object') ? (hifzDirection === 'ASC' ? pageData.start : pageData.end) : 1;
                }

                // Calculate ToPage based on target
                const target = student.dailyTargetPages || 1;
                let potentialToPage = (hifzDirection === 'ASC') ? hifzFromPage + (Math.ceil(target) - 1) : hifzFromPage - (Math.ceil(target) - 1);
                
                const lastAllowed = allowedPages[allowedPages.length - 1];
                const firstAllowed = allowedPages[0];
                if (hifzDirection === 'ASC' && potentialToPage > lastAllowed) potentialToPage = lastAllowed;
                if (hifzDirection === 'DESC' && potentialToPage < firstAllowed) potentialToPage = firstAllowed;
                
                hifzToPage = potentialToPage;

                // Get End Ayah for hifzToPage
                if (pageAyahMap && pageAyahMap[hifzToPage] && pageAyahMap[hifzToPage][currentSurahId]) {
                    const pageData = pageAyahMap[hifzToPage][currentSurahId];
                    hifzToAyah = (typeof pageData === 'object') ? (hifzDirection === 'ASC' ? pageData.end : pageData.start) : pageData;
                }
            } else {
                // Finished Surah or edge case
                hifzFromPage = hifzDirection === 'DESC' ? allowedPages[allowedPages.length - 1] : allowedPages[0];
                hifzToPage = hifzFromPage;
                if (pageAyahMap && pageAyahMap[hifzFromPage] && pageAyahMap[hifzFromPage][currentSurahId]) {
                    const pageData = pageAyahMap[hifzFromPage][currentSurahId];
                    hifzFromAyah = (typeof pageData === 'object') ? pageData.start : 1;
                    hifzToAyah = (typeof pageData === 'object') ? pageData.end : pageData;
                }
            }
        } else {
            // Fresh start for this surah
            hifzFromPage = surah.startPage;
            const target = student.dailyTargetPages || 1;
            let potentialToPage = hifzFromPage + (Math.ceil(target) - 1);
            const lastAllowed = allowedPages[allowedPages.length - 1];
            if (potentialToPage > lastAllowed) potentialToPage = lastAllowed;
            
            hifzToPage = potentialToPage;

            // Set From/To Ayahs
            if (pageAyahMap && pageAyahMap[hifzFromPage] && pageAyahMap[hifzFromPage][currentSurahId]) {
                const pageData = pageAyahMap[hifzFromPage][currentSurahId];
                hifzFromAyah = (typeof pageData === 'object') ? pageData.start : 1;
            }
            if (pageAyahMap && pageAyahMap[hifzToPage] && pageAyahMap[hifzToPage][currentSurahId]) {
                const pageData = pageAyahMap[hifzToPage][currentSurahId];
                hifzToAyah = (typeof pageData === 'object') ? pageData.end : pageData;
            }
        }

        // --- Review Logic with Direction Detection ---
        const murajaahHistory = sessions.filter(s => s.murajaahToSurah);
        let mDirection = 'ASC'; // Default: Fatiha -> Nas
        if (murajaahHistory.length >= 2) {
            const s0Id = quranData.find(s => s.name === murajaahHistory[0].murajaahToSurah)?.id || 0;
            const s1Id = quranData.find(s => s.name === murajaahHistory[1].murajaahToSurah)?.id || 0;
            // If latest ID is smaller than previous, we are going DESCENDING (Nas -> Fatiha)
            if (s0Id < s1Id && s0Id !== 0 && s1Id !== 0) {
                mDirection = 'DESC';
            } else if (s0Id > s1Id && s0Id !== 0 && s1Id !== 0) {
                mDirection = 'ASC';
            }
        }

        const latestSessionOverall = murajaahHistory[0];
        const lastReviewSurahName = latestSessionOverall?.murajaahToSurah || student.hifzProgress || 'الفاتحة';
        const lastReviewSurah = quranData.find(s => s.name === lastReviewSurahName) || quranData[0];
        const lastReviewFromSurahName = latestSessionOverall?.murajaahFromSurah || lastReviewSurahName;
        const lastReviewFromSurah = quranData.find(s => s.name === lastReviewFromSurahName) || lastReviewSurah;
        
        let rStartSurah, rEndSurah, rStartPage, rEndPage;
        let reviewFromAyah = 1, reviewToAyah = 1;
        let reviewGoal = '';
        
        if (student.reviewPlan?.includes('جزء')) {
            const currentJuzIdx = juzData.findIndex(j => j.startPage > (lastReviewSurah.startPage || 1)) - 1;
            
            let targetIncrement = 1;
            if (student.reviewPlan.includes('نصف')) targetIncrement = 0.5;
            else if (student.reviewPlan.includes('ربع')) targetIncrement = 0.25;
            else if (student.reviewPlan.includes('جزئين')) targetIncrement = 2;
            else if (student.reviewPlan.includes('ثلاث')) targetIncrement = 3;

            const lastPagesCount = latestSessionOverall?.pagesCount || 0;
            const threshold = (targetIncrement * 20) * 0.6;
            let moveNextBlock = lastPagesCount >= threshold;

            let targetJuzIdx = currentJuzIdx;
            const relevantSurah = mDirection === 'DESC' ? lastReviewSurah : lastReviewFromSurah;
            let isSecondHalf = relevantSurah.startPage >= (juzData[currentJuzIdx].startPage + 10);

            if (moveNextBlock) {
                if (targetIncrement === 0.5) {
                    if (mDirection === 'DESC') {
                        if (!isSecondHalf) { targetJuzIdx = currentJuzIdx - 1; isSecondHalf = true; }
                        else { isSecondHalf = false; }
                    } else {
                        if (isSecondHalf) { targetJuzIdx = currentJuzIdx + 1; isSecondHalf = false; }
                        else { isSecondHalf = true; }
                    }
                } else {
                    targetJuzIdx = mDirection === 'DESC' ? currentJuzIdx - 1 : currentJuzIdx + 1;
                }
            }
            
            if (targetJuzIdx < 0) targetJuzIdx = 0;
            if (targetJuzIdx > 29) targetJuzIdx = 29;

            const targetJuz = juzData[targetJuzIdx];
            const nextJuzStartPage = juzData[targetJuzIdx + 1]?.startPage || 605;

            if (targetIncrement === 0.5) {
                const midPage = targetJuz.startPage + 10;
                let startP, endP;
                if (isSecondHalf) { startP = midPage; endP = nextJuzStartPage - 1; }
                else { startP = targetJuz.startPage; endP = midPage - 1; }

                rStartSurah = quranData.find(s => s.startPage >= startP) || quranData[0];
                rEndSurah = quranData.slice().reverse().find(s => s.startPage <= endP) || quranData[113];
                rStartPage = startP; rEndPage = endP;
            } else {
                const endJuzIdx = Math.max(0, Math.min(29, mDirection === 'DESC' ? targetJuzIdx + Math.floor(targetIncrement) - 1 : targetJuzIdx - Math.floor(targetIncrement) + 1));
                const endJuzEndPage = (juzData[endJuzIdx + 1]?.startPage || 605) - 1;
                
                rStartSurah = quranData.find(s => s.startPage >= targetJuz.startPage) || quranData[0];
                rEndSurah = quranData.slice().reverse().find(s => s.startPage <= endJuzEndPage) || quranData[113];
                rStartPage = targetJuz.startPage; rEndPage = endJuzEndPage;
            }
            reviewGoal = `من ${rStartSurah.name} إلى ${rEndSurah.name}`;
            
            if (pageAyahMap && pageAyahMap[rStartPage] && pageAyahMap[rStartPage][rStartSurah.id]) {
                const pageData = pageAyahMap[rStartPage][rStartSurah.id];
                reviewFromAyah = (typeof pageData === 'object') ? pageData.start : 1;
            }
            if (pageAyahMap && pageAyahMap[rEndPage] && pageAyahMap[rEndPage][rEndSurah.id]) {
                const pageData = pageAyahMap[rEndPage][rEndSurah.id];
                reviewToAyah = (typeof pageData === 'object') ? pageData.end : pageData;
            }
        } else {
            const nextReviewStartSurah = quranData.find(s => s.id === (mDirection === 'DESC' ? lastReviewSurah.id - 1 : lastReviewSurah.id + 1)) || lastReviewSurah;
            
            let targetPages = 0;
            const planStr = student.reviewPlan || "";
            const match = planStr.match(/\d+/);
            if (match) {
                targetPages = parseInt(match[0]);
            } else if (planStr.includes('وجه') || planStr.includes('صفحة')) {
                targetPages = 1;
            }

            if (targetPages > 0) {
                const startA = Number(latestSessionOverall?.murajaahToAyah) || 1;
                let startSId = nextReviewStartSurah.id;
                
                // If they have history, start from where they left off
                if (latestSessionOverall && latestSessionOverall.murajaahToSurah) {
                    const lastSurahObj = quranData.find(s => s.name === latestSessionOverall.murajaahToSurah);
                    if (lastSurahObj) {
                        const isFinished = Number(latestSessionOverall.murajaahToAyah) >= Number(lastSurahObj.ayahs);
                        if (isFinished) {
                            startSId = mDirection === 'DESC' ? lastSurahObj.id - 1 : lastSurahObj.id + 1;
                            if (startSId < 1) startSId = 114;
                            if (startSId > 114) startSId = 1;
                        } else {
                            startSId = lastSurahObj.id;
                        }
                    }
                }

                rStartSurah = quranData.find(s => s.id === startSId) || nextReviewStartSurah;
                const startPos = getExactPosition(rStartSurah.id, startSId === nextReviewStartSurah.id ? startA : 1, false);
                
                if (startPos !== null) {
                    rStartPage = Math.floor(startPos);
                    reviewFromAyah = startSId === nextReviewStartSurah.id ? startA : 1;
                    
                    const sign = mDirection === 'DESC' ? -1 : 1;
                    let endPos = startPos + (sign * targetPages);
                    if (endPos < 1) endPos = 1;
                    if (endPos > 604.99) endPos = 604.99;
                    
                    const predicted = getAyahAtPosition(endPos);
                    if (predicted) {
                        rEndSurah = quranData.find(s => s.id === predicted.surahId) || rStartSurah;
                        rEndPage = Math.floor(endPos);
                        reviewToAyah = predicted.ayah;
                    } else {
                        rEndSurah = rStartSurah;
                        rEndPage = rStartPage;
                        reviewToAyah = 1;
                    }
                } else {
                    rStartSurah = nextReviewStartSurah;
                    rEndSurah = nextReviewStartSurah;
                    rStartPage = nextReviewStartSurah.startPage || 1;
                    rEndPage = rStartPage;
                }

                if (rStartSurah.id !== rEndSurah.id) {
                    reviewGoal = `من سورة ${rStartSurah.name} إلى ${rEndSurah.name}`;
                } else {
                    reviewGoal = `من سورة ${rStartSurah.name}`;
                }
            } else {
                rStartSurah = nextReviewStartSurah; rEndSurah = nextReviewStartSurah;
                rStartPage = nextReviewStartSurah.startPage || 1; rEndPage = rStartPage;
                reviewGoal = `من سورة ${nextReviewStartSurah.name}`;
            }
        }

        let reviewFromPage = Math.min(rStartPage, rEndPage);
        let reviewToPage = Math.max(rStartPage, rEndPage);
        let reviewFromSurah = rStartPage < rEndPage ? rStartSurah : rEndSurah;
        let reviewToSurah = rStartPage < rEndPage ? rEndSurah : rStartSurah;
        
        // Use the exactly predicted Ayahs. Adjust if direction is descending to keep 'From' as the smaller value.
        if (mDirection === 'DESC') {
            const tempAyah = reviewFromAyah;
            reviewFromAyah = reviewToAyah;
            reviewToAyah = tempAyah;
        }

        const reviewObj = {
            surah: reviewFromSurah.id !== reviewToSurah.id ? `${reviewFromSurah.name} إلى ${reviewToSurah.name}` : reviewFromSurah.name,
            surahPages: Math.abs(reviewToPage - reviewFromPage) + 1,
            fromPage: reviewFromPage,
            toPage: reviewToPage,
            fromAyah: reviewFromAyah,
            toAyah: reviewToAyah,
            text: reviewGoal
        };

        // --- Lag Status Logic ---
        const lastDate = sessions.length > 0 ? new Date(sessions[0].date) : null;
        const today = new Date();
        const getPlanDaysBetween = (start, end) => {
            if (!start) return 0;
            let count = 0; let cur = new Date(start); cur.setHours(0,0,0,0);
            let targetEnd = new Date(end); targetEnd.setHours(0,0,0,0);
            cur.setDate(cur.getDate() + 1);
            while (cur <= targetEnd) {
                const day = cur.getDay(); 
                if (day >= 0 && day <= 3) {
                    const dateStr = cur.toISOString().split('T')[0];
                    const isH = holidays.some(h => {
                        const hStart = new Date(h.startDate).toISOString().split('T')[0];
                        const hEnd = new Date(h.endDate).toISOString().split('T')[0];
                        return dateStr >= hStart && dateStr <= hEnd && (!h.halaqaId || h.halaqaId === student.halaqaId);
                    });
                    if (!isH) count++;
                }
                cur.setDate(cur.getDate() + 1);
            }
            return count;
        };

        const missedDays = getPlanDaysBetween(lastDate, today);
        let status = 'green'; let label = 'أنت مبدع ومستمر!';
        if (missedDays === 1) { status = 'orange'; label = 'متأخر يوماً واحداً'; }
        else if (missedDays > 1) { status = 'red'; label = `متأخر ${missedDays} أيام!`; }
        
        return {
            hifz: {
                surah: surah.name,
                fromPage: hifzFromPage,
                toPage: hifzToPage,
                fromAyah: hifzFromAyah,
                toAyah: hifzToAyah,
                range: `ص ${hifzFromPage} - ص ${hifzToPage}`,
                surahPages: `${allowedPages[0]} - ${allowedPages[allowedPages.length - 1]}`
            },
            review: reviewObj,
            status,
            label
        };
    };

    const { isDarkMode, mounted } = useTheme();

    if (!mounted) return <LoadingScreen />;

    if (loading && !student) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-noto rtl transition-colors duration-300" dir="rtl">
                {/* Navbar skeleton */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 fixed top-0 w-full z-50 h-20 animate-pulse">
                    <div className="max-w-2xl mx-auto px-4 h-full flex items-center justify-between">
                        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                    </div>
                </div>

                <main className="max-w-2xl mx-auto px-4 pt-32 pb-12 space-y-8 animate-pulse">
                    {/* Hero Header Skeleton */}
                    <div className="h-48 bg-slate-200 dark:bg-slate-900 rounded-[2.5rem] p-8 flex items-center gap-6 border border-slate-100 dark:border-slate-850">
                        <div className="w-20 h-20 bg-slate-350 dark:bg-slate-800 rounded-3xl"></div>
                        <div className="space-y-3 flex-1">
                            <div className="h-8 w-1/3 bg-slate-350 dark:bg-slate-800 rounded-xl"></div>
                            <div className="h-4 w-2/3 bg-slate-350 dark:bg-slate-800 rounded-xl"></div>
                        </div>
                    </div>

                    {/* Next Assignment Card Skeleton */}
                    <div className="bg-[#0f172a] rounded-[3rem] p-8 md:p-10 border border-slate-800 space-y-6">
                        <div className="h-8 w-1/2 bg-slate-800 rounded-xl"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="h-40 bg-slate-900/50 rounded-[2rem] border border-slate-800"></div>
                            <div className="h-40 bg-slate-900/50 rounded-[2rem] border border-slate-800"></div>
                        </div>
                    </div>

                    {/* Progress Cards Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-36 bg-slate-200 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-850"></div>
                        <div className="h-36 bg-slate-200 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-850"></div>
                    </div>

                    {/* Achievement Log Skeleton */}
                    <div className="bg-[#0f172a] rounded-[3rem] p-8 border border-slate-800 h-80"></div>
                </main>
            </div>
        );
    }

    const intel = calculateIntelligence();

    if (!student) {
        const handleLogout = () => {
            localStorage.removeItem('user');
            router.push('/login');
        };
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)]">
                <div className="w-12 h-12 border-4 border-red-500 border-t-red-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-red-500 font-bold">حدث خطأ في تحميل البيانات</p>
                <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
                    تسجيل الخروج
                </button>
            </div>
        );
    }

    const isKhatim = student.juzCount === 30;
    
    const pendingBranches = getPendingEligibleBranches(student.juzCount, student.currentHifzSurahId, certificates);
    const highestPendingBranch = pendingBranches.length > 0 ? pendingBranches[0] : null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-noto rtl transition-colors duration-300" dir="rtl">
            <Navbar userType="student" userName={`أهلًا ${student.name} 👋`} onLogout={() => router.push('/login')} displayId={student.displayId} />

            {showProfileModal && (
                <ProfileModal 
                    student={student} 
                    onClose={() => setShowProfileModal(false)} 
                    onUpdate={(updated) => setStudent(updated)} 
                />
            )}

            <main className="max-w-2xl mx-auto px-4 pt-32 pb-12">
                {/* Under Construction Banner */}
                <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 p-4 rounded-2xl text-center font-bold text-sm border border-amber-200 dark:border-amber-800/50 shadow-sm flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 reveal">
                    <span className="text-2xl">🚧</span>
                    <span>ملاحظة: حساب الطالب لا يزال قيد التطوير والعمل. قد تواجه بعض النواقص في الميزات الحالية.</span>
                </div>

                {false && highestPendingBranch && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 sm:p-5 rounded-2xl md:rounded-3xl shadow-xl shadow-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 reveal border border-emerald-400/50">
                        <div className="flex items-center gap-4 text-center sm:text-right flex-col sm:flex-row">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl shrink-0 animate-bounce-subtle shadow-inner">
                                🌟
                            </div>
                            <div>
                                <h3 className="font-black text-lg md:text-xl">مبارك! أنت مؤهل لاختبار {highestPendingBranch.label}</h3>
                                <p className="text-emerald-50 text-sm md:text-base font-medium mt-1">
                                    لقد أتممت حفظ {highestPendingBranch.parts}، تواصل مع معلمك لترتيب دخولك لاختبار جمعية خيركم!
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/20 px-4 py-2 rounded-xl font-bold text-sm shrink-0 backdrop-blur-sm">
                            إنجاز رائع 👏
                        </div>
                    </div>
                )}

                {/* Hero Header */}
                <div className={`relative overflow-hidden bg-gradient-to-br ${isKhatim ? 'from-amber-500 to-yellow-700' : 'from-emerald-600 to-teal-700'} rounded-[2.5rem] p-8 md:p-12 text-white mb-8 shadow-2xl ${isKhatim ? 'shadow-amber-100' : 'shadow-emerald-100'} reveal group`}>
                    {/* Profile Settings Button */}
                    <button 
                        onClick={() => setShowProfileModal(true)}
                        className="absolute top-6 left-6 z-20 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95 group/btn overflow-hidden"
                        title="إعدادات الحساب"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 group-hover/btn:rotate-45 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-9.75 0h9.75" />
                        </svg>
                    </button>

                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                        <span className="text-9xl">{isKhatim ? '🏆' : '📖'}</span>
                    </div>
                    <div className="relative z-10 text-center md:text-right">
                        <div className="flex flex-col md:flex-row items-center gap-6 mb-4">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-white/20 animate-bounce-subtle">
                                {isKhatim ? '👑' : '🌟'}
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                                    {isKhatim ? 'مبارك الختم يا بطل!' : 'مرحباً يا بطل!'}
                                </h1>
                                <p className="text-lg text-white/80 mt-2 font-medium">
                                    {isKhatim ? 'هنيئاً لك هذا الإنجاز العظيم في حفظ كتاب الله' : 'واصل تقدمك الممتاز في حفظ كتاب الله 🤲'}
                                </p>
                            </div>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold bg-white/10 inline-block px-4 py-2 rounded-xl border border-white/10">{student.name}</h2>
                    </div>
                </div>

                {/* Next Assignment Card (الورد القادم) - Improved Design */}
                <div className="mb-10 reveal reveal-delay-1">
                    <div className="bg-[#0f172a] rounded-[3rem] p-1 shadow-2xl shadow-red-500/10 border border-red-500/20 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[100px] pointer-events-none rounded-full"></div>
                        
                        <div className="p-8 md:p-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                                <h3 className="text-3xl font-black text-white flex items-center gap-4">
                                    <span className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse-slow">
                                        📌
                                    </span>
                                    الورد القادم (للتحضير)
                                </h3>
                                <div className={`px-6 py-2 rounded-2xl text-sm font-black border backdrop-blur-md transition-all ${
                                    intel.status === 'green' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                                    intel.status === 'orange' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 
                                    'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                                }`}>
                                    {intel.label}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Next Hifz - Form Style */}
                                <div className="p-8 bg-slate-900/50 rounded-[2.5rem] border border-emerald-500/20 shadow-inner group/card hover:bg-slate-900 transition-all text-right" dir="rtl">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="text-sm font-black text-emerald-400 flex items-center gap-3">
                                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                            الحفظ القادم (سورة {intel.hifz.surah})
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-500/60 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
                                            صفحات السورة: {intel.hifz.surahPages}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <span className="block text-[10px] font-black text-emerald-400/60 mr-2 uppercase tracking-wide text-right">من الصفحة</span>
                                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center font-black text-xl text-white">
                                                {intel.hifz.fromPage}
                                                <span className="block text-[8px] text-slate-500 mt-1 uppercase">آية {intel.hifz.fromAyah}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="block text-[10px] font-black text-emerald-400/60 mr-2 uppercase tracking-wide text-right">إلى الصفحة</span>
                                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center font-black text-xl text-white">
                                                {intel.hifz.toPage}
                                                <span className="block text-[8px] text-slate-500 mt-1 uppercase">آية {intel.hifz.toAyah}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-6 text-xs text-slate-400 font-bold italic opacity-60 text-center">
                                        "إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ"
                                    </p>
                                </div>
                                
                                {/* Next Review - Form Style */}
                                <div className="p-8 bg-slate-900/50 rounded-[2.5rem] border border-amber-500/20 shadow-inner group/card hover:bg-slate-900 transition-all text-right" dir="rtl">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="text-sm font-black text-amber-500 flex items-center gap-3">
                                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                                            المراجعة القادمة ({intel.review.surah})
                                        </div>
                                        <span className="text-[10px] font-bold text-amber-500/60 bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/10">
                                            مقدار المراجعة: {intel.review.surahPages} صفحة
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <span className="block text-[10px] font-black text-amber-500/60 mr-2 uppercase tracking-wide text-right">من الصفحة</span>
                                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center font-black text-xl text-white">
                                                {intel.review.fromPage}
                                                <span className="block text-[8px] text-slate-500 mt-1 uppercase">آية {intel.review.fromAyah}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="block text-[10px] font-black text-amber-500/60 mr-2 uppercase tracking-wide text-right">إلى الصفحة</span>
                                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center font-black text-xl text-white">
                                                {intel.review.toPage}
                                                <span className="block text-[8px] text-slate-500 mt-1 uppercase">آية {intel.review.toAyah}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-6 text-xs text-slate-400 font-bold italic opacity-60 text-center">
                                        "تثبيت اليوم .. طمأنينة الغد"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Khatim Special Card */}
                {isKhatim && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-[2.5rem] p-8 mb-10 text-center shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5 pointer-events-none select-none overflow-hidden flex flex-wrap gap-4 items-center justify-center text-4xl">
                            {Array(20).fill('🏆')}
                        </div>
                        <div className="relative z-10">
                            <div className="text-6xl mb-4 animate-tada inline-block">🎓</div>
                            <h3 className="text-3xl font-black text-amber-900 dark:text-amber-100 mb-2">لقد أتممت حفظ القرآن كاملاً!</h3>
                            <p className="text-amber-700 dark:text-amber-400 font-bold max-w-2xl mx-auto">
                                "خيركم من تعلم القرآن وعلمه"، نفع الله بك وبعلمك الأمة.
                            </p>
                        </div>
                    </div>
                )}

                {/* Khayrukum Branches Progress */}
                <div className="mb-10 reveal reveal-delay-2">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full"></div>
                        
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div className="flex items-center gap-3">
                                <span className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner border border-slate-200 dark:border-slate-700">📜</span>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">مسار فروع خيركم</h3>
                                    <p className="text-xs text-slate-500 font-bold mt-1">تتبع تقدمك للوصول إلى ختم القرآن الكريم</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="relative pt-4 pb-6 overflow-x-auto pb-scrollbar" dir="ltr">
                            <div className="min-w-[1000px] flex justify-between relative px-6 mx-auto">
                                {/* Track Line */}
                                <div className="absolute top-6 left-6 right-6 h-3 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 rounded-full z-0 shadow-inner"></div>
                                
                                {/* Active Track Line */}
                                <div 
                                    className="absolute top-6 right-6 h-3 bg-gradient-to-l from-emerald-400 to-emerald-600 -translate-y-1/2 rounded-full z-0 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                                    style={{ width: `calc(${(Math.min(student.juzCount, 30) / 30) * 100}% - 48px)` }}
                                ></div>

                                {[...KHAYRUKUM_BRANCHES].reverse().map((branch, index) => {
                                    const isEarned = certificates.some(c => parseInt(c.branchNumber) === branch.number);
                                    const isEligible = student.juzCount >= branch.juzRequired && !isEarned;
                                    const isLocked = student.juzCount < branch.juzRequired;

                                    return (
                                        <div key={branch.number} className="relative z-10 flex flex-col items-center group w-14 cursor-help" title={`نهاية الفرع: سورة ${branch.endSurah}`}>
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg mb-3 transition-all duration-300 ${
                                                isEarned ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/40 border-2 border-emerald-200 dark:border-emerald-800' :
                                                isEligible ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900 shadow-lg shadow-amber-500/40 animate-bounce-subtle border-2 border-white dark:border-slate-900' :
                                                'bg-white dark:bg-slate-900 text-slate-400 border-4 border-slate-100 dark:border-slate-800 group-hover:border-slate-200 dark:group-hover:border-slate-700'
                                            }`}>
                                                {isEarned ? '✓' : branch.number}
                                            </div>
                                            
                                            {/* Tooltip on hover */}
                                            <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-3 rounded-lg whitespace-nowrap pointer-events-none z-20">
                                                سورة {branch.endSurah}
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                            </div>

                                            <div className="text-[11px] font-black text-center text-slate-700 dark:text-slate-300 mt-1 w-20 leading-tight">
                                                {branch.label}
                                            </div>
                                            <div className="text-[9px] font-bold text-center text-slate-400 mt-1 w-20 leading-tight">
                                                {branch.parts}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Student Card & Points Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 reveal reveal-delay-2">
                    {/* Digital ID Card */}
                    <div className="premium-glass p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl transition-all duration-500 group-hover:bg-emerald-500/20"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl transition-all duration-500 group-hover:bg-blue-500/20"></div>
                        
                        <div className="relative z-10 w-full max-w-[280px] bg-white dark:bg-slate-950 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transform transition-transform duration-500 hover:scale-105 hover:-rotate-1">
                            {/* Card Header */}
                            <div className="bg-slate-900 p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 bg-white/10 rounded-lg p-1">
                                        <img src="/logo.svg" className="max-w-full max-h-full object-contain" alt="logo" />
                                    </div>
                                    <div className="h-5 flex items-center">
                                        <img src="/logo-text-dark.png" className="h-full object-contain" alt="logo-text" />
                                    </div>
                                </div>
                                <div className="text-emerald-400 font-black text-[10px] uppercase tracking-tighter">
                                    بطاقة الطالب
                                </div>
                            </div>
                            
                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col items-center justify-center text-center relative">
                                {student.halaqa?.logo ? (
                                    <div className="w-16 h-16 flex items-center justify-center mb-2">
                                        <img 
                                            src={student.halaqa.logo} 
                                            decoding="async"
                                            className="max-w-full max-h-full object-contain rounded-xl" 
                                            alt="halaqa-logo" 
                                        />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 mb-2 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
                                        <span className="text-2xl">👤</span>
                                    </div>
                                )}
                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-0.5">{student.name}</h3>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4">الحلقة: {student.halaqa?.name || 'غير محدد'}</p>

                                <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-100 mb-3 group-hover:shadow-emerald-500/20 transition-shadow">
                                    <QRCodeSVG value={student.id.toString()} size={110} level="H" includeMargin={true} />
                                </div>

                                <div className="flex items-center justify-between w-full mt-2 px-2">
                                    <div className="text-[10px] font-black text-slate-400">#STU-{student.id}</div>
                                    <div className="text-left flex flex-col items-end">
                                        <div className="text-[10px] font-black text-slate-400">QURAN {new Date().getFullYear()}</div>
                                        {student.family?.name && (
                                            <div className="text-[8px] font-black text-emerald-500 mt-0.5 leading-none">
                                                أسرة {student.family.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Points Card */}
                    <div className="premium-glass p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 flex flex-col justify-center items-center text-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 group hover:border-indigo-500 transition-colors">
                        <div className="w-24 h-24 bg-white dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-5xl mb-6 shadow-xl shadow-indigo-200/50 dark:shadow-none border border-indigo-100 dark:border-indigo-800 transform group-hover:scale-110 transition-transform duration-500">
                            🌟
                        </div>
                        <h3 className="text-slate-500 dark:text-slate-400 font-bold mb-2 uppercase tracking-widest text-sm">مجموع النقاط</h3>
                        <div className="text-6xl font-black text-indigo-600 dark:text-indigo-400 drop-shadow-sm mb-2">
                            {points}
                        </div>
                        <p className="text-indigo-600/60 dark:text-indigo-400/60 text-sm font-bold bg-indigo-100 dark:bg-indigo-900/40 px-4 py-1.5 rounded-full">نقطة في رصيدك</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {/* Hifz Progress Card */}
                    <div className="premium-glass p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 relative overflow-hidden reveal reveal-delay-2 flex items-center gap-6 group hover:border-emerald-500 transition-colors">
                        {/* Circular Progress SVG */}
                        <div className="relative w-32 h-32 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                {/* Background Circle */}
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="52"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    className="text-slate-100 dark:text-slate-700"
                                />
                                {/* Progress Circle */}
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="52"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    strokeDasharray={2 * Math.PI * 52}
                                    strokeDashoffset={2 * Math.PI * 52 - ((student.juzCount / 30) * 2 * Math.PI * 52)}
                                    strokeLinecap="round"
                                    className={`${isKhatim ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000 ease-out`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-2xl font-black ${isKhatim ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {Math.round((student.juzCount / 30) * 100)}%
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">إلى الختم</span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">الحفظ الحالي</h3>
                                    <div className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                                        {isKhatim ? (
                                            <span className="text-amber-600">كامل القرآن</span>
                                        ) : (
                                            <>سورة <span className="text-emerald-600 dark:text-emerald-500">{student.hifzProgress || 'الفاتحة'}</span></>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-black ${isKhatim ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'} border border-emerald-200/50 dark:border-emerald-800`}>
                                    {student.juzCount} / 30 جزء
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Review Plan Card */}
                    <div className="premium-glass p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 border-b-8 border-b-amber-500 dark:border-b-amber-600 reveal reveal-delay-3 flex flex-col justify-center group hover:border-r-8 hover:border-r-amber-500 transition-all">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">خطة المراجعة الكلية</h3>
                                <div className="text-3xl font-black text-amber-600 dark:text-amber-500">
                                    {student.reviewPlan || 'لم تحدد'}
                                </div>
                            </div>
                            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 rounded-3xl flex items-center justify-center text-3xl shadow-inner border border-amber-100 dark:border-amber-800 transform group-hover:rotate-12 transition-transform">
                                🔄
                            </div>
                        </div>
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold mt-4 italic">المراجعة حياة الحفظ 🤍</p>
                    </div>
                </div>

                {/* Khayrukum Certificates Section */}
                {certificates && certificates.length > 0 && (
                    <div className="mb-10 reveal reveal-delay-3 max-w-2xl mx-auto">
                        <div className="flex items-center gap-4 mb-6">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                <span className="text-3xl">📜</span>
                                شهادات خيركم
                            </h3>
                            <div className="flex-1 h-0.5 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800"></div>
                        </div>
                        
                        <div className="relative">
                            {/* Navigation Buttons */}
                            {certificates.length > 1 && (
                                <>
                                    <button 
                                        onClick={() => setCurrentCertIndex(prev => prev === 0 ? certificates.length - 1 : prev - 1)}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-6 z-10 w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 text-sky-600 hover:scale-110 transition-transform focus:outline-none"
                                    >
                                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                                    </button>
                                    <button 
                                        onClick={() => setCurrentCertIndex(prev => prev === certificates.length - 1 ? 0 : prev + 1)}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-6 z-10 w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 text-sky-600 hover:scale-110 transition-transform focus:outline-none"
                                    >
                                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                                    </button>
                                </>
                            )}

                            {/* Certificate Content */}
                            <div className="overflow-hidden rounded-[2.5rem] px-2 py-2">
                                <div className="transition-all duration-300 transform">
                                    {(() => {
                                        const cert = certificates[currentCertIndex];
                                        const isPdf = cert.fileUrl.endsWith('.pdf');
                                        return (
                                            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-sky-100 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
                                                {/* Header */}
                                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0 text-right" dir="rtl">
                                                    <div>
                                                        <h4 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                                            <span className="text-3xl">📜</span>
                                                            {cert.title ? cert.title : `شهادة اجتياز الفرع ${cert.branchNumber}`}
                                                        </h4>
                                                        <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold text-sm">
                                                            بتقدير {cert.grade}% - بتاريخ {new Date(cert.examDate).toLocaleDateString('ar-SA')}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => window.open(cert.fileUrl, '_blank')}
                                                        className="hidden md:flex py-3 px-5 bg-sky-600 text-white rounded-2xl font-black text-sm hover:bg-sky-700 shadow-xl shadow-sky-200/50 dark:shadow-none hover:-translate-y-1 transition-all active:scale-95 items-center justify-center gap-2"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                                        طباعة / حفظ
                                                    </button>
                                                </div>

                                                {/* Body (File Viewer) */}
                                                <div className="p-4 md:p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 flex-1 flex items-center justify-center min-h-[500px]">
                                                    {isPdf ? (
                                                        <iframe 
                                                            src={`${cert.fileUrl}#view=FitH`} 
                                                            className="w-full h-[500px] md:h-[600px] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner" 
                                                            title={`شهادة ${cert.branchNumber}`}
                                                        />
                                                    ) : (
                                                        <img 
                                                            src={cert.fileUrl} 
                                                            alt={`شهادة الفرع ${cert.branchNumber}`}
                                                            className="max-w-full max-h-[600px] rounded-2xl shadow-lg border-4 border-white dark:border-slate-800 object-contain"
                                                        />
                                                    )}
                                                </div>
                                                
                                                {/* Mobile Print Button */}
                                                <div className="md:hidden p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                                                    <button 
                                                        onClick={() => window.open(cert.fileUrl, '_blank')}
                                                        className="w-full py-3 bg-sky-600 text-white rounded-xl font-black text-sm hover:bg-sky-700 shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                                        طباعة / حفظ الشهادة
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Indicators */}
                            {certificates.length > 1 && (
                                <div className="flex justify-center gap-2 mt-4">
                                    {certificates.map((_, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setCurrentCertIndex(idx)}
                                            className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentCertIndex ? 'bg-sky-500 w-6' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}


                    {/* Achievement Log - Detailed View like Teacher's Recording Form */}
                    <div className="bg-[#0f172a] rounded-[3rem] p-6 md:p-10 shadow-2xl border border-slate-800/60 mb-20 max-w-2xl mx-auto reveal reveal-delay-3 relative overflow-hidden text-right" dir="rtl">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[80px] rounded-full"></div>
                        
                        <h3 className="text-xl sm:text-2xl font-black text-white mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 text-right">
                            <span className="flex items-center gap-4">
                                <span className="p-3 bg-slate-800 rounded-2xl text-xl shadow-lg border border-slate-700">📜</span>
                                سجل الإنجاز
                            </span>
                            <span className="text-xs font-bold text-slate-500 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                                {displaySessions.length} جلسة مؤخراً
                            </span>
                        </h3>

                        <div className="space-y-12 max-h-[1000px] overflow-y-auto pl-2 custom-scrollbar rtl-scroll relative z-10">
                            {displaySessions.length > 0 ? displaySessions.map((session, idx) => {
                                const currentDateFormatted = formatHijri(new Date(session.date), 'long');
                                const prevDateFormatted = idx > 0 ? formatHijri(new Date(displaySessions[idx - 1].date), 'long') : null;
                                const showDateSeparator = currentDateFormatted !== prevDateFormatted;

                                return (
                                    <div key={session.id || idx} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                        {showDateSeparator && (
                                            <div className="flex items-center gap-4 py-4 mt-8 first:mt-0">
                                                <div className="h-px bg-slate-800 flex-1"></div>
                                                <div className="text-[10px] sm:text-xs font-black text-slate-400 bg-slate-900 px-4 sm:px-6 py-2 rounded-2xl border border-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                                    📅 {currentDateFormatted}
                                                </div>
                                                <div className="h-px bg-slate-800 flex-1"></div>
                                            </div>
                                        )}
                                        
                                        <div className="bg-slate-900/40 rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 border border-white/5 backdrop-blur-sm relative group hover:border-indigo-500/30 transition-all duration-500 shadow-xl overflow-hidden text-right">
                                            {/* Header Section */}
                                            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-4 mb-8 pb-6 border-b border-white/5 text-center sm:text-right">
                                                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right w-full sm:w-auto">
                                                    <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex flex-col items-center justify-center border border-indigo-500/20 shadow-inner">
                                                        <span className="text-xl font-black">{session.pagesCount || 0}</span>
                                                        <span className="text-[8px] font-bold uppercase tracking-widest">صفحة</span>
                                                    </div>
                                                    <div className="text-center sm:text-right">
                                                        <div className="text-[9px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">توقيت الجلسة</div>
                                                        <div className="text-white font-black text-sm">
                                                            {new Date(session.date).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                                {session.isGoalAchieved && (
                                                    <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-2xl text-[10px] font-black border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center gap-2">
                                                        <span>🎯</span> حقق الهدف
                                                    </div>
                                                )}
                                            </div>

                                            {/* Hifz Details (Detailed Layout like Image 2) */}
                                            {session.hifzSurah && (
                                                <div className="mb-10 animate-in fade-in slide-in-from-right-2 duration-700 text-right">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h4 className="text-lg font-black text-emerald-400 flex items-center gap-3 text-right">
                                                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                                            الحفظ الجديد (سورة {session.hifzSurah})
                                                        </h4>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                                        <div className="space-y-2 text-right">
                                                            <span className="block text-[10px] font-black text-slate-500 mr-2 uppercase tracking-wide text-right">من الصفحة</span>
                                                            <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 text-center relative">
                                                                <div className="text-2xl font-black text-white">{session.hifzFromPage}</div>
                                                                <div className="text-[10px] font-bold text-emerald-500 uppercase mt-1">آية {session.hifzFromAyah || 1}</div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 text-right">
                                                            <span className="block text-[10px] font-black text-slate-500 mr-2 uppercase tracking-wide text-right">إلى الصفحة</span>
                                                            <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 text-center relative">
                                                                <div className="text-2xl font-black text-white">{session.hifzToPage}</div>
                                                                <div className="text-[10px] font-bold text-emerald-500 uppercase mt-1">آية {session.hifzToAyah || '؟'}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Quality Stats Grid for Hifz */}
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <div className="text-[9px] font-black text-red-500 mb-2 uppercase">أخطاء</div>
                                                            <div className="text-xl font-black text-white">{session.hifzErrors || 0}</div>
                                                        </div>
                                                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <div className="text-[9px] font-black text-amber-500 mb-2 uppercase">تنبيهات</div>
                                                            <div className="text-xl font-black text-white">{session.hifzAlerts || 0}</div>
                                                        </div>
                                                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <div className="text-[9px] font-black text-emerald-500 mb-2 uppercase">نقية</div>
                                                            <div className="text-xl font-black text-white">{session.hifzCleanPages || 0}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Murajaah Details */}
                                            {session.murajaahToSurah && (
                                                <div className="mb-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-right-2 duration-700 text-right">
                                                    <h4 className="text-lg font-black text-indigo-400 flex items-center gap-3 mb-6 text-right">
                                                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                                                        المراجعة الكبرى
                                                    </h4>
                                                    <div className="bg-slate-950/80 p-4 sm:p-6 rounded-3xl border border-slate-800 mb-4">
                                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                                            <div className="text-center flex-1 w-full">
                                                                <div className="text-[10px] text-slate-500 font-bold mb-1">من سورة</div>
                                                                <div className="text-base sm:text-lg font-black text-white">{session.murajaahFromSurah}</div>
                                                                <div className="text-[9px] text-indigo-400 font-bold uppercase mt-1">آية {session.murajaahFromAyah || 1}</div>
                                                            </div>
                                                            <div className="px-4 text-slate-700 rotate-90 sm:rotate-0">←</div>
                                                            <div className="text-center flex-1 w-full">
                                                                <div className="text-[10px] text-slate-500 font-bold mb-1">إلى سورة</div>
                                                                <div className="text-base sm:text-lg font-black text-white">{session.murajaahToSurah}</div>
                                                                <div className="text-[9px] text-indigo-400 font-bold uppercase mt-1">آية {session.murajaahToAyah || '؟'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Quality Stats Grid for Murajaah */}
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <div className="text-[9px] font-black text-red-500 mb-2 uppercase">أخطاء</div>
                                                            <div className="text-xl font-black text-white">{session.errorsCount || 0}</div>
                                                        </div>
                                                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <div className="text-[9px] font-black text-amber-500 mb-2 uppercase">تنبيهات</div>
                                                            <div className="text-xl font-black text-white">{session.alertsCount || 0}</div>
                                                        </div>
                                                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                                                            <div className="text-[9px] font-black text-indigo-500 mb-2 uppercase">نقية</div>
                                                            <div className="text-xl font-black text-white">{session.cleanPagesCount || 0}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {session.notes && (
                                                <div className="mt-8 pt-6 border-t border-white/5 text-xs text-slate-400 italic font-medium text-right">
                                                    <div className="text-[10px] font-black text-slate-600 mb-2 tracking-widest uppercase text-right">ملاحظات المعلم:</div>
                                                    " {session.notes} "
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-32 bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-800">
                                    <div className="text-6xl mb-6 opacity-20">📅</div>
                                    <h4 className="text-xl font-black text-slate-700">لا يوجد سجلات حالياً</h4>
                                    <p className="text-slate-500 mt-2 font-medium">ستظهر تقارير يوميتك هنا بمجرد تسجيلها</p>
                                </div>
                            )}
                        </div>
                    </div>
            </main>
        </div>
    );
}
