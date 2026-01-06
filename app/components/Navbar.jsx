'use client';

export default function Navbar({ userType, userName, onLogout }) {
    const titles = {
        student: 'لوحة الطالب',
        teacher: 'لوحة المعلم',
        supervisor: 'لوحة المشرف العام'
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50 backdrop-blur-lg bg-opacity-90">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">📖</span>
                        <span className="font-amiri text-2xl font-bold text-green-600">
                            {titles[userType] || 'المنصة'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="font-semibold text-gray-700">{userName}</span>
                        <button
                            onClick={() => {
                                localStorage.removeItem('user');
                                if (onLogout) onLogout();
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
