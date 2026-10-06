export type CurriculumTrack =
  | 'general'
  | 'math'
  | 'experimental'
  | 'humanities'
  | 'islamic_studies'
  | 'vocational_network'
  | 'karadanesh';

export interface CurriculumSubject {
  name: string;
  category: 'عمومی' | 'تخصصی' | 'شایستگی پایه' | 'شایستگی فنی' | 'شایستگی غیرفنی' | 'مهارتی';
  suggestedCoefficient: number;
}

const subject = (
  name: string,
  category: CurriculumSubject['category'],
  suggestedCoefficient: number
): CurriculumSubject => ({ name, category, suggestedCoefficient });

const primarySubjects = [
  subject('فارسی', 'عمومی', 1.05),
  subject('نگارش فارسی', 'عمومی', 1.00),
  subject('ریاضی', 'تخصصی', 1.15),
  subject('علوم تجربی', 'تخصصی', 1.10),
  subject('قرآن', 'عمومی', 0.95),
  subject('هدیه‌های آسمان', 'عمومی', 0.90),
  subject('مطالعات اجتماعی', 'عمومی', 0.95),
  subject('تربیت بدنی', 'عمومی', 0.85),
];

const middleFirstSubjects = [
  subject('فارسی', 'عمومی', 1.05),
  subject('نگارش', 'عمومی', 1.00),
  subject('ریاضی', 'تخصصی', 1.20),
  subject('علوم تجربی', 'تخصصی', 1.10),
  subject('مطالعات اجتماعی', 'عمومی', 0.95),
  subject('عربی، زبان قرآن', 'عمومی', 1.05),
  subject('قرآن', 'عمومی', 0.95),
  subject('پیام‌های آسمان', 'عمومی', 0.95),
  subject('زبان انگلیسی', 'عمومی', 1.05),
  subject('فرهنگ و هنر', 'عمومی', 0.90),
  subject('کار و فناوری', 'عمومی', 0.95),
  subject('تربیت بدنی', 'عمومی', 0.85),
];

const middleThirdSubjects = [...middleFirstSubjects.slice(0, -1), subject('آمادگی دفاعی', 'عمومی', 0.95), subject('تربیت بدنی', 'عمومی', 0.85)];

const secondaryCommon = (grade: number): CurriculumSubject[] => [
  subject(`تعلیمات دینی ${grade - 9}`, 'عمومی', 0.95),
  subject(`عربی، زبان قرآن ${grade - 9}`, 'عمومی', 1.05),
  subject(`فارسی ${grade - 9}`, 'عمومی', 1.05),
  subject(`نگارش ${grade - 9}`, 'عمومی', 1.00),
  subject(`زبان خارجی ${grade - 9}`, 'عمومی', 1.05),
  subject(grade === 10 ? 'جغرافیای عمومی و استان‌شناسی' : grade === 11 ? 'تاریخ معاصر' : 'علوم اجتماعی', 'عمومی', 0.95),
  subject(`تربیت بدنی ${grade - 9}`, 'عمومی', 0.85),
  ...(grade === 10 ? [subject('آمادگی دفاعی', 'عمومی', 0.95)] : []),
  ...(grade === 11 ? [subject('انسان و محیط زیست', 'عمومی', 0.95)] : []),
  ...(grade === 12 ? [subject('سلامت و بهداشت', 'عمومی', 0.95), subject('مدیریت خانواده و سبک زندگی', 'عمومی', 0.90)] : []),
  subject('درس انتخابی', 'عمومی', 0.90),
];

const secondaryTracks: Record<Exclude<CurriculumTrack, 'general'>, (grade: number) => CurriculumSubject[]> = {
  math: (grade) => [
    subject(grade === 10 ? 'ریاضی ۱' : grade === 11 ? 'حسابان ۱' : 'حسابان ۲', 'تخصصی', 1.25),
    subject(grade === 11 ? 'هندسه ۲' : grade === 12 ? 'هندسه ۳' : 'هندسه ۱', 'تخصصی', 1.20),
    ...(grade >= 11 ? [subject(grade === 11 ? 'آمار و احتمال' : 'ریاضیات گسسته', 'تخصصی', 1.20)] : []),
    subject(`فیزیک ${grade - 9}`, 'تخصصی', 1.20),
    subject(`شیمی ${grade - 9}`, 'تخصصی', 1.10),
    ...(grade < 12 ? [subject(`آزمایشگاه علوم تجربی ${grade - 9}`, 'شایستگی پایه', 1.00)] : []),
  ],
  experimental: (grade) => [
    subject(`ریاضی ${grade - 9}`, 'تخصصی', 1.20),
    subject(`فیزیک ${grade - 9}`, 'تخصصی', 1.15),
    subject(`شیمی ${grade - 9}`, 'تخصصی', 1.10),
    subject(`زیست‌شناسی ${grade - 9}`, 'تخصصی', 1.25),
    ...(grade === 12 ? [subject('زمین‌شناسی', 'تخصصی', 1.05)] : []),
    ...(grade < 12 ? [subject(`آزمایشگاه علوم تجربی ${grade - 9}`, 'شایستگی پایه', 1.00)] : []),
  ],
  humanities: (grade) => [
    subject(`ریاضی و آمار ${grade - 9}`, 'تخصصی', 1.10),
    ...(grade === 10 ? [subject('اقتصاد', 'تخصصی', 1.05), subject('منطق', 'تخصصی', 1.10), subject('روان‌شناسی', 'تخصصی', 1.00)] : []),
    subject(`تاریخ ${grade - 9}`, 'تخصصی', 0.95),
    subject(`جامعه‌شناسی ${grade - 9}`, 'تخصصی', 1.00),
    subject(`جغرافیا ${grade - 9}`, 'تخصصی', 0.95),
    subject(`علوم و فنون ادبی ${grade - 9}`, 'تخصصی', 1.10),
    ...(grade === 11 ? [subject('فلسفه ۱', 'تخصصی', 1.10), subject('روان‌شناسی', 'تخصصی', 1.00)] : []),
    ...(grade === 12 ? [subject('فلسفه ۲', 'تخصصی', 1.10)] : []),
  ],
  islamic_studies: (grade) => [
    subject(`علوم و معارف قرآنی ${grade - 9}`, 'تخصصی', 1.10),
    subject(`عربی، زبان تخصصی رشته ${grade - 9}`, 'تخصصی', 1.10),
    subject(`علوم و فنون ادبی ${grade - 9}`, 'تخصصی', 1.05),
    subject(`ریاضی و آمار ${grade - 9}`, 'شایستگی پایه', 1.05),
    subject(`تاریخ ${grade - 9} تخصصی`, 'تخصصی', 0.95),
    subject(grade === 10 ? 'منطق' : grade === 11 ? 'فلسفه ۱' : 'فلسفه ۲', 'تخصصی', 1.10),
    ...(grade === 11 ? [subject('مطالعات فرهنگی', 'تخصصی', 0.95), subject('جریان‌شناسی اندیشه‌های معاصر', 'تخصصی', 1.00)] : []),
    ...(grade === 12 ? [subject('روان‌شناسی', 'تخصصی', 1.00)] : []),
  ],
  vocational_network: (grade) => [
    subject('ریاضی', 'شایستگی پایه', 1.05),
    ...(grade === 10 ? [subject('فیزیک', 'شایستگی پایه', 1.00)] : []),
    ...(grade === 11 ? [subject('شیمی', 'شایستگی پایه', 1.00)] : []),
    subject('الزامات محیط کار', 'شایستگی غیرفنی', 0.90),
    subject(grade === 10 ? 'دانش فنی پایه ـ شبکه و نرم‌افزار رایانه' : 'دانش فنی تخصصی ـ شبکه و نرم‌افزار رایانه', 'شایستگی فنی', 1.15),
    ...(grade === 10 ? [subject('نصب و راه‌اندازی سیستم‌های رایانه‌ای', 'شایستگی فنی', 1.10), subject('تولید محتوای الکترونیک و برنامه‌سازی', 'شایستگی فنی', 1.20)] : []),
    ...(grade === 11 ? [subject('توسعه برنامه‌سازی و پایگاه داده', 'شایستگی فنی', 1.25), subject('پیاده‌سازی سیستم‌های اطلاعاتی و طراحی وب', 'شایستگی فنی', 1.20)] : []),
    ...(grade === 12 ? [subject('نصب و نگهداری تجهیزات شبکه و سخت‌افزار', 'شایستگی فنی', 1.20), subject('تجارت الکترونیک و امنیت شبکه', 'شایستگی فنی', 1.25), subject('کارآموزی', 'مهارتی', 1.00)] : []),
  ],
  karadanesh: (grade) => [
    subject('ریاضی', 'شایستگی پایه', 1.00),
    subject('فیزیک', 'شایستگی پایه', 0.95),
    subject('الزامات محیط کار', 'شایستگی غیرفنی', 0.90),
    subject('کارگاه نوآوری و کارآفرینی', 'شایستگی غیرفنی', 0.95),
    subject('اخلاق حرفه‌ای', 'شایستگی غیرفنی', 0.90),
    subject(grade === 10 ? 'مهارت‌های شغلی پایه' : grade === 11 ? 'مهارت‌های شغلی تخصصی' : 'پروژه مهارتی', 'مهارتی', 1.15),
  ],
};

export function getCurriculumSubjects(gradeOrder: number, track: CurriculumTrack = 'general'): CurriculumSubject[] {
  if (gradeOrder <= 1) return primarySubjects.filter((item) => item.name !== 'مطالعات اجتماعی');
  if (gradeOrder <= 6) return primarySubjects;
  if (gradeOrder === 7 || gradeOrder === 8) return middleFirstSubjects;
  if (gradeOrder === 9) return middleThirdSubjects;
  if (track === 'general') return secondaryCommon(gradeOrder);
  return [...secondaryCommon(gradeOrder), ...secondaryTracks[track](gradeOrder)];
}

export function getSuggestedCoefficient(subjectName: string, gradeOrder: number, track: CurriculumTrack = 'general'): number {
  return getCurriculumSubjects(gradeOrder, track).find((item) => item.name === subjectName)?.suggestedCoefficient ?? 1;
}
