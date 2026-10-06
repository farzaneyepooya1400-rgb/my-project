import React, { useEffect, useMemo, useState } from 'react';
import { BarChart2, Brain, GraduationCap, Users } from 'lucide-react';
import { AttendanceRecord, GardnerScores, PsychTestResult, SchoolClass, Student, StudentGrade } from '../types';
import { GARDNER_TITLES } from '../lib/psychologyData';
import { toPersianDigits } from '../lib/persianUtils';

interface TalentOverviewProps {
  classes: SchoolClass[];
  students: Student[];
  psychResults: PsychTestResult[];
  grades?: StudentGrade[];
  attendanceRecords?: AttendanceRecord[];
  classId?: string;
  title?: string;
  recommendationMode?: 'learning' | 'extracurricular' | 'both';
}

type TalentKey = keyof GardnerScores;

const TALENT_KEYS: TalentKey[] = [
  'verbal',
  'logical',
  'spatial',
  'musical',
  'bodily',
  'intrapersonal',
  'interpersonal',
  'naturalist',
];

const TALENT_SUPPORT: Record<TalentKey, string> = {
  verbal: 'کارگاه نویسندگی، سخنرانی و مناظره',
  logical: 'کلاس حل مسئله، ریاضی و آزمایش‌های علمی',
  spatial: 'کارگاه هنرهای تجسمی، طراحی و ساخت',
  musical: 'کلاس موسیقی، ریتم و فعالیت‌های هنری شنیداری',
  bodily: 'کلاس ورزش، مهارت‌های حرکتی و بازی‌های گروهی',
  intrapersonal: 'کارگاه خودشناسی، هدف‌گذاری و مهارت‌های فردی',
  interpersonal: 'کلاس همکاری، ارتباط مؤثر و رهبری گروهی',
  naturalist: 'کارگاه محیط‌زیست، علوم تجربی و طبیعت‌پژوهی',
};

const VARK_LABELS: Record<string, string> = {
  visual: 'دیداری',
  auditory: 'شنیداری',
  readWrite: 'خواندن و نوشتن',
  kinesthetic: 'عملی و تجربه‌محور',
};

const TEACHING_METHODS: Record<string, string> = {
  visual: 'مفهوم‌ها را با نمودار، نقشه مفهومی، تصویر و نمایش مرحله‌ای ارائه کنید.',
  auditory: 'گفت‌وگوی هدایت‌شده، توضیح شفاهی دانش‌آموز و پرسش‌وپاسخ کوتاه را به کار ببرید.',
  readWrite: 'متن کوتاه، واژه‌نامه، خلاصه‌نویسی و تمرین نوشتاری ساختارمند فراهم کنید.',
  kinesthetic: 'آزمایش، حل مسئله عملی، ساخت مدل و فعالیت‌های حرکتی کوتاه را بگنجانید.',
};

const HOLLAND_ACTIVITIES: Record<string, string> = {
  R: 'کارگاه رباتیک، ساخت‌وساز، مهارت‌های فنی و ورزش‌های مهارتی',
  I: 'باشگاه علوم، آزمایشگاه دانش‌آموزی، برنامه‌نویسی و پژوهش',
  A: 'کارگاه هنرهای تجسمی، نویسندگی، تئاتر و تولید محتوای خلاق',
  S: 'همیار آموزشی، فعالیت داوطلبانه، گفت‌وگو و پروژه‌های گروهی',
  E: 'باشگاه مناظره، شورای دانش‌آموزی، کارآفرینی و رهبری پروژه',
  C: 'باشگاه برنامه‌ریزی، سواد مالی، ثبت داده و پروژه‌های سازمان‌دهی',
};

const getPercent = (count: number, total: number) => total > 0 ? Math.round((count / total) * 100) : 0;

const formatPercent = (value: number) => `${toPersianDigits(value)}٪`;

const getDistribution = <T,>(items: T[], getKey: (item: T) => string) => {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(getKey(item), (counts.get(getKey(item)) || 0) + 1));
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count, percent: getPercent(count, items.length) }))
    .sort((a, b) => b.count - a.count);
};

const getDominantTalent = (scores: GardnerScores): TalentKey => (
  TALENT_KEYS.reduce((best, key) => scores[key] > scores[best] ? key : best, TALENT_KEYS[0])
);

const getLearningPreference = (result: PsychTestResult) => {
  if (result.varkScores) {
    return Object.entries(result.varkScores).sort((first, second) => second[1] - first[1])[0]?.[0] || 'visual';
  }
  return result.learningStyle === 'شنیداری' ? 'auditory' : result.learningStyle === 'عملی' ? 'kinesthetic' : 'visual';
};

export const TalentOverview: React.FC<TalentOverviewProps> = ({
  classes,
  students,
  psychResults,
  grades = [],
  attendanceRecords = [],
  classId,
  title = 'استعدادها و شخصیت‌شناسی تجمیعی',
  recommendationMode = 'extracurricular',
}) => {
  const [selectedClassId, setSelectedClassId] = useState(classId || 'school');

  useEffect(() => {
    setSelectedClassId(classId || 'school');
  }, [classId]);

  const resultByStudent = useMemo(() => new Map(psychResults.map((result) => [result.studentId, result])), [psychResults]);
  const schoolResults = useMemo(
    () => students.map((student) => resultByStudent.get(student.id)).filter((result): result is PsychTestResult => Boolean(result)),
    [students, resultByStudent]
  );
  const selectedStudents = selectedClassId === 'school'
    ? students
    : students.filter((student) => student.classId === selectedClassId);
  const selectedResults = selectedStudents
    .map((student) => resultByStudent.get(student.id))
    .filter((result): result is PsychTestResult => Boolean(result));
  const className = selectedClassId === 'school'
    ? 'کل مدرسه'
    : classes.find((schoolClass) => schoolClass.id === selectedClassId)?.name || 'کلاس انتخاب‌شده';

  const buildSummary = (results: PsychTestResult[]) => {
    const talentDistribution = getDistribution(results, (result) => getDominantTalent(result.gardnerScores));
    const personalityDistribution = getDistribution(results, (result) => result.personalityType);
    const learningDistribution = getDistribution(results, (result) => result.learningStyle);
    const varkDistribution = getDistribution(results, getLearningPreference);
    const hollandDistribution = getDistribution(results, (result) => result.hollandCode.charAt(0) || 'I');
    const talentAverages = TALENT_KEYS.map((key) => ({
      key,
      average: results.length > 0
        ? Math.round((results.reduce((sum, result) => sum + result.gardnerScores[key], 0) / results.length) * 10) / 10
        : 0,
    })).sort((a, b) => a.average - b.average);
    return { talentDistribution, personalityDistribution, learningDistribution, varkDistribution, hollandDistribution, talentAverages };
  };

  const selectedSummary = buildSummary(selectedResults);
  const schoolSummary = buildSummary(schoolResults);
  const priorityItems = (summary: ReturnType<typeof buildSummary>) => summary.talentAverages.slice(0, 3);
  const buildStatus = (groupStudents: Student[]) => {
    const studentIds = new Set(groupStudents.map((student) => student.id));
    const validGrades = grades.filter((grade) => studentIds.has(grade.studentId) && typeof grade.calculatedAverage === 'number');
    const validAttendance = attendanceRecords.filter((record) => studentIds.has(record.studentId));
    return {
      averageGrade: validGrades.length ? validGrades.reduce((sum, grade) => sum + (grade.calculatedAverage || 0), 0) / validGrades.length : null,
      homeworkPercent: validAttendance.length ? validAttendance.reduce((sum, record) => sum + record.homeworkPercent, 0) / validAttendance.length : null,
      participation: validAttendance.length ? validAttendance.reduce((sum, record) => sum + record.participation, 0) / validAttendance.length : null,
    };
  };
  const makeRecommendations = (summary: ReturnType<typeof buildSummary>, groupStudents: Student[]) => {
    const status = buildStatus(groupStudents);
    const methods = summary.varkDistribution.slice(0, 2).map((item) => ({
      label: VARK_LABELS[item.key] || item.key,
      detail: TEACHING_METHODS[item.key],
      percent: item.percent,
    }));
    if (status.averageGrade !== null && status.averageGrade < 12) {
      methods.push({ label: 'تقویت پایه درسی', detail: 'به دلیل میانگین ثبت‌شده زیر ۱۲ از ۲۰، آموزش را به گام‌های کوتاه تقسیم کنید و از تمرین بازیابی و بازخورد سریع استفاده کنید.', percent: 0 });
    }
    if (status.participation !== null && status.participation < 3) {
      methods.push({ label: 'مشارکت فعال', detail: 'با توجه به مشارکت ثبت‌شده کمتر از ۳ از ۵، فعالیت‌های دونفره کم‌ریسک و زمان فکر فردی پیش از پاسخ‌گویی جمعی را اضافه کنید.', percent: 0 });
    }
    const activities = [
      summary.hollandDistribution[0] ? HOLLAND_ACTIVITIES[summary.hollandDistribution[0].key] : undefined,
      summary.talentDistribution[0] ? TALENT_SUPPORT[summary.talentDistribution[0].key as TalentKey] : undefined,
    ].filter((activity): activity is string => Boolean(activity));
    return { methods, activities, status };
  };
  const selectedRecommendations = makeRecommendations(selectedSummary, selectedStudents);
  const schoolRecommendations = makeRecommendations(schoolSummary, students);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">درصدها بر اساس دانش‌آموزانی محاسبه شده‌اند که آزمون استعداد و شخصیت‌شناسی را کامل کرده‌اند.</p>
        </div>
        {!classId && (
          <select
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
            className="w-full lg:w-56 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="school">کل مدرسه</option>
            {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60 p-4">
          <Users className="w-5 h-5 text-indigo-600 mb-2" />
          <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{toPersianDigits(selectedResults.length)}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">نتیجه معتبر در {className} از {toPersianDigits(selectedStudents.length)} دانش‌آموز</div>
        </div>
        <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/60 p-4">
          <GraduationCap className="w-5 h-5 text-teal-600 mb-2" />
          <div className="text-2xl font-black text-teal-700 dark:text-teal-300">{formatPercent(getPercent(selectedResults.length, selectedStudents.length))}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">پوشش آزمون در {className}</div>
        </div>
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 p-4">
          <BarChart2 className="w-5 h-5 text-amber-600 mb-2" />
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300">{selectedSummary.talentDistribution[0] ? formatPercent(selectedSummary.talentDistribution[0].percent) : '—'}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">سهم استعداد غالب کلاس</div>
        </div>
      </div>

      {selectedResults.length === 0 && schoolResults.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-6 text-center text-sm text-slate-500">برای این محدوده هنوز نتیجه‌ای ثبت نشده است.</div>
      ) : (
        <>
          {selectedResults.length === 0 && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4 text-xs text-amber-900 dark:text-amber-200">
              برای {className} نتیجه‌ای ثبت نشده است؛ پیشنهادهای مدرسه بر پایه کلاس‌های دارای نتیجه نمایش داده می‌شوند.
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">استعداد غالب هر دانش‌آموز</h4>
              {selectedSummary.talentDistribution.map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{GARDNER_TITLES[item.key as TalentKey].fa}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{formatPercent(item.percent)} ({toPersianDigits(item.count)} نفر)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${item.percent}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">میانگین حوزه‌های استعداد (از ۱۰)</h4>
              {selectedSummary.talentAverages.slice().reverse().map((item) => (
                <div key={item.key} className="flex items-center gap-3 text-xs">
                  <span className="w-28 text-slate-600 dark:text-slate-400">{GARDNER_TITLES[item.key].fa}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${item.average * 10}%`, backgroundColor: GARDNER_TITLES[item.key].color }} /></div>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{toPersianDigits(item.average)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">توزیع شخصیت</h4>
              {selectedSummary.personalityDistribution.map((item) => <div key={item.key} className="flex justify-between text-xs font-bold"><span>{item.key}</span><span className="text-indigo-600">{formatPercent(item.percent)} ({toPersianDigits(item.count)} نفر)</span></div>)}
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">سبک یادگیری</h4>
              {selectedSummary.learningDistribution.map((item) => <div key={item.key} className="flex justify-between text-xs font-bold"><span>{item.key}</span><span className="text-teal-600">{formatPercent(item.percent)} ({toPersianDigits(item.count)} نفر)</span></div>)}
            </div>
            <div className="rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/20 p-4 space-y-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">ترجیح یادگیری چهارگانه</h4>
              {selectedSummary.varkDistribution.map((item) => <div key={item.key} className="flex justify-between text-xs font-bold"><span>{VARK_LABELS[item.key] || item.key}</span><span className="text-cyan-700 dark:text-cyan-300">{formatPercent(item.percent)} ({toPersianDigits(item.count)} نفر)</span></div>)}
              <p className="text-[10px] text-slate-500">خودارزیابی آموزشی؛ این درصدها تشخیص یا آزمون استاندارد نیستند.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 border-t border-slate-100 dark:border-slate-800 pt-5">
            {[{ label: `اولویت‌های تقویتی ${className}`, summary: selectedSummary }, { label: 'اولویت‌های تقویتی کل مدرسه', summary: schoolSummary }].map((group) => (
              <div key={group.label} className="rounded-2xl border border-amber-200/70 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{group.label}</h4>
                {priorityItems(group.summary).map((item, index) => (
                  <div key={item.key} className="flex items-start gap-3 rounded-xl bg-white/70 dark:bg-slate-900/50 p-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0">{toPersianDigits(index + 1)}</span>
                    <div><div className="text-xs font-black text-slate-800 dark:text-slate-200">{GARDNER_TITLES[item.key].fa} - میانگین {toPersianDigits(item.average)} از ۱۰</div><p className="text-[11px] text-slate-500 mt-1">{TALENT_SUPPORT[item.key]}</p></div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <section className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">نتایج فردی دانش‌آموزان {className}</h4>
            <div className="max-h-72 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr><th className="p-3">دانش‌آموز</th><th className="p-3">ترجیح یادگیری</th><th className="p-3">کد رغبت هالند</th><th className="p-3">استعداد برجسته</th><th className="p-3">فعالیت فوق‌برنامه پیشنهادی</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedStudents.map((student) => {
                    const result = resultByStudent.get(student.id);
                    if (!result) return null;
                    return (
                      <tr key={student.id}>
                        <td className="p-3 font-bold">{student.firstName} {student.lastName}</td>
                        <td className="p-3">{VARK_LABELS[getLearningPreference(result)] || result.learningStyle}</td>
                        <td className="p-3 font-mono">{result.hollandCode}</td>
                        <td className="p-3">{GARDNER_TITLES[getDominantTalent(result.gardnerScores)].fa}</td>
                        <td className="p-3">{HOLLAND_ACTIVITIES[result.hollandCode.charAt(0)] || 'فعالیت متنوع بر اساس علاقه دانش‌آموز'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {recommendationMode !== 'extracurricular' && (
            <section className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">روش‌های یادگیری پیشنهادی</h4>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {[
                  { label: `پیشنهاد برای ${className}`, recommendations: selectedRecommendations },
                  { label: 'پیشنهاد برای کل مدرسه', recommendations: schoolRecommendations },
                ].map((group) => (
                  <div key={group.label} className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
                    <h5 className="text-xs font-black">{group.label}</h5>
                    {group.recommendations.methods.length ? group.recommendations.methods.map((method) => (
                      <div key={method.label} className="text-xs">
                        <strong>{method.label}{method.percent > 0 ? ` (${formatPercent(method.percent)})` : ''}:</strong> {method.detail}
                      </div>
                    )) : <p className="text-xs text-slate-500">برای این محدوده هنوز نتیجه آزمون کافی ثبت نشده است.</p>}
                    <p className="text-[10px] text-slate-500">
                      {group.recommendations.status.averageGrade === null ? 'نمره ثبت‌شده کافی نیست' : `میانگین نمره: ${toPersianDigits(group.recommendations.status.averageGrade.toFixed(1))} از ۲۰`}
                      {' · '}{group.recommendations.status.homeworkPercent === null ? 'اطلاعات تکلیف موجود نیست' : `انجام تکلیف: ${toPersianDigits(Math.round(group.recommendations.status.homeworkPercent))}٪`}
                      {' · '}{group.recommendations.status.participation === null ? 'مشارکت ثبت نشده' : `مشارکت: ${toPersianDigits(group.recommendations.status.participation.toFixed(1))} از ۵`}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {recommendationMode !== 'learning' && (
            <section className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">پیشنهاد کلاس‌های فوق‌برنامه بر اساس رغبت و استعداد</h4>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {[
                  { label: `برنامه پیشنهادی ${className}`, recommendations: selectedRecommendations },
                  { label: 'برنامه پیشنهادی کل مدرسه', recommendations: schoolRecommendations },
                ].map((group) => (
                  <div key={group.label} className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
                    <h5 className="text-xs font-black">{group.label}</h5>
                    {group.recommendations.activities.length ? group.recommendations.activities.map((activity) => <p key={activity} className="text-xs">• {activity}</p>) : <p className="text-xs text-slate-500">برای این محدوده هنوز نتیجه آزمون کافی ثبت نشده است.</p>}
                    <p className="text-[10px] text-slate-500">پیشنهاد اولیه برای برنامه‌ریزی؛ ظرفیت، علاقه مستقیم دانش‌آموزان و امکانات مدرسه نیز بررسی شود.</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
};
