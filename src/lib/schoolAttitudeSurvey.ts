import type { SchoolAttitudeDomain } from '../types';

export const SCHOOL_ATTITUDE_DOMAINS: { id: SchoolAttitudeDomain; label: string; description: string }[] = [
  {
    id: 'academicSelfPerception',
    label: 'برداشت از توانایی تحصیلی',
    description: 'باور دانش‌آموز به توانایی خود برای یادگیری و موفقیت در درس‌ها',
  },
  {
    id: 'attitudesTowardTeachers',
    label: 'نگرش به دبیران',
    description: 'تجربهٔ دانش‌آموز از حمایت، احترام و دسترس‌پذیری دبیران',
  },
  {
    id: 'attitudesTowardSchool',
    label: 'نگرش به مدرسه',
    description: 'احساس تعلق، امنیت و ارزشمندی حضور در مدرسه',
  },
  {
    id: 'goalValuation',
    label: 'ارزش‌گذاری هدف‌های تحصیلی',
    description: 'درک دانش‌آموز از فایدهٔ یادگیری و پیوند آن با هدف‌های آینده',
  },
  {
    id: 'motivationSelfRegulation',
    label: 'انگیزش و خودتنظیمی',
    description: 'پشتکار، برنامه‌ریزی و پیگیری مسئولانهٔ فعالیت‌های درسی',
  },
];

export const SCHOOL_ATTITUDE_QUESTIONS: { id: string; domain: SchoolAttitudeDomain; text: string }[] = [
  { id: 'academic_1', domain: 'academicSelfPerception', text: 'می‌توانم مطالب بیشتر درس‌ها را با تمرین یاد بگیرم.' },
  { id: 'academic_2', domain: 'academicSelfPerception', text: 'وقتی درس دشوار می‌شود، معمولاً راهی برای فهمیدن آن پیدا می‌کنم.' },
  { id: 'academic_3', domain: 'academicSelfPerception', text: 'از انجام تکلیف‌های درسی که به تلاش نیاز دارند برمی‌آیم.' },
  { id: 'academic_4', domain: 'academicSelfPerception', text: 'در کلاس توانایی دنبال‌کردن و فهمیدن درس را دارم.' },
  { id: 'academic_5', domain: 'academicSelfPerception', text: 'با برنامه‌ریزی و کمک‌گرفتن می‌توانم در درس‌ها پیشرفت کنم.' },

  { id: 'teachers_1', domain: 'attitudesTowardTeachers', text: 'دبیران به پرسش‌های من با حوصله پاسخ می‌دهند.' },
  { id: 'teachers_2', domain: 'attitudesTowardTeachers', text: 'در کلاس می‌توانم بدون نگرانی از اشتباه‌کردن سؤال بپرسم.' },
  { id: 'teachers_3', domain: 'attitudesTowardTeachers', text: 'دبیران برای بهترشدن یادگیری‌ام بازخورد مفید می‌دهند.' },
  { id: 'teachers_4', domain: 'attitudesTowardTeachers', text: 'احساس می‌کنم دبیران با دانش‌آموزان منصفانه رفتار می‌کنند.' },
  { id: 'teachers_5', domain: 'attitudesTowardTeachers', text: 'وقتی در یادگیری به مشکل می‌خورم، می‌توانم از دبیران کمک بگیرم.' },

  { id: 'school_1', domain: 'attitudesTowardSchool', text: 'در مدرسه احساس امنیت و آرامش می‌کنم.' },
  { id: 'school_2', domain: 'attitudesTowardSchool', text: 'احساس می‌کنم به جمع دانش‌آموزان مدرسه تعلق دارم.' },
  { id: 'school_3', domain: 'attitudesTowardSchool', text: 'حضور در مدرسه برای من تجربه‌ای ارزشمند است.' },
  { id: 'school_4', domain: 'attitudesTowardSchool', text: 'در مدرسه فرصت دارم نظر و توانایی خود را نشان دهم.' },
  { id: 'school_5', domain: 'attitudesTowardSchool', text: 'از اینکه دانش‌آموز این مدرسه هستم احساس خوبی دارم.' },

  { id: 'goals_1', domain: 'goalValuation', text: 'یادگیری درس‌های مدرسه به هدف‌های آیندهٔ من کمک می‌کند.' },
  { id: 'goals_2', domain: 'goalValuation', text: 'دانش و مهارت‌هایی که در مدرسه می‌آموزم در زندگی من کاربرد دارند.' },
  { id: 'goals_3', domain: 'goalValuation', text: 'تمام‌کردن دورهٔ تحصیلی برای آیندهٔ من اهمیت دارد.' },
  { id: 'goals_4', domain: 'goalValuation', text: 'برای یادگیری موضوع‌هایی که به آن‌ها علاقه دارم وقت می‌گذارم.' },
  { id: 'goals_5', domain: 'goalValuation', text: 'پیشرفت تحصیلی می‌تواند انتخاب‌های آیندهٔ من را بیشتر کند.' },

  { id: 'motivation_1', domain: 'motivationSelfRegulation', text: 'برای انجام تکلیف‌ها و آماده‌شدن برای کلاس برنامه‌ریزی می‌کنم.' },
  { id: 'motivation_2', domain: 'motivationSelfRegulation', text: 'کارهای درسی را معمولاً تا زمان تعیین‌شده پیگیری می‌کنم.' },
  { id: 'motivation_3', domain: 'motivationSelfRegulation', text: 'اگر درسی سخت باشد، پیش از کنارگذاشتن آن چند راه را امتحان می‌کنم.' },
  { id: 'motivation_4', domain: 'motivationSelfRegulation', text: 'هنگام مطالعه می‌توانم حواسم را به کار درسی برگردانم.' },
  { id: 'motivation_5', domain: 'motivationSelfRegulation', text: 'بعد از دریافت بازخورد، برای بهترشدن کار درسی‌ام اقدام می‌کنم.' },
];

export const SCHOOL_ATTITUDE_OPTIONS = [
  { value: 1, label: 'کاملاً مخالفم' },
  { value: 2, label: 'مخالفم' },
  { value: 3, label: 'نه موافقم، نه مخالف' },
  { value: 4, label: 'موافقم' },
  { value: 5, label: 'کاملاً موافقم' },
] as const;

export const calculateSchoolAttitudeScores = (answers: Record<string, number>) => {
  const domainScores = Object.fromEntries(SCHOOL_ATTITUDE_DOMAINS.map((domain) => {
    const domainQuestions = SCHOOL_ATTITUDE_QUESTIONS.filter((question) => question.domain === domain.id);
    const total = domainQuestions.reduce((sum, question) => sum + answers[question.id], 0);
    return [domain.id, Math.round((total / domainQuestions.length) * 100) / 100];
  })) as Record<SchoolAttitudeDomain, number>;
  const overallScore = Math.round(
    (Object.values(domainScores).reduce((sum, score) => sum + score, 0) / SCHOOL_ATTITUDE_DOMAINS.length) * 100
  ) / 100;

  return { domainScores, overallScore };
};