const fs = require('fs');

try {
    const data = JSON.parse(fs.readFileSync('app/data/madinahMushaf/hafs_smart_v8.json', 'utf8'));
    let map = {};
    data.forEach(a => {
        if (!map[a.sura_no]) {
            map[a.sura_no] = {};
        }
        map[a.sura_no][a.aya_no] = { p: a.page, s: a.line_start, e: a.line_end };
    });
    
    // Convert to exporting a constant
    const output = 'export const exactAyahMap = ' + JSON.stringify(map) + ';';
    fs.writeFileSync('app/data/exactAyahMap.js', output, 'utf8');
    console.log('done, exactAyahMap created.');
} catch (e) {
    console.error(e);
}
