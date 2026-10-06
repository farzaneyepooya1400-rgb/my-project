import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Activity,
  Award,
  BookOpen,
  Star,
  Check,
  AlertCircle,
  Brain,
  CheckCircle2,
  Trash2,
  Info,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { FamilyProfile } from '../../types';
import { toPersianDigits, formatShamsiDate } from '../../lib/persianUtils';
import { HOLLAND_TITLES } from '../../lib/psychologyData';
import { buildSubjectConceptMap } from '../../lib/assessment';

export const ParentPanel: React.FC = () => {
  const {
    currentUser,
    students,
    classes,
    teachers,
    assignments,
    gradesSheet,
    attendanceRecords,
    psychResults,
    familyProfiles,
    saveFamilyProfile,
    evaluations,
    saveTeacherEvaluation,
    deleteTeacherEvaluation,
  } = useSchool();

  // Find linked student (by studentCode or nationalId)
  const child = students.find(
    (s) => s.studentCode === currentUser?.linkedId || s.nationalId === currentUser?.linkedId
  ) || students[0];

  const childClass = classes.find((c) => c.id === child?.classId);
  const childAssignments = assignments.filter((a) => a.classId === child?.classId);
  const childGrades = gradesSheet.filter((g) => g.studentId === child?.id);
  const childConceptMap = buildSubjectConceptMap(childGrades);
  const childAttendance = attendanceRecords.filter((a) => a.studentId === child?.id);
  const childPsych = psychResults.find((p) => p.studentId === child?.id);
  const existingProfile = familyProfiles.find((f) => f.studentId === child?.id);

  const [activeTab, setActiveTab] = useState<'profile' | 'summary' | 'teacherEval'>('summary');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Form state for Family & Health Profile
  const [fatherEdu, setFatherEdu] = useState(existingProfile?.fatherEducation || 'کارشناسی ارشد');
  const [fatherJob, setFatherJob] = useState(existingProfile?.fatherJob || 'مهندس مشاور');
  const [motherEdu, setMotherEdu] = useState(existingProfile?.motherEducation || 'کارشناسی');
  const [motherJob, setMotherJob] = useState(existingProfile?.motherJob || 'کارمند');
  const [kidsCount, setKidsCount] = useState<number>(existingProfile?.childrenCount || 2);
  const [maritalStatus, setMaritalStatus] = useState<any>(existingProfile?.maritalStatus || 'همراه');
  const [heightCm, setHeightCm] = useState<number>(existingProfile?.heightCm || 160);
  const [weightKg, setWeightKg] = useState<number>(existingProfile?.weightKg || 50);
  const [sleepHour, setSleepHour] = useState(existingProfile?.sleepHour || '۲۲:۳۰');
  const [screenTime, setScreenTime] = useState<number>(existingProfile?.screenTimeHours || 2);
  const [breakfast, setBreakfast] = useState<any>(existingProfile?.breakfastStatus || 'همیشه');
  const [hasSensory, setHasSensory] = useState<boolean>(existingProfile?.hasVisionHearingIssue || false);
  const [sensoryDetails, setSensoryDetails] = useState(existingProfile?.sensoryIssueDetails || '');
  const [distanceKm, setDistanceKm] = useState<number>(existingProfile?.distanceToSchoolKm || 3);
  const [commute, setCommute] = useState<any>(existingProfile?.commuteMethod || 'سرویس');
  const [homeResp, setHomeResp] = useState<number>(existingProfile?.homeResponsibilityScore || 4);

  // Auto calculate BMI
  const calculatedBmi = heightCm > 0
    ? Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10
    : 0;

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'کم‌وزن', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' };
    if (bmi <= 24.9) return { label: 'محدوده وزن طبیعی و سلامت', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' };
    if (bmi <= 29.9) return { label: 'دارای اضافه وزن', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/60' };
    return { label: 'چاقی نیاز به پایش', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' };
  };

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) return;

    const res = await saveFamilyProfile({
      studentId: child.id,
      fatherEducation: fatherEdu,
      fatherJob: fatherJob,
      motherEducation: motherEdu,
      motherJob: motherJob,
      childrenCount: Number(kidsCount),
      maritalStatus,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      calculatedBmi,
      sleepHour,
      screenTimeHours: Number(screenTime),
      breakfastStatus: breakfast,
      hasVisionHearingIssue: hasSensory,
      sensoryIssueDetails: sensoryDetails,
      distanceToSchoolKm: Number(distanceKm),
      commuteMethod: commute,
      homeResponsibilityScore: Number(homeResp),
    });

    if (res.success) {
      showFeedback('success', 'اطلاعات سلامت و بستر خانوادگی فرزند با موفقیت ذخیره گردید.');
    } else {
      showFeedback('error', res.message || 'خطا در ذخیره‌سازی.');
    }
  };

  // Parent's teacher evaluation state
  const [evalSelectedTeacherId, setEvalSelectedTeacherId] = useState<string>('');
  const [parentEvalScores, setParentEvalScores] = useState({
    parent_interaction: 5,
    motivation: 5,
    homework_balance: 5,
    fairness: 5,
    timely_feedback: 5,
  });
  const [parentEvalNotes, setParentEvalNotes] = useState('');

  // Child statistics
  const totalAbsences = childAttendance.reduce((acc, curr) => acc + (curr.absences || 0), 0);
  const totalTardies = childAttendance.reduce((acc, curr) => acc + (curr.tardies || 0), 0);
  const gradeSum = childGrades.reduce((acc, curr) => acc + (curr.calculatedAverage || 0), 0);
  const overallAvg = childGrades.length > 0 ? Math.round((gradeSum / childGrades.length) * 100) / 100 : 0;

  // Filter unique teachers of child's class
  const childTeacherIds = Array.from(new Set(childAssignments.map((a) => a.teacherId)));
  const childTeachers = teachers.filter((t) => childTeacherIds.includes(t.id));

  return (
    <div className="space-y-6">
      {/* Top Banner Alert Feedback */}
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

      {/* Welcome Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/20">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                پرتال اولیا و خانواده: {currentUser?.fullName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                فرزند گرامی: <strong className="text-slate-800 dark:text-slate-200">{child?.firstName} {child?.lastName}</strong> ({childClass?.name})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
              دسترسی امن فقط به پرونده فرزند
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>۱. خلاصه جامع وضعیت فرزند</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>۲. اطلاعات سلامت و خانواده</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('teacherEval')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'teacherEval'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>۳. نظرسنجی و ارزیابی دبیران فرزند</span>
        </button>
      </div>

      {/* TAB 1: SUMMARY OF CHILD */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-bold block">معدل کل نمرات:</span>
              <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 font-mono">
                {toPersianDigits(overallAvg.toFixed(2))} <span className="text-xs font-normal text-slate-400">از ۲۰</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-bold block">مجموع غیبت‌ها:</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {toPersianDigits(totalAbsences)} <span className="text-xs font-normal text-slate-400">جلسه</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-bold block">مجموع تأخیرها:</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {toPersianDigits(totalTardies)} <span className="text-xs font-normal text-slate-400">مورد</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-bold block">شاخص توده بدنی (BMI):</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                {toPersianDigits(calculatedBmi.toFixed(1))}
              </div>
            </div>
          </div>

          {childConceptMap.size > 0 && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">کارنامه مفهومی فرزند به تفکیک درس</h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">نقاط قوت، متوسط و ضعف یادگیری</span>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {Array.from(childConceptMap.entries()).map(([subject, entries]) => {
                  const summary = {
                    good: entries.filter((entry) => entry.level === 'good'),
                    medium: entries.filter((entry) => entry.level === 'medium'),
                    weak: entries.filter((entry) => entry.level === 'weak'),
                    ungraded: entries.filter((entry) => !entry.level || typeof entry.score !== 'number'),
                  };

                  return (
                    <div key={subject} className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{subject}</h4>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          {toPersianDigits(entries.length)} مفهوم
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-2">
                          <div className="font-black text-emerald-700 dark:text-emerald-300">خوب: {toPersianDigits(summary.good.length)}</div>
                          {summary.good.length ? summary.good.map((entry, index) => (
                            <div key={`${entry.sessionId ?? entry.id}-${index}`} className="mt-1 text-slate-700 dark:text-slate-200">
                              <div className="font-bold">{entry.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{entry.assessmentTerm === 'midterm1' ? 'مستمر ترم اول' : entry.assessmentTerm === 'midterm2' ? 'مستمر ترم دوم' : 'دوره نامشخص'}{entry.sessionLabel ? ` · ${entry.sessionLabel}` : ''}{entry.date ? ` · ${new Date(entry.date).toLocaleDateString('fa-IR')}` : ''}</div>
                              {entry.behaviorNote && <div className="text-[10px]">یادداشت جلسه: {entry.behaviorNote}</div>}
                            </div>
                          )) : <div className="mt-1 text-slate-700 dark:text-slate-200">—</div>}
                        </div>
                        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-2">
                          <div className="font-black text-amber-700 dark:text-amber-300">متوسط: {toPersianDigits(summary.medium.length)}</div>
                          {summary.medium.length ? summary.medium.map((entry, index) => (
                            <div key={`${entry.sessionId ?? entry.id}-${index}`} className="mt-1 text-slate-700 dark:text-slate-200">
                              <div className="font-bold">{entry.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{entry.assessmentTerm === 'midterm1' ? 'مستمر ترم اول' : entry.assessmentTerm === 'midterm2' ? 'مستمر ترم دوم' : 'دوره نامشخص'}{entry.sessionLabel ? ` · ${entry.sessionLabel}` : ''}{entry.date ? ` · ${new Date(entry.date).toLocaleDateString('fa-IR')}` : ''}</div>
                              {entry.behaviorNote && <div className="text-[10px]">یادداشت جلسه: {entry.behaviorNote}</div>}
                            </div>
                          )) : <div className="mt-1 text-slate-700 dark:text-slate-200">—</div>}
                        </div>
                        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-2">
                          <div className="font-black text-rose-700 dark:text-rose-300">ضعیف: {toPersianDigits(summary.weak.length)}</div>
                          {summary.weak.length ? summary.weak.map((entry, index) => (
                            <div key={`${entry.sessionId ?? entry.id}-${index}`} className="mt-1 text-slate-700 dark:text-slate-200">
                              <div className="font-bold">{entry.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{entry.assessmentTerm === 'midterm1' ? 'مستمر ترم اول' : entry.assessmentTerm === 'midterm2' ? 'مستمر ترم دوم' : 'دوره نامشخص'}{entry.sessionLabel ? ` · ${entry.sessionLabel}` : ''}{entry.date ? ` · ${new Date(entry.date).toLocaleDateString('fa-IR')}` : ''}</div>
                              {entry.behaviorNote && <div className="text-[10px]">یادداشت جلسه: {entry.behaviorNote}</div>}
                            </div>
                          )) : <div className="mt-1 text-slate-700 dark:text-slate-200">—</div>}
                        </div>
                        <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2">
                          <div className="font-black text-slate-700 dark:text-slate-200">ثبت‌شده، بدون نمره: {toPersianDigits(summary.ungraded.length)}</div>
                          {summary.ungraded.length ? summary.ungraded.map((entry, index) => (
                            <div key={`${entry.sessionId ?? entry.id}-${index}`} className="mt-1 text-slate-700 dark:text-slate-200">
                              <div className="font-bold">{entry.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{entry.assessmentTerm === 'midterm1' ? 'مستمر ترم اول' : entry.assessmentTerm === 'midterm2' ? 'مستمر ترم دوم' : 'دوره نامشخص'}{entry.sessionLabel ? ` · ${entry.sessionLabel}` : ''}{entry.date ? ` · ${new Date(entry.date).toLocaleDateString('fa-IR')}` : ''}</div>
                              {entry.behaviorNote && <div className="text-[10px]">یادداشت جلسه: {entry.behaviorNote}</div>}
                            </div>
                          )) : <div className="mt-1 text-slate-700 dark:text-slate-200">—</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Child's Psychological Results Summary */}
          {childPsych && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                <span>نتایج آزمون‌های خودشناسی و استعدادیابی فرزند شما</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40">
                  <span className="text-xs text-slate-500 font-bold">کد هالند (گرایش شغلی):</span>
                  <div className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1">
                    {childPsych.hollandCode}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {HOLLAND_TITLES[childPsych.hollandCode.charAt(0)]?.fa}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40">
                  <span className="text-xs text-slate-500 font-bold">سبک یادگیری برتر:</span>
                  <div className="text-xl font-black text-teal-700 dark:text-teal-300 mt-1">
                    {childPsych.learningStyle}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    توصیه به استفاده از ابزارهای بصری و کاربردی
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                  <span className="text-xs text-slate-500 font-bold">تیپ شخصیتی:</span>
                  <div className="text-xl font-black text-purple-700 dark:text-purple-300 mt-1">
                    {childPsych.personalityType}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    تعامل صمیمی و حمایت فردی در محیط منزل
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Child's Grades Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <span>ریز نمرات درسی فرزند شما</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3 rounded-r-xl">درس</th>
                    <th className="p-3 text-center">مستمر ترم اول</th>
                    <th className="p-3 text-center">نمره ترم اول</th>
                    <th className="p-3 text-center">مستمر ترم دوم</th>
                    <th className="p-3 text-center">نمره ترم دوم</th>
                    <th className="p-3 text-center">شیوه مستمر</th>
                    <th className="p-3 text-center rounded-l-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-black">
                      میانگین محاسبه‌شده
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {childGrades.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-400">
                        هنوز نمره‌ای ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    childGrades.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{g.subject}</td>
                        <td className="p-3 text-center font-mono">{toPersianDigits(g.continuousTerm1 ?? g.continuous ?? '—')}</td>
                        <td className="p-3 text-center font-mono font-bold text-teal-600 dark:text-teal-400">{toPersianDigits(g.term1Exam ?? g.midterm ?? '—')}</td>
                        <td className="p-3 text-center font-mono">{toPersianDigits(g.continuousTerm2 ?? '—')}</td>
                        <td className="p-3 text-center font-mono font-bold text-teal-600 dark:text-teal-400">{toPersianDigits(g.term2Exam ?? g.final ?? '—')}</td>
                        <td className="p-3 text-center">{g.continuousGradeMode === 'indicator' ? 'خودکار' : 'دستی'}</td>
                        <td className="p-3 text-center font-mono font-black text-sm bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300">
                          {toPersianDigits(g.calculatedAverage?.toFixed(2) ?? '—')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FAMILY & HEALTH FORM */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfileSubmit} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-amber-500" />
              <span>شناسنامه بستر خانوادگی و سلامت جسمانی فرزند</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              این اطلاعات به مشاوران و معلمان مدرسه در درک بهتر شرایط زیستی، تغذیه‌ای و روانی فرزند شما کمک می‌کند.
            </p>
          </div>

          {/* Section 1: Parents info */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-4">
            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400">۱. وضعیت تحصیلی و شغلی والدین</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">تحصیلات پدر</label>
                <input
                  type="text"
                  value={fatherEdu}
                  onChange={(e) => setFatherEdu(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">شغل پدر</label>
                <input
                  type="text"
                  value={fatherJob}
                  onChange={(e) => setFatherJob(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">تحصیلات مادر</label>
                <input
                  type="text"
                  value={motherEdu}
                  onChange={(e) => setMotherEdu(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">شغل مادر</label>
                <input
                  type="text"
                  value={motherJob}
                  onChange={(e) => setMotherJob(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">تعداد فرزندان خانواده</label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={kidsCount}
                  onChange={(e) => setKidsCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">وضعیت تأهل سرپرستان</label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="همراه">همراه و در کنار هم</option>
                  <option value="متارکه">متارکه / طلاق</option>
                  <option value="فوت سرپرست">فوت یکی از سرپرستان</option>
                  <option value="سایر">سایر موارد</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Health & BMI */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400">۲. شاخص سلامت و توده بدنی (BMI)</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">BMI محاسبه‌شده:</span>
                <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm">
                  {toPersianDigits(calculatedBmi.toFixed(1))}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getBmiCategory(calculatedBmi).color}`}>
                  {getBmiCategory(calculatedBmi).label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">قد فرزند (سانتی‌متر)</label>
                <input
                  type="number"
                  min={50}
                  max={230}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">وزن فرزند (کیلوگرم)</label>
                <input
                  type="number"
                  min={15}
                  max={150}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">ساعت معمول خواب شب</label>
                <input
                  type="text"
                  value={sleepHour}
                  onChange={(e) => setSleepHour(e.target.value)}
                  placeholder="مثال: ۲۲:۳۰"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">ساعت استفاده از موبایل / نمایشگر در روز</label>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={16}
                  value={screenTime}
                  onChange={(e) => setScreenTime(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">وضعیت صرف صبحانه قبل از مدرسه</label>
                <select
                  value={breakfast}
                  onChange={(e) => setBreakfast(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="همیشه">همیشه میل می‌کند</option>
                  <option value="گاهی">گاهی اوقات</option>
                  <option value="به‌ندرت">به‌ندرت و بی‌میل</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">فاصله تا مدرسه (کیلومتر)</label>
                <input
                  type="number"
                  step={0.5}
                  min={0.1}
                  max={50}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">نحوه رفت‌وآمد به مدرسه</label>
                <select
                  value={commute}
                  onChange={(e) => setCommute(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="سرویس">سرویس مدرسه</option>
                  <option value="پیاده">پیاده‌روی</option>
                  <option value="خودرو شخصی">خودروی شخصی اولیا</option>
                  <option value="حمل‌ونقل عمومی">اتوبوس / مترو</option>
                </select>
              </div>
            </div>

            {/* Sensory issues check */}
            <div className="pt-2">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={hasSensory}
                  onChange={(e) => setHasSensory(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded-sm"
                />
                <span>آیا فرزند دچار مشکل بینایی (عینک)، شنوایی یا حساسیت‌های حسی است؟</span>
              </label>
              {hasSensory && (
                <input
                  type="text"
                  value={sensoryDetails}
                  onChange={(e) => setSensoryDetails(e.target.value)}
                  placeholder="توضیح کوتاه (مثال: ضعف دید تخته کلاس و لزوم نشستن در ردیف جلو)"
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              )}
            </div>
          </div>

          {/* Section 3: Responsibility in home */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400">۳. مسئولیت‌پذیری و نظم فرزند در منزل</h4>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-700 dark:text-slate-300">
                میزان مسئولیت‌پذیری، نظم اتاق و مدیریت فردی تکالیف در خانه:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setHomeResp(val)}
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                      homeResp >= val
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {toPersianDigits(val)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>ذخیره شناسنامه سلامت و خانواده</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: TEACHER EVALUATION BY PARENTS (WEIGHT: 40%) */}
      {activeTab === 'teacherEval' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>نظرسنجی و ارزیابی دبیران فرزند شما (وزن مؤثر در نمره دبیر: ۴۰٪)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              طبق قوانین سامانه، شما صرفاً دبیران متصل به کلاس فرزند خود ({childClass?.name}) را مشاهده کرده و می‌توانید نظر قبلی خود را ویرایش، جایگزین یا حذف فرمایید.
            </p>
          </div>

          {/* Teacher Selector */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">انتخاب دبیر جهت ارزیابی:</label>
            <select
              value={evalSelectedTeacherId}
              onChange={(e) => {
                setEvalSelectedTeacherId(e.target.value);
                const prev = evaluations.find(
                  (ev) => ev.teacherId === e.target.value && ev.evaluatorId === currentUser?.id
                );
                if (prev) {
                  setParentEvalScores(prev.scores as any);
                  setParentEvalNotes(prev.notes || '');
                }
              }}
              className="w-full max-w-md px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
            >
              <option value="">-- دبیر را انتخاب کنید --</option>
              {childTeachers.map((t) => {
                const asg = childAssignments.find((a) => a.teacherId === t.id);
                return (
                  <option key={t.id} value={t.id}>
                    {t.fullName} (دبیر درس {asg?.subject})
                  </option>
                );
              })}
            </select>
          </div>

          {evalSelectedTeacherId ? (
            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-4">
              <h4 className="font-bold text-xs text-amber-700 dark:text-amber-400">
                شاخص‌های اختصاصی ارزیابی اولیا (از ۱: بسیار ضعیف تا ۵: عالی):
              </h4>

              <div className="space-y-3">
                {[
                  { key: 'parent_interaction', title: '۱. نحوه پاسخگویی و تعامل محترمانه با اولیا', desc: 'در دسترس بودن، خوش‌برخوردی و توجه به دغدغه‌های خانواده' },
                  { key: 'motivation', title: '۲. میزان انگیزه و علاقه ایجادشده در فرزند', desc: 'شوق فرزند برای حضور در کلاس و مطالعه این درس' },
                  { key: 'homework_balance', title: '۳. تناسب حجم و سطح تکالیف با توانایی فرزند', desc: 'تکالیف متوازن و هدفمند بدون تحمیل استرس به منزل' },
                  { key: 'fairness', title: '۴. عدالت و انصاف در نمره‌دهی و رفتار با فرزند', desc: 'برخورد عادلانه و تشویق تلاش‌های فردی دانش‌آموز' },
                  { key: 'timely_feedback', title: '۵. بازخورد به‌موقع پیرامون وضعیت تحصیلی فرزند', desc: 'اطلاع‌رسانی سریع در صورت افت تحصیلی یا درخشش' },
                ].map((crit) => {
                  const currentScore = parentEvalScores[crit.key as keyof typeof parentEvalScores] || 5;
                  return (
                    <div
                      key={crit.key}
                      className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">{crit.title}</h5>
                        <p className="text-[11px] text-slate-400 mt-0.5">{crit.desc}</p>
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setParentEvalScores((prev) => ({ ...prev, [crit.key]: star }))}
                            className={`w-8 h-8 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                              currentScore >= star
                                ? 'bg-amber-500 text-white shadow-xs'
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نظر یا قدردانی از دبیر (اختیاری):
                </label>
                <textarea
                  rows={2}
                  value={parentEvalNotes}
                  onChange={(e) => setParentEvalNotes(e.target.value)}
                  placeholder="نکات تشویقی یا مواردی که تمایل دارید دبیر محترم به آن توجه نمایند..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const scoreVals = Object.values(parentEvalScores);
                    const avg = Math.round((scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) * 100) / 100;
                    const res = await saveTeacherEvaluation({
                      teacherId: evalSelectedTeacherId,
                      evaluatorRole: 'parent',
                      evaluatorId: currentUser?.id || 'parent',
                      evaluatorName: currentUser?.fullName || 'ولی دانش‌آموز',
                      scores: parentEvalScores,
                      averageScore: avg,
                      notes: parentEvalNotes,
                    });
                    if (res.success) {
                      showFeedback('success', `ارزیابی با میانگین ${toPersianDigits(avg)} از ۵ برای دبیر ثبت گردید.`);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ثبت و ارسال ارزیابی</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">
              جهت ورود فرم ارزیابی، ابتدا یکی از دبیران فرزند خود را انتخاب فرمایید.
            </p>
          )}

          {/* List of Previous Evaluations by this Parent */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
              ارزیابی‌های قبلی شما برای دبیران فرزند:
            </h4>
            {evaluations
              .filter((e) => e.evaluatorRole === 'parent' && e.evaluatorId === currentUser?.id)
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
                        میانگین ثبت‌شده: <strong className="text-amber-600">{toPersianDigits(ev.averageScore.toFixed(2))} از ۵</strong> • تاریخ: {formatShamsiDate(ev.updatedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteTeacherEvaluation(ev.id);
                        showFeedback('success', 'ارزیابی شما با موفقیت حذف گردید.');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="حذف نظر قبلی"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
