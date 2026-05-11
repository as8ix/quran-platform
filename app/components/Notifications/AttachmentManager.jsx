'use client';

export default function AttachmentManager({ 
    attachmentMode, 
    setAttachmentMode, 
    attachmentUrl, 
    setAttachmentUrl, 
    attachmentType,
    setAttachmentType,
    handleFileUpload,
    uploading,
    uploadProgress
}) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">المرفقات</label>
                <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-0.5 rounded-lg backdrop-blur-sm">
                    <button 
                        type="button" 
                        onClick={() => setAttachmentMode('URL')} 
                        className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${attachmentMode === 'URL' ? 'bg-white/90 dark:bg-slate-700/90 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                    >
                        رابط
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setAttachmentMode('FILE')} 
                        className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${attachmentMode === 'FILE' ? 'bg-white/90 dark:bg-slate-700/90 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                    >
                        ملف
                    </button>
                </div>
            </div>

            <div className="p-4 bg-white/10 dark:bg-slate-800/10 rounded-3xl border border-slate-200 dark:border-slate-800 h-[180px] flex flex-col justify-center backdrop-blur-sm shadow-sm">
                {attachmentMode === 'URL' ? (
                    <div className="space-y-3">
                        <div className="flex gap-1.5">
                            {['IMAGE', 'LINK', 'VIDEO'].map((type) => (
                                <button 
                                    key={type}
                                    type="button" 
                                    onClick={() => setAttachmentType(type)} 
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${attachmentType === type ? 'bg-indigo-600 text-white' : 'bg-white/20 dark:bg-slate-800/40 text-slate-500'}`}
                                >
                                    {type === 'IMAGE' ? 'صورة' : type === 'LINK' ? 'رابط' : 'فيديو'}
                                </button>
                            ))}
                        </div>
                        <input
                            type="url"
                            value={attachmentUrl}
                            onChange={(e) => setAttachmentUrl(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/20 dark:bg-slate-900/30 border border-slate-100/30 dark:border-slate-700/30 text-[11px] font-bold outline-none focus:border-indigo-500 transition-all backdrop-blur-sm"
                            placeholder="https://..."
                        />
                    </div>
                ) : (
                    <div className={`relative border-2 border-dashed rounded-2xl p-4 text-center group transition-all h-full flex flex-col items-center justify-center ${uploading ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-200/50 dark:border-slate-800/50 hover:border-indigo-500 bg-white/10'}`}>
                        <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        {uploading ? (
                            <div className="w-full space-y-2 px-2">
                                <div className="text-[10px] font-black text-indigo-600">جاري الرفع {uploadProgress}%</div>
                                <div className="w-full h-1 bg-indigo-100 dark:bg-indigo-900/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 transition-all" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            </div>
                        ) : attachmentUrl ? (
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-10 h-10 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-xl">✅</div>
                                <span className="text-[10px] font-black text-emerald-600">تم الرفع</span>
                                <button type="button" onClick={() => setAttachmentUrl('')} className="text-[10px] font-black text-red-500 hover:underline">حذف</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-10 h-10 bg-white/30 dark:bg-slate-800/30 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📁</div>
                                <span className="text-[10px] font-black text-slate-400">انقر للرفع</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
