const fs = require('fs');

// 1. Fix globals.css
const cssPath = 'app/globals.css';
if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf8');
    // Remove custom-scrollbar from @apply
    if (css.includes('custom-scrollbar')) {
        css = css.replace('custom-scrollbar', '');
        fs.writeFileSync(cssPath, css);
        console.log('Successfully removed custom-scrollbar from globals.css.');
    }
}

// 2. Fix route.js prisma import
const apiPath = 'app/api/dev/status/route.js';
if (fs.existsSync(apiPath)) {
    let api = fs.readFileSync(apiPath, 'utf8');
    const lines = api.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('lib/prisma')) {
            lines[i] = "import { prisma } from '@/app/lib/prisma';";
            break;
        }
    }
    fs.writeFileSync(apiPath, lines.join('\n'));
    console.log('Successfully fixed prisma import in route.js.');
}
