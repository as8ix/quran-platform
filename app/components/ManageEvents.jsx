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
        teacherIds: []
    });

    const [editingId, setEditingId] = useState(null);

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
                setNewEvent({ name: '', startDate: '', endDate: '', isActive: false, teacherIds: [] });
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

    const handleEdit = (event) => {
        setNewEvent({
            name: event.name,
            startDate: new Date(event.startDate).toISOString().split('T')[0],
            endDate: new Date(event.endDate).toISOString().split('T')[0],
            isActive: event.isActive,
            teacherIds: event.teachers.map(t => t.id)
        });
        setEditingId(event.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذه الدورة؟ سيتم فصل جميع الجلسات المرتبطة بها.')) return;

        try {
            const res = await fetch(`/api/quranic-events?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('تم حذف الدورة بنجاح');
                fetchEvents();
            }
        } catch (error) {
            toast.error('خطأ في الحذف');
        }
    };

    const toggleActive = async (id, currentState) => {
        try {
            const res = await fetch('/api/quranic-events', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !currentState })
            });

            if (res.ok) {
                toast.success(!currentState ? 'تم تفعيل الدورة' : 'تم إيقاف تفعيل الدورة');
                fetchEvents();
            }
        } catch (error) {
            toast.error('خطأ في العملية');
        }
    };

    const openAssignments = async (event) => {
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

    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col h-full mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <span className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-xl">🏆</span>
                    إدارة الأيام القرآنية
                </h2>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setNewEvent({ name: '', startDate: '', endDate: '', isActive: false, teacherIds: [] });
                        setShowModal(true);
                    }}
                    className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95"
                >
                    + دورة جديدة
                </button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pl-2 custom-scrollbar flex-1">
                {loading ? (
                    <div className="text-center py-10 opacity-50">جاري التحميل...</div>
                ) : events.length > 0 ? events.map((event) => (
                    <div key={event.id} className={`group p-5 bg-slate-50 rounded-3xl border ${event.isActive ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100'} hover:bg-white hover:shadow-lg transition-all duration-300`}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 ${event.isActive ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-400'} border-2 border-transparent rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm`}>
                                    📅
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-slate-800">{event.name}</div>
                                    <div className="text-sm text-slate-400 font-bold">
                                        {new Date(event.startDate).toLocaleDateString('ar-EG')} - {new Date(event.endDate).toLocaleDateString('ar-EG')}
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                        {event.teachers?.map(t => (
                                            <span key={t.id} className="text-[10px] bg-white px-2 py-0.5 rounded-lg border border-slate-100 text-slate-500">{t.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleActive(event.id, event.isActive)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${event.isActive ? 'bg-amber-600 text-white shadow-lg shadow-amber-200' : 'bg-slate-200 text-slate-500 hover:bg-amber-100 hover:text-amber-600'}`}
                                >
                                    {event.isActive ? 'نشطة حالياً' : 'تفعيل'}
                                </button>
                                <button
                                    onClick={() => openAssignments(event)}
                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100"
                                >
                                    👥 توزيع الطلاب
                                </button>
                                <button onClick={() => handleEdit(event)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">✏️</button>
                                <button onClick={() => handleDelete(event.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">🗑️</button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="text-4xl mb-3 opacity-30">📅</div>
                        <h3 className="text-slate-400 font-bold">لا يوجد دورات مسجلة</h3>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative animate-fadeIn">
                        <h3 className="text-2xl font-black text-slate-800 mb-6">{editingId ? 'تعديل الدورة' : 'إضافة دورة قرآنية'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">اسم الدورة</label>
                                <input
                                    type="text"
                                    required
                                    value={newEvent.name}
                                    onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-amber-500 outline-none transition-all font-bold"
                                    placeholder="مثال: الأيام القرآنية 3"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-2">تاريخ البدء</label>
                                    <input
                                        type="date"
                                        required
                                        value={newEvent.startDate}
                                        onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-amber-500 outline-none transition-all font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-2">تاريخ الانتهاء</label>
                                    <input
                                        type="date"
                                        required
                                        value={newEvent.endDate}
                                        onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-amber-500 outline-none transition-all font-bold"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">المعلمون المشاركون</label>
                                <div className="p-3 bg-slate-50 border-2 border-slate-100 rounded-xl max-h-40 overflow-y-auto custom-scrollbar">
                                    {teachers.map(t => (
                                        <label key={t.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
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
                                                className="w-5 h-5 rounded-md border-2 border-slate-300 text-amber-600 focus:ring-amber-500"
                                            />
                                            <span className="font-bold text-slate-700">{t.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <label className="flex items-center gap-3 p-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newEvent.isActive}
                                    onChange={e => setNewEvent({ ...newEvent, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded-md border-2 border-slate-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="font-bold text-slate-700">تفعيل هذه الدورة حالياً</span>
                            </label>

                            <div className="flex gap-4 mt-8">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">إلغاء</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors disabled:opacity-50">
                                    {submitting ? 'جاري الحفظ...' : 'حفظ الدورة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Assignment Modal */}
            {showAssignmentModal && selectedEvent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-4xl shadow-2xl relative animate-fadeIn flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-slate-800">توزيع الطلاب - {selectedEvent.name}</h3>
                            <button onClick={() => setShowAssignmentModal(false)} className="text-slate-400 text-2xl hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden">
                            {/* Distribution Form */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-2">1. اختر المعلم الفاحص</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-bold"
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
                                    <label className="block text-sm font-bold text-slate-600 mb-2">2. اختر الطلاب للإسناد</label>
                                    <div className="h-[300px] overflow-y-auto bg-slate-50 border-2 border-slate-100 rounded-xl p-2 custom-scrollbar">
                                        {students.map(s => {
                                            const isAssigned = assignments.some(a => a.studentId === s.id);
                                            const assignedTeacher = assignments.find(a => a.studentId === s.id)?.teacher.name;

                                            return (
                                                <label key={s.id} className={`flex items-center justify-between p-3 rounded-lg mb-1 cursor-pointer transition-all ${assignmentStudentIds.includes(s.id) ? 'bg-indigo-100' : 'hover:bg-slate-100'}`}>
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
                                                        <span className="font-bold text-slate-700">{s.name}</span>
                                                    </div>
                                                    {isAssigned && (
                                                        <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-indigo-100 text-indigo-500">
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
                                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    {submitting ? 'جاري الحفظ...' : 'تثبيت التوزيع المستهدف'}
                                </button>
                            </div>

                            {/* Current Distribution List */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-bold text-slate-600 mb-2">التوزيع الحالي في الدورة</label>
                                <div className="flex-1 overflow-y-auto bg-white border-2 border-slate-50 rounded-2xl p-4 custom-scrollbar">
                                    {loadingAssignments ? (
                                        <div className="text-center py-20 text-slate-400 font-bold">جاري التحميل...</div>
                                    ) : assignments.length > 0 ? (
                                        <div className="space-y-4">
                                            {/* Group by teacher */}
                                            {[...new Set(assignments.map(a => a.teacherId))].map(tid => {
                                                const teacherName = assignments.find(a => a.teacherId === tid)?.teacher.name;
                                                const teacherAssignments = assignments.filter(a => a.teacherId === tid);

                                                return (
                                                    <div key={tid} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="font-black text-indigo-700">{teacherName}</span>
                                                            <span className="text-xs font-bold bg-white px-2 py-1 rounded-lg border border-slate-200">{teacherAssignments.length} طلاب</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {teacherAssignments.map(a => (
                                                                <div key={a.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold group">
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
                                        <div className="text-center py-20 text-slate-300 font-bold italic">لا توجد توزيعات بعد. ابدأ باختيار معلم وطلاب.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
