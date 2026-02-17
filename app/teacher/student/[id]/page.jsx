'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../../../components/Navbar';
import { quranData } from '../../../data/quranData';
import { pageAyahMap } from '../../../data/pageAyahMap';
import { formatHijri } from '../../../utils/dateUtils';

import AddStudentModal from '../../../components/AddStudentModal';

export default function StudentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.id;

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);

    // Form State - Hifz
    const [hifzFromPage, setHifzFromPage] = useState('');
    const [hifzToPage, setHifzToPage] = useState('');
    const [hifzFromAyah, setHifzFromAyah] = useState(1);
    const [hifzToAyah, setHifzToAyah] = useState(1);

    // Form State - Murajaah
    const [mFromSurah, setMFromSurah] = useState(1);
    const [mFromAyah, setMFromAyah] = useState(1);
    const [mToSurah, setMToSurah] = useState(1);
    const [mToAyah, setMToAyah] = useState(1);

    const [pagesCount, setPagesCount] = useState(0);
    const [resultString, setResultString] = useState(''); // e.g. "جزء و 5 صفحات"
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [calculatedJuz, setCalculatedJuz] = useState(0);

    // Quality Metrics
    const [errorsCount, setErrorsCount] = useState(0); // For Murajaah
    const [alertsCount, setAlertsCount] = useState(0); // For Murajaah
    const [hifzErrors, setHifzErrors] = useState(0);    // For Hifz
    const [hifzAlerts, setHifzAlerts] = useState(0);    // For Hifz
    const [hifzCleanPages, setHifzCleanPages] = useState(0); // For Hifz
    const [cleanPagesCount, setCleanPagesCount] = useState(0); // For Murajaah

    const [showEditModal, setShowEditModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeEvent, setActiveEvent] = useState(null);
    const [isQuranicDaySession, setIsQuranicDaySession] = useState(false);
    const [sessionType, setSessionType] = useState(null); // 'HIFZ', 'MURAJAAH', 'BOTH'
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);

    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
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
                    const storedUser = sessionStorage.getItem('user');
                    if (storedUser) {
                        const currentUser = JSON.parse(storedUser);
                        const assignedRes = await fetch(`/api/quranic-events/assignments?eventId=${event.id}`);
                        if (assignedRes.ok) {
                            const assignments = await assignedRes.json();
                            const isAssigned = assignments.some(a =>
                                a.studentId === parseInt(studentId) &&
                                a.teacherId === currentUser.id
                            );
                            setIsQuranicDaySession(isAssigned);
                            // Store assignment status in a separate state if needed, 
                            // but setting the toggle is enough to "activate" it.
                            if (!isAssigned) {
                                // If not assigned, they can still record a normal session, 
                                // but we might want to hide the toggle or show it as disabled.
                                // The user said " يكون عنده تسجيل التسميع في الأيام القرآنية فقط" 
                                // which implies if he's in the event, he records for it.
                                // I'll add a check in the UI.
                            }
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
        if (student) {
            calculateTotalProgress();
            applySmartDefaults();
        }
    }, [student, history]);

    const applySmartDefaults = () => {
        if (!student || !history || history.length === 0) return;

        // 1. Find the latest session for the CURRENT Surah
        const currentSurahName = quranData.find(s => s.id === student.currentHifzSurahId)?.name;
        if (!currentSurahName) return;

        // Sort history by date desc
        const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Find last session that engaged with this surah
        const lastSession = sortedHistory.find(s => s.hifzSurah === currentSurahName);

        if (lastSession && lastSession.hifzToPage) {
            const lastPage = lastSession.hifzToPage;
            const nextPage = lastPage + 1;

            // Check if nextPage is within Surah boundaries
            const allowedPages = getSurahPages(student.currentHifzSurahId);
            if (allowedPages.includes(nextPage)) {
                setHifzFromPage(nextPage);

                // Set default From Ayah logic (first ayah of that page)
                let startAyah = 1;
                if (pageAyahMap && pageAyahMap[nextPage] && pageAyahMap[nextPage][student.currentHifzSurahId]) {
                    const pageData = pageAyahMap[nextPage][student.currentHifzSurahId];
                    startAyah = (typeof pageData === 'object') ? pageData.start : pageData;
                }
                setHifzFromAyah(startAyah);

                // Calculate To Page based on target
                const target = student.dailyTargetPages || 1;
                let potentialToPage = nextPage + (Math.ceil(target) - 1);

                // Cap at Surah end
                const lastAllowed = allowedPages[allowedPages.length - 1];
                if (potentialToPage > lastAllowed) potentialToPage = lastAllowed;

                setHifzToPage(potentialToPage);

                // Set default To Ayah logic (last ayah of that page)
                if (pageAyahMap && pageAyahMap[potentialToPage] && pageAyahMap[potentialToPage][student.currentHifzSurahId]) {
                    const pageData = pageAyahMap[potentialToPage][student.currentHifzSurahId];
                    const endAyah = (typeof pageData === 'object') ? pageData.end : pageData;
                    setHifzToAyah(endAyah);
                }
            }
        } else {
            // No history for this Surah (Fresh start)
            // Apply daily target to the start page
            const surah = quranData.find(s => s.id === student.currentHifzSurahId);
            if (surah) {
                const startPage = surah.startPage;
                const allowedPages = getSurahPages(student.currentHifzSurahId);

                const target = student.dailyTargetPages || 1;
                let potentialToPage = startPage + (Math.ceil(target) - 1);

                const lastAllowed = allowedPages[allowedPages.length - 1];
                if (potentialToPage > lastAllowed) potentialToPage = lastAllowed;

                setHifzToPage(potentialToPage);

                // Set ToAyah for the calculated ToPage
                if (pageAyahMap && pageAyahMap[potentialToPage] && pageAyahMap[potentialToPage][student.currentHifzSurahId]) {
                    const pageData = pageAyahMap[potentialToPage][student.currentHifzSurahId];
                    const endAyah = (typeof pageData === 'object') ? pageData.end : pageData;
                    setHifzToAyah(endAyah);
                }
            }
        }
    };

    const fetchStudent = async () => {
        try {
            const response = await fetch(`/api/students`);
            const students = await response.json();
            const found = students.find(s => s.id === parseInt(studentId));
            setStudent(found);

            // Set default pages based on current surah
            const surah = quranData.find(s => s.id === (found?.currentHifzSurahId || 114));
            if (surah) {
                setHifzFromPage(surah.startPage);
                setHifzToPage(surah.startPage);
                setHifzFromAyah(1);

                // Set default To Ayah to the last ayah of this surah on the start page
                if (pageAyahMap && pageAyahMap[surah.startPage] && pageAyahMap[surah.startPage][surah.id]) {
                    const pageData = pageAyahMap[surah.startPage][surah.id];
                    const lastAyahOnFirstPage = (typeof pageData === 'object') ? pageData.end : pageData;
                    setHifzToAyah(lastAyahOnFirstPage);
                } else {
                    setHifzToAyah(surah.ayahs); // Fallback
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchHistory = async () => {
        try {
            const response = await fetch(`/api/sessions?studentId=${studentId}`);
            if (response.ok) {
                const data = await response.json();

                // Filter for sessions within the last 7 days
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const filtered = data.filter(s => new Date(s.date) >= oneWeekAgo);

                setHistory(filtered);
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

    const calculateMurajaah = () => {
        const fromS = quranData.find(s => s.id === mFromSurah);
        const toS = quranData.find(s => s.id === mToSurah);
        if (!fromS || !toS) return;

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
                    const sData = pageAyahMap[i][surahId];
                    if (sData) {
                        const start = (typeof sData === 'object') ? sData.start : sData;
                        const end = (typeof sData === 'object') ? sData.end : sData;

                        if (ayahNum >= start && ayahNum <= end) {
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
                const sData = pageAyahMap[p][sId];
                const sStart = (typeof sData === 'object') ? sData.start : 1;
                const sEnd = (typeof sData === 'object') ? sData.end : sData;
                const count = sEnd - sStart + 1;

                totalAyahsOnPage += count;

                if (sId < surahId) {
                    ayahsBefore += count;
                } else if (sId === surahId) {
                    if (isEnd) {
                        ayahsBefore += (ayahNum - sStart + 1);
                    } else {
                        ayahsBefore += (ayahNum - sStart);
                    }
                }
            }

            if (totalAyahsOnPage === 0) return p;

            return p + (ayahsBefore / totalAyahsOnPage);
        };

        const startPos = getExactPosition(mFromSurah, mFromAyah, false);
        const endPos = getExactPosition(mToSurah, mToAyah, true);

        let val = endPos - startPos;
        if (val < 0) val = Math.abs(val);

        // Round to nearest 0.5
        val = Math.ceil(val * 2) / 2;

        if (val === 0 && (mFromSurah !== mToSurah || mFromAyah !== mToAyah)) {
            val = 0.5;
        }

        setPagesCount(val);
        setResultString(`${val} صفحة`);

    };

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
            let surahByName = quranData.find(s => s.name === student.hifzProgress || s.name === student.hifzProgress.replace('سورة ', ''));

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

    // Auto-calculate clean pages whenever dependencies change
    useEffect(() => {
        const total = Math.floor(pagesCount || 0);
        const clean = Math.max(0, total - (parseInt(errorsCount) || 0) - (parseInt(alertsCount) || 0));
        setCleanPagesCount(clean);
    }, [pagesCount, errorsCount, alertsCount]);

    // Auto-calculate hifz clean pages whenever dependencies change
    useEffect(() => {
        if (sessionType === 'HIFZ' || sessionType === 'BOTH') {
            const from = parseInt(hifzFromPage);
            const to = parseInt(hifzToPage);
            if (!isNaN(from) && !isNaN(to)) {
                const total = Math.max(0, (to - from) + 1);
                const clean = Math.max(0, total - (parseInt(hifzErrors) || 0) - (parseInt(hifzAlerts) || 0));
                setHifzCleanPages(clean);
            }
        }
    }, [hifzFromPage, hifzToPage, hifzErrors, hifzAlerts, sessionType]);

    useEffect(() => {
        calculateMurajaah();
    }, [mFromSurah, mFromAyah, mToSurah, mToAyah]);

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

            // Goal Calculation
            // 1. Get Hifz Target (student.dailyTargetPages)
            const hifzTarget = student?.dailyTargetPages || 0;

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
            if (mFromSurah && mToSurah) {
                // We need to know pages of Review. 
                // Since we don't have direct page inputs for Review (only Surah/Ayah), 
                // we rely on the helper `calculatePages` which sets `pagesCount`.
                // `pagesCount` likely includes Hifz if `calculatePages` considers it?
                // Let's assume `pagesCount` = Total Pages.
                // So ReviewDone = TotalPages - HifzDone.
                reviewDone = parseFloat(pagesCount) - hifzDone;
                if (reviewDone < 0) reviewDone = 0;
            }

            // 4. Compare
            // Goal Achieved logic:
            // - If Session is Hifz Only: Must meet Hifz target. Review target is ignored for THIS session's status.
            // - If Session is Review Only: Must meet Review target. Hifz target is ignored.
            // - If Session is Both: Must meet both.

            const includesHifz = sessionType === 'HIFZ' || sessionType === 'BOTH';
            const includesReview = sessionType === 'MURAJAAH' || sessionType === 'BOTH';

            const hifzMet = (isKhatim || isQuranicDay || !includesHifz) ? true : (hifzTarget > 0 ? hifzDone >= hifzTarget : true);
            const reviewMet = (!includesReview || reviewTarget <= 0) ? true : (reviewDone >= reviewTarget);

            const isGoalAchieved = hifzMet && reviewMet;

            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    // Only send hifz data if (includesHifz) AND (not Khatim) AND (not a Quranic Day session)
                    hifzSurah: (includesHifz && !isKhatim && !isQuranicDay) ? currentSurah?.name : null,
                    hifzFromPage: (includesHifz && !isKhatim && !isQuranicDay) ? parseInt(hifzFromPage) : null,
                    hifzToPage: (includesHifz && !isKhatim && !isQuranicDay) ? parseInt(hifzToPage) : null,
                    hifzFromAyah: (includesHifz && !isKhatim && !isQuranicDay) ? parseInt(hifzFromAyah) : null,
                    hifzToAyah: (includesHifz && !isKhatim && !isQuranicDay) ? parseInt(hifzToAyah) : null,

                    murajaahFromSurah: includesReview ? fromSurahName : null,
                    murajaahFromAyah: includesReview ? parseInt(mFromAyah) : null,
                    murajaahToSurah: includesReview ? toSurahName : null,
                    murajaahToAyah: includesReview ? parseInt(mToAyah) : null,

                    // Summary Stats (Total of Hifz + Murajaah)
                    pagesCount: parseFloat(pagesCount) + (includesHifz ? hifzDone : 0),
                    resultString,
                    notes,
                    errorsCount: (parseInt(errorsCount) || 0) + (includesHifz ? (parseInt(hifzErrors) || 0) : 0),
                    alertsCount: (parseInt(alertsCount) || 0) + (includesHifz ? (parseInt(hifzAlerts) || 0) : 0),
                    cleanPagesCount: (parseInt(cleanPagesCount) || 0) + (includesHifz ? (parseInt(hifzCleanPages) || 0) : 0),

                    // Specific Breakdowns (kept for record)
                    hifzErrors: parseInt(hifzErrors) || 0,
                    hifzAlerts: parseInt(hifzAlerts) || 0,
                    hifzCleanPages: parseInt(hifzCleanPages) || 0,
                    isFinishedSurah: includesHifz ? isFinishedSurah : false,
                    isGoalAchieved,
                    quranicEventId: isQuranicDaySession ? activeEvent?.id : null
                })
            });

            if (response.ok) {
                toast.success('تم تسجيل التسميع بنجاح');
                setNotes('');
                setErrorsCount(0);
                setAlertsCount(0);
                setHifzErrors(0);
                setHifzAlerts(0);
                setHifzCleanPages(0);
                setCleanPagesCount(0);
                setIsSessionActive(false); // End session
                setSessionType(null);
                fetchStudent();
                fetchHistory();
            }
        } catch (error) {
            toast.error('خطأ في الحفظ');
        } finally {
            setSaving(false);
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

            if (!isFromValid) {
                setMFromSurah(reviewableSurahs[0].id);
                // Also reset Ayah to 1 to avoid out of bounds
                setMFromAyah(1);
            }
            if (!isToValid) {
                setMToSurah(reviewableSurahs[0].id);
            }
        }
    }, [reviewableSurahs, mFromSurah, mToSurah]);

    // Auto-update mToAyah when mToSurah changes
    useEffect(() => {
        const toSurah = quranData.find(s => s.id === mToSurah);
        if (toSurah) {
            setMToAyah(toSurah.ayahs);
        }
    }, [mToSurah]);


    const handleDelete = () => {
        toast((t) => (
            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 flex flex-col gap-4 min-w-[300px]">
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

    if (loading && !student) return <div className="p-20 text-center font-bold text-emerald-600 animate-pulse">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-noto rtl transition-colors duration-300" dir="rtl">
            <Navbar
                userType="teacher"
                userName={user ? `أهلًا أستاذ ${getFirstName(user.name)} 👋` : 'أهلًا أستاذ 👋'}
                onLogout={() => router.push('/login')}
            />

            <main className="max-w-6xl mx-auto px-4 py-10">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/teacher')}
                    className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors group"
                >
                    <span className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:shadow-md transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </span>
                    عودة للقائمة الرئيسية
                </button>

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
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 shadow-lg shadow-slate-200 dark:shadow-none"
                    >
                        <span>🖨️</span> طباعة التقرير
                    </button>
                </div>

                {/* Header Card */}
                <div className="bg-[var(--card-bg)] rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 dark:shadow-none border border-[var(--border-main)] mb-10 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-50 rounded-full -translate-x-10 -translate-y-10 opacity-50"></div>

                    <div className="flex items-center gap-8 relative z-10">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-lg shadow-emerald-200">
                            {student?.name?.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{getFirstName(student?.name)}</h1>
                            <div className="flex items-center gap-2 mt-2">
                                {isKhatim ? (
                                    <span className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 rounded-full text-sm font-black shadow-lg shadow-amber-200 flex items-center gap-2">
                                        <span>🏆</span>
                                        خاتم القرآن الكريم
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                        المحفوظ: {student?.hifzProgress}
                                    </span>
                                )}
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                    الخطة: {student?.reviewPlan}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6 relative z-10">
                        <div className="text-center bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm px-8 py-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">إجمالي الأجزاء</span>
                            <span className="text-3xl font-black text-slate-700 dark:text-white">{isKhatim ? '30' : calculatedJuz}</span>
                            {!isKhatim && <span className="text-sm font-bold text-slate-400 dark:text-slate-500 mr-1">جزء</span>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Recording Form */}
                    <div className="lg:col-span-2 space-y-10">
                        {!isSessionActive ? (
                            <div className="bg-[var(--card-bg)] rounded-[3rem] p-12 shadow-xl shadow-slate-200/50 dark:shadow-none border border-[var(--border-main)] text-center relative overflow-hidden group">
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
                            <form onSubmit={handleSaveSession} className="bg-[var(--card-bg)] rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 dark:shadow-none border border-[var(--border-main)] relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-10">
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                                        <span className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">✍️</span>
                                        {sessionType === 'HIFZ' ? 'تسجيل حفظ جديد' : sessionType === 'MURAJAAH' ? 'تسجيل مراجعة' : 'تسجيل حفظ ومراجعة'}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm('هل أنت متأكد من إلغاء الجلسة الحالية؟ لن يتم حفظ البيانات.')) {
                                                setIsSessionActive(false);
                                                setSessionType(null);
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-black hover:bg-red-100 transition-colors"
                                    >
                                        إلغاء ✕
                                    </button>
                                </div>




                                {/* Quranic Day Active Banner/Toggle */}
                                {activeEvent && isQuranicDaySession && (
                                    <div className="mb-8 p-6 rounded-[2rem] border-2 bg-amber-50 border-amber-300 shadow-lg shadow-amber-100 flex justify-between items-center animate-pulse-slow">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-amber-100">🏆</div>
                                            <div>
                                                <div className="font-black text-amber-900 leading-tight">دورة الأيام القرآنية: {activeEvent.name}</div>
                                                <div className="text-xs font-bold text-amber-600">هذا الطالب مسند إليك في هذه الدورة. سيتم احتساب الجلسة في الإحصائيات.</div>
                                            </div>
                                        </div>
                                        <div className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm">
                                            تسجيل معتمد
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-10">
                                    {/* Hifz Section - Logic Refined */}
                                    {(() => {
                                        // If Session is Review Only, and not specialized mode, don't show Hifz block at all
                                        if (sessionType === 'MURAJAAH' && !isKhatim && !isQuranicDaySession) return null;

                                        // If student is Khatim, show congrats
                                        if (isKhatim) return (
                                            <div className="p-8 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-[2.5rem] border-2 border-amber-200 shadow-inner animate-in zoom-in duration-500">
                                                <div className="text-center">
                                                    <div className="text-6xl mb-4">🎉</div>
                                                    <h3 className="text-2xl font-black text-amber-800 mb-2">مبارك! الطالب خاتم للقرآن الكريم</h3>
                                                    <p className="text-amber-600 font-bold">اتم الطالب حفظ كتاب الله كاملاً - ينتقل الآن لمرحلة التثبيت والمراجعة المكثفة</p>
                                                </div>
                                            </div>
                                        );

                                        // If Quranic Day is active, show banner
                                        if (isQuranicDaySession) return (
                                            <div className="p-8 bg-gradient-to-br from-indigo-50 to-amber-50 rounded-[2.5rem] border-2 border-amber-200 shadow-inner">
                                                <div className="text-center">
                                                    <div className="text-6xl mb-4">🛡️</div>
                                                    <h3 className="text-2xl font-black text-amber-800 mb-2">وضع الأيام القرآنية نشط</h3>
                                                    <p className="text-amber-600 font-bold">تم قفل قسم الحفظ - التركيز الآن على المراجعة المكثفة فقط</p>
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
                                                                <div className="flex justify-center gap-3"><button type="button" onClick={() => handleCompleteExam(activeExam.id)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">✅ تم اجتياز الاختبار</button><button type="button" onClick={() => { setSelectedExam(activeExam); setExamDate(activeExam.examDate ? new Date(activeExam.examDate).toISOString().split('T')[0] : ''); setExamTime(activeExam.examTime || ''); setShowExamModal(true); }} className="px-6 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-50 transition-all">✏️ تعديل الموعد</button></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );

                                            return (
                                                <div className="p-8 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800 shadow-inner">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h3 className="text-emerald-800 dark:text-emerald-400 font-black text-xl flex items-center gap-3">
                                                            <span className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200 dark:shadow-none"></span>
                                                            الحفظ الجديد (سورة {currentSurah?.name})
                                                        </h3>
                                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                                                            صفحات السورة: {allowedPages[0]} - {allowedPages[allowedPages.length - 1]}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block text-xs font-bold text-emerald-600 mb-2 mr-2">من الصفحة</label>
                                                            <div className="flex gap-2">
                                                                <select value={hifzFromPage} onChange={e => { const p = parseInt(e.target.value); setHifzFromPage(p); if (pageAyahMap && pageAyahMap[p] && currentSurah) { const pageData = pageAyahMap[p][currentSurah.id]; if (pageData && pageData.start) setHifzFromAyah(pageData.start); } }} className="w-2/3 px-4 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-lg dark:text-white" > {allowedPages.map(p => <option key={p} value={p} className="text-slate-900 dark:text-white dark:bg-slate-900">صفحة {p}</option>)} </select>
                                                                <div className="w-1/3 relative"><span className="absolute -top-6 right-0 text-[10px] text-emerald-400 font-bold">آية</span><input type="number" value={hifzFromAyah} min="1" max={currentSurah?.ayahs} onFocus={() => hifzFromAyah === 1 && setHifzFromAyah('')} onBlur={() => hifzFromAyah === '' && setHifzFromAyah(1)} onChange={e => { const val = e.target.value; if (val === '') setHifzFromAyah(''); else { const parsed = parseInt(val); const max = currentSurah?.ayahs || 286; if (parsed > max) setHifzFromAyah(max); else setHifzFromAyah(parsed); } }} className="w-full px-4 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-center dark:text-white" placeholder="آية" /></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-emerald-600 mb-2 mr-2">إلى الصفحة</label>
                                                            <div className="flex gap-2">
                                                                <select value={hifzToPage} onChange={e => { const p = parseInt(e.target.value); setHifzToPage(p); if (pageAyahMap && pageAyahMap[p] && currentSurah) { const pageData = pageAyahMap[p][currentSurah.id]; if (pageData) { const endAyah = (typeof pageData === 'object') ? pageData.end : pageData; if (endAyah) setHifzToAyah(endAyah); } } }} className="w-2/3 px-4 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-lg dark:text-white" > {allowedPages.map(p => <option key={p} value={p} className="text-slate-900 dark:text-white dark:bg-slate-900">صفحة {p}</option>)} </select>
                                                                <div className="w-1/3 relative"><span className="absolute -top-6 right-0 text-[10px] text-emerald-400 font-bold">آية</span><input type="number" value={hifzToAyah} min="1" max={currentSurah?.ayahs} onFocus={() => hifzToAyah === 1 && setHifzToAyah('')} onBlur={() => hifzToAyah === '' && setHifzToAyah(1)} onChange={e => { const val = e.target.value; if (val === '') setHifzToAyah(''); else { const parsed = parseInt(val); const max = currentSurah?.ayahs || 286; if (parsed > max) setHifzToAyah(max); else setHifzToAyah(parsed); } }} className="w-full px-4 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-center dark:text-white" placeholder="آية" /></div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                        <div>
                                                            <label className="block text-xs font-bold text-red-600 mb-2 mr-2">عدد أخطاء الحفظ</label>
                                                            <input
                                                                type="number"
                                                                value={hifzErrors}
                                                                onFocus={() => hifzErrors === 0 && setHifzErrors('')}
                                                                onBlur={() => hifzErrors === '' && setHifzErrors(0)}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    if (val === '') setHifzErrors('');
                                                                    else setHifzErrors(Math.max(0, parseInt(val) || 0));
                                                                }}
                                                                min="0"
                                                                className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-red-400 rounded-2xl outline-none transition-all font-bold text-lg dark:text-white"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-orange-600 mb-2 mr-2">عدد تنبيهات الحفظ</label>
                                                            <input
                                                                type="number"
                                                                value={hifzAlerts}
                                                                onFocus={() => hifzAlerts === 0 && setHifzAlerts('')}
                                                                onBlur={() => hifzAlerts === '' && setHifzAlerts(0)}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    if (val === '') setHifzAlerts('');
                                                                    else setHifzAlerts(Math.max(0, parseInt(val) || 0));
                                                                }}
                                                                min="0"
                                                                className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-orange-400 rounded-2xl outline-none transition-all font-bold text-lg dark:text-white"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-emerald-600 mb-2 mr-2">صفحات نقية</label>
                                                            <input
                                                                type="number"
                                                                value={hifzCleanPages}
                                                                onFocus={() => hifzCleanPages === 0 && setHifzCleanPages('')}
                                                                onBlur={() => hifzCleanPages === '' && setHifzCleanPages(0)}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    if (val === '') setHifzCleanPages('');
                                                                    else setHifzCleanPages(Math.max(0, parseInt(val) || 0));
                                                                }}
                                                                min="0"
                                                                className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none transition-all font-bold text-lg dark:text-white"
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
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-indigo-800 dark:text-indigo-400 font-black text-xl flex items-center gap-3">
                                                    <span className="w-3 h-3 bg-indigo-500 rounded-full shadow-lg shadow-indigo-200 dark:shadow-none"></span>
                                                    المراجعة
                                                </h3>
                                                <span className="text-[10px] font-bold text-indigo-400 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
                                                    السور التي انتهى منها الطالب فقط
                                                </span>
                                            </div>

                                            <div className="space-y-8">
                                                {reviewableSurahs.length > 0 ? (
                                                    <>
                                                        {/* From Section */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">من سورة</label>
                                                                <select
                                                                    value={mFromSurah}
                                                                    onChange={e => setMFromSurah(parseInt(e.target.value))}
                                                                    className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold dark:text-white"
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
                                                                    className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold dark:text-white"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* To Section */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">إلى سورة</label>
                                                                <select
                                                                    value={mToSurah}
                                                                    onChange={e => {
                                                                        const surahId = parseInt(e.target.value);
                                                                        setMToSurah(surahId);
                                                                        // Set default To Ayah to the last ayah of the selected surah
                                                                        const s = quranData.find(x => x.id === surahId);
                                                                        if (s) setMToAyah(s.ayahs);
                                                                    }}
                                                                    className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold dark:text-white"
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
                                                                    className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none transition-all font-bold dark:text-white"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Quality Metrics for Murajaah */}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                            <div>
                                                                <label className="block text-xs font-bold text-red-600 mb-2 mr-2">عدد الأخطاء</label>
                                                                <input
                                                                    type="number"
                                                                    value={errorsCount}
                                                                    onFocus={() => errorsCount === 0 && setErrorsCount('')}
                                                                    onBlur={() => errorsCount === '' && setErrorsCount(0)}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        if (val === '') setErrorsCount('');
                                                                        else setErrorsCount(Math.max(0, parseInt(val) || 0));
                                                                    }}
                                                                    min="0"
                                                                    className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-red-400 rounded-2xl outline-none transition-all font-bold text-lg dark:text-white"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-orange-600 mb-2 mr-2">عدد التنبيهات</label>
                                                                <input
                                                                    type="number"
                                                                    value={alertsCount}
                                                                    onFocus={() => alertsCount === 0 && setAlertsCount('')}
                                                                    onBlur={() => alertsCount === '' && setAlertsCount(0)}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        if (val === '') setAlertsCount('');
                                                                        else setAlertsCount(Math.max(0, parseInt(val) || 0));
                                                                    }}
                                                                    min="0"
                                                                    className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-orange-400 rounded-2xl outline-none transition-all font-bold text-lg dark:text-white"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-emerald-600 mb-2 mr-2">صفحات نقية</label>
                                                                <input
                                                                    type="number"
                                                                    value={cleanPagesCount}
                                                                    onFocus={() => cleanPagesCount === 0 && setCleanPagesCount('')}
                                                                    onBlur={() => cleanPagesCount === '' && setCleanPagesCount(0)}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        if (val === '') setCleanPagesCount('');
                                                                        else setCleanPagesCount(Math.max(0, parseInt(val) || 0));
                                                                    }}
                                                                    min="0"
                                                                    className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none transition-all font-bold text-lg dark:text-white"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Auto Calculation Result */}
                                                        <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 flex flex-col items-center">
                                                            <span className="text-xs font-black text-indigo-300 dark:text-indigo-400 uppercase tracking-widest mb-2">النتيجة التلقائية</span>
                                                            <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                                                                {resultString}
                                                            </div>
                                                            <div className="mt-2 text-[10px] font-bold text-indigo-300">
                                                                {pagesCount} صفحات فعلياً
                                                            </div>
                                                            {pagesCount > 0 && (
                                                                <div className="mt-3 flex gap-2 text-xs flex-wrap justify-center">
                                                                    {errorsCount > 0 && (
                                                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg font-bold">
                                                                            ❌ {errorsCount} خطأ
                                                                        </span>
                                                                    )}
                                                                    {alertsCount > 0 && (
                                                                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg font-bold">
                                                                            ⚠️ {alertsCount} تنبيه
                                                                        </span>
                                                                    )}
                                                                    {cleanPagesCount > 0 && (
                                                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
                                                                            ✨ {cleanPagesCount} نقية
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
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
                                            {saving ? 'جاري الحفظ...' : 'حفظ تقرير اليوم 💎'}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Side History */}
                    <div className="space-y-8">
                        <div className="bg-[var(--card-bg)] rounded-[3rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-[var(--border-main)] sticky top-24">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-4">
                                <span className="p-2 bg-slate-100 rounded-xl text-lg">📜</span>
                                سجل الإنجاز
                            </h3>
                            <div className="space-y-6 max-h-[calc(100vh-350px)] overflow-y-auto pl-2 custom-scrollbar rtl-scroll">
                                {history.length > 0 ? history.map((session, idx) => (
                                    <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-emerald-50 dark:hover:shadow-none transition-all cursor-default group relative overflow-hidden">
                                        {session.hifzSurah && (
                                            <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
                                        )}
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[10px] font-black text-slate-400 bg-slate-200 px-2 py-1 rounded-lg">
                                                {formatHijri(session.date, 'long')}
                                            </span>
                                            <span className="text-xs bg-emerald-100 text-emerald-700 font-black px-3 py-1 rounded-full">
                                                {session.pagesCount} ص
                                            </span>
                                        </div>

                                        {/* Goal Status Badge */}
                                        <div className="mb-3">
                                            {session.isGoalAchieved ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-lg border border-green-100">
                                                    <span>🎯</span> حقق الهدف اليومي
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-100">
                                                    <span>➖</span> لم يحقق الهدف
                                                </span>
                                            )}
                                        </div>

                                        {session.hifzSurah ? (
                                            <div className="mb-4">
                                                <div className="text-xs font-black text-emerald-600 dark:text-emerald-500 mb-1 uppercase tracking-tighter">الحفظ الجديد</div>
                                                <div className="text-md font-bold text-slate-800 dark:text-slate-200">
                                                    سورة {session.hifzSurah} {session.hifzFromPage === session.hifzToPage ? `(ص ${session.hifzFromPage})` : `(من ص ${session.hifzFromPage} إلى ${session.hifzToPage})`}
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
                                                <div className="text-xs font-black text-indigo-500 dark:text-indigo-400 mb-1 uppercase tracking-tighter">المراجعة</div>
                                                <div className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    <div className="mb-1 text-slate-800 dark:text-slate-200 font-bold">
                                                        من سورة {session.murajaahFromSurah} <span className="text-xs text-slate-500 font-normal">(آية {session.murajaahFromAyah})</span> إلى سورة {session.murajaahToSurah} <span className="text-xs text-slate-500 font-normal">(آية {session.murajaahToAyah})</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-bold">
                                                        {session.resultString}
                                                    </div>
                                                </div>
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

                                                {/* Murajaah Metrics */}
                                                {session.murajaahFromSurah && (
                                                    <div>
                                                        <div className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 mb-2">إنجاز المراجعة:</div>
                                                        <div className="flex gap-2 text-[11px] flex-wrap">
                                                            <span className={`px-2 py-0.5 rounded-lg font-bold ${(session.errorsCount - (session.hifzErrors || 0)) > 0 ? 'bg-red-50 text-red-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                                                ❌ {(session.errorsCount - (session.hifzErrors || 0)) || 0} خطأ
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-lg font-bold ${(session.alertsCount - (session.hifzAlerts || 0)) > 0 ? 'bg-orange-50 text-orange-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                                                ⚠️ {(session.alertsCount - (session.hifzAlerts || 0)) || 0} تنبيه
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-lg font-bold ${(session.cleanPagesCount - (session.hifzCleanPages || 0)) > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-white/50 dark:bg-slate-900/50 text-slate-300'}`}>
                                                                ✨ {(session.cleanPagesCount - (session.hifzCleanPages || 0)) || 0} نقية
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {session.notes && (
                                            <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-400 italic">
                                                " {session.notes} "
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-center py-20">
                                        <div className="text-6xl mb-4 opacity-20">📭</div>
                                        <div className="text-slate-300 font-black">لا يوجد سجلات بعد</div>
                                    </div>
                                )}
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

            {/* Exam Modal */}
            {showExamModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">📅 تحديد موعد الاختبار</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">تاريخ الاختبار</label>
                                <input
                                    type="date"
                                    value={examDate}
                                    onChange={e => setExamDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-bold text-slate-800 dark:text-white border-2 border-transparent focus:border-indigo-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">وقت الاختبار (مثال: بعد المغرب)</label>
                                <input
                                    type="text"
                                    value={examTime}
                                    onChange={e => setExamTime(e.target.value)}
                                    placeholder="مثال: بعد صلاة العشاء"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-bold text-slate-800 dark:text-white border-2 border-transparent focus:border-indigo-500 outline-none transition-colors"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleScheduleExam}
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    حفظ الموعد
                                </button>
                                <button
                                    onClick={() => setShowExamModal(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Session Type Selection Modal */}
            {showTypeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 shadow-3xl animate-in zoom-in-95 duration-300 relative border border-slate-100 dark:border-slate-800">
                        <div className="text-center mb-12">
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 rounded-[2rem] flex items-center justify-center text-5xl mx-auto mb-6 shadow-lg shadow-emerald-100 dark:shadow-none">✨</div>
                            <h3 className="text-4xl font-black text-slate-800 dark:text-white mb-3">ماذا سنسمع اليوم؟</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">اختر نوع الجلسة للبدء في التسجيل</p>
                        </div>

                        <div className={`grid grid-cols-1 ${isKhatim || isQuranicDaySession ? 'md:grid-cols-1 max-w-xs mx-auto' : 'md:grid-cols-3'} gap-6`}>
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
                                    className={`group p-8 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 hover:border-${type.color}-500 transition-all text-center flex flex-col items-center gap-4 ${type.bg} relative overflow-hidden`}
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 bg-${type.color}-500/5 rounded-full -translate-y-12 translate-x-12`}></div>
                                    <div className={`w-20 h-20 bg-white dark:bg-slate-800 shadow-xl shadow-${type.color}-100 dark:shadow-none text-${type.color}-600 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 group-active:scale-90 transition-all relative z-10`}>
                                        {type.icon}
                                    </div>
                                    <div className="relative z-10">
                                        <div className="font-black text-slate-800 dark:text-white text-xl mb-1">{type.label}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowTypeModal(false)}
                            className="w-full mt-12 py-4 text-slate-400 font-black hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>إغلاق</span>
                            <span>✕</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

