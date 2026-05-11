'use client';

export default function NotificationForm({ title, setTitle, message, setMessage }) {
    return (
        <div className="space-y-5">
            <div className="relative group">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.2em] mr-1">
                    عنوان الإشعار <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50/30 dark:bg-slate-800/20 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500/20 focus:bg-white/60 dark:focus:bg-slate-900/60 rounded-2xl outline-none transition-all font-bold dark:text-white text-sm sm:text-base backdrop-blur-sm shadow-inner"
                    placeholder="عنوان الإشعار..."
                    required
                />
            </div>
            <div className="relative group">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.2em] mr-1">
                    محتوى الإشعار <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-6 py-5 bg-slate-50/30 dark:bg-slate-800/20 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500/20 focus:bg-white/60 dark:focus:bg-slate-900/60 rounded-3xl outline-none transition-all h-32 resize-none font-bold dark:text-white text-sm sm:text-base backdrop-blur-sm shadow-inner"
                    placeholder="اكتب المحتوى هنا..."
                    required
                ></textarea>
            </div>
        </div>
    );
}
