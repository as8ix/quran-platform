const fs = require('fs');
const path = 'app/api/dev/status/route.js';
let content = fs.readFileSync(path, 'utf8');

if (content.includes("../../lib/prisma")) {
    content = content.replace("../../lib/prisma", "../../../lib/prisma");
    fs.writeFileSync(path, content);
    console.log('Successfully fixed prisma import path.');
} else {
    console.log('Import path not found or already fixed.');
}
