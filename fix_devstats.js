const fs = require('fs');
const path = 'app/teacher/student/[id]/page.jsx';
let content = fs.readFileSync(path, 'utf8');

// Remove the DevStats component usage that causes the ReferenceError
if (content.includes('<DevStats />')) {
    content = content.replace('<DevStats />', '');
    fs.writeFileSync(path, content);
    console.log('Successfully removed undefined <DevStats /> component.');
} else {
    console.log('<DevStats /> component not found.');
}
