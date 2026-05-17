'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../../../components/Navbar';
import LoadingScreen from '../../../components/LoadingScreen';
import { quranData } from '../../../data/quranData';
import { pageAyahMap } from '../../../data/pageAyahMap';
import { formatHijri } from '../../../utils/dateUtils';

import AddStudentModal from '../../../components/AddStudentModal';
import BackButton from '../../../components/BackButton';
const normalizeSurahName = (name) => {
    if (!name) return '';
    return name.replace('سورة ', '').trim();
};

const parseTarget = (t) => {
    if (!t) return 1;
    if (typeof t === 'number') return t;
    const s = String(t).toLowerCase();
    if (s.includes('نصف') || s.includes('0.5')) return 0.5;
    if (s.includes('ربع') || s.includes('0.25')) return 0.25;
    if (s.includes('صفحة')) {
        const num = parseFloat(s);
        return isNaN(num) ? 1 : num;
    }
    const p = parseFloat(s);
    return isNaN(p) ? 1 : p;
};

// Quran Logic Helpers
const getSurahPages = (surahId) => {
    const surah = quranData.find(s => s.id === surahId);
    if (!surah) return [];
    const nextSurah = quranData.find(s => s.id === surahId + 1);

    // Base end page is either next surah start or 604
    let endPage = nextSurah ? nextSurah.startPage : 604;

    // Check if the current surah actually exists on the 'endPage'
    // If not, it means the current surah ended on the previous page
    if (pageAyahMap && pageAyahMap[endPage]) {
        // Does this page contain ayahs for the CURRENT surah?
        if (!pageAyahMap[endPage][surahId]) {
            // If not, reduce endPage by 1
            endPage = endPage - 1;
        }
    }

    const pages = [];
    for (let i = surah.startPage; i <= endPage; i++) pages.push(i);
    return pages;
};

// Helper: Get exact page position based on pageAyahMap data
const getExactPosition = (surahId, ayahNum, isEnd = false) => {
    if (!surahId || isNaN(surahId) || ayahNum === '' || ayahNum === undefined) return null;
    let p = 1;
    const surahObj = quranData.find(s => s.id === surahId);
    if (surahObj) {
        p = surahObj.startPage;

        // Find exact page containing this ayah
        const maxPage = Math.min(604, surahObj.startPage + 50);
        for (let i = surahObj.startPage; i <= maxPage; i++) {
            if (!pageAyahMap || !pageAyahMap[i]) continue;
            const sData = pageAyahMap[i][String(surahId)];
            if (sData) {
                const start = Number((typeof sData === 'object') ? sData.start : sData);
                const end = Number((typeof sData === 'object') ? sData.end : sData);

                if (Number(ayahNum) >= start && Number(ayahNum) <= end) {
                    p = i;
                    break;
                }
            }
        }
    }

    // Calculate position within the page
    if (!pageAyahMap || !pageAyahMap[p]) return p;

    let totalAyahsOnPage = 0;
    let ayahsBefore = 0;

    const mapKeys = Object.keys(pageAyahMap[p]).map(Number).sort((a, b) => a - b);

    for (const sId of mapKeys) {
        const sData = pageAyahMap[p][String(sId)];
        const sStart = Number((typeof sData === 'object') ? sData.start : 1);
        const sEnd = Number((typeof sData === 'object') ? sData.end : sData);
        const sWeight = (typeof sData === 'object' && sData.weight) ? sData.weight : (sEnd - sStart + 1);
        
        totalAyahsOnPage += sWeight;

        if (Number(sId) < Number(surahId)) {
            ayahsBefore += sWeight;
        } else if (Number(sId) === Number(surahId)) {
            const ayahCountInS = (sEnd - sStart + 1);
            let effectiveAyah = Number(ayahNum);
            if (effectiveAyah < sStart) effectiveAyah = sStart;
            if (effectiveAyah > sEnd) effectiveAyah = sEnd;

            const progressInSurah = isEnd ? (effectiveAyah - sStart + 1) : (effectiveAyah - sStart);
            const weightedProgress = (progressInSurah / ayahCountInS) * sWeight;
            
            ayahsBefore += weightedProgress;
        }
    }

    const totalWeightOnPage = (pageAyahMap[p] && pageAyahMap[p].totalWeight) || totalAyahsOnPage;
    if (!totalWeightOnPage || totalWeightOnPage === 0) return p;

    const finalPos = p + (ayahsBefore / totalWeightOnPage);
    return isNaN(finalPos) ? p : finalPos;
};

const getAyahAtPosition = (pos) => {
    if (isNaN(pos) || pos === null) return null;
    let pageNum = Math.floor(pos);
    let fraction = pos - pageNum;
    
    if (fraction < 0.001 && pageNum > 1) {
        pageNum = pageNum - 1;
        fraction = 0.999;
    }

    const pageData = pageAyahMap[String(pageNum)];
    if (!pageData) return null;

    const surahsOnPage = Object.keys(pageData).filter(k => k !== 'totalWeight').map(Number).sort((a, b) => a - b);
    if (surahsOnPage.length === 0) return null;

    const totalWeight = pageData.totalWeight || 15;
    const targetWeight = fraction * totalWeight;

    let accumulatedWeight = 0;
    for (const sid of surahsOnPage) {
        const data = pageData[String(sid)];
        const start = (typeof data === 'object') ? data.start : 1;
        const end = (typeof data === 'object') ? data.end : data;
        const weight = (typeof data === 'object' && data.weight) ? data.weight : (end - start + 1);

        if (targetWeight <= accumulatedWeight + weight) {
            const weightInS = targetWeight - accumulatedWeight;
            const ayahCount = (end - start + 1);
            const ayahOffset = Math.floor((weightInS / weight) * ayahCount);
            return { surahId: sid, ayah: Math.max(start, Math.min(end, start + ayahOffset)) };
        }
        accumulatedWeight += weight;
    }

    const lastSid = surahsOnPage[surahsOnPage.length - 1];
    const lastData = pageData[String(lastSid)];
    return { surahId: lastSid, ayah: (typeof lastData === 'object' ? lastData.end : lastData) };
};

export default function StudentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.id;

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [manualHifzSurahId, setManualHifzSurahId] = useState(null);
    const [isSurahDropdownOpen, setIsSurahDropdownOpen] = useState(false);
    const [surahSearchQuery, setSurahSearchQuery] = useState('');
    const [isHifzFromPageDropdownOpen, setIsHifzFromPageDropdownOpen] = useState(false);
    const [isHifzToPageDropdownOpen, setIsHifzToPageDropdownOpen] = useState(false);
    const [autoAdvancedSurahId, setAutoAdvancedSurahId] = useState(null);
    const [hifzFromPage, setHifzFromPage] = useState('');
    const [hifzToPage, setHifzToPage] = useState('');
    const [hifzFromAyah, setHifzFromAyah] = useState(1);
    const [hifzToAyah, setHifzToAyah] = useState(1);

    // Form State - Murajaah
    const [murajaahType, setMurajaahType] = useState('MAJOR'); // 'MAJOR', 'MINOR', 'BOTH'
    const [mFromSurah, setMFromSurah] = useState(1);
    const [mFromAyah, setMFromAyah] = useState(1);
    const [mToSurah, setMToSurah] = useState(1);
    const [mToAyah, setMToAyah] = useState(1);

    // Minor Murajaah
    const [minorMFromSurah, setMinorMFromSurah] = useState(1);
    const [minorMFromAyah, setMinorMFromAyah] = useState(1);
    const [minorMToSurah, setMinorMToSurah] = useState(1);
    const [minorMToAyah, setMinorMToAyah] = useState(1);

    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [calculatedJuz, setCalculatedJuz] = useState(0);

    const [errorsCount, setErrorsCount] = useState(0); // For Major Murajaah
    const [alertsCount, setAlertsCount] = useState(0); // For Major Murajaah
    const [hifzErrors, setHifzErrors] = useState(0);    // For Hifz
    const [hifzAlerts, setHifzAlerts] = useState(0);    // For Hifz
    const [hifzCleanPages, setHifzCleanPages] = useState(0); // For Hifz
    const [cleanPagesCount, setCleanPagesCount] = useState(0); // For Major Murajaah
    const [minorErrors, setMinorErrors] = useState(0); // For Minor Murajaah
    const [minorAlerts, setMinorAlerts] = useState(0); // For Minor Murajaah
    const [minorCleanPages, setMinorCleanPages] = useState(0); // For Minor Murajaah

    const [showEditModal, setShowEditModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeEvent, setActiveEvent] = useState(null);
    const [isQuranicDaySession, setIsQuranicDaySession] = useState(false);
    const [sessionType, setSessionType] = useState(null); // 'HIFZ', 'MURAJAAH', 'BOTH'
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [editingSessionData, setEditingSessionData] = useState(null);
    const [sessionDate, setSessionDate] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [showAllHistory, setShowAllHistory] = useState(false);
    const lastSmartUpdateRef = useRef(null);
    const prevSurahIdRef = useRef(null);

    const latestHifzSurah = useMemo(() => {
        if (!history || history.length === 0) return student?.hifzProgress;
        const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date) || (b.id - a.id));
        const last = sorted.find(s => s.hifzSurah);
        return last ? last.hifzSurah : student?.hifzProgress;
    }, [history, student?.hifzProgress]);

    const currentHifzSurah = useMemo(() => {
        if (editingSessionData?.hifzSurah) {
            return quranData.find(s => s.name === editingSessionData.hifzSurah);
        }
        if (manualHifzSurahId) {
            return quranData.find(s => s.id === manualHifzSurahId);
        }
        if (autoAdvancedSurahId) {
            return quranData.find(s => s.id === autoAdvancedSurahId);
        }
        return quranData.find(s => s.id === (student?.currentHifzSurahId || 114));
    }, [student?.currentHifzSurahId, editingSessionId, editingSessionData, manualHifzSurahId, autoAdvancedSurahId]);

    const allowedPages = getSurahPages(currentHifzSurah?.id || 114);
    const latestHifzSurahId = useMemo(() => {
        if (!history || history.length === 0) return student?.currentHifzSurahId || 114;
        const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date) || (b.id - a.id));
        const last = sorted.find(s => s.hifzSurah);
        if (last) {
            const sObj = quranData.find(s => s.name === last.hifzSurah);
            return sObj?.id || 114;
        }
        return student?.currentHifzSurahId || 114;
    }, [history, student]);

    const isKhatim = useMemo(() => {
        // Dynamic Khatim: Check if already marked with 30 juz, or if the latest surah is Al-Baqarah and it's marked as finished
        if (student?.juzCount === 30 || student?.juzCount === 31) return true;
        if (!history || history.length === 0) return false;
        const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date) || (b.id - a.id));
        const last = sorted.find(s => s.hifzSurah);
        return last?.hifzSurah === 'البقرة' && last?.isFinishedSurah;
    }, [history, student]);

    // Shared Murajaah Calculation Logic
    const getMurajaahTargetPages = (planStr) => {
        if (!planStr) return 20;
        const plan = planStr.trim();
        const arabicToEn = (s) => s.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
        const match = plan.match(/([\d\u0660-\u0669]+(\.[\d\u0660-\u0669]+)?)/);
        
        if (plan === 'جزء' || plan === 'الجزء') return 20;
        if (plan === 'جزئين' || plan === 'الجزئين') return 40;
        if (plan.includes('ثلاث')) return 60;
        if (plan.includes('نصف جزء')) return 10;
        if (plan.includes('ربع جزء')) return 5;
        if (match) return parseFloat(arabicToEn(match[0]));
        if (plan.includes('نصف')) return 10;
        if (plan.includes('ربع')) return 5;
        return 20;
    };

    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        if (!studentId) return;
        fetchStudent();
        fetchHistory();
        fetchActiveEvent();
    }, [studentId]);

    // Exam State
    const [exams, setExams] = useState([]);
    const [showExamModal, setShowExamModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [examDate, setExamDate] = useState('');
    const [examTime, setExamTime] = useState('');

    // const fetchExams = async () => {
    //     try {
    //         const res = await fetch(`/api/exams?studentId=${studentId}`);
    //         if (res.ok) {
    //             setExams(await res.json());
    //         }
    //     } catch (e) { console.error(e); }
    // };

    const handleScheduleExam = async () => {
        if (!selectedExam) return;
        try {
            const res = await fetch('/api/exams', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedExam.id,
                    status: 'SCHEDULED',
                    examDate,
                    examTime
                })
            });
            if (res.ok) {
                toast.success('تم اعتماد المرشح وتحديد الموعد');
                setShowExamModal(false);
                // fetchExams();
            }
        } catch (e) { toast.error('خطأ في الحفظ'); }
    };

    const handleCompleteExam = async (examId) => {
        if (!confirm('هل أنت متأكد من اكتمال هذا الاختبار (اجتياز)؟')) return;
        try {
            const res = await fetch('/api/exams', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: examId,
                    status: 'COMPLETED'
                })
            });
            if (res.ok) {
                toast.success('تم تسجيل اجتياز الاختبار');
                fetchExams();
            }
        } catch (e) { toast.error('خطأ في الحفظ'); }
    }

    const fetchActiveEvent = async () => {
        try {
            const res = await fetch('/api/quranic-events?activeOnly=true');
            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    const event = data[0];
                    setActiveEvent(event);

                    // Check if this student is assigned to this teacher for this event
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const currentUser = JSON.parse(storedUser);
                        const assignedRes = await fetch(`/api/quranic-events/assignments?eventId=${event.id}`);
                        if (assignedRes.ok) {
                            const assignments = await assignedRes.json();

                            // Check if this student is assigned to THIS teacher OR if the event is OPEN
                            const isAssignedToMe = assignments.some(a =>
                                a.studentId === parseInt(studentId) &&
                                a.teacherId === currentUser.id
                            );

                            // The student is part of the event if they appear in ANY assignment for this event
                            const isStudentInEvent = assignments.some(a => a.studentId === parseInt(studentId));

                            // Logic: 
                            // 1. If specifically assigned to me -> Valid.
                            // 2. If it's OPEN testing and student is in the event -> Valid.
                            const isValidQuranicSession = isAssignedToMe || (event.allowOpenTesting && isStudentInEvent);

                            setIsQuranicDaySession(isValidQuranicSession);
                        }
                    }
                }
            }
        } catch (e) { console.error(e); }
    };

    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.trim().split(/\s+/)[0];
    };

    useEffect(() => {
        if (student && !loading) {
            calculateTotalProgress();
            applySmartDefaults();
        }
    }, [student, history, loading]);

    const applySmartDefaults = () => {
        if (loading || !student || !history || isSessionActive) return;
        console.log('Applying Smart Defaults for Student:', student);

        // Sort history by date desc, then by ID desc for stability
        const sortedHistory = [...history].sort((a, b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            if (dateDiff !== 0) return dateDiff;
            return (b.id || 0) - (a.id || 0);
        });

        // 1. HIFZ SMART DEFAULTS (Reverse Surah Direction 114 -> 1, Forward within Surah)
        const hifzHistory = sortedHistory.filter(s => s.hifzSurah && s.hifzToPage);
        const latestH = hifzHistory[0];
        const target = parseTarget(student.dailyTargetPages);

        let hStartSId = student.currentHifzSurahId || 114;
        let hStartPage = 1;
        let hStartAyah = 1;
        let foundHistory = false;

        if (latestH) {
            const lastSurah = quranData.find(s => normalizeSurahName(s.name) === normalizeSurahName(latestH.hifzSurah));
            if (lastSurah) {
                foundHistory = true;
                const isFinished = latestH.isFinishedSurah || (Number(latestH.hifzToAyah) >= Number(lastSurah.ayahs));
                
                if (isFinished) {
                    // Move to PREVIOUS surah in reverse hifz (114 -> 1)
                    hStartSId = lastSurah.id - 1;
                    if (hStartSId < 1) hStartSId = 1; // Cap at Fatiha
                    const nextSurah = quranData.find(s => s.id === hStartSId);
                    hStartPage = nextSurah?.startPage || 1;
                    if (isNaN(hStartPage)) hStartPage = 1;
                    hStartAyah = 1;
                } else {
                    // Stay in same surah, move to next page/ayah
                    hStartSId = lastSurah.id;
                    const lastToPage = Number(latestH.hifzToPage);
                    const lastToAyah = Number(latestH.hifzToAyah);
                    const pageData = pageAyahMap[lastToPage]?.[hStartSId];
                    const endAyahOfPage = (typeof pageData === 'object') ? pageData.end : pageData;

                    if (lastToAyah >= endAyahOfPage) {
                        hStartPage = lastToPage + 1;
                        const nextPData = pageAyahMap[hStartPage]?.[hStartSId];
                        hStartAyah = (typeof nextPData === 'object') ? nextPData.start : 1;
                    } else {
                        hStartPage = lastToPage;
                        hStartAyah = lastToAyah + 1;
                    }
                }
            }
        }

        if (!foundHistory) {
            // Use profile defaults
            const surah = quranData.find(s => s.id === hStartSId);
            if (surah) {
                hStartPage = surah.startPage;
                hStartAyah = 1;
            }
        }

        // Apply predicted values
        const allowedPages = getSurahPages(hStartSId);
        if (allowedPages.includes(hStartPage)) {
            setHifzFromPage(hStartPage);
            setHifzFromAyah(hStartAyah);

            const nextPageData = pageAyahMap[hStartPage]?.[hStartSId];
            const nextStartAyahOfPage = (typeof nextPageData === 'object') ? nextPageData.start : 1;
            const nextEndAyahOfPage = (typeof nextPageData === 'object') ? nextPageData.end : nextPageData;
            const nextMidAyahOfPage = Math.floor(nextStartAyahOfPage + (nextEndAyahOfPage - nextStartAyahOfPage) / 2);

            if (target <= 0.5) {
                setHifzToPage(hStartPage);
                if (hStartAyah <= nextStartAyahOfPage + 1) {
                    setHifzToAyah(nextMidAyahOfPage);
                } else {
                    setHifzToAyah(nextEndAyahOfPage);
                }
            } else {
                let potentialToPage = hStartPage + (Math.ceil(target) - 1);
                const lastPageOfSurah = allowedPages[allowedPages.length - 1];
                if (potentialToPage > lastPageOfSurah) potentialToPage = lastPageOfSurah;
                setHifzToPage(potentialToPage);
                const endPageData = pageAyahMap[potentialToPage]?.[hStartSId];
                setHifzToAyah((typeof endPageData === 'object' ? endPageData.end : endPageData) || 1);
            }
        }

        // 2. MURAJAAH SMART DEFAULTS (Forward only)
        const murajaahHistory = sortedHistory.filter(s => s.murajaahToSurah);
        const plan = (student.reviewPlan || '').trim();
        let targetPages = getMurajaahTargetPages(plan);

        // Quranic Day override logic
        if (isQuranicDaySession && student.juzCount > 0) {
            const juzStartPages = [
                0, 1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
                202, 222, 242, 262, 282, 302, 322, 342, 362, 382,
                402, 422, 442, 462, 482, 502, 522, 542, 562, 582
            ];
            const startJuzIndex = Math.min(30, Math.max(1, 31 - Math.floor(student.juzCount)));
            const startPage = juzStartPages[startJuzIndex];
            targetPages = (604 - startPage + 1);
        }

        let startSId = reviewableSurahs.length > 0 ? reviewableSurahs[0].id : 1;
        let startA = 1;

        if (murajaahHistory.length > 0) {
            const latestM = murajaahHistory[0];
            const lastSurah = quranData.find(s => normalizeSurahName(s.name) === normalizeSurahName(latestM.murajaahToSurah));
            if (lastSurah) {
                // Calculate review-only pages from total pagesCount
                const isFinished = Number(latestM.murajaahToAyah) >= Number(lastSurah.ayahs);

                if (isFinished) {
                    startSId = lastSurah.id + 1;
                    startA = 1;
                } else {
                    // Check if they did enough to advance at least within the surah
                    const hifzDoneInLast = (latestM.hifzToPage && latestM.hifzFromPage) ? (latestM.hifzToPage - latestM.hifzFromPage + 1) : 0;
                    const pagesDone = (latestM.pagesCount || 0) - hifzDoneInLast;
                    
                    if (pagesDone >= (targetPages * 0.3)) { // Reduced threshold for better flow
                        startSId = lastSurah.id;
                        startA = Number(latestM.murajaahToAyah) + 1;
                    } else {
                        const lastFromSurah = quranData.find(s => normalizeSurahName(s.name) === normalizeSurahName(latestM.murajaahFromSurah));
                        startSId = lastFromSurah ? lastFromSurah.id : lastSurah.id;
                        startA = Number(latestM.murajaahFromAyah) || 1;
                    }
                }
            }
        }

        // Loop back to the start of reviewable portion if we exceed An-Nas (114)
        if (startSId > 114) {
            startSId = reviewableSurahs.length > 0 ? reviewableSurahs[0].id : 1;
            startA = 1;
            console.log('Cycle completed! Looping back to:', startSId);
        }

        const startPos = getExactPosition(startSId, startA, false);
        if (startPos === null) return;
        const endPos = Math.min(604.99, startPos + targetPages);
        const predicted = getAyahAtPosition(endPos);

        if (predicted) {
            setMFromSurah(startSId);
            setMFromAyah(startA);
            setMToSurah(predicted.surahId);
            setMToAyah(predicted.ayah);
            lastSmartUpdateRef.current = `${startSId}-${startA}`;
        }
    };



    // Smart Progress Detection Effect
    useEffect(() => {
        if (!history || history.length === 0 || editingSessionId) return;

        // Find latest Hifz session
        const lastHifz = history.find(s => s.hifzSurah && s.hifzToAyah);
        if (lastHifz) {
            const surah = quranData.find(s => normalizeSurahName(s.name) === normalizeSurahName(lastHifz.hifzSurah));
            if (surah) {
                const isCompleted = lastHifz.isFinishedSurah || (parseInt(lastHifz.hifzToAyah) >= surah.ayahs);
                if (isCompleted) {
                    if (surah.id === 2) {
                        setAutoAdvancedSurahId(null);
                        return;
                    }
                    const nextId = surah.id === 1 ? 114 : surah.id - 1;
                    if (nextId > 0 && nextId !== autoAdvancedSurahId) {
                        setAutoAdvancedSurahId(nextId);
                    }
                } else if (surah.id !== autoAdvancedSurahId) {
                    // If not completed, stay on the same surah
                    setAutoAdvancedSurahId(surah.id);
                }
            }
        }
    }, [history, editingSessionId, autoAdvancedSurahId]);

    const fetchStudent = async () => {
        try {
            const response = await fetch(`/api/students?id=${studentId}&full=true`);
            const data = await response.json();
            // Since we use ?id=, the API returns the object or an array with one element
            const found = Array.isArray(data) ? data.find(s => s.id === parseInt(studentId)) : data;
            setStudent(found);

            // Student data loaded, applySmartDefaults will run via useEffect
        } catch (e) { console.error(e); }
    };

    const fetchHistory = async () => {
        try {
            const response = await fetch(`/api/sessions?studentId=${studentId}`);
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };


    const majorMurajaahData = useMemo(() => {
        if (!mFromSurah || !mToSurah || mFromAyah === '' || mToAyah === '') return { pages: 0, str: '0 صفحة' };
        const startPos = getExactPosition(Number(mFromSurah), Number(mFromAyah), false);
        const endPos = getExactPosition(Number(mToSurah), Number(mToAyah), true);
        if (startPos === null || endPos === null) return { pages: 0, str: '0 صفحة' };
        let val = (endPos || 0) - (startPos || 0);
        if (isNaN(val)) val = 0;
        if (val < 0) val = Math.abs(val);
        if (val === 0 && (Number(mFromSurah) !== Number(mToSurah) || Number(mFromAyah) !== Number(mToAyah))) val = 0.5;
        val = Math.ceil(val * 2) / 2;
        return { pages: val, str: `${val} صفحة` };
    }, [mFromSurah, mFromAyah, mToSurah, mToAyah]);

    const minorMurajaahData = useMemo(() => {
        if (!minorMFromSurah || !minorMToSurah || minorMFromAyah === '' || minorMToAyah === '') return { pages: 0, str: '0 صفحة' };
        const startPos = getExactPosition(Number(minorMFromSurah), Number(minorMFromAyah), false);
        const endPos = getExactPosition(Number(minorMToSurah), Number(minorMToAyah), true);
        if (startPos === null || endPos === null) return { pages: 0, str: '0 صفحة' };
        let val = (endPos || 0) - (startPos || 0);
        if (isNaN(val)) val = 0;
        if (val < 0) val = Math.abs(val);
        if (val === 0 && (Number(minorMFromSurah) !== Number(minorMToSurah) || Number(minorMFromAyah) !== Number(minorMToAyah))) val = 0.5;
        val = Math.ceil(val * 2) / 2;
        return { pages: val, str: `${val} صفحة` };
    }, [minorMFromSurah, minorMFromAyah, minorMToSurah, minorMToAyah]);

    const pagesCount = majorMurajaahData.pages;
    const resultString = majorMurajaahData.str;
    const minorPagesCount = minorMurajaahData.pages;
    const minorResultString = minorMurajaahData.str;

    const calculateTotalProgress = () => {
        if (!student) return;

        // If explicitly marked as 30 in DB (Khatim), use that.
        if (student.juzCount === 30) {
            setCalculatedJuz(30);
            return;
        }

        let currentId = latestHifzSurahId;
        let hifzStatus = latestHifzSurah;

        // Fallback: If ID is missing or 114 (default) using trusted Name logic
        if (hifzStatus) {
            let surahByName = null;
            if (hifzStatus) {
                surahByName = quranData.find(s => s.name === hifzStatus || s.name === hifzStatus.replace('سورة ', ''));
            }

            // Handle common Juz names
            if (!surahByName) {
                if (student.hifzProgress.includes('تبارك')) surahByName = quranData.find(s => s.id === 67);
                else if (student.hifzProgress.includes('عم')) surahByName = quranData.find(s => s.id === 78);
                else if (student.hifzProgress.includes('قد سمع')) surahByName = quranData.find(s => s.id === 58);
                else if (student.hifzProgress.includes('الذاريات')) surahByName = quranData.find(s => s.id === 51);
            }

            if (surahByName && (surahByName.id !== 114 || !currentId)) {
                currentId = surahByName.id;
            }
        }

        currentId = currentId || 114;

        // --- NEW LANDMARK-BASED LOGIC ---
        const juzStartPages = [1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];
        let finalJuz = 0;

        // Current Page the student is at (from history or surah start)
        let currentPage = 604;
        const currentSurahObj = quranData.find(s => s.id === currentId);
        
        if (currentSurahObj) {
            currentPage = currentSurahObj.startPage;
            // Find the VERY LATEST session in history for this surah
            const sessionsForThisSurah = history.filter(s => s.hifzSurah === currentSurahObj.name);
            const lastSession = sessionsForThisSurah.sort((a, b) => new Date(b.date) - new Date(a.date) || (b.id - a.id))[0];

            if (lastSession && lastSession.hifzToPage) {
                currentPage = parseInt(lastSession.hifzToPage);
            }
        }

        // 1. How many FULL Juz are BELOW this page (in reverse path)?
        let fullJuzFinished = 0;
        for (let i = juzStartPages.length - 1; i >= 0; i--) {
            // If the current page is EARLIER than the start of this Juz, then this Juz is finished
            if (currentPage < juzStartPages[i]) {
                fullJuzFinished++;
            } else {
                // We found the Juz the student is currently in
                const nextJuzStartPage = (i === juzStartPages.length - 1) ? 605 : juzStartPages[i+1];
                
                // Progress in CURRENT Juz (reverse: from nextJuzStartPage down to currentPage)
                const pagesInCurrentJuz = nextJuzStartPage - juzStartPages[i];
                const pagesFinishedInThisJuz = nextJuzStartPage - currentPage;
                const juzFraction = Math.min(1, Math.max(0, pagesFinishedInThisJuz / pagesInCurrentJuz));
                
                finalJuz = fullJuzFinished + juzFraction;
                break;
            }
        }

        // Set the calculated Juz (clamped to 30)
        const finalDisplayJuz = Math.min(30, finalJuz);
        setCalculatedJuz(finalDisplayJuz === 0 ? 0 : finalDisplayJuz.toFixed(1));

        // --- NEW LOGIC END ---
    };


    // Live Smart Calculation for Murajaah
    useEffect(() => {
        if (!student || !isSessionActive || editingSessionId) return;

        const sId = Number(mFromSurah);
        const aNum = Number(mFromAyah) || 1;
        
        let targetPages = getMurajaahTargetPages(student.reviewPlan);
        
        // If it's a Quranic Day, the target is the student's entire memorized portion
        if (isQuranicDaySession && student.juzCount > 0) {
            const juzStartPages = [
                0, 1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
                202, 222, 242, 262, 282, 302, 322, 342, 362, 382,
                402, 422, 442, 462, 482, 502, 522, 542, 562, 582
            ];
            const startJuzIndex = Math.min(30, Math.max(1, 31 - Math.floor(student.juzCount)));
            const startPage = juzStartPages[startJuzIndex];
            targetPages = (604 - startPage + 1);
        }

        if (sId && quranData.find(s => s.id === sId)) {
            const startPos = getExactPosition(sId, aNum, false);
            let endPos = startPos + targetPages;
            if (endPos > 604.99) endPos = 604.99;
            
            const predicted = getAyahAtPosition(endPos);
            if (predicted) {
                if (mToSurah !== predicted.surahId || mToAyah !== predicted.ayah) {
                    setMToSurah(predicted.surahId);
                    setMToAyah(predicted.ayah);
                }
            }
        }
    }, [mFromSurah, mFromAyah, student?.reviewPlan, isSessionActive, student, isQuranicDaySession]);

    // Live Smart Calculation for Hifz
    useEffect(() => {
        if (!student || !isSessionActive || editingSessionId || (sessionType !== 'HIFZ' && sessionType !== 'BOTH')) return;

        let fPage = parseInt(hifzFromPage);
        let fAyah = parseInt(hifzFromAyah) || 1;
        const target = parseTarget(student.dailyTargetPages);
        const currentSId = currentHifzSurah?.id || 114;
        const allowedPages = getSurahPages(currentSId);
        
        // Handle Surah Change
        if (prevSurahIdRef.current !== currentSId) {
            prevSurahIdRef.current = currentSId;
            if (allowedPages.length > 0) {
                const newStartPage = currentHifzSurah?.startPage || allowedPages[0];
                fPage = newStartPage;
                fAyah = 1;
                setHifzFromPage(fPage);
                setHifzFromAyah(fAyah);
                return; // Let next cycle compute To Page/Ayah
            }
        }

        if (isNaN(fPage)) return;

        // Ensure fromPage is within allowedPages for the current surah
        if (allowedPages.length > 0 && !allowedPages.includes(fPage)) {
            setHifzFromPage(allowedPages[0]);
            return; // Exit and let the next effect cycle handle it with correct fPage
        }

        // Predict To Page
        let tPage = fPage + (Math.ceil(target) - 1);
        if (allowedPages.length > 0) {
            const lastPageOfSurah = allowedPages[allowedPages.length - 1];
            if (tPage > lastPageOfSurah) tPage = lastPageOfSurah;
        }
        
        // Predict To Ayah
        const pageData = pageAyahMap[tPage]?.[currentSId];
        let tAyah = 1;
        if (target <= 0.5) {
             const startA = (typeof pageData === 'object') ? pageData.start : 1;
             const endA = (typeof pageData === 'object') ? pageData.end : (pageData || 1);
             const midA = Math.floor(startA + (endA - startA) / 2);
             tAyah = (fAyah <= startA + 1) ? midA : endA;
        } else {
             tAyah = (typeof pageData === 'object' ? pageData.end : pageData) || 1;
        }

        if (tPage !== parseInt(hifzToPage) || tAyah !== parseInt(hifzToAyah)) {
            setHifzToPage(tPage);
            setHifzToAyah(tAyah);
        }
    }, [hifzFromPage, hifzFromAyah, student, isSessionActive, sessionType, editingSessionId, currentHifzSurah]);

    // Auto-calculate Clean Pages
    useEffect(() => {
        if (!isSessionActive || editingSessionId) return;

        // 1. Major Murajaah
        const majorClean = Math.max(0, (parseFloat(pagesCount) || 0) - (parseInt(errorsCount) || 0) - (parseInt(alertsCount) || 0));
        setCleanPagesCount(majorClean);

        // 2. Minor Murajaah
        const minorClean = Math.max(0, (parseFloat(minorPagesCount) || 0) - (parseInt(minorErrors) || 0) - (parseInt(minorAlerts) || 0));
        setMinorCleanPages(minorClean);

        // 3. Hifz
        let hifzDoneVal = 0;
        if (hifzToPage && hifzFromPage && currentHifzSurah) {
            const startSId = currentHifzSurah.id;
            const startA = parseInt(hifzFromAyah);
            const endA = parseInt(hifzToAyah);
            const startP = parseInt(hifzFromPage);
            const endP = parseInt(hifzToPage);

            for (let p = startP; p <= endP; p++) {
                const pageDataObj = pageAyahMap[p];
                if (!pageDataObj || !pageDataObj[String(startSId)]) continue;

                const sData = pageDataObj[String(startSId)];
                const sStart = Number((typeof sData === 'object') ? sData.start : sData);
                const sEnd = Number((typeof sData === 'object') ? sData.end : sData);
                const sWeight = (typeof sData === 'object' && sData.weight) ? sData.weight : (sEnd - sStart + 1);
                
                const totalWeightOnPage = pageDataObj.totalWeight || Object.values(pageDataObj).reduce((sum, d) => {
                    if (typeof d === 'object' && d !== null && 'start' in d && 'end' in d) {
                        return sum + (Number(d.end) - Number(d.start) + 1);
                    }
                    return sum;
                }, 0) || (sEnd - sStart + 1);

                const actualFrom = Math.max(startA, sStart);
                const actualTo = Math.min(endA, sEnd);

                if (actualFrom <= actualTo) {
                    const recitedCount = (actualTo - actualFrom + 1);
                    const totalInS = (sEnd - sStart + 1);
                    const surahShareOfPage = (sWeight / totalWeightOnPage);
                    hifzDoneVal += (recitedCount / totalInS) * surahShareOfPage;
                }
            }
            hifzDoneVal = Number(hifzDoneVal.toFixed(1));
        }
        const hifzClean = Math.max(0, hifzDoneVal - (parseInt(hifzErrors) || 0) - (parseInt(hifzAlerts) || 0));
        setHifzCleanPages(hifzClean);

    }, [pagesCount, errorsCount, alertsCount, minorPagesCount, minorErrors, minorAlerts, hifzToPage, hifzFromPage, hifzFromAyah, hifzToAyah, hifzErrors, hifzAlerts, isSessionActive, editingSessionId, currentHifzSurah]);

    const findSurahId = (name) => {
        if (!name) return 1;
        const normalized = name.replace('سورة ', '').trim();
        return quranData.find(s => s.name === normalized || s.name === name)?.id || 1;
    };



    useEffect(() => {
        if (isSessionActive && !editingSessionId) {
            const d = new Date();
            const tzOffset = d.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(d - tzOffset)).toISOString().slice(0, 16);
            setSessionDate(localISOTime);
        }
    }, [isSessionActive, editingSessionId]);


    const handleSaveSession = async (e) => {
        e.preventDefault();
        setSaving(true);
        const isQuranicDay = isQuranicDaySession;

        const currentSurah = currentHifzSurah;
        const nextSurahPages = getSurahPages(currentSurah?.id);
        
        // Improved Finish Logic: Check if it's the last page AND the last ayah of the surah
        const isLastPage = parseInt(hifzToPage) === nextSurahPages[nextSurahPages.length - 1];
        const isLastAyah = parseInt(hifzToAyah) === currentSurah?.ayahs;
        const isFinishedSurah = !isKhatim && isLastPage && isLastAyah;

        try {
            const fromSurahName = quranData.find(s => s.id === parseInt(mFromSurah))?.name;
            const toSurahName = quranData.find(s => s.id === parseInt(mToSurah))?.name;
            const minorFromSurahName = quranData.find(s => s.id === parseInt(minorMFromSurah))?.name;
            const minorToSurahName = quranData.find(s => s.id === parseInt(minorMToSurah))?.name;

            // Goal Calculation
            // 1. Get Hifz Target (student.dailyTargetPages)
            const hifzTarget = student?.dailyTargetPages || 0;

            // 1.5 Quranic Day Precise Target Logic
            const juzStartPages = [
                0, 1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
                202, 222, 242, 262, 282, 302, 322, 342, 362, 382,
                402, 422, 442, 462, 482, 502, 522, 542, 562, 582
            ];

            // 2. Get Review Target (from student.reviewPlan string)
            // Parse "part", "2 parts", etc into pages.
            // Assumption: 1 Juz = 20 pages.
            let reviewTarget = 0;
            const plan = student?.reviewPlan || '';
            if (plan.includes('نصف جزء')) reviewTarget = 10;
            else if (plan === 'جزء') reviewTarget = 20;
            else if (plan === 'جزئين') reviewTarget = 40;
            else if (plan.includes('ثلاث')) reviewTarget = 60;
            else if (plan === 'نصف صفحة') reviewTarget = 0.5;
            else if (plan === 'صفحة') reviewTarget = 1;
            else if (plan === 'صفحتين') reviewTarget = 2;
            else {
                // Try to parse custom number if existing (e.g. "5")
                // If it's pure number
                if (!isNaN(parseFloat(plan))) reviewTarget = parseFloat(plan);
            }

            // OVERRIDE: If it's a Quranic Day, the target is their entire portion
            if (isQuranicDay) {
                const count = Math.min(30, Math.max(0, student?.juzCount || 0));
                if (count > 0) {
                    const startJuzIndex = 31 - count;
                    const startPage = juzStartPages[startJuzIndex];
                    reviewTarget = (604 - startPage + 1);
                } else {
                    // Default if juzCount is 0 but they are in the event
                    reviewTarget = 20;
                }
            }

            // 3. Calculate Actuals
            // Calculate Hifz Done by summing portions on each page
            let hifzDone = 0;
            if (!isKhatim && hifzToPage && hifzFromPage && currentHifzSurah) {
                const startSId = currentHifzSurah.id;
                const startA = parseInt(hifzFromAyah);
                const endA = parseInt(hifzToAyah);
                const startP = parseInt(hifzFromPage);
                const endP = parseInt(hifzToPage);

                for (let p = startP; p <= endP; p++) {
                    const pageDataObj = pageAyahMap[p];
                    if (!pageDataObj || !pageDataObj[String(startSId)]) continue;

                    const sData = pageDataObj[String(startSId)];
                    const sStart = Number((typeof sData === 'object') ? sData.start : sData);
                    const sEnd = Number((typeof sData === 'object') ? sData.end : sData);
                    const sWeight = (typeof sData === 'object' && sData.weight) ? sData.weight : (sEnd - sStart + 1);
                    const totalWeightOnPage = pageDataObj.totalWeight || (Object.values(pageDataObj).reduce((sum, d) => sum + (typeof d === 'object' ? (d.end - d.start + 1) : 0), 0) || (sEnd - sStart + 1));
                    
                    const actualFrom = Math.max(startA, sStart);
                    const actualTo = Math.min(endA, sEnd);

                    if (actualFrom <= actualTo) {
                        const recitedCount = (actualTo - actualFrom + 1);
                        const totalInS = (sEnd - sStart + 1);
                        
                        // Use 15 as base for Juz Amma, otherwise use totalWeight or sum
                        const baseWeight = (p >= 582) ? 15 : (pageDataObj.totalWeight || Object.values(pageDataObj).reduce((sum, d) => {
                            if (typeof d === 'object' && d !== null && 'start' in d && 'end' in d) {
                                return sum + (Number(d.end) - Number(d.start) + 1);
                            }
                            return sum;
                        }, 0) || (sEnd - sStart + 1));
                        
                        const surahShareOfPage = (sWeight / baseWeight);
                        hifzDone += (recitedCount / totalInS) * surahShareOfPage;
                    }
                }
                // Force precision to 1 decimal place to avoid 1.4000001 issues
                hifzDone = Number(hifzDone.toFixed(1));
            }

            // Review Done (pagesCount is strict, but sometimes it's calculated from Ayahs. 
            // In Murajaah, pagesCount is usually (toPage - fromPage + 1). 
            // We use the `pagesCount` variable which comes from state (auto calculated or manual override needed?)
            // Actually, `pagesCount` in state effectively stores the calculated result. 
            // Is it Hifz + Review? 
            // Looking at `handleSaveSession`, we pass `pagesCount`.
            // Usually `pagesCount` is the Total Recitation. 
            // We need separate Review Pages count to compare against Review Target.

            // Re-calculate Review Pages explicitly:
            let reviewDone = 0;
            if (murajaahType) {
                reviewDone = parseFloat(pagesCount);
                if (reviewDone < 0) reviewDone = 0;
            }

            // 3.5 Calculate Today's Past Sessions
            const todayStr = new Date().toISOString().split('T')[0];
            const todaysSessions = history.filter(s =>
                new Date(s.date).toISOString().split('T')[0] === todayStr &&
                s.id !== editingSessionId
            );

            let pastHifz = 0;
            let pastReview = 0;
            todaysSessions.forEach(s => {
                if (s.hifzFromPage && s.hifzToPage) {
                    pastHifz += (s.hifzToPage - s.hifzFromPage) + 1;
                }
                const sessionReview = (s.pagesCount || 0) - (s.hifzFromPage && s.hifzToPage ? (s.hifzToPage - s.hifzFromPage + 1) : 0);
                pastReview += Math.max(0, sessionReview);
            });

            const totalHifzToday = hifzDone + pastHifz;
            const totalReviewToday = reviewDone + pastReview;

            // 4. Compare Daily Goal
            // Evaluate against the student's daily target across all sessions done today.
            const includesHifz = sessionType === 'HIFZ' || sessionType === 'BOTH';
            const includesReview = sessionType === 'MURAJAAH' || sessionType === 'BOTH';

            const hifzMet = (isKhatim || isQuranicDay || hifzTarget <= 0) ? true : (totalHifzToday >= hifzTarget);
            const reviewMet = (reviewTarget <= 0) ? true : (totalReviewToday >= reviewTarget);

            const isGoalAchieved = hifzMet && reviewMet;

            const method = editingSessionId ? 'PUT' : 'POST';
            const endpoint = editingSessionId ? `/api/sessions/${editingSessionId}` : '/api/sessions';

            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingSessionId,
                    studentId,
                    // Only send hifz data if (includesHifz) AND (not Khatim) AND (not a Quranic Day session)
                    hifzSurah: (includesHifz && !isKhatim && !isQuranicDay) ? (editingSessionId && editingSessionData?.hifzSurah ? editingSessionData.hifzSurah : currentSurah?.name) : null,
                    hifzFromPage: (includesHifz && !isKhatim && !isQuranicDay) ? parseInt(hifzFromPage) : null,
                    hifzToPage: (includesHifz && !isKhatim && !isQuranicDay) ? parseInt(hifzToPage) : null,
                    hifzFromAyah: (includesHifz && !isKhatim && !isQuranicDay) ? parseInt(hifzFromAyah) : null,
                    hifzToAyah: (includesHifz && !isKhatim && !isQuranicDay) ? parseInt(hifzToAyah) : null,

                    murajaahFromSurah: (includesReview && (murajaahType === 'MAJOR' || murajaahType === 'BOTH')) ? fromSurahName : null,
                    murajaahFromAyah: (includesReview && (murajaahType === 'MAJOR' || murajaahType === 'BOTH')) ? parseInt(mFromAyah) : null,
                    murajaahToSurah: (includesReview && (murajaahType === 'MAJOR' || murajaahType === 'BOTH')) ? toSurahName : null,
                    murajaahToAyah: (includesReview && (murajaahType === 'MAJOR' || murajaahType === 'BOTH')) ? parseInt(mToAyah) : null,

                    minorMurajaahFromSurah: (includesReview && (murajaahType === 'MINOR' || murajaahType === 'BOTH')) ? minorFromSurahName : null,
                    minorMurajaahFromAyah: (includesReview && (murajaahType === 'MINOR' || murajaahType === 'BOTH')) ? parseInt(minorMFromAyah) : null,
                    minorMurajaahToSurah: (includesReview && (murajaahType === 'MINOR' || murajaahType === 'BOTH')) ? minorToSurahName : null,
                    minorMurajaahToAyah: (includesReview && (murajaahType === 'MINOR' || murajaahType === 'BOTH')) ? parseInt(minorMToAyah) : null,

                    minorErrorsCount: (includesReview && (murajaahType === 'MINOR' || murajaahType === 'BOTH')) ? (parseInt(minorErrors) || 0) : 0,
                    minorAlertsCount: (includesReview && (murajaahType === 'MINOR' || murajaahType === 'BOTH')) ? (parseInt(minorAlerts) || 0) : 0,
                    minorCleanPagesCount: (includesReview && (murajaahType === 'MINOR' || murajaahType === 'BOTH')) ? (parseFloat(minorCleanPages) || 0) : 0,

                    // Summary Stats (Total of Hifz + Murajaah)
                    pagesCount: (includesReview ? parseFloat(pagesCount) : 0) + (includesHifz ? hifzDone : 0),
                    resultString: `${((includesReview ? parseFloat(pagesCount) : 0) + (includesHifz ? hifzDone : 0)).toFixed(1)} صفحة`,
                    notes,
                    errorsCount: (includesReview && (murajaahType === 'MAJOR' || murajaahType === 'BOTH')) ? (parseInt(errorsCount) || 0) : 0,
                    alertsCount: (includesReview && (murajaahType === 'MAJOR' || murajaahType === 'BOTH')) ? (parseInt(alertsCount) || 0) : 0,
                    cleanPagesCount: (includesReview && (murajaahType === 'MAJOR' || murajaahType === 'BOTH')) ? (parseFloat(cleanPagesCount) || 0) : 0,

                    // Specific Breakdowns (kept for record)
                    hifzErrors: (includesHifz && !isKhatim && !isQuranicDay) ? (parseInt(hifzErrors) || 0) : 0,
                    hifzAlerts: (includesHifz && !isKhatim && !isQuranicDay) ? (parseInt(hifzAlerts) || 0) : 0,
                    hifzCleanPages: (includesHifz && !isKhatim && !isQuranicDay) ? (parseFloat(hifzCleanPages) || 0) : 0,
                    isFinishedSurah: includesHifz ? isFinishedSurah : false,
                    isGoalAchieved,
                    quranicEventId: isQuranicDaySession ? activeEvent?.id : null,
                    sessionDate: sessionDate || null
                })
            });

            if (response.ok) {
                toast.success(editingSessionId ? 'تم تحديث التسميع بنجاح' : 'تم تسجيل التسميع بنجاح');
                setNotes('');
                setHifzErrors(0);
                setHifzAlerts(0);
                setHifzCleanPages(0);
                setErrorsCount(0);
                setAlertsCount(0);
                setCleanPagesCount(0);
                setMinorErrors(0);
                setMinorAlerts(0);
                setMinorCleanPages(0);
                setIsSessionActive(false);
                setSessionType(null);
                setEditingSessionId(null);
                setManualHifzSurahId(null);
                // Proactively predict next surah for the UI
                if (isFinishedSurah) {
                    if (currentSurah?.id === 2) {
                        setAutoAdvancedSurahId(null);
                    } else {
                        const nextId = currentSurah?.id === 1 ? 114 : (currentSurah?.id || 114) - 1;
                        setAutoAdvancedSurahId(nextId);
                    }
                }
                fetchStudent();
                fetchHistory();
            }
        } catch (error) {
            toast.error('خطأ في الحفظ');
        } finally {
            setSaving(false);
        }
    };

    const handleEditSession = (session) => {
        setEditingSessionId(session.id);
        setEditingSessionData(session);

        if (session.date) {
            const d = new Date(session.date);
            const tzOffset = d.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(d - tzOffset)).toISOString().slice(0, 16);
            setSessionDate(localISOTime);
        }

        let sType = null;
        if (session.hifzSurah && (session.murajaahFromSurah || session.minorMurajaahFromSurah)) {
            sType = 'BOTH';
        } else if (session.hifzSurah) {
            sType = 'HIFZ';
        } else {
            sType = 'MURAJAAH';
        }
        setSessionType(sType);

        if (session.murajaahFromSurah && session.minorMurajaahFromSurah) {
            setMurajaahType('BOTH');
        } else if (session.minorMurajaahFromSurah) {
            setMurajaahType('MINOR');
        } else {
            setMurajaahType('MAJOR');
        }

        if (session.hifzSurah) {
            setHifzFromPage(session.hifzFromPage || '');
            setHifzToPage(session.hifzToPage || '');
            setHifzFromAyah(session.hifzFromAyah || 1);
            setHifzToAyah(session.hifzToAyah || 1);
            setHifzErrors(session.hifzErrors || 0);
            setHifzAlerts(session.hifzAlerts || 0);
            setHifzCleanPages(session.hifzCleanPages || 0);
        }

        if (session.murajaahFromSurah) {
            const fSurah = quranData.find(s => s.name === session.murajaahFromSurah);
            const tSurah = quranData.find(s => s.name === session.murajaahToSurah);
            setMFromSurah(fSurah?.id || 1);
            setMToSurah(tSurah?.id || 1);
            setMFromAyah(session.murajaahFromAyah || 1);
            setMToAyah(session.murajaahToAyah || 1);
            setErrorsCount(session.errorsCount || 0);
            setAlertsCount(session.alertsCount || 0);
            setCleanPagesCount(session.cleanPagesCount || 0);
        }

        if (session.minorMurajaahFromSurah) {
            const fSurah = quranData.find(s => s.name === session.minorMurajaahFromSurah);
            const tSurah = quranData.find(s => s.name === session.minorMurajaahToSurah);
            setMinorMFromSurah(fSurah?.id || 1);
            setMinorMToSurah(tSurah?.id || 1);
            setMinorMFromAyah(session.minorMurajaahFromAyah || 1);
            setMinorMToAyah(session.minorMurajaahToAyah || 1);
            setMinorErrors(session.minorErrorsCount || 0);
            setMinorAlerts(session.minorAlertsCount || 0);
            setMinorCleanPages(session.minorCleanPagesCount || 0);
        }

        setNotes(session.notes || '');
        setIsSessionActive(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const promptDeleteSession = (sessionId) => {
        setSessionToDelete(sessionId);
        setShowDeleteModal(true);
    };

    const handleDeleteSession = async () => {
        if (!sessionToDelete) return;

        try {
            const res = await fetch(`/api/sessions/${sessionToDelete}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('تم حذف الجلسة بنجاح');
                fetchHistory();
                fetchStudent();
            } else {
                toast.error('حدث خطأ أثناء الحذف');
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء الحذف');
        } finally {
            setShowDeleteModal(false);
            setSessionToDelete(null);
        }
    };


    // Active Exam Logic
    const activeExam = null; // exams.find(e => e.status === 'PENDING' || e.status === 'SCHEDULED');

    // Filtered surahs for review
    const reviewableSurahs = quranData.filter(s => {
        if (!student) return false;

        // If Khatim, all surahs are available for review
        if (isKhatim) return true;

        // For non-Khatim students:
        // In the 114 -> 1 path, higher IDs are finished surahs
        return s.id > student.currentHifzSurahId;
    });

    // Validating Murajaah Selection State
    useEffect(() => {
        if (reviewableSurahs.length > 0) {
            // If current selection is not in list, default to first item
            const isFromValid = reviewableSurahs.some(s => s.id === mFromSurah);
            const isToValid = reviewableSurahs.some(s => s.id === mToSurah);
            const isMinorFromValid = reviewableSurahs.some(s => s.id === minorMFromSurah);
            const isMinorToValid = reviewableSurahs.some(s => s.id === minorMToSurah);

            if (!isFromValid) {
                setMFromSurah(reviewableSurahs[0].id);
                // Also reset Ayah to 1 to avoid out of bounds
                setMFromAyah(1);
            }
            if (!isToValid) {
                setMToSurah(reviewableSurahs[0].id);
            }
            if (!isMinorFromValid) {
                setMinorMFromSurah(reviewableSurahs[0].id);
                setMinorMFromAyah(1);
            }
            if (!isMinorToValid) {
                setMinorMToSurah(reviewableSurahs[0].id);
            }
        }
    }, [reviewableSurahs, mFromSurah, mToSurah, minorMFromSurah, minorMToSurah]);



    const handleDelete = () => {
        toast((t) => (
            <div className="premium-glass p-6 rounded-2xl shadow-2xl border border-slate-100 flex flex-col gap-4 min-w-[300px]">
                <div className="font-bold text-slate-800 text-lg">
                    هل أنت متأكد من حذف هذا الطالب؟
                    <div className="text-sm text-red-500 mt-2 font-medium">سيتم حذف جميع سجلاته نهائياً.</div>
                </div>
                <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            performDelete();
                        }}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        نعم، حذف
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    };

    const performDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/students?id=${studentId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('تم حذف الطالب بنجاح');
                router.push('/teacher');
            } else {
                toast.error('حدث خطأ أثناء الحذف');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء الحذف');
        } finally {
            setDeleting(false);
        }
    };

    if (loading && !student) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-noto rtl transition-colors duration-300" dir="rtl">
            <div>
                <Navbar
                    userType="teacher"
                    userName={user ? `أهلًا أستاذ ${getFirstName(user.name)} 👋` : 'أهلًا أستاذ 👋'}
                    onLogout={() => router.push('/login')}
                />
            </div>

            <main className="max-w-6xl mx-auto px-4 pt-28 pb-12">
                {/* Back Button */}
                <BackButton
                    href="/teacher"
                    text="عودة للقائمة الرئيسية"
                    className="mb-6"
                />

                {/* Actions */}
                <div className="flex justify-end gap-3 mb-4">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                    >
                        <span>✏️</span> تعديل
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <span>🗑️</span> {deleting ? 'جاري الحذف...' : 'حذف'}
                    </button>
                    <button
                        onClick={() => router.push(`/teacher/student/${student.id}/plan`)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-none"
                    >
                        <span>📅</span> الخطة الدراسية
                    </button>
                    <button
                        onClick={() => router.push(`/teacher/student/${student.id}/report`)}
                        className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 shadow-lg shadow-slate-200 dark:shadow-none"
                    >
                        <span>🖨️</span> طباعة التقرير
                    </button>
                </div>

                {/* Header Card */}
                <div className="premium-glass rounded-[3rem] p-10 mb-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-50 rounded-full -translate-x-10 -translate-y-10 opacity-50"></div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                        <div className="flex items-center gap-8">
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-lg shadow-emerald-200">
                                {student?.name?.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{student?.name}</h1>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {isKhatim ? (
                                        <span className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 rounded-full text-sm font-black shadow-lg shadow-amber-200 flex items-center gap-2">
                                            <span>🏆</span>
                                            خاتم القرآن الكريم
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                            المحفوظ: {latestHifzSurah}
                                        </span>
                                    )}
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                        الخطة: {student?.reviewPlan}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="text-center bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm px-8 py-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">إجمالي الأجزاء</span>
                                <span className="text-3xl font-black text-slate-700 dark:text-white">{isKhatim ? '30' : calculatedJuz}</span>
                                {!isKhatim && <span className="text-sm font-bold text-slate-400 dark:text-slate-500 mr-1">جزء</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Recording Form */}
                    <div className="lg:col-span-2 space-y-10">
                        {!isSessionActive ? (
                            <div className="premium-glass rounded-[3rem] p-12 text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10">
                                    <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500">📖</div>
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">بدء جلسة جديدة</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed font-medium">
                                        "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"
                                        <br />
                                        <span className="text-xs text-slate-400">جاهز لتسجيل إنجاز الطالب لليوم؟</span>
                                    </p>
                                    <button
                                        onClick={() => {
                                            if (isKhatim || isQuranicDaySession) {
                                                setSessionType('MURAJAAH');
                                                setIsSessionActive(true);
                                            } else {
                                                setShowTypeModal(true);
                                            }
                                        }}
                                        className="px-10 py-5 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
                                    >
                                        <span>تسجيل تسميع اليوم</span>
                                        <span className="text-2xl">✨</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveSession} className="premium-glass rounded-[3rem] p-10 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                                        <span className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">✍️</span>
                                        {sessionType === 'HIFZ' ? 'تسجيل حفظ جديد' : sessionType === 'MURAJAAH' ? 'تسجيل مراجعة' : 'تسجيل حفظ ومراجعة'}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-2 whitespace-nowrap">تاريخ الجلسة</label>
                                            <input
                                                type="datetime-local"
                                                value={sessionDate}
                                                onChange={(e) => setSessionDate(e.target.value)}
                                                className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-emerald-400 rounded-xl outline-none font-bold text-sm text-slate-700 dark:text-slate-200 shadow-sm w-full md:w-auto"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowCancelModal(true)}
                                            className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-xs font-black hover:bg-red-100 transition-colors"
                                        >
                                            إلغاء ✕
                                        </button>
                                    </div>
                                </div>




                                {/* Quranic Day Active Banner/Toggle */}
                                {activeEvent && isQuranicDaySession && (
                                    <div className="mb-8 p-6 rounded-[2rem] border-2 bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800 shadow-lg shadow-amber-100 dark:shadow-none flex justify-between items-center animate-pulse-slow">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-amber-100 dark:bg-amber-900/30">🏆</div>
                                            <div>
                                                <div className="font-black text-amber-900 dark:text-amber-200 leading-tight">دورة الأيام القرآنية: {activeEvent.name}</div>
                                                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">هذا الطالب مسند إليك في هذه الدورة. سيتم احتساب الجلسة في الإحصائيات.</div>
                                            </div>
                                        </div>
                                        <div className="bg-amber-500 dark:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm">
                                            تسجيل معتمد
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-10">
                                    {/* Premium Quality Warning Banner (Glassmorphism) */}
                                    <div className="mb-8 p-5 rounded-[2rem] bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative group transition-all duration-500 hover:scale-[1.01]">
                                        {/* Decorative Glows */}
                                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 dark:bg-red-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                                        <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>

                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-amber-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-red-500/20 animate-pulse-slow">
                                                ⚠️
                                            </div>
                                            <div className="flex-1 text-right">
                                                <div className="text-sm sm:text-base font-black text-slate-800 dark:text-white leading-tight mb-1">
                                                    معيار جودة الجلسة والتقييم
                                                </div>
                                                <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-wide">
                                                    "الصفحة الواحدة مسموح فيها خطأ واحد وتنبيهان" <span className="text-red-500 dark:text-red-400 font-black">- غير ذلك يرجع الطالب -</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Hifz Section - Logic Refined */}
                                    {(() => {
                                        // If Session is Review Only, and not specialized mode, don't show Hifz block at all
                                        if (sessionType === 'MURAJAAH' && !isKhatim && !isQuranicDaySession) return null;

                                        // If student is Khatim, show congrats
                                        if (isKhatim) return (
                                            <div className="p-8 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-[2.5rem] border-2 border-amber-200 dark:border-amber-800 shadow-inner animate-in zoom-in duration-500">
                                                <div className="text-center">
                                                    <div className="text-6xl mb-4">🎉</div>
                                                    <h3 className="text-2xl font-black text-amber-800 dark:text-amber-200 mb-2">مبارك! الطالب خاتم للقرآن الكريم</h3>
                                                    <p className="text-amber-600 dark:text-amber-400 font-bold">اتم الطالب حفظ كتاب الله كاملاً - ينتقل الآن لمرحلة التثبيت والمراجعة المكثفة</p>
                                                </div>
                                            </div>
                                        );

                                        // If Quranic Day is active, show banner
                                        if (isQuranicDaySession) return (
                                            <div className="p-8 bg-gradient-to-br from-indigo-50 to-amber-50 dark:from-indigo-900/20 dark:to-amber-900/20 rounded-[2.5rem] border-2 border-amber-200 dark:border-amber-800 shadow-inner">
                                                <div className="text-center">
                                                    <div className="text-6xl mb-4">🛡️</div>
                                                    <h3 className="text-2xl font-black text-amber-800 dark:text-amber-200 mb-2">وضع الأيام القرآنية نشط</h3>
                                                    <p className="text-amber-600 dark:text-amber-400 font-bold">تم قفل قسم الحفظ - التركيز الآن على المراجعة المكثفة فقط</p>
                                                </div>
                                            </div>
                                        );

                                        // If we are in Hifz or Both mode, show the form
                                        if (sessionType === 'HIFZ' || sessionType === 'BOTH') {
                                            if (activeExam) return (
                                                <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-200 shadow-inner">
                                                    <div className="text-center">
                                                        <div className="text-6xl mb-4">🛑</div>
                                                        <h3 className="text-2xl font-black text-indigo-900 mb-2">محطة اختبار: {activeExam.stationName}</h3>
                                                        {/* Rest of Exam Logic remains same... */}
                                                        {activeExam.status === 'PENDING' ? (
                                                            <div className="mt-4">
                                                                <p className="text-indigo-700 font-bold mb-4">الطالب مرشح لهذا الاختبار. يجب تأكيد الموعد للمتابعة.</p>
                                                                <button type="button" onClick={() => { setSelectedExam(activeExam); setExamDate(new Date().toISOString().split('T')[0]); setExamTime(''); setShowExamModal(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">📅 اعتماد وتحديد موعد</button>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-4">
                                                                <p className="text-indigo-700 font-bold mb-2">تم تحديد موعد الاختبار:</p>
                                                                <div className="inline-block bg-white px-6 py-3 rounded-xl shadow-sm mb-4"><div className="font-black text-indigo-900">{new Date(activeExam.examDate).toLocaleDateString('ar-SA')}</div><div className="text-indigo-500 font-bold text-sm">{activeExam.examTime}</div></div>
                                                                <div className="flex justify-center gap-3">
                                                                    <button type="button" onClick={() => handleCompleteExam(activeExam.id)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">✅ تم اجتياز الاختبار</button>
                                                                    <button type="button" onClick={() => { setSelectedExam(activeExam); setExamDate(activeExam.examDate ? new Date(activeExam.examDate).toISOString().split('T')[0] : ''); setExamTime(activeExam.examTime || ''); setShowExamModal(true); }} className="px-6 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-50 transition-all">✏️ تعديل الموعد</button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );

                                            return (
                                                <div className="p-8 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800 shadow-inner">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200 dark:shadow-none"></span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-emerald-800 dark:text-emerald-400 font-black text-xl">الحفظ الجديد:</span>
                                                                <div className="relative inline-block text-right ml-2" dir="rtl">
                                                                    {/* Trigger Button */}
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setIsSurahDropdownOpen(!isSurahDropdownOpen)}
                                                                        className="flex items-center gap-2 pl-9 pr-4 py-1.5 bg-emerald-100/60 dark:bg-emerald-950/60 hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 border border-emerald-300/30 dark:border-emerald-800/30 rounded-2xl outline-none text-emerald-800 dark:text-emerald-300 font-black text-lg cursor-pointer transition-all shadow-sm"
                                                                    >
                                                                        <span>سورة {currentHifzSurah?.name || 'الفاتحة'}</span>
                                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 pointer-events-none text-[10px]">▼</span>
                                                                    </button>

                                                                    {/* Dropdown Menu */}
                                                                    {isSurahDropdownOpen && (
                                                                        <>
                                                                            {/* Backdrop */}
                                                                            <div className="fixed inset-0 z-40" onClick={() => setIsSurahDropdownOpen(false)} />
                                                                            
                                                                            {/* Options Box */}
                                                                            <div className="absolute z-50 right-0 mt-2 w-64 max-h-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-100/50 dark:border-emerald-900/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 origin-top-right">
                                                                                {/* Search Input */}
                                                                                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                                                                                    <input 
                                                                                        type="text"
                                                                                        placeholder="🔍 ابحث عن سورة..."
                                                                                        value={surahSearchQuery}
                                                                                        onChange={(e) => setSurahSearchQuery(e.target.value)}
                                                                                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 font-bold dark:text-white"
                                                                                        autoFocus
                                                                                    />
                                                                                </div>
                                                                                
                                                                                {/* Surah List */}
                                                                                <div className="overflow-y-auto flex-1 py-1 max-h-60 custom-scrollbar">
                                                                                    {quranData
                                                                                        .filter(s => s.name.includes(surahSearchQuery))
                                                                                        .map(s => (
                                                                                            <button
                                                                                                key={s.id}
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setManualHifzSurahId(s.id);
                                                                                                    setIsSurahDropdownOpen(false);
                                                                                                    setSurahSearchQuery('');
                                                                                                }}
                                                                                                className={`w-full text-right px-4 py-2 text-sm font-bold transition-all flex justify-between items-center ${
                                                                                                    currentHifzSurah?.id === s.id 
                                                                                                        ? 'bg-emerald-500 text-white' 
                                                                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                                                                                }`}
                                                                                            >
                                                                                                <span>سورة {s.name}</span>
                                                                                                <span className={`text-[10px] ${currentHifzSurah?.id === s.id ? 'text-white' : 'text-slate-400'}`}>
                                                                                                    {s.id}
                                                                                                </span>
                                                                                            </button>
                                                                                        ))
                                                                                    }
                                                                                    {quranData.filter(s => s.name.includes(surahSearchQuery)).length === 0 && (
                                                                                        <div className="text-center py-4 text-xs font-bold text-slate-400">لا توجد نتائج</div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                <div className="group relative inline-block">
                                                                    <span className="inline-flex justify-center items-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold cursor-help transition-all hover:bg-emerald-200 dark:hover:bg-emerald-900">ℹ</span>
                                                                    <div className="absolute z-50 bottom-full right-1/2 translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 font-medium leading-relaxed pointer-events-none">
                                                                        <div className="font-bold mb-1 text-emerald-400">💡 تنبيه للمعلم:</div>
                                                                        قد يضطر المعلم أحياناً إلى تعديل السورة يدوياً إذا كان الطالب قد أتم تسميع السورة المقترحة مسبقاً (مثل عرض سورة مريم بينما أتم الطالب تسميعها). يمكنك دائماً تغيير السورة من القائمة المنسدلة لإعادة محاذاة مسار الحفظ بشكل تلقائي.
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                                                            صفحات السورة: {allowedPages[0]} - {allowedPages[allowedPages.length - 1]}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block text-xs font-bold text-emerald-600 mb-2 mr-2">من الصفحة</label>
                                                            <div className="flex gap-2">
                                                                <div className="relative w-2/3" dir="rtl">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setIsHifzFromPageDropdownOpen(!isHifzFromPageDropdownOpen)}
                                                                        className="w-full flex justify-between items-center px-4 py-4 premium-glass border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold dark:text-white text-right shadow-sm hover:bg-white/10 dark:hover:bg-slate-800/10"
                                                                    >
                                                                        <span>صفحة {hifzFromPage || '---'}</span>
                                                                        <span className="text-emerald-600 dark:text-emerald-400 text-xs">▼</span>
                                                                    </button>

                                                                    {isHifzFromPageDropdownOpen && (
                                                                        <>
                                                                            <div className="fixed inset-0 z-40" onClick={() => setIsHifzFromPageDropdownOpen(false)} />
                                                                            <div className="absolute z-50 right-0 left-0 mt-2 max-h-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-100/50 dark:border-emerald-900/50 rounded-2xl shadow-2xl overflow-y-auto py-1 custom-scrollbar">
                                                                                {allowedPages.map(p => (
                                                                                    <button
                                                                                        key={p}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setHifzFromPage(p);
                                                                                            setIsHifzFromPageDropdownOpen(false);
                                                                                            if (pageAyahMap && pageAyahMap[p] && currentHifzSurah) {
                                                                                                const pageData = pageAyahMap[p][currentHifzSurah.id];
                                                                                                if (pageData && pageData.start) setHifzFromAyah(pageData.start);
                                                                                            }
                                                                                        }}
                                                                                        className={`w-full text-right px-4 py-3 text-sm font-bold transition-all ${
                                                                                            hifzFromPage === p 
                                                                                                ? 'bg-emerald-500 text-white' 
                                                                                                : 'text-slate-700 dark:text-slate-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20'
                                                                                        }`}
                                                                                    >
                                                                                        صفحة {p}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="w-1/3 relative"><span className="absolute -top-6 right-0 text-[10px] text-emerald-400 font-bold">آية</span><input type="number" value={hifzFromAyah || ''} min="1" max={currentHifzSurah?.ayahs} onFocus={() => hifzFromAyah === 1 && setHifzFromAyah('')} onBlur={() => hifzFromAyah === '' && setHifzFromAyah(1)} onChange={e => { const val = e.target.value; if (val === '') setHifzFromAyah(''); else { const parsed = parseInt(val); const max = currentHifzSurah?.ayahs || 286; if (parsed > max) setHifzFromAyah(max); else setHifzFromAyah(parsed); } }} className="w-full px-4 py-4 premium-glass border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-center dark:text-white" placeholder="آية" /></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-emerald-600 mb-2 mr-2">إلى الصفحة</label>
                                                            <div className="flex gap-2">
                                                                <div className="relative w-2/3" dir="rtl">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setIsHifzToPageDropdownOpen(!isHifzToPageDropdownOpen)}
                                                                        className="w-full flex justify-between items-center px-4 py-4 premium-glass border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold dark:text-white text-right shadow-sm hover:bg-white/10 dark:hover:bg-slate-800/10"
                                                                    >
                                                                        <span>صفحة {hifzToPage || '---'}</span>
                                                                        <span className="text-emerald-600 dark:text-emerald-400 text-xs">▼</span>
                                                                    </button>

                                                                    {isHifzToPageDropdownOpen && (
                                                                        <>
                                                                            <div className="fixed inset-0 z-40" onClick={() => setIsHifzToPageDropdownOpen(false)} />
                                                                            <div className="absolute z-50 right-0 left-0 mt-2 max-h-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-100/50 dark:border-emerald-900/50 rounded-2xl shadow-2xl overflow-y-auto py-1 custom-scrollbar">
                                                                                {allowedPages.map(p => (
                                                                                    <button
                                                                                        key={p}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setHifzToPage(p);
                                                                                            setIsHifzToPageDropdownOpen(false);
                                                                                            if (pageAyahMap && pageAyahMap[p] && currentHifzSurah) {
                                                                                                const pageData = pageAyahMap[p][currentHifzSurah.id];
                                                                                                if (pageData) {
                                                                                                    const endAyah = (typeof pageData === 'object') ? pageData.end : pageData;
                                                                                                    if (endAyah) setHifzToAyah(endAyah);
                                                                                                }
                                                                                            }
                                                                                        }}
                                                                                        className={`w-full text-right px-4 py-3 text-sm font-bold transition-all ${
                                                                                            hifzToPage === p 
                                                                                                ? 'bg-emerald-500 text-white' 
                                                                                                : 'text-slate-700 dark:text-slate-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20'
                                                                                        }`}
                                                                                    >
                                                                                        صفحة {p}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="w-1/3 relative"><span className="absolute -top-6 right-0 text-[10px] text-emerald-400 font-bold">آية</span><input type="number" value={hifzToAyah || ''} min="1" max={currentHifzSurah?.ayahs} onFocus={() => hifzToAyah === 1 && setHifzToAyah('')} onBlur={() => hifzToAyah === '' && setHifzToAyah(1)} onChange={e => { const val = e.target.value; if (val === '') setHifzToAyah(''); else { const parsed = parseInt(val); const max = currentHifzSurah?.ayahs || 286; if (parsed > max) setHifzToAyah(max); else setHifzToAyah(parsed); } }} className="w-full px-4 py-4 premium-glass border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-center dark:text-white" placeholder="آية" /></div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                        <div>
                                                            <label className="block text-xs font-bold text-red-600 mb-2 mr-2">عدد أخطاء الحفظ</label>
                                                            <input
                                                                type="number"
                                                                value={hifzErrors || 0}
                                                                onFocus={() => hifzErrors === 0 && setHifzErrors('')}
                                                                onBlur={() => hifzErrors === '' && setHifzErrors(0)}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    if (val === '') setHifzErrors('');
                                                                    else setHifzErrors(Math.max(0, parseFloat(val) || 0));
                                                                }}
                                                                min="0"
                                                                className="w-full px-6 py-4 premium-glass border-2 border-transparent focus:border-red-400 rounded-2xl outline-none transition-all font-bold text-lg dark:text-white"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-orange-600 mb-2 mr-2">عدد تنبيهات الحفظ</label>
                                                            <input
                                                                type="number"
                                                                value={hifzAlerts || 0}
                                                                onFocus={() => hifzAlerts === 0 && setHifzAlerts('')}
                                                                onBlur={() => hifzAlerts === '' && setHifzAlerts(0)}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    if (val === '') setHifzAlerts('');
                                                                    else setHifzAlerts(Math.max(0, parseFloat(val) || 0));
                                                                }}
                                                                min="0"
                                                                className="w-full px-6 py-4 premium-glass border-2 border-transparent focus:border-orange-400 rounded-2xl outline-none transition-all font-bold text-lg dark:text-white"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-emerald-600 mb-2 mr-2">صفحات نقية</label>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={hifzCleanPages || 0}
                                                                onFocus={() => hifzCleanPages === 0 && setHifzCleanPages('')}
                                                                onBlur={() => hifzCleanPages === '' && setHifzCleanPages(0)}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    if (val === '') setHifzCleanPages('');
                                                                    else setHifzCleanPages(Math.max(0, parseFloat(val) || 0));
                                                                }}
                                                                min="0"
                                                                className="w-full px-6 py-4 premium-glass border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none transition-all font-bold text-lg dark:text-white"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>

                                                </div>
                                            );
                                        }

                                        return null;
                                    })()}

                                    {/* Review Section - Hidden if mode is HIFZ only (and student is not Khatim/QuranicDay) */}
                                    {(sessionType === 'MURAJAAH' || sessionType === 'BOTH' || isKhatim || isQuranicDaySession) && (
                                        <div className="p-8 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800 shadow-inner">
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-indigo-800 dark:text-indigo-400 font-black text-xl flex items-center gap-3">
                                                        <span className="w-3 h-3 bg-indigo-500 rounded-full shadow-lg shadow-indigo-200 dark:shadow-none"></span>
                                                        المراجعة
                                                    </h3>
                                                    <div className="group relative">
                                                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 dark:bg-white text-white dark:text-slate-900 cursor-help text-[10px] font-black transition-all hover:scale-110 shadow-lg border border-white/20 dark:border-slate-200">
                                                            i
                                                        </div>
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full right-0 mb-3 w-80 p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-indigo-100 dark:border-indigo-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 transform translate-y-2 group-hover:translate-y-0">
                                                            <div className="text-indigo-600 dark:text-indigo-400 font-black text-sm mb-2 flex items-center gap-2">
                                                                <span>ℹ️</span> تنبيه هام للمُعلم
                                                            </div>
                                                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-bold">
                                                                يتم تسجيل المراجعة عادةً <span className="text-indigo-600 dark:text-indigo-400 underline underline-offset-4 decoration-2">نزولاً</span> (من أول آية إلى آخر آية في المصحف).
                                                                <br /><br />
                                                                أما إذا كانت مراجعة الطالب <span className="text-indigo-600 dark:text-indigo-400 underline underline-offset-4 decoration-2">تصاعدية</span>، فيجب تسجيلها من (آخر آية) إلى (أول آية).
                                                                <br /><br />
                                                                <span className="text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">⚠️ ملاحظة:</span> مراعاة الاتجاه ضروري جداً لضمان دقة حساب عدد الصفحات في التقرير.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {!isQuranicDaySession && (
                                                    <div className="flex bg-indigo-100/50 dark:bg-indigo-900/40 rounded-xl p-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setMurajaahType('MAJOR')}
                                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${murajaahType === 'MAJOR' ? 'bg-indigo-500 text-white shadow-md' : 'text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200/50'}`}
                                                        >
                                                            كبرى
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setMurajaahType('MINOR')}
                                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${murajaahType === 'MINOR' ? 'bg-indigo-500 text-white shadow-md' : 'text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200/50'}`}
                                                        >
                                                            صغرى
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setMurajaahType('BOTH')}
                                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${murajaahType === 'BOTH' ? 'bg-indigo-500 text-white shadow-md' : 'text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200/50'}`}
                                                        >
                                                            كلاهما
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-8">
                                                {reviewableSurahs.length > 0 ? (
                                                    <>
                                                        {(isQuranicDaySession || murajaahType === 'MAJOR' || murajaahType === 'BOTH') && (
                                                            <div className="p-4 premium-glass rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                                                <h4 className="text-sm font-black text-indigo-500 mb-4 px-2">{isQuranicDaySession ? 'المراجعة' : 'المراجعة الكبرى'}</h4>
                                                                {/* From Section */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">من سورة</label>
                                                                        <select
                                                                            value={mFromSurah || 1}
                                                                            onChange={e => setMFromSurah(parseInt(e.target.value))}
                                                                            className="w-full px-6 py-4 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold dark:text-white"
                                                                        >
                                                                            {reviewableSurahs.map(s => <option key={s.id} value={s.id} className="text-slate-900 dark:text-white dark:bg-slate-900">{s.name}</option>)}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">من آية</label>
                                                                        <input
                                                                            type="number"
                                                                            value={mFromAyah}
                                                                            min="1"
                                                                            max={quranData.find(s => s.id === mFromSurah)?.ayahs}
                                                                            onFocus={() => mFromAyah === 1 && setMFromAyah('')}
                                                                            onBlur={() => mFromAyah === '' && setMFromAyah(1)}
                                                                            onChange={e => {
                                                                                const val = e.target.value;
                                                                                if (val === '') setMFromAyah('');
                                                                                else {
                                                                                    const parsed = parseInt(val);
                                                                                    const max = quranData.find(s => s.id === mFromSurah)?.ayahs || 1;
                                                                                    if (parsed > max) setMFromAyah(max);
                                                                                    else setMFromAyah(parsed);
                                                                                }
                                                                            }}
                                                                            className="w-full px-6 py-4 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold dark:text-white"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* To Section */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">إلى سورة</label>
                                                                        <select
                                                                            value={mToSurah || 1}
                                                                            onChange={e => {
                                                                                const surahId = parseInt(e.target.value);
                                                                                const s = quranData.find(x => x.id === surahId);
                                                                                // Batch update to prevent flickering
                                                                                setMToSurah(surahId);
                                                                                if (s) setMToAyah(s.ayahs);
                                                                            }}
                                                                            className="w-full px-6 py-4 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold dark:text-white"
                                                                        >
                                                                            {reviewableSurahs.map(s => <option key={s.id} value={s.id} className="text-slate-900 dark:text-white dark:bg-slate-900">{s.name}</option>)}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">إلى آية</label>
                                                                        <input
                                                                            type="number"
                                                                            value={mToAyah}
                                                                            min="1"
                                                                            max={quranData.find(s => s.id === mToSurah)?.ayahs}
                                                                            onFocus={() => mToAyah === 1 && setMToAyah('')}
                                                                            onBlur={() => mToAyah === '' && setMToAyah(1)}
                                                                            onChange={e => {
                                                                                const val = e.target.value;
                                                                                if (val === '') setMToAyah('');
                                                                                else {
                                                                                    const parsed = parseInt(val);
                                                                                    const max = quranData.find(s => s.id === mToSurah)?.ayahs || 1;
                                                                                    if (parsed > max) setMToAyah(max);
                                                                                    else setMToAyah(parsed);
                                                                                }
                                                                            }}
                                                                            className="w-full px-6 py-4 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold dark:text-white"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Major Quality Metrics */}
                                                                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-800">
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-red-600 mb-2">أخطاء</label>
                                                                        <input type="number" value={errorsCount || 0} onFocus={() => errorsCount === 0 && setErrorsCount('')} onBlur={() => errorsCount === '' && setErrorsCount(0)} onChange={e => { const v = e.target.value; if (v === '') setErrorsCount(''); else setErrorsCount(Math.max(0, parseFloat(v) || 0)); }} min="0" className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-red-400 rounded-2xl outline-none font-bold dark:text-white" placeholder="0" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-orange-600 mb-2">تنبيهات</label>
                                                                        <input type="number" value={alertsCount || 0} onFocus={() => alertsCount === 0 && setAlertsCount('')} onBlur={() => alertsCount === '' && setAlertsCount(0)} onChange={e => { const v = e.target.value; if (v === '') setAlertsCount(''); else setAlertsCount(Math.max(0, parseFloat(v) || 0)); }} min="0" className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-orange-400 rounded-2xl outline-none font-bold dark:text-white" placeholder="0" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-emerald-600 mb-2">نقية</label>
                                                                        <input type="number" step="0.1" value={cleanPagesCount || 0} onFocus={() => cleanPagesCount === 0 && setCleanPagesCount('')} onBlur={() => cleanPagesCount === '' && setCleanPagesCount(0)} onChange={e => { const v = e.target.value; if (v === '') setCleanPagesCount(''); else setCleanPagesCount(Math.max(0, parseFloat(v) || 0)); }} min="0" className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none font-bold dark:text-white" placeholder="0" />
                                                                    </div>
                                                                </div>

                                                                {/* Major Auto Calc */}
                                                                <div className="bg-indigo-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 flex justify-between items-center mt-4">
                                                                    <div>
                                                                        <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block mb-1">النتيجة (كبرى)</span>
                                                                        <div className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                                                                            {resultString}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-indigo-400 premium-glass px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                                                        {pagesCount} صفحات فعلياً
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!isQuranicDaySession && (murajaahType === 'MINOR' || murajaahType === 'BOTH') && (
                                                            <div className="p-4 premium-glass rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm mt-4">
                                                                <h4 className="text-sm font-black text-indigo-500 mb-4 px-2">المراجعة الصغرى</h4>
                                                                {/* From Section */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">من سورة</label>
                                                                        <select
                                                                            value={minorMFromSurah || 1}
                                                                            onChange={e => setMinorMFromSurah(parseInt(e.target.value))}
                                                                            className="w-full px-6 py-4 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold dark:text-white"
                                                                        >
                                                                            {reviewableSurahs.map(s => <option key={s.id} value={s.id} className="text-slate-900 dark:text-white dark:bg-slate-900">{s.name}</option>)}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">من آية</label>
                                                                        <input
                                                                            type="number"
                                                                            value={minorMFromAyah}
                                                                            min="1"
                                                                            max={quranData.find(s => s.id === minorMFromSurah)?.ayahs}
                                                                            onFocus={() => minorMFromAyah === 1 && setMinorMFromAyah('')}
                                                                            onBlur={() => minorMFromAyah === '' && setMinorMFromAyah(1)}
                                                                            onChange={e => {
                                                                                const val = e.target.value;
                                                                                if (val === '') setMinorMFromAyah('');
                                                                                else {
                                                                                    const parsed = parseInt(val);
                                                                                    const max = quranData.find(s => s.id === minorMFromSurah)?.ayahs || 1;
                                                                                    if (parsed > max) setMinorMFromAyah(max);
                                                                                    else setMinorMFromAyah(parsed);
                                                                                }
                                                                            }}
                                                                            className="w-full px-6 py-4 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold dark:text-white"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* To Section */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">إلى سورة</label>
                                                                        <select
                                                                            value={minorMToSurah || 1}
                                                                            onChange={e => {
                                                                                const surahId = parseInt(e.target.value);
                                                                                setMinorMToSurah(surahId);
                                                                                // Set default To Ayah to the last ayah of the selected surah
                                                                                const s = quranData.find(x => x.id === surahId);
                                                                                if (s) setMinorMToAyah(s.ayahs);
                                                                            }}
                                                                            className="w-full px-6 py-4 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold dark:text-white"
                                                                        >
                                                                            {reviewableSurahs.map(s => <option key={s.id} value={s.id} className="text-slate-900 dark:text-white dark:bg-slate-900">{s.name}</option>)}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">إلى آية</label>
                                                                        <input
                                                                            type="number"
                                                                            value={minorMToAyah}
                                                                            min="1"
                                                                            max={quranData.find(s => s.id === minorMToSurah)?.ayahs}
                                                                            onFocus={() => minorMToAyah === 1 && setMinorMToAyah('')}
                                                                            onBlur={() => minorMToAyah === '' && setMinorMToAyah(1)}
                                                                            onChange={e => {
                                                                                const val = e.target.value;
                                                                                if (val === '') setMinorMToAyah('');
                                                                                else {
                                                                                    const parsed = parseInt(val);
                                                                                    const max = quranData.find(s => s.id === minorMToSurah)?.ayahs || 1;
                                                                                    if (parsed > max) setMinorMToAyah(max);
                                                                                    else setMinorMToAyah(parsed);
                                                                                }
                                                                            }}
                                                                            className="w-full px-6 py-4 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold dark:text-white"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {/* Minor Murajaah Quality Metrics */}
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-800">
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-red-500 mb-2 mr-2">أخطاء الصغرى</label>
                                                                        <input
                                                                            type="number"
                                                                            value={minorErrors || ''}
                                                                            onFocus={() => minorErrors === 0 && setMinorErrors('')}
                                                                            onBlur={() => minorErrors === '' && setMinorErrors(0)}
                                                                            onChange={e => { const v = e.target.value; if (v === '') setMinorErrors(''); else setMinorErrors(Math.max(0, parseFloat(v) || 0)); }}
                                                                            min="0"
                                                                            className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-red-400 rounded-2xl outline-none font-bold dark:text-white"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-orange-500 mb-2 mr-2">تنبيهات الصغرى</label>
                                                                        <input
                                                                            type="number"
                                                                            value={minorAlerts || ''}
                                                                            onFocus={() => minorAlerts === 0 && setMinorAlerts('')}
                                                                            onBlur={() => minorAlerts === '' && setMinorAlerts(0)}
                                                                            onChange={e => { const v = e.target.value; if (v === '') setMinorAlerts(''); else setMinorAlerts(Math.max(0, parseFloat(v) || 0)); }}
                                                                            min="0"
                                                                            className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-orange-400 rounded-2xl outline-none font-bold dark:text-white"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-emerald-500 mb-2 mr-2">نقية الصغرى</label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.1"
                                                                            value={minorCleanPages || ''}
                                                                            onFocus={() => minorCleanPages === 0 && setMinorCleanPages('')}
                                                                            onBlur={() => minorCleanPages === '' && setMinorCleanPages(0)}
                                                                            onChange={e => { const v = e.target.value; if (v === '') setMinorCleanPages(''); else setMinorCleanPages(Math.max(0, parseFloat(v) || 0)); }}
                                                                            min="0"
                                                                            className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none font-bold dark:text-white"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Minor Auto Calc */}
                                                                <div className="bg-indigo-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 flex justify-between items-center mt-4">
                                                                    <div>
                                                                        <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block mb-1">النتيجة (صغرى)</span>
                                                                        <div className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                                                                            {minorResultString}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-indigo-400 premium-glass px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                                                        {minorPagesCount} صفحات فعلياً
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-center py-10 bg-white/50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-indigo-200 dark:border-indigo-800">
                                                        <span className="text-indigo-400 font-bold italic">
                                                            لا توجد سور في المراجعة حتى الآن. سيتم إضافة السور تلقائياً بعد ختمها في "الحفظ الجديد".
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}


                                    <textarea
                                        placeholder="أي ملاحظات إضافية على التسميع..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="w-full p-8 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-slate-200 dark:focus:border-slate-700 rounded-[2.5rem] outline-none min-h-[150px] transition-all text-slate-600 dark:text-slate-300 font-medium"
                                    />

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="group relative w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-slate-300 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-4">
                                            {saving ? 'جاري الحفظ...' : editingSessionId ? 'تحديث تقرير اليوم 💎' : 'حفظ تقرير اليوم 💎'}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Side History */}
                    <div className="space-y-8">
                        <div className="premium-glass rounded-[3rem] p-8 sticky top-24">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-4">
                                <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-lg">📜</span>
                                سجل الإنجاز
                                <button
                                    type="button"
                                    onClick={() => setShowAllHistory(!showAllHistory)}
                                    className="mr-auto text-[10px] font-black px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 rounded-full transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                                >
                                    {showAllHistory ? 'عرض الأسبوع فقط' : 'إظهار السجل الكامل'}
                                </button>
                            </h3>
                            <div className="space-y-6 max-h-[calc(100vh-350px)] overflow-y-auto pl-2 custom-scrollbar rtl-scroll">
                                {(() => {
                                    let displayedHistory = [...history];
                                    if (!showAllHistory) {
                                        const oneWeekAgo = new Date();
                                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                                        displayedHistory = displayedHistory.filter(s => new Date(s.date) >= oneWeekAgo);
                                    }

                                    // Sort by date (desc) and then by Surah ID (desc) for precise latest-first ordering
                                    displayedHistory.sort((a, b) => {
                                        const dateDiff = new Date(b.date) - new Date(a.date);
                                        if (dateDiff !== 0) return dateDiff;
                                        
                                        // Tie-breaker: Higher Surah ID first (assuming 1->114 progression)
                                        const sA = quranData.find(s => normalizeSurahName(s.name) === normalizeSurahName(a.murajaahFromSurah))?.id || 0;
                                        const sB = quranData.find(s => normalizeSurahName(s.name) === normalizeSurahName(b.murajaahFromSurah))?.id || 0;
                                        if (sA !== sB) return sB - sA;

                                        return (b.id || 0) - (a.id || 0);
                                    });

                                    return displayedHistory.length > 0 ? displayedHistory.map((session, idx) => {
                                        const historyArray = displayedHistory;
                                        const currentDateFormatted = formatHijri(session.date, 'long');
                                        const prevDateFormatted = idx > 0 ? formatHijri(historyArray[idx - 1].date, 'long') : null;
                                        const showDateSeparator = currentDateFormatted !== prevDateFormatted;

                                    // Check if ANY session on this day achieved the goal
                                        let dayAchieved = false;
                                        if (showDateSeparator) {
                                            const sessionsOnThisDay = historyArray.filter(s => formatHijri(s.date, 'long') === currentDateFormatted);
                                            dayAchieved = sessionsOnThisDay.some(s => s.isGoalAchieved);
                                        }

                                    return (
                                        <div key={idx} className="space-y-6">
                                            {showDateSeparator && (
                                                <div className="flex items-center gap-4 py-2 mt-4 first:mt-0 relative">
                                                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                                                            📅 {currentDateFormatted}
                                                        </div>
                                                        {dayAchieved && (
                                                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-lg border border-green-200 shadow-sm z-10">
                                                                <span>🎯</span> حقق هدف اليوم
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                                                </div>
                                            )}
                                            <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-emerald-50 dark:hover:shadow-none transition-all cursor-default group relative overflow-hidden">
                                                {session.hifzSurah && (
                                                    <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
                                                )}

                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                                            {new Date(session.date).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditSession(session)}
                                                            className="text-slate-300 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                            title="تعديل الجلسة"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => promptDeleteSession(session.id)}
                                                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                            title="حذف الجلسة"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                    <span className="text-xs bg-emerald-100 text-emerald-700 font-black px-3 py-1 rounded-full shadow-sm">
                                                        {(session.pagesCount || 0).toFixed(1)} ص
                                                    </span>
                                                </div>

                                                {session.hifzSurah ? (
                                                    <div className="mb-4">
                                                        <div className="text-xs font-black text-emerald-600 dark:text-emerald-500 mb-1 uppercase tracking-tighter">الحفظ الجديد</div>
                                                        <div className="text-md font-bold text-slate-800 dark:text-slate-200">
                                                            سورة {session.hifzSurah} {(() => {
                                                                const surahObj = quranData.find(s => s.name === session.hifzSurah);
                                                                const isFullyDone = session.isFinishedSurah || (session.hifzFromAyah === 1 && surahObj && session.hifzToAyah === surahObj.ayahs);
                                                                return isFullyDone ? 'كاملةً' : (session.hifzFromPage === session.hifzToPage ? `(ص ${session.hifzFromPage})` : `(من ص ${session.hifzFromPage} إلى ${session.hifzToPage})`);
                                                            })()}
                                                        </div>
                                                        {(session.hifzFromAyah || session.hifzToAyah) && (
                                                            <div className="text-xs text-emerald-600 mt-1 font-medium">
                                                                الآيات: {session.hifzFromAyah || '?'} - {session.hifzToAyah || '?'}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (session.hifzToPage === 604 || isKhatim) ? (
                                                    <div className="mb-4">
                                                        <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl flex items-center gap-2">
                                                            <span className="text-lg">🏆</span>
                                                            <span className="text-xs font-bold text-amber-800">خاتم للقرآن الكريم</span>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {session.murajaahFromSurah && (
                                                    <div className="mb-4">
                                                        <div className="text-xs font-black text-indigo-500 dark:text-indigo-400 mb-1 uppercase tracking-tighter">المراجعة الكبرى</div>
                                                        <div className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                                            <div className="mb-1 text-slate-800 dark:text-slate-200 font-bold">
                                                                من سورة {session.murajaahFromSurah} <span className="text-xs text-slate-500 font-normal">(آية {session.murajaahFromAyah})</span> إلى سورة {session.murajaahToSurah} <span className="text-xs text-slate-500 font-normal">(آية {session.murajaahToAyah})</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {session.minorMurajaahFromSurah && (
                                                    <div className="mb-4">
                                                        <div className="text-xs font-black text-indigo-500 dark:text-indigo-400 mb-1 uppercase tracking-tighter">المراجعة الصغرى</div>
                                                        <div className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                                            <div className="mb-1 text-slate-800 dark:text-slate-200 font-bold">
                                                                من سورة {session.minorMurajaahFromSurah} <span className="text-xs text-slate-500 font-normal">(آية {session.minorMurajaahFromAyah})</span> إلى سورة {session.minorMurajaahToSurah} <span className="text-xs text-slate-500 font-normal">(آية {session.minorMurajaahToAyah})</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {(session.murajaahFromSurah || session.minorMurajaahFromSurah || session.hifzSurah) && (
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <div></div>
                                                        {((session.cleanPagesCount || 0) + (session.hifzCleanPages || 0) + (session.minorCleanPagesCount || 0)) > 0 && (
                                                            <div className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                                                                <span>✨</span>
                                                                <span>{((session.cleanPagesCount || 0) + (session.hifzCleanPages || 0) + (session.minorCleanPagesCount || 0))} نقية</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Quality Metrics Breakdown */}
                                                <div className="mb-4 p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                    <div className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-wider">مقاييس الجودة</div>

                                                    <div className="space-y-4">
                                                        {/* Hifz Metrics */}
                                                        {session.hifzSurah && (
                                                            <div>
                                                                <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 mb-2">إنجاز الحفظ:</div>
                                                                <div className="flex gap-2 text-[11px] flex-wrap">
                                                                    <span className={`px-2 py-0.5 rounded-lg font-bold ${session.hifzErrors > 0 ? 'bg-red-50 text-red-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                                                        ❌ {session.hifzErrors || 0} خطأ
                                                                    </span>
                                                                    <span className={`px-2 py-0.5 rounded-lg font-bold ${session.hifzAlerts > 0 ? 'bg-orange-50 text-orange-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                                                        ⚠️ {session.hifzAlerts || 0} تنبيه
                                                                    </span>
                                                                    <span className={`px-2 py-0.5 rounded-lg font-bold ${session.hifzCleanPages > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                                                        ✨ {session.hifzCleanPages || 0} نقية
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Divider if both exist */}
                                                        {session.hifzSurah && session.murajaahFromSurah && (
                                                            <div className="h-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                                                        )}

                                                        {/* Murajaah Metrics (Major) */}
                                                        {session.murajaahFromSurah && (
                                                            <div>
                                                                <div className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 mb-2">إنجاز المراجعة الكبرى:</div>
                                                                <div className="flex gap-2 text-[11px] flex-wrap">
                                                                    <span className={`px-2 py-0.5 rounded-lg font-bold ${session.errorsCount > 0 ? 'bg-red-50 text-red-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                                                        ❌ {session.errorsCount || 0} خطأ
                                                                    </span>
                                                                    <span className={`px-2 py-0.5 rounded-lg font-bold ${session.alertsCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                                                        ⚠️ {session.alertsCount || 0} تنبيه
                                                                    </span>
                                                                    <span className={`px-2 py-0.5 rounded-lg font-bold ${session.cleanPagesCount > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                                                        ✨ {session.cleanPagesCount || 0} نقية
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {session.minorMurajaahFromSurah && (
                                                            <div>
                                                                <div className="text-[9px] font-bold text-blue-500 dark:text-blue-400 mb-2">إنجاز المراجعة الصغرى:</div>
                                                                <div className="flex gap-2 text-[11px] flex-wrap">
                                                                    <span className={`px-2 py-0.5 rounded-lg font-bold ${(session.minorErrorsCount || 0) > 0 ? 'bg-red-50 text-red-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                                                        ❌ {session.minorErrorsCount || 0} خطأ
                                                                    </span>
                                                                    <span className={`px-2 py-0.5 rounded-lg font-bold ${(session.minorAlertsCount || 0) > 0 ? 'bg-orange-50 text-orange-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                                                        ⚠️ {session.minorAlertsCount || 0} تنبيه
                                                                    </span>
                                                                    <span className={`px-2 py-0.5 rounded-lg font-bold ${(session.minorCleanPagesCount || 0) > 0 ? 'bg-blue-50 text-blue-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                                                        ✨ {session.minorCleanPagesCount || 0} نقية
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {session.notes && (
                                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 italic">
                                                        " {session.notes} "
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <div className="text-center py-20">
                                        <div className="text-6xl mb-4 opacity-20">📭</div>
                                        <div className="text-slate-300 font-black">
                                            {showAllHistory ? 'لا يوجد سجلات بعد' : 'لا يوجد سجلات في هذا الأسبوع'}
                                        </div>
                                    </div>
                                )
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {student && (
                <AddStudentModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onAdd={() => {
                        setShowEditModal(false);
                        fetchStudent();
                    }}
                    halaqaId={student.halaqaId}
                    student={student}
                />
            )}
            <style jsx global>{`
        @keyframes pulse-slow {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(0.995); }
        }
        .animate-pulse-slow {
            animation: pulse-slow 3s ease-in-out infinite;
        }
    `}</style>

            {/* Delete Session Modal */}
            {showDeleteModal && (
                <div className="modal-overlay animate-fadeIn z-[110]" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content animate-slideUp max-w-md text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body py-8">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner ring-8 ring-red-50/50 dark:ring-red-900/10">
                                🗑️
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">هل أنت متأكد من حذف هذه الجلسة؟</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-2 font-bold">لن يمكن التراجع عن هذا الإجراء وسيتم حذفه من السجل نهائياً.</p>
                        </div>

                        <div className="modal-footer flex gap-4">
                            <button
                                onClick={handleDeleteSession}
                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-100 dark:shadow-none"
                            >
                                نعم، احذفها
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
                            >
                                تراجع
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Session Modal */}
            {showCancelModal && (
                <div className="modal-overlay animate-fadeIn z-[110]" onClick={() => setShowCancelModal(false)}>
                    <div className="modal-content animate-slideUp max-w-md text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body py-8">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner ring-8 ring-red-50/50 dark:ring-red-900/10">
                                ⚠️
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">هل أنت متأكد من إلغاء الجلسة؟</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-2 font-bold">لن يتم حفظ أي بيانات قمت بإدخالها حتى الآن.</p>
                        </div>

                        <div className="modal-footer flex gap-4">
                            <button
                                onClick={() => {
                                    setIsSessionActive(false);
                                    setSessionType(null);
                                    setEditingSessionId(null);
                                    setEditingSessionData(null);
                                    setShowCancelModal(false);
                                }}
                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-100 dark:shadow-none"
                            >
                                نعم، إلغاء
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
                            >
                                تراجع
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Exam Modal */}
            {showExamModal && (
                <div className="modal-overlay animate-fadeIn z-[100]" onClick={() => setShowExamModal(false)}>
                    <div className="modal-content animate-slideUp max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">📅 تحديد موعد الاختبار</h3>
                        </div>

                        <div className="modal-body space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">تاريخ الاختبار</label>
                                <input
                                    type="date"
                                    value={examDate}
                                    onChange={e => setExamDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-bold dark:text-white rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">وقت الاختبار (مثال: بعد المغرب)</label>
                                <input
                                    type="text"
                                    value={examTime}
                                    onChange={e => setExamTime(e.target.value)}
                                    placeholder="مثال: بعد صلاة العشاء"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-bold dark:text-white rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="modal-footer flex gap-3">
                            <button
                                onClick={() => setShowExamModal(false)}
                                className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleScheduleExam}
                                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100 dark:shadow-none"
                            >
                                حفظ الموعد
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Session Type Selection Modal */}
            {showTypeModal && (
                <div className="modal-overlay animate-fadeIn z-[100]" onClick={() => setShowTypeModal(false)}>
                    <div className="modal-content animate-slideUp max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header flex flex-col items-center text-center py-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-3xl sm:text-4xl mb-4 sm:mb-6 shadow-lg shadow-emerald-100 dark:shadow-none">✨</div>
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mb-2 sm:mb-3 uppercase tracking-tight">ماذا سنسمع اليوم؟</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-black text-base sm:text-lg">اختر نوع الجلسة للبدء في التسجيل</p>
                        </div>

                        <div className="modal-body">
                            <div className={`grid grid-cols-1 ${isKhatim || isQuranicDaySession ? 'max-w-xs mx-auto' : 'sm:grid-cols-3'} gap-4 sm:gap-6`}>
                                {[
                                    { id: 'HIFZ', label: 'حفظ جديد', icon: '📖', color: 'emerald', desc: 'تسميع المقدار اليومي', bg: 'bg-emerald-50 dark:bg-emerald-900/20', hidden: isKhatim || isQuranicDaySession },
                                    { id: 'MURAJAAH', label: 'مراجعة فقط', icon: '🔄', color: 'indigo', desc: 'تثبيت السور السابقة', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                                    { id: 'BOTH', label: 'الاثنين معاً', icon: '💎', color: 'amber', desc: 'حفظ ومراجعة شاملة', bg: 'bg-amber-50 dark:bg-amber-900/20', hidden: isKhatim || isQuranicDaySession },
                                ].filter(t => !t.hidden).map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => {
                                            setSessionType(type.id);
                                            setIsSessionActive(true);
                                            setShowTypeModal(false);
                                        }}
                                        className={`group p-6 sm:p-8 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 hover:border-emerald-500 transition-all text-center flex flex-col items-center gap-4 ${type.bg} relative overflow-hidden active:scale-95`}
                                    >
                                        <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-white dark:bg-slate-800 shadow-xl text-slate-800 dark:text-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-110 transition-all relative z-10`}>
                                            {type.icon}
                                        </div>
                                        <div className="relative z-10">
                                            <div className="font-black text-slate-800 dark:text-white text-lg sm:text-xl mb-1">{type.label}</div>
                                            <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{type.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setShowTypeModal(false)}
                            className="w-full mt-6 sm:mt-12 py-3 sm:py-4 text-slate-400 font-black hover:text-red-500 transition-colors flex items-center justify-center gap-2 flex-shrink-0"
                        >
                            <span>إغلاق</span>
                            <span>✕</span>
                        </button>
                    </div>
                </div>
            )}

            {student && (
                <AddStudentModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onAdd={() => {
                        setShowEditModal(false);
                        fetchStudent();
                    }}
                    halaqaId={student.halaqaId}
                    student={student}
                />
            )}
        </div>
    );
}
