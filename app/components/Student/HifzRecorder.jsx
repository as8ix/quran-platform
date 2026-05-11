'use client';

export default function HifzRecorder({
    sessionType,
    isKhatim,
    isQuranicDaySession,
    activeExam,
    editingSessionData,
    currentSurah,
    allowedPages,
    hifzFromPage,
    setHifzFromPage,
    hifzToPage,
    setHifzToPage,
    hifzFromAyah,
    setHifzFromAyah,
    hifzToAyah,
    setHifzToAyah,
    hifzErrors,
    setHifzErrors,
    hifzAlerts,
    setHifzAlerts,
    hifzCleanPages,
    setHifzCleanPages,
    pageAyahMap,
    setSelectedExam,
    setExamDate,
    setExamTime,
    setShowExamModal,
    handleCompleteExam
}) {
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
                        الحفظ الجديد (سورة {editingSessionData?.hifzSurah || currentSurah?.name})
                    </h3>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                        صفحات السورة: {allowedPages[0]} - {allowedPages[allowedPages.length - 1]}
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-emerald-600 mb-2 mr-2">من الصفحة</label>
                        <div className="flex gap-2">
                            <select value={hifzFromPage} onChange={e => { const p = parseInt(e.target.value); setHifzFromPage(p); if (pageAyahMap && pageAyahMap[p] && currentSurah) { const pageData = pageAyahMap[p][currentSurah.id]; if (pageData && pageData.start) setHifzFromAyah(pageData.start); } }} className="w-2/3 px-4 py-4 premium-glass border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-lg dark:text-white" > {allowedPages.map(p => <option key={p} value={p} className="text-slate-900 dark:text-white dark:bg-slate-900">صفحة {p}</option>)} </select>
                            <div className="w-1/3 relative"><span className="absolute -top-6 right-0 text-[10px] text-emerald-400 font-bold">آية</span><input type="number" value={hifzFromAyah} min="1" max={currentSurah?.ayahs} onFocus={() => hifzFromAyah === 1 && setHifzFromAyah('')} onBlur={() => hifzFromAyah === '' && setHifzFromAyah(1)} onChange={e => { const val = e.target.value; if (val === '') setHifzFromAyah(''); else { const parsed = parseInt(val); const max = currentSurah?.ayahs || 286; if (parsed > max) setHifzFromAyah(max); else setHifzFromAyah(parsed); } }} className="w-full px-4 py-4 premium-glass border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-center dark:text-white" placeholder="آية" /></div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-emerald-600 mb-2 mr-2">إلى الصفحة</label>
                        <div className="flex gap-2">
                            <select value={hifzToPage} onChange={e => { const p = parseInt(e.target.value); setHifzToPage(p); if (pageAyahMap && pageAyahMap[p] && currentSurah) { const pageData = pageAyahMap[p][currentSurah.id]; if (pageData) { const endAyah = (typeof pageData === 'object') ? pageData.end : pageData; if (endAyah) setHifzToAyah(endAyah); } } }} className="w-2/3 px-4 py-4 premium-glass border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-lg dark:text-white" > {allowedPages.map(p => <option key={p} value={p} className="text-slate-900 dark:text-white dark:bg-slate-900">صفحة {p}</option>)} </select>
                            <div className="w-1/3 relative"><span className="absolute -top-6 right-0 text-[10px] text-emerald-400 font-bold">آية</span><input type="number" value={hifzToAyah} min="1" max={currentSurah?.ayahs} onFocus={() => hifzToAyah === 1 && setHifzToAyah('')} onBlur={() => hifzToAyah === '' && setHifzToAyah(1)} onChange={e => { const val = e.target.value; if (val === '') setHifzToAyah(''); else { const parsed = parseInt(val); const max = currentSurah?.ayahs || 286; if (parsed > max) setHifzToAyah(max); else setHifzToAyah(parsed); } }} className="w-full px-4 py-4 premium-glass border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-center dark:text-white" placeholder="آية" /></div>
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
                            value={hifzAlerts}
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
                            step="0.5"
                            value={hifzCleanPages}
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
}
