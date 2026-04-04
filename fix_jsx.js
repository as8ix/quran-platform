const fs = require('fs');
const path = 'app/teacher/student/[id]/page.jsx';
let content = fs.readFileSync(path, 'utf8');

// The problematic section is likely:
// </div>
// <div>
// <div className="text-[9px] ...

// We want to change it to:
// </div>
// )}
// {session.minorMurajaahFromSurah && (
// <div>
// <div className="text-[9px] ...

const target = /<\/div>\s*<div>\s*<div className="text-\[9px\] font-bold text-blue-500/g;
const replacement = '</div>\n                                                        )}\n\n                                                        {session.minorMurajaahFromSurah && (\n                                                            <div>\n                                                                <div className="text-[9px] font-bold text-blue-500';

if (content.match(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Successfully fixed JSX corruption.');
} else {
    console.log('Target section not found. Checking if it was already closed or had another format.');
    // Try a second variant if the first failed
    const target2 = /<\/div>\s*<div>\s*<div className="text-\[9px\]/g;
    if (content.match(target2)) {
         content = content.replace(target2, '</div>\n                                                        )}\n\n                                                        {session.minorMurajaahFromSurah && (\n                                                            <div>\n                                                                <div className="text-[9px]');
         fs.writeFileSync(path, content);
         console.log('Successfully fixed JSX corruption (variant 2).');
    } else {
         console.log('Target section still not found.');
    }
}
