const fs = require('fs');
const path = 'app/teacher/student/[id]/page.jsx';
let content = fs.readFileSync(path, 'utf8');

const modalCode = `
    {/* Edit Student Modal */}
    <AddStudentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onAdd={() => {
            setShowEditModal(false);
            fetchStudent();
        }}
        student={student}
        halaqaId={student?.halaqaId}
    />
`;

// More robust regex to find the end of the return statement
// Using [^] to match any character including newlines
const endTagPattern = /<\/div>\s*\);\s*\}\s*$/;

if (!content.includes('<AddStudentModal')) {
    if (content.match(endTagPattern)) {
        content = content.replace(endTagPattern, modalCode + '\n</div>\n);\n}');
        fs.writeFileSync(path, content);
        console.log('Successfully restored <AddStudentModal />.');
    } else {
        console.log('End of component not found as expected. Trying fallback.');
        // Fallback: search for the very last </div> before the end
        const lastDivIndex = content.lastIndexOf('</div>');
        if (lastDivIndex !== -1) {
             const before = content.substring(0, lastDivIndex);
             const after = content.substring(lastDivIndex);
             content = before + modalCode + after;
             fs.writeFileSync(path, content);
             console.log('Successfully restored <AddStudentModal /> using fallback.');
        } else {
             console.log('Could not find any </div> tag to insert before.');
        }
    }
} else {
    console.log('<AddStudentModal /> already exists in the file.');
}
