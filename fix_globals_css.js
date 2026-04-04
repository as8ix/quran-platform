const fs = require('fs');
const path = 'app/globals.css';
let content = fs.readFileSync(path, 'utf8');

const scrollbarCSS = `
/* Custom Scrollbar Utility */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1; /* slate-300 fallback */
  border-radius: 9999px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #475569; /* slate-600 fallback */
}
`;

if (!content.includes('.custom-scrollbar')) {
    content += scrollbarCSS;
    fs.writeFileSync(path, content);
    console.log('Successfully added .custom-scrollbar to globals.css.');
} else {
    console.log('.custom-scrollbar already defined.');
}
