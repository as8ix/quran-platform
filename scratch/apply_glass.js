const fs = require('fs');
const path = require('path');

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Common container replacements
            content = content.replace(/className="bg-white dark:bg-slate-800([^"]*?)"/g, (match, classes) => {
                // If it already has card-premium or premium-glass, skip it
                if (classes.includes('premium-glass') || classes.includes('card-premium')) {
                    return match;
                }
                return `className="premium-glass${classes}"`;
            });

            content = content.replace(/className="bg-white([^"]*?)"/g, (match, classes) => {
                // Ignore strings that already have dark:bg-slate or glass classes
                if (classes.includes('premium-glass') || classes.includes('card-premium') || classes.includes('dark:bg-') || match.includes('bg-white/')) {
                    return match;
                }
                // Also ignore text and borders
                return `className="premium-glass${classes}"`;
            });
            
            content = content.replace(/className='bg-white([^']*?)'/g, (match, classes) => {
                // Same logic for single quotes
                if (classes.includes('premium-glass') || classes.includes('card-premium') || classes.includes('dark:bg-') || match.includes('bg-white/')) {
                    return match;
                }
                return `className='premium-glass${classes}'`;
            });

            // Specific targeting like modals which need z-index but can use glass
            content = content.replace(/bg-white dark:bg-slate-900/g, 'premium-glass');
            
            // Replace generic backdrops with more blur
            content = content.replace(/bg-black\/50/g, 'bg-black/40 backdrop-blur-sm');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

processDirectory(path.join(__dirname, '../app'));
console.log('Done replacing classes for glassmorphism.');
