'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import LoadingScreen from '../../components/LoadingScreen';
import BackButton from '../../components/BackButton';
import AddKhayrukumCertificateModal from '../../components/AddKhayrukumCertificateModal';

export default function CertificatesPage() {
    const router = useRouter();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCertificate, setEditingCertificate] = useState(null);
    
    // For viewing certificates
    const [certificates, setCertificates] = useState({});
    const [studentToView, setStudentToView] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.trim().split(/\s+/)[0];
    };

    const teacherName = user ? `أهلًا ${getFirstName(user.name)} 👋` : 'أهلًا 👋';

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            if (!user) return;
            setLoading(true);
            try {
                let currentTeacherHalaqaId = null;
                const halaqasRes = await fetch(`/api/halaqas?teacherId=${user.id}`);
                if (halaqasRes.ok) {
                    const myHalaqas = await halaqasRes.json();
                    if (myHalaqas.length > 0) {
                        currentTeacherHalaqaId = myHalaqas[0].id;
                    }
                }

                let url = '/api/students';
                if (currentTeacherHalaqaId) {
                    url += `?halaqaId=${currentTeacherHalaqaId}`;
                }

                const response = await fetch(url);
                const data = await response.json();
                setStudents(data);

                // Fetch certificates for these students
                const certsPromises = data.map(s => fetch(`/api/certificates?studentId=${s.id}`).then(res => res.json()));
                const certsResults = await Promise.all(certsPromises);
                
                const certsMap = {};
                data.forEach((s, i) => {
                    certsMap[s.id] = certsResults[i] || [];
                });
                setCertificates(certsMap);
            } catch (error) {
                console.error("Error fetching students:", error);
                toast.error("فشل تحميل قائمة الطلاب");
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [user]);

    if (loading) return <LoadingScreen message="جاري تحميل الطلاب..." />;

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 font-noto transition-colors duration-300">
            <Navbar userType="teacher" userName={teacherName} onLogout={() => router.push('/login')} />

            <main className="max-w-5xl mx-auto px-4 pt-28 pb-12">
                <BackButton 
                    href="/teacher" 
                    text="عودة للقائمة الرئيسية" 
                    className="mb-6" 
                />

                <div className="mb-10 space-y-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            <span className="text-4xl">📜</span>
                            شهادات جمعية خيركم
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">اختر الطالب لرفع وتوثيق شهادة خيركم الخاصة به</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">قائمة الطلاب</h2>
                        <span className="bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 font-bold px-3 py-1 rounded-full text-sm">
                            {students.length} طالب
                        </span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {students.map((student) => {
                            const studentCerts = certificates[student.id] || [];
                            return (
                                <div key={student.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/30 rounded-full flex items-center justify-center text-xl text-sky-600 font-black shrink-0">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">{student.name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
                                                    محفوظات: {student.juzCount} جزء
                                                </p>
                                                {studentCerts.length > 0 && (
                                                    <span className="text-xs text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 rounded-md">
                                                        {studentCerts.length} شهادات
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mr-auto" dir="ltr">
                                        <button
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setShowAddModal(true);
                                            }}
                                            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-lg shadow-sky-200/50 dark:shadow-none transition-all active:scale-95 flex items-center gap-2 text-sm"
                                        >
                                            إضافة
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setStudentToView(student);
                                                setShowViewModal(true);
                                            }}
                                            disabled={studentCerts.length === 0}
                                            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm border
                                                ${studentCerts.length > 0 
                                                    ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-300 hover:text-sky-600 active:scale-95' 
                                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800 cursor-not-allowed opacity-50'}
                                            `}
                                        >
                                            استعراض
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {showAddModal && selectedStudent && user && (
                <AddKhayrukumCertificateModal
                    isOpen={showAddModal}
                    onClose={() => {
                        setShowAddModal(false);
                        setSelectedStudent(null);
                        setEditingCertificate(null);
                    }}
                    onSuccess={(newCert) => {
                        // Update state without reloading the page
                        setCertificates(prev => {
                            const certs = prev[selectedStudent.id] || [];
                            if (editingCertificate) {
                                return {
                                    ...prev,
                                    [selectedStudent.id]: certs.map(c => c.id === newCert.id ? newCert : c)
                                };
                            }
                            return {
                                ...prev,
                                [selectedStudent.id]: [...certs, newCert]
                            };
                        });
                        setShowAddModal(false);
                        setSelectedStudent(null);
                        setEditingCertificate(null);
                    }}
                    student={selectedStudent}
                    teacher={user}
                    editingCertificate={editingCertificate}
                />
            )}

            {showViewModal && studentToView && (
                <TeacherStudentCertificatesModal
                    isOpen={showViewModal}
                    onClose={() => {
                        setShowViewModal(false);
                        setStudentToView(null);
                    }}
                    student={studentToView}
                    certificates={certificates[studentToView.id] || []}
                    onEditClick={(cert) => {
                        setEditingCertificate(cert);
                        setSelectedStudent(studentToView);
                        setShowViewModal(false);
                        setShowAddModal(true);
                    }}
                />
            )}
        </div>
    );
}

// Modal component to view a student's certificates (list format for teacher)
function TeacherStudentCertificatesModal({ isOpen, onClose, student, certificates, onEditClick }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm rtl font-noto" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">
                            شهادات الطالب: {student.name}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">
                            إجمالي الشهادات الموثقة: {certificates.length}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {certificates.map((cert) => (
                            <div key={cert.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <h4 className="font-black text-slate-800 dark:text-white mb-2">
                                    {cert.title ? cert.title : `الفرع ${cert.branchNumber}`}
                                </h4>
                                <div className="space-y-1 mb-4">
                                    <p className="text-xs font-bold text-slate-500">الدرجة: {cert.grade}%</p>
                                    <p className="text-xs font-bold text-slate-500">التاريخ: {new Date(cert.examDate).toLocaleDateString('ar-SA')}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => window.open(cert.fileUrl, '_blank')}
                                        className="flex-1 py-2 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 font-bold rounded-xl text-sm hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors flex justify-center items-center gap-2"
                                    >
                                        فتح الشهادة
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                    </button>
                                    <button 
                                        onClick={() => onEditClick(cert)}
                                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors border border-slate-200 dark:border-slate-700"
                                        title="تعديل بيانات الشهادة"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
