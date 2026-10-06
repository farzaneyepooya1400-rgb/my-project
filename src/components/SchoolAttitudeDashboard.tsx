import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import type { SchoolAttitudeResult, SchoolClass, Student } from '../types';
import { formatShamsiDate, toPersianDigits } from '../lib/persianUtils';
import {
  SCHOOL_ATTITUDE_DOMAINS,
  SCHOOL_ATTITUDE_OPTIONS,
  SCHOOL_ATTITUDE_QUESTIONS,
} from '../lib/schoolAttitudeSurvey';

interface SchoolAttitudeDashboardProps {
  students: Student[];
  classes: SchoolClass[];
  results: SchoolAttitudeResult[];
}

const mean = (values: number[]) => values.length
  ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100
  : null;

const displayScore = (score: number | null) => score === null ? '—' : toPersianDigits(score.toFixed(2));

export const SchoolAttitudeDashboard: React.FC<SchoolAttitudeDashboardProps> = ({ students, classes, results }) => {
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const visibleResults = results
    .flatMap((result) => {
      const student = studentById.get(result.studentId);
      if (!student || (selectedClassId !== 'all' && student.classId !== selectedClassId)) return [];
      const fullName = `${student.firstName} ${student.lastName}`.toLocaleLowerCase();
      if (normalizedSearch && !fullName.includes(normalizedSearch) && !student.studentCode.toLocaleLowerCase().includes(normalizedSearch)) return [];
      return [{ result, student }];
    })
    .sort((first, second) => `${first.student.firstName} ${first.student.lastName}`.localeCompare(`${second.student.firstName} ${second.student.lastName}`, 'fa'));
  const averageOverall = mean(visibleResults.map(({ result }) => result.overallScore));
  const averageByDomain = new Map(SCHOOL_ATTITUDE_DOMAINS.map((domain) => [
    domain.id,
    mean(visibleResults.map(({ result }) => result.domainScores[domain.id])),
  ]));

  return (
    <section className="space-y-5">
      <header className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">نتایج آزمون رغبت‌سنجی مدرسه</h2>
        <p className="mt-1 max-w-4xl text-xs leading-6 text-slate-500 dark:text-slate-400">
          نتایج بر پایهٔ پاسخ‌های خوداظهاری دانش‌آموزان است. این نسخهٔ فارسیِ بومی‌سازی‌شده، گویه‌های تألیفی و نمره‌دهی توصیفی دارد و جایگزین نسخهٔ رسمی، هنجاریابی‌شده یا ارزیابی تشخیصی SAAS-R نیست.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="border-r-4 border-cyan-600 bg-cyan-50 p-4 dark:bg-cyan-950/30">
          <div className="text-xs font-bold text-cyan-900 dark:text-cyan-200">پاسخ‌های کامل در محدودهٔ فیلتر</div>
          <div className="mt-1 text-2xl font-black text-cyan-950 dark:text-white">{toPersianDigits(visibleResults.length)}</div>
        </div>
        <div className="border-r-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/30">
          <div className="text-xs font-bold text-amber-900 dark:text-amber-200">میانگین کل پاسخ‌ها از ۵</div>
          <div className="mt-1 text-2xl font-black text-amber-950 dark:text-white">{displayScore(averageOverall)}</div>
        </div>
        {SCHOOL_ATTITUDE_DOMAINS.map((domain, index) => {
          const colors = [
            'border-blue-600 bg-blue-50 text-blue-950 dark:bg-blue-950/30 dark:text-white',
            'border-emerald-600 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-white',
            'border-rose-600 bg-rose-50 text-rose-950 dark:bg-rose-950/30 dark:text-white',
            'border-indigo-600 bg-indigo-50 text-indigo-950 dark:bg-indigo-950/30 dark:text-white',
            'border-orange-600 bg-orange-50 text-orange-950 dark:bg-orange-950/30 dark:text-white',
          ];
          return (
            <div key={domain.id} className={`border-r-4 p-4 ${colors[index]}`}>
              <div className="text-xs font-bold">{domain.label}</div>
              <div className="mt-1 text-2xl font-black">{displayScore(averageByDomain.get(domain.id) ?? null)}</div>
              <p className="mt-1 text-[10px] leading-5 opacity-75">{domain.description}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative">
          <span className="sr-only">جستجوی دانش‌آموز</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="نام یا شمارهٔ دانش‌آموزی"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:w-64"
          />
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </label>
        <select
          aria-label="فیلتر کلاس نتایج رغبت‌سنجی"
          value={selectedClassId}
          onChange={(event) => setSelectedClassId(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">همهٔ کلاس‌ها</option>
          {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[1180px] text-right text-xs">
          <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="p-3">دانش‌آموز</th>
              <th className="p-3">کلاس</th>
              <th className="p-3">میانگین کل</th>
              {SCHOOL_ATTITUDE_DOMAINS.map((domain) => <th key={domain.id} className="p-3">{domain.label}</th>)}
              <th className="p-3">تاریخ ثبت</th>
              <th className="p-3">پاسخ‌ها</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleResults.map(({ result, student }) => {
              const isExpanded = expandedStudentId === student.id;
              const schoolClass = classes.find((item) => item.id === student.classId);
              return (
                <React.Fragment key={result.id}>
                  <tr className="align-middle hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {student.firstName} {student.lastName}
                      <span className="mt-1 block font-mono text-[10px] font-normal text-slate-500" dir="ltr">{student.studentCode}</span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{schoolClass?.name || 'نامشخص'}</td>
                    <td className="p-3 font-black text-cyan-800 dark:text-cyan-300">{displayScore(result.overallScore)} از ۵</td>
                    {SCHOOL_ATTITUDE_DOMAINS.map((domain) => (
                      <td key={domain.id} className="p-3 font-bold">{displayScore(result.domainScores[domain.id])}</td>
                    ))}
                    <td className="p-3 whitespace-nowrap text-slate-500">{formatShamsiDate(result.completedAt)}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-300 px-2.5 py-2 font-bold text-cyan-900 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-300 dark:hover:bg-cyan-950/40"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {isExpanded ? 'بستن' : 'مشاهده'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/70 dark:bg-slate-800/30">
                      <td colSpan={9} className="p-4">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {SCHOOL_ATTITUDE_DOMAINS.map((domain) => (
                            <section key={domain.id} className="border-t-2 border-cyan-600 pt-3">
                              <h3 className="mb-2 text-xs font-black text-slate-900 dark:text-white">{domain.label}</h3>
                              <div className="space-y-2">
                                {SCHOOL_ATTITUDE_QUESTIONS.filter((question) => question.domain === domain.id).map((question) => (
                                  <div key={question.id} className="flex items-start justify-between gap-3 text-[11px] leading-5">
                                    <span className="text-slate-700 dark:text-slate-300">{question.text}</span>
                                    <strong className="shrink-0 text-cyan-800 dark:text-cyan-300">
                                      {SCHOOL_ATTITUDE_OPTIONS.find((option) => option.value === result.answers[question.id])?.label || 'بدون پاسخ'}
                                    </strong>
                                  </div>
                                ))}
                              </div>
                            </section>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {visibleResults.length === 0 && (
              <tr><td colSpan={9} className="p-10 text-center text-slate-500">برای این محدوده هنوز نتیجه‌ای ثبت نشده است.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};