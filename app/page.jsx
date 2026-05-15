'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch public stats
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
        setLoading(false);
      });

    // Scroll reveal observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: '📊',
      title: 'تتبع الحفظ والمراجعة',
      description: 'سجل يومي شامل لكل طالب يتضمن الحفظ الجديد والمراجعة مع تقييم دقيق من المعلم'
    },
    {
      icon: '👥',
      title: 'إدارة الحلقات والطلاب',
      description: 'نظام متكامل لإدارة الحلقات والمعلمين والطلاب بكل سهولة وفعالية'
    },
    {
      icon: '📈',
      title: 'تقارير وإحصائيات تفصيلية',
      description: 'رسوم بيانية تفاعلية توضح تقدم الطالب ومستوى الأداء بشكل مرئي'
    },
    {
      icon: '🏆',
      title: 'الأيام القرآنية والمسابقات',
      description: 'تنظيم فعاليات ومسابقات قرآنية لتحفيز الطلاب وتشجيعهم على المنافسة الإيجابية'
    }
  ];

  return (
    <div id="landing-page-root" className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300" suppressHydrationWarning>
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/mosque-logo.png" alt="شعار الجامع" className="w-10 h-10 object-contain inline-block dark:hidden" /><img src="/mosque-logo-white.png" alt="شعار الجامع" className="w-10 h-10 object-contain hidden dark:inline-block" />
            <span className="font-amiri text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              منصة تحفيظ القرآن الكريم
            </span>
          </div>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-200 dark:hover:shadow-none transition-all duration-300 transform hover:-translate-y-0.5"
          >
            تسجيل الدخول
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 reveal">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full opacity-10 dark:opacity-5 blur-3xl -top-48 -right-48 animate-float"></div>
          <div className="absolute w-80 h-80 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-10 dark:opacity-5 blur-3xl -bottom-40 -left-40 animate-float" style={{ animationDelay: '-3s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-block mb-6 px-6 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-bold">
            منصتكم المتكاملة لحفظ كتاب الله
          </div>

          <h1 className="font-amiri text-5xl md:text-7xl font-black text-slate-800 dark:text-white mb-6 leading-tight">
            نحو حفظ متقن
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              وإنجاز مستمر
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            منصة شاملة لإدارة حلقات تحفيظ القرآن الكريم مع أدوات متقدمة لتتبع التقدم والإحصائيات
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-emerald-200 dark:hover:shadow-none transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2"
            >
              <span>ابدأ الآن</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm reveal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {!loading && (
              <>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-3xl p-8 text-center shadow-lg border border-blue-200 dark:border-blue-900/30 hover:shadow-2xl hover:shadow-blue-100 dark:hover:shadow-none transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-5xl font-black text-blue-600 dark:text-blue-400 mb-2">{stats?.studentsCount || 0}</div>
                  <div className="text-blue-700 dark:text-blue-300 font-bold">طالب</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-3xl p-8 text-center shadow-lg border border-emerald-200 dark:border-emerald-900/30 hover:shadow-2xl hover:shadow-emerald-100 dark:hover:shadow-none transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-5xl font-black text-emerald-600 dark:text-emerald-400 mb-2">{stats?.teachersCount || 0}</div>
                  <div className="text-emerald-700 dark:text-emerald-300 font-bold">معلم</div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-3xl p-8 text-center shadow-lg border border-amber-200 dark:border-amber-900/30 hover:shadow-2xl hover:shadow-amber-100 dark:hover:shadow-none transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-5xl font-black text-amber-600 dark:text-amber-400 mb-2">{stats?.totalJuz || 0}</div>
                  <div className="text-amber-700 dark:text-amber-300 font-bold">جزء محفوظ</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-3xl p-8 text-center shadow-lg border border-purple-200 dark:border-purple-900/30 hover:shadow-2xl hover:shadow-purple-100 dark:hover:shadow-none transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-5xl font-black text-purple-600 dark:text-purple-400 mb-2">{stats?.halaqatCount || 0}</div>
                  <div className="text-purple-700 dark:text-purple-300 font-bold">حلقة نشطة</div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 reveal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-amiri text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-4">
              كل ما تحتاجه في مكان واحد
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              أدوات متكاملة لإدارة وتتبع حفظ القرآن الكريم
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="premium-glass rounded-3xl p-8 shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-2xl hover:shadow-emerald-50 dark:hover:shadow-none transition-all duration-300 transform hover:-translate-y-1 group reveal"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Screenshots Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/40 reveal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-amiri text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-4">
              من داخل المنصة
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              تعرّف على واجهة المنصة وأدواتها المتقدمة
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Student Dashboard Screenshot */}
            <div className="premium-glass rounded-3xl p-6 shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 reveal">
              <div className="mb-4 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                <img
                  src="/images/student-dashboard.png"
                  alt="لوحة الطالب"
                  className="w-full h-auto"
                />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">لوحة الطالب</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                تتبع تقدمك في الحفظ والمراجعة مع إحصائيات تفصيلية
              </p>
            </div>

            {/* Teacher Dashboard Screenshot */}
            <div className="premium-glass rounded-3xl p-6 shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 reveal reveal-delay-1">
              <div className="mb-4 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                <img
                  src="/images/teacher-dashboard.png"
                  alt="لوحة المعلم"
                  className="w-full h-auto"
                />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">لوحة المعلم</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                إدارة الطلاب ومتابعة تقدمهم بكل سهولة
              </p>
            </div>

            {/* Recording Session Screenshot */}
            <div className="premium-glass rounded-3xl p-6 shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 reveal reveal-delay-2">
              <div className="mb-4 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                <img
                  src="/images/recording-session.png"
                  alt="لوحة المشرف"
                  className="w-full h-auto"
                />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">لوحة المشرف</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                نظام متكامل للمشرفين لمتابعة الحلقات والمعلمين وإحصائيات الجامع بشكل شامل
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-600 relative overflow-hidden reveal">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-amiri text-4xl md:text-5xl font-black text-white mb-6">
            هل أنت مستعد لبدء رحلتك
            <br />
            في حفظ كتاب الله؟
          </h2>
          <p className="text-xl text-emerald-50 mb-10">
            انضم الآن وابدأ في تتبع تقدمك نحو حفظ القرآن الكريم
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-emerald-600 rounded-2xl font-black text-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <span>ابدأ الآن</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>
      </section>

    </div>
  );
}
