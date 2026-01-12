const fs = require('fs');
const path = require('path');

function findStrings(filePath) {
    const buffer = fs.readFileSync(filePath);
    let currentString = '';
    const strings = [];

    for (let i = 0; i < buffer.length; i++) {
        const charCode = buffer[i];
        // Arabic characters are in a specific range, let's just look for any printable stuff or common Arabic range
        // UTF-8 Arabic starts around 0xD8 0x80 to 0xD9 0xBF
        if ((charCode >= 32 && charCode <= 126) || charCode > 128) {
            currentString += String.fromCharCode(charCode);
        } else {
            if (currentString.length > 3) {
                strings.push(currentString);
            }
            currentString = '';
        }
    }

    // Filter for some known names or keywords
    const keywords = ['محمد', 'أحمد', 'بسام', 'سلمان', 'عيسى', 'Student', 'Halaqa'];
    const matches = strings.filter(s => keywords.some(k => s.includes(k)));

    console.log(`Found ${matches.length} interesting strings in ${filePath}:`);
    matches.slice(0, 20).forEach(m => console.log(` - ${m}`));
}

findStrings('dev.db');
