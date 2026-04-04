const { execSync } = require('child_process');
const fs = require('fs');

try {
    // We'll use a more surgical git show to get just the labels and state names
    const out = execSync('git show "HEAD~1:app/components/AddStudentModal.jsx"').toString();
    const stateVars = out.match(/const \[(\w+), set\w+\] = useState\(/g) || [];
    const labels = out.match(/<label.*?>([^<]+)<\/label>/g) || [];
    
    fs.writeFileSync('analysis.txt', 
        'STATES:\n' + stateVars.join('\n') + 
        '\n\nLABELS:\n' + labels.join('\n')
    );
    console.log('Analysis written.');
} catch (e) {
    console.log('Analysis failed.');
}
