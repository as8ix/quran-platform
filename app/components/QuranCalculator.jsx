'use client';

import { useState } from 'react';
import { quranData } from '../data/quranData';

export default function QuranCalculator() {
    const [startSurah, setStartSurah] = useState('');
    const [endSurah, setEndSurah] = useState('');
    const [startPage, setStartPage] = useState('');
    const [endPage, setEndPage] = useState('');
    const [result, setResult] = useState(null);

    const calculateAmount = () => {
        let sPage = parseInt(startPage);
        let ePage = parseInt(endPage);

        // Filter logic if surah is selected but page is not manually entered or overridden
        if (startSurah) {
            const surahValues = quranData.find(s => s.id === parseInt(startSurah));
            if (surahValues && !startPage) sPage = surahValues.startPage;
        }
        if (endSurah) {
            const surahValues = quranData.find(s => s.id === parseInt(endSurah));
            if (surahValues && !endPage) ePage = surahValues.startPage + Math.ceil(surahValues.ayahs / 15); // Rough estimate if only surah selected
            // Better: if user selects same surah, startPage = surah start, endPage = surah end (next surah start - 1)
        }

        if (sPage && ePage) {
            const totalPages = ePage - sPage + 1;
            const totalLines = totalPages * 15; // Madani standard
            setResult({ pages: totalPages, lines: totalLines });
        }
    };

    const handleSurahChange = (type, surahId) => {
        const surah = quranData.find(s => s.id === parseInt(surahId));
        if (surah) {
            if (type === 'start') {
                setStartSurah(surahId);
                setStartPage(surah.startPage);
            } else {
                setEndSurah(surahId);
                // Logic: If end surah is selected, maybe default endPage to the end of that surah?
                // Find next surah start - 1
                const nextSurah = quranData.find(s => s.id === parseInt(surahId) + 1);
                const endOfSurah = nextSurah ? nextSurah.startPage - 1 : 604;
                setEndPage(endOfSurah);
            }
        }
    };

    return (
        <div className="card-premium p-6">
            <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🧮</span>
                <h2 className="text-2xl font-bold text-gray-800">حاسبة الإنجاز</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Start Point */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">البداية</label>
                    <select
                        className="input-field"
                        value={startSurah}
                        onChange={(e) => handleSurahChange('start', e.target.value)}
                    >
                        <option value="">اختر السورة...</option>
                        {quranData.map(s => <option key={s.id} value={s.id}>{s.id}. {s.name}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">أو صفحة:</span>
                        <input
                            type="number"
                            className="input-field text-center"
                            placeholder="رقم الصفحة"
                            value={startPage}
                            onChange={(e) => { setStartPage(e.target.value); setStartSurah(''); }} // Clear surah if manual page
                        />
                    </div>
                </div>

                {/* End Point */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">النهاية</label>
                    <select
                        className="input-field"
                        value={endSurah}
                        onChange={(e) => handleSurahChange('end', e.target.value)}
                    >
                        <option value="">اختر السورة...</option>
                        {quranData.map(s => <option key={s.id} value={s.id}>{s.id}. {s.name}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">أو صفحة:</span>
                        <input
                            type="number"
                            className="input-field text-center"
                            placeholder="رقم الصفحة"
                            value={endPage}
                            onChange={(e) => { setEndPage(e.target.value); setEndSurah(''); }}
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={calculateAmount}
                className="w-full btn-primary mb-6"
            >
                احسب الإنجاز
            </button>

            {result && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 animate-slide-in-right">
                    <div className="flex justify-around items-center text-center">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">عدد الصفحات</p>
                            <p className="text-3xl font-bold text-green-700">{result.pages}</p>
                        </div>
                        <div className="w-px h-12 bg-green-200"></div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">عدد الأسطر (تقديري)</p>
                            <p className="text-3xl font-bold text-green-700">{result.lines}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
