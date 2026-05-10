const fs = require('fs');
const path = require('path');

// This is a guess on where the data is stored. Usually it's in a JSON file or SQLite.
// Based on previous conversations, I'll check for a data directory.
const dataDir = path.join(process.cwd(), 'data');
const studentsFile = path.join(dataDir, 'students.json');

if (fs.existsSync(studentsFile)) {
    const students = JSON.parse(fs.readFileSync(studentsFile, 'utf8'));
    const student = students.find(s => s.id === 69);
    console.log('Student 69 Data:', JSON.stringify(student, null, 2));
} else {
    console.log('Students file not found at', studentsFile);
}
