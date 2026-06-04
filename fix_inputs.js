const fs = require('fs');

const path = 'app/teacher/student/[id]/page.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace value={varName || ''} or value={varName || 0}
content = content.replace(/value=\{([a-zA-Z0-9_]+)\s*\|\|\s*(?:0|'')\}/g, "value={$1 === '' ? '' : $1}");

// Replace onFocus={() => varName === 0 && setVarName('')}
// or onFocus={() => varName === 1 && setVarName('')}
content = content.replace(/onFocus=\{\(\)\s*=>\s*([a-zA-Z0-9_]+)\s*===\s*[0-9]+\s*&&\s*set([a-zA-Z0-9_]+)\(''\)\}/g, "onFocus={(e) => e.target.select()}");

// Replace onBlur={() => varName === '' && setVarName(0)}
// or setVarName(1)
content = content.replace(/onBlur=\{\(\)\s*=>\s*([a-zA-Z0-9_]+)\s*===\s*''\s*&&\s*set([a-zA-Z0-9_]+)\([0-9]+\)\}/g, "");

fs.writeFileSync(path, content);
console.log('Fixed file.');
