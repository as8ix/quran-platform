const fs = require('fs');
const filepath = 'app/teacher/student/[id]/page.jsx';

let code = fs.readFileSync(filepath, 'utf8');

// Replace standard variables in modal / form submits
code = code.replace(/cleanPagesCount:\s*parseInt\(mCleanPages\)/g, 'cleanPagesCount: parseFloat(mCleanPages)');
code = code.replace(/minorCleanPagesCount:\s*parseInt\(minorCleanPages\)/g, 'minorCleanPagesCount: parseFloat(minorCleanPages)');
code = code.replace(/hifzCleanPages:\s*parseInt\(hifzCleanPages\)/g, 'hifzCleanPages: parseFloat(hifzCleanPages)');

// Replace in inputs for setting values
code = code.replace(/setMCleanPages\(parseInt\(e\.target\.value\)/g, 'setMCleanPages(parseFloat(e.target.value)');
code = code.replace(/setMinorCleanPages\(parseInt\(e\.target\.value\)/g, 'setMinorCleanPages(parseFloat(e.target.value)');
code = code.replace(/setHifzCleanPages\(parseInt\(e\.target\.value\)/g, 'setHifzCleanPages(parseFloat(e.target.value)');

// Replace editing session logic
code = code.replace(/cleanPagesCount:\s*parseInt\(e\.target\.value\)/g, 'cleanPagesCount: parseFloat(e.target.value)');
code = code.replace(/minorCleanPagesCount:\s*parseInt\(e\.target\.value\)/g, 'minorCleanPagesCount: parseFloat(e.target.value)');
code = code.replace(/hifzCleanPages:\s*parseInt\(e\.target\.value\)/g, 'hifzCleanPages: parseFloat(e.target.value)');

// Add step="0.25" to any input for clean pages
code = code.replace(/<input type="number" min="0" value=\{mCleanPages\}/g, '<input type="number" min="0" step="0.25" value={mCleanPages}');
code = code.replace(/<input type="number" min="0" value=\{minorCleanPages\}/g, '<input type="number" min="0" step="0.25" value={minorCleanPages}');
code = code.replace(/<input type="number" min="0" value=\{hifzCleanPages\}/g, '<input type="number" min="0" step="0.25" value={hifzCleanPages}');
code = code.replace(/<input type="number" min="0" value=\{editingSession\.cleanPagesCount \?\? 0\}/g, '<input type="number" min="0" step="0.25" value={editingSession.cleanPagesCount ?? 0}');
code = code.replace(/<input type="number" min="0" value=\{editingSession\.minorCleanPagesCount \?\? 0\}/g, '<input type="number" min="0" step="0.25" value={editingSession.minorCleanPagesCount ?? 0}');

fs.writeFileSync(filepath, code, 'utf8');
console.log('App code updated to support Float clean pages.');
