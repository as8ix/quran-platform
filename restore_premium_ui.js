const fs = require('fs');
const path = 'app/components/AddStudentModal.jsx';
let content = fs.readFileSync(path, 'utf8');

const targetHeader = `<div className="modal-header bg-gradient-to-r from-emerald-600 to-teal-500 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <span className="text-8xl">🕌</span>
                    </div>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-bold font-noto text-white mb-0 mt-0">{student ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</h3>
                            <p className="text-emerald-50 opacity-80 mt-1">{student ? 'تعديل معلومات الطالب وتعقب الإنجاز' : 'قم بتعبئة بيانات الطالب للبدء في تتبعه'}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl hover:bg-white/30 transition-all flex items-center justify-center text-xl sm:text-2xl backdrop-blur-sm"
                        >
                            ✕
                        </button>
                    </div>
                </div>`;

const premiumHeader = `
                <div className="modal-header bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 text-white relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none transform translate-x-4 -translate-y-4">
                        <span className="text-9xl">🕌</span>
                    </div>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className="text-2xl sm:text-4xl font-black font-noto text-white mb-1 mt-0 drop-shadow-lg">{student ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</h3>
                            <p className="text-emerald-50 opacity-90 mt-1 font-bold">{student ? 'تعديل معلومات الطالب وتعقب الإنجاز' : 'قم بتعبئة بيانات الطالب للبدء في تتبعه'}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl hover:bg-white/40 transition-all flex items-center justify-center text-xl sm:text-2xl backdrop-blur-md border border-white/30 shadow-xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>`;

if (content.includes(targetHeader)) {
    content = content.replace(targetHeader, premiumHeader);
    fs.writeFileSync(path, content);
    console.log('Successfully restored premium UI to AddStudentModal.');
} else {
    console.log('Target header NOT found exactly. Checking for partial match.');
    // Try a simpler match
    const simpleMatch = /<div className="modal-header bg-gradient-to-r from-emerald-600 to-teal-500 text-white relative">[^]*?<button[^]*?<\/button>\s*<\/div>\s*<\/div>/;
    if (content.match(simpleMatch)) {
         content = content.replace(simpleMatch, premiumHeader);
         fs.writeFileSync(path, content);
         console.log('Successfully restored premium UI using partial match.');
    } else {
         console.log('Could not find header to replace.');
    }
}
