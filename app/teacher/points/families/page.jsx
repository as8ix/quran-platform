'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../../../components/Navbar';
import BackButton from '../../../components/BackButton';
import { useTheme } from '../../../components/ThemeProvider';
import LoadingScreen from '../../../components/LoadingScreen';

const getFirstAndLastName = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 2) return name;
    return `${parts[0]} ${parts[parts.length - 1]}`;
};

export default function FamiliesPage() {
    const router = useRouter();
    const { isDarkMode, mounted } = useTheme();
    const [user, setUser] = useState(null);
    const [halaqaId, setHalaqaId] = useState(null);
    const [halaqaName, setHalaqaName] = useState('');

    const [students, setStudents] = useState([]);
    const [families, setFamilies] = useState([]);
    const [assignments, setAssignments] = useState({}); // { studentId: familyId | null }

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' | 'unassigned' | 'assigned'

    // Connection interaction states
    const [selectedStudentId, setSelectedStudentId] = useState(null);

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

    // Connection Click logic
    const handleStudentClick = (studentId) => {
        if (selectedStudentId === studentId) {
            setSelectedStudentId(null);
        } else {
            setSelectedStudentId(studentId);
        }
    };

    const handleFamilyClick = (familyId) => {
        if (selectedStudentId) {
            setAssignments(prev => ({
                ...prev,
                [selectedStudentId]: familyId
            }));
            setSelectedStudentId(null);
            toast.success('تم التوزيع بنجاح! 🎉', { duration: 800 });
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
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-black mt-2 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/15 w-fit animate-pulse">
                            💡 طريقة التوزيع: اختر طالباً من اليمين، ثم اضغط على الأسرة المطلوبة من اليسار لتوزيعه مباشرة.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full md:w-auto shrink-0">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 min-h-[600px]">
                    
                    {/* Column 1: Students */}
                    <div className="flex flex-col space-y-6 z-30">
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

                        <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar space-y-3 pr-1">
                            {filteredStudents.map((student) => {
                                const selectedFamilyId = assignments[student.id];
                                const isAssigned = !!selectedFamilyId;
                                const familyName = isAssigned ? families.find(f => f.id === selectedFamilyId)?.name : null;
                                const isSelected = selectedStudentId === student.id;

                                return (
                                    <div 
                                        key={student.id}
                                        onClick={() => handleStudentClick(student.id)}
                                        className={`p-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between cursor-pointer ${
                                            isSelected 
                                                ? 'bg-indigo-50 border-indigo-500 shadow-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-500 dark:shadow-none scale-[1.01]' 
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

                                        {isSelected && (
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 animate-pulse bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/15 mr-4 shrink-0">
                                                📍 جاري التحديد...
                                            </span>
                                        )}
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

                    {/* Column 2: Families */}
                    <div className="flex flex-col space-y-6 z-30">
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
                        <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar space-y-3 pl-1">
                            {families.map((family) => {
                                // Find students locally assigned to this family
                                const assignedStudents = students.filter(s => assignments[s.id] === family.id);
                                const totalPoints = assignedStudents.reduce((sum, s) => {
                                    return sum + (s.totalPoints || 0); 
                                }, 0);
                                
                                const hasSelectedStudent = selectedStudentId !== null;

                                return (
                                    <div 
                                        key={family.id}
                                        onClick={() => handleFamilyClick(family.id)}
                                        className={`p-5 rounded-2xl border-2 transition-all duration-300 flex items-start gap-4 cursor-pointer relative ${
                                            hasSelectedStudent 
                                                ? 'hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 border-slate-200 dark:border-slate-800' 
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-200'
                                        }`}
                                    >
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
                                                            {getFirstAndLastName(student.name)} ✕
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
