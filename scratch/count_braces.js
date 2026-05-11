const fs = require('fs');
const content = fs.readFileSync('app/teacher/student/[id]/page.jsx', 'utf8');
let open = 0;
let close = 0;
for (let char of content) {
    if (char === '{') open++;
    if (char === '}') close++;
}
console.log('Open Braces:', open);
console.log('Close Braces:', close);
console.log('Balance:', open - close);
