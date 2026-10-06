import React, { useState, useEffect } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Navbar } from './components/Navbar';
import { ApiLoginView } from './components/auth/ApiLoginView';
import { AdminPanel } from './components/admin/AdminPanel';
import { TeacherPanel } from './components/teacher/TeacherPanel';
import { StudentPanel } from './components/student/StudentPanel';
import { ParentPanel } from './components/parent/ParentPanel';
import { AcademicVPPanel } from './components/viceprincipal/AcademicVPPanel';
import { CulturalVPPanel } from './components/viceprincipal/CulturalVPPanel';
import { ExecutiveVPPanel } from './components/ExecutiveVPPanel';
import { SubAdminPanel } from './components/subadmin/SubAdminPanel';
import { NotificationToasts } from './components/notifications/NotificationToasts';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { PaymentPanel } from './components/PaymentPanel';
import { PublicFeatureShowcase } from './components/PublicFeatureShowcase';

function MainApp() {
  const { currentUser, isAuthLoading } = useSchool();
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('dana_dark_mode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dana_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dana_dark_mode', 'false');
    }
  }, [darkMode]);

  const handleRequestLogin = () => {
    requestAnimationFrame(() => {
      document.getElementById('login-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('login-identifier')?.focus({ preventScroll: true });
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b132b] text-slate-800 dark:text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white font-['Vazirmatn',system-ui,sans-serif]" dir="rtl">
      <div>
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

        {!currentUser && (
          <div className="w-full overflow-hidden border-b border-teal-500/20 bg-[#102a45] shadow-sm">
            <img
              src="/school-header.png.png"
              alt="سامانه هوشمند مدرسه‌یار"
              className="block w-full h-auto max-h-[min(32rem,42vw)] object-cover object-center"
            />
          </div>
        )}

        {!currentUser && <PublicFeatureShowcase onRequestLogin={handleRequestLogin} />}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isAuthLoading ? (
            <div role="status" className="min-h-64 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
              در حال بررسی نشست کاربری...
            </div>
          ) : !currentUser ? (
            <>
              <ApiLoginView />
              <PaymentPanel />
              <section id="contact-us" className="mt-10 rounded-3xl border border-teal-200/70 dark:border-teal-900/70 bg-teal-50/70 dark:bg-teal-950/30 p-6 sm:p-8 text-right">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">تماس با ما</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 dark:text-slate-300">
                  سامانه مدرسه‌یار با هدف تسهیل مدیریت داده‌محور در مدارس طراحی شده است تا مدیران، معاونان، معلمان، دانش‌آموزان و والدین بتوانند اطلاعات آموزشی و پرورشی را یکپارچه و دقیق مدیریت کنند.
                </p>
                <a href="tel:09389479788" className="mt-4 inline-flex items-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800" dir="ltr">
                  ۰۹۳۸۹۴۷۹۷۸۸
                </a>
              </section>
            </>
          ) : (
            <>
              {currentUser.role === 'sub_admin' && <SubAdminPanel />}
              {currentUser.role === 'admin' && <AdminPanel />}
              {currentUser.role === 'executive_vp' && <ExecutiveVPPanel />}
              {currentUser.role === 'academic_vp' && <AcademicVPPanel />}
              {currentUser.role === 'cultural_vp' && <CulturalVPPanel />}
              {currentUser.role === 'teacher' && <TeacherPanel />}
              {currentUser.role === 'student' && <StudentPanel />}
              {currentUser.role === 'parent' && <ParentPanel />}
            </>
          )}
        </main>
      </div>

      {/* Floating Intelligent Corner Notifications (نوتیفیکیشن‌های گوشه صفحه) */}
      <NotificationToasts onOpenCenter={() => setIsNotifCenterOpen(true)} />

      {/* Full Notification Center Modal (when opened from toast or navigation) */}
      <NotificationCenter isOpen={isNotifCenterOpen} onClose={() => setIsNotifCenterOpen(false)} />

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 gap-4 text-center">
          <p id="footer-about" className="leading-6">
            سامانه هوشمند مدیریت و پایش مدرسه‌یار • طراحی شده بر اساس الگوهای کاشیکاری ایرانی و استانداردهای نوین آموزشی
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <SchoolProvider>
      <MainApp />
    </SchoolProvider>
  );
}
