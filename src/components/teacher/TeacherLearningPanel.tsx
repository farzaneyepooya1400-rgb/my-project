import React, { useEffect, useMemo, useState } from 'react';
import { Brain, CheckCircle2, Info, Save, Users } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { toPersianDigits } from '../../lib/persianUtils';
import {
  calculateTeacherLearningProfile,
  calculateTeacherStudentMatch,
  TEACHER_ASSESSMENT_QUESTIONS,
} from '../../lib/teacherLearningMatch';

interface TeacherLearningPanelProps {
  teacherId?: string;
  classId?: string;
}

const SCALE_LABELS: Record<number, string> = {
  1: 'نیازمند تمرین زیاد',
  2: 'نیازمند تمرین',
  3: 'متوسط',
  4: 'توانمند',
  5: 'بسیار توانمند',
};

export const TeacherLearningPanel: React.FC<TeacherLearningPanelProps> = ({ teacherId, classId }) => {
  const {
    teachers,
    students,
    assignments,
    psychResults,
    teacherLearningProfiles,
    saveTeacherLearningProfile,
  } = useSchool();
  const profile = teacherLearningProfiles.find((item) => item.teacherId === teacherId);
  const [answers, setAnswers] = useState<Record<string, number>>(profile?.answers || {});
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setAnswers(profile?.answers || {});
  }, [profile]);

  const classAssignments = assignments.filter((assignment) => assignment.classId === classId);
  const assignedTeacherIds = [...new Set(classAssignments.map((assignment) => assignment.teacherId))];
  const classTeachers = assignedTeacherIds
    .map((id) => ({
      teacher: teachers.find((item) => item.id === id),
      profile: teacherLearningProfiles.find((item) => item.teacherId === id),
      subjects: classAssignments.filter((assignment) => assignment.teacherId === id).map((assignment) => assignment.subject),
    }))
    .filter((entry): entry is typeof entry & { teacher: NonNullable<typeof entry.teacher>; profile: NonNullable<typeof entry.profile> } => Boolean(entry.teacher && entry.profile));
  const teachersMissingAssessment = assignedTeacherIds.length - classTeachers.length;
  const classStudents = students.filter((student) => student.classId === classId);
  const resultByStudent = useMemo(() => new Map(psychResults.map((result) => [result.studentId, result])), [psychResults]);
  const completedQuestionCount = TEACHER_ASSESSMENT_QUESTIONS.filter((question) => answers[question.id] >= 1 && answers[question.id] <= 5).length;
  const allQuestionsAnswered = completedQuestionCount === TEACHER_ASSESSMENT_QUESTIONS.length;

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!teacherId || !allQuestionsAnswered) return;
    setIsSaving(true);
    setFeedback(null);
    const result = await saveTeacherLearningProfile(calculateTeacherLearningProfile(teacherId, answers));
    setIsSaving(false);
    setFeedback(result.success
      ? { success: true, message: 'خودارزیابی شما ثبت شد؛ پیشنهادهای کلاس بر اساس آخرین پاسخ‌ها به‌روزرسانی می‌شوند.' }
      : { success: false, message: result.message || 'ثبت پاسخ‌ها انجام نشد. دوباره تلاش کنید.' });
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
        <header className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">خودارزیابی توانمندی تدریس و مدیریت کلاس</h3>
            <p className="text-xs text-slate-500 mt-1">هر مورد را بر اساس توانمندی فعلی خود از ۱ تا ۵ ارزیابی کنید. این خودارزیابی برای پیشنهاد آموزشی است، نه ارزیابی عملکرد یا رتبه‌بندی معلمان.</p>
          </div>
        </header>

        {!teacherId ? (
          <p className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-4 text-xs text-amber-800 dark:text-amber-200">حساب معلم به پرونده‌ی پرسنلی پیوند نخورده است؛ ثبت پرسشنامه ممکن نیست.</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {([
              { id: 'teachingSkills', title: 'توانمندی در شیوه‌های تدریس' },
              { id: 'classroomApproach', title: 'رویکرد مدیریت و تعامل کلاسی' },
            ] as const).map((section) => (
              <fieldset key={section.id} className="space-y-3">
                <legend className="text-sm font-black text-slate-800 dark:text-slate-200 mb-3">{section.title}</legend>
                {TEACHER_ASSESSMENT_QUESTIONS.filter((question) => question.section === section.id).map((question, index) => (
                  <div key={question.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                    <p className="text-xs font-medium leading-6 text-slate-800 dark:text-slate-200">{toPersianDigits(index + 1)}. {question.text}</p>
                    <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={question.text}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={answers[question.id] === value}
                          title={SCALE_LABELS[value]}
                          onClick={() => setAnswers((previous) => ({ ...previous, [question.id]: value }))}
                          className={`w-10 h-10 rounded-lg border text-xs font-bold transition ${answers[question.id] === value
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-teal-500'}`}
                        >
                          {toPersianDigits(value)}
                        </button>
                      ))}
                      {answers[question.id] && <span className="text-[10px] text-slate-500">{SCALE_LABELS[answers[question.id]]}</span>}
                    </div>
                  </div>
                ))}
              </fieldset>
            ))}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <span className="text-xs text-slate-500">پاسخ‌داده‌شده: {toPersianDigits(completedQuestionCount)} از {toPersianDigits(TEACHER_ASSESSMENT_QUESTIONS.length)}</span>
              <button type="submit" disabled={isSaving || !allQuestionsAnswered} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50">
                {isSaving ? <span>در حال ثبت...</span> : <><Save className="w-4 h-4" /><span>{profile ? 'به‌روزرسانی خودارزیابی' : 'ثبت خودارزیابی'}</span></>}
              </button>
            </div>
            {feedback && <p role="status" className={`text-xs font-bold ${feedback.success ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>{feedback.message}</p>}
          </form>
        )}
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
        <header className="flex items-start gap-3">
          <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">پیشنهاد تناسب دانش‌آموز و معلم</h3>
            <p className="text-xs text-slate-500 mt-1">رتبه‌بندی فقط بین معلمان تخصیص‌یافته به کلاس جاری است و هیچ تخصیصی را تغییر نمی‌دهد.</p>
            {(classTeachers.some((entry) => entry.profile.isDemo) || classStudents.some((student) => resultByStudent.get(student.id)?.isDemo)) && (
              <p className="mt-2 text-[11px] font-bold text-amber-700 dark:text-amber-300">پروفایل‌ها یا نتایج دارای نشان «نمونه» ساختگی‌اند و برای آزمایش گزارش استفاده می‌شوند.</p>
            )}
          </div>
        </header>

        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4 flex gap-3 text-xs text-blue-900 dark:text-blue-200">
          <Info className="w-4 h-4 shrink-0" />
          <p>امتیاز پیشنهادی: ۷۲٪ هم‌خوانی ترجیح یادگیری و توانمندی خوداظهاری معلم + ۲۸٪ تناسب رویکرد مدیریت کلاس با نشانه‌های آزمون. نتیجه صرفاً برای گفت‌وگو و تصمیم‌گیری انسانی است و معیار قطعی کیفیت تدریس نیست.</p>
        </div>

        {!classId ? (
          <p className="text-xs text-slate-500">برای دیدن پیشنهادها، ابتدا یک کلاس و درس را از فهرست بالای پنل انتخاب کنید.</p>
        ) : classStudents.length === 0 ? (
          <p className="text-xs text-slate-500">در کلاس جاری دانش‌آموزی ثبت نشده است.</p>
        ) : (
          <>
            {teachersMissingAssessment > 0 && <p className="text-xs text-amber-700 dark:text-amber-300">پروفایل خودارزیابی {toPersianDigits(teachersMissingAssessment)} معلم تخصیص‌یافته هنوز تکمیل نشده؛ پس از تکمیل، در مقایسه وارد می‌شوند.</p>}
            {classTeachers.length === 0 ? (
              <p className="text-xs text-slate-500">برای این کلاس هنوز هیچ معلم تخصیص‌یافته‌ای خودارزیابی را کامل نکرده است.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full min-w-[760px] text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <tr><th className="p-3">دانش‌آموز</th><th className="p-3">پیشنهاد اول</th><th className="p-3">تناسب روش تدریس</th><th className="p-3">تناسب مدیریت کلاس</th><th className="p-3">معلمان دیگر کلاس</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {classStudents.map((student) => {
                      const studentResult = resultByStudent.get(student.id);
                      const ranked = studentResult
                        ? classTeachers.map((entry) => ({
                            ...entry,
                            match: calculateTeacherStudentMatch(studentResult, entry.profile),
                          })).sort((first, second) => second.match.score - first.match.score)
                        : [];
                      const best = ranked[0];
                      return (
                        <tr key={student.id} className="align-top">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{student.firstName} {student.lastName}</td>
                          {!studentResult ? (
                            <td colSpan={4} className="p-3 text-amber-700 dark:text-amber-300">آزمون دانش‌آموز تکمیل نشده است؛ تطبیق قابل محاسبه نیست.</td>
                          ) : !best ? (
                            <td colSpan={4} className="p-3 text-slate-500">معلمی با خودارزیابی کامل برای این کلاس موجود نیست.</td>
                          ) : (
                            <>
                              <td className="p-3"><strong>{best.teacher.fullName}</strong>{best.profile.isDemo && <span className="mr-1 text-[10px] text-amber-700 dark:text-amber-300">(نمونه)</span>}<span className="block mt-1 text-slate-500">{best.subjects.join('، ')}</span><strong className="block mt-1 text-teal-700 dark:text-teal-300">تناسب کلی {toPersianDigits(best.match.score)}٪</strong></td>
                              <td className="p-3">{toPersianDigits(best.match.teachingFit)}٪</td>
                              <td className="p-3">{toPersianDigits(best.match.classroomFit)}٪</td>
                              <td className="p-3 space-y-2">{ranked.slice(1, 3).map((entry) => <div key={entry.teacher.id}><strong>{entry.teacher.fullName}</strong>{entry.profile.isDemo && <span className="mr-1 text-[10px] text-amber-700 dark:text-amber-300">(نمونه)</span>}<span className="text-slate-500"> · {entry.subjects.join('، ')} · {toPersianDigits(entry.match.score)}٪</span></div>)}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
