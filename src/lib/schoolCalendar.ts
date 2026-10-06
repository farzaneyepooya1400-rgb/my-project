export type OccasionKind = 'national' | 'religious' | 'historical';

export interface CalendarOccasion {
  month: number;
  day: number;
  title: string;
  kind: OccasionKind;
  variableDate?: boolean;
}

export const SCHOOL_CALENDAR_YEARS = Array.from({ length: 11 }, (_, index) => 1405 + index);

export const SCHOOL_CALENDAR_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const CALENDAR_OCCASIONS: CalendarOccasion[] = [
  { month: 1, day: 1, title: 'نوروز و آغاز سال نو', kind: 'national' },
  { month: 1, day: 12, title: 'روز جمهوری اسلامی ایران', kind: 'national' },
  { month: 1, day: 13, title: 'روز طبیعت', kind: 'national' },
  { month: 2, day: 12, title: 'روز معلم', kind: 'national' },
  { month: 3, day: 14, title: 'رحلت امام خمینی (ره)', kind: 'historical' },
  { month: 3, day: 15, title: 'قیام پانزده خرداد', kind: 'historical' },
  { month: 6, day: 31, title: 'روز صنعت دفاعی', kind: 'national' },
  { month: 7, day: 1, title: 'بازگشایی مدارس و آغاز سال تحصیلی', kind: 'national' },
  { month: 8, day: 13, title: 'روز دانش‌آموز و مبارزه با استکبار جهانی', kind: 'historical' },
  { month: 9, day: 16, title: 'روز دانشجو', kind: 'historical' },
  { month: 10, day: 9, title: 'روز بصیرت و میثاق امت با ولایت', kind: 'historical' },
  { month: 11, day: 22, title: 'پیروزی انقلاب اسلامی ایران', kind: 'historical' },
  { month: 12, day: 22, title: 'روز بزرگداشت شهدا', kind: 'historical' },
  { month: 1, day: 10, title: 'دهه کرامت و مناسبت‌های رضوی', kind: 'religious', variableDate: true },
  { month: 2, day: 27, title: 'مبعث پیامبر اکرم (ص)', kind: 'religious', variableDate: true },
  { month: 4, day: 18, title: 'عید سعید غدیر خم', kind: 'religious', variableDate: true },
  { month: 6, day: 10, title: 'عاشورا و تاسوعای حسینی', kind: 'religious', variableDate: true },
  { month: 9, day: 17, title: 'میلاد حضرت زهرا (س) و روز مادر', kind: 'religious', variableDate: true },
];

export function getOccasionsForYear(year: number): Array<CalendarOccasion & { date: string }> {
  return CALENDAR_OCCASIONS.map((occasion) => ({
    ...occasion,
    date: `${year}/${String(occasion.month).padStart(2, '0')}/${String(occasion.day).padStart(2, '0')}`,
  }));
}

export const OCCASION_STYLES: Record<OccasionKind, { label: string; className: string }> = {
  national: { label: 'ملی', className: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
  religious: { label: 'مذهبی', className: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
  historical: { label: 'تاریخی', className: 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300' },
};
