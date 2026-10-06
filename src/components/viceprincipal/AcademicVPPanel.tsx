import React, { useState } from 'react';
import {
  GraduationCap,
  Star,
  Check,
  Trash2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BarChart,
  BookOpen,
  Megaphone,
  Brain,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { toPersianDigits, formatShamsiDate, PERSIAN_MONTHS } from '../../lib/persianUtils';
import { CreateNotificationModal } from '../notifications/CreateNotificationModal';
import { SchoolAttitudeDashboard } from '../SchoolAttitudeDashboard';
import { TalentOverview } from '../TalentOverview';
import type { SchoolClass, StudentGrade, SubjectDifficulty, Teacher } from '../../types';

type TeacherStrictnessResult = {
  teacherId: string;
  teacherName: string;
  studentCount: number;
  meanDifference: number | null;
};

const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const standardDeviation = (values: number[], center = mean(values)) =>
  values.length ? Math.sqrt(mean(values.map((value) => (value - center) ** 2))) : 0;

const normalizeSubject = (subject: string) => subject.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const getDifficultyCoefficient = (subject: string, gradeId: string | undefined, difficulties: SubjectDifficulty[]) => {
  const matchingSubject = difficulties.filter((difficulty) => normalizeSubject(difficulty.subject) === normalizeSubject(subject));
  const gradeSpecific = matchingSubject.filter((difficulty) => difficulty.gradeId === gradeId);
  const applicable = gradeSpecific.length > 0 ? gradeSpecific : matchingSubject.filter((difficulty) => !difficulty.gradeId);
  const coefficients = applicable.map((difficulty) => difficulty.coefficient).filter((coefficient) => Number.isFinite(coefficient) && coefficient > 0);
  return coefficients.length > 0 ? mean(coefficients) : 1;
};

const calculateTeacherStrictness = (grades: StudentGrade[], teachers: Teacher[], classes: SchoolClass[], difficulties: SubjectDifficulty[]) => {
  const gradeByClass = new Map(classes.map((schoolClass) => [schoolClass.id, schoolClass.gradeId]));
  const validGrades = grades.flatMap((grade) =>
    typeof grade.calculatedAverage === 'number' && Number.isFinite(grade.calculatedAverage)
      ? [{
          studentId: grade.studentId,
          teacherId: grade.teacherId,
          subject: normalizeSubject(grade.subject),
          score: Math.min(20, grade.calculatedAverage * getDifficultyCoefficient(grade.subject, gradeByClass.get(grade.classId), difficulties)),
        }]
      : []
  );
  const studentCourses = new Map<string, Map<string, number[]>>();
  const subjectStudents = new Map<string, Map<string, typeof validGrades>>();

  for (const grade of validGrades) {
    const courses = studentCourses.get(grade.studentId) ?? new Map<string, number[]>();
    const courseScores = courses.get(grade.subject) ?? [];
    courseScores.push(grade.score);
    courses.set(grade.subject, courseScores);
    studentCourses.set(grade.studentId, courses);

    const studentsForSubject = subjectStudents.get(grade.subject) ?? new Map<string, typeof validGrades>();
    const studentGrades = studentsForSubject.get(grade.studentId) ?? [];
    studentGrades.push(grade);
    studentsForSubject.set(grade.studentId, studentGrades);
    subjectStudents.set(grade.subject, studentsForSubject);
  }

  const differencesByTeacher = new Map<string, Map<string, number[]>>();

  for (const [subject, studentsForSubject] of subjectStudents) {
    const subjectScores = [...studentsForSubject.values()].map((studentGrades) => mean(studentGrades.map((grade) => grade.score)));
    const subjectMean = mean(subjectScores);
    const subjectDeviation = standardDeviation(subjectScores, subjectMean);
    const otherCourseMeans = new Map<string, number>();

    for (const studentId of studentsForSubject.keys()) {
      const courses = studentCourses.get(studentId);
      const otherMeans = courses
        ? [...courses.entries()].filter(([course]) => course !== subject).map(([, scores]) => mean(scores))
        : [];
      if (otherMeans.length > 0) otherCourseMeans.set(studentId, mean(otherMeans));
    }

    const abilityScores = [...otherCourseMeans.values()];
    if (abilityScores.length === 0) continue;
    const abilityMean = mean(abilityScores);
    const abilityDeviation = standardDeviation(abilityScores, abilityMean);

    for (const [studentId, studentGrades] of studentsForSubject) {
      const otherCourseMean = otherCourseMeans.get(studentId);
      if (otherCourseMean === undefined) continue;
      const zScore = abilityDeviation === 0 ? 0 : (otherCourseMean - abilityMean) / abilityDeviation;
      const expectedScore = subjectMean + zScore * subjectDeviation;

      for (const grade of studentGrades) {
        const teacherStudents = differencesByTeacher.get(grade.teacherId) ?? new Map<string, number[]>();
        const studentDifferences = teacherStudents.get(studentId) ?? [];
        studentDifferences.push(grade.score - expectedScore);
        teacherStudents.set(studentId, studentDifferences);
        differencesByTeacher.set(grade.teacherId, teacherStudents);
      }
    }
  }

  const results: TeacherStrictnessResult[] = teachers.map((teacher) => {
    const studentDifferences = [...(differencesByTeacher.get(teacher.id)?.values() ?? [])].map(mean);
    return {
      teacherId: teacher.id,
      teacherName: teacher.fullName,
      studentCount: studentDifferences.length,
      meanDifference: studentDifferences.length > 0 ? mean(studentDifferences) : null,
    };
  });
  const indicators = results.flatMap((result) => result.meanDifference === null ? [] : [result.meanDifference]);
  const threshold = indicators.length >= 2 ? standardDeviation(indicators) / Math.sqrt(indicators.length) : null;

  return { results, threshold };
};

export const AcademicVPPanel: React.FC = () => {
  const {
    currentUser,
    classes,
    teachers,
    assignments,
    gradesSheet,
    attendanceRecords,
    students,
    psychResults,
    schoolAttitudeResults,
    subjectDifficulties,
    evaluations,
    saveTeacherEvaluation,
    deleteTeacherEvaluation,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'monitoring' | 'evalTeachers' | 'strictness' | 'schoolAttitude' | 'learningMethods'>('monitoring');
  const [homeworkMonth, setHomeworkMonth] = useState(PERSIAN_MONTHS[0]);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const strictnessAnalysis = calculateTeacherStrictness(gradesSheet, teachers, classes, subjectDifficulties);

  // Evaluation form state (5 Academic Indicators)
  const [evalTeacherId, setEvalTeacherId] = useState('');
  const [academicScores, setAcademicScores] = useState({
    pacing: 5,
    exam_quality: 5,
    homework_followup: 5,
    department_coordination: 5,
    evaluation_analysis: 5,
  });
  const [evalNotes, setEvalNotes] = useState('');

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalTeacherId) {
      showFeedback('error', 'لطفاً دبیر را انتخاب فرمایید.');
      return;
    }

    const scoreVals = Object.values(academicScores);
    const avg = Math.round((scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) * 100) / 100;

    const res = await saveTeacherEvaluation({
      teacherId: evalTeacherId,
      evaluatorRole: 'academic_vp',
      evaluatorId: currentUser?.id || 'academic_vp',
      evaluatorName: currentUser?.fullName || 'معاون آموزشی',
      scores: academicScores,
      averageScore: avg,
      notes: evalNotes,
    });

    if (res.success) {
      showFeedback('success', `ارزیابی آموزشی با نمره ${toPersianDigits(avg)} ثبت گردید.`);
    } else {
      showFeedback('error', res.message || 'خطا در ثبت ارزیابی.');
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

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-600/20">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                پرتال معاونت آموزشی مدرسه: {currentUser?.fullName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                پایش میانگین دروس، بودجه‌بندی تدریس و ارزیابی کیفی دبیران (وزن ۲۰٪ در ارزشیابی ۳۶۰ درجه)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNotifModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
          >
            <Megaphone className="w-4 h-4" />
            <span>ارسال پیام و یادآور آموزشی</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('monitoring')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'monitoring'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>۱. داشبورد و مانیتورینگ پیشرفت دروس</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evalTeachers')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'evalTeachers'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>۲. ارزیابی آموزشی دبیران (۵ شاخص)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('strictness')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'strictness'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart className="w-4 h-4" />
          <span>۳. تحلیل سخت‌گیری دبیران</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schoolAttitude')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'schoolAttitude'
              ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>۴. رغبت‌سنجی مدرسه</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('learningMethods')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'learningMethods'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>۵. روش‌های یادگیری کلاس و مدرسه</span>
        </button>
      </div>

      {activeTab === 'learningMethods' && (
        <TalentOverview
          classes={classes}
          students={students}
          psychResults={psychResults}
          grades={gradesSheet}
          attendanceRecords={attendanceRecords}
          recommendationMode="learning"
          title="روش‌های یادگیری پیشنهادی بر پایه آزمون و وضعیت تحصیلی"
        />
      )}

      {/* TAB 1: ACADEMIC MONITORING */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Class by Class Grade Averages */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart className="w-5 h-5 text-blue-600" />
              <span>میانگین وضعیت درسی به تفکیک کلاس‌ها</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((c) => {
                const classGrades = gradesSheet.filter((g) => g.classId === c.id);
                const classAvg = classGrades.length > 0
                  ? Math.round(
                      (classGrades.reduce((acc, curr) => acc + (curr.calculatedAverage || 0), 0) /
                        classGrades.length) *
                        100
                    ) / 100
                  : 0;

                const classStudents = students.filter((s) => s.classId === c.id);

                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold">
                        {toPersianDigits(classStudents.length)} دانش‌آموز
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-500">میانگین کل کلاس:</span>
                      <span className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono">
                        {toPersianDigits(classAvg.toFixed(2))}
                      </span>
                      <span className="text-xs text-slate-400">از ۲۰</span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, (classAvg / 20) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Homework Monitoring */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-blue-600" />
                  <span>پایش کیفیت و انجام تکالیف به تفکیک ماه</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">درصد انجام تکالیف از ۱۰۰ و کیفیت تکالیف از ۵ محاسبه می‌شود.</p>
              </div>
              <select
                value={homeworkMonth}
                onChange={(event) => setHomeworkMonth(event.target.value)}
                className="rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-xs font-bold text-blue-900 dark:text-blue-200"
              >
                {PERSIAN_MONTHS.map((month) => <option key={month} value={month}>{month}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3 rounded-r-xl">ماه</th>
                    <th className="p-3 text-center">تعداد رکورد</th>
                    <th className="p-3 text-center">درصد انجام تکالیف</th>
                    <th className="p-3 text-center rounded-l-xl">کیفیت تکالیف از ۵</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {PERSIAN_MONTHS.map((month) => {
                    const records = attendanceRecords.filter((record) => record.month === month && !record.date);
                    const homeworkPercent = records.length > 0 ? records.reduce((sum, record) => sum + record.homeworkPercent, 0) / records.length : null;
                    const homeworkQuality = records.length > 0 ? records.reduce((sum, record) => sum + record.homeworkQuality, 0) / records.length : null;
                    return (
                      <tr key={month} className={homeworkMonth === month ? 'bg-blue-50/70 dark:bg-blue-950/20' : ''}>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{month}</td>
                        <td className="p-3 text-center text-slate-500">{toPersianDigits(records.length)}</td>
                        <td className="p-3 text-center font-black text-blue-700 dark:text-blue-300">{homeworkPercent === null ? '—' : `${toPersianDigits(Math.round(homeworkPercent))}٪`}</td>
                        <td className="p-3 text-center font-black text-teal-700 dark:text-teal-300">{homeworkQuality === null ? '—' : toPersianDigits(homeworkQuality.toFixed(2))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">نمودار مقایسه کلاس‌ها در ماه {homeworkMonth}</h4>
              <div className="space-y-4">
                {classes.map((schoolClass) => {
                  const records = attendanceRecords.filter((record) => record.classId === schoolClass.id && record.month === homeworkMonth && !record.date);
                  const homeworkPercent = records.length > 0 ? records.reduce((sum, record) => sum + record.homeworkPercent, 0) / records.length : 0;
                  const homeworkQuality = records.length > 0 ? records.reduce((sum, record) => sum + record.homeworkQuality, 0) / records.length : 0;
                  return (
                    <div key={schoolClass.id} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-xs">
                      <span className="truncate font-bold text-slate-700 dark:text-slate-300">{schoolClass.name}</span>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2"><span className="w-16 text-[10px] text-slate-500">انجام تکلیف</span><div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{ width: `${homeworkPercent}%` }} /></div></div>
                        <div className="flex items-center gap-2"><span className="w-16 text-[10px] text-slate-500">کیفیت</span><div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"><div className="h-full rounded-full bg-teal-500" style={{ width: `${homeworkQuality * 20}%` }} /></div></div>
                      </div>
                      <span className="text-left font-black text-blue-700 dark:text-blue-300">{records.length > 0 ? `${toPersianDigits(Math.round(homeworkPercent))}٪` : '—'}</span>
                    </div>
                  );
                })}
              </div>
              {classes.length === 0 && <p className="text-center text-xs text-slate-400 py-4">کلاسی برای نمایش وجود ندارد.</p>}
            </div>
          </div>

          {/* Subject Difficulty Adjustments Analysis */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>تحلیل مقایسه‌ای نمرات خام در برابر نمرات تعدیل‌شده با ضریب سختی</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3 rounded-r-xl">عنوان درس</th>
                    <th className="p-3 text-center">ضریب سختی مصوب</th>
                    <th className="p-3 text-center">میانگین خام مدرسه</th>
                    <th className="p-3 text-center rounded-l-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-black">
                      میانگین تعدیل‌شده منصفانه
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {subjectDifficulties.map((sd) => {
                    const subGrades = gradesSheet.filter((g) => g.subject === sd.subject);
                    const rawAvg = subGrades.length > 0
                      ? Math.round(
                          (subGrades.reduce((acc, curr) => acc + (curr.calculatedAverage || 0), 0) /
                            subGrades.length) *
                            100
                        ) / 100
                      : 0;

                    const adjAvg = Math.min(20, Math.round(rawAvg * sd.coefficient * 100) / 100);

                    return (
                      <tr key={sd.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{sd.subject}</td>
                        <td className="p-3 text-center font-mono font-bold">{toPersianDigits(sd.coefficient.toFixed(2))}</td>
                        <td className="p-3 text-center font-mono">{toPersianDigits(rawAvg.toFixed(2))}</td>
                        <td className="p-3 text-center font-mono font-black text-sm bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                          {toPersianDigits(adjAvg.toFixed(2))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'strictness' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">تحلیل سخت‌گیری و سهل‌گیری دبیران</h3>
            <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
              نمره‌ها ابتدا با ضریب سختی مصوب هر درس تعدیل می‌شوند؛ سپس بر اساس توان درسی هر دانش‌آموز و نمرهٔ مورد انتظار همان درس مقایسه می‌شوند، نه میانگین خام دبیران.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3 rounded-r-xl">نام دبیر</th>
                  <th className="p-3 text-center">تعداد دانش‌آموز</th>
                  <th className="p-3 text-center">میانگین اختلاف</th>
                  <th className="p-3 text-center rounded-l-xl">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {strictnessAnalysis.results.map((result) => {
                  const status = result.meanDifference === null
                    ? { label: 'دادهٔ کافی نیست', style: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' }
                    : strictnessAnalysis.threshold === null
                      ? { label: 'دادهٔ کافی نیست', style: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' }
                      : result.meanDifference < -strictnessAnalysis.threshold
                      ? { label: 'سخت‌گیر', style: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300' }
                      : result.meanDifference > strictnessAnalysis.threshold
                        ? { label: 'سهل‌گیر', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' }
                        : { label: 'متعادل', style: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' };

                  return (
                    <tr key={result.teacherId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{result.teacherName}</td>
                      <td className="p-3 text-center">{toPersianDigits(result.studentCount)}</td>
                      <td className="p-3 text-center font-mono font-bold" dir="ltr">
                        {result.meanDifference === null ? '—' : toPersianDigits(`${result.meanDifference > 0 ? '+' : ''}${result.meanDifference.toFixed(2)}`)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-1 font-bold ${status.style}`}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
                {strictnessAnalysis.results.length === 0 && (
                  <tr><td colSpan={4} className="p-5 text-center text-slate-400">دبیری برای نمایش ثبت نشده است.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <ul className="list-disc space-y-1 border-t border-slate-100 pt-4 pr-5 text-xs leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <li>ابتدا سطح کلی هر دانش‌آموز از میانگین نمرات او در <strong>سایر دروس</strong> محاسبه می‌شود.</li>
            <li>با توجه به <strong>ضریب سختی اختصاص‌یافته به هر درس</strong>، نمره مورد انتظار دانش‌آموز در آن درس محاسبه می‌شود.</li>
            <li>نمره واقعی دانش‌آموز با نمره مورد انتظار مقایسه می‌شود.</li>
            <li>اگر دبیر به‌طور میانگین <strong>کمتر از انتظار</strong> نمره داده باشد → سخت‌گیرتر.</li>
            <li>اگر <strong>بیشتر از انتظار</strong> نمره داده باشد → سهل‌گیرتر.</li>
            <li>بنابراین هم <strong>تفاوت سطح دانش‌آموزان</strong> و هم <strong>سختی ذاتی درس</strong> در ارزیابی دبیر کنترل می‌شود.</li>
          </ul>
        </div>
      )}

      {/* TAB 2: TEACHER EVALUATION (ACADEMIC VP) */}
      {activeTab === 'evalTeachers' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-600" />
              <span>ارزیابی کیفی دبیران توسط معاونت آموزشی (وزن ۲۰٪)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ثبت امتیاز ۱ تا ۵ برای ۵ شاخص آموزشی و پایش استانداردهای تدریس.
            </p>
          </div>

          <form onSubmit={handleSaveEvaluation} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">انتخاب دبیر جهت ارزیابی:</label>
              <select
                required
                value={evalTeacherId}
                onChange={(e) => {
                  setEvalTeacherId(e.target.value);
                  const prev = evaluations.find(
                    (ev) => ev.teacherId === e.target.value && ev.evaluatorRole === 'academic_vp'
                  );
                  if (prev) {
                    setAcademicScores(prev.scores as any);
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

            {/* 5 Academic Indicators */}
            <div className="space-y-3">
              {[
                { key: 'pacing', title: '۱. رعایت بودجه‌بندی زمان‌بندی‌شده و پیشرفت منظم سرفصل‌ها' },
                { key: 'exam_quality', title: '۲. استاندارد و کیفیت طراحی آزمون‌های دوره‌ای و میان‌ترم' },
                { key: 'homework_followup', title: '۳. بررسی منظم و سریع تکالیف دانش‌آموزان و ارائه بازخورد' },
                { key: 'department_coordination', title: '۴. هماهنگی با شورای معلمان و گروه‌های آموزشی هم‌پایه' },
                { key: 'evaluation_analysis', title: '۵. تحلیل دقیق نقاط ضعف یادگیری و اجرای کلاس‌های جبرانی' },
              ].map((crit) => {
                const currentScore = academicScores[crit.key as keyof typeof academicScores] || 5;
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
                          onClick={() => setAcademicScores((prev) => ({ ...prev, [crit.key]: star }))}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                            currentScore >= star
                              ? 'bg-blue-600 text-white shadow-xs'
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">یادداشت تخصصی آموزشی:</label>
              <textarea
                rows={2}
                value={evalNotes}
                onChange={(e) => setEvalNotes(e.target.value)}
                placeholder="توصیه‌های آموزشی به دبیر..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ثبت ارزیابی معاون آموزشی</span>
              </button>
            </div>
          </form>

          {/* Previous Academic Evaluations */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
              ارزیابی‌های ثبت‌شده توسط معاونت آموزشی:
            </h4>
            {evaluations
              .filter((e) => e.evaluatorRole === 'academic_vp')
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
                        امتیاز آموزشی: <strong className="text-blue-600">{toPersianDigits(ev.averageScore.toFixed(2))} از ۵</strong> • تاریخ: {formatShamsiDate(ev.updatedAt)}
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

      {activeTab === 'schoolAttitude' && (
        <SchoolAttitudeDashboard students={students} classes={classes} results={schoolAttitudeResults} />
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
