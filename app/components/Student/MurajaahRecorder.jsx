'use client';

export default function MurajaahRecorder({
    sessionType,
    isKhatim,
    isQuranicDaySession,
    murajaahType,
    setMurajaahType,
    reviewableSurahs,
    mFromSurah,
    setMFromSurah,
    mFromAyah,
    setMFromAyah,
    mToSurah,
    setMToSurah,
    mToAyah,
    setMToAyah,
    errorsCount,
    setErrorsCount,
    alertsCount,
    setAlertsCount,
    cleanPagesCount,
    setCleanPagesCount,
    resultString,
    pagesCount,
    minorMFromSurah,
    setMinorMFromSurah,
    minorMFromAyah,
    setMinorMFromAyah,
    minorMToSurah,
    setMinorMToSurah,
    minorMToAyah,
    setMinorMToAyah,
    minorErrors,
    setMinorErrors,
    minorAlerts,
    setMinorAlerts,
    minorCleanPages,
    setMinorCleanPages,
    minorResultString,
    minorPagesCount,
    quranData
}) {
    // Review Section - Hidden if mode is HIFZ only (and student is not Khatim/QuranicDay)
    if (!(sessionType === 'MURAJAAH' || sessionType === 'BOTH' || isKhatim || isQuranicDaySession)) return null;

    return (
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">من سورة</label>
                                        <select
                                            value={mFromSurah}
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">إلى سورة</label>
                                        <select
                                            value={mToSurah}
                                            onChange={e => {
                                                const surahId = parseInt(e.target.value);
                                                const s = quranData.find(x => x.id === surahId);
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

                                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-800">
                                    <div>
                                        <label className="block text-xs font-bold text-red-600 mb-2">أخطاء</label>
                                        <input type="number" value={errorsCount} onFocus={() => errorsCount === 0 && setErrorsCount('')} onBlur={() => errorsCount === '' && setErrorsCount(0)} onChange={e => { const v = e.target.value; if (v === '') setErrorsCount(''); else setErrorsCount(Math.max(0, parseFloat(v) || 0)); }} min="0" className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-red-400 rounded-2xl outline-none font-bold dark:text-white" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-orange-600 mb-2">تنبيهات</label>
                                        <input type="number" value={alertsCount} onFocus={() => alertsCount === 0 && setAlertsCount('')} onBlur={() => alertsCount === '' && setAlertsCount(0)} onChange={e => { const v = e.target.value; if (v === '') setAlertsCount(''); else setAlertsCount(Math.max(0, parseFloat(v) || 0)); }} min="0" className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-orange-400 rounded-2xl outline-none font-bold dark:text-white" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-emerald-600 mb-2">نقية</label>
                                        <input type="number" step="0.5" value={cleanPagesCount} onFocus={() => cleanPagesCount === 0 && setCleanPagesCount('')} onBlur={() => cleanPagesCount === '' && setCleanPagesCount(0)} onChange={e => { const v = e.target.value; if (v === '') setCleanPagesCount(''); else setCleanPagesCount(Math.max(0, parseFloat(v) || 0)); }} min="0" className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none font-bold dark:text-white" placeholder="0" />
                                    </div>
                                </div>

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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">من سورة</label>
                                        <select
                                            value={minorMFromSurah}
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-400 mb-2 mr-2">إلى سورة</label>
                                        <select
                                            value={minorMToSurah}
                                            onChange={e => {
                                                const surahId = parseInt(e.target.value);
                                                const s = quranData.find(x => x.id === surahId);
                                                setMinorMToSurah(surahId);
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

                                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-800">
                                    <div>
                                        <label className="block text-xs font-bold text-red-600 mb-2">أخطاء</label>
                                        <input type="number" value={minorErrors} onFocus={() => minorErrors === 0 && setMinorErrors('')} onBlur={() => minorErrors === '' && setMinorErrors(0)} onChange={e => { const v = e.target.value; if (v === '') setMinorErrors(''); else setMinorErrors(Math.max(0, parseFloat(v) || 0)); }} min="0" className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-red-400 rounded-2xl outline-none font-bold dark:text-white" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-orange-600 mb-2">تنبيهات</label>
                                        <input type="number" value={minorAlerts} onFocus={() => minorAlerts === 0 && setMinorAlerts('')} onBlur={() => minorAlerts === '' && setMinorAlerts(0)} onChange={e => { const v = e.target.value; if (v === '') setMinorAlerts(''); else setMinorAlerts(Math.max(0, parseFloat(v) || 0)); }} min="0" className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-orange-400 rounded-2xl outline-none font-bold dark:text-white" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-emerald-600 mb-2">نقية</label>
                                        <input type="number" step="0.5" value={minorCleanPages} onFocus={() => minorCleanPages === 0 && setMinorCleanPages('')} onBlur={() => minorCleanPages === '' && setMinorCleanPages(0)} onChange={e => { const v = e.target.value; if (v === '') setMinorCleanPages(''); else setMinorCleanPages(Math.max(0, parseFloat(v) || 0)); }} min="0" className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none font-bold dark:text-white" placeholder="0" />
                                    </div>
                                </div>

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
    );
}
