'use client';

import BaseModal from '@/app/components/Global/BaseModal';
import AddStudentModal from '@/app/components/AddStudentModal';
import ManageHolidaysModal from '@/app/components/ManageHolidaysModal';

export default function SupervisorModals({
    // Teacher Modal
    showTeacherModal,
    setShowTeacherModal,
    isEditingTeacher,
    setIsEditingTeacher,
    setEditTeacherId,
    newTeacher,
    setNewTeacher,
    handleCreateTeacher,
    submitting,
    showPassword,
    setShowPassword,

    // Halaqa Modal
    showHalaqaModal,
    setShowHalaqaModal,
    isEditingHalaqa,
    setIsEditingHalaqa,
    setEditHalaqaId,
    newHalaqa,
    setNewHalaqa,
    handleCreateHalaqa,
    handleLogoUpload,
    teachers,
    halaqas,
    editHalaqaId,
    searchTeacherInHalaqa,
    setSearchTeacherInHalaqa,
    searchAssistantInHalaqa,
    setSearchAssistantInHalaqa,
    normalizeText,

    // Students List Modal
    showStudentsModal,
    setShowStudentsModal,
    selectedHalaqaName,
    searchStudentInModal,
    setSearchStudentInModal,
    loadingStudents,
    selectedHalaqaStudents,
    handleToggleFee,
    togglingId,
    handleEditStudent,

    // Report Type Modal
    showReportTypeModal,
    setShowReportTypeModal,
    selectedHalaqaForReport,
    router,
    basePath,

    // Edit Student Modal
    showEditStudentModal,
    setShowEditStudentModal,
    studentToEdit,
    currentHalaqaIdForStudent,
    fetchAllData,
    handleViewStudents,

    // Halaqa Settings Modal
    showHalaqaSettingsModal,
    setShowHalaqaSettingsModal,
    selectedHalaqaForSettings,
    handleResetHalaqaPoints,
    isResetting,
    handleTogglePoints,

    // Holiday Modal
    showHolidayModal,
    setShowHolidayModal
}) {
    return (
        <>
            {/* Teacher Modal */}
            <BaseModal
                isOpen={showTeacherModal}
                onClose={() => {
                    setShowTeacherModal(false);
                    setIsEditingTeacher(false);
                    setEditTeacherId(null);
                    setNewTeacher({ name: '', username: '', password: '' });
                }}
                title={isEditingTeacher ? 'تعديل بيانات معلم' : 'إضافة معلم جديد'}
                maxWidth="max-w-md"
            >
                <form id="teacher-form" onSubmit={handleCreateTeacher} className="space-y-5 py-2">
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2 mr-1">الاسم الكامل</label>
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold dark:text-white"
                            value={newTeacher.name}
                            onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2 mr-1">اسم المستخدم</label>
                        <input
                            type="text"
                            required
                            dir="ltr"
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold dark:text-white text-left"
                            value={newTeacher.username}
                            onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-bold text-slate-500 mb-2 mr-1">كلمة المرور</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            dir="ltr"
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold dark:text-white text-left font-mono"
                            value={newTeacher.password}
                            onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-4 top-[52px] text-slate-400 hover:text-emerald-500"
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowTeacherModal(false)}
                            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'جاري الحفظ...' : (isEditingTeacher ? 'حفظ التعديلات' : 'إضافة المعلم')}
                        </button>
                    </div>
                </form>
            </BaseModal>

            {/* Halaqa Modal */}
            <BaseModal
                isOpen={showHalaqaModal}
                onClose={() => {
                    setShowHalaqaModal(false);
                    setIsEditingHalaqa(false);
                    setEditHalaqaId(null);
                    setNewHalaqa({ name: 'حلقة: ', teacherId: '', assistantTeacherIds: [], logo: null });
                }}
                title={isEditingHalaqa ? 'تعديل بيانات الحلقة' : 'إنشاء حلقة جديدة'}
                maxWidth="max-w-2xl"
            >
                <form id="halaqa-form" onSubmit={handleCreateHalaqa} className="space-y-6 py-2">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2 mr-1">اسم الحلقة</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold dark:text-white"
                                    value={newHalaqa.name}
                                    onChange={(e) => setNewHalaqa({ ...newHalaqa, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2 mr-1">شعار الحلقة (اختياري)</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center group cursor-pointer hover:border-indigo-500 transition-all">
                                        {newHalaqa.logo ? (
                                            <img src={newHalaqa.logo} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl text-slate-400 group-hover:scale-110 transition-transform">🖼️</span>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                    <div className="text-xs text-slate-400 font-bold leading-relaxed">يفضل أن يكون الشعار بصيغة PNG أو JPG<br />وبحجم لا يتجاوز ٢ ميجابايت</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <label className="block text-sm font-bold text-slate-500 mb-2 mr-1">المعلم المشرف</label>
                            <div className="relative group mb-2">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="ابحث عن معلم..."
                                    className="w-full pr-12 pl-6 py-3 bg-slate-50 dark:bg-slate-800/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-bold dark:text-white text-sm"
                                    value={searchTeacherInHalaqa}
                                    onChange={(e) => setSearchTeacherInHalaqa(e.target.value)}
                                />
                            </div>
                            <div className="max-h-[200px] overflow-y-auto premium-scrollbar bg-slate-50 dark:bg-slate-800/30 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-2 space-y-1">
                                {teachers
                                    .filter(t => {
                                        const searchMatch = normalizeText(t.name).includes(normalizeText(searchTeacherInHalaqa));
                                        const hasHalaqa = halaqas.some(h => h.id.toString() !== editHalaqaId?.toString() && h.teacherId?.toString() === t.id.toString());
                                        if (searchTeacherInHalaqa) return searchMatch;
                                        return !hasHalaqa || t.id.toString() === newHalaqa.teacherId?.toString();
                                    })
                                    .sort((a, b) => {
                                        const isSelectedA = newHalaqa.teacherId?.toString() === a.id.toString();
                                        const isSelectedB = newHalaqa.teacherId?.toString() === b.id.toString();
                                        if (isSelectedA && !isSelectedB) return -1;
                                        if (!isSelectedA && isSelectedB) return 1;
                                        return a.name.localeCompare(b.name, 'ar');
                                    })
                                    .map(t => {
                                        const isSelected = newHalaqa.teacherId?.toString() === t.id.toString();
                                        const hasHalaqa = halaqas.some(h => h.id.toString() !== editHalaqaId?.toString() && h.teacherId?.toString() === t.id.toString());
                                        return (
                                            <label key={t.id} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="teacherId"
                                                        disabled={hasHalaqa && !isSelected}
                                                        checked={isSelected}
                                                        onChange={() => setNewHalaqa({ ...newHalaqa, teacherId: t.id.toString() })}
                                                        className="peer sr-only"
                                                    />
                                                    <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center transition-all ${isSelected ? 'border-white' : hasHalaqa ? 'border-slate-200 dark:border-slate-700 bg-slate-100' : 'border-slate-300 dark:border-slate-600'}`}>
                                                        <div className={`w-2 h-2 rounded-full bg-white transition-all ${isSelected ? 'scale-100' : 'scale-0'}`}></div>
                                                    </div>
                                                    <span className={`text-sm font-black ${isSelected ? 'text-white' : hasHalaqa ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{t.name}</span>
                                                </div>
                                            </label>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-500 mb-2 mr-1">المساعدين (اختياري)</label>
                        <div className="relative group mb-2">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="ابحث عن مساعد..."
                                className="w-full pr-12 pl-6 py-3 bg-slate-50 dark:bg-slate-800/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-bold dark:text-white text-sm"
                                value={searchAssistantInHalaqa}
                                onChange={(e) => setSearchAssistantInHalaqa(e.target.value)}
                            />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto premium-scrollbar bg-slate-50 dark:bg-slate-800/30 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {teachers
                                .filter(t => t.id.toString() !== newHalaqa.teacherId?.toString())
                                .filter(t => {
                                    const searchMatch = normalizeText(t.name).includes(normalizeText(searchAssistantInHalaqa));
                                    if (searchAssistantInHalaqa) return searchMatch;
                                    return true;
                                })
                                .map(t => {
                                    const isChecked = newHalaqa.assistantTeacherIds.includes(t.id.toString());
                                    return (
                                        <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isChecked ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800' : 'border-transparent hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    const ids = [...newHalaqa.assistantTeacherIds];
                                                    if (e.target.checked) ids.push(t.id.toString());
                                                    else {
                                                        const idx = ids.indexOf(t.id.toString());
                                                        if (idx > -1) ids.splice(idx, 1);
                                                    }
                                                    setNewHalaqa({ ...newHalaqa, assistantTeacherIds: ids });
                                                }}
                                                className="custom-checkbox checked:bg-indigo-600 checked:border-indigo-600"
                                            />
                                            <span className={`text-xs font-black ${isChecked ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>{t.name}</span>
                                        </label>
                                    );
                                })}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowHalaqaModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black transition-all">إلغاء</button>
                        <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50">
                            {submitting ? 'جاري الحفظ...' : (isEditingHalaqa ? 'حفظ التعديلات' : 'إنشاء الحلقة')}
                        </button>
                    </div>
                </form>
            </BaseModal>

            {/* Students List Modal */}
            <BaseModal
                isOpen={showStudentsModal}
                onClose={() => setShowStudentsModal(false)}
                title={`طلاب ${selectedHalaqaName}`}
                maxWidth="max-w-2xl"
            >
                <div className="space-y-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="بحث عن طالب..." 
                            value={searchStudentInModal}
                            onChange={(e) => setSearchStudentInModal(e.target.value)}
                            className="w-full pr-12 pl-6 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500/30 rounded-2xl outline-none font-bold dark:text-white"
                        />
                    </div>

                    <div className="max-h-[50vh] overflow-y-auto premium-scrollbar pr-1">
                        {loadingStudents ? (
                            <div className="flex flex-col items-center py-12">
                                <div className="w-10 h-10 border-4 border-slate-100 dark:border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
                                <p className="text-slate-400 font-bold mt-4">جاري التحميل...</p>
                            </div>
                        ) : selectedHalaqaStudents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {selectedHalaqaStudents
                                    .filter(s => normalizeText(s.name).includes(normalizeText(searchStudentInModal)))
                                    .map((s, idx) => (
                                    <div key={s.id} className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-[1.5rem] border border-transparent hover:border-emerald-500/20 transition-all group">
                                        <div className="w-10 h-10 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl text-[11px] font-black text-slate-400 group-hover:text-emerald-600 shadow-sm flex items-center justify-center">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-black text-sm text-slate-800 dark:text-white truncate leading-tight">{s.name}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex gap-1.5">
                                                    {[
                                                        { key: 'feeStatusTerm1', label: 'ت1' },
                                                        { key: 'feeStatusTerm2', label: 'ت2' },
                                                        { key: 'feeStatusSummer', label: 'ص' }
                                                    ].map(term => {
                                                        const isToggling = togglingId === `${s.id}-${term.key}`;
                                                        return (
                                                            <button
                                                                key={term.key}
                                                                disabled={isToggling}
                                                                onClick={() => handleToggleFee(s.id, term.key, s[term.key])}
                                                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                                                    isToggling ? 'animate-pulse bg-slate-200' :
                                                                    s[term.key] === 'PAID' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                                                }`}
                                                            >
                                                                {isToggling ? (
                                                                    <div className="w-2 h-2 border border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                                                ) : (
                                                                    <span className="text-[7px] font-black">{term.label}</span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleEditStudent(s)}
                                            className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-500 rounded-xl transition-all border border-transparent hover:border-emerald-500/20 shadow-sm"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4 opacity-20">👥</div>
                                <h3 className="text-slate-400 dark:text-slate-500 font-bold">لا يوجد طلاب</h3>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setShowStudentsModal(false)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black rounded-2xl transition-all">إغلاق</button>
                </div>
            </BaseModal>

            {/* Report Type Modal */}
            <BaseModal
                isOpen={showReportTypeModal}
                onClose={() => setShowReportTypeModal(false)}
                title="اختر نوع التقرير"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-center mb-6">حلقة: {selectedHalaqaForReport?.name.replace('حلقة: ', '')}</p>
                    <button 
                        onClick={() => {
                            window.open(`${basePath}/reports?teacherId=${selectedHalaqaForReport.teacherId}`, '_blank');
                            setShowReportTypeModal(false);
                        }}
                        className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all group flex items-center gap-4 text-right"
                    >
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📊</div>
                        <div>
                            <div className="font-black text-slate-800 dark:text-white text-lg">التقرير المجمع الشامل</div>
                            <div className="text-xs font-bold text-slate-400">إنجاز الحفظ والمراجعة الأسبوعي</div>
                        </div>
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => {
                                window.open(`${basePath}/attendance/report?type=week&teacherId=${selectedHalaqaForReport.teacherId}`, '_blank');
                                setShowReportTypeModal(false);
                            }}
                            className="p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-amber-500/30 transition-all group flex flex-col items-center gap-3"
                        >
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📅</div>
                            <span className="font-black text-slate-800 dark:text-white text-sm">حضور أسبوعي</span>
                        </button>
                        <button 
                            onClick={() => {
                                window.open(`${basePath}/attendance/report?type=month&teacherId=${selectedHalaqaForReport.teacherId}`, '_blank');
                                setShowReportTypeModal(false);
                            }}
                            className="p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-amber-500/30 transition-all group flex flex-col items-center gap-3"
                        >
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🗓️</div>
                            <span className="font-black text-slate-800 dark:text-white text-sm">حضور شهري</span>
                        </button>
                    </div>
                    <button 
                        onClick={() => {
                            window.open(`${basePath}/reports/custom-list?teacherId=${selectedHalaqaForReport.teacherId}`, '_blank');
                            setShowReportTypeModal(false);
                        }}
                        className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all group flex items-center gap-4 text-right"
                    >
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📋</div>
                        <div>
                            <div className="font-black text-slate-800 dark:text-white text-lg">قائمة بيانات الطلاب</div>
                            <div className="text-xs font-bold text-slate-400">اختر الحقول واطبع الجداول</div>
                        </div>
                    </button>
                    <button onClick={() => setShowReportTypeModal(false)} className="w-full py-4 text-slate-400 font-bold">إلغاء</button>
                </div>
            </BaseModal>

            {/* Edit Student Modal */}
            <AddStudentModal
                isOpen={showEditStudentModal}
                onClose={() => setShowEditStudentModal(false)}
                onAdd={() => {
                    setShowEditStudentModal(false);
                    fetchAllData();
                    if (selectedHalaqaForReport) handleViewStudents(selectedHalaqaForReport);
                }}
                student={studentToEdit}
                halaqaId={currentHalaqaIdForStudent}
            />

            {/* Halaqa Settings Modal */}
            <BaseModal
                isOpen={showHalaqaSettingsModal}
                onClose={() => setShowHalaqaSettingsModal(false)}
                title="إعدادات الأنشطة"
                maxWidth="max-w-md"
            >
                <div className="space-y-6">
                    <p className="text-slate-500 font-bold text-center -mt-2 mb-4">{selectedHalaqaForSettings?.name}</p>
                    <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all group hover:border-emerald-500/30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🪙</div>
                            <div>
                                <h4 className="font-black text-slate-800 dark:text-white">نشاط رصد النقاط</h4>
                                <p className="text-slate-500 text-[10px] font-bold">تفعيل رصد النقاط للحلقة</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => handleResetHalaqaPoints(selectedHalaqaForSettings.id)}
                                disabled={isResetting}
                                className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                            >
                                {isResetting ? <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div> : '🧹'}
                            </button>
                            <button 
                                onClick={() => handleTogglePoints(selectedHalaqaForSettings.id, selectedHalaqaForSettings.pointsEnabled)}
                                className={`w-12 h-7 rounded-full transition-all relative ${selectedHalaqaForSettings?.pointsEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-all ${selectedHalaqaForSettings?.pointsEnabled ? 'right-5.5' : 'right-0.5'}`}></div>
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setShowHalaqaSettingsModal(false)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black transition-all">إغلاق</button>
                </div>
            </BaseModal>

            <ManageHolidaysModal 
                isOpen={showHolidayModal} 
                onClose={() => setShowHolidayModal(false)} 
                halaqas={halaqas}
            />
        </>
    );
}
