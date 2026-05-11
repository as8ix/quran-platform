'use client';

import Navbar from '@/app/components/Navbar';
import LoadingScreen from '@/app/components/LoadingScreen';
import { useTheme } from '@/app/components/ThemeProvider';
import { useTeacherDashboard } from './_hooks/useTeacherDashboard';

// Components
import TeacherHero from '@/app/components/Teacher/TeacherHero';
import StudentFilters from '@/app/components/Teacher/StudentFilters';
import StudentSections from '@/app/components/Teacher/StudentSections';
import TeacherModals from '@/app/components/Teacher/TeacherModals';

export default function TeacherDashboard() {
    const { isDarkMode, mounted } = useTheme();
    const {
        router,
        showAddModal,
        setShowAddModal,
        showReportModal,
        setShowReportModal,
        searchTerm,
        setSearchTerm,
        juzFilter,
        setJuzFilter,
        loading,
        students,
        user,
        teacherHalaqas,
        pointsEnabled,
        getFirstName,
        teacherName,
        filteredStudents,
        fetchStudents
    } = useTeacherDashboard();

    if (!mounted || (loading && students.length === 0)) return <LoadingScreen />;
    
    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-noto rtl transition-colors duration-300 relative overflow-hidden" dir="rtl">
            {/* Premium Edge Glows */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60 dark:opacity-80">
                <div className="premium-glow-emerald"></div>
                <div className="premium-glow-purple"></div>
            </div>

            <Navbar 
                userType="teacher" 
                userName={teacherName} 
                onLogout={() => router.push('/login')} 
                displayId={user?.displayId} 
            />

            <main className="max-w-7xl mx-auto px-4 pt-28 pb-12 md:px-6 lg:px-8 relative z-10">
                <TeacherHero 
                    user={user}
                    students={students}
                    teacherHalaqas={teacherHalaqas}
                    pointsEnabled={pointsEnabled}
                    onAddStudent={() => {
                        if (!teacherHalaqas.length && !user?.halaqaId) {
                            // Handled in component but we can pass direct setter if preferred
                            setShowAddModal(true);
                        } else {
                            setShowAddModal(true);
                        }
                    }}
                    onShowReports={() => setShowReportModal(true)}
                    getFirstName={getFirstName}
                    router={router}
                />

                <StudentFilters 
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    juzFilter={juzFilter}
                    setJuzFilter={setJuzFilter}
                />

                <StudentSections 
                    filteredStudents={filteredStudents}
                    router={router}
                    loading={loading}
                />
            </main>

            <TeacherModals 
                showAddModal={showAddModal}
                setShowAddModal={setShowAddModal}
                showReportModal={showReportModal}
                setShowReportModal={setShowReportModal}
                fetchStudents={fetchStudents}
                teacherHalaqas={teacherHalaqas}
                user={user}
            />
        </div>
    );
}
