const fs = require('fs');
const filepath = 'app/api/sessions/route.js';

let code = fs.readFileSync(filepath, 'utf8');

// Replace standard variables 
code = code.replace(/cleanPagesCount:\s*parseInt\(fields\.cleanPagesCount\)/g, 'cleanPagesCount: parseFloat(fields.cleanPagesCount)');
code = code.replace(/minorCleanPagesCount:\s*parseInt\(fields\.minorCleanPagesCount\)/g, 'minorCleanPagesCount: parseFloat(fields.minorCleanPagesCount)');
code = code.replace(/hifzCleanPages:\s*parseInt\(fields\.hifzCleanPages\)/g, 'hifzCleanPages: parseFloat(fields.hifzCleanPages)');

code = code.replace(/updateData\.cleanPagesCount\s*=\s*parseInt\(fields\.cleanPagesCount\)/g, 'updateData.cleanPagesCount = parseFloat(fields.cleanPagesCount)');
code = code.replace(/updateData\.minorCleanPagesCount\s*=\s*parseInt\(fields\.minorCleanPagesCount\)/g, 'updateData.minorCleanPagesCount = parseFloat(fields.minorCleanPagesCount)');
code = code.replace(/updateData\.hifzCleanPages\s*=\s*parseInt\(fields\.hifzCleanPages\)/g, 'updateData.hifzCleanPages = parseFloat(fields.hifzCleanPages)');


fs.writeFileSync(filepath, code, 'utf8');
console.log('API code updated to support Float clean pages.');
