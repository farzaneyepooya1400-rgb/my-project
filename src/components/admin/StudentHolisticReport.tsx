import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Download, FileText, Search } from 'lucide-react';
import type {
  AttendanceRecord,
  ExtracurricularActivity,
  FamilyProfile,
  GardnerScores,
  PrayerSurveyResponse,
  PsychTestResult,
  SchoolAttitudeResult,
  SchoolClass,
  Student,
  StudentGrade,
  Teacher,
} from '../../types';
import { GARDNER_TITLES, HOLLAND_TITLES, getPedagogicalRecommendations, getStudentPerformanceRecommendations } from '../../lib/psychologyData';
import { PRAYER_SURVEY_QUESTIONS } from '../../lib/prayerSurvey';
import { toPersianDigits } from '../../lib/persianUtils';
import { SCHOOL_ATTITUDE_DOMAINS, SCHOOL_ATTITUDE_OPTIONS, SCHOOL_ATTITUDE_QUESTIONS } from '../../lib/schoolAttitudeSurvey';

interface StudentHolisticReportProps {
  students: Student[];
  classes: SchoolClass[];
  teachers: Teacher[];
  grades: StudentGrade[];
  psychResults: PsychTestResult[];
  schoolAttitudeResults: SchoolAttitudeResult[];
  attendanceRecords: AttendanceRecord[];
  extracurriculars: ExtracurricularActivity[];
  familyProfiles: FamilyProfile[];
  prayerSurveyResponses: PrayerSurveyResponse[];
}

type Level = 'good' | 'medium' | 'weak' | 'missing';
type LevelInfo = { level: Level; label: string; className: string };

const levelClasses: Record<Level, string> = {
  good: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  weak: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
  missing: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const makeLevel = (level: Level, label: string): LevelInfo => ({ level, label, className: levelClasses[level] });

const fuzzyLevel = (value: number | null, max: number): LevelInfo => {
  if (value === null || !Number.isFinite(value) || max <= 0) return makeLevel('missing', 'بدون داده');
  const normalized = clamp(value / max);
  const memberships = [
    { level: 'weak' as const, membership: clamp((0.68 - normalized) / 0.23) },
    { level: 'medium' as const, membership: clamp(1 - Math.abs(normalized - 0.66) / 0.22) },
    { level: 'good' as const, membership: clamp((normalized - 0.55) / 0.25) },
  ];
  const selected = memberships.reduce((best, item) => item.membership > best.membership ? item : best);
  return makeLevel(selected.level, selected.level === 'good' ? 'خوب' : selected.level === 'medium' ? 'متوسط' : 'ضعیف');
};

const relativeFuzzyLevel = (value: number | null, cohort: number[]): LevelInfo => {
  if (value === null || cohort.length === 0) return makeLevel('missing', 'بدون داده');
  const center = average(cohort) ?? 0;
  const deviation = Math.sqrt(average(cohort.map((item) => (item - center) ** 2)) ?? 0);
  if (deviation === 0) return makeLevel('medium', 'متوسط');
  const zScore = (value - center) / deviation;
  const memberships = [
    { level: 'weak' as const, membership: clamp((0.5 - zScore) / 1.5) },
    { level: 'medium' as const, membership: clamp(1 - Math.abs(zScore)) },
    { level: 'good' as const, membership: clamp((zScore + 0.5) / 1.5) },
  ];
  const selected = memberships.reduce((best, item) => item.membership > best.membership ? item : best);
  return makeLevel(selected.level, selected.level === 'good' ? 'خوب' : selected.level === 'medium' ? 'متوسط' : 'ضعیف');
};

const StatusBadge: React.FC<{ info: LevelInfo }> = ({ info }) => (
  <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold ${info.className}`}>{info.label}</span>
);

const gardnerKeys: (keyof GardnerScores)[] = [
  'verbal', 'logical', 'spatial', 'musical', 'bodily', 'intrapersonal', 'interpersonal', 'naturalist',
];

const GARDNER_PARENT_GUIDE: Record<keyof GardnerScores, { meaning: string; practice: string; activity: string }> = {
  verbal: { meaning: 'از واژه‌ها، خواندن، نوشتن و توضیح دادن بیشتر لذت می‌برد.', practice: 'از او بخواهید درس را با زبان خودش تعریف کند یا خلاصه‌ای کوتاه بنویسد.', activity: 'باشگاه کتاب‌خوانی، داستان‌نویسی، سخنرانی یا مناظره' },
  logical: { meaning: 'به کشف الگوها، پرسش‌های «چرا؟» و حل مسئله علاقه نشان می‌دهد.', practice: 'مسئله را مرحله‌به‌مرحله بررسی کنید و برای پاسخ، فرصت فکر کردن بدهید.', activity: 'باشگاه ریاضی، حل معما، علوم یا برنامه‌نویسی مقدماتی' },
  spatial: { meaning: 'با تصویر، شکل، نقشه و تصور فضایی بهتر ارتباط می‌گیرد.', practice: 'از نمودار، طرح، نقشه مفهومی و رنگ‌بندی برای توضیح درس کمک بگیرید.', activity: 'کارگاه طراحی، هنرهای تجسمی، عکاسی یا ساخت ماکت' },
  musical: { meaning: 'به ریتم، صدا و الگوهای شنیداری توجه بیشتری نشان می‌دهد.', practice: 'در صورت علاقه‌ی خودش، از ریتم، بلندخوانی یا فایل شنیداری برای مرور استفاده کنید.', activity: 'گروه سرود، موسیقی یا فعالیت‌های ریتمیک' },
  bodily: { meaning: 'از انجام دادن، ساختن و تجربه‌ی عملی استقبال می‌کند.', practice: 'آزمایش، کاردستی، مدل‌سازی و وقفه‌های حرکتی کوتاه را امتحان کنید.', activity: 'ورزش، آزمایشگاه عملی، رباتیک یا کارگاه ساخت' },
  intrapersonal: { meaning: 'برای فکر کردن مستقل، خلوت و هدف‌گذاری شخصی ارزش قائل است.', practice: 'زمان کوتاهی برای فکر فردی و انتخاب هدف‌های کوچک فراهم کنید.', activity: 'کارگاه خودشناسی، برنامه‌ریزی شخصی یا نوشتن روزانه' },
  interpersonal: { meaning: 'از گفت‌وگو، همکاری و یادگیری در کنار دیگران بهره می‌گیرد.', practice: 'فعالیت دونفره یا گروهی با نقش روشن و فرصت شنیدن نظر دیگران بدهید.', activity: 'فعالیت داوطلبانه، گروه‌های همیار، مناظره یا کار تیمی' },
  naturalist: { meaning: 'به مشاهده، دسته‌بندی و موضوعات طبیعت و محیط‌زیست علاقه نشان می‌دهد.', practice: 'مفهوم‌ها را به مشاهده‌ی محیط، نمونه‌های واقعی و دسته‌بندی پیوند بزنید.', activity: 'باشگاه محیط‌زیست، باغبانی، طبیعت‌پژوهی یا علوم' },
};

const HOLLAND_PARENT_GUIDE: Record<keyof PsychTestResult['hollandScores'], { meaning: string; activity: string }> = {
  R: { meaning: 'علاقه به کارهای عملی، ابزار، ساختن و دیدن نتیجه‌ی ملموس.', activity: 'رباتیک، ساخت‌وساز، ورزش مهارتی یا کارگاه فنی' },
  I: { meaning: 'علاقه به پرسش‌گری، آزمایش، پژوهش و پیدا کردن دلیل‌ها.', activity: 'باشگاه علوم، آزمایشگاه دانش‌آموزی، پژوهش یا برنامه‌نویسی' },
  A: { meaning: 'علاقه به خلاقیت، بیان شخصی و ساختن اثر تازه.', activity: 'هنر، تئاتر، نویسندگی، موسیقی یا تولید محتوای خلاق' },
  S: { meaning: 'علاقه به کمک کردن، آموزش، همکاری و ارتباط با دیگران.', activity: 'همیار آموزشی، فعالیت داوطلبانه یا پروژه‌ی گروهی' },
  E: { meaning: 'علاقه به ایده‌پردازی، ارائه، سازمان‌دهی و پیش‌بردن یک کار.', activity: 'مناظره، شورای دانش‌آموزی، کارآفرینی یا رهبری پروژه' },
  C: { meaning: 'علاقه به نظم، برنامه، دسته‌بندی و کارهای مرحله‌بندی‌شده.', activity: 'باشگاه برنامه‌ریزی، سواد مالی یا ثبت و تحلیل داده' },
};

const VARK_PARENT_GUIDE: { key: keyof NonNullable<PsychTestResult['varkScores']>; title: string; meaning: string; method: string }[] = [
  { key: 'visual', title: 'دیداری', meaning: 'تصویر و نمودار ممکن است به فهم این دانش‌آموز کمک کند.', method: 'نقشه‌ی مفهومی، تصویر، نمودار و نمایش مرحله‌ای را امتحان کنید.' },
  { key: 'auditory', title: 'شنیداری', meaning: 'گفت‌وگو و شنیدن توضیح ممکن است برایش کمک‌کننده باشد.', method: 'پرسش‌وپاسخ، گفت‌وگوی دونفره و توضیح دادن با صدای بلند را امتحان کنید.' },
  { key: 'readWrite', title: 'خواندن و نوشتن', meaning: 'متن‌خوانی و یادداشت‌برداری ممکن است به مرورش کمک کند.', method: 'خلاصه‌نویسی، فهرست نکته‌ها و متن کوتاه مرحله‌بندی‌شده را امتحان کنید.' },
  { key: 'kinesthetic', title: 'عملی و تجربه‌محور', meaning: 'دیدن کاربرد واقعی یا انجام دادن ممکن است فهم را آسان‌تر کند.', method: 'آزمایش، ساخت مدل و تمرین کاربردی را امتحان کنید.' },
];

const latestByStudent = <T extends { studentId: string; updatedAt?: string; submittedAt?: string; completedAt?: string }>(items: T[]) => {
  const latest = new Map<string, T>();
  for (const item of items) {
    const current = latest.get(item.studentId);
    const itemDate = item.updatedAt || item.submittedAt || item.completedAt || '';
    const currentDate = current?.updatedAt || current?.submittedAt || current?.completedAt || '';
    if (!current || itemDate >= currentDate) latest.set(item.studentId, item);
  }
  return latest;
};

type StudentReportData = {
  student: Student;
  teachers: Teacher[];
  className: string;
  subjects: { subject: string; average: number | null; records: StudentGrade[] }[];
  psych?: PsychTestResult;
  schoolAttitude?: SchoolAttitudeResult;
  attendance: AttendanceRecord[];
  activities: ExtracurricularActivity[];
  family?: FamilyProfile;
  prayer?: PrayerSurveyResponse;
};

const reportColors = [
  { accent: '#087f8c', pale: '#e5f5f5', ink: '#075b65' },
  { accent: '#3769b0', pale: '#eaf0fb', ink: '#294f86' },
  { accent: '#b26a16', pale: '#fff3df', ink: '#805015' },
  { accent: '#39834e', pale: '#eaf5eb', ink: '#2a653b' },
  { accent: '#c04f55', pale: '#fff0ef', ink: '#923941' },
  { accent: '#3e718d', pale: '#eaf3f8', ink: '#315c73' },
];

const appendReportSection = (container: HTMLElement, title: string, headers: string[], rows: string[][]) => {
  const section = document.createElement('section');
  const colors = reportColors[container.querySelectorAll(':scope > section').length % reportColors.length];
  section.style.cssText = 'margin:0 0 18px;break-inside:auto;';
  const heading = document.createElement('h2');
  heading.textContent = title;
  heading.style.cssText = `margin:0 0 8px;padding:10px 13px;border-right:5px solid ${colors.accent};border-radius:5px;background:${colors.pale};color:${colors.ink};font-size:13px;break-after:avoid;`;
  section.appendChild(heading);

  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:10px;';
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const titleText of headers) {
    const cell = document.createElement('th');
    cell.textContent = titleText;
    cell.style.cssText = `padding:8px 7px;border:1px solid ${colors.accent};background:${colors.accent};color:#ffffff;text-align:right;font-size:9px;`;
    headRow.appendChild(cell);
  }
  head.appendChild(headRow);
  table.appendChild(head);

  const body = document.createElement('tbody');
  const reportRows = rows.length ? rows : [['اطلاعاتی ثبت نشده است']];
  for (const [rowIndex, row] of reportRows.entries()) {
    const tableRow = document.createElement('tr');
    tableRow.style.pageBreakInside = 'avoid';
    const values = rows.length ? row : [`${headers[0]}: ${row[0]}`];
    if (!rows.length) {
      const cell = document.createElement('td');
      cell.colSpan = headers.length;
      cell.textContent = values[0];
      cell.style.cssText = 'padding:9px;border:1px solid #d8e2e2;background:#f6f8f7;color:#687876;text-align:right;line-height:1.7;';
      tableRow.appendChild(cell);
    } else for (const value of values) {
      const cell = document.createElement('td');
      cell.textContent = value;
      cell.style.cssText = `padding:7px;border:1px solid #d8e2e2;background:${rowIndex % 2 ? '#ffffff' : '#f6f8f7'};color:#243533;vertical-align:top;text-align:right;line-height:1.7;`;
      tableRow.appendChild(cell);
    }
    body.appendChild(tableRow);
  }
  table.appendChild(body);
  section.appendChild(table);
  container.appendChild(section);
};

const createStudentHolisticReportRoot = (data: StudentReportData) => {
  const root = document.createElement('main');
  root.dir = 'rtl';
  root.id = 'student-holistic-report';
  root.style.cssText = 'position:fixed;left:-10000px;top:0;width:820px;padding:30px;background:#ffffff;color:#172b29;font-family:Tahoma,Arial,sans-serif;direction:rtl;box-sizing:border-box;';
  const masthead = document.createElement('header');
  masthead.style.cssText = 'margin-bottom:16px;padding:22px 24px;border-radius:8px;background:#12443f;color:#ffffff;border-bottom:5px solid #d3a84f;';
  const schoolLabel = document.createElement('div');
  schoolLabel.textContent = 'مدرسه‌یار  |  سامانه مدیریت و پایش مدرسه';
  schoolLabel.style.cssText = 'margin-bottom:12px;color:#d7e8df;font-size:10px;font-weight:bold;';
  masthead.appendChild(schoolLabel);
  const title = document.createElement('h1');
  title.textContent = 'کارنامه جامع آموزشی، پرورشی و تربیتی';
  title.style.cssText = 'margin:0 0 6px;color:#ffffff;text-align:right;font-size:21px;';
  masthead.appendChild(title);
  const subtitle = document.createElement('p');
  subtitle.textContent = 'گزارش یکپارچه از مسیر یادگیری و رشد دانش‌آموز';
  subtitle.style.cssText = 'margin:0;color:#d7e8df;font-size:10px;line-height:1.8;';
  masthead.appendChild(subtitle);
  root.appendChild(masthead);

  const studentInfo = document.createElement('div');
  studentInfo.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;padding:13px;border:1px solid #d8e2e2;border-radius:6px;background:#f6f8f7;';
  const identityItems = [
    ['نام دانش‌آموز', `${data.student.firstName} ${data.student.lastName}`],
    ['شماره دانش‌آموزی', data.student.studentCode],
    ['کلاس', data.className],
    ['تاریخ تهیه', new Date().toLocaleDateString('fa-IR')],
  ];
  for (const [label, value] of identityItems) {
    const item = document.createElement('div');
    item.style.cssText = 'flex:1 1 140px;padding:4px 8px;';
    const itemLabel = document.createElement('div');
    itemLabel.textContent = label;
    itemLabel.style.cssText = 'margin-bottom:4px;color:#687876;font-size:9px;';
    const itemValue = document.createElement('strong');
    itemValue.textContent = value;
    itemValue.style.cssText = 'color:#183d38;font-size:11px;';
    item.append(itemLabel, itemValue);
    studentInfo.appendChild(item);
  }
  root.appendChild(studentInfo);

  const reportAverage = average(data.subjects.flatMap((subject) => subject.average === null ? [] : [subject.average]));
  const rankedGardner = data.psych
    ? [...gardnerKeys].sort((first, second) => data.psych!.gardnerScores[second] - data.psych!.gardnerScores[first])
    : [];
  const rankedHolland = data.psych
    ? (Object.keys(data.psych.hollandScores) as (keyof PsychTestResult['hollandScores'])[])
        .sort((first, second) => data.psych!.hollandScores[second] - data.psych!.hollandScores[first])
    : [];
  const teachingGuidance = data.psych
    ? getPedagogicalRecommendations(data.psych.learningStyle, data.psych.personalityType, data.psych.hollandCode.charAt(0), data.psych.varkScores)
    : null;
  const performanceGuidance = getStudentPerformanceRecommendations(
    data.subjects.flatMap((subject) => subject.records),
    data.attendance
  );
  const suggestedActivities = data.psych ? [...new Set([
    ...rankedGardner.slice(0, 2).map((key) => GARDNER_PARENT_GUIDE[key].activity),
    ...rankedHolland.slice(0, 2).map((key) => HOLLAND_PARENT_GUIDE[key].activity),
  ])] : [];
  const conceptRows = data.subjects.flatMap(({ subject, records }) =>
    records.flatMap((record) =>
      (record.conceptEntries ?? []).map((entry) => [
        subject,
        entry.name,
        entry.assessmentTerm === 'midterm1' ? 'مستمر ترم اول' : entry.assessmentTerm === 'midterm2' ? 'مستمر ترم دوم' : record.assessmentTerm === 'midterm1' ? 'مستمر ترم اول' : record.assessmentTerm === 'midterm2' ? 'مستمر ترم دوم' : 'نامشخص',
        `${entry.sessionLabel || 'جلسه'}${entry.date ? ` · ${new Date(entry.date).toLocaleDateString('fa-IR')}` : ''}`,
        entry.level === 'good' ? 'خوب' : entry.level === 'medium' ? 'متوسط' : entry.level === 'weak' ? 'ضعیف' : 'بدون نمره',
        typeof entry.score === 'number' ? `${toPersianDigits(entry.score.toFixed(2))} از ۲۰` : 'بدون نمره',
        entry.behaviorNote || record.behaviorNote || '—',
      ])
    )
  );

  const summary = document.createElement('div');
  summary.style.cssText = 'display:flex;gap:8px;margin-bottom:20px;';
  const summaryItems = [
    ['میانگین درسی', reportAverage === null ? 'ثبت نشده' : `${toPersianDigits(reportAverage.toFixed(1))} از ۲۰`, '#e9f3f1', '#12443f'],
    ['درس‌های دارای نمره', toPersianDigits(data.subjects.length), '#f6f0df', '#765a1e'],
    ['سوابق حضور و رفتار', toPersianDigits(data.attendance.length), '#edf1f7', '#344d70'],
    ['ترجیح‌های یادگیری', data.psych?.varkScores ? 'چهار بُعد ثبت شده' : data.psych ? 'نسخهٔ پایه ثبت شده' : 'ثبت نشده', '#f6e9e7', '#854b42'],
  ];
  for (const [label, value, background, accent] of summaryItems) {
    const card = document.createElement('div');
    card.style.cssText = `flex:1;padding:11px 9px;border:1px solid #e1e7e5;border-radius:5px;background:${background};text-align:center;`;
    const cardValue = document.createElement('strong');
    cardValue.textContent = value;
    cardValue.style.cssText = `display:block;margin-bottom:5px;color:${accent};font-size:13px;`;
    const cardLabel = document.createElement('span');
    cardLabel.textContent = label;
    cardLabel.style.cssText = 'color:#586966;font-size:8px;';
    card.append(cardValue, cardLabel);
    summary.appendChild(card);
  }
  root.appendChild(summary);

  appendReportSection(root, '۱. وضعیت آموزشی و نمرات درسی', ['درس', 'میانگین سالانه', 'وضعیت', 'دبیر', 'مستمر ترم اول', 'نمره ترم اول', 'مستمر ترم دوم', 'نمره ترم دوم', 'شیوه ثبت مستمر'], data.subjects.map(({ subject, average: score, records }) => {
    const record = records[0];
    return [
      subject,
      score === null ? '—' : `${toPersianDigits(score.toFixed(2))} از ۲۰`,
      fuzzyLevel(score, 20).label,
      record ? data.teachers.find((teacher) => teacher.id === record.teacherId)?.fullName || 'نامشخص' : 'نامشخص',
      toPersianDigits(record?.continuousTerm1 ?? record?.continuous ?? '—'),
      toPersianDigits(record?.term1Exam ?? record?.midterm ?? '—'),
      toPersianDigits(record?.continuousTerm2 ?? '—'),
      toPersianDigits(record?.term2Exam ?? record?.final ?? '—'),
      record?.continuousGradeMode === 'indicator' ? 'خودکار از شاخص‌ها' : 'دستی',
    ];
  }));

  appendReportSection(root, '۲. مفاهیم درس و سطح یادگیری شاخص‌محور', ['درس', 'مفهوم', 'دوره', 'جلسه / تاریخ', 'سطح عملکرد', 'نمره', 'یادداشت اخلاقی همان جلسه'], conceptRows.length ? conceptRows : [['—', '—', '—', '—', '—', '—', '—']]);

  appendReportSection(root, '۳. نتیجهٔ گاردنر، هالند و ترجیح یادگیری به زبان ساده', ['حوزهٔ آزمون', 'نتیجه', 'توضیح برای خانواده'], data.psych ? [
    ...gardnerKeys.map((key) => [
      `گاردنر · ${GARDNER_TITLES[key].fa}${rankedGardner.slice(0, 2).includes(key) ? ' · از حوزه‌های پرامتیاز' : ''}`,
      `${toPersianDigits(data.psych!.gardnerScores[key])} از ۱۰`,
      `${GARDNER_PARENT_GUIDE[key].meaning} ${GARDNER_PARENT_GUIDE[key].practice}`,
    ]),
    ...rankedHolland.map((key, index) => [
      `هالند · ${HOLLAND_TITLES[key]?.fa || key}${index < 3 ? ` · اولویت ${toPersianDigits(index + 1)}` : ''}`,
      `${toPersianDigits(data.psych!.hollandScores[key])} از ۱۰ · کد ${data.psych!.hollandCode}`,
      `${HOLLAND_PARENT_GUIDE[key].meaning} زمینهٔ تجربهٔ اختیاری: ${HOLLAND_PARENT_GUIDE[key].activity}.`,
    ]),
    ...(data.psych.varkScores
      ? VARK_PARENT_GUIDE.map((item) => [
          `VARK · ترجیح یادگیری ${item.title}`,
          `${toPersianDigits(data.psych!.varkScores![item.key])} از ۱۰`,
          `${item.meaning} ${item.method}`,
        ])
      : [['ترجیح‌های چهارگانهٔ VARK', 'در این نسخه ثبت نشده', 'فقط سبک یادگیری پایه در دسترس است؛ از این گزارش نمی‌توان دربارهٔ چهار بُعد نتیجه‌گیری کرد.']]),
    ['سبک یادگیری پایه', data.psych.learningStyle, data.psych.learningStyle === 'دیداری'
      ? 'تصویر و نمودار را به‌عنوان یکی از راه‌های ارائه امتحان کنید و ببینید آیا فهم درس بهتر می‌شود.'
      : data.psych.learningStyle === 'شنیداری'
        ? 'گفت‌وگو و توضیح شفاهی را در کنار خواندن، نوشتن و تمرین به کار ببرید.'
        : 'تمرین عملی را با توضیح، تصویر و زمان فکر فردی ترکیب کنید.'],
    ['تیپ تعاملی خوداظهاری', data.psych.personalityType, data.psych.personalityType === 'درون‌گرا'
      ? 'برای فکر کردن پیش از پاسخ، زمان و امکان پاسخ فردی فراهم کنید؛ این نتیجه تشخیص شخصیت نیست.'
      : 'فرصت مشارکت گروهی فراهم کنید و هم‌زمان امکان تمرکز و پاسخ فردی را هم نگه دارید.'],
    ['نحوه خواندن نتیجه', data.psych.isDemo ? 'دادهٔ نمونه' : 'خوداظهاری آموزشی', 'امتیازها تشخیص، هوش ثابت یا محدودیت یادگیری نیستند؛ علاقه و عملکرد کودک ممکن است در موقعیت‌های مختلف فرق کند.'],
  ] : []);

  const familyGuidanceRows: string[][] = [];
  if (teachingGuidance) {
    familyGuidanceRows.push(
      ['روش یاددهی', 'پیشنهاد بر پایه ترجیح یادگیری و رغبت', teachingGuidance.teachingMethod],
      ['انگیزش و مدیریت تعامل', 'پیشنهاد بر پایه سبک تعامل ثبت‌شده', teachingGuidance.behavioralApproach],
      ['تمرین و تکلیف', 'پیشنهاد بر پایه علاقه‌های هالند', teachingGuidance.homeworkDesign],
      ['همراهی خانواده', 'ایجاد فرصت حمایت در خانه', teachingGuidance.parentCommunication],
    );
  }
  const recordedMetrics = [
    performanceGuidance.gradeAverage === null ? null : `میانگین درس‌ها ${toPersianDigits(performanceGuidance.gradeAverage.toFixed(1))} از ۲۰`,
    performanceGuidance.absences === null ? null : `${toPersianDigits(performanceGuidance.absences)} غیبت`,
    performanceGuidance.tardies === null ? null : `${toPersianDigits(performanceGuidance.tardies)} تأخیر`,
    performanceGuidance.homeworkPercent === null ? null : `انجام تکلیف ${toPersianDigits(Math.round(performanceGuidance.homeworkPercent))}٪`,
    performanceGuidance.homeworkQuality === null ? null : `کیفیت تکلیف ${toPersianDigits(performanceGuidance.homeworkQuality.toFixed(1))} از ۵`,
    performanceGuidance.participation === null ? null : `مشارکت ${toPersianDigits(performanceGuidance.participation.toFixed(1))} از ۵`,
  ].filter((metric): metric is string => Boolean(metric));
  if (recordedMetrics.length) {
    familyGuidanceRows.push(['وضعیت ثبت‌شده', recordedMetrics.join(' · '), 'این شاخص‌ها فقط برای انتخاب حمایت آموزشی‌اند؛ علت نمره یا غیبت را با گفت‌وگو و بررسی شرایط پیدا کنید.']);
  }
  for (const suggestion of performanceGuidance.suggestions) {
    familyGuidanceRows.push(['اقدام پیشنهادی بر پایه عملکرد', 'بر اساس نمره، حضور، تکلیف یا مشارکت ثبت‌شده', suggestion]);
  }
  if (suggestedActivities.length) {
    familyGuidanceRows.push(['فعالیت فوق‌برنامهٔ قابل بررسی', 'پیشنهاد بر پایه حوزه‌های پرامتیاز و رغبت‌های ثبت‌شده', `${suggestedActivities.join('؛ ')}. علاقهٔ خود فرزند، دسترسی و برنامهٔ مدرسه را پیش از انتخاب بررسی کنید.`]);
  }
  familyGuidanceRows.push(['یادآوری برای خانواده', 'انتخاب با همراهی خود دانش‌آموز', 'یک یا دو روش را برای چند هفته امتحان کنید، از خود فرزند بازخورد بگیرید و بر اساس فهم و علاقهٔ واقعی او تغییر دهید؛ نتیجهٔ پرسشنامه به‌تنهایی مبنای تصمیم نباشد.']);
  appendReportSection(root, '۴. پیشنهادهای یاددهی، همراهی خانواده و فعالیت‌های قابل بررسی', ['موضوع', 'مبنای پیشنهاد', 'اقدام کاربردی'], familyGuidanceRows);

  appendReportSection(root, '۵. حضور، تکالیف و شاخص‌های رفتاری', ['ماه', 'غیبت', 'تأخیر', 'تکلیف', 'کیفیت تکلیف', 'مشارکت', 'رفتار', 'مسئولیت', 'همکاری', 'رعایت قوانین'], data.attendance.map((record) => [
    record.month,
    toPersianDigits(record.absences),
    toPersianDigits(record.tardies),
    `${toPersianDigits(record.homeworkPercent)}٪`,
    `${toPersianDigits(record.homeworkQuality)} از ۵`,
    `${toPersianDigits(record.participation)} از ۵`,
    `${toPersianDigits(record.behavior)} از ۵`,
    `${toPersianDigits(record.responsibility)} از ۵`,
    `${toPersianDigits(record.teamwork)} از ۵`,
    `${toPersianDigits(record.rulesObservance)} از ۵`,
  ]));

  appendReportSection(root, '۶. فعالیت‌های پرورشی کلاس', ['ماه', 'وضعیت انتساب', 'میانگین کلاس', 'هنری', 'ورزشی', 'مهارتی', 'علمی'], data.activities.map((activity) => [
    activity.month,
    'دادهٔ کلاسی؛ نه ارزیابی فردی',
    toPersianDigits(activity.monthlyAverage.toFixed(2)),
    toPersianDigits(activity.artistic),
    toPersianDigits(activity.sports),
    toPersianDigits(activity.skills),
    toPersianDigits(activity.scientific),
  ]));

  appendReportSection(root, '۷. پرونده سلامت، خانواده و سبک زندگی', ['شاخص', 'اطلاعات ثبت‌شده'], data.family ? [
    ['تحصیلات پدر / مادر', `${data.family.fatherEducation} / ${data.family.motherEducation}`],
    ['شغل پدر / مادر', `${data.family.fatherJob} / ${data.family.motherJob}`],
    ['تعداد فرزندان خانواده', toPersianDigits(data.family.childrenCount)],
    ['وضعیت خانوادگی ثبت‌شده', data.family.maritalStatus],
    ['BMI ثبت‌شده', toPersianDigits(data.family.calculatedBmi.toFixed(1))],
    ['قد / وزن', `${toPersianDigits(data.family.heightCm)} سانتی‌متر / ${toPersianDigits(data.family.weightKg)} کیلوگرم`],
    ['خواب / زمان نمایشگر', `${data.family.sleepHour} ساعت / ${toPersianDigits(data.family.screenTimeHours)} ساعت`],
    ['وضعیت صبحانه', data.family.breakfastStatus],
    ['بینایی یا شنوایی', data.family.hasVisionHearingIssue ? data.family.sensoryIssueDetails || 'نیازمند پیگیری' : 'گزارشی ثبت نشده'],
    ['فاصله تا مدرسه / روش رفت‌وآمد', `${toPersianDigits(data.family.distanceToSchoolKm)} کیلومتر / ${data.family.commuteMethod}`],
    ['مسئولیت‌پذیری در خانه', `${toPersianDigits(data.family.homeResponsibilityScore)} از ۵`],
    ['یادداشت تفسیر BMI', 'BMI باید با نمودار رشد متناسب با سن و جنس تفسیر شود.'],
  ] : []);

  appendReportSection(root, '۸. پاسخ‌های پرسشنامه نماز', ['پرسش', 'پاسخ'], data.prayer ? PRAYER_SURVEY_QUESTIONS
    .filter((question) => typeof data.prayer?.answers[question.id] === 'number')
    .map((question) => [question.prompt, question.options[data.prayer?.answers[question.id] ?? -1] || 'پاسخ ثبت‌شده']) : []);

  appendReportSection(root, '۹. نتیجهٔ آزمون رغبت‌سنجی مدرسه', ['بُعد', 'میانگین از ۵'], data.schoolAttitude ? [
    ['میانگین کل', toPersianDigits(data.schoolAttitude.overallScore.toFixed(2))],
    ...SCHOOL_ATTITUDE_DOMAINS.map((domain) => [domain.label, toPersianDigits(data.schoolAttitude?.domainScores[domain.id].toFixed(2) ?? '—')]),
  ] : []);

  appendReportSection(root, '۱۰. پاسخ‌های آزمون رغبت‌سنجی مدرسه', ['بُعد', 'گزاره', 'پاسخ'], data.schoolAttitude ? SCHOOL_ATTITUDE_QUESTIONS.map((question) => [
    SCHOOL_ATTITUDE_DOMAINS.find((domain) => domain.id === question.domain)?.label || '',
    question.text,
    SCHOOL_ATTITUDE_OPTIONS.find((option) => option.value === data.schoolAttitude?.answers[question.id])?.label || 'بدون پاسخ',
  ]) : []);

  return root;
};

const safeStudentFilename = (student: Student) => `${student.firstName}-${student.lastName}`.replace(/[\\/:*?"<>|]/g, '-');

const downloadStudentHolisticHtml = (data: StudentReportData) => {
  const title = `کارنامه جامع ${data.student.firstName} ${data.student.lastName}`;
  const reportDocument = document.implementation.createHTMLDocument(title);
  reportDocument.documentElement.lang = 'fa';
  reportDocument.documentElement.dir = 'rtl';

  const charset = reportDocument.createElement('meta');
  charset.setAttribute('charset', 'UTF-8');
  reportDocument.head.appendChild(charset);
  const viewport = reportDocument.createElement('meta');
  viewport.name = 'viewport';
  viewport.content = 'width=device-width, initial-scale=1';
  reportDocument.head.appendChild(viewport);

  const styles = reportDocument.createElement('style');
  styles.textContent = `
    * { box-sizing: border-box; }
    body { margin: 0; padding: 28px 16px; background: #edf2f0; color: #172b29; font-family: Tahoma, Arial, sans-serif; }
    #student-holistic-report { position: static !important; left: auto !important; top: auto !important; width: 100% !important; max-width: 900px; margin: 0 auto; padding: 30px; background: #fff; box-shadow: 0 12px 36px rgba(18, 68, 63, .12); }
    #student-holistic-report table { width: 100%; border-collapse: collapse; }
    #student-holistic-report th, #student-holistic-report td { overflow-wrap: anywhere; }
    @media (max-width: 640px) {
      body { padding: 12px 8px; }
      #student-holistic-report { padding: 18px !important; }
      #student-holistic-report table { font-size: 8px !important; }
      #student-holistic-report th, #student-holistic-report td { padding: 5px 4px !important; }
    }
    @media print {
      @page { size: A4; margin: 12mm; }
      body { padding: 0; background: #fff; }
      #student-holistic-report { max-width: none; margin: 0; padding: 0 !important; box-shadow: none; }
      #student-holistic-report section, #student-holistic-report tr { break-inside: avoid; }
    }
  `;
  reportDocument.head.appendChild(styles);

  const root = createStudentHolisticReportRoot(data);
  root.style.cssText = 'position:static;left:auto;top:auto;width:100%;max-width:900px;margin:0 auto;padding:30px;background:#ffffff;color:#172b29;font-family:Tahoma,Arial,sans-serif;direction:rtl;box-sizing:border-box;';
  reportDocument.body.appendChild(root);

  const html = `<!doctype html>\n${reportDocument.documentElement.outerHTML}`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `کارنامه-${safeStudentFilename(data.student)}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const StudentHolisticReport: React.FC<StudentHolisticReportProps> = ({
  students,
  classes,
  teachers,
  grades,
  psychResults,
  schoolAttitudeResults,
  attendanceRecords,
  extracurriculars,
  familyProfiles,
  prayerSurveyResponses,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [htmlDownloadingStudentId, setHtmlDownloadingStudentId] = useState<string | null>(null);
  const [htmlError, setHtmlError] = useState('');

  const studentsById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
  const latestPsych = useMemo(() => latestByStudent(psychResults), [psychResults]);
  const latestSchoolAttitude = useMemo(() => latestByStudent(schoolAttitudeResults), [schoolAttitudeResults]);
  const latestFamily = useMemo(() => latestByStudent(familyProfiles), [familyProfiles]);
  const latestPrayer = useMemo(() => latestByStudent(prayerSurveyResponses), [prayerSurveyResponses]);

  const gradesByStudent = useMemo(() => {
    const grouped = new Map<string, Map<string, StudentGrade[]>>();
    for (const grade of grades) {
      if (typeof grade.calculatedAverage !== 'number' || !Number.isFinite(grade.calculatedAverage)) continue;
      const subjects = grouped.get(grade.studentId) ?? new Map<string, StudentGrade[]>();
      const records = subjects.get(grade.subject) ?? [];
      records.push(grade);
      subjects.set(grade.subject, records);
      grouped.set(grade.studentId, subjects);
    }
    return grouped;
  }, [grades]);

  const attendanceByStudent = useMemo(() => {
    const grouped = new Map<string, AttendanceRecord[]>();
    for (const record of attendanceRecords) {
      if (record.date) continue;
      const records = grouped.get(record.studentId) ?? [];
      records.push(record);
      grouped.set(record.studentId, records);
    }
    return grouped;
  }, [attendanceRecords]);

  const activityByClass = useMemo(() => {
    const grouped = new Map<string, ExtracurricularActivity[]>();
    for (const activity of extracurriculars) {
      const records = grouped.get(activity.classId) ?? [];
      records.push(activity);
      grouped.set(activity.classId, records);
    }
    return grouped;
  }, [extracurriculars]);

  const latestActivityByClass = useMemo(() => {
    const latest = new Map<string, ExtracurricularActivity>();
    for (const [classId, activities] of activityByClass) {
      const ordered = [...activities].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
      if (ordered[0]) latest.set(classId, ordered[0]);
    }
    return latest;
  }, [activityByClass]);

  const extracurricularCohort = [...latestActivityByClass.values()].map((activity) => activity.monthlyAverage);
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const visibleStudents = students.filter((student) => {
    if (selectedClassId !== 'all' && student.classId !== selectedClassId) return false;
    const fullName = `${student.firstName} ${student.lastName}`.toLocaleLowerCase();
    return !normalizedSearch || fullName.includes(normalizedSearch) || student.studentCode.toLocaleLowerCase().includes(normalizedSearch);
  });

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">پروندهٔ جامع آموزشی، پرورشی و تربیتی</h3>
          <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">وضعیت هر حوزه بر پایهٔ داده‌های ثبت‌شده نمایش داده می‌شود؛ دادهٔ ثبت‌نشده به‌عنوان ضعف دانش‌آموز تفسیر نمی‌شود.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <span className="sr-only">جستجوی دانش‌آموز</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="نام یا شماره دانش‌آموزی"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:w-56"
            />
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </label>
          <select
            aria-label="فیلتر کلاس"
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">همهٔ کلاس‌ها</option>
            {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">سبز · خوب</span>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">زرد · متوسط</span>
        <span className="rounded-full bg-rose-100 px-2.5 py-1 font-bold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">قرمز · نیازمند توجه</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">خاکستری · داده ثبت نشده</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[1260px] text-right text-xs">
          <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="p-3">دانش‌آموز</th>
              <th className="p-3">کلاس</th>
              <th className="p-3">وضعیت درسی</th>
              <th className="p-3">استعداد و یادگیری</th>
              <th className="p-3">رغبت مدرسه</th>
              <th className="p-3">رفتار و حضور</th>
              <th className="p-3">پرورشی کلاس</th>
              <th className="p-3">پرونده سلامت</th>
              <th className="p-3">نماز</th>
              <th className="p-3">کارنامه HTML</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleStudents.map((student) => {
              const schoolClass = classes.find((item) => item.id === student.classId);
              const studentSubjects = gradesByStudent.get(student.id);
              const subjectSummaries = [...(studentSubjects?.entries() ?? [])].map(([subject, records]) => ({
                subject,
                average: average(records.map((record) => record.calculatedAverage as number)),
                records,
              }));
              const academicAverage = average(subjectSummaries.flatMap((item) => item.average === null ? [] : [item.average]));
              const academicLevel = fuzzyLevel(academicAverage, 20);
              const psych = latestPsych.get(student.id);
              const schoolAttitude = latestSchoolAttitude.get(student.id);
              const talentScores = psych
                ? gardnerKeys.flatMap((key) => {
                    const score = psych.gardnerScores[key];
                    return typeof score === 'number' && Number.isFinite(score) ? [{ key, score }] : [];
                  }).sort((first, second) => second.score - first.score)
                : [];
              const attendance = attendanceByStudent.get(student.id) ?? [];
              const behaviorValues = attendance.flatMap((record) => [
                record.homeworkQuality,
                record.participation,
                record.behavior,
                record.responsibility,
                record.teamwork,
                record.rulesObservance,
                record.homeworkPercent / 20,
              ]).filter((value) => Number.isFinite(value));
              const behaviorAverage = average(behaviorValues);
              const behaviorLevel = fuzzyLevel(behaviorAverage, 5);
              const absenceCount = attendance.reduce((sum, record) => sum + record.absences, 0);
              const tardyCount = attendance.reduce((sum, record) => sum + record.tardies, 0);
              const classActivities = activityByClass.get(student.classId) ?? [];
              const latestClassActivity = latestActivityByClass.get(student.classId);
              const classActivityLevel = relativeFuzzyLevel(latestClassActivity?.monthlyAverage ?? null, extracurricularCohort);
              const family = latestFamily.get(student.id);
              const prayer = latestPrayer.get(student.id);
              const isExpanded = expandedStudentId === student.id;
              const sortedActivities = [...classActivities].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));

              return (
                <React.Fragment key={student.id}>
                  <tr className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                        className="flex items-start gap-2 text-right font-bold text-slate-900 dark:text-white"
                      >
                        {isExpanded ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0" /> : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" />}
                        <span>{student.firstName} {student.lastName}<span className="mt-1 block font-mono text-[10px] font-normal text-slate-500" dir="ltr">{student.studentCode}</span></span>
                      </button>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{schoolClass?.name || 'نامشخص'}</td>
                    <td className="max-w-[300px] p-3">
                      <div className="mb-2 flex items-center gap-2"><StatusBadge info={academicLevel} /><span className="font-bold">{academicAverage === null ? '—' : `${toPersianDigits(academicAverage.toFixed(1))} از ۲۰`}</span></div>
                      <div className="flex flex-wrap gap-1">
                        {subjectSummaries.length ? subjectSummaries.map(({ subject, average: score }) => (
                          <span key={subject} className={`rounded px-1.5 py-1 text-[10px] ${fuzzyLevel(score, 20).className}`}>{subject}: {toPersianDigits(score?.toFixed(1) ?? '—')}</span>
                        )) : <StatusBadge info={fuzzyLevel(null, 20)} />}
                      </div>
                    </td>
                    <td className="p-3">
                      {psych ? (
                        <div className="space-y-1.5">
                          <StatusBadge info={talentScores.length >= 6 ? makeLevel('good', 'آزمون کامل') : makeLevel('medium', 'آزمون ناقص')} />
                          <div className="max-w-48 text-[10px] leading-5 text-slate-600 dark:text-slate-300">
                            {talentScores.slice(0, 2).map(({ key, score }) => `${GARDNER_TITLES[key].fa} ${toPersianDigits(score)}`).join(' · ')}
                            <br />هالند {psych.hollandCode} · {psych.learningStyle}
                          </div>
                        </div>
                      ) : <StatusBadge info={makeLevel('missing', 'آزمون ثبت نشده')} />}
                    </td>
                    <td className="p-3">
                      {schoolAttitude ? (
                        <div className="space-y-1">
                          <StatusBadge info={makeLevel('medium', `میانگین ${toPersianDigits(schoolAttitude.overallScore.toFixed(2))} از ۵`)} />
                          <div className="text-[10px] text-slate-500">۵ بُعد · {toPersianDigits(Object.keys(schoolAttitude.answers).length)} پاسخ</div>
                        </div>
                      ) : <StatusBadge info={makeLevel('missing', 'ثبت نشده')} />}
                    </td>
                    <td className="p-3">
                      <div className="mb-2"><StatusBadge info={behaviorLevel} /></div>
                      {attendance.length ? <div className="whitespace-nowrap text-[10px] text-slate-600 dark:text-slate-300">غیبت {toPersianDigits(absenceCount)} · تأخیر {toPersianDigits(tardyCount)}</div> : <span className="text-[10px] text-slate-500">ثبت نشده</span>}
                    </td>
                    <td className="p-3">
                      {latestClassActivity ? (
                        <div className="space-y-1.5">
                          <StatusBadge info={classActivityLevel} />
                          <div className="text-[10px] text-slate-600 dark:text-slate-300">وضعیت کلاس · {toPersianDigits(latestClassActivity.monthlyAverage.toFixed(1))}</div>
                        </div>
                      ) : <StatusBadge info={makeLevel('missing', 'فعالیتی ثبت نشده')} />}
                    </td>
                    <td className="p-3">{family ? <StatusBadge info={makeLevel('medium', 'پرونده ثبت شده')} /> : <StatusBadge info={makeLevel('missing', 'ثبت نشده')} />}</td>
                    <td className="p-3">{prayer ? <StatusBadge info={makeLevel('medium', `پاسخ · ${toPersianDigits(Object.keys(prayer.answers).length)} مورد`)} /> : <StatusBadge info={makeLevel('missing', 'پاسخ ثبت نشده')} />}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        disabled={htmlDownloadingStudentId === student.id}
                        onClick={async () => {
                          setHtmlDownloadingStudentId(student.id);
                          setHtmlError('');
                          try {
                            downloadStudentHolisticHtml({
                              student,
                              teachers,
                              className: schoolClass?.name || 'نامشخص',
                              subjects: subjectSummaries,
                              psych,
                              attendance,
                              activities: sortedActivities,
                              family,
                              prayer,
                              schoolAttitude,
                            });
                          } catch (error) {
                            console.error('Failed to generate student report HTML.', error);
                            setHtmlError(`دانلود کارنامهٔ HTML برای ${student.firstName} ${student.lastName} انجام نشد.`);
                          } finally {
                            setHtmlDownloadingStudentId(null);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-cyan-300 px-2.5 py-2 text-[10px] font-bold text-cyan-900 hover:bg-cyan-50 disabled:cursor-wait disabled:opacity-60 dark:border-cyan-800 dark:text-cyan-300 dark:hover:bg-cyan-950/40"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {htmlDownloadingStudentId === student.id ? 'در حال آماده‌سازی...' : 'دانلود کارنامه HTML'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/70 dark:bg-slate-800/30">
                      <td colSpan={10} className="p-4">
                        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                          <div className="space-y-2">
                            <h4 className="font-black text-slate-800 dark:text-slate-100">نمرات هر درس</h4>
                            {subjectSummaries.length ? subjectSummaries.map(({ subject, average: score, records }) => (
                              <div key={subject} className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
                                <div className="flex items-center justify-between gap-2"><span className="font-bold">{subject}</span><StatusBadge info={fuzzyLevel(score, 20)} /></div>
                                <div className="mt-1 text-[10px] text-slate-500">میانگین: {toPersianDigits(score?.toFixed(2) ?? '—')} · دبیر: {teachers.find((teacher) => teacher.id === records[0]?.teacherId)?.fullName || 'نامشخص'}</div>
                                <div className="mt-1 text-[10px] text-slate-500">میان‌ترم {toPersianDigits(records[0]?.midterm ?? '—')} · پایان‌ترم {toPersianDigits(records[0]?.final ?? '—')} · مستمر {toPersianDigits(records[0]?.continuous ?? '—')}</div>
                              </div>
                            )) : <p className="text-xs text-slate-500">هنوز نمره‌ای ثبت نشده است.</p>}
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-black text-slate-800 dark:text-slate-100">هشت هوش گاردنر و شناخت فردی</h4>
                            {psych ? (
                              <>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {gardnerKeys.map((key) => (
                                    <div key={key} className="flex items-center justify-between gap-1 rounded-lg bg-white px-2 py-1.5 text-[10px] dark:bg-slate-900">
                                      <span>{GARDNER_TITLES[key].fa}</span><span className="font-mono font-bold">{toPersianDigits(psych.gardnerScores[key])}/۱۰</span>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-[10px] leading-5 text-slate-600 dark:text-slate-300">کد هالند: {psych.hollandCode} · سبک یادگیری: {psych.learningStyle} · تیپ شخصیتی: {psych.personalityType}</p>
                                <p className="text-[10px] leading-5 text-slate-600 dark:text-slate-300">علایق هالند: {[...Object.entries(psych.hollandScores)].sort((first, second) => second[1] - first[1]).slice(0, 3).map(([key, score]) => `${HOLLAND_TITLES[key]?.fa || key} ${toPersianDigits(score)}`).join(' · ')}</p>
                              </>
                            ) : <p className="text-xs text-slate-500">آزمون استعداد و شخصیت ثبت نشده است.</p>}
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-black text-slate-800 dark:text-slate-100">رغبت و نگرش به مدرسه</h4>
                            {schoolAttitude ? (
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold text-cyan-800 dark:text-cyan-300">میانگین کل: {toPersianDigits(schoolAttitude.overallScore.toFixed(2))} از ۵ · تاریخ: {toPersianDigits(new Date(schoolAttitude.completedAt).toLocaleDateString('fa-IR'))}</p>
                                {SCHOOL_ATTITUDE_DOMAINS.map((domain) => (
                                  <div key={domain.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 text-[10px] dark:bg-slate-900">
                                    <span>{domain.label}</span><strong>{toPersianDigits(schoolAttitude.domainScores[domain.id].toFixed(2))} از ۵</strong>
                                  </div>
                                ))}
                                <p className="text-[10px] leading-5 text-slate-500">نسخهٔ تألیفی و غیرهنجاریابی‌شده؛ برای گفت‌وگوی آموزشی.</p>
                              </div>
                            ) : <p className="text-xs text-slate-500">آزمون رغبت‌سنجی مدرسه ثبت نشده است.</p>}
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-black text-slate-800 dark:text-slate-100">حضور و شاخص‌های رفتاری</h4>
                            {attendance.length ? attendance.map((record) => (
                              <div key={record.id} className="rounded-lg border border-slate-200 bg-white p-2.5 text-[10px] dark:border-slate-700 dark:bg-slate-900">
                                <div className="mb-1 font-bold">{record.month} · غیبت {toPersianDigits(record.absences)} · تأخیر {toPersianDigits(record.tardies)}</div>
                                <div className="text-slate-600 dark:text-slate-300">تکلیف {toPersianDigits(record.homeworkPercent)}٪ · مشارکت {toPersianDigits(record.participation)}/۵ · رفتار {toPersianDigits(record.behavior)}/۵ · مسئولیت‌پذیری {toPersianDigits(record.responsibility)}/۵ · همکاری {toPersianDigits(record.teamwork)}/۵ · رعایت قوانین {toPersianDigits(record.rulesObservance)}/۵</div>
                              </div>
                            )) : <p className="text-xs text-slate-500">رکورد حضور و رفتار ثبت نشده است.</p>}
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-black text-slate-800 dark:text-slate-100">فعالیت‌های پرورشی کلاس</h4>
                            {sortedActivities.length ? sortedActivities.map((activity) => (
                              <div key={activity.id} className="rounded-lg border border-slate-200 bg-white p-2.5 text-[10px] dark:border-slate-700 dark:bg-slate-900">
                                <div className="mb-1 font-bold">{activity.month} · میانگین کلاس {toPersianDigits(activity.monthlyAverage.toFixed(1))}</div>
                                <div className="text-slate-600 dark:text-slate-300">هنری {toPersianDigits(activity.artistic)} · ورزشی {toPersianDigits(activity.sports)} · مهارتی {toPersianDigits(activity.skills)} · علمی {toPersianDigits(activity.scientific)}</div>
                              </div>
                            )) : <p className="text-xs text-slate-500">فعالیت پرورشی برای این کلاس ثبت نشده است.</p>}
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-black text-slate-800 dark:text-slate-100">سلامت و سبک زندگی</h4>
                            {family ? (
                              <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-[10px] leading-5 dark:border-slate-700 dark:bg-slate-900">
                                <div>BMI ثبت‌شده: {toPersianDigits(family.calculatedBmi.toFixed(1))} · خواب: {family.sleepHour} ساعت · زمان نمایشگر: {toPersianDigits(family.screenTimeHours)} ساعت</div>
                                <div>وعده صبحانه: {family.breakfastStatus} · وضعیت بینایی/شنوایی: {family.hasVisionHearingIssue ? family.sensoryIssueDetails || 'نیازمند پیگیری' : 'گزارش نشده'}</div>
                                <div className="text-slate-500">BMI دانش‌آموزان باید با نمودار رشد متناسب با سن و جنس تفسیر شود.</div>
                              </div>
                            ) : <p className="text-xs text-slate-500">پرونده سلامت و خانواده ثبت نشده است.</p>}
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-black text-slate-800 dark:text-slate-100">پرسشنامه نماز</h4>
                            {prayer ? <p className="rounded-lg bg-white p-2.5 text-[10px] text-slate-600 dark:bg-slate-900 dark:text-slate-300">پاسخ ثبت شده: {toPersianDigits(Object.keys(prayer.answers).length)} از {toPersianDigits(PRAYER_SURVEY_QUESTIONS.length)} پرسش · پاسخ‌های شخصی در این جدول خلاصه نمی‌شوند.</p> : <p className="text-xs text-slate-500">پاسخی ثبت نشده است.</p>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {visibleStudents.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-slate-500">دانش‌آموزی با این فیلتر پیدا نشد.</td></tr>}
          </tbody>
        </table>
      </div>
      {htmlError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">{htmlError}</p>}
      <p className="text-[10px] leading-5 text-slate-500 dark:text-slate-400">فعالیت‌های فوق‌برنامه در داده‌های سامانه به کلاس تعلق دارند و به‌عنوان عملکرد فردی دانش‌آموز تفسیر نمی‌شوند.</p>
    </section>
  );
};