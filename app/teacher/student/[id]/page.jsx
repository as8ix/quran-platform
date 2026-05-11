'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '@/app/components/Navbar';
import LoadingScreen from '@/app/components/LoadingScreen';
import BaseModal from '@/app/components/Global/BaseModal';
import { quranData } from '@/app/data/quranData';
import { pageAyahMap } from '@/app/data/pageAyahMap';
import { formatHijri } from '@/app/utils/dateUtils';

import AddStudentModal from '@/app/components/AddStudentModal';
import StudentHeader from '@/app/components/Student/StudentHeader';
import SessionManagement from '@/app/components/Student/SessionManagement';
import SessionStarter from '@/app/components/Student/SessionStarter';
import HifzRecorder from '@/app/components/Student/HifzRecorder';
import MurajaahRecorder from '@/app/components/Student/MurajaahRecorder';
import SessionFooter from '@/app/components/Student/SessionFooter';
import SessionHistoryList from '@/app/components/Student/SessionHistoryList';
import SessionTypePicker from '@/app/components/Student/SessionTypePicker';
import ExamManager from '@/app/components/Student/ExamManager';
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

export default function StudentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.id;

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
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
                const hifzDoneInLast = (latestM.hifzToPage && latestM.hifzFromPage) ? (latestM.hifzToPage - latestM.hifzFromPage + 1) : 0;
                const pagesDone = (latestM.pagesCount || 0) - hifzDoneInLast;

                if (pagesDone >= (targetPages * 0.6)) {
                    if (Number(latestM.murajaahToAyah) >= Number(lastSurah.ayahs)) {
                        startSId = lastSurah.id + 1;
                        startA = 1;
                    } else {
                        startSId = lastSurah.id;
                        startA = Number(latestM.murajaahToAyah) + 1;
                    }
                } else {
                    const lastFromSurah = quranData.find(s => normalizeSurahName(s.name) === normalizeSurahName(latestM.murajaahFromSurah));
                    startSId = lastFromSurah ? lastFromSurah.id : lastSurah.id;
                    startA = Number(latestM.murajaahFromAyah) || 1;
                }
            }
        }

        // Loop back to the start of reviewable portion if we exceed An-Nas (114)
        if (startSId > 114) {
            startSId = reviewableSurahs.length > 0 ? reviewableSurahs[0].id : 1;
            startA = 1;
        }

        const startPos = getExactPosition(startSId, startA, false);
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
            const count = sEnd - sStart + 1;

            totalAyahsOnPage += count;

            if (Number(sId) < Number(surahId)) {
                ayahsBefore += count;
            } else if (Number(sId) === Number(surahId)) {
                let effectiveAyah = Number(ayahNum);
                if (effectiveAyah < sStart) effectiveAyah = sStart;
                if (effectiveAyah > sEnd) effectiveAyah = sEnd;

                if (isEnd) {
                    ayahsBefore += (effectiveAyah - sStart + 1);
                } else {
                    ayahsBefore += (effectiveAyah - sStart);
                }
            }
        }

        if (totalAyahsOnPage === 0) return p;

        return p + (ayahsBefore / totalAyahsOnPage);
    };

    const getAyahAtPosition = (pos) => {
        let pageNum = Math.floor(pos);
        let fraction = pos - pageNum;
        
        // If it's an exact integer > 1, treat it as the end of the previous page
        // because "Position 228.0" means the completion of page 227.
        if (fraction < 0.001 && pageNum > 1) {
            pageNum = pageNum - 1;
            fraction = 0.999;
        }

        const pageData = pageAyahMap[String(pageNum)];
        if (!pageData) return null;

        const surahsOnPage = Object.keys(pageData).map(Number).sort((a, b) => a - b);
        if (surahsOnPage.length === 0) return null;

        // Linear interpolation of ayahs across the page
        let totalAyahs = 0;
        surahsOnPage.forEach(sid => {
            const data = pageData[String(sid)];
            const start = (typeof data === 'object') ? data.start : 1;
            const end = (typeof data === 'object') ? data.end : data;
            totalAyahs += (end - start + 1);
        });

        let targetAyahIndex = Math.floor(fraction * totalAyahs);
        if (fraction >= 0.99) targetAyahIndex = totalAyahs - 1;

        let currentSum = 0;
        for (const sid of surahsOnPage) {
            const data = pageData[String(sid)];
            const start = (typeof data === 'object') ? data.start : 1;
            const end = (typeof data === 'object') ? data.end : data;
            const count = (end - start + 1);
            if (targetAyahIndex < currentSum + count) {
                const ayah = start + (targetAyahIndex - currentSum);
                return { surahId: sid, ayah: Math.max(start, Math.min(end, ayah)) };
            }
            currentSum += count;
        }

        const lastSid = surahsOnPage[surahsOnPage.length - 1];
        const lastData = pageData[String(lastSid)];
        return { surahId: lastSid, ayah: (typeof lastData === 'object' ? lastData.end : lastData) };
    };

    const majorMurajaahData = useMemo(() => {
        if (!mFromSurah || !mToSurah) return { pages: 0, str: '0 صفحة' };
        const startPos = getExactPosition(Number(mFromSurah), Number(mFromAyah), false);
        const endPos = getExactPosition(Number(mToSurah), Number(mToAyah), true);
        let val = endPos - startPos;
        if (val < 0) val = Math.abs(val);
        if (val === 0 && (Number(mFromSurah) !== Number(mToSurah) || Number(mFromAyah) !== Number(mToAyah))) val = 0.5;
        val = Math.ceil(val * 2) / 2;
        return { pages: val, str: `${val} صفحة` };
    }, [mFromSurah, mFromAyah, mToSurah, mToAyah]);

    const minorMurajaahData = useMemo(() => {
        if (!minorMFromSurah || !minorMToSurah) return { pages: 0, str: '0 صفحة' };
        const startPos = getExactPosition(Number(minorMFromSurah), Number(minorMFromAyah), false);
        const endPos = getExactPosition(Number(minorMToSurah), Number(minorMToAyah), true);
        let val = endPos - startPos;
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

        let currentId = student.currentHifzSurahId;

        // Fallback: If ID is missing or 114 (default) using trusted Name logic
        if (student.hifzProgress) {
            let surahByName = null;
            if (student.hifzProgress) {
                surahByName = quranData.find(s => s.name === student.hifzProgress || s.name === student.hifzProgress.replace('سورة ', ''));
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

        // --- NEW LOGIC START ---
        // 1. Pages completed "below" the current Surah (Reverse Order: 114 -> CurrentId + 1)
        // This is simply: (Page 604) - (Start Page of CurrentId + 1) + 1
        // Example: If at Kahf (18). Completed 19 (Maryam) to 114 (Nas).
        // Maryam starts at 305. 604 - 305 + 1 = 300 pages.

        // Find next surah to determine the start of the "completed block"
        const nextSurah = quranData.find(s => s.id === currentId + 1);
        let completedPages = 0;

        if (nextSurah) {
            // All pages from the start of next surah to the end of the Quran (604) are finished
            completedPages = 604 - nextSurah.startPage + 1;
        } else {
            // If current is 114 (Nas), next is undefined.
            // Means we are at the very beginning (reverse).
            // Completed pages is 0 (or just whatever is within Nas)
            completedPages = 0; // Will be handled by currentSurahPages logic if any
        }

        // 2. Pages completed WITHIN the Current Surah
        let currentSurahPages = 0;
        const currentSurahObj = quranData.find(s => s.id === currentId);

        if (currentSurahObj) {
            // Check history for latest progress in this Surah
            const lastSession = history.find(s => s.hifzSurah === currentSurahObj.name);

            if (lastSession && lastSession.hifzToPage) {
                // If we have progress in this surah
                // Progress is (Reached Page - Start Page of Surah) + 1
                // We trust 'hifzToPage' is accurate for where they stopped in this surah.
                const offset = lastSession.hifzToPage - currentSurahObj.startPage + 1;
                currentSurahPages = Math.max(0, offset); // Ensure non-negative
            } else {
                // No session yet for this surah? Assume 0 progress in it.
                // Or if just "started", it's 0.
                currentSurahPages = 0;
            }
        }

        // Total Pages
        const totalPages = completedPages + currentSurahPages;
        const juz = totalPages / 20;

        // setCalculatedJuz(Number.isInteger(juz) ? juz : juz.toFixed(1));
        // Use 1 decimal place consistently for clarity unless 0
        setCalculatedJuz(juz === 0 ? 0 : juz.toFixed(1));

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

        const fPage = parseInt(hifzFromPage);
        const fAyah = parseInt(hifzFromAyah) || 1;
        const target = parseTarget(student.dailyTargetPages);
        const currentSId = student.currentHifzSurahId || 114;
        
        if (isNaN(fPage)) return;

        // Predict To Page
        let tPage = fPage + (Math.ceil(target) - 1);
        const allowedPages = getSurahPages(currentSId);
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
    }, [hifzFromPage, hifzFromAyah, student?.dailyTargetPages, isSessionActive, sessionType, student?.currentHifzSurahId]);

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
        let hDone = 0;
        if (hifzToPage && hifzFromPage) {
            hDone = (parseInt(hifzToPage) - parseInt(hifzFromPage)) + 1;
        }
        const hifzClean = Math.max(0, hDone - (parseInt(hifzErrors) || 0) - (parseInt(hifzAlerts) || 0));
        setHifzCleanPages(hifzClean);

    }, [pagesCount, errorsCount, alertsCount, minorPagesCount, minorErrors, minorAlerts, hifzToPage, hifzFromPage, hifzErrors, hifzAlerts, isSessionActive, editingSessionId]);

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

        const currentSurah = quranData.find(s => s.id === (student?.currentHifzSurahId || 114));
        const nextSurahPages = getSurahPages(currentSurah?.id);
        const isFinishedSurah = !isKhatim && parseInt(hifzToPage) === nextSurahPages[nextSurahPages.length - 1];

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
            let hifzDone = 0;
            if (!isKhatim && hifzToPage && hifzFromPage) {
                hifzDone = (parseInt(hifzToPage) - parseInt(hifzFromPage)) + 1;
            }

            // Review Done (pagesCount is strict, but sometimes it's calculated from Ayahs. 
            // In Murajaah, pagesCount is usually (toPage - fromPage + 1). 
            // We use the `pagesCount` variable which comes from state (auto calculated or manual override needed?)
            // Actually, `pagesCount` state is set by `calculatePages`. Check if that covers Murajaah only or total?
            // In this component, `pagesCount` seems to be Total Pages? No.
            // Let's re-verify `calculatePages`.
            // Wait, `pagesCount` in state effectively stores the calculated result. 
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
                    resultString,
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
                setEditingSessionData(null);
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
        setPagesCount(session.pagesCount || 0);
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

    const currentSurah = quranData.find(s => s.id === (student?.currentHifzSurahId || 114));
    const allowedPages = getSurahPages(currentSurah?.id || 114);

    // Check if student is Khatim (completed the Quran)
    // Khatim = completed 30 Juz + Fatiha (marked as 31)
    const isKhatim = student?.juzCount === 31;

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
                <StudentHeader 
                    student={student}
                    isKhatim={isKhatim}
                    calculatedJuz={calculatedJuz}
                    onEdit={() => setShowEditModal(true)}
                    onDelete={handleDelete}
                    onPrint={() => router.push(`/teacher/student/${student.id}/report`)}
                    deleting={deleting}
                    getFirstName={getFirstName}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Recording Form */}
                    <div className="lg:col-span-2 space-y-10">
                        {!isSessionActive ? (
                            <SessionStarter 
                                isKhatim={isKhatim}
                                isQuranicDaySession={isQuranicDaySession}
                                onStartSession={() => setShowTypeModal(true)}
                            />
                        ) : (
                            <form onSubmit={handleSaveSession}>
                                <SessionManagement
                                    sessionType={sessionType}
                                    sessionDate={sessionDate}
                                    setSessionDate={setSessionDate}
                                    setShowCancelModal={setShowCancelModal}
                                    activeEvent={activeEvent}
                                    isQuranicDaySession={isQuranicDaySession}
                                >
                                    <HifzRecorder
                                        sessionType={sessionType}
                                        isKhatim={isKhatim}
                                        isQuranicDaySession={isQuranicDaySession}
                                        activeExam={activeExam}
                                        editingSessionData={editingSessionData}
                                        currentSurah={currentSurah}
                                        allowedPages={allowedPages}
                                        hifzFromPage={hifzFromPage}
                                        setHifzFromPage={setHifzFromPage}
                                        hifzToPage={hifzToPage}
                                        setHifzToPage={setHifzToPage}
                                        hifzFromAyah={hifzFromAyah}
                                        setHifzFromAyah={setHifzFromAyah}
                                        hifzToAyah={hifzToAyah}
                                        setHifzToAyah={setHifzToAyah}
                                        hifzErrors={hifzErrors}
                                        setHifzErrors={setHifzErrors}
                                        hifzAlerts={hifzAlerts}
                                        setHifzAlerts={setHifzAlerts}
                                        hifzCleanPages={hifzCleanPages}
                                        setHifzCleanPages={setHifzCleanPages}
                                        pageAyahMap={pageAyahMap}
                                        setSelectedExam={setSelectedExam}
                                        setExamDate={setExamDate}
                                        setExamTime={setExamTime}
                                        setShowExamModal={setShowExamModal}
                                        handleCompleteExam={handleCompleteExam}
                                    />

                                    <MurajaahRecorder
                                        sessionType={sessionType}
                                        isKhatim={isKhatim}
                                        isQuranicDaySession={isQuranicDaySession}
                                        murajaahType={murajaahType}
                                        setMurajaahType={setMurajaahType}
                                        reviewableSurahs={reviewableSurahs}
                                        mFromSurah={mFromSurah}
                                        setMFromSurah={setMFromSurah}
                                        mFromAyah={mFromAyah}
                                        setMFromAyah={setMFromAyah}
                                        mToSurah={mToSurah}
                                        setMToSurah={setMToSurah}
                                        mToAyah={mToAyah}
                                        setMToAyah={setMToAyah}
                                        errorsCount={errorsCount}
                                        setErrorsCount={setErrorsCount}
                                        alertsCount={alertsCount}
                                        setAlertsCount={setAlertsCount}
                                        cleanPagesCount={cleanPagesCount}
                                        setCleanPagesCount={setCleanPagesCount}
                                        resultString={resultString}
                                        pagesCount={pagesCount}
                                        minorMFromSurah={minorMFromSurah}
                                        setMinorMFromSurah={setMinorMFromSurah}
                                        minorMFromAyah={minorMFromAyah}
                                        setMinorMFromAyah={setMinorMFromAyah}
                                        minorMToSurah={minorMToSurah}
                                        setMinorMToSurah={setMinorMToSurah}
                                        minorMToAyah={minorMToAyah}
                                        setMinorMToAyah={setMinorMToAyah}
                                        minorErrors={minorErrors}
                                        setMinorErrors={setMinorErrors}
                                        minorAlerts={minorAlerts}
                                        setMinorAlerts={setMinorAlerts}
                                        minorCleanPages={minorCleanPages}
                                        setMinorCleanPages={setMinorCleanPages}
                                        minorResultString={minorResultString}
                                        minorPagesCount={minorPagesCount}
                                        quranData={quranData}
                                    />

                                    <SessionFooter
                                        notes={notes}
                                        setNotes={setNotes}
                                        saving={saving}
                                        editingSessionId={editingSessionId}
                                    />
                                </SessionManagement>
                            </form>
                        )}
                    </div>

                    {/* Side History */}
                    <div className="space-y-8">
                        <SessionHistoryList
                            history={history}
                            showAllHistory={showAllHistory}
                            setShowAllHistory={setShowAllHistory}
                            onEditSession={handleEditSession}
                            onDeleteSession={promptDeleteSession}
                            isKhatim={isKhatim}
                            quranData={quranData}
                            normalizeSurahName={normalizeSurahName}
                        />
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
            <BaseModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="حذف الجلسة"
                maxWidth="max-w-md"
                titleColor="text-rose-600 dark:text-rose-500"
            >
                <div className="text-center py-4">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner ring-8 ring-red-50/50 dark:ring-red-900/10">
                        🗑️
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">هل أنت متأكد؟</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 font-bold">لن يمكن التراجع عن هذا الإجراء وسيتم حذف الجلسة من السجل نهائياً.</p>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={handleDeleteSession}
                            className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-all active:scale-95"
                        >
                            نعم، احذفها
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all"
                        >
                            تراجع
                        </button>
                    </div>
                </div>
            </BaseModal>

            {/* Cancel Session Modal */}
            <BaseModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title="إلغاء الجلسة"
                maxWidth="max-w-md"
                titleColor="text-amber-600 dark:text-amber-500"
            >
                <div className="text-center py-4">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner ring-8 ring-amber-50/50 dark:ring-amber-900/10">
                        ⚠️
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">هل تود إلغاء الجلسة؟</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 font-bold">لن يتم حفظ أي بيانات قمت بإدخالها في هذا التقرير حتى الآن.</p>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                setIsSessionActive(false);
                                setSessionType(null);
                                setEditingSessionId(null);
                                setEditingSessionData(null);
                                setShowCancelModal(false);
                            }}
                            className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-all active:scale-95"
                        >
                            نعم، إلغاء
                        </button>
                        <button
                            onClick={() => setShowCancelModal(false)}
                            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all"
                        >
                            تراجع
                        </button>
                    </div>
                </div>
            </BaseModal>

            {/* Modals */}
            <SessionTypePicker
                isOpen={showTypeModal}
                onClose={() => setShowTypeModal(false)}
                onSelectType={(type) => {
                    setSessionType(type);
                    setIsSessionActive(true);
                    setShowTypeModal(false);
                }}
                isKhatim={isKhatim}
                activeEvent={activeEvent}
                isQuranicDaySession={isQuranicDaySession}
            />

            <ExamManager
                isOpen={showExamModal}
                onClose={() => setShowExamModal(false)}
                examDate={examDate}
                setExamDate={setExamDate}
                examTime={examTime}
                setExamTime={setExamTime}
                onSave={handleScheduleExam}
            />

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
