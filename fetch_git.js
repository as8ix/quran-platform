const { spawn } = require('child_process');
const fs = require('fs');

const child = spawn('git', ['show', 'HEAD:app/components/AddStudentModal.jsx']);

let data = '';
child.stdout.on('data', (chunk) => {
    data += chunk;
});

child.on('close', (code) => {
    if (code === 0) {
        fs.writeFileSync('original_modal.txt', data);
        console.log('Successfully saved original modal.');
    } else {
        console.log('Git show failed with code ' + code);
    }
});
