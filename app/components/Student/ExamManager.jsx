'use client';

import BaseModal from '@/app/components/Global/BaseModal';

export default function ExamManager({ 
    isOpen, 
    onClose, 
    examDate, 
    setExamDate, 
    examTime, 
    setExamTime, 
    onSave 
}) {
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="تحديد موعد الاختبار"
            maxWidth="max-w-md"
            titleColor="text-indigo-600 dark:text-indigo-400"
        >
            <div className="space-y-6 py-4" dir="rtl">
                <div>
                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 mr-1">تاريخ الاختبار</label>
                    <input
                        type="date"
                        value={examDate}
                        onChange={e => setExamDate(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 mr-1">وقت الاختبار</label>
                    <input
                        type="text"
                        value={examTime}
                        onChange={e => setExamTime(e.target.value)}
                        placeholder="مثال: بعد صلاة العشاء"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold dark:text-white"
                    />
                </div>
                <div className="flex gap-4 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black hover:bg-slate-200"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all"
                    >
                        حفظ الموعد
                    </button>
                </div>
            </div>
        </BaseModal>
    );
}
