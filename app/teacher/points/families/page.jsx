'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../../../components/Navbar';
import BackButton from '../../../components/BackButton';
import { useTheme } from '../../../components/ThemeProvider';
import LoadingScreen from '../../../components/LoadingScreen';

export default function FamiliesPage() {
    const router = useRouter();
    const { isDarkMode, mounted } = useTheme();
    const [user, setUser] = useState(null);
    const [halaqaId, setHalaqaId] = useState(null);
    const [halaqaName, setHalaqaName] = useState('');

    const [students, setStudents] = useState([]);
    const [families, setFamilies] = useState([]);
    const [assignments, setAssignments] = useState({}); // { studentId: familyId | null }
    const [lines, setLines] = useState([]);

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' | 'unassigned' | 'assigned'

    // Connection interaction states
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [hoveredFamilyId, setHoveredFamilyId] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const containerRef = useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            const params = new URLSearchParams(window.location.search);
            const hId = params.get('halaqaId') || parsedUser.halaqaId;
            if (hId) {
                setHalaqaId(parseInt(hId));
                fetchHalaqaInfo(parseInt(hId));
                fetchData(parseInt(hId));
            } else {
                toast.error('لم يتم تحديد حلقة دراسية');
                router.push('/teacher');
            }
        } else {
            router.push('/login');
        }
    }, []);

    const fetchHalaqaInfo = async (hId) => {
        try {
            const res = await fetch(`/api/halaqas?id=${hId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) setHalaqaName(data[0].name);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchData = async (hId) => {
        setLoading(true);
        try {
            // Fetch students & families
            const [stRes, famRes] = await Promise.all([
                fetch(`/api/students?halaqaId=${hId}&t=${Date.now()}`),
                fetch(`/api/families?halaqaId=${hId}&t=${Date.now()}`)
            ]);

            if (stRes.ok && famRes.ok) {
                const studentsData = await stRes.json();
                const familiesData = await famRes.json();

                setStudents(studentsData);
                setFamilies(familiesData);

                // Build initial assignment map
                const map = {};
                studentsData.forEach(s => {
                    map[s.id] = s.familyId || null;
                });
                setAssignments(map);
            } else {
                toast.error('خطأ في تحميل البيانات');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    // Calculate line coordinates
    const updateLineCoords = useCallback(() => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        
        const newLines = [];
        Object.entries(assignments).forEach(([sId, fId]) => {
            if (!fId) return;
            const sEl = document.getElementById(`student-dot-${sId}`);
            const fEl = document.getElementById(`family-dot-${fId}`);
            if (sEl && fEl) {
                const sRect = sEl.getBoundingClientRect();
                const fRect = fEl.getBoundingClientRect();
                
                const x1 = sRect.left + sRect.width / 2 - containerRect.left;
                const y1 = sRect.top + sRect.height / 2 - containerRect.top;
                const x2 = fRect.left + fRect.width / 2 - containerRect.left;
                const y2 = fRect.top + fRect.height / 2 - containerRect.top;
                
                const familyIndex = families.findIndex(f => f.id === fId);
                const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316'];
                const color = colors[familyIndex % colors.length] || '#6366f1';

                newLines.push({
                    studentId: parseInt(sId),
                    familyId: fId,
                    x1, y1, x2, y2, color
                });
            }
        });
        setLines(newLines);
    }, [assignments, families]);

    // Track layout changes
    useEffect(() => {
        updateLineCoords();
        const t1 = setTimeout(updateLineCoords, 100);
        const t2 = setTimeout(updateLineCoords, 400);
        
        window.addEventListener('resize', updateLineCoords);
        window.addEventListener('scroll', updateLineCoords, true);
        
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            window.removeEventListener('resize', updateLineCoords);
            window.removeEventListener('scroll', updateLineCoords, true);
        };
    }, [assignments, students, families, searchTerm, filterType, updateLineCoords]);

    // Handle mouse move for drawing line active state
    const handleMouseMove = (e) => {
        if (!selectedStudentId || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top
        });
    };

    // Connection Click logic
    const handleStudentDotClick = (studentId, e) => {
        e.stopPropagation();
        if (selectedStudentId === studentId) {
            setSelectedStudentId(null);
        } else {
            setSelectedStudentId(studentId);
        }
    };

    const handleFamilyDotClick = (familyId, e) => {
        e.stopPropagation();
        if (selectedStudentId) {
            setAssignments(prev => ({
                ...prev,
                [selectedStudentId]: familyId
            }));
            setSelectedStudentId(null);
            toast.success('تم التوصيل بنجاح!', { duration: 800 });
        } else {
            toast.error('الرجاء اختيار طالب أولاً لتوصيله');
        }
    };

    const disconnectStudent = (studentId) => {
        setAssignments(prev => ({
            ...prev,
            [studentId]: null
        }));
        toast.error('تم فصل الطالب عن المجموعة', { icon: '🔌', duration: 800 });
    };

    // Add new family
    const handleCreateFamily = async (e) => {
        e.preventDefault();
        if (!newFamilyName.trim()) return;

        try {
            const res = await fetch('/api/families', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newFamilyName,
                    halaqaId
                })
            });

            if (res.ok) {
                const newFam = await res.json();
                setFamilies(prev => [...prev, newFam]);
                setNewFamilyName('');
                toast.success(`تم إنشاء مجموعة ${newFam.name} بنجاح`);
            } else {
                toast.error('فشل في إنشاء المجموعة');
            }
        } catch (err) {
            toast.error('حدث خطأ أثناء الاتصال بالسيرفر');
        }
    };

    // Delete a family
    const handleDeleteFamily = async (familyId, name) => {
        if (!confirm(`هل أنت متأكد من حذف مجموعة (${name})؟ سيتم إلغاء توزيع طلابها.`)) return;

        try {
            const res = await fetch(`/api/families?id=${familyId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setFamilies(prev => prev.filter(f => f.id !== familyId));
                // Remove local assignments to this family
                setAssignments(prev => {
                    const next = { ...prev };
                    Object.keys(next).forEach(key => {
                        if (next[key] === familyId) next[key] = null;
                    });
                    return next;
                });
                toast.success(`تم حذف مجموعة ${name}`);
            } else {
                toast.error('فشل في حذف المجموعة');
            }
        } catch (err) {
            toast.error('حدث خطأ');
        }
    };

    // Auto distribute unassigned students
    const handleAutoDistribute = () => {
        if (families.length === 0) {
            toast.error('الرجاء إضافة عائلة أو مجموعة واحدة على الأقل أولاً');
            return;
        }

        const unassigned = students.filter(s => !assignments[s.id]);
        if (unassigned.length === 0) {
            toast.success('كل الطلاب موزعون بالفعل! 🎉');
            return;
        }

        const newAssignments = { ...assignments };
        unassigned.forEach((student, index) => {
            const family = families[index % families.length];
            newAssignments[student.id] = family.id;
        });

        setAssignments(newAssignments);
        toast.success(`تم توزيع ${unassigned.length} طالب تلقائياً بالتساوي مابين الأسر! 🤝`);
    };

    // Reset all assignments
    const handleReset = () => {
        if (!confirm('هل أنت متأكد من إلغاء توزيع جميع الطلاب؟')) return;
        const cleared = {};
        students.forEach(s => {
            cleared[s.id] = null;
        });
        setAssignments(cleared);
        toast.success('تمت إعادة تعيين توزيع الطلاب. اضغط حفظ التوزيع للاعتماد.');
    };

    // Save assignments to server
    const handleSaveAssignments = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/families/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    halaqaId,
                    assignments
                })
            });

            if (res.ok) {
                toast.success('تم حفظ توزيع الطلاب والأسر بنجاح! 💾');
                // Refresh data to update point scores
                fetchData(halaqaId);
            } else {
                const errData = await res.json();
                toast.error(errData.error || 'فشل في حفظ التغييرات');
            }
        } catch (err) {
            toast.error('حدث خطأ غير متوقع');
        } finally {
            setIsSaving(false);
        }
    };

    // Compute active line being drawn
    const getActiveLine = () => {
        if (!selectedStudentId || !containerRef.current) return null;
        const sEl = document.getElementById(`student-dot-${selectedStudentId}`);
        if (!sEl) return null;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const sRect = sEl.getBoundingClientRect();
        
        const x1 = sRect.left + sRect.width / 2 - containerRect.left;
        const y1 = sRect.top + sRect.height / 2 - containerRect.top;
        
        let x2 = mousePos.x;
        let y2 = mousePos.y;
        
        if (hoveredFamilyId) {
            const fEl = document.getElementById(`family-dot-${hoveredFamilyId}`);
            if (fEl) {
                const fRect = fEl.getBoundingClientRect();
                x2 = fRect.left + fRect.width / 2 - containerRect.left;
                y2 = fRect.top + fRect.height / 2 - containerRect.top;
            }
        }
        
        return { x1, y1, x2, y2 };
    };

    const activeLine = getActiveLine();

    // Filter students
    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        const hasFamily = !!assignments[s.id];
        
        if (filterType === 'unassigned') return matchesSearch && !hasFamily;
        if (filterType === 'assigned') return matchesSearch && hasFamily;
        return matchesSearch;
    });

    if (!mounted || loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 rtl font-noto pb-20 relative overflow-hidden" dir="rtl">
            <Navbar userType="teacher" userName={user?.name} />
            
            {/* Background blur decorative shapes */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-30">
                <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[150px]"></div>
            </div>

            <main className="max-w-7xl mx-auto px-4 pt-28 pb-12 relative z-10">
                <BackButton 
                    href={`/teacher/points?halaqaId=${halaqaId}`} 
                    text="العودة لنظام النقاط" 
                    className="mb-8" 
                />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2">توزيع الأسر والمجموعات 👥</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">
                            حلقة: <span className="text-indigo-600 dark:text-indigo-400 font-black">{halaqaName}</span>
                        </p>
                        <p className="text-xs text-slate-400 font-bold mt-1">اضغط على النقطة بجانب الطالب، ثم اضغط على النقطة بجانب الأسرة لتوصيلهما. اضغط على الخط لفصل الطالب.</p>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <button 
                            onClick={handleAutoDistribute}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black shadow-lg shadow-amber-200 dark:shadow-none transition-all active:scale-95 text-sm"
                        >
                            <span>🤝</span>
                            توزيع تلقائي للأسر
                        </button>
                        <button 
                            onClick={handleReset}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black shadow-sm transition-all active:scale-95 text-sm border border-slate-300 dark:border-slate-700"
                        >
                            <span>🔄</span>
                            إعادة تعيين
                        </button>
                        <button 
                            onClick={handleSaveAssignments}
                            disabled={isSaving}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 text-sm"
                        >
                            <span>💾</span>
                            {isSaving ? 'جاري الحفظ...' : 'حفظ التوزيع'}
                        </button>
                    </div>
                </div>

                <div 
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 min-h-[600px] rounded-[3rem] p-6 lg:p-8 bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-md connection-grid-bg"
                >
                    {/* SVG Connections Canvas */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                        <defs>
                            <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Connection lines */}
                        {lines.map((line) => (
                            <g key={`group-line-${line.studentId}`} className="pointer-events-auto">
                                {/* Invisible wide path for easier hovering/clicking */}
                                <path
                                    d={`M ${line.x1} ${line.y1} C ${(line.x1 + line.x2) / 2} ${line.y1}, ${(line.x1 + line.x2) / 2} ${line.y2}, ${line.x2} ${line.y2}`}
                                    fill="none"
                                    stroke="transparent"
                                    strokeWidth="15"
                                    className="cursor-pointer"
                                    onClick={() => disconnectStudent(line.studentId)}
                                />
                                {/* Visible path */}
                                <path
                                    d={`M ${line.x1} ${line.y1} C ${(line.x1 + line.x2) / 2} ${line.y1}, ${(line.x1 + line.x2) / 2} ${line.y2}, ${line.x2} ${line.y2}`}
                                    fill="none"
                                    stroke={line.color}
                                    strokeWidth="4"
                                    className="connection-line transition-all duration-300"
                                    filter="url(#glow)"
                                />
                            </g>
                        ))}

                        {/* Active path drawing */}
                        {activeLine && (
                            <path
                                d={`M ${activeLine.x1} ${activeLine.y1} C ${(activeLine.x1 + activeLine.x2) / 2} ${activeLine.y1}, ${(activeLine.x1 + activeLine.x2) / 2} ${activeLine.y2}, ${activeLine.x2} ${activeLine.y2}`}
                                fill="none"
                                stroke="url(#activeGrad)"
                                strokeWidth="4"
                                strokeDasharray="6,6"
                                className="animate-dash-flow"
                                filter="url(#glow)"
                            />
                        )}
                    </svg>

                    {/* Column 1: Students (lg:span-5) */}
                    <div className="lg:col-span-5 flex flex-col space-y-6 z-30">
                        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-xl">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <span>📖</span> طلاب الحلقة
                                <span className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full font-black">
                                    {filteredStudents.length} / {students.length}
                                </span>
                            </h2>

                            {/* Search and Filters */}
                            <div className="space-y-3">
                                <input 
                                    type="text"
                                    placeholder="بحث باسم الطالب..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                                    <button 
                                        onClick={() => setFilterType('all')}
                                        className={`flex-1 py-2 rounded-lg font-black transition-all ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500'}`}
                                    >
                                        الكل
                                    </button>
                                    <button 
                                        onClick={() => setFilterType('unassigned')}
                                        className={`flex-1 py-2 rounded-lg font-black transition-all ${filterType === 'unassigned' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500'}`}
                                    >
                                        غير الموزعين
                                    </button>
                                    <button 
                                        onClick={() => setFilterType('assigned')}
                                        className={`flex-1 py-2 rounded-lg font-black transition-all ${filterType === 'assigned' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500'}`}
                                    >
                                        الموزعين
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[550px] custom-scrollbar space-y-3 pr-1">
                            {filteredStudents.map((student) => {
                                const selectedFamilyId = assignments[student.id];
                                const isAssigned = !!selectedFamilyId;
                                const familyName = isAssigned ? families.find(f => f.id === selectedFamilyId)?.name : null;
                                const isSelected = selectedStudentId === student.id;

                                return (
                                    <div 
                                        key={student.id}
                                        onClick={() => handleStudentDotClick(student.id, { stopPropagation: () => {} })}
                                        className={`p-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between cursor-pointer ${
                                            isSelected 
                                                ? 'bg-indigo-50 border-indigo-500 shadow-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-500 dark:shadow-none' 
                                                : isAssigned 
                                                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300' 
                                                    : 'bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-200/50'
                                        }`}
                                    >
                                        <div className="flex-1 pr-1">
                                            <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight">{student.name}</h3>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                                                    ID: {student.displayId || student.id}
                                                </span>
                                                {isAssigned ? (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md flex items-center gap-1 border border-indigo-500/15">
                                                            👥 {familyName}
                                                        </span>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                disconnectStudent(student.id);
                                                            }}
                                                            className="w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[8px] font-bold shadow-sm transition-colors"
                                                            title="إلغاء توزيع الطالب"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded-md border border-amber-500/15">
                                                        ⚠️ غير موزع
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Anchor Dot */}
                                        <div 
                                            id={`student-dot-${student.id}`}
                                            onClick={(e) => handleStudentDotClick(student.id, e)}
                                            className={`w-6 h-6 rounded-full border-4 shadow-md transition-all duration-300 shrink-0 mr-4 flex items-center justify-center ${
                                                isSelected 
                                                    ? 'bg-emerald-500 border-indigo-500 scale-125 ring-4 ring-indigo-500/20' 
                                                    : isAssigned 
                                                        ? 'bg-indigo-600 border-white dark:border-slate-800' 
                                                        : 'bg-slate-300 dark:bg-slate-700 border-white dark:border-slate-800 hover:bg-indigo-400'
                                            }`}
                                            title="اضغط للتوصيل"
                                        >
                                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredStudents.length === 0 && (
                                <div className="text-center py-10 bg-slate-100/30 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                                    <p className="text-slate-400 font-bold text-xs">لا يوجد طلاب يطابقون هذا الفلتر</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 2: SVG Space Spacer (lg:span-2) */}
                    <div className="hidden lg:block lg:col-span-2 pointer-events-none"></div>

                    {/* Column 3: Families (lg:span-5) */}
                    <div className="lg:col-span-5 flex flex-col space-y-6 z-30">
                        {/* Add Family Box */}
                        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-xl">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <span>🛡️</span> إدارة الأسر والمجموعات
                            </h2>
                            <form onSubmit={handleCreateFamily} className="flex gap-2">
                                <input 
                                    type="text"
                                    placeholder="اسم الأسرة الجديدة... (مثل: أسرة النور)"
                                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-white"
                                    value={newFamilyName}
                                    onChange={(e) => setNewFamilyName(e.target.value)}
                                />
                                <button 
                                    type="submit"
                                    className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md transition-all active:scale-95 text-sm shrink-0"
                                >
                                    + إضافة
                                </button>
                            </form>
                        </div>

                        {/* Families List */}
                        <div className="flex-1 overflow-y-auto max-h-[550px] custom-scrollbar space-y-3 pl-1">
                            {families.map((family) => {
                                // Find students locally assigned to this family
                                const assignedStudents = students.filter(s => assignments[s.id] === family.id);
                                const totalPoints = assignedStudents.reduce((sum, s) => {
                                    // S.points could be fetched initial or calculated
                                    return sum + (s.totalPoints || 0); 
                                }, 0);
                                
                                const isTargetHover = hoveredFamilyId === family.id;
                                const hasSelectedStudent = selectedStudentId !== null;

                                return (
                                    <div 
                                        key={family.id}
                                        onClick={(e) => handleFamilyDotClick(family.id, e)}
                                        onMouseEnter={() => hasSelectedStudent && setHoveredFamilyId(family.id)}
                                        onMouseLeave={() => setHoveredFamilyId(null)}
                                        className={`p-5 rounded-2xl border-2 transition-all duration-300 flex items-start gap-4 cursor-pointer relative ${
                                            isTargetHover 
                                                ? 'bg-emerald-50 border-emerald-500 shadow-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-500 dark:shadow-none' 
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-200'
                                        }`}
                                    >
                                        {/* Anchor Dot on the left */}
                                        <div 
                                            id={`family-dot-${family.id}`}
                                            onClick={(e) => handleFamilyDotClick(family.id, e)}
                                            className={`w-6 h-6 rounded-full border-4 shadow-md transition-all duration-300 shrink-0 ml-1 flex items-center justify-center ${
                                                isTargetHover 
                                                    ? 'bg-emerald-500 border-white dark:border-slate-800 scale-125 ring-4 ring-emerald-500/20' 
                                                    : 'bg-emerald-600 border-white dark:border-slate-800 hover:bg-emerald-500'
                                            }`}
                                            title="اضغط للتوصيل"
                                        >
                                            {isTargetHover && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-base leading-tight">{family.name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                                                        الطلاب: {assignedStudents.length} | مجموع النقاط: <span className="text-emerald-600 dark:text-emerald-400 font-black">{totalPoints}⭐</span>
                                                    </p>
                                                </div>

                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteFamily(family.id, family.name);
                                                    }}
                                                    className="p-1.5 bg-slate-50 dark:bg-slate-950 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-slate-100 dark:border-slate-800"
                                                    title="حذف المجموعة"
                                                >
                                                    🗑️
                                                </button>
                                            </div>

                                            {/* Sub list of student name badges inside this family */}
                                            {assignedStudents.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                                    {assignedStudents.map(student => (
                                                        <span 
                                                            key={`tag-${student.id}`} 
                                                            className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-slate-200/50 dark:border-slate-800"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                disconnectStudent(student.id);
                                                            }}
                                                            title="اضغط للفصل"
                                                        >
                                                            {student.name} ✕
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {families.length === 0 && (
                                <div className="text-center py-20 bg-slate-100/30 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                                    <p className="text-slate-400 font-bold text-sm">لم تقم بإضافة أي مجموعات بعد. ابدأ بإضافة مجموعة بالأعلى!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .connection-grid-bg {
                    background-size: 24px 24px;
                    background-image: radial-gradient(circle, rgba(99, 102, 241, 0.04) 1px, transparent 1px);
                }
                .dark .connection-grid-bg {
                    background-image: radial-gradient(circle, rgba(99, 102, 241, 0.06) 1px, transparent 1px);
                }
                .connection-line {
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                    animation: draw 0.8s ease-out forwards;
                }
                @keyframes draw {
                    to {
                        stroke-dashoffset: 0;
                    }
                }
                .animate-dash-flow {
                    stroke-dasharray: 8, 8;
                    animation: dash-flow 0.5s linear infinite;
                }
                @keyframes dash-flow {
                    to {
                        stroke-dashoffset: -16;
                    }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.4);
                }
            `}</style>
        </div>
    );
}
