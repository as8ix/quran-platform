const { execSync } = require('child_process');
const fs = require('fs');

try {
    // Try to get the version from 5 commits ago to be safe (before my session started)
    const originalCode = execSync('git show HEAD~5:app/components/AddStudentModal.jsx').toString();
    fs.writeFileSync('original_modal_code.txt', originalCode);
    console.log('Successfully retrieved original modal code.');
} catch (error) {
    console.log('Git show HEAD~5 failed, trying HEAD~3...');
    try {
        const originalCode = execSync('git show HEAD~3:app/components/AddStudentModal.jsx').toString();
        fs.writeFileSync('original_modal_code.txt', originalCode);
        console.log('Successfully retrieved original modal code.');
    } catch (error2) {
        console.log('Git show failed. Looking for current file...');
    }
}
