const fs = require('fs');
const path = 'app/teacher/student/[id]/page.jsx';
let content = fs.readFileSync(path, 'utf8');

// We search for the start of the closing button which is still intact
const anchor = '<span>إغلاق</span>';

const newEnd = `
                    <span>✕</span>
                </button>
            </div>
        </div>
    )}

    {student && (
        <AddStudentModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onAdd={() => {
                setShowEditModal(false);
                fetchStudent();
            }}
            halaqaId={student.halaqaId}
            student={student}
        />
    )}
    
</div>
);
}
`;

const index = content.indexOf(anchor);
if (index !== -1) {
    const cleanContent = content.substring(0, index + anchor.length);
    // Find the first occurrence correctly
    fs.writeFileSync(path, cleanContent + newEnd);
    console.log('Successfully repaired the file and restored AddStudentModal.');
} else {
    console.log('Anchor NOT found.');
}
