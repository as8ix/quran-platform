'use client';

export default function PointsScanner({ isScanning, setIsScanning, mode }) {
    return (
        <div className={`space-y-6 ${isScanning ? 'fixed inset-0 z-[100] bg-black p-0 md:relative md:inset-auto md:bg-transparent' : ''}`}>
            {isScanning && (
                <button 
                    onClick={() => setIsScanning(false)}
                    className="absolute top-6 right-6 z-[110] w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center font-black md:hidden"
                >
                    ✕
                </button>
            )}
            <div className={`premium-glass rounded-[3rem] border-4 ${mode === 'deduct' ? 'border-rose-500' : 'border-emerald-500'} relative overflow-hidden bg-black ${isScanning ? 'h-full md:h-auto' : 'p-8'}`}>
                <div id="reader" className={`w-full h-full overflow-hidden ${isScanning ? 'scale-110' : ''}`}></div>
                {!isScanning && (
                    <div className="text-center py-20 opacity-40">
                        <div className="text-6xl mb-4">📷</div>
                        <p className="font-black text-slate-400">اضغط على الزر بالأعلى لبدء رصد نقاط طلابك</p>
                    </div>
                )}
            </div>
        </div>
    );
}
