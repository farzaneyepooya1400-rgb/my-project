import React, { useState } from 'react';
import {
  School,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { ROLE_DETAILS } from '../lib/auth';
import { toPersianDigits } from '../lib/persianUtils';
import { NotificationBell } from './notifications/NotificationBell';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean | ((v: boolean) => boolean)) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
  const { currentUser, logout, seedDashboardDemoData, isSeeding, students, classes, teachers } = useSchool();
  const [isFooterMenuOpen, setIsFooterMenuOpen] = useState(false);

  const roleInfo = currentUser ? ROLE_DETAILS[currentUser.role] : null;

  const footerMenuItems = [
    { id: 'footer-about', label: 'معرفی سامانه' },
  ];

  const handleFooterMenuItemClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setIsFooterMenuOpen(false);
  };

  const handleDemoDataSeed = async () => {
    const result = await seedDashboardDemoData();
    window.alert(result.message);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#102a45] text-white border-b border-teal-500/20 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-amber-400 p-0.5 shadow-lg shadow-teal-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#102a45] rounded-[14px] flex items-center justify-center">
                <School className="w-6 h-6 text-teal-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  <span className="hidden sm:inline">سامانه هوشمند</span>
                  <span className="text-amber-400 font-extrabold">مدرسه‌یار</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  سال تحصیلی ۱۴۰۴-۱۴۰۵
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                مدیریت یکپارچه ساختار، پایش تحصیلی، آزمون‌های استعدادسنجی و ارزیابی معلمان
              </p>
            </div>
          </div>

          {/* Quick Metrics & User Session */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Add missing demo records without replacing existing school data */}
            {!currentUser && classes.length > 0 && teachers.length > 0 && (
              <button
                type="button"
                onClick={handleDemoDataSeed}
                disabled={isSeeding}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSeeding ? 'در حال بارگذاری...' : 'افزودن داده‌های نمونه'}</span>
              </button>
            )}

            {/* Smart Notification Bell */}
            {currentUser && <NotificationBell />}

            {!currentUser && (
              <button
                type="button"
                onClick={() => document.getElementById('login-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                title="ورود به پرتال"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-100 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogIn className="h-4 w-4 sm:hidden" />
                <span>ورود</span>
              </button>
            )}

            {/* Footer navigation menu */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setIsFooterMenuOpen((previous) => !previous)}
                aria-expanded={isFooterMenuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <span>راهنما</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFooterMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFooterMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-2 w-48 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-xl"
                >
                  {footerMenuItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleFooterMenuItemClick(item.id)}
                      className="w-full rounded-xl px-3 py-2.5 text-right text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark mode button */}
            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="تغییر تم"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-teal-300" />}
            </button>

            {/* Active User Card & Logout */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-1 border-r border-white/10 pr-2 sm:pr-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                    <span>{currentUser.fullName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-teal-300 justify-end mt-0.5">
                    <span className="font-semibold">{roleInfo?.title}</span>
                    {currentUser.linkedId && (
                      <span className="text-slate-400 text-[10px]">
                        (کد: {toPersianDigits(currentUser.linkedId)})
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1" dir="ltr">{currentUser.email || currentUser.username}</div>
                </div>

                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-sm">
                  {currentUser.fullName.charAt(0)}
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="خروج از حساب"
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 transition-all cursor-pointer mr-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
