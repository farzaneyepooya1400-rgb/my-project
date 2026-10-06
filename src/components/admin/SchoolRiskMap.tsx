import React, { useMemo, useState } from 'react';
import type {
  ExtracurricularActivity,
  SchoolClass,
  SchoolExpense,
  SchoolTuitionPayment,
  Student,
  StudentGrade,
} from '../../types';
import { toPersianDigits } from '../../lib/persianUtils';

interface SchoolRiskMapProps {
  classes: SchoolClass[];
  students: Student[];
  grades: StudentGrade[];
  extracurriculars: ExtracurricularActivity[];
  tuitionPayments: SchoolTuitionPayment[];
  schoolExpenses: SchoolExpense[];
}

type RiskStatus = 'green' | 'red' | 'white';
type RiskCell = { status: RiskStatus; label: string; detail: string };

const statusStyles: Record<RiskStatus, string> = {
  green: 'border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  red: 'border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200',
  white: 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
};

const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const toman = (value: number) => `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} تومان`;

const RiskBadge: React.FC<{ cell: RiskCell }> = ({ cell }) => (
  <div className={`min-w-32 border p-2.5 ${statusStyles[cell.status]}`}>
    <div className="flex items-center gap-1.5 text-[11px] font-black">
      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${cell.status === 'green' ? 'bg-emerald-600' : cell.status === 'red' ? 'bg-rose-600' : 'border border-slate-400 bg-white dark:border-slate-500 dark:bg-slate-900'}`} />
      {cell.status === 'green' ? 'کم‌ریسک' : cell.status === 'red' ? 'نیازمند پیگیری' : 'داده کافی نیست'}
    </div>
    <div className="mt-1 text-[10px] font-bold">{cell.label}</div>
    <div className="mt-1 text-[9px] leading-4 opacity-75">{cell.detail}</div>
  </div>
);

export const SchoolRiskMap: React.FC<SchoolRiskMapProps> = ({
  classes,
  students,
  grades,
  extracurriculars,
  tuitionPayments,
  schoolExpenses,
}) => {
  const availableYears = useMemo(() => [...new Set([
    '۱۴۰۵-۱۴۰۶',
    ...classes.map((schoolClass) => schoolClass.academicYear),
    ...tuitionPayments.map((payment) => payment.schoolYear),
    ...schoolExpenses.map((expense) => expense.schoolYear),
  ])].sort(), [classes, tuitionPayments, schoolExpenses]);
  const [schoolYear, setSchoolYear] = useState('۱۴۰۵-۱۴۰۶');
  const studentsByClass = useMemo(() => {
    const grouped = new Map<string, Student[]>();
    for (const student of students) {
      const roster = grouped.get(student.classId) ?? [];
      roster.push(student);
      grouped.set(student.classId, roster);
    }
    return grouped;
  }, [students]);

  const yearPayments = tuitionPayments.filter((payment) => payment.schoolYear === schoolYear);
  const yearExpenses = schoolExpenses.filter((expense) => expense.schoolYear === schoolYear);
  const schoolIncome = yearPayments.reduce((sum, payment) => sum + payment.amountToman, 0);
  const schoolExpense = yearExpenses.reduce((sum, expense) => sum + expense.amountToman, 0);
  const hasFinanceData = yearPayments.length + yearExpenses.length > 0;
  const schoolGrades = grades.filter((grade) => typeof grade.calculatedAverage === 'number' && Number.isFinite(grade.calculatedAverage));
  const schoolEducationAverage = mean(schoolGrades.map((grade) => grade.calculatedAverage as number));
  const classCulturalAverages = classes.flatMap((schoolClass) => {
    const score = mean(extracurriculars.filter((activity) => activity.classId === schoolClass.id).map((activity) => activity.monthlyAverage));
    return score === null ? [] : [score];
  });
  const schoolCulturalAverage = mean(classCulturalAverages);

  const schoolFinanceCell: RiskCell = !hasFinanceData
    ? { status: 'white', label: 'بدون تراکنش', detail: `سال ${schoolYear}` }
    : {
        status: schoolIncome - schoolExpense >= 0 ? 'green' : 'red',
        label: `خالص ${toman(schoolIncome - schoolExpense)}`,
        detail: `دریافت ${toman(schoolIncome)} · هزینه ${toman(schoolExpense)}`,
      };
  const schoolEducationCell: RiskCell = schoolEducationAverage === null
    ? { status: 'white', label: 'بدون نمره', detail: 'نمرهٔ نهایی ثبت نشده است' }
    : {
        status: schoolEducationAverage >= 12 ? 'green' : 'red',
        label: `میانگین ${toPersianDigits(schoolEducationAverage.toFixed(1))} از ۲۰`,
        detail: `${toPersianDigits(schoolGrades.length)} رکورد نمره · آستانهٔ قرمز کمتر از ۱۲`,
      };
  const schoolCulturalCell: RiskCell = schoolCulturalAverage === null
    ? { status: 'white', label: 'بدون فعالیت', detail: 'معدل پرورشی ثبت نشده است' }
    : {
        status: schoolCulturalAverage >= 3 ? 'green' : 'red',
        label: `میانگین ${toPersianDigits(schoolCulturalAverage.toFixed(1))} از ۵`,
        detail: `${toPersianDigits(classCulturalAverages.length)} کلاس دارای داده · آستانهٔ قرمز کمتر از ۳`,
      };

  const classRows = classes.map((schoolClass) => {
    const classStudents = studentsByClass.get(schoolClass.id) ?? [];
    const classStudentIds = new Set(classStudents.map((student) => student.id));
    const classPayments = yearPayments.filter((payment) => payment.studentId && classStudentIds.has(payment.studentId));
    const studentsWithRecordedPayment = new Set(classPayments.map((payment) => payment.studentId)).size;
    const coverage = classStudents.length ? studentsWithRecordedPayment / classStudents.length : null;
    const classIncome = classPayments.reduce((sum, payment) => sum + payment.amountToman, 0);
    const finance: RiskCell = coverage === null || classPayments.length === 0
      ? { status: 'white', label: 'پوشش ثبت نشده', detail: 'فقط پرداخت‌های ثبت‌شده؛ معیار بدهی نیست' }
      : {
          status: coverage >= 0.75 ? 'green' : 'red',
          label: `پوشش ${toPersianDigits(Math.round(coverage * 100))}٪`,
          detail: `${toPersianDigits(studentsWithRecordedPayment)} از ${toPersianDigits(classStudents.length)} دانش‌آموز · ${toman(classIncome)}`,
        };

    const classGrades = grades.filter((grade) => grade.classId === schoolClass.id && typeof grade.calculatedAverage === 'number' && Number.isFinite(grade.calculatedAverage));
    const academicAverage = mean(classGrades.map((grade) => grade.calculatedAverage as number));
    const education: RiskCell = academicAverage === null
      ? { status: 'white', label: 'بدون نمره', detail: 'نمرهٔ نهایی ثبت نشده است' }
      : {
          status: academicAverage >= 12 ? 'green' : 'red',
          label: `میانگین ${toPersianDigits(academicAverage.toFixed(1))} از ۲۰`,
          detail: `${toPersianDigits(classGrades.length)} رکورد نمره · آستانهٔ قرمز کمتر از ۱۲`,
        };

    const classActivities = extracurriculars.filter((activity) => activity.classId === schoolClass.id);
    const culturalAverage = mean(classActivities.map((activity) => activity.monthlyAverage));
    const culture: RiskCell = culturalAverage === null
      ? { status: 'white', label: 'بدون فعالیت', detail: 'معدل پرورشی ثبت نشده است' }
      : {
          status: culturalAverage >= 3 ? 'green' : 'red',
          label: `میانگین ${toPersianDigits(culturalAverage.toFixed(1))} از ۵`,
          detail: `${toPersianDigits(classActivities.length)} فعالیت · آستانهٔ قرمز کمتر از ۳`,
        };

    return { schoolClass, classStudents, finance, education, culture };
  });

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">نقشهٔ ریسک مدرسه</h2>
          <p className="mt-1 max-w-4xl text-xs leading-6 text-slate-500 dark:text-slate-400">نمای خلاصهٔ مالی، آموزشی و پرورشی برای کل مدرسه و هر کلاس. سفید یعنی دادهٔ کافی برای ارزیابی ثبت نشده است.</p>
        </div>
        <label className="w-full sm:w-52">
          <span className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">سال تحصیلی شاخص مالی</span>
          <select value={schoolYear} onChange={(event) => setSchoolYear(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
      </header>

      <div className="flex flex-wrap gap-3 text-[10px] font-bold">
        <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300"><i className="h-3 w-3 rounded-full bg-emerald-600" />سبز · کم‌ریسک</span>
        <span className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300"><i className="h-3 w-3 rounded-full bg-rose-600" />قرمز · نیازمند پیگیری</span>
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><i className="h-3 w-3 rounded-full border border-slate-400 bg-white dark:bg-slate-900" />سفید · داده کافی نیست</span>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[820px] text-right text-xs">
          <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="p-3">محدوده</th>
              <th className="p-3">مالی</th>
              <th className="p-3">آموزشی</th>
              <th className="p-3">پرورشی</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <tr className="bg-cyan-50/50 align-top dark:bg-cyan-950/15">
              <th className="p-3 text-right font-black text-slate-900 dark:text-white">کل مدرسه<span className="mt-1 block text-[9px] font-normal text-slate-500">{toPersianDigits(classes.length)} کلاس · {toPersianDigits(students.length)} دانش‌آموز</span></th>
              <td className="p-2"><RiskBadge cell={schoolFinanceCell} /></td>
              <td className="p-2"><RiskBadge cell={schoolEducationCell} /></td>
              <td className="p-2"><RiskBadge cell={schoolCulturalCell} /></td>
            </tr>
            {classRows.map(({ schoolClass, classStudents, finance, education, culture }) => (
              <tr key={schoolClass.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <th className="p-3 text-right font-bold text-slate-900 dark:text-white">{schoolClass.name}<span className="mt-1 block text-[9px] font-normal text-slate-500">{toPersianDigits(classStudents.length)} دانش‌آموز</span></th>
                <td className="p-2"><RiskBadge cell={finance} /></td>
                <td className="p-2"><RiskBadge cell={education} /></td>
                <td className="p-2"><RiskBadge cell={culture} /></td>
              </tr>
            ))}
            {classRows.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">کلاسی برای ارزیابی ثبت نشده است.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 border-t border-slate-100 pt-4 text-[10px] leading-5 text-slate-500 dark:border-slate-800 sm:grid-cols-3">
        <p><strong className="text-slate-700 dark:text-slate-300">مالی مدرسه:</strong> خالص درآمدهای ثبت‌شده منهای مخارج در سال انتخابی؛ کلاس: درصد دانش‌آموزان دارای پرداخت ثبت‌شده، نه ماندهٔ بدهی شهریه.</p>
        <p><strong className="text-slate-700 dark:text-slate-300">آموزشی:</strong> میانگین نمره‌های نهایی؛ کمتر از ۱۲ از ۲۰ قرمز و ۱۲ یا بیشتر سبز است.</p>
        <p><strong className="text-slate-700 dark:text-slate-300">پرورشی:</strong> میانگین فعالیت‌های کلاس؛ کمتر از ۳ از ۵ قرمز و ۳ یا بیشتر سبز است.</p>
      </div>
    </section>
  );
};