const fs = require('fs');

const path = 'app/teacher/student/[id]/page.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /value=\{([a-zA-Z0-9_]+)\s*===\s*''\s*\?\s*''\s*:\s*\1\}\s*onFocus=\{\(e\)\s*=>\s*e\.target\.select\(\)\}/g;

const newContent = content.replace(regex, (match, varName) => {
    const setterName = 'set' + varName.charAt(0).toUpperCase() + varName.slice(1);
    return `value={${varName} === '' ? '' : ${varName}} onFocus={() => ${varName} === 0 && ${setterName}('')} onBlur={() => ${varName} === '' && ${setterName}(0)}`;
});

fs.writeFileSync(path, newContent);
console.log('Fixed mobile inputs:', (content.match(regex) || []).length);
