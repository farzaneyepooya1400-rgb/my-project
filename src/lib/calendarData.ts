export type CalendarEventKind = 'national' | 'religious' | 'historical' | 'school';

export interface CalendarOccasion {
  id: string;
  date: string;
  title: string;
  kind: Exclude<CalendarEventKind, 'school'>;
  description: string;
  important?: boolean;
}

const annualOccasions: Array<Omit<CalendarOccasion, 'id' | 'date'> & { month: number; day: number }> = [
  { month: 1, day: 1, title: 'نوروز', kind: 'national', description: 'آغاز سال نو و تعطیلات نوروزی', important: true },
  { month: 1, day: 12, title: 'روز جمهوری اسلامی ایران', kind: 'national', description: 'مناسبت ملی', important: true },
  { month: 1, day: 13, title: 'روز طبیعت', kind: 'national', description: 'مناسبت ملی و محیط‌زیستی', important: true },
  { month: 2, day: 2, title: 'روز تأسیس سپاه پاسداران', kind: 'historical', description: 'مناسبت تاریخی جمهوری اسلامی' },
  { month: 2, day: 12, title: 'روز معلم', kind: 'national', description: 'گرامیداشت مقام معلم', important: true },
  { month: 3, day: 3, title: 'سالروز آزادسازی خرمشهر', kind: 'historical', description: 'روز مقاومت، ایثار و پیروزی', important: true },
  { month: 3, day: 14, title: 'رحلت امام خمینی (ره)', kind: 'historical', description: 'مناسبت تاریخی' },
  { month: 3, day: 15, title: 'قیام ۱۵ خرداد', kind: 'historical', description: 'مناسبت تاریخی' },
  { month: 6, day: 31, title: 'آغاز هفته دفاع مقدس', kind: 'historical', description: 'آغاز برنامه‌های گرامیداشت دفاع مقدس', important: true },
  { month: 8, day: 13, title: 'روز دانش‌آموز', kind: 'national', description: 'روز مبارزه با استکبار جهانی', important: true },
  { month: 9, day: 16, title: 'روز دانشجو', kind: 'historical', description: 'مناسبت تاریخی و فرهنگی' },
  { month: 10, day: 20, title: 'ولادت حضرت فاطمه زهرا (س)', kind: 'religious', description: 'مناسبت مذهبی؛ تاریخ قمری در تقویم رسمی کنترل شود', important: true },
  { month: 10, day: 22, title: 'سالروز پیروزی انقلاب اسلامی', kind: 'national', description: 'مناسبت ملی', important: true },
  { month: 11, day: 15, title: 'ولادت امام علی (ع)', kind: 'religious', description: 'مناسبت مذهبی؛ تاریخ قمری در تقویم رسمی کنترل شود' },
  { month: 12, day: 29, title: 'روز ملی شدن صنعت نفت', kind: 'historical', description: 'مناسبت تاریخی', important: true },
];

export function getCalendarOccasions(year: number, month: number): CalendarOccasion[] {
  return annualOccasions
    .filter((occasion) => occasion.month === month)
    .map((occasion) => ({
      ...occasion,
      id: `occasion_${year}_${occasion.month}_${occasion.day}_${occasion.title}`,
      date: `${year}/${String(occasion.month).padStart(2, '0')}/${String(occasion.day).padStart(2, '0')}`,
    }));
}
