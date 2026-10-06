import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Award,
  Palette,
  Trophy,
  Wrench,
  FlaskConical,
  BarChart2,
  Check,
  Star,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Megaphone,
  CalendarDays,
  Moon,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { ExtracurricularActivity } from '../../types';
import { toPersianDigits, PERSIAN_MONTHS, formatShamsiDate } from '../../lib/persianUtils';
import { CreateNotificationModal } from '../notifications/CreateNotificationModal';
import { getOccasionsForYear, OCCASION_STYLES, SCHOOL_CALENDAR_MONTHS, SCHOOL_CALENDAR_YEARS } from '../../lib/schoolCalendar';
import { PrayerSurveyDashboard } from '../PrayerSurveyDashboard';
import { TalentOverview } from '../TalentOverview';

export const CulturalVPPanel: React.FC = () => {
  const {
    currentUser,
    classes,
    students,
    psychResults,
    gradesSheet,
    attendanceRecords,
    teachers,
    extracurriculars,
    saveExtracurricular,
    deleteExtracurricular,
    schoolWideActivities,
    addSchoolWideActivity,
    deleteSchoolWideActivity,
    evaluations,
    saveTeacherEvaluation,
    deleteTeacherEvaluation,
    calendarEvents,
    addCalendarEvent,
    deleteCalendarEvent,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'extracurricular' | 'evalTeachers' | 'calendar' | 'prayer'>('calendar');
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [calendarYear, setCalendarYear] = useState(1405);
  const [calendarMonth, setCalendarMonth] = useState(7);
  const [calendarDay, setCalendarDay] = useState(1);
  const [calendarTitle, setCalendarTitle] = useState('');
  const [calendarDescription, setCalendarDescription] = useState('');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Extracurricular Logging Form State
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>('آبان');
  const [artCount, setArtCount] = useState<number>(3);
  const [sportCount, setSportCount] = useState<number>(5);
  const [skillCount, setSkillCount] = useState<number>(4);
  const [sciCount, setSciCount] = useState<number>(3);
  const [classActivityTitle, setClassActivityTitle] = useState('');
  const [classActivityDate, setClassActivityDate] = useState('');
  const [classActivityCategory, setClassActivityCategory] = useState<NonNullable<ExtracurricularActivity['category']>>('هنری');
  const [classActivityParticipants, setClassActivityParticipants] = useState(0);
  const [classActivityDescription, setClassActivityDescription] = useState('');
  const [schoolActivityTitle, setSchoolActivityTitle] = useState('');
  const [schoolActivityDate, setSchoolActivityDate] = useState('');
  const [schoolActivityMonth, setSchoolActivityMonth] = useState('مهر');
  const [schoolActivityCategory, setSchoolActivityCategory] = useState<'هنری' | 'ورزشی' | 'مهارتی' | 'علمی' | 'مذهبی' | 'ملی'>('هنری');
  const [schoolActivityParticipants, setSchoolActivityParticipants] = useState(0);
  const [schoolActivityDescription, setSchoolActivityDescription] = useState('');

  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Live calculation of extracurricular monthly average
  const monthlyExtracurricularAvg =
    Math.round(((artCount + sportCount + skillCount + sciCount) / 4) * 100) / 100;

  const handleSaveExtracurricular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      showFeedback('error', 'لطفاً کلاس را مشخص نمایید.');
      return;
    }

    const res = await saveExtracurricular({
      classId: selectedClassId,
      month: selectedMonth,
      title: classActivityTitle,
      date: classActivityDate,
      category: classActivityCategory,
      participants: Number(classActivityParticipants),
      description: classActivityDescription,
      artistic: Number(artCount),
      sports: Number(sportCount),
      skills: Number(skillCount),
      scientific: Number(sciCount),
      monthlyAverage: monthlyExtracurricularAvg,
    });

    if (res.success) {
      setClassActivityTitle('');
      setClassActivityDate('');
      setClassActivityParticipants(0);
      setClassActivityDescription('');
      showFeedback('success', `فعالیت‌های فوق‌برنامه ماه ${selectedMonth} با معدل ${toPersianDigits(monthlyExtracurricularAvg)} ثبت گردید.`);
    } else {
      showFeedback('error', res.message || 'خطا در ثبت.');
    }
  };

  const handleSaveSchoolWideActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addSchoolWideActivity({
      title: schoolActivityTitle,
      date: schoolActivityDate,
      month: schoolActivityMonth,
      category: schoolActivityCategory,
      participants: Number(schoolActivityParticipants),
      description: schoolActivityDescription,
    });

    if (result.success) {
      setSchoolActivityTitle('');
      setSchoolActivityDate('');
      setSchoolActivityParticipants(0);
      setSchoolActivityDescription('');
      showFeedback('success', 'فعالیت عمومی کل مدرسه با جزئیات ثبت شد.');
    } else {
      showFeedback('error', result.message || 'ثبت فعالیت عمومی انجام نشد.');
    }
  };

  // Evaluation Form State (5 Cultural/Ethical Indicators)
  const [evalTeacherId, setEvalTeacherId] = useState('');
  const [culturalScores, setCulturalScores] = useState({
    ethical_atmosphere: 5,
    cultural_engagement: 5,
    role_modeling: 5,
    pastoral_care: 5,
    national_religious_events: 5,
  });
  const [evalNotes, setEvalNotes] = useState('');

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalTeacherId) {
      showFeedback('error', 'لطفاً دبیر را انتخاب کنید.');
      return;
    }

    const scoreVals = Object.values(culturalScores);
    const avg = Math.round((scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) * 100) / 100;

    const res = await saveTeacherEvaluation({
      teacherId: evalTeacherId,
      evaluatorRole: 'cultural_vp',
      evaluatorId: currentUser?.id || 'cultural_vp',
      evaluatorName: currentUser?.fullName || 'معاون پرورشی',
      scores: culturalScores,
      averageScore: avg,
      notes: evalNotes,
    });

    if (res.success) {
      showFeedback('success', `ارزیابی پرورشی دبیر با نمره ${toPersianDigits(avg)} ذخیره شد.`);
    } else {
      showFeedback('error', res.message || 'خطا در ثبت ارزیابی.');
    }
  };

  const selectedCalendarDate = `${calendarYear}/${String(calendarMonth).padStart(2, '0')}/${String(calendarDay).padStart(2, '0')}`;
  const visibleOccasions = getOccasionsForYear(calendarYear).filter((occasion) => occasion.month === calendarMonth);
  const visibleSchoolEvents = calendarEvents.filter((event) => event.date.startsWith(`${calendarYear}/`));

  const handleSaveCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addCalendarEvent({
      date: selectedCalendarDate,
      title: calendarTitle,
      description: calendarDescription,
    });
    if (result.success) {
      setCalendarTitle('');
      setCalendarDescription('');
      showFeedback('success', 'برنامه مدرسه در تقویم ثبت شد.');
    } else {
      showFeedback('error', result.message || 'ثبت برنامه انجام نشد.');
    }
  };

  return (
    <div className="space-y-6">
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
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      <TalentOverview
        classes={classes}
        students={students}
        psychResults={psychResults}
        grades={gradesSheet}
        attendanceRecords={attendanceRecords}
        recommendationMode="extracurricular"
        title="پایش تجمیعی استعداد و شخصیت دانش‌آموزان"
      />

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-purple-600/20">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                پرتال معاونت پرورشی و فرهنگی: {currentUser?.fullName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ثبت فعالیت‌های چهارگانه فوق‌برنامه، محاسبه معدل پرورشی کلاس‌ها و ارزیابی تربیتی معلمان (وزن ۲۰٪)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNotifModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer shrink-0"
          >
            <Megaphone className="w-4 h-4" />
            <span>ارسال پیام پرورشی و مسابقات</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/70 text-purple-800 dark:text-purple-200 font-bold text-xs transition-all cursor-pointer shrink-0"
          >
            <CalendarDays className="w-4 h-4" />
            <span>تقویم برنامه‌ها</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('prayer')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'prayer'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Moon className="w-4 h-4" />
          <span>پایش نماز جماعت</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('extracurricular')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'extracurricular'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>۱. ثبت و مقایسه فوق‌برنامه کلاس‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evalTeachers')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'evalTeachers'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>۲. ارزیابی تربیتی دبیران (۵ شاخص)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>۳. تقویم مناسبت‌ها و برنامه‌ها</span>
        </button>
      </div>

      {activeTab === 'prayer' && <PrayerSurveyDashboard />}

      {/* TAB 1: EXTRACURRICULAR ACTIVITIES LOGGING & COMPARISON */}
      {activeTab === 'extracurricular' && (
        <div className="space-y-6">
          {/* Logging Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>ثبت تعداد فعالیت‌های فوق‌برنامه ماهانه کلاس‌ها</span>
            </h3>

            <form onSubmit={handleSaveExtracurricular} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">عنوان فعالیت کلاس</label>
                  <input required value={classActivityTitle} onChange={(e) => setClassActivityTitle(e.target.value)} placeholder="مثال: کارگاه مهارت‌های زندگی" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">تاریخ اجرا</label>
                  <input required value={classActivityDate} onChange={(e) => setClassActivityDate(e.target.value)} placeholder="۱۴۰۵/۰۷/۱۵" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">حوزه فعالیت</label>
                  <select value={classActivityCategory} onChange={(e) => setClassActivityCategory(e.target.value as NonNullable<ExtracurricularActivity['category']>)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white">
                    <option value="هنری">هنری</option><option value="ورزشی">ورزشی</option><option value="مهارتی">مهارتی</option><option value="علمی">علمی</option><option value="مذهبی">مذهبی</option><option value="ملی">ملی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">تعداد شرکت‌کنندگان</label>
                  <input type="number" min={0} required value={classActivityParticipants} onChange={(e) => setClassActivityParticipants(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white" dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">انتخاب کلاس</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">ماه تحصیلی</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold"
                  >
                    {PERSIAN_MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">ویژگی‌ها، هدف و شرح فعالیت کلاس</label>
                <textarea required value={classActivityDescription} onChange={(e) => setClassActivityDescription(e.target.value)} placeholder="هدف تربیتی، ویژگی اجرا و دستاوردهای فعالیت را بنویسید..." rows={3} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white resize-none" />
              </div>

              {/* 4 Domains Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 font-bold text-xs">
                    <Palette className="w-3.5 h-3.5" />
                    <span>فعالیت‌های هنری</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={artCount}
                    onChange={(e) => setArtCount(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400">تئاتر، سرود، نقاشی</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>فعالیت‌های ورزشی</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={sportCount}
                    onChange={(e) => setSportCount(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400">مسابقات و المپیاد درون‌مدرسه‌ای</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>فعالیت‌های مهارتی</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={skillCount}
                    onChange={(e) => setSkillCount(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400">فنی، امداد، کارآفرینی و مهارت زندگی</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>فعالیت‌های علمی</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={sciCount}
                    onChange={(e) => setSciCount(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400">رباتیک، جشنواره خوارزمی و پژوهش</span>
                </div>
              </div>

              {/* Calculated Monthly Average Banner */}
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs">
                <span className="font-bold text-purple-900 dark:text-purple-200">
                  معدل فوق‌برنامه محاسبه‌شده ماهانه (میانگین ۴ حوزه):
                </span>
                <span className="text-lg font-black text-purple-700 dark:text-purple-300 font-mono">
                  {toPersianDigits(monthlyExtracurricularAvg.toFixed(2))}
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ثبت در کارنامه پرورشی کلاس</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-amber-200/80 dark:border-amber-900/60 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-600" />
                ثبت فعالیت پرورشی کل مدرسه
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-6">
                برای مراسم، مسابقه، اردو، کارگاه یا برنامه‌ای که به‌صورت مشترک برای همه دانش‌آموزان اجرا شده است؛ این بخش مستقل از ثبت فعالیت کلاس‌هاست.
              </p>
            </div>

            <form onSubmit={handleSaveSchoolWideActivity} className="rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/70 p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">عنوان فعالیت</label>
                  <input required value={schoolActivityTitle} onChange={(e) => setSchoolActivityTitle(e.target.value)} placeholder="مثال: جشنواره فرهنگی و هنری مدرسه" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">تاریخ اجرا</label>
                  <input required value={schoolActivityDate} onChange={(e) => setSchoolActivityDate(e.target.value)} placeholder="۱۴۰۵/۰۷/۱۵" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">ماه تحصیلی</label>
                  <select value={schoolActivityMonth} onChange={(e) => setSchoolActivityMonth(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white">
                    {PERSIAN_MONTHS.map((month) => <option key={month} value={month}>{month}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">حوزه فعالیت</label>
                  <select value={schoolActivityCategory} onChange={(e) => setSchoolActivityCategory(e.target.value as typeof schoolActivityCategory)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white">
                    <option value="هنری">هنری</option><option value="ورزشی">ورزشی</option><option value="مهارتی">مهارتی</option><option value="علمی">علمی</option><option value="مذهبی">مذهبی</option><option value="ملی">ملی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">تعداد شرکت‌کنندگان</label>
                  <input type="number" min={0} required value={schoolActivityParticipants} onChange={(e) => setSchoolActivityParticipants(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">ویژگی‌ها، هدف و شرح فعالیت</label>
                <textarea required value={schoolActivityDescription} onChange={(e) => setSchoolActivityDescription(e.target.value)} placeholder="هدف تربیتی، گروه هدف، دستاوردها و ویژگی‌های اجرای برنامه را بنویسید..." rows={3} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white resize-none" />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2.5 text-xs font-bold text-white cursor-pointer">ثبت فعالیت عمومی مدرسه</button>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-amber-50 dark:bg-amber-950/30 text-slate-700 dark:text-slate-300 font-bold"><tr><th className="p-3">عنوان</th><th className="p-3">تاریخ</th><th className="p-3">حوزه</th><th className="p-3">شرکت‌کنندگان</th><th className="p-3">ویژگی و شرح</th><th className="p-3">عملیات</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {schoolWideActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{activity.title}</td><td className="p-3 font-mono">{activity.date}</td><td className="p-3">{activity.category}</td><td className="p-3 font-mono">{toPersianDigits(activity.participants)}</td><td className="p-3 min-w-[220px] text-slate-600 dark:text-slate-300">{activity.description || '—'}</td>
                      <td className="p-3"><button type="button" onClick={async () => { const result = await deleteSchoolWideActivity(activity.id); showFeedback(result.success ? 'success' : 'error', result.success ? 'فعالیت عمومی حذف شد.' : result.message || 'حذف انجام نشد.'); }} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer" title="حذف فعالیت"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {schoolWideActivities.length === 0 && <p className="py-4 text-center text-xs text-slate-500">هنوز فعالیت عمومی برای مدرسه ثبت نشده است.</p>}
            </div>
          </div>

          {/* Comparative Table & Cards Across Classes */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              <span>جدول مقایسه‌ای معدل پرورشی کلاس‌های مدرسه</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3 rounded-r-xl">کلاس</th>
                    <th className="p-3">عنوان</th>
                    <th className="p-3">تاریخ</th>
                    <th className="p-3">حوزه</th>
                    <th className="p-3">شرکت‌کنندگان</th>
                    <th className="p-3 text-center">ماه</th>
                    <th className="p-3 text-center">هنری</th>
                    <th className="p-3 text-center">ورزشی</th>
                    <th className="p-3 text-center">مهارتی</th>
                    <th className="p-3 text-center">علمی</th>
                    <th className="p-3 text-center bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 font-black">
                      معدل فوق‌برنامه
                    </th>
                    <th className="p-3 rounded-l-xl text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {extracurriculars.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-6 text-slate-400">
                        هنوز موردی ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    extracurriculars.map((ex) => {
                      const c = classes.find((cls) => cls.id === ex.classId);
                      return (
                        <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{c?.name || 'نامشخص'}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{ex.title || '—'}</td>
                          <td className="p-3 font-mono">{ex.date || '—'}</td>
                          <td className="p-3">{ex.category || '—'}</td>
                          <td className="p-3 font-mono">{ex.participants === undefined ? '—' : toPersianDigits(ex.participants)}</td>
                          <td className="p-3 text-center">{ex.month}</td>
                          <td className="p-3 text-center font-mono">{toPersianDigits(ex.artistic)}</td>
                          <td className="p-3 text-center font-mono">{toPersianDigits(ex.sports)}</td>
                          <td className="p-3 text-center font-mono">{toPersianDigits(ex.skills)}</td>
                          <td className="p-3 text-center font-mono">{toPersianDigits(ex.scientific)}</td>
                          <td className="p-3 text-center font-mono font-black text-sm bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
                            {toPersianDigits(ex.monthlyAverage.toFixed(2))}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteExtracurricular(ex.id);
                                showFeedback('success', 'رکورد حذف شد.');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEACHER EVALUATION (CULTURAL VP) */}
      {activeTab === 'evalTeachers' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              <span>ارزیابی تربیتی و اخلاقی دبیران توسط معاونت پرورشی (وزن ۲۰٪)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ثبت امتیاز ۱ تا ۵ برای ۵ شاخص تربیتی، پرورشی و الگودهی اخلاقی دبیر.
            </p>
          </div>

          <form onSubmit={handleSaveEvaluation} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">انتخاب دبیر:</label>
              <select
                required
                value={evalTeacherId}
                onChange={(e) => {
                  setEvalTeacherId(e.target.value);
                  const prev = evaluations.find(
                    (ev) => ev.teacherId === e.target.value && ev.evaluatorRole === 'cultural_vp'
                  );
                  if (prev) {
                    setCulturalScores(prev.scores as any);
                    setEvalNotes(prev.notes || '');
                  }
                }}
                className="w-full max-w-md px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
              >
                <option value="">-- دبیر را انتخاب کنید --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} (دبیر {t.specialty})
                  </option>
                ))}
              </select>
            </div>

            {/* 5 Cultural Indicators */}
            <div className="space-y-3">
              {[
                { key: 'ethical_atmosphere', title: '۱. توجه به ابعاد اخلاقی، حفظ کرامت دانش‌آموزان و ایجاد حریم امن روانی در کلاس' },
                { key: 'cultural_engagement', title: '۲. ترغیب دانش‌آموزان به شرکت در مسابقات فرهنگی، هنری، قرآنی و ورزشی' },
                { key: 'role_modeling', title: '۳. الگودهی عملی در رفتار، نظم کلامی، آراستگی و سعه‌صدر' },
                { key: 'pastoral_care', title: '۴. شناسایی زودهنگام دانش‌آموزان دارای بحران روحی، گوشه‌گیر یا نیازمند توجه تربیتی' },
                { key: 'national_religious_events', title: '۵. همراهی فعال و هماهنگی با برنامه‌ها و پویش‌های مناسبتی و ملی-مذهبی مدرسه' },
              ].map((crit) => {
                const currentScore = culturalScores[crit.key as keyof typeof culturalScores] || 5;
                return (
                  <div
                    key={crit.key}
                    className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{crit.title}</span>
                    <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setCulturalScores((prev) => ({ ...prev, [crit.key]: star }))}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                            currentScore >= star
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                          }`}
                        >
                          {toPersianDigits(star)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">یادداشت پرورشی:</label>
              <textarea
                rows={2}
                value={evalNotes}
                onChange={(e) => setEvalNotes(e.target.value)}
                placeholder="رهنمودهای تربیتی..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ثبت ارزیابی معاون پرورشی</span>
              </button>
            </div>
          </form>

          {/* Previous Cultural Evaluations */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
              ارزیابی‌های ثبت‌شده توسط معاونت پرورشی:
            </h4>
            {evaluations
              .filter((e) => e.evaluatorRole === 'cultural_vp')
              .map((ev) => {
                const t = teachers.find((tch) => tch.id === ev.teacherId);
                return (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{t?.fullName}</span>
                      <span className="text-slate-400 mr-2">({t?.specialty})</span>
                      <p className="text-slate-500 mt-0.5">
                        امتیاز تربیتی: <strong className="text-purple-600">{toPersianDigits(ev.averageScore.toFixed(2))} از ۵</strong> • تاریخ: {formatShamsiDate(ev.updatedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteTeacherEvaluation(ev.id);
                        showFeedback('success', 'ارزیابی حذف شد.');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-purple-600" />
                  تقویم پرورشی مدرسه
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-6">
                  مناسبت‌های ملی، مذهبی و تاریخی را ببینید و برنامه‌های مدرسه را در تاریخ مشخص ثبت کنید.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                {Object.entries(OCCASION_STYLES).map(([kind, style]) => (
                  <span key={kind} className={`rounded-full border px-2.5 py-1 ${style.className}`}>{style.label}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 p-4 border border-purple-200/70 dark:border-purple-900/70">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">سال تحصیلی / تقویمی</label>
                <select value={calendarYear} onChange={(e) => setCalendarYear(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white">
                  {SCHOOL_CALENDAR_YEARS.map((year) => <option key={year} value={year}>{toPersianDigits(year)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">ماه</label>
                <select value={calendarMonth} onChange={(e) => setCalendarMonth(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white">
                  {SCHOOL_CALENDAR_MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">مناسبت‌های این ماه</h4>
                {visibleOccasions.map((occasion) => {
                  const style = OCCASION_STYLES[occasion.kind];
                  return (
                    <div key={`${occasion.date}-${occasion.title}`} className={`rounded-2xl border p-3 ${style.className}`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black">{toPersianDigits(occasion.day)} {SCHOOL_CALENDAR_MONTHS[occasion.month - 1]}</span>
                        <span className="text-[10px] font-bold">{style.label}</span>
                      </div>
                      <p className="mt-1 text-xs font-bold">{occasion.title}</p>
                      {occasion.variableDate && <p className="mt-1 text-[10px]">تاریخ مذهبی قمری است و باید با تقویم رسمی همان سال تطبیق داده شود.</p>}
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSaveCalendarEvent} className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">ثبت برنامه مدرسه</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">تاریخ انتخابی: {toPersianDigits(selectedCalendarDate)}</p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">روز</label>
                  <input type="number" min={1} max={31} value={calendarDay} onChange={(e) => setCalendarDay(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono" />
                </div>
                <input required value={calendarTitle} onChange={(e) => setCalendarTitle(e.target.value)} placeholder="عنوان برنامه، جلسه یا مراسم" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white" />
                <textarea value={calendarDescription} onChange={(e) => setCalendarDescription(e.target.value)} placeholder="توضیحات و مسئول اجرا (اختیاری)" rows={3} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white resize-none" />
                <button type="submit" className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-bold text-white cursor-pointer">ثبت برنامه در تقویم</button>
              </form>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4">برنامه‌های ثبت‌شده سال {toPersianDigits(calendarYear)}</h4>
            <div className="space-y-2">
              {visibleSchoolEvents.length === 0 ? <p className="text-xs text-slate-500 dark:text-slate-400">برای این سال برنامه‌ای ثبت نشده است.</p> : visibleSchoolEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/20 px-3 py-2.5">
                  <div><p className="text-xs font-bold text-slate-900 dark:text-white">{event.title}</p><p className="text-[10px] text-slate-500 dark:text-slate-400">{toPersianDigits(event.date)} {event.description ? `· ${event.description}` : ''}</p></div>
                  <button type="button" onClick={async () => { const result = await deleteCalendarEvent(event.id); showFeedback(result.success ? 'success' : 'error', result.success ? 'برنامه حذف شد.' : result.message || 'حذف برنامه انجام نشد.'); }} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer" title="حذف برنامه"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Broadcast modal */}
      <CreateNotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        defaultType="vp_message"
      />
    </div>
  );
};
