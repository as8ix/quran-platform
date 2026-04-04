const fs = require('fs');
const path = 'app/globals.css';
let content = fs.readFileSync(path, 'utf8');

const targetOverlay = `.modal-overlay {
  @apply fixed inset-0 bg-black/60 backdrop-blur-md flex items-start sm:items-center justify-center p-2 sm:p-6 z-[9999] pt-4 sm:pt-0 overflow-hidden;
}`;

const premiumOverlay = `.modal-overlay {
  @apply fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-start sm:items-center justify-center p-2 sm:p-6 z-[10000] pt-4 sm:pt-0 overflow-hidden animate-fadeIn;
}`;

if (content.includes(targetOverlay)) {
    content = content.replace(targetOverlay, premiumOverlay);
    fs.writeFileSync(path, content);
    console.log('Successfully updated modal-overlay to premium style.');
} else {
    console.log('Target overlay NOT found exactly.');
}
