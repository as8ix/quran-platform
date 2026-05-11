'use client';

import AddStudentModal from '@/app/components/AddStudentModal';
import ReportModal from '@/app/components/ReportModal';

export default function TeacherModals({ 
    showAddModal, 
    setShowAddModal, 
    showReportModal, 
    setShowReportModal, 
    fetchStudents, 
    teacherHalaqas, 
    user 
}) {
    return (
        <>
            <AddStudentModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={() => {
                    setShowAddModal(false);
                    fetchStudents();
                }}
                halaqaId={teacherHalaqas.length > 0 ? teacherHalaqas[0].id : (user?.halaqaId || null)}
            />

            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                teacher={user}
                teacherNames={user?.name}
            />
        </>
    );
}
