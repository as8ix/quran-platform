const fs = require('fs');
const path = 'app/api/dev/status/route.js';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
console.log('Line 3: ' + lines[2]);
