import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function ManageEvents({ teachers, students }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    const [assignmentTeacherId, setAssignmentTeacherId] = useState('');
    const [assignmentStudentIds, setAssignmentStudentIds] = useState([]);

    const [newEvent, setNewEvent] = useState({
        name: '',
        startDate: '',
        endDate: '',
        isActive: false,
        teacherIds: [],
        allowOpenTesting: false
    });

    const [editingId, setEditingId] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/quranic-events');
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { ...newEvent, id: editingId } : newEvent;

            const res = await fetch('/api/quranic-events', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success(editingId ? 'تم تعديل الدورة بنجاح' : 'تم إنشاء الدورة بنجاح');
                setShowModal(false);
                setNewEvent({ name: '', startDate: '', endDate: '', isActive: false, teacherIds: [], allowOpenTesting: false });
                setEditingId(null);
                fetchEvents();
            } else {
                const data = await res.json();
                toast.error(data.error || 'خطأ في العملية');
            }
        } catch (error) {
            toast.error('حدث خطأ ما');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (event) => {
        setNewEvent({
            name: event.name,
            startDate: new Date(event.startDate).toISOString().split('T')[0],
            endDate: new Date(event.endDate).toISOString().split('T')[0],
            isActive: event.isActive,
            allowOpenTesting: event.allowOpenTesting || false,
            teacherIds: event.teachers.map(t => t.id)
        });
        setEditingId(event.id);
        setShowModal(true);
    };

    const handleDelete = async (id, name) => {
        setConfirmConfig({
            title: 'حذف الدورة',
            message: `هل أنت متأكد من حذف الدورة "${name}"؟ سيتم فصل جميع الجلسات المرتبطة بها.`,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/quranic-events?id=${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        toast.success('تم حذف الدورة بنجاح');
                        fetchEvents();
                    }
                } catch (error) {
                    toast.error('خطأ في الحذف');
                }
            }
        });
    };

    const openAssignmentModal = async (event) => {
        setSelectedEvent(event);
        setShowAssignmentModal(true);
        setAssignmentTeacherId('');
        setAssignmentStudentIds([]);
        fetchAssignments(event.id);
    };

    const fetchAssignments = async (eventId) => {
        setLoadingAssignments(true);
        try {
            const res = await fetch(`/api/quranic-events/assignments?eventId=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setAssignments(data);
            }
        } catch (e) { console.error(e); }
        finally { setLoadingAssignments(false); }
    };

    const handleSaveAssignment = async () => {
        if (!assignmentTeacherId || assignmentStudentIds.length === 0) {
            toast.error('يرجى اختيار المعلم والطلاب');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/quranic-events/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: selectedEvent.id,
                    teacherId: assignmentTeacherId,
                    studentIds: assignmentStudentIds
                })
            });

            if (res.ok) {
                toast.success('تم الحفظ بنجاح');
                setAssignmentTeacherId('');
                setAssignmentStudentIds([]);
                fetchAssignments(selectedEvent.id);
            }
        } catch (e) { toast.error('خطأ في الحفظ'); }
        finally { setSubmitting(false); }
    };

    const deleteAssignment = async (id) => {
        try {
            const res = await fetch(`/api/quranic-events/assignments?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('تم الحذف');
                fetchAssignments(selectedEvent.id);
            }
        } catch (e) { toast.error('خطأ في الحذف'); }
    };

    const handleAutoAssign = async () => {
        setConfirmConfig({
            title: 'إسناد تلقائي',
            message: 'سيتم توزيع جميع الطلاب تلقائياً حسب معلميهم في الحلقات (فقط المعلمون المشاركون في الدورة). هل تريد الاستمرار؟',
            onConfirm: async () => {
                setLoadingAssignments(true);
                try {
                    const teacherGroups = {};
                    students.forEach(student => {
                        const teacherId = student.halaqa?.teacherId;
                        if (teacherId && selectedEvent.teachers.some(t => t.id === teacherId)) {
                            if (!teacherGroups[teacherId]) teacherGroups[teacherId] = [];
                            teacherGroups[teacherId].push(student.id);
                        }
                    });

                    const promises = Object.entries(teacherGroups).map(([teacherId, studentIds]) => {
                        return fetch('/api/quranic-events/assignments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                eventId: selectedEvent.id,
                                teacherId: parseInt(teacherId),
                                studentIds
                            })
                        });
                    });

                    await Promise.all(promises);
                    toast.success('تم التوزيع التلقائي بنجاح');
                    fetchAssignments(selectedEvent.id);
                } catch (error) {
                    toast.error('حدث خطأ أثناء التوزيع التلقائي');
                } finally {
                    setLoadingAssignments(false);
                }
            }
        });
    };

    return (
        <>
            <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-8 shadow-sm border border-[var(--border-main)] flex flex-col h-full mt-8 reveal">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-xl">🏆</span>
                        إدارة الأيام القرآنية
                    </h2>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setNewEvent({ name: '', startDate: '', endDate: '', isActive: false, teacherIds: [], allowOpenTesting: false });
                            setShowModal(true);
                        }}
                        className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95"
                    >
                        + دورة جديدة
                    </button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pl-2 custom-scrollbar flex-1">
                    {loading ? (
                        <div className="text-center py-10 opacity-50 dark:text-slate-400">جاري التحميل...</div>
                    ) : events.length > 0 ? events.map((event) => (
                        <div key={event.id} className={`group p-5 bg-[var(--bg-main)] rounded-3xl border ${event.isActive ? 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/20' : 'border-[var(--border-main)]'} hover:bg-[var(--card-bg)] hover:shadow-lg transition-all duration-300`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white dark:bg-slate-800 border-2 border-amber-100 dark:border-amber-900 text-amber-600 dark:text-amber-400 rounded-2xl flex flex-col items-center justify-center shadow-sm group-hover:scale-105 transition-all">
                                        <span className="text-sm font-black leading-tight">{event.startDate.split('-')[2]}</span>
                                        <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">
                                            {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">{event.name}</div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500 font-bold flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                            <span className="flex items-center gap-1">🗓️ {event.startDate} : {event.endDate}</span>
                                            <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded-lg text-[10px]">{event.teachers?.length || 0} معلمين</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openAssignmentModal(event)}
                                        className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-black hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-all shadow-sm"
                                    >
                                        إدارة الطلاب
                                    </button>
                                    <button
                                        onClick={() => openEditModal(event)}
                                        className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-300 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/50 hover:text-amber-600 dark:hover:text-amber-400 transition-all border border-transparent hover:border-amber-100 dark:hover:border-amber-900 shadow-sm"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(event.id, event.name)}
                                        className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-300 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900 shadow-sm"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="text-4xl mb-3 opacity-30">🏆</div>
                            <h3 className="text-slate-400 dark:text-slate-500 font-bold italic">لا يوجد دورات حالياً</h3>
                        </div>
                    )}
                </div>
            </div>

            {/* Event Form Modal */}
            {showModal && (
                <div className="modal-overlay animate-fadeIn" onClick={() => setShowModal(false)}>
                    <div className="modal-content animate-slideUp max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{editingId ? 'تعديل الدورة' : 'إضافة دورة قرآنية'}</h3>
                        </div>
                        <div className="modal-body">
                            <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">اسم الدورة</label>
                                    <input
                                        type="text"
                                        required
                                        value={newEvent.name}
                                        onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-amber-500 outline-none transition-all font-bold dark:text-white"
                                        placeholder="مثال: الأيام القرآنية 3"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">تاريخ البدء</label>
                                        <input
                                            type="date"
                                            required
                                            value={newEvent.startDate}
                                            onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-amber-500 outline-none transition-all font-bold dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">تاريخ الانتهاء</label>
                                        <input
                                            type="date"
                                            required
                                            value={newEvent.endDate}
                                            onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-amber-500 outline-none transition-all font-bold dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">المعلمون المشاركون</label>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-xl max-h-40 overflow-y-auto custom-scrollbar">
                                        {teachers.map(t => (
                                            <label key={t.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={newEvent.teacherIds.includes(t.id)}
                                                    onChange={e => {
                                                        const current = [...newEvent.teacherIds];
                                                        if (e.target.checked) current.push(t.id);
                                                        else {
                                                            const idx = current.indexOf(t.id);
                                                            if (idx > -1) current.splice(idx, 1);
                                                        }
                                                        setNewEvent({ ...newEvent, teacherIds: current });
                                                    }}
                                                    className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500"
                                                />
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{t.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3 p-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={newEvent.isActive}
                                            onChange={e => setNewEvent({ ...newEvent, isActive: e.target.checked })}
                                            className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500"
                                        />
                                        <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-600 transition-colors">تفعيل هذه الدورة حالياً</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={newEvent.allowOpenTesting}
                                            onChange={e => setNewEvent({ ...newEvent, allowOpenTesting: e.target.checked })}
                                            className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">نظام التسميع المفتوح (أي معلم يسمع أي طالب)</span>
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer flex gap-4">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">إلغاء</button>
                            <button type="submit" form="event-form" disabled={submitting} className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                {submitting ? 'جاري الحفظ...' : 'حفظ الدورة'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {showAssignmentModal && selectedEvent && (
                <div className="modal-overlay animate-fadeIn" onClick={() => setShowAssignmentModal(false)}>
                    <div className="modal-content animate-slideUp max-w-5xl" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">توزيع الطلاب - {selectedEvent.name}</h3>
                            <button onClick={() => setShowAssignmentModal(false)} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold shadow-sm transition-all">✕</button>
                        </div>

                        <div className="modal-body">
                            <button
                                onClick={handleAutoAssign}
                                className="w-full mb-6 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-sm font-black border border-amber-100 dark:border-amber-800 flex items-center justify-center gap-2"
                            >
                                🪄 إسناد تلقائي حسب الحلقات
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">1. اختر المعلم الفاحص</label>
                                        <select
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 font-bold dark:text-white"
                                            value={assignmentTeacherId}
                                            onChange={(e) => setAssignmentTeacherId(e.target.value)}
                                        >
                                            <option value="">اختر معلماً...</option>
                                            {selectedEvent.teachers?.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">2. اختر الطلاب للإسناد</label>
                                        <div className="h-[300px] overflow-y-auto bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-2 custom-scrollbar">
                                            {students.map(s => {
                                                const isAssigned = assignments.some(a => a.studentId === s.id);
                                                const assignedTeacher = assignments.find(a => a.studentId === s.id)?.teacher.name;

                                                return (
                                                    <label key={s.id} className={`flex items-center justify-between p-3 rounded-lg mb-1 cursor-pointer transition-all ${assignmentStudentIds.includes(s.id) ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={assignmentStudentIds.includes(s.id)}
                                                                onChange={(e) => {
                                                                    const current = [...assignmentStudentIds];
                                                                    if (e.target.checked) current.push(s.id);
                                                                    else {
                                                                        const idx = current.indexOf(s.id);
                                                                        if (idx > -1) current.splice(idx, 1);
                                                                    }
                                                                    setAssignmentStudentIds(current);
                                                                }}
                                                                className="w-5 h-5 accent-indigo-600"
                                                            />
                                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{s.name}</span>
                                                        </div>
                                                        {isAssigned && (
                                                            <span className="text-[10px] font-black bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800 text-indigo-500 dark:text-indigo-400">
                                                                مع {assignedTeacher}
                                                            </span>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveAssignment}
                                        disabled={submitting}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                    >
                                        {submitting ? 'جاري الحفظ...' : 'تثبيت التوزيع المستهدف'}
                                    </button>
                                </div>

                                <div className="flex flex-col">
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">التوزيع الحالي في الدورة</label>
                                    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900/50 border-2 border-slate-50 dark:border-slate-700 rounded-2xl p-4 custom-scrollbar">
                                        {loadingAssignments ? (
                                            <div className="text-center py-20 text-slate-400 font-bold">جاري التحميل...</div>
                                        ) : assignments.length > 0 ? (
                                            <div className="space-y-4">
                                                {[...new Set(assignments.map(a => a.teacherId))].map(tid => {
                                                    const teacherName = assignments.find(a => a.teacherId === tid)?.teacher.name;
                                                    const teacherAssignments = assignments.filter(a => a.teacherId === tid);

                                                    return (
                                                        <div key={tid} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="font-black text-indigo-700 dark:text-indigo-400">{teacherName}</span>
                                                                <span className="text-xs font-bold bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 dark:text-slate-300">{teacherAssignments.length} طلاب</span>
                                                            </div>
                                                            <div className="p-3 flex flex-wrap gap-2">
                                                                {teacherAssignments.map(a => (
                                                                    <div key={a.id} className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-bold dark:text-slate-300 group">
                                                                        <span>{a.student.name}</span>
                                                                        <button onClick={() => deleteAssignment(a.id)} className="text-red-400 hover:text-red-600 px-1 font-black">×</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 text-slate-300 dark:text-slate-500 font-bold italic">لا توجد توزيعات بعد. ابدأ باختيار معلم وطلاب.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {confirmConfig && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-popIn border border-slate-100/50 dark:border-slate-700">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner ring-8 ring-amber-50/50 dark:ring-amber-900/20">
                                ⚠️
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">{confirmConfig.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-8">
                                {confirmConfig.message}
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirmConfig(null)}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={() => {
                                        confirmConfig.onConfirm();
                                        setConfirmConfig(null);
                                    }}
                                    className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-black shadow-lg shadow-amber-200 dark:shadow-none hover:bg-amber-700 transition-all active:scale-95 translate-y-[-2px]"
                                >
                                    تأكيد
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
