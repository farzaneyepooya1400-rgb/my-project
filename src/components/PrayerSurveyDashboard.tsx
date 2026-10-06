import React from 'react';
import { BarChart3, School } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { PrayerSurveyResponse } from '../types';
import { PRAYER_SURVEY_CATEGORY_LABELS, PRAYER_SURVEY_QUESTIONS, PrayerSurveyCategory, getPrayerSurveyScore } from '../lib/prayerSurvey';
import { toPersianDigits } from '../lib/persianUtils';

const categories: PrayerSurveyCategory[] = ['environment', 'staff_participation', 'student_motivation', 'parents'];

function getStatus(score: number) {
  if (score >= 75) return { label: 'سبز · مطلوب', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' };
  if (score >= 50) return { label: 'زرد · نیازمند بهبود', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' };
  return { label: 'قرمز · نیازمند اقدام', className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300' };
}

function calculateCategoryScore(answers: Record<string, number>, category: PrayerSurveyCategory) {
  const questions = PRAYER_SURVEY_QUESTIONS.filter((question) => question.category === category);
  const scores = questions
    .map((question) => answers[question.id])
    .filter((answer): answer is number => typeof answer === 'number')
    .map(getPrayerSurveyScore);
  return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
}

function SurveySummary({ responses, totalStudents, title }: { responses: PrayerSurveyResponse[]; totalStudents: number; title: string }) {
  const responseCount = responses.length;
  const participationPercent = totalStudents ? Math.round((responseCount / totalStudents) * 100) : 0;
  const categoryScores = categories.map((category) => ({ category, score: responseCount ? Math.round(responses.reduce((sum, response) => sum + calculateCategoryScore(response.answers, category), 0) / responseCount) : 0 }));
  const overallScore = categoryScores.length ? Math.round(categoryScores.reduce((sum, item) => sum + item.score, 0) / categoryScores.length) : 0;

  return (
    <div className="rounded-2xl border border-indigo-200/70 dark:border-indigo-900/70 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-black text-slate-900 dark:text-white">{title}</h4>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatus(overallScore).className}`}>{getStatus(overallScore).label}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-white dark:bg-slate-900 p-3"><div className="text-[10px] text-slate-500">تعداد پاسخ</div><div className="text-xl font-black text-indigo-700 dark:text-indigo-300">{toPersianDigits(responseCount)}</div></div>
        <div className="rounded-xl bg-white dark:bg-slate-900 p-3"><div className="text-[10px] text-slate-500">درصد مشارکت از کل</div><div className="text-xl font-black text-indigo-700 dark:text-indigo-300">{toPersianDigits(participationPercent)}٪</div></div>
        <div className="rounded-xl bg-white dark:bg-slate-900 p-3"><div className="text-[10px] text-slate-500">امتیاز کلی شاخص‌ها</div><div className="text-xl font-black text-indigo-700 dark:text-indigo-300">{toPersianDigits(overallScore)}٪</div></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {categoryScores.map(({ category, score }) => {
          const status = getStatus(score);
          return <div key={category} className="flex items-center justify-between gap-2 rounded-xl bg-white/80 dark:bg-slate-900/80 px-3 py-2"><span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{PRAYER_SURVEY_CATEGORY_LABELS[category]}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${status.className}`}>{toPersianDigits(score)}٪ · {status.label.split(' · ')[0]}</span></div>;
        })}
      </div>
    </div>
  );
}

export const PrayerSurveyDashboard: React.FC = () => {
  const { students, classes, prayerSurveyResponses } = useSchool();
  const responsesByClass = classes.map((schoolClass) => ({
    schoolClass,
    responses: prayerSurveyResponses.filter((response) => response.classId === schoolClass.id),
    totalStudents: students.filter((student) => student.classId === schoolClass.id).length,
  }));

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-indigo-600 p-3 text-white"><BarChart3 className="w-5 h-5" /></div>
        <div><h3 className="text-base font-black text-slate-900 dark:text-white">تحلیل آماری وضعیت نماز جماعت</h3><p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">آمار بر اساس پاسخ‌های ثبت‌شده و تعداد واقعی دانش‌آموزان محاسبه می‌شود. سبز مطلوب، زرد نیازمند بهبود و قرمز نیازمند اقدام است.</p></div>
      </div>
      <SurveySummary responses={prayerSurveyResponses} totalStudents={students.length} title="وضعیت کل مدرسه" />
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><School className="w-4 h-4 text-indigo-600" />وضعیت تفکیکی کلاس‌ها</h4>
        {responsesByClass.length === 0 ? <p className="text-xs text-slate-500">کلاسی برای تحلیل ثبت نشده است.</p> : responsesByClass.map(({ schoolClass, responses, totalStudents }) => <SurveySummary key={schoolClass.id} responses={responses} totalStudents={totalStudents} title={`${schoolClass.name} · ${toPersianDigits(responses.length)} پاسخ از ${toPersianDigits(totalStudents)} دانش‌آموز`} />)}
      </div>
    </section>
  );
};
