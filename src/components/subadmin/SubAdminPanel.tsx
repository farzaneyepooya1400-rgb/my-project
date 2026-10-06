import React, { useState } from 'react';
import {
  Crown,
  School,
  Users,
  GraduationCap,
  Sparkles,
  BookOpen,
  UserCheck,
  HeartHandshake,
  Plus,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  KeyRound,
  Eye,
  Layers,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { toPersianDigits, formatShamsiDate } from '../../lib/persianUtils';
import { ConfirmModal } from '../ConfirmModal';
import { AdminPanel } from '../admin/AdminPanel';
import { AcademicVPPanel } from '../viceprincipal/AcademicVPPanel';
import { CulturalVPPanel } from '../viceprincipal/CulturalVPPanel';
import { TeacherPanel } from '../teacher/TeacherPanel';
import { StudentPanel } from '../student/StudentPanel';
import { ParentPanel } from '../parent/ParentPanel';

export const SubAdminPanel: React.FC = () => {
  const {
    currentUser,
    users,
    grades,
    classes,
    students,
    teachers,
    evaluations,
    psychResults,
    extracurriculars,
    createUserAccount,
    deleteUserAccount,
  } = useSchool();

  // Active view: 'principals' (management of school principals) or one of the section panels
  const [activeSection, setActiveSection] = useState<
    'principals' | 'admin_panel' | 'academic_vp' | 'cultural_vp' | 'teacher_panel' | 'student_panel' | 'parent_panel'
  >('principals');

  // Form for adding a new School Principal
  const [principalName, setPrincipalName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [principalUsername, setPrincipalUsername] = useState('');
  const [principalPassword, setPrincipalPassword] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddPrincipal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!principalName || !principalUsername || !principalPassword || !schoolName) {
      showFeedback('error', 'لطفاً نام مدیر، نام مدرسه، نام کاربری و رمز عبور را وارد فرمایید.');
      return;
    }

    const res = await createUserAccount({
      fullName: principalName,
      username: principalUsername,
      passwordPlain: principalPassword,
      role: 'admin',
      schoolName: schoolName.trim(),
      schoolCode: schoolCode.trim() || `SCH-${Math.floor(100 + Math.random() * 900)}`,
    });

    if (res.success) {
      setPrincipalName('');
      setSchoolName('');
      setSchoolCode('');
      setPrincipalUsername('');
      setPrincipalPassword('');
      showFeedback('success', `حساب مدیر مدرسه «${schoolName}» با موفقیت صادر و رمز عبور هش‌گذاری شد.`);
    } else {
      showFeedback('error', res.message || 'خطا در ثبت مشخصات مدیر مدرسه.');
    }
  };

  // Filter principals
  const principals = users.filter((u) => u.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Alert Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold shadow-md transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-rose-500 text-white shadow-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Master Sub-Admin Header */}
      <div className="bg-gradient-to-r from-rose-900 via-[#102a45] to-[#102a45] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-rose-500/30 relative overflow-hidden">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden md:block">
          <Crown className="w-48 h-48 text-rose-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 p-0.5 shadow-lg shadow-rose-500/30 shrink-0">
              <div className="w-full h-full bg-[#102a45] rounded-[14px] flex items-center justify-center">
                <Crown className="w-8 h-8 text-rose-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  سطح دسترسی ساب‌ادمین (Super Admin / District Supervisor)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                پنل مدیریت عالی و نظارت فراگیر: {currentUser?.fullName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                این دسترسی ویژه قابلیت تعریف مدیران مدارس، نظارت جامع و ورود به تمامی بخش‌های آموزشی، پرورشی، کارنامه‌ها، آزمون‌ها و اولیا را در اختیار شما قرار می‌دهد.
              </p>
            </div>
          </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
            <span className="text-[11px] text-slate-300 block">مدیران مدارس</span>
            <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">
              {toPersianDigits(principals.length)}
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
            <span className="text-[11px] text-slate-300 block">پایه‌ها و کلاس‌ها</span>
            <span className="text-lg font-black text-teal-400 font-mono mt-0.5 block">
              {toPersianDigits(classes.length)}
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
            <span className="text-[11px] text-slate-300 block">دبیران و کادر</span>
            <span className="text-lg font-black text-cyan-400 font-mono mt-0.5 block">
              {toPersianDigits(teachers.length)}
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
            <span className="text-[11px] text-slate-300 block">دانش‌آموزان</span>
            <span className="text-lg font-black text-indigo-400 font-mono mt-0.5 block">
              {toPersianDigits(students.length)}
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
            <span className="text-[11px] text-slate-300 block">آزمون‌های هوش</span>
            <span className="text-lg font-black text-purple-400 font-mono mt-0.5 block">
              {toPersianDigits(psychResults.length)}
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
            <span className="text-[11px] text-slate-300 block">ارزیابی دبیران</span>
            <span className="text-lg font-black text-rose-400 font-mono mt-0.5 block">
              {toPersianDigits(evaluations.length)}
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
            <span className="text-[11px] text-slate-300 block">فوق‌برنامه‌ها</span>
            <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
              {toPersianDigits(extracurriculars.length)}
            </span>
          </div>
        </div>
      </div>

      {/* Universal Section Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveSection('principals')}
          className={`flex-1 min-w-[170px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'principals'
              ? 'bg-rose-700 text-white shadow-md shadow-rose-700/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>مدیریت مدیران مدارس</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('admin_panel')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'admin_panel'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <School className="w-4 h-4" />
          <span>ساختار و تنظیمات مدرسه</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('academic_vp')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'academic_vp'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>بخش معاونت آموزشی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('cultural_vp')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'cultural_vp'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>بخش معاونت پرورشی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('teacher_panel')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'teacher_panel'
              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>بخش ورود نمرات معلمان</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('student_panel')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'student_panel'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>بخش آزمون‌های دانش‌آموز</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('parent_panel')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'parent_panel'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>بخش سلامت و اولیا</span>
        </button>
      </div>

      {/* SECTION 1: PRINCIPALS MANAGEMENT (PRIMARY SUB-ADMIN TASK) */}
      {activeSection === 'principals' && (
        <div className="space-y-6">
          {/* Add New Principal Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  افزودن و انتصاب مدیر مدرسه جدید
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ثبت مشخصات مدیر، نام واحد آموزشی، صدور نام کاربری اختصاصی و هش‌سازی خودکار رمز عبور
                </p>
              </div>
            </div>

            <form onSubmit={handleAddPrincipal} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    نام و نام خانوادگی مدیر مدرسه
                  </label>
                  <input
                    type="text"
                    required
                    value={principalName}
                    onChange={(e) => setPrincipalName(e.target.value)}
                    placeholder="مثال: دکتر محمدرضا صادقیان"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    نام مدرسه / واحد آموزشی
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="مثال: دبیرستان نمونه دانا (دوره دوم)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    کد مدرسه / واحد سازمانی
                  </label>
                  <input
                    type="text"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    placeholder="SCH-105"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-mono text-left focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    نام کاربری لاگین مدیر (لاتین)
                  </label>
                  <input
                    type="text"
                    required
                    value={principalUsername}
                    onChange={(e) => setPrincipalUsername(e.target.value)}
                    placeholder="principal_dana2"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-mono text-left focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    رمز عبور اولیه
                  </label>
                  <input
                    type="password"
                    required
                    value={principalPassword}
                    onChange={(e) => setPrincipalPassword(e.target.value)}
                    placeholder="حداقل ۴ نویسه"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-mono text-left focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    dir="ltr"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-700/20 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن و صدور حساب مدیر</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* List of School Principals */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-rose-600" />
                <span>فهرست مدیران مدارس ثبت‌شده در سامانه</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold">
                تعداد کل مدیران: {toPersianDigits(principals.length)} نفر
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {principals.map((pr) => (
                <div
                  key={pr.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{pr.fullName}</h4>
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          {pr.schoolName || 'مدیر مدرسه دانا'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {pr.schoolCode || 'SCH-101'}
                      </span>
                    </div>

                    <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <p className="flex items-center gap-1 font-mono">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        <span>نام کاربری: {pr.username}</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                        <span>رمز عبور: هش‌شده ایمن (SHA-256)</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        تاریخ صدور: {formatShamsiDate(pr.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>حساب فعال</span>
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          title: `حذف حساب مدیر ${pr.fullName}`,
                          message: `آیا از حذف حساب کاربری مدیر مدرسه «${pr.schoolName || pr.fullName}» اطمینان دارید؟`,
                          onConfirm: async () => {
                            const r = await deleteUserAccount(pr.id);
                            if (r.success) showFeedback('success', 'حساب مدیر مدرسه حذف گردید.');
                            else showFeedback('error', r.message || 'خطا در حذف مدیر.');
                          },
                        })
                      }
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف مدیر</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: EMBEDDED ADMIN & STRUCTURE PANEL */}
      {activeSection === 'admin_panel' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0" />
            <span>
              <strong>حالت نظارت ساب‌ادمین:</strong> شما هم‌اکنون به ساختار پایه‌ها، کلاس‌ها، معلمان، ضرایب سختی و بایگانی داده‌ها دسترسی کامل دارید.
            </span>
          </div>
          <AdminPanel />
        </div>
      )}

      {/* SECTION 3: EMBEDDED ACADEMIC VP PANEL */}
      {activeSection === 'academic_vp' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0" />
            <span>
              <strong>حالت نظارت ساب‌ادمین:</strong> شما در حال بررسی و پایش داده‌های آموزشی و ارزیابی معلمان از دیدگاه معاونت آموزشی هستید.
            </span>
          </div>
          <AcademicVPPanel />
        </div>
      )}

      {/* SECTION 4: EMBEDDED CULTURAL VP PANEL */}
      {activeSection === 'cultural_vp' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-300 flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0" />
            <span>
              <strong>حالت نظارت ساب‌ادمین:</strong> دسترسی به کلیه فعالیت‌های فوق‌برنامه، معدل پرورشی کلاس‌ها و ارزیابی تربیتی معلمان.
            </span>
          </div>
          <CulturalVPPanel />
        </div>
      )}

      {/* SECTION 5: EMBEDDED TEACHER PANEL */}
      {activeSection === 'teacher_panel' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0" />
            <span>
              <strong>حالت نظارت ساب‌ادمین:</strong> دسترسی مستقیم به جدول نمرات، حضور و غیاب ماهانه و توصیه‌های روانشناسی تربیتی معلمان.
            </span>
          </div>
          <TeacherPanel />
        </div>
      )}

      {/* SECTION 6: EMBEDDED STUDENT PANEL */}
      {activeSection === 'student_panel' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0" />
            <span>
              <strong>حالت نظارت ساب‌ادمین:</strong> پایش آزمون‌های هوش چندگانه، علایق شغلی هالند و کارنامه تفصیلی دانش‌آموزان.
            </span>
          </div>
          <StudentPanel />
        </div>
      )}

      {/* SECTION 7: EMBEDDED PARENT PANEL */}
      {activeSection === 'parent_panel' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0" />
            <span>
              <strong>حالت نظارت ساب‌ادمین:</strong> دسترسی به پرونده سلامت و بستر خانوادگی، شاخص BMI و ارزیابی اولیا از دبیران.
            </span>
          </div>
          <ParentPanel />
        </div>
      )}
    </div>
  );
};
