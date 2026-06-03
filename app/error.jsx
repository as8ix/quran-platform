'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled runtime error caught by boundary:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-transparent p-6 font-noto text-center" dir="rtl">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-rose-100 dark:border-rose-900/30 max-w-2xl w-full">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
          ⚠️
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-4">
          عذراً، حدث خطأ غير متوقع في النظام!
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
          تم تسجيل الخطأ، نرجو منك التقاط صورة لهذا الخطأ أو إرسال تفاصيله:
        </p>
        
        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl text-left font-mono text-sm text-rose-500 overflow-x-auto mb-8 whitespace-pre-wrap max-h-48 overflow-y-auto" dir="ltr">
          {error.message || error.toString()}
        </div>

        <button
          onClick={() => {
            reset();
            window.location.reload();
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95"
        >
          حاول مرة أخرى
        </button>
      </div>
    </div>
  );
}
