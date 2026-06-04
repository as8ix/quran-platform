'use client';

export default function ViewKhayrukumCertificateModal({ isOpen, onClose, certificate, studentName }) {
    if (!isOpen || !certificate) return null;

    const handlePrint = () => {
        // Open the file in a new tab which usually triggers browser print/save PDF options, or just opens the image.
        window.open(certificate.fileUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm rtl font-noto" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-sky-50/50 dark:bg-sky-900/10 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <span className="text-3xl">📜</span>
                            {certificate.title ? certificate.title : `شهادة اجتياز الفرع ${certificate.branchNumber}`}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold text-sm">
                            بتقدير {certificate.grade}% - بتاريخ {new Date(certificate.examDate).toLocaleDateString('ar-SA')}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Body (File Viewer) */}
                <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex-1 flex items-center justify-center min-h-[400px]">
                    {certificate.fileUrl.endsWith('.pdf') ? (
                        <iframe 
                            src={`${certificate.fileUrl}#view=FitH`} 
                            className="w-full h-full min-h-[500px] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner" 
                            title="Certificate PDF"
                        />
                    ) : (
                        <img 
                            src={certificate.fileUrl} 
                            alt={`شهادة الفرع ${certificate.branchNumber}`}
                            className="max-w-full max-h-full rounded-2xl shadow-lg border-4 border-white dark:border-slate-800 object-contain"
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        إغلاق
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="flex-[2] py-4 bg-sky-600 text-white rounded-2xl font-black text-lg hover:bg-sky-700 shadow-xl shadow-sky-200/50 dark:shadow-none hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        طباعة الشهادة
                    </button>
                </div>
            </div>
        </div>
    );
}
