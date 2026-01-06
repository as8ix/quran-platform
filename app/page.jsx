'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        router.push(`/${user.role.toLowerCase()}`);
      } else {
        setCheckingAuth(false);
      }
    }
  }, [router]);

  const roles = [
    { id: 'student', name: 'طالب', icon: '👨‍🎓', color: 'from-blue-500 to-blue-600' },
    { id: 'teacher', name: 'معلم', icon: '👨‍🏫', color: 'from-green-500 to-green-600' },
    { id: 'supervisor', name: 'مشرف عام', icon: '👔', color: 'from-purple-500 to-purple-600' },
  ];

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      showNotification('⚠️ الرجاء إدخال اسم المستخدم وكلمة المرور', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showNotification('✓ تم تسجيل الدخول بنجاح', 'success');
        // Store user info in localStorage for simple session management
        localStorage.setItem('user', JSON.stringify(data));

        setTimeout(() => {
          router.push(`/${selectedRole}`);
        }, 500);
      } else {
        showNotification(`✕ ${data.error}`, 'error');
      }
    } catch (error) {
      showNotification('✕ حدث خطأ أثناء الاتصال بالخادم', 'error');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-20 blur-3xl -top-48 -right-48 animate-float"></div>
        <div className="absolute w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 blur-3xl -bottom-40 -left-40 animate-float" style={{ animationDelay: '-3s' }}></div>
        <div className="absolute w-72 h-72 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float" style={{ animationDelay: '-6s' }}></div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 px-6 py-4 rounded-xl text-white font-semibold shadow-2xl z-50 animate-slide-in-right ${notification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' :
          notification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' :
            notification.type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
              'bg-gradient-to-r from-blue-500 to-blue-600'
          }`}>
          {notification.message}
        </div>
      )}

      {/* Login Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          <div className="card-premium p-8">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="text-7xl mb-4 inline-block animate-bounce">📖</div>
              <h1 className="font-amiri text-4xl font-bold bg-gradient-to-r from-green-600 via-green-700 to-green-800 bg-clip-text text-transparent mb-2">
                منصة تحفيظ القرآن الكريم
              </h1>
              <p className="text-gray-600">نحو حفظ متقن وإنجاز مستمر</p>
            </div>

            {/* Role Selector */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${selectedRole === role.id
                    ? `bg-gradient-to-br ${role.color} border-transparent text-white shadow-lg transform scale-105`
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                >
                  <div className="text-3xl mb-2">{role.icon}</div>
                  <div className="text-sm font-semibold">{role.name}</div>
                </button>
              ))}
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="أدخل اسم المستخدم"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="أدخل كلمة المرور"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <span>تسجيل الدخول</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </form>


          </div>
        </div>
      </div>
    </div>
  );
}
