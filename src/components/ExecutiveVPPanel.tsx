import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpLeft, Banknote, ChartNoAxesCombined, ChevronDown, ChevronUp, Plus, Search, Trash2 } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import type { SchoolClass, SchoolPaymentMethod } from '../types';
import { formatShamsiShort, toPersianDigits } from '../lib/persianUtils';

const months = ['مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'];
const persianCalendarMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const schoolYears = ['۱۴۰۴-۱۴۰۵', '۱۴۰۵-۱۴۰۶', '۱۴۰۶-۱۴۰۷', '۱۴۰۷-۱۴۰۸'];
const dateYears = Array.from({ length: 10 }, (_, index) => 1402 + index);
const paymentMethods: { value: SchoolPaymentMethod; label: string }[] = [
  { value: 'card_reader', label: 'کارت‌خوان' },
  { value: 'transfer', label: 'کارت‌به‌کارت / واریز' },
  { value: 'cash', label: 'نقدی' },
  { value: 'check', label: 'چک' },
];
const expenseCategories = ['حقوق و مزایا', 'آب، برق و گاز', 'تعمیر و نگهداری', 'لوازم آموزشی', 'تجهیزات و فناوری', 'نظافت و بهداشت', 'حمل‌ونقل', 'فعالیت و مراسم', 'اجاره و خدمات', 'سایر'];
const incomeCategories = ['شهریه ماهانه', 'قسط شهریه', 'هزینه ثبت‌نام', 'سرویس مدرسه', 'غذا و میان‌وعده', 'کمک و مشارکت', 'سایر درآمد'];

const formatToman = (amount: number) => `${new Intl.NumberFormat('fa-IR').format(Math.round(amount))} تومان`;
const formatCompactToman = (amount: number) => new Intl.NumberFormat('fa-IR', { notation: 'compact', maximumFractionDigits: 1 }).format(amount);
type PersianDateParts = { year: number; month: number; day: number };
const persianDateFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
  year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC',
});
const getPersianDateParts = (date: Date): PersianDateParts => {
  const parts = Object.fromEntries(persianDateFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
};
const getPersianMonthLength = (year: number, month: number) => {
  const start = Date.UTC(year + 621, 2, 18);
  for (let offset = 0; offset < 400; offset += 1) {
    const candidate = new Date(start + offset * 86_400_000);
    const parts = getPersianDateParts(candidate);
    if (parts.year === year && parts.month === month && parts.day === 1) {
      let length = 1;
      while (length < 32) {
        const nextParts = getPersianDateParts(new Date(candidate.getTime() + length * 86_400_000));
        if (nextParts.year !== year || nextParts.month !== month) break;
        length += 1;
      }
      return length;
    }
  }
  return month <= 6 ? 31 : month <= 11 ? 30 : 29;
};
const getIsoDateFromPersian = ({ year, month, day }: PersianDateParts) => {
  const start = Date.UTC(year + 621, 2, 18);
  for (let offset = 0; offset < 400; offset += 1) {
    const candidate = new Date(start + offset * 86_400_000);
    const parts = getPersianDateParts(candidate);
    if (parts.year === year && parts.month === month && parts.day === day) return candidate.toISOString().slice(0, 10);
  }
  return '';
};
const getAcademicMonth = (persianMonth: number) => months[(persianMonth + 5) % 12];
const getInitialPersianDate = () => getPersianDateParts(new Date());
const formatDateParts = ({ year, month, day }: PersianDateParts) => `${toPersianDigits(year)}/${toPersianDigits(String(month).padStart(2, '0'))}/${toPersianDigits(String(day).padStart(2, '0'))}`;
const updatePersianDate = (date: PersianDateParts, field: keyof PersianDateParts, value: number): PersianDateParts => {
  const updated = { ...date, [field]: value };
  updated.day = Math.min(updated.day, getPersianMonthLength(updated.year, updated.month));
  return updated;
};
const findStudentClass = (student: { classId: string }, classes: SchoolClass[]) => classes.find((schoolClass) => schoolClass.id === student.classId);

export const ExecutiveVPPanel: React.FC = () => {
  const {
    currentUser,
    students,
    classes,
    grades,
    teachers,
    attendanceRecords,
    tuitionPayments,
    schoolExpenses,
    addTuitionPayment,
    deleteTuitionPayment,
    addSchoolExpense,
    deleteSchoolExpense,
    addGrade,
    addClass,
  } = useSchool();
  const [schoolYear, setSchoolYear] = useState('۱۴۰۵-۱۴۰۶');
  const [activeForm, setActiveForm] = useState<'income' | 'expense'>('income');
  const [studentId, setStudentId] = useState('');
  const [payerName, setPayerName] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeCategory, setIncomeCategory] = useState(incomeCategories[0]);
  const [incomeDate, setIncomeDate] = useState<PersianDateParts>(getInitialPersianDate);
  const [incomeMethod, setIncomeMethod] = useState<SchoolPaymentMethod>('card_reader');
  const [incomeReceipt, setIncomeReceipt] = useState('');
  const [incomeNote, setIncomeNote] = useState('');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(expenseCategories[0]);
  const [expenseDate, setExpenseDate] = useState<PersianDateParts>(getInitialPersianDate);
  const [expenseMethod, setExpenseMethod] = useState<SchoolPaymentMethod>('transfer');
  const [expenseReceipt, setExpenseReceipt] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [attendanceDateParts, setAttendanceDateParts] = useState<PersianDateParts>(getInitialPersianDate);
  const attendanceDate = getIsoDateFromPersian(attendanceDateParts);
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeOrder, setNewGradeOrder] = useState(1);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGradeId, setNewClassGradeId] = useState('');
  const [newClassYear, setNewClassYear] = useState('۱۴۰۵-۱۴۰۶');
  const [isSavingStructure, setIsSavingStructure] = useState(false);

  const yearPayments = useMemo(() => tuitionPayments.filter((payment) => payment.schoolYear === schoolYear), [tuitionPayments, schoolYear]);
  const yearExpenses = useMemo(() => schoolExpenses.filter((expense) => expense.schoolYear === schoolYear), [schoolExpenses, schoolYear]);
  const monthlyTotals = useMemo(() => months.map((month) => ({
    month,
    income: yearPayments.filter((payment) => payment.month === month).reduce((sum, payment) => sum + payment.amountToman, 0),
    expense: yearExpenses.filter((expense) => expense.month === month).reduce((sum, expense) => sum + expense.amountToman, 0),
  })), [yearPayments, yearExpenses]);
  const totalIncome = yearPayments.reduce((sum, payment) => sum + payment.amountToman, 0);
  const totalExpense = yearExpenses.reduce((sum, expense) => sum + expense.amountToman, 0);
  const largestMonthValue = Math.max(1, ...monthlyTotals.flatMap((item) => [item.income, item.expense]));
  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
  const normalizedStudentSearch = studentSearch.trim().toLocaleLowerCase();
  const classStudentStats = students
    .filter((student) => selectedClassId === 'all' || student.classId === selectedClassId)
    .filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLocaleLowerCase();
      return !normalizedStudentSearch || fullName.includes(normalizedStudentSearch) || student.studentCode.toLocaleLowerCase().includes(normalizedStudentSearch);
    })
    .map((student) => {
      const payments = yearPayments.filter((payment) => payment.studentId === student.id);
      return {
        student,
        schoolClass: findStudentClass(student, classes),
        payments,
        total: payments.reduce((sum, payment) => sum + payment.amountToman, 0),
        latestDate: payments.reduce((latest, payment) => payment.paidAt > latest ? payment.paidAt : latest, ''),
      };
    })
    .sort((first, second) => `${first.student.firstName} ${first.student.lastName}`.localeCompare(`${second.student.firstName} ${second.student.lastName}`, 'fa'));
  const classPaymentTotal = classStudentStats.reduce((sum, item) => sum + item.total, 0);
  const studentsWithPayments = classStudentStats.filter((item) => item.payments.length > 0).length;
  const classIncomeSummaries = classes
    .filter((schoolClass) => selectedClassId === 'all' || schoolClass.id === selectedClassId)
    .map((schoolClass) => {
      const classStudents = students.filter((student) => student.classId === schoolClass.id);
      const payments = yearPayments.filter((payment) => classStudents.some((student) => student.id === payment.studentId));
      return {
        schoolClass,
        studentCount: classStudents.length,
        paidStudentCount: new Set(payments.map((payment) => payment.studentId)).size,
        total: payments.reduce((sum, payment) => sum + payment.amountToman, 0),
      };
    })
    .sort((first, second) => first.schoolClass.name.localeCompare(second.schoolClass.name, 'fa'));
  const transactions = [
    ...yearPayments.map((payment) => ({
      id: payment.id,
      kind: 'income' as const,
      title: payment.studentId
        ? `${studentById.get(payment.studentId)?.firstName || ''} ${studentById.get(payment.studentId)?.lastName || ''}`.trim() || payment.payerName || 'پرداخت دانش‌آموز'
        : payment.payerName || 'درآمد مدرسه',
      category: payment.category,
      amount: payment.amountToman,
      month: payment.month,
      date: payment.paidAt,
      method: paymentMethods.find((method) => method.value === payment.paymentMethod)?.label || payment.paymentMethod,
      remove: () => deleteTuitionPayment(payment.id),
    })),
    ...yearExpenses.map((expense) => ({
      id: expense.id,
      kind: 'expense' as const,
      title: expense.title,
      category: expense.category,
      amount: expense.amountToman,
      month: expense.month,
      date: expense.paidAt,
      method: paymentMethods.find((method) => method.value === expense.paymentMethod)?.label || expense.paymentMethod,
      remove: () => deleteSchoolExpense(expense.id),
    })),
  ].sort((first, second) => second.date.localeCompare(first.date)).slice(0, 12);

  const handleAddIncome = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    const selectedStudent = students.find((student) => student.id === studentId);
    const result = await addTuitionPayment({
      studentId: studentId || undefined,
      payerName: studentId && selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : payerName,
      amountToman: Number(incomeAmount),
      category: incomeCategory,
      month: getAcademicMonth(incomeDate.month),
      schoolYear,
      paidAt: getIsoDateFromPersian(incomeDate),
      paymentMethod: incomeMethod,
      receiptCode: incomeReceipt,
      note: incomeNote,
    });
    setIsSaving(false);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.message || 'ثبت دریافت انجام نشد.' });
      return;
    }
    setIncomeAmount('');
    setIncomeReceipt('');
    setIncomeNote('');
    setFeedback({ type: 'success', message: 'دریافت با موفقیت ثبت شد.' });
  };

  const handleAddExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    const result = await addSchoolExpense({
      title: expenseTitle,
      category: expenseCategory,
      amountToman: Number(expenseAmount),
      month: getAcademicMonth(expenseDate.month),
      schoolYear,
      paidAt: getIsoDateFromPersian(expenseDate),
      paymentMethod: expenseMethod,
      receiptCode: expenseReceipt,
      note: expenseNote,
    });
    setIsSaving(false);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.message || 'ثبت هزینه انجام نشد.' });
      return;
    }
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseReceipt('');
    setExpenseNote('');
    setFeedback({ type: 'success', message: 'هزینه با موفقیت ثبت شد.' });
  };

  const handleDelete = async (title: string, remove: () => Promise<{ success: boolean; message?: string }>) => {
    if (!window.confirm(`رکورد «${title}» حذف شود؟`)) return;
    const result = await remove();
    setFeedback(result.success
      ? { type: 'success', message: 'رکورد حذف شد.' }
      : { type: 'error', message: result.message || 'حذف رکورد انجام نشد.' });
  };

  const handleAddGrade = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingStructure(true);
    const result = await addGrade(newGradeName, newGradeOrder);
    setIsSavingStructure(false);
    setFeedback(result.success
      ? { type: 'success', message: 'پایهٔ تحصیلی ثبت شد.' }
      : { type: 'error', message: result.message || 'ثبت پایه انجام نشد.' });
    if (result.success) {
      setNewGradeName('');
      setNewGradeOrder(Math.max(0, ...grades.map((grade) => grade.order)) + 2);
    }
  };

  const handleAddClass = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingStructure(true);
    const result = await addClass(newClassName, newClassGradeId, newClassYear);
    setIsSavingStructure(false);
    setFeedback(result.success
      ? { type: 'success', message: 'کلاس ثبت شد.' }
      : { type: 'error', message: result.message || 'ثبت کلاس انجام نشد.' });
    if (result.success) setNewClassName('');
  };

  const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
  const labelClass = 'mb-1.5 block text-[11px] font-bold text-slate-700 dark:text-slate-300';

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300">مدیریت اجرایی و مالی</p>
          <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">مالی مدرسه</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">ثبت دریافت‌ها و هزینه‌ها، بدون ورود دوبارهٔ اطلاعات ماه و سال برای هر ردیف</p>
        </div>
        <label className="w-full sm:w-52">
          <span className={labelClass}>سال تحصیلی گزارش</span>
          <select value={schoolYear} onChange={(event) => setSchoolYear(event.target.value)} className={inputClass}>
            {schoolYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
      </header>

      <section className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="mb-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">ساختار پایه‌ها و کلاس‌ها</h3>
          <p className="mt-1 text-[10px] text-slate-500">ثبت و مشاهدهٔ ساختار آموزشی مدرسه</p>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            <form onSubmit={handleAddGrade} className="space-y-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">ثبت پایهٔ تحصیلی</h4>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto]">
                <input required value={newGradeName} onChange={(event) => setNewGradeName(event.target.value)} placeholder="نام پایه، مانند پایه هفتم" className={inputClass} />
                <input required type="number" min="1" value={newGradeOrder} onChange={(event) => setNewGradeOrder(Number(event.target.value))} aria-label="ترتیب پایه" className={inputClass} />
                <button type="submit" disabled={isSavingStructure} className="rounded-lg bg-cyan-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-800 disabled:opacity-50">{isSavingStructure ? 'در حال ثبت...' : 'ثبت پایه'}</button>
              </div>
            </form>
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-300">پایه‌های ثبت‌شده</h4>
              {grades.length ? grades.slice().sort((first, second) => first.order - second.order).map((grade) => <div key={grade.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-xs last:border-0 dark:border-slate-800"><span className="font-bold">{grade.name}</span><span className="text-slate-500">ترتیب {toPersianDigits(grade.order)}</span></div>) : <p className="py-3 text-xs text-slate-500">پایه‌ای ثبت نشده است.</p>}
            </div>
          </div>
          <div className="space-y-4">
            <form onSubmit={handleAddClass} className="space-y-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">ثبت کلاس</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                <input required value={newClassName} onChange={(event) => setNewClassName(event.target.value)} placeholder="نام کلاس" className={inputClass} />
                <select required value={newClassGradeId} onChange={(event) => setNewClassGradeId(event.target.value)} className={inputClass}>
                  <option value="">انتخاب پایه</option>
                  {grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
                </select>
                <input required value={newClassYear} onChange={(event) => setNewClassYear(event.target.value)} placeholder="سال تحصیلی" className={inputClass} />
                <button type="submit" disabled={isSavingStructure || grades.length === 0} className="rounded-lg bg-cyan-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-800 disabled:opacity-50">{isSavingStructure ? 'در حال ثبت...' : 'ثبت کلاس'}</button>
              </div>
            </form>
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-300">کلاس‌های ثبت‌شده</h4>
              {classes.length ? classes.map((schoolClass) => <div key={schoolClass.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 text-xs last:border-0 dark:border-slate-800"><span className="font-bold">{schoolClass.name}</span><span className="text-left text-slate-500">{grades.find((grade) => grade.id === schoolClass.gradeId)?.name || 'پایه نامشخص'} · {schoolClass.academicYear}</span></div>) : <p className="py-3 text-xs text-slate-500">کلاسی ثبت نشده است.</p>}
            </div>
          </div>
        </div>
        {feedback && <p role={feedback.type === 'error' ? 'alert' : 'status'} className={`mt-3 text-xs font-bold ${feedback.type === 'error' ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{feedback.message}</p>}
      </section>

      <section className="space-y-4 border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">حضور روزانه، تکالیف و انضباط</h3>
            <p className="mt-1 text-[10px] text-slate-500">ثبت‌های دبیران و معلمان برای تاریخ انتخاب‌شده</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:w-[360px]">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">سال شمسی<select value={attendanceDateParts.year} onChange={(event) => setAttendanceDateParts((date) => updatePersianDate(date, 'year', Number(event.target.value)))} className={`${inputClass} mt-1`}>{dateYears.map((year) => <option key={year} value={year}>{toPersianDigits(year)}</option>)}</select></label>
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">ماه شمسی<select value={attendanceDateParts.month} onChange={(event) => setAttendanceDateParts((date) => updatePersianDate(date, 'month', Number(event.target.value)))} className={`${inputClass} mt-1`}>{persianCalendarMonths.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">روز شمسی<select value={attendanceDateParts.day} onChange={(event) => setAttendanceDateParts((date) => updatePersianDate(date, 'day', Number(event.target.value)))} className={`${inputClass} mt-1`}>{Array.from({ length: getPersianMonthLength(attendanceDateParts.year, attendanceDateParts.month) }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{toPersianDigits(day)}</option>)}</select></label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <tr><th className="p-3">دانش‌آموز</th><th className="p-3">کلاس</th><th className="p-3">درس / ثبت‌کننده</th><th className="p-3">حضور</th><th className="p-3">تکلیف</th><th className="p-3">انضباط و یادداشت</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {attendanceRecords.filter((record) => record.date === attendanceDate).sort((first, second) => second.updatedAt.localeCompare(first.updatedAt)).map((record) => {
                const student = studentById.get(record.studentId);
                const schoolClass = findStudentClass({ classId: record.classId }, classes);
                const statusLabel = record.status === 'present' ? 'حاضر' : record.status === 'absent' ? 'غایب' : record.status === 'late' ? 'تأخیر' : 'ثبت نشده';
                const homeworkLabel = record.homeworkStatus === 'done' ? 'انجام شده' : record.homeworkStatus === 'partial' ? 'ناقص' : record.homeworkStatus === 'missing' ? 'انجام نشده' : 'ثبت نشده';
                const disciplineLabel = record.disciplineStatus === 'positive' ? 'مثبت' : record.disciplineStatus === 'neutral' ? 'عادی' : record.disciplineStatus === 'needs_attention' ? 'نیازمند پیگیری' : 'ثبت نشده';
                return <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40"><td className="p-3 font-bold">{student ? `${student.firstName} ${student.lastName}` : 'دانش‌آموز حذف‌شده'}</td><td className="p-3">{schoolClass?.name || 'نامشخص'}</td><td className="p-3">{record.subject || '—'}{record.teacherId && <span className="mt-1 block text-[10px] text-slate-500">{teachers.find((teacher) => teacher.id === record.teacherId)?.fullName || 'معلم'}</span>}</td><td className="p-3">{statusLabel}</td><td className="p-3">{homeworkLabel}</td><td className="p-3">{disciplineLabel}{record.disciplineNote && <span className="mt-1 block text-slate-500">{record.disciplineNote}</span>}</td></tr>;
              })}
              {attendanceRecords.every((record) => record.date !== attendanceDate) && <tr><td colSpan={6} className="p-8 text-center text-slate-500">برای این تاریخ موردی ثبت نشده است.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="border-r-4 border-emerald-600 bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200"><ArrowDownLeft className="h-4 w-4" /> مجموع درآمد سال</div>
          <strong className="mt-2 block text-lg text-emerald-950 dark:text-white">{formatToman(totalIncome)}</strong>
          <span className="mt-1 block text-[10px] text-emerald-800/70 dark:text-emerald-200/70">{toPersianDigits(yearPayments.length)} دریافت ثبت‌شده</span>
        </div>
        <div className="border-r-4 border-rose-600 bg-rose-50 p-4 dark:bg-rose-950/30">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-900 dark:text-rose-200"><ArrowUpLeft className="h-4 w-4" /> مجموع مخارج سال</div>
          <strong className="mt-2 block text-lg text-rose-950 dark:text-white">{formatToman(totalExpense)}</strong>
          <span className="mt-1 block text-[10px] text-rose-800/70 dark:text-rose-200/70">{toPersianDigits(yearExpenses.length)} هزینهٔ ثبت‌شده</span>
        </div>
        <div className="border-r-4 border-cyan-700 bg-cyan-50 p-4 dark:bg-cyan-950/30">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-900 dark:text-cyan-200"><Banknote className="h-4 w-4" /> ماندهٔ خالص سال</div>
          <strong className="mt-2 block text-lg text-cyan-950 dark:text-white">{formatToman(totalIncome - totalExpense)}</strong>
          <span className="mt-1 block text-[10px] text-cyan-800/70 dark:text-cyan-200/70">درآمد منهای مخارج ثبت‌شده</span>
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><ChartNoAxesCombined className="h-4 w-4 text-cyan-700" /> روند ماهانهٔ درآمد و مخارج</h3>
            <p className="mt-1 text-[10px] text-slate-500">مبالغ هر ماه بر اساس تاریخ ثبت‌شده در سال تحصیلی انتخاب‌شده</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300"><i className="h-2.5 w-2.5 bg-emerald-600" /> درآمد</span>
            <span className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300"><i className="h-2.5 w-2.5 bg-rose-600" /> مخارج</span>
          </div>
        </div>
        <div className="grid min-h-56 grid-cols-12 gap-1 border-b border-slate-200 px-1 dark:border-slate-700 sm:gap-2">
          {monthlyTotals.map((item) => (
            <div key={item.month} className="flex min-w-0 flex-col items-center justify-end">
              <div className="mb-2 flex h-40 w-full items-end justify-center gap-0.5 sm:gap-1">
                <div
                  title={`درآمد ${item.month}: ${formatToman(item.income)}`}
                  aria-label={`درآمد ${item.month}: ${formatToman(item.income)}`}
                  className="min-h-0.5 w-[42%] max-w-5 bg-emerald-600 transition-[height]"
                  style={{ height: `${item.income ? Math.max(2, (item.income / largestMonthValue) * 100) : 1}%` }}
                />
                <div
                  title={`مخارج ${item.month}: ${formatToman(item.expense)}`}
                  aria-label={`مخارج ${item.month}: ${formatToman(item.expense)}`}
                  className="min-h-0.5 w-[42%] max-w-5 bg-rose-600 transition-[height]"
                  style={{ height: `${item.expense ? Math.max(2, (item.expense / largestMonthValue) * 100) : 1}%` }}
                />
              </div>
              <span className="mb-2 text-[9px] text-slate-500 sm:text-[10px]">{item.month}</span>
              <span className="mb-2 hidden text-[8px] text-slate-400 sm:block">{formatCompactToman(item.income - item.expense)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">آمار دریافت به تفکیک کلاس و دانش‌آموز</h3>
            <p className="mt-1 text-[10px] leading-5 text-slate-500">جمع پرداخت‌های ثبت‌شده برای سال {schoolYear}؛ نبود پرداخت ثبت‌شده به معنی بدهکاری قطعی نیست.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">جستجوی نام یا کد دانش‌آموز</span>
              <input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} type="search" className={`${inputClass} pr-9 sm:w-60`} placeholder="نام یا کد دانش‌آموزی" />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>
            <select aria-label="فیلتر آمار مالی کلاس" value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)} className={`${inputClass} sm:w-52`}>
              <option value="all">همهٔ کلاس‌ها</option>
              {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="bg-slate-50 p-3 dark:bg-slate-800/60">
            <span className="text-[10px] text-slate-500">دانش‌آموزان در محدودهٔ جست‌وجو</span>
            <strong className="mt-1 block text-lg text-slate-900 dark:text-white">{toPersianDigits(classStudentStats.length)}</strong>
          </div>
          <div className="bg-emerald-50 p-3 dark:bg-emerald-950/30">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300">دارای دریافت ثبت‌شده</span>
            <strong className="mt-1 block text-lg text-emerald-900 dark:text-white">{toPersianDigits(studentsWithPayments)}</strong>
          </div>
          <div className="bg-cyan-50 p-3 dark:bg-cyan-950/30">
            <span className="text-[10px] text-cyan-800 dark:text-cyan-300">جمع دریافت دانش‌آموزی در فیلتر</span>
            <strong className="mt-1 block text-sm text-cyan-950 dark:text-white">{formatToman(classPaymentTotal)}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-3">کلاس</th>
                <th className="p-3">تعداد دانش‌آموز</th>
                <th className="p-3">دارای پرداخت</th>
                <th className="p-3">جمع دریافت ثبت‌شده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classIncomeSummaries.map(({ schoolClass, studentCount, paidStudentCount, total }) => (
                <tr key={schoolClass.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{schoolClass.name}</td>
                  <td className="p-3">{toPersianDigits(studentCount)}</td>
                  <td className="p-3">{toPersianDigits(paidStudentCount)}</td>
                  <td className="p-3 font-bold text-emerald-800 dark:text-emerald-300">{formatToman(total)}</td>
                </tr>
              ))}
              {classIncomeSummaries.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-500">کلاسی برای نمایش ثبت نشده است.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto border-t border-slate-100 pt-3 dark:border-slate-800">
          <table className="w-full min-w-[760px] text-right text-xs">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-3">دانش‌آموز</th>
                <th className="p-3">کلاس</th>
                <th className="p-3">تعداد دریافت</th>
                <th className="p-3">جمع پرداخت ثبت‌شده</th>
                <th className="p-3">آخرین دریافت</th>
                <th className="p-3">ریز اقساط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classStudentStats.map(({ student, schoolClass, payments, total, latestDate }) => {
                const isExpanded = expandedStudentId === student.id;
                return (
                  <React.Fragment key={student.id}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{student.firstName} {student.lastName}<span className="mt-1 block font-mono text-[10px] font-normal text-slate-500" dir="ltr">{student.studentCode}</span></td>
                      <td className="p-3">{schoolClass?.name || 'نامشخص'}</td>
                      <td className="p-3">{toPersianDigits(payments.length)}</td>
                      <td className="p-3 font-bold text-emerald-800 dark:text-emerald-300">{formatToman(total)}</td>
                      <td className="p-3">{latestDate ? formatShamsiShort(latestDate) : 'ثبت نشده'}</td>
                      <td className="p-3">
                        <button type="button" aria-expanded={isExpanded} onClick={() => setExpandedStudentId(isExpanded ? null : student.id)} className="inline-flex items-center gap-1 rounded-md border border-cyan-300 px-2 py-1.5 font-bold text-cyan-800 dark:border-cyan-800 dark:text-cyan-300">
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          {isExpanded ? 'بستن' : 'مشاهده'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50 dark:bg-slate-800/30">
                        <td colSpan={6} className="p-3">
                          {payments.length ? (
                            <div className="space-y-2">
                              {payments.slice().sort((first, second) => second.paidAt.localeCompare(first.paidAt)).map((payment) => (
                                <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 text-[10px] last:border-0 dark:border-slate-700">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{payment.category} · {payment.month} · {formatShamsiShort(payment.paidAt)}</span>
                                  <span className="text-slate-500">{paymentMethods.find((method) => method.value === payment.paymentMethod)?.label}{payment.receiptCode ? ` · رسید ${payment.receiptCode}` : ''}</span>
                                  <strong className="text-emerald-800 dark:text-emerald-300">{formatToman(payment.amountToman)}</strong>
                                </div>
                              ))}
                            </div>
                          ) : <p className="text-[11px] text-slate-500">در این سال دریافت دانش‌آموزی ثبت نشده است.</p>}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {classStudentStats.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">دانش‌آموزی با این جست‌وجو پیدا نشد.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <section className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">ثبت سریع تراکنش</h3>
              <p className="mt-1 text-[10px] text-slate-500">فرم را یک‌بار پر کنید؛ ماه و سال برای همان رکورد ذخیره می‌شود.</p>
            </div>
            <div className="inline-flex border border-slate-200 p-1 dark:border-slate-700" role="tablist" aria-label="نوع تراکنش">
              <button type="button" role="tab" aria-selected={activeForm === 'income'} onClick={() => setActiveForm('income')} className={`rounded-md px-3 py-2 text-[11px] font-bold ${activeForm === 'income' ? 'bg-emerald-700 text-white' : 'text-slate-600 dark:text-slate-300'}`}>دریافت</button>
              <button type="button" role="tab" aria-selected={activeForm === 'expense'} onClick={() => setActiveForm('expense')} className={`rounded-md px-3 py-2 text-[11px] font-bold ${activeForm === 'expense' ? 'bg-rose-700 text-white' : 'text-slate-600 dark:text-slate-300'}`}>هزینه</button>
            </div>
          </div>

          {activeForm === 'income' ? (
            <form onSubmit={handleAddIncome} className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClass}>دانش‌آموز پرداخت‌کننده</span>
                <select value={studentId} onChange={(event) => setStudentId(event.target.value)} className={inputClass}>
                  <option value="">درآمد عمومی مدرسه / کمک‌هزینه</option>
                  {students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName} · {student.studentCode}</option>)}
                </select>
              </label>
              {!studentId && <label className="sm:col-span-2"><span className={labelClass}>نام پرداخت‌کننده یا منبع درآمد</span><input value={payerName} onChange={(event) => setPayerName(event.target.value)} className={inputClass} placeholder="نام ولی، خیر یا منبع درآمد" /></label>}
              <label><span className={labelClass}>مبلغ (تومان)</span><input required type="number" min="1" step="1000" value={incomeAmount} onChange={(event) => setIncomeAmount(event.target.value)} className={inputClass} placeholder="مثلاً ۲٬۵۰۰٬۰۰۰" /></label>
              <label><span className={labelClass}>نوع دریافت</span><select value={incomeCategory} onChange={(event) => setIncomeCategory(event.target.value)} className={inputClass}>{incomeCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label><span className={labelClass}>سال تاریخ شمسی</span><select value={incomeDate.year} onChange={(event) => setIncomeDate((date) => updatePersianDate(date, 'year', Number(event.target.value)))} className={inputClass}>{dateYears.map((year) => <option key={year} value={year}>{toPersianDigits(year)}</option>)}</select></label>
              <label><span className={labelClass}>ماه تاریخ شمسی</span><select value={incomeDate.month} onChange={(event) => setIncomeDate((date) => updatePersianDate(date, 'month', Number(event.target.value)))} className={inputClass}>{persianCalendarMonths.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
              <label><span className={labelClass}>روز تاریخ شمسی</span><select required value={incomeDate.day} onChange={(event) => setIncomeDate((date) => updatePersianDate(date, 'day', Number(event.target.value)))} className={inputClass}>{Array.from({ length: getPersianMonthLength(incomeDate.year, incomeDate.month) }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{toPersianDigits(day)}</option>)}</select><span className="mt-1 block text-[10px] text-slate-500">تاریخ انتخابی: {formatDateParts(incomeDate)} · {getAcademicMonth(incomeDate.month)}</span></label>
              <label><span className={labelClass}>روش پرداخت</span><select value={incomeMethod} onChange={(event) => setIncomeMethod(event.target.value as SchoolPaymentMethod)} className={inputClass}>{paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</select></label>
              <label><span className={labelClass}>شماره رسید (اختیاری)</span><input value={incomeReceipt} onChange={(event) => setIncomeReceipt(event.target.value)} className={inputClass} /></label>
              <label className="sm:col-span-2"><span className={labelClass}>یادداشت (اختیاری)</span><input value={incomeNote} onChange={(event) => setIncomeNote(event.target.value)} className={inputClass} placeholder="مثلاً قسط دوم شهریه" /></label>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:col-span-2 dark:border-slate-800">
                <span className="text-[10px] text-slate-500">سال تحصیلی: {schoolYear}</span>
                <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"><Plus className="h-4 w-4" />{isSaving ? 'در حال ثبت...' : 'ثبت دریافت'}</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddExpense} className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className={labelClass}>شرح هزینه</span><input required value={expenseTitle} onChange={(event) => setExpenseTitle(event.target.value)} className={inputClass} placeholder="مثلاً خرید کاغذ و لوازم اداری" /></label>
              <label><span className={labelClass}>دسته‌بندی</span><select value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value)} className={inputClass}>{expenseCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label><span className={labelClass}>مبلغ (تومان)</span><input required type="number" min="1" step="1000" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} className={inputClass} placeholder="مثلاً ۸٬۵۰۰٬۰۰۰" /></label>
              <label><span className={labelClass}>سال تاریخ شمسی</span><select value={expenseDate.year} onChange={(event) => setExpenseDate((date) => updatePersianDate(date, 'year', Number(event.target.value)))} className={inputClass}>{dateYears.map((year) => <option key={year} value={year}>{toPersianDigits(year)}</option>)}</select></label>
              <label><span className={labelClass}>ماه تاریخ شمسی</span><select value={expenseDate.month} onChange={(event) => setExpenseDate((date) => updatePersianDate(date, 'month', Number(event.target.value)))} className={inputClass}>{persianCalendarMonths.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
              <label><span className={labelClass}>روز تاریخ شمسی</span><select required value={expenseDate.day} onChange={(event) => setExpenseDate((date) => updatePersianDate(date, 'day', Number(event.target.value)))} className={inputClass}>{Array.from({ length: getPersianMonthLength(expenseDate.year, expenseDate.month) }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{toPersianDigits(day)}</option>)}</select><span className="mt-1 block text-[10px] text-slate-500">تاریخ انتخابی: {formatDateParts(expenseDate)} · {getAcademicMonth(expenseDate.month)}</span></label>
              <label><span className={labelClass}>روش پرداخت</span><select value={expenseMethod} onChange={(event) => setExpenseMethod(event.target.value as SchoolPaymentMethod)} className={inputClass}>{paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</select></label>
              <label><span className={labelClass}>شماره رسید (اختیاری)</span><input value={expenseReceipt} onChange={(event) => setExpenseReceipt(event.target.value)} className={inputClass} /></label>
              <label className="sm:col-span-2"><span className={labelClass}>یادداشت (اختیاری)</span><input value={expenseNote} onChange={(event) => setExpenseNote(event.target.value)} className={inputClass} /></label>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:col-span-2 dark:border-slate-800">
                <span className="text-[10px] text-slate-500">سال تحصیلی: {schoolYear}</span>
                <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-50"><Plus className="h-4 w-4" />{isSaving ? 'در حال ثبت...' : 'ثبت هزینه'}</button>
              </div>
            </form>
          )}
          {feedback && <p role={feedback.type === 'error' ? 'alert' : 'status'} className={`mt-3 text-xs font-bold ${feedback.type === 'error' ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{feedback.message}</p>}
        </section>

        <section className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">آخرین تراکنش‌ها</h3>
              <p className="mt-1 text-[10px] text-slate-500">۱۲ رکورد آخر سال {schoolYear}</p>
            </div>
            <select value={schoolYear} onChange={(event) => setSchoolYear(event.target.value)} aria-label="سال تحصیلی تراکنش‌ها" className="max-w-32 rounded-lg border border-slate-300 bg-white px-2 py-2 text-[10px] dark:border-slate-700 dark:bg-slate-800">
              {schoolYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center gap-2 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800">
                <span className={`grid h-8 w-8 shrink-0 place-items-center ${transaction.kind === 'income' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                  {transaction.kind === 'income' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpLeft className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-200">{transaction.title}</div>
                  <div className="truncate text-[9px] text-slate-500">{transaction.category} · {transaction.month} · {transaction.method}</div>
                </div>
                <strong className={`shrink-0 text-[10px] ${transaction.kind === 'income' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>{formatCompactToman(transaction.amount)}</strong>
                <button type="button" title="حذف رکورد" aria-label={`حذف ${transaction.title}`} onClick={() => void handleDelete(transaction.title, transaction.remove)} className="grid h-8 w-8 shrink-0 place-items-center text-slate-400 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {transactions.length === 0 && <p className="py-10 text-center text-xs text-slate-500">برای این سال هنوز تراکنشی ثبت نشده است.</p>}
          </div>
        </section>
      </div>
      <p className="text-[10px] leading-5 text-slate-500 dark:text-slate-400">ثبت‌کننده: {currentUser?.fullName || 'معاون اجرایی'} · گزارش‌ها جمع رکوردهای ثبت‌شده هستند و ماندهٔ خالص، موجودی بانکی را به‌تنهایی نشان نمی‌دهد.</p>
    </div>
  );
};