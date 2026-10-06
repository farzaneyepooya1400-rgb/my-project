import React, { useEffect, useState } from 'react';
import {
  Brain,
  Award,
  BookOpen,
  CheckCircle2,
  Sparkles,
  BarChart2,
  Compass,
  ArrowRight,
  RotateCcw,
  Check,
  ClipboardList,
  Users,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import {
  PSYCH_QUESTIONS,
  calculatePsychResults,
  GARDNER_TITLES,
  HOLLAND_TITLES,
} from '../../lib/psychologyData';
import { toPersianDigits, formatShamsiDate } from '../../lib/persianUtils';
import { PsychTestResult, StudentStaffEvaluation, UserRole } from '../../types';
import { PRAYER_SURVEY_QUESTIONS } from '../../lib/prayerSurvey';
import {
  calculateSchoolAttitudeScores,
  SCHOOL_ATTITUDE_DOMAINS,
  SCHOOL_ATTITUDE_OPTIONS,
  SCHOOL_ATTITUDE_QUESTIONS,
} from '../../lib/schoolAttitudeSurvey';
import { buildSubjectConceptMap, LEVEL_LABELS } from '../../lib/assessment';

export const StudentPanel: React.FC = () => {
  const {
    currentUser,
    users,
    students,
    teachers,
    assignments,
    psychResults,
    savePsychTest,
    schoolAttitudeResults,
    saveSchoolAttitudeResult,
    gradesSheet,
    attendanceRecords,
    prayerSurveyResponses,
    savePrayerSurveyResponse,
    studentStaffEvaluations,
    saveStudentStaffEvaluation,
  } = useSchool();

  // Find linked student
  const studentProfile = students.find(
    (s) => s.studentCode === currentUser?.linkedId || s.nationalId === currentUser?.linkedId
  ) || students[0];

  const myPsychResult = psychResults.find((p) => p.studentId === studentProfile?.id);
  const mySchoolAttitudeResult = schoolAttitudeResults.find((result) => result.studentId === studentProfile?.id);
  const myGrades = gradesSheet.filter((g) => g.studentId === studentProfile?.id);
  const subjectConceptMap = buildSubjectConceptMap(myGrades);
  const myAttendance = attendanceRecords.filter((a) => a.studentId === studentProfile?.id);

  const [activeTab, setActiveTab] = useState<'assessment' | 'results' | 'grades' | 'prayerSurvey' | 'staffEvaluation' | 'schoolAttitude'>('results');

  // Answers state for questionnaire
  const [answers, setAnswers] = useState<Record<string, number>>(myPsychResult?.answers || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const prayerSurveyResponse = prayerSurveyResponses.find((response) => response.studentId === studentProfile?.id);
  const [prayerAnswers, setPrayerAnswers] = useState<Record<string, number>>(prayerSurveyResponse?.answers || {});
  const [isPrayerSubmitting, setIsPrayerSubmitting] = useState(false);
  const [schoolAttitudeAnswers, setSchoolAttitudeAnswers] = useState<Record<string, number>>(mySchoolAttitudeResult?.answers || {});
  const [isSchoolAttitudeSubmitting, setIsSchoolAttitudeSubmitting] = useState(false);
  const [schoolAttitudeError, setSchoolAttitudeError] = useState('');
  const [schoolAttitudeSuccess, setSchoolAttitudeSuccess] = useState(false);

  useEffect(() => {
    setSchoolAttitudeAnswers(mySchoolAttitudeResult?.answers || {});
  }, [mySchoolAttitudeResult]);

  const criteriaByRole: Record<'teacher' | 'admin' | 'cultural_vp', Array<{ id: string; label: string; description: string }>> = {
    teacher: [
      { id: 'lesson_clarity', label: 'شفافیت تدریس و انتقال مفاهیم', description: 'مفاهیم درس را روشن، مرحله‌به‌مرحله و قابل فهم ارائه می‌کند.' },
      { id: 'classroom_management', label: 'مدیریت کلاس و ایجاد تمرکز', description: 'کلاس را منظم، آرام و مناسب یادگیری نگه می‌دارد.' },
      { id: 'teaching_variety', label: 'تنوع روش‌ها و فعالیت‌های یادگیری', description: 'از مثال، تمرین، گفت‌وگو و روش‌های متنوع برای یادگیری استفاده می‌کند.' },
      { id: 'fair_assessment', label: 'عدالت در ارزشیابی و نمره‌دهی', description: 'آزمون‌ها و نمره‌دهی را منصفانه و بر اساس عملکرد واقعی انجام می‌دهد.' },
      { id: 'feedback', label: 'بازخورد و کمک به رفع اشکال', description: 'اشتباه‌ها را توضیح می‌دهد و برای پیشرفت راهنمایی عملی ارائه می‌کند.' },
      { id: 'student_motivation', label: 'ایجاد انگیزه و توجه به تفاوت‌ها', description: 'به توانایی‌های متفاوت دانش‌آموزان توجه می‌کند و آن‌ها را به یادگیری تشویق می‌کند.' },
    ],
    admin: [
      { id: 'school_leadership', label: 'رهبری و نظم کلی مدرسه', description: 'مدرسه را منظم، هدفمند و بر اساس برنامه اداره می‌کند.' },
      { id: 'student_welfare', label: 'توجه به رفاه و امنیت دانش‌آموزان', description: 'سلامت، امنیت و آرامش دانش‌آموزان را در تصمیم‌های مدرسه در نظر می‌گیرد.' },
      { id: 'fair_decisions', label: 'عدالت و بی‌طرفی در تصمیم‌گیری', description: 'با دانش‌آموزان و کلاس‌ها منصفانه و بدون تبعیض رفتار می‌کند.' },
      { id: 'responsiveness', label: 'پاسخگویی و رسیدگی به مسائل', description: 'مسائل دانش‌آموزان را می‌شنود و برای پیگیری آن‌ها اقدام می‌کند.' },
      { id: 'family_communication', label: 'ارتباط با خانواده‌ها', description: 'اطلاعات و تصمیم‌های مهم را روشن و به‌موقع با خانواده‌ها در میان می‌گذارد.' },
      { id: 'school_improvement', label: 'تلاش برای بهبود مدرسه', description: 'برای بهتر شدن کیفیت آموزشی، تربیتی و امکانات مدرسه برنامه‌ریزی می‌کند.' },
    ],
    cultural_vp: [
      { id: 'cultural_programs', label: 'کیفیت برنامه‌های فرهنگی و تربیتی', description: 'فعالیت‌های فرهنگی و تربیتی مفید، متنوع و متناسب با نیاز دانش‌آموزان برگزار می‌کند.' },
      { id: 'ethical_growth', label: 'تقویت اخلاق و مسئولیت‌پذیری', description: 'به رشد اخلاقی، هویت و مسئولیت‌پذیری دانش‌آموزان کمک می‌کند.' },
      { id: 'student_participation', label: 'جلب مشارکت دانش‌آموزان', description: 'فرصت مشارکت واقعی دانش‌آموزان در فعالیت‌ها و تصمیم‌های تربیتی را فراهم می‌کند.' },
      { id: 'emotional_support', label: 'حمایت اجتماعی و عاطفی', description: 'به نیازهای عاطفی و روابط اجتماعی دانش‌آموزان توجه و از آن‌ها حمایت می‌کند.' },
      { id: 'inclusive_fairness', label: 'فراگیری و عدالت در فعالیت‌ها', description: 'فعالیت‌ها را برای دانش‌آموزان مختلف قابل دسترس و عادلانه برگزار می‌کند.' },
      { id: 'cultural_responsiveness', label: 'پاسخگویی و ارتباط تربیتی', description: 'پیشنهادها و مسائل تربیتی را می‌شنود و با پیگیری مناسب پاسخ می‌دهد.' },
    ],
  };
  const schoolStaffRoles: Array<{ role: UserRole; label: string }> = [
    { role: 'admin', label: 'مدیر مدرسه' },
    { role: 'cultural_vp', label: 'معاون پرورشی' },
  ];
  const classAssignments = assignments.filter((assignment) => assignment.classId === studentProfile?.classId);
  const evaluationTargets = [
    ...classAssignments
      .map((assignment) => teachers.find((teacher) => teacher.id === assignment.teacherId))
      .filter((teacher): teacher is NonNullable<typeof teacher> => Boolean(teacher))
      .filter((teacher, index, allTeachers) => allTeachers.findIndex((item) => item.id === teacher.id) === index)
      .map((teacher) => ({ id: teacher.id, role: 'teacher' as const, name: teacher.fullName, subtitle: 'دبیر' })),
    ...users
      .filter((user) => schoolStaffRoles.some((item) => item.role === user.role))
      .map((user) => ({
        id: user.id,
        role: user.role as 'admin' | 'cultural_vp',
        name: user.fullName,
        subtitle: schoolStaffRoles.find((item) => item.role === user.role)?.label || '',
      })),
  ];
  const [selectedEvaluationTargetId, setSelectedEvaluationTargetId] = useState('');
  const [staffEvaluationScores, setStaffEvaluationScores] = useState<Record<string, number>>(
    Object.fromEntries(criteriaByRole.teacher.map((criterion) => [criterion.id, 5]))
  );
  const [staffEvaluationNotes, setStaffEvaluationNotes] = useState('');
  const [isStaffEvaluationSubmitting, setIsStaffEvaluationSubmitting] = useState(false);

  const selectedEvaluationTarget = evaluationTargets.find((target) => target.id === selectedEvaluationTargetId);
  const staffEvaluationCriteria = criteriaByRole[selectedEvaluationTarget?.role || 'teacher'];
  const existingStaffEvaluation = studentStaffEvaluations.find(
    (evaluation) => evaluation.studentId === studentProfile?.id && evaluation.targetId === selectedEvaluationTargetId
  );

  useEffect(() => {
    if (!selectedEvaluationTargetId && evaluationTargets.length > 0) {
      setSelectedEvaluationTargetId(evaluationTargets[0].id);
    }
  }, [evaluationTargets, selectedEvaluationTargetId]);

  useEffect(() => {
    setStaffEvaluationScores(Object.fromEntries(
      staffEvaluationCriteria.map((criterion) => [criterion.id, existingStaffEvaluation?.scores[criterion.id] ?? 5])
    ));
    setStaffEvaluationNotes(existingStaffEvaluation?.notes || '');
  }, [existingStaffEvaluation, selectedEvaluationTarget?.role]);

  useEffect(() => {
    setPrayerAnswers(prayerSurveyResponse?.answers || {});
  }, [prayerSurveyResponse]);

  // Question navigation or categorization
  const [currentCategory, setCurrentCategory] = useState<'all' | 'gardner' | 'holland' | 'learningStyle' | 'vark' | 'personality'>('all');

  const filteredQuestions = currentCategory === 'all'
    ? PSYCH_QUESTIONS
    : PSYCH_QUESTIONS.filter((q) => q.category === currentCategory);

  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / PSYCH_QUESTIONS.length) * 100);

  const handleSelectAnswer = (qId: string, val: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: val,
    }));
  };

  const handleSubmitTest = async () => {
    if (answeredCount < PSYCH_QUESTIONS.length) {
      alert(`لطفاً به تمامی گویه‌ها پاسخ دهید. (تعداد پاسخ داده شده: ${toPersianDigits(answeredCount)} از ${toPersianDigits(PSYCH_QUESTIONS.length)})`);
      return;
    }

    if (!studentProfile) return;
    setIsSubmitting(true);

    const calculated = calculatePsychResults(answers);
    const payload: Omit<PsychTestResult, 'id' | 'completedAt'> = {
      studentId: studentProfile.id,
      ...calculated,
      answers,
    };

    const res = await savePsychTest(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        setActiveTab('results');
      }, 1200);
    }
  };

  const handleSubmitPrayerSurvey = async () => {
    if (!studentProfile || Object.keys(prayerAnswers).length < PRAYER_SURVEY_QUESTIONS.length) return;
    setIsPrayerSubmitting(true);
    const result = await savePrayerSurveyResponse({
      studentId: studentProfile.id,
      classId: studentProfile.classId,
      answers: prayerAnswers,
    });
    setIsPrayerSubmitting(false);
    if (result.success) setSuccessToast(true);
  };

  const handleSubmitSchoolAttitudeSurvey = async () => {
    if (!studentProfile || SCHOOL_ATTITUDE_QUESTIONS.some((question) => schoolAttitudeAnswers[question.id] === undefined)) return;
    setIsSchoolAttitudeSubmitting(true);
    setSchoolAttitudeError('');
    setSchoolAttitudeSuccess(false);
    const scores = calculateSchoolAttitudeScores(schoolAttitudeAnswers);
    const result = await saveSchoolAttitudeResult({
      studentId: studentProfile.id,
      answers: schoolAttitudeAnswers,
      ...scores,
    });
    setIsSchoolAttitudeSubmitting(false);
    if (result.success) setSchoolAttitudeSuccess(true);
    else setSchoolAttitudeError(result.message || 'ثبت پاسخ‌ها انجام نشد. دوباره تلاش کنید.');
  };

  const handleSubmitStaffEvaluation = async () => {
    if (!studentProfile || !selectedEvaluationTarget) return;
    setIsStaffEvaluationSubmitting(true);
    const scoreValues = Object.values(staffEvaluationScores);
    const averageScore = Math.round((scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length) * 100) / 100;
    const result = await saveStudentStaffEvaluation({
      studentId: studentProfile.id,
      targetId: selectedEvaluationTarget.id,
      targetRole: selectedEvaluationTarget.role,
      scores: staffEvaluationScores,
      averageScore,
      notes: staffEvaluationNotes.trim() || undefined,
    });
    setIsStaffEvaluationSubmitting(false);
    if (result.success) setSuccessToast(true);
  };

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-500 to-teal-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-500/20">
              {studentProfile?.firstName?.charAt(0) || 'د'}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                سلام، {studentProfile?.firstName} {studentProfile?.lastName} عزیز
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                شماره دانش‌آموزی: <span className="font-mono">{studentProfile?.studentCode}</span> • کد ملی: <span className="font-mono">{toPersianDigits(studentProfile?.nationalId)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800">
              {myPsychResult ? 'آزمون روانشناختی تکمیل شده' : 'نیاز به شرکت در آزمون خودشناسی'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'results'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>۱. کارنامه هوش و استعداد من</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assessment')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'assessment'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>۲. پرسشنامه خودشناسی و روانشناختی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grades')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'grades'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>۳. نمرات و کارنامه درسی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('prayerSurvey')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'prayerSurvey'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>۴. پرسشنامه نماز جماعت</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staffEvaluation')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'staffEvaluation'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>۵. ارزیابی عوامل مدرسه</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schoolAttitude')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'schoolAttitude'
              ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>۶. آزمون رغبت‌سنجی مدرسه</span>
        </button>
      </div>

      {/* TAB 1: RESULTS VIEW */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {!myPsychResult ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-sm border border-slate-200/80 dark:border-slate-800">
              <Brain className="w-14 h-14 text-indigo-400 mx-auto mb-4" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                هنوز در آزمون روانشناختی و استعدادیابی شرکت نکرده‌اید
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                با پاسخ به چند پرسش ساده درباره هوش‌های چندگانه گاردنر و رغبت‌سنجی هالند، نیمرخ اختصاصی هوش، سبک یادگیری برتر و کدهای شغلی خود را دریافت کنید.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('assessment')}
                className="mt-6 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                شروع پرسشنامه خودشناسی
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Top Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Holland Code */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 bg-white dark:bg-slate-900 shadow-sm">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                    کد سه‌حرفی هالند (رغبت شغلی):
                  </span>
                  <div className="text-3xl font-black text-indigo-700 dark:text-indigo-300 font-mono tracking-wider">
                    {myPsychResult.hollandCode}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                    {HOLLAND_TITLES[myPsychResult.hollandCode.charAt(0)]?.fa}
                  </p>
                </div>

                {/* Learning Style */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-teal-500/10 via-emerald-500/10 to-transparent border border-teal-500/20 bg-white dark:bg-slate-900 shadow-sm">
                  <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 block mb-1">
                    سبک یادگیری برتر:
                  </span>
                  <div className="text-3xl font-black text-teal-700 dark:text-teal-300">
                    {myPsychResult.learningStyle}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                    {myPsychResult.learningStyle === 'دیداری'
                      ? 'یادگیری سریع‌تر از طریق اسلاید، تصویر، نمودار و رنگ‌ها'
                      : myPsychResult.learningStyle === 'شنیداری'
                      ? 'یادگیری عمیق از طریق گفت‌وگو، پرسش‌وپاسخ و بازشنوی'
                      : 'یادگیری مبتنی بر دست‌ورزی، حل تمرین روی کاغذ و آزمایش'}
                  </p>
                </div>

                {/* Personality Type */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 bg-white dark:bg-slate-900 shadow-sm">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mb-1">
                    تیپ شخصیتی تعاملی:
                  </span>
                  <div className="text-3xl font-black text-amber-700 dark:text-amber-300">
                    {myPsychResult.personalityType}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                    {myPsychResult.personalityType === 'درون‌گرا'
                      ? 'تمرکز عمیق فردی، تفکر دقیق پیش از صحبت، تمایل به خلوت خلاقانه'
                      : 'انرژی‌گیری از کارهای گروهی، اشتیاق به مباحثه و روابط اجتماعی پویا'}
                  </p>
                </div>
              </div>

              {myPsychResult.varkScores && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-cyan-200/70 dark:border-cyan-900/50 space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">ترجیح‌های یادگیری چهارگانه (از ۱۰)</h3>
                    <p className="text-[11px] text-slate-500 mt-1">خودارزیابی تألیفی برای پیشنهاد تنوع در یادگیری؛ نه آزمون استاندارد یا تشخیص قطعی.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([
                      ['visual', 'دیداری'], ['auditory', 'شنیداری'], ['readWrite', 'خواندن و نوشتن'], ['kinesthetic', 'عملی و تجربه‌محور'],
                    ] as const).map(([key, label]) => (
                      <div key={key} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold"><span>{label}</span><span>{toPersianDigits(myPsychResult.varkScores![key])} از ۱۰</span></div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"><div className="h-full rounded-full bg-cyan-600" style={{ width: `${myPsychResult.varkScores![key] * 10}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8 Gardner Intelligences Bar Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-600" />
                    <span>نیمرخ هوش‌های چندگانه گاردنر (نمره از ۱۰)</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    تاریخ سنجش: {formatShamsiDate(myPsychResult.completedAt)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {Object.entries(myPsychResult.gardnerScores).map(([key, score]) => {
                    const info = GARDNER_TITLES[key as keyof typeof GARDNER_TITLES];
                    const percent = Math.min(100, Math.round((score / 10) * 100));
                    return (
                      <div key={key} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center justify-between mb-1.5 text-xs font-bold">
                          <span className="text-slate-800 dark:text-slate-200">{info.fa}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                            {toPersianDigits(score)} از ۱۰
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: info.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Holland Careers Match */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-600" />
                  <span>پیشنهادات هدایت تحصیلی و شغلی متناسب با کد هالند شما</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {myPsychResult.hollandCode.split('').map((letter, idx) => {
                    const hInfo = HOLLAND_TITLES[letter];
                    if (!hInfo) return null;
                    return (
                      <div
                        key={letter}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">
                            اولویت {toPersianDigits(idx + 1)} ({letter}):
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                            {hInfo.en}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{hInfo.fa}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          <strong className="text-slate-700 dark:text-slate-300">رشته‌های پیشنهادی: </strong>
                          {hInfo.careers}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('assessment')}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>پاسخگویی مجدد به پرسشنامه</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PSYCHOLOGICAL QUESTIONNAIRE */}
      {activeTab === 'assessment' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              <span>پرسشنامه جامع خودشناسی و استعدادیابی</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              لطفاً میزان موافقت خود را با هر گزاره از ۱ (کاملاً مخالف) تا ۵ (کاملاً موافق) تعیین فرمایید. هیچ پاسخی درست یا غلط نیست!
            </p>
            <p className="text-[11px] text-cyan-700 dark:text-cyan-300 mt-2">پرسش‌های ترجیح یادگیری چهارگانه، خودارزیابی تألیفی و غیرتشخیصی هستند و جایگزین آزمون استاندارد VARK نیستند.</p>
          </div>

          {/* Interactive Progress Bar */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
              <span>پیشرفت پاسخگویی به گویه‌ها:</span>
              <span>
                {toPersianDigits(answeredCount)} از {toPersianDigits(PSYCH_QUESTIONS.length)} سوال ({toPersianDigits(progressPercent)}٪)
              </span>
            </div>
            <div className="w-full bg-indigo-200 dark:bg-indigo-900/80 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Questions Category Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            {[
              { id: 'all', label: 'همه سوالات' },
              { id: 'gardner', label: 'هوش‌های چندگانه (گاردنر)' },
              { id: 'holland', label: 'رغبت‌سنجی شغلی (هالند)' },
              { id: 'learningStyle', label: 'سبک یادگیری' },
              { id: 'vark', label: 'ترجیح‌های چهارگانه یادگیری' },
              { id: 'personality', label: 'تیپ شخصیتی' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentCategory(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  currentCategory === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const currentVal = answers[q.id];
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    currentVal !== undefined
                      ? 'bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-200/60 dark:border-indigo-800/40'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {toPersianDigits(idx + 1)}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-900 dark:text-white font-medium leading-relaxed">
                        {q.text}
                      </p>
                    </div>

                    {/* Likert Scale Buttons 1-5 */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const isSelected = currentVal === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleSelectAnswer(q.id, val)}
                            title={
                              val === 1
                                ? 'کاملاً مخالف'
                                : val === 2
                                ? 'مخالف'
                                : val === 3
                                ? 'ممتنع'
                                : val === 4
                                ? 'موافق'
                                : 'کاملاً موافق'
                            }
                            className={`w-9 h-9 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                            }`}
                          >
                            {toPersianDigits(val)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {answeredCount === PSYCH_QUESTIONS.length
                ? 'تمامی سوالات تکمیل شده‌اند.'
                : `لطفاً به ${toPersianDigits(PSYCH_QUESTIONS.length - answeredCount)} سوال دیگر پاسخ دهید.`}
            </span>

            <button
              type="button"
              onClick={handleSubmitTest}
              disabled={isSubmitting || answeredCount < PSYCH_QUESTIONS.length}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>در حال تحلیل و ثبت نتایج...</span>
              ) : successToast ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>با موفقیت ثبت شد!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>ثبت نهایی و مشاهده کارنامه استعدادیابی</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'schoolAttitude' && (
        <section className="space-y-6">
          <header className="border-b border-cyan-200 pb-4 dark:border-cyan-900">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
              <BookOpen className="h-5 w-5 text-cyan-700" />
              آزمون رغبت‌سنجی مدرسه
            </h3>
            <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
              هر گزاره را بر اساس تجربهٔ خودت از ۱ (کاملاً مخالفم) تا ۵ (کاملاً موافقم) پاسخ بده. پاسخ درست یا غلطی وجود ندارد.
            </p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              این پرسشنامهٔ فارسی با گویه‌های تألیفی و بر پایهٔ ابعاد SAAS-R تهیه شده است؛ نسخهٔ رسمی یا هنجاریابی‌شده نیست و نتیجه برای گفت‌وگوی آموزشی است، نه تشخیص فردی.
            </p>
          </header>

          {mySchoolAttitudeResult && (
            <div className="border-r-4 border-cyan-600 bg-cyan-50 p-4 dark:bg-cyan-950/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-cyan-950 dark:text-cyan-100">نتیجهٔ ثبت‌شدهٔ تو</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{formatShamsiDate(mySchoolAttitudeResult.completedAt)}</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white/80 p-3 dark:bg-slate-900/70">
                  <span className="text-[10px] text-slate-500">میانگین کل از ۵</span>
                  <strong className="mt-1 block text-xl text-cyan-800 dark:text-cyan-300">{toPersianDigits(mySchoolAttitudeResult.overallScore.toFixed(2))}</strong>
                </div>
                {SCHOOL_ATTITUDE_DOMAINS.map((domain) => (
                  <div key={domain.id} className="bg-white/80 p-3 dark:bg-slate-900/70">
                    <span className="text-[10px] text-slate-500">{domain.label}</span>
                    <strong className="mt-1 block text-lg text-slate-800 dark:text-white">{toPersianDigits(mySchoolAttitudeResult.domainScores[domain.id].toFixed(2))} از ۵</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200">پیشرفت پاسخ‌گویی</span>
            <span className="text-slate-500">{toPersianDigits(SCHOOL_ATTITUDE_QUESTIONS.filter((question) => schoolAttitudeAnswers[question.id] !== undefined).length)} از {toPersianDigits(SCHOOL_ATTITUDE_QUESTIONS.length)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-cyan-100 dark:bg-cyan-950">
            <div className="h-full rounded-full bg-cyan-700 transition-all" style={{ width: `${(SCHOOL_ATTITUDE_QUESTIONS.filter((question) => schoolAttitudeAnswers[question.id] !== undefined).length / SCHOOL_ATTITUDE_QUESTIONS.length) * 100}%` }} />
          </div>

          <div className="space-y-5">
            {SCHOOL_ATTITUDE_DOMAINS.map((domain, domainIndex) => (
              <section key={domain.id} className="border-t-4 border-cyan-700 bg-white p-4 shadow-sm dark:bg-slate-900 sm:p-5">
                <div className="mb-4">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{toPersianDigits(domainIndex + 1)}. {domain.label}</h4>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{domain.description}</p>
                </div>
                <div className="space-y-3">
                  {SCHOOL_ATTITUDE_QUESTIONS.filter((question) => question.domain === domain.id).map((question, questionIndex) => (
                    <fieldset key={question.id} className="flex flex-col gap-3 border-b border-slate-100 pb-3 last:border-b-0 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                      <legend className="max-w-3xl text-xs leading-6 text-slate-800 dark:text-slate-200">
                        {toPersianDigits(questionIndex + 1)}. {question.text}
                      </legend>
                      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`پاسخ به ${question.text}`}>
                        {SCHOOL_ATTITUDE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={schoolAttitudeAnswers[question.id] === option.value}
                            title={option.label}
                            onClick={() => setSchoolAttitudeAnswers((previous) => ({ ...previous, [question.id]: option.value }))}
                            className={`min-h-9 rounded-lg border px-2.5 text-[10px] font-bold transition ${schoolAttitudeAnswers[question.id] === option.value
                              ? 'border-cyan-700 bg-cyan-700 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                          >
                            {toPersianDigits(option.value)} · {option.label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {schoolAttitudeError && <p role="alert" className="text-xs font-bold text-rose-700 dark:text-rose-300">{schoolAttitudeError}</p>}
          {schoolAttitudeSuccess && <p role="status" className="text-xs font-bold text-emerald-700 dark:text-emerald-300">پاسخ‌ها ثبت شد؛ نتیجه در همین بخش به‌روزرسانی می‌شود.</p>}
          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <span className="text-xs text-slate-500">میانگین هر بُعد و میانگین کل از ۵ محاسبه می‌شود.</span>
            <button
              type="button"
              onClick={handleSubmitSchoolAttitudeSurvey}
              disabled={isSchoolAttitudeSubmitting || SCHOOL_ATTITUDE_QUESTIONS.some((question) => schoolAttitudeAnswers[question.id] === undefined)}
              className="rounded-lg bg-cyan-800 px-5 py-3 text-xs font-bold text-white transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSchoolAttitudeSubmitting ? 'در حال ثبت...' : mySchoolAttitudeResult ? 'به‌روزرسانی پاسخ‌ها' : 'ثبت آزمون رغبت‌سنجی مدرسه'}
            </button>
          </div>
        </section>
      )}

      {activeTab === 'prayerSurvey' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              پرسشنامه وضعیت نماز جماعت مدرسه
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-6">پاسخ‌ها برای تحلیل آماری مدرسه استفاده می‌شوند. پاسخ شما محرمانه و فقط به‌صورت آماری گزارش خواهد شد.</p>
          </div>

          <div className="space-y-4">
            {PRAYER_SURVEY_QUESTIONS.map((question, index) => (
              <div key={question.id} className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
                <p className="text-sm font-bold leading-7 text-slate-900 dark:text-white">{toPersianDigits(index + 1)}. {question.prompt}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {question.options.map((option, optionIndex) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPrayerAnswers((previous) => ({ ...previous, [question.id]: optionIndex }))}
                      className={`rounded-xl border px-3 py-2.5 text-right text-xs font-bold transition cursor-pointer ${prayerAnswers[question.id] === optionIndex ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-400'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <span className="text-xs text-slate-500">{toPersianDigits(Object.keys(prayerAnswers).length)} از {toPersianDigits(PRAYER_SURVEY_QUESTIONS.length)} سؤال پاسخ داده شده</span>
            <button type="button" onClick={handleSubmitPrayerSurvey} disabled={isPrayerSubmitting || Object.keys(prayerAnswers).length < PRAYER_SURVEY_QUESTIONS.length} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-5 py-3 text-xs font-bold text-white disabled:opacity-50 cursor-pointer">
              {isPrayerSubmitting ? 'در حال ثبت...' : prayerSurveyResponse ? 'به‌روزرسانی پاسخ‌ها' : 'ثبت نهایی پرسشنامه'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'staffEvaluation' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              ارزیابی دبیران و مسئولان مدرسه
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-6">
              نظر شما به بهبود کیفیت آموزشی و پرورشی مدرسه کمک می‌کند. برای هر فرد فقط یک ارزیابی ثبت می‌شود و بعداً قابل ویرایش است.
            </p>
          </div>

          {evaluationTargets.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-6 text-center text-sm text-slate-500">
              هنوز دبیر یا مسئول مدرسه‌ای برای ارزیابی شما ثبت نشده است.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {evaluationTargets.map((target) => (
                  <button
                    key={`${target.role}-${target.id}`}
                    type="button"
                    onClick={() => setSelectedEvaluationTargetId(target.id)}
                    className={`rounded-2xl border p-4 text-right transition cursor-pointer ${
                      selectedEvaluationTargetId === target.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    <div className="text-sm font-black text-slate-900 dark:text-white">{target.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{target.subtitle}</div>
                    {studentStaffEvaluations.some((evaluation) => evaluation.studentId === studentProfile?.id && evaluation.targetId === target.id) && (
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2">ارزیابی ثبت شده</div>
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{selectedEvaluationTarget?.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{selectedEvaluationTarget?.subtitle}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    میانگین: {toPersianDigits((Object.values(staffEvaluationScores).reduce((sum, score) => sum + score, 0) / staffEvaluationCriteria.length).toFixed(2))} از ۵
                  </span>
                </div>

                {staffEvaluationCriteria.map((criterion) => (
                  <div key={criterion.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4">
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{criterion.label}</div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-6">{criterion.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setStaffEvaluationScores((previous) => ({ ...previous, [criterion.id]: score }))}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                            staffEvaluationScores[criterion.id] === score
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                          }`}
                        >
                          {toPersianDigits(score)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <textarea
                  value={staffEvaluationNotes}
                  onChange={(event) => setStaffEvaluationNotes(event.target.value)}
                  placeholder="توضیحات تکمیلی (اختیاری)"
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />

                <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={handleSubmitStaffEvaluation}
                    disabled={isStaffEvaluationSubmitting}
                    className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-5 py-3 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
                  >
                    {isStaffEvaluationSubmitting ? 'در حال ثبت...' : existingStaffEvaluation ? 'به‌روزرسانی ارزیابی' : 'ثبت ارزیابی'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: GRADES & ATTENDANCE */}
      {activeTab === 'grades' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>کارنامه نمرات تحصیلی و وضعیت انضباطی من</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              نمره سالانه بر اساس فرمول مصوب چهار نمره ترمی محاسبه می‌شود: (مستمر ترم اول + ۲×نمره ترم اول + مستمر ترم دوم + ۴×نمره ترم دوم) ÷ ۸.
            </p>
          </div>

          <section className="border-t border-cyan-200 pt-5 dark:border-cyan-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">نتیجهٔ آزمون رغبت‌سنجی مدرسه</h3>
              {mySchoolAttitudeResult && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400">تاریخ ثبت: {formatShamsiDate(mySchoolAttitudeResult.completedAt)}</span>
              )}
            </div>
            {mySchoolAttitudeResult ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div className="border-r-4 border-cyan-700 bg-cyan-50 p-3 dark:bg-cyan-950/30">
                  <span className="text-[10px] font-bold text-cyan-900 dark:text-cyan-200">میانگین کل از ۵</span>
                  <strong className="mt-1 block text-xl text-cyan-950 dark:text-white">{toPersianDigits(mySchoolAttitudeResult.overallScore.toFixed(2))}</strong>
                </div>
                {SCHOOL_ATTITUDE_DOMAINS.map((domain, index) => {
                  const accents = ['border-blue-600', 'border-emerald-600', 'border-rose-600', 'border-indigo-600', 'border-orange-600'];
                  return (
                    <div key={domain.id} className={`border-r-4 ${accents[index]} bg-slate-50 p-3 dark:bg-slate-800/60`}>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{domain.label}</span>
                      <strong className="mt-1 block text-lg text-slate-900 dark:text-white">{toPersianDigits(mySchoolAttitudeResult.domainScores[domain.id].toFixed(2))} از ۵</strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">هنوز نتیجه‌ای برای آزمون رغبت‌سنجی مدرسه ثبت نشده است.</p>
            )}
          </section>

          {subjectConceptMap.size > 0 && (
            <section className="border-t border-amber-200 pt-5 dark:border-amber-900">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">کارنامه مفهومی و یادگیری به تفکیک درس</h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">مفاهیم خوب، متوسط و ضعیف شما در هر درس</span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {Array.from(subjectConceptMap.entries()).map(([subject, entries]) => {
                  const summary = {
                    good: entries.filter((entry) => entry.level === 'good'),
                    medium: entries.filter((entry) => entry.level === 'medium'),
                    weak: entries.filter((entry) => entry.level === 'weak'),
                    ungraded: entries.filter((entry) => !entry.level || typeof entry.score !== 'number'),
                  };

                  return (
                    <div key={subject} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{subject}</h4>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                          {toPersianDigits(entries.length)} مفهوم ثبت‌شده
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-2">
                          <div className="font-black text-emerald-700 dark:text-emerald-300 mb-1">مفاهیم خوب: {toPersianDigits(summary.good.length)}</div>
                          {summary.good.length ? summary.good.map((entry, index) => (
                            <div key={`${entry.sessionId ?? entry.id}-${index}`} className="mt-1 text-slate-700 dark:text-slate-200">
                              <div className="font-bold">{entry.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{entry.assessmentTerm === 'midterm1' ? 'مستمر ترم اول' : entry.assessmentTerm === 'midterm2' ? 'مستمر ترم دوم' : 'دوره نامشخص'}{entry.sessionLabel ? ` · ${entry.sessionLabel}` : ''}{entry.date ? ` · ${new Date(entry.date).toLocaleDateString('fa-IR')}` : ''}</div>
                              {entry.behaviorNote && <div className="text-[10px]">یادداشت جلسه: {entry.behaviorNote}</div>}
                            </div>
                          )) : <div className="text-slate-700 dark:text-slate-200">—</div>}
                        </div>
                        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-2">
                          <div className="font-black text-amber-700 dark:text-amber-300 mb-1">مفاهیم متوسط: {toPersianDigits(summary.medium.length)}</div>
                          {summary.medium.length ? summary.medium.map((entry, index) => (
                            <div key={`${entry.sessionId ?? entry.id}-${index}`} className="mt-1 text-slate-700 dark:text-slate-200">
                              <div className="font-bold">{entry.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{entry.assessmentTerm === 'midterm1' ? 'مستمر ترم اول' : entry.assessmentTerm === 'midterm2' ? 'مستمر ترم دوم' : 'دوره نامشخص'}{entry.sessionLabel ? ` · ${entry.sessionLabel}` : ''}{entry.date ? ` · ${new Date(entry.date).toLocaleDateString('fa-IR')}` : ''}</div>
                              {entry.behaviorNote && <div className="text-[10px]">یادداشت جلسه: {entry.behaviorNote}</div>}
                            </div>
                          )) : <div className="text-slate-700 dark:text-slate-200">—</div>}
                        </div>
                        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-2">
                          <div className="font-black text-rose-700 dark:text-rose-300 mb-1">مفاهیم ضعیف: {toPersianDigits(summary.weak.length)}</div>
                          {summary.weak.length ? summary.weak.map((entry, index) => (
                            <div key={`${entry.sessionId ?? entry.id}-${index}`} className="mt-1 text-slate-700 dark:text-slate-200">
                              <div className="font-bold">{entry.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{entry.assessmentTerm === 'midterm1' ? 'مستمر ترم اول' : entry.assessmentTerm === 'midterm2' ? 'مستمر ترم دوم' : 'دوره نامشخص'}{entry.sessionLabel ? ` · ${entry.sessionLabel}` : ''}{entry.date ? ` · ${new Date(entry.date).toLocaleDateString('fa-IR')}` : ''}</div>
                              {entry.behaviorNote && <div className="text-[10px]">یادداشت جلسه: {entry.behaviorNote}</div>}
                            </div>
                          )) : <div className="text-slate-700 dark:text-slate-200">—</div>}
                        </div>
                        <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2">
                          <div className="font-black text-slate-700 dark:text-slate-200 mb-1">ثبت‌شده، بدون نمره: {toPersianDigits(summary.ungraded.length)}</div>
                          {summary.ungraded.length ? summary.ungraded.map((entry, index) => (
                            <div key={`${entry.sessionId ?? entry.id}-${index}`} className="mt-1 text-slate-700 dark:text-slate-200">
                              <div className="font-bold">{entry.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{entry.assessmentTerm === 'midterm1' ? 'مستمر ترم اول' : entry.assessmentTerm === 'midterm2' ? 'مستمر ترم دوم' : 'دوره نامشخص'}{entry.sessionLabel ? ` · ${entry.sessionLabel}` : ''}{entry.date ? ` · ${new Date(entry.date).toLocaleDateString('fa-IR')}` : ''}</div>
                              {entry.behaviorNote && <div className="text-[10px]">یادداشت جلسه: {entry.behaviorNote}</div>}
                            </div>
                          )) : <div className="text-slate-700 dark:text-slate-200">—</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Grades Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3 rounded-r-xl">عنوان درس</th>
                  <th className="p-3 text-center">مستمر ترم اول</th>
                  <th className="p-3 text-center">نمره ترم اول</th>
                  <th className="p-3 text-center">مستمر ترم دوم</th>
                  <th className="p-3 text-center">نمره ترم دوم</th>
                  <th className="p-3 text-center">شیوه مستمر</th>
                  <th className="p-3 text-center rounded-l-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-black">
                    میانگین نهایی
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {myGrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      هنوز نمره‌ای توسط دبیران برای شما به ثبت نرسیده است.
                    </td>
                  </tr>
                ) : (
                  myGrades.map((gr) => (
                    <tr key={gr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{gr.subject}</td>
                      <td className="p-3 text-center font-mono">{toPersianDigits(gr.continuousTerm1 ?? gr.continuous ?? '—')}</td>
                      <td className="p-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">{toPersianDigits(gr.term1Exam ?? gr.midterm ?? '—')}</td>
                      <td className="p-3 text-center font-mono">{toPersianDigits(gr.continuousTerm2 ?? '—')}</td>
                      <td className="p-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">{toPersianDigits(gr.term2Exam ?? gr.final ?? '—')}</td>
                      <td className="p-3 text-center">{gr.continuousGradeMode === 'indicator' ? 'خودکار' : 'دستی'}</td>
                      <td className="p-3 text-center font-mono font-black text-sm bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300">
                        {toPersianDigits(gr.calculatedAverage?.toFixed(2) ?? '—')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
