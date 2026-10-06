export type PrayerSurveyCategory = 'student_motivation' | 'environment' | 'staff_participation' | 'parents';

export interface PrayerSurveyQuestion {
  id: string;
  prompt: string;
  category: PrayerSurveyCategory;
  options: string[];
}

export const PRAYER_SURVEY_QUESTIONS: PrayerSurveyQuestion[] = [
  {
    id: 'attendance_rate',
    prompt: 'به نظر شما، میانگین درصد حضور دانش‌آموزان در نماز جماعت مدرسه در روزهای برگزاری چقدر است؟',
    category: 'student_motivation',
    options: ['بیشتر از ۶۰٪ دانش‌آموزان', 'بین ۳۰٪ تا ۶۰٪ دانش‌آموزان', 'بین ۱۰٪ تا ۳۰٪ دانش‌آموزان', 'کمتر از ۱۰٪ دانش‌آموزان'],
  },
  {
    id: 'belief_peace_success',
    prompt: 'تا چه اندازه باور دارید که نماز باعث آرامش و موفقیت است؟',
    category: 'student_motivation',
    options: ['کاملاً باور دارم', 'تا حد زیادی باور دارم', 'تا حدی باور دارم', 'باور چندانی ندارم'],
  },
  {
    id: 'prayer_reason',
    prompt: 'مهم‌ترین دلیل شما برای نماز خواندن چیست؟',
    category: 'student_motivation',
    options: ['باور قلبی به واجب بودن', 'احساس آرامش شخصی', 'انتظار خانواده/مدرسه', 'اجبار یا عادت'],
  },
  {
    id: 'active_students_feeling',
    prompt: 'چه احساسی نسبت به دانش‌آموزان فعال در نماز دارید؟',
    category: 'student_motivation',
    options: ['الگو می‌دانم و ترغیب می‌شوم', 'مثبت ولی بی‌تفاوت', 'بی‌تفاوت', 'بی‌علاقه یا منفی'],
  },
  {
    id: 'prayer_space_cleanliness',
    prompt: 'نظافت و دمای فضای نماز و وضوخانه چگونه است؟',
    category: 'environment',
    options: ['بسیار عالی', 'خوب و قابل قبول', 'معمولی', 'نامناسب'],
  },
  {
    id: 'ablution_access',
    prompt: 'آیا امکانات وضو کافی است؟',
    category: 'environment',
    options: ['همیشه بدون انتظار وضو می‌گیرم', 'معمولاً به راحتی وضو می‌گیرم', 'گاهی باید منتظر بمانم', 'اغلب با صف یا مشکل مواجه‌ام'],
  },
  {
    id: 'prayer_space_attraction',
    prompt: 'زیبایی و فضای نمازخانه چقدر شما را جذب می‌کند؟',
    category: 'environment',
    options: ['بسیار شوق‌انگیز', 'خوب و دلپذیر', 'معمولی', 'بی‌روح یا نامطلوب'],
  },
  {
    id: 'managers_presence',
    prompt: 'حضور مدیر و معاونان در نماز جماعت چطور است؟',
    category: 'staff_participation',
    options: ['همیشه حضور دارند', 'بیشتر اوقات', 'گاهی', 'به ندرت یا هرگز'],
  },
  {
    id: 'teachers_presence',
    prompt: 'حضور معلمان در نماز جماعت چطور است؟',
    category: 'staff_participation',
    options: ['تقریباً همه حضور دارند', 'بیشتر معلمان', 'تعداد کمی', 'تقریباً هیچ‌کس'],
  },
  {
    id: 'parents_followup',
    prompt: 'والدین شما چقدر درباره نماز خواندن سؤال یا تشویق می‌کنند؟',
    category: 'parents',
    options: ['همیشه پیگیر هستند', 'اغلب پیگیرند', 'به‌ندرت', 'بی‌تفاوت هستند'],
  },
  {
    id: 'prayer_voluntary',
    prompt: 'نماز جماعت در مدرسه چقدر اختیاری است؟',
    category: 'student_motivation',
    options: ['کاملاً اختیاری', 'نیمه‌اجباری', 'بیشتر اجباری', 'کاملاً اجباری'],
  },
  {
    id: 'response_pressure',
    prompt: 'آیا مدیر یا معاون برای پاسخ مثبت فشار داشتند؟',
    category: 'student_motivation',
    options: ['هیچ فشاری نبود', 'توصیه‌ی ملایم', 'انتظار ضمنی', 'فشار مستقیم'],
  },
];

export const PRAYER_SURVEY_CATEGORY_LABELS: Record<PrayerSurveyCategory, string> = {
  environment: 'وضعیت جذابیت محیطی',
  staff_participation: 'حضور و مشارکت کادر نماز جماعت',
  student_motivation: 'وضعیت انگیزه دانش‌آموزی',
  parents: 'وضعیت والدین',
};

export function getPrayerSurveyScore(answerIndex: number): number {
  return Math.max(0, Math.min(100, 100 - answerIndex * 25));
}
