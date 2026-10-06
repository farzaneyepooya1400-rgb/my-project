import { AttendanceRecord, GardnerScores, HollandScores, StudentGrade, VarkScores } from '../types';
import { toPersianDigits } from './persianUtils';

export interface QuestionItem {
  id: string;
  category: 'gardner' | 'holland' | 'learningStyle' | 'vark' | 'personality';
  subCategory: string; // e.g. 'verbal', 'R', 'دیداری', 'برون‌گرا'
  text: string;
}

export const PSYCH_QUESTIONS: QuestionItem[] = [
  // هوش‌های چندگانه گاردنر (۸ هوش)
  { id: 'g_verbal_1', category: 'gardner', subCategory: 'verbal', text: 'نوشتن داستان، مقاله، شعر یا خواندن کتاب برایم لذت‌بخش و آسان است.' },
  { id: 'g_verbal_2', category: 'gardner', subCategory: 'verbal', text: 'هنگام بحث یا توضیح یک موضوع، کلمات مناسب را سریع پیدا می‌کنم.' },
  { id: 'g_logical_1', category: 'gardner', subCategory: 'logical', text: 'حل معماهای ریاضی، بازی‌های فکری و محاسبات ذهنی را دوست دارم.' },
  { id: 'g_logical_2', category: 'gardner', subCategory: 'logical', text: 'علاقه‌مندم دلایل منطقی و روابط علت و معلولی پدیده‌ها را کشف کنم.' },
  { id: 'g_spatial_1', category: 'gardner', subCategory: 'spatial', text: 'نقشه‌ها، نمودارها، طراحی سه‌بعدی و جهت‌یابی در فضاهای جدید برایم راحت است.' },
  { id: 'g_spatial_2', category: 'gardner', subCategory: 'spatial', text: 'هنگام تفکر معمولاً تصاویر و صحنه‌ها را در ذهن خود تجسم می‌کنم.' },
  { id: 'g_musical_1', category: 'gardner', subCategory: 'musical', text: 'ریتم‌ها، ملودی‌ها و تغییرات لحن صدا را خیلی زود متوجه می‌شوم.' },
  { id: 'g_musical_2', category: 'gardner', subCategory: 'musical', text: 'زمزمه کردن، نواختن ساز یا گوش دادن دقیق به موسیقی در تمرکز من مؤثر است.' },
  { id: 'g_bodily_1', category: 'gardner', subCategory: 'bodily', text: 'یادگیری با حرکت، ورزش، ساخت کاردستی و فعالیت‌های بدنی را ترجیح می‌دهم.' },
  { id: 'g_bodily_2', category: 'gardner', subCategory: 'bodily', text: 'نمی‌توانم برای مدت طولانی بی‌حرکت پشت میز بنشینم و به تحرک نیاز دارم.' },
  { id: 'g_intrapersonal_1', category: 'gardner', subCategory: 'intrapersonal', text: 'نقاط قوت، ضعف، احساسات و اهداف شخصی خودم را به خوبی می‌شناسم.' },
  { id: 'g_intrapersonal_2', category: 'gardner', subCategory: 'intrapersonal', text: 'گاهی اوقات تنهایی فکر کردن و خلوت شخصی را به جمع‌های شلوغ ترجیح می‌دهم.' },
  { id: 'g_interpersonal_1', category: 'gardner', subCategory: 'interpersonal', text: 'احساسات دیگران را سریع درک می‌کنم و دوستان در مشکلات به من مراجعه می‌کنند.' },
  { id: 'g_interpersonal_2', category: 'gardner', subCategory: 'interpersonal', text: 'در کارهای گروهی و هماهنگی میان همکلاسی‌ها عملکرد موفقی دارم.' },
  { id: 'g_naturalist_1', category: 'gardner', subCategory: 'naturalist', text: 'علاقه‌مند به طبیعت، حیوانات، گیاهان و پدیده‌های زیست‌محیطی هستم.' },
  { id: 'g_naturalist_2', category: 'gardner', subCategory: 'naturalist', text: 'دسته‌بندی و مشاهده پدیده‌های طبیعی برای من جالب و الهام‌بخش است.' },

  // علایق شغلی هالند (۶ تیپ)
  { id: 'h_r_1', category: 'holland', subCategory: 'R', text: 'کار با ابزار، وسایل فنی، تعمیر دستگاه‌ها یا کار در فضای باز را دوست دارم.' },
  { id: 'h_r_2', category: 'holland', subCategory: 'R', text: 'ترجیح می‌دهم فعالیت‌هایی انجام دهم که نتیجه عینی و فیزیکی ملموس داشته باشد.' },
  { id: 'h_i_1', category: 'holland', subCategory: 'I', text: 'تحقیق درباره ناشناخته‌ها، آزمایش‌های علمی و تحلیل تئوری‌ها را دوست دارم.' },
  { id: 'h_i_2', category: 'holland', subCategory: 'I', text: 'جستجو در منابع علمی برای یافتن پاسخ سوالات پیچیده مرا به وجد می‌آورد.' },
  { id: 'h_a_1', category: 'holland', subCategory: 'A', text: 'خلق آثار هنری، نقاشی، شعر، نویسندگی، تئاتر و فعالیت‌های بدون چارچوب خشک.' },
  { id: 'h_a_2', category: 'holland', subCategory: 'A', text: 'ترجیح می‌دهم به روش منحصربه‌فرد و خلاقانه خودم مسائل را ارائه دهم.' },
  { id: 'h_s_1', category: 'holland', subCategory: 'S', text: 'آموزش دادن، مشاوره، کمک به نیازمندان و کارهای داوطلبانه و اجتماعی.' },
  { id: 'h_s_2', category: 'holland', subCategory: 'S', text: 'حل مشکلات دیگران و بهبود روابط انسانی اولویت اصلی زندگی من است.' },
  { id: 'h_e_1', category: 'holland', subCategory: 'E', text: 'مدیریت تیم، رهبری پروژه‌ها، متقاعد کردن دیگران و راه‌اندازی کسب‌وکار.' },
  { id: 'h_e_2', category: 'holland', subCategory: 'E', text: 'از ریسک‌پذیری، مذاکره و رقابت برای دستیابی به اهداف بزرگ استقبال می‌کنم.' },
  { id: 'h_c_1', category: 'holland', subCategory: 'C', text: 'نظم و انضباط، ثبت داده‌ها، جدول‌بندی دقیق و کارهای ساختاریافته و حسابداری.' },
  { id: 'h_c_2', category: 'holland', subCategory: 'C', text: 'پیروی از دستورالعمل‌های مشخص و پیش‌بینی‌پذیر برای من آرامش‌بخش است.' },

  // سبک یادگیری (دیداری، شنیداری، عملی)
  { id: 'ls_vis_1', category: 'learningStyle', subCategory: 'دیداری', text: 'وقتی معلم از اسلاید، تصویر، نمودار یا هایلایت رنگی استفاده می‌کند بهتر یاد می‌گیرم.' },
  { id: 'ls_aud_1', category: 'learningStyle', subCategory: 'شنیداری', text: 'با شنیدن دقیق توضیحات معلم یا تکرار با صدای بلند و بحث کلاسی عمیق‌تر می‌فهمم.' },
  { id: 'ls_kin_1', category: 'learningStyle', subCategory: 'عملی', text: 'تا خودم مسئله‌ای را روی کاغذ ننویسم یا آزمایشی را لمس نکنم به تسلط نمی‌رسم.' },

  // Original classroom learning-preference self-assessment; not a standardized VARK instrument.
  { id: 'vark_visual_1', category: 'vark', subCategory: 'visual', text: 'برای فهم یک موضوع، دیدن نمودار، نقشه یا تصویر به من کمک می‌کند.' },
  { id: 'vark_visual_2', category: 'vark', subCategory: 'visual', text: 'وقتی مراحل کار را به شکل تصویری می‌بینم، بهتر آن‌ها را به خاطر می‌سپارم.' },
  { id: 'vark_auditory_1', category: 'vark', subCategory: 'auditory', text: 'گفت‌وگو و شنیدن توضیح، به فهم بهتر من کمک می‌کند.' },
  { id: 'vark_auditory_2', category: 'vark', subCategory: 'auditory', text: 'بلند توضیح دادن یک مطلب برای خودم یا دیگران به یادگیری‌ام کمک می‌کند.' },
  { id: 'vark_readWrite_1', category: 'vark', subCategory: 'readWrite', text: 'خواندن متن و یادداشت‌برداری، روش مؤثری برای یادگیری من است.' },
  { id: 'vark_readWrite_2', category: 'vark', subCategory: 'readWrite', text: 'برای مرور درس، نوشتن خلاصه و فهرست نکته‌ها را ترجیح می‌دهم.' },
  { id: 'vark_kinesthetic_1', category: 'vark', subCategory: 'kinesthetic', text: 'آزمایش، ساختن یا انجام دادن یک فعالیت به فهم من کمک می‌کند.' },
  { id: 'vark_kinesthetic_2', category: 'vark', subCategory: 'kinesthetic', text: 'وقتی یک مفهوم را در موقعیت واقعی به کار می‌برم، بهتر یاد می‌گیرم.' },

  // تیپ شخصیتی (برون‌گرا، درون‌گرا)
  { id: 'p_ext_1', category: 'personality', subCategory: 'برون‌گرا', text: 'از بودن در میان جمع انرژی می‌گیرم و ترجیح می‌دهم ایده‌هایم را سریع مطرح کنم.' },
  { id: 'p_int_1', category: 'personality', subCategory: 'درون‌گرا', text: 'قبل از صحبت کردن نیاز دارم خوب در سکوت فکر کنم و بعد از تعاملات طولانی نیاز به خلوت دارم.' },
];

export const HOLLAND_TITLES: Record<string, { fa: string; en: string; icon: string; careers: string }> = {
  R: { fa: 'واقع‌گرا (عمل‌گرا و فنی)', en: 'Realistic', icon: 'Wrench', careers: 'مهندسی عمران، مکانیک، کشاورزی، خلبانی، معماری اجرایی، علوم آزمایشگاهی فنی' },
  I: { fa: 'پژوهشی (تحلیل‌گر و علمی)', en: 'Investigative', icon: 'Microscope', careers: 'پزشکی، داروسازی، بیوتکنولوژی، ریاضیات، فیزیک، برنامه‌نویسی و هوش مصنوعی' },
  A: { fa: 'هنری (خلاق و نوآور)', en: 'Artistic', icon: 'Palette', careers: 'طراحی گرافیک، معماری، سینما، ادبیات، موسیقی، طراحی صنعتی، عکاسی' },
  S: { fa: 'اجتماعی (مددکار و معلم)', en: 'Social', icon: 'Users', careers: 'روانشناسی، مشاوره، تدریس و آموزش، علوم تربیتی، مددکاری، پرستاری' },
  E: { fa: 'متهور (کارآفرین و رهبر)', en: 'Enterprising', icon: 'TrendingUp', careers: 'مدیریت بازرگانی، وکالت، اقتصاد، بازاریابی، روابط عمومی، کارآفرینی' },
  C: { fa: 'قراردادی (منظم و داده‌محور)', en: 'Conventional', icon: 'FileSpreadsheet', careers: 'حسابداری، مدیریت مالی، بانکداری، آمار، امور اداری، آرشیو و مدیریت اسناد' },
};

export const GARDNER_TITLES: Record<keyof GardnerScores, { fa: string; color: string }> = {
  verbal: { fa: 'کلامی-زبانی', color: '#3B82F6' },
  logical: { fa: 'منطقی-ریاضی', color: '#10B981' },
  spatial: { fa: 'دیداری-فضایی', color: '#F59E0B' },
  musical: { fa: 'موسیقایی', color: '#EC4899' },
  bodily: { fa: 'بدنی-جنبشی', color: '#8B5CF6' },
  intrapersonal: { fa: 'درون‌فردی', color: '#06B6D4' },
  interpersonal: { fa: 'میان‌فردی', color: '#14B8A6' },
  naturalist: { fa: 'طبیعت‌گرا', color: '#84CC16' },
};

// Calculate scores from answers
export function calculatePsychResults(answers: Record<string, number>): {
  gardnerScores: GardnerScores;
  hollandScores: HollandScores;
  hollandCode: string;
  learningStyle: 'دیداری' | 'شنیداری' | 'عملی';
  varkScores: VarkScores;
  personalityType: 'برون‌گرا' | 'درون‌گرا';
} {
  const gScores: GardnerScores = {
    verbal: (answers['g_verbal_1'] || 3) + (answers['g_verbal_2'] || 3),
    logical: (answers['g_logical_1'] || 3) + (answers['g_logical_2'] || 3),
    spatial: (answers['g_spatial_1'] || 3) + (answers['g_spatial_2'] || 3),
    musical: (answers['g_musical_1'] || 3) + (answers['g_musical_2'] || 3),
    bodily: (answers['g_bodily_1'] || 3) + (answers['g_bodily_2'] || 3),
    intrapersonal: (answers['g_intrapersonal_1'] || 3) + (answers['g_intrapersonal_2'] || 3),
    interpersonal: (answers['g_interpersonal_1'] || 3) + (answers['g_interpersonal_2'] || 3),
    naturalist: (answers['g_naturalist_1'] || 3) + (answers['g_naturalist_2'] || 3),
  };

  const hScores: HollandScores = {
    R: (answers['h_r_1'] || 3) + (answers['h_r_2'] || 3),
    I: (answers['h_i_1'] || 3) + (answers['h_i_2'] || 3),
    A: (answers['h_a_1'] || 3) + (answers['h_a_2'] || 3),
    S: (answers['h_s_1'] || 3) + (answers['h_s_2'] || 3),
    E: (answers['h_e_1'] || 3) + (answers['h_e_2'] || 3),
    C: (answers['h_c_1'] || 3) + (answers['h_c_2'] || 3),
  };

  // Top 3 Holland letters
  const sortedHolland = Object.entries(hScores)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
  const hollandCode = sortedHolland.slice(0, 3).join('');

  // Learning style
  const vis = answers['ls_vis_1'] || 3;
  const aud = answers['ls_aud_1'] || 3;
  const kin = answers['ls_kin_1'] || 3;
  const varkScores: VarkScores = {
    visual: (answers.vark_visual_1 || 0) + (answers.vark_visual_2 || 0),
    auditory: (answers.vark_auditory_1 || 0) + (answers.vark_auditory_2 || 0),
    readWrite: (answers.vark_readWrite_1 || 0) + (answers.vark_readWrite_2 || 0),
    kinesthetic: (answers.vark_kinesthetic_1 || 0) + (answers.vark_kinesthetic_2 || 0),
  };
  let learningStyle: 'دیداری' | 'شنیداری' | 'عملی' = 'دیداری';
  if (aud > vis && aud >= kin) learningStyle = 'شنیداری';
  else if (kin > vis && kin > aud) learningStyle = 'عملی';

  // Personality
  const ext = answers['p_ext_1'] || 3;
  const in_ = answers['p_int_1'] || 3;
  const personalityType: 'برون‌گرا' | 'درون‌گرا' = ext >= in_ ? 'برون‌گرا' : 'درون‌گرا';

  return {
    gardnerScores: gScores,
    hollandScores: hScores,
    varkScores,
    hollandCode,
    learningStyle,
    personalityType,
  };
}

// Educational psychology recommendations for teachers
export interface TeacherRecommendation {
  teachingMethod: string;
  behavioralApproach: string;
  homeworkDesign: string;
  parentCommunication: string;
}

export interface StudentPerformanceRecommendations {
  gradeAverage: number | null;
  absences: number | null;
  tardies: number | null;
  homeworkPercent: number | null;
  homeworkQuality: number | null;
  participation: number | null;
  suggestions: string[];
}

const meanRounded = (values: number[]) => values.length
  ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
  : null;

export function getStudentPerformanceRecommendations(
  grades: StudentGrade[],
  attendance: AttendanceRecord[]
): StudentPerformanceRecommendations {
  const gradeAverage = meanRounded(grades.flatMap((grade) =>
    typeof grade.calculatedAverage === 'number' && Number.isFinite(grade.calculatedAverage)
      ? [grade.calculatedAverage]
      : []
  ));
  const averageOf = (select: (record: AttendanceRecord) => number) => meanRounded(
    attendance.flatMap((record) => {
      const value = select(record);
      return Number.isFinite(value) ? [value] : [];
    })
  );
  const absences = attendance.length ? attendance.reduce((sum, record) => sum + (Number.isFinite(record.absences) ? record.absences : 0), 0) : null;
  const tardies = attendance.length ? attendance.reduce((sum, record) => sum + (Number.isFinite(record.tardies) ? record.tardies : 0), 0) : null;
  const homeworkPercent = averageOf((record) => record.homeworkPercent);
  const homeworkQuality = averageOf((record) => record.homeworkQuality);
  const participation = averageOf((record) => record.participation);
  const suggestions: string[] = [];

  if (gradeAverage !== null && gradeAverage < 12) {
    suggestions.push('میانگین ثبت‌شده زیر ۱۲ از ۲۰ است؛ آموزش را به گام‌های کوچک تقسیم کنید، تمرین بازیابی کوتاه بدهید و پیشرفت را با بازخوردهای پی‌درپی بررسی کنید.');
  } else if (gradeAverage !== null && gradeAverage >= 17) {
    suggestions.push('میانگین ثبت‌شده ۱۷ یا بالاتر است؛ در کنار تثبیت مفاهیم، مسئله‌های باز و فعالیت‌های غنی‌سازی متناسب ارائه کنید.');
  }
  if (absences !== null && absences >= 3) {
    suggestions.push(`در رکوردهای موجود ${toPersianDigits(absences)} غیبت ثبت شده؛ علت را بدون پیش‌داوری بررسی و خلاصه درس یا فرصت جبران هماهنگ کنید.`);
  }
  if (tardies !== null && tardies >= 3) {
    suggestions.push(`در رکوردهای موجود ${toPersianDigits(tardies)} تأخیر ثبت شده؛ درباره موانع حضور به‌موقع گفت‌وگو و یک روال شروع آرام و قابل پیش‌بینی تنظیم کنید.`);
  }
  if (homeworkPercent !== null && homeworkPercent < 70) {
    suggestions.push('درصد انجام تکلیف پایین‌تر از ۷۰٪ است؛ حجم کار را به بخش‌های کوتاه و روشن تقسیم و زمان‌بندی واقع‌بینانه تعیین کنید.');
  }
  if (homeworkQuality !== null && homeworkQuality < 3) {
    suggestions.push('کیفیت تکلیف کمتر از ۳ از ۵ ثبت شده؛ نمونه پاسخ، چک‌لیست و بازخورد مشخص پیش از تکلیف بعدی ارائه کنید.');
  }
  if (participation !== null && participation < 3) {
    suggestions.push('مشارکت کمتر از ۳ از ۵ ثبت شده؛ زمان فکر فردی، پاسخ دونفره و امکان انتخاب شیوه پاسخ‌گویی را امتحان کنید.');
  }

  return { gradeAverage, absences, tardies, homeworkPercent, homeworkQuality, participation, suggestions };
}

export function getPedagogicalRecommendations(
  learningStyle: 'دیداری' | 'شنیداری' | 'عملی',
  personalityType: 'برون‌گرا' | 'درون‌گرا',
  hollandPrimaryLetter: string,
  varkScores?: VarkScores
): TeacherRecommendation {
  // Teaching Method based on Learning Style & Holland
  let teachingMethod = '';
  if (learningStyle === 'دیداری') {
    teachingMethod = 'استفاده حداکثری از نقشه‌های مفهومی، نمودارهای درختی، رنگ‌بندی تخته و انیمیشن‌های آموزشی. خلاصه درس را در قالب دیاگرام‌های تصویری به دانش‌آموز ارائه دهید و اجازه دهید جزوه خود را با هایلایتر ساختاربندی کند.';
  } else if (learningStyle === 'شنیداری') {
    teachingMethod = 'استفاده از پرسش‌وپاسخ شفاهی، ضبط صوت تدریس برای بازشنوی در خانه، ریتم دادن به مفاهیم فرمولی و تشویق دانش‌آموز به توضیح دادن شفاهی مبحث برای معلم یا همکلاسی‌ها.';
  } else {
    teachingMethod = 'آموزش مبتنی بر دست‌ورزی، آزمایش کلاسی، مدل‌سازی با گِل یا ماکت و حرکت دادن دانش‌آموز پای تخته. یادگیری ایستا برای این دانش‌آموز کسالت‌آور است؛ به او نقش اجرایی در حل تمرین بدهید.';
  }

  if (varkScores) {
    const preferredChannel = Object.entries(varkScores).sort((first, second) => second[1] - first[1])[0]?.[0];
    const channelMethods: Record<string, string> = {
      visual: 'نمودار و نمایش تصویری',
      auditory: 'گفت‌وگو و توضیح شفاهی',
      readWrite: 'خواندن، یادداشت‌برداری و خلاصه‌نویسی',
      kinesthetic: 'تمرین عملی و تجربه مستقیم',
    };
    if (preferredChannel && channelMethods[preferredChannel]) {
      teachingMethod += ` در خودارزیابی چهارگانه، ${channelMethods[preferredChannel]} امتیاز بیشتری داشته است؛ این روش را در کنار سایر شیوه‌ها امتحان کنید و با مشاهده پیشرفت دانش‌آموز تنظیم کنید.`;
    }
  }

  // Behavioral Approach based on Personality Type
  let behavioralApproach = '';
  if (personalityType === 'درون‌گرا') {
    behavioralApproach = 'از بازخواست یا پرسش ناگهانی جلوی کل کلاس خودداری کنید. به او فرصت ۳۰ ثانیه‌ای برای تفکر پیش از پاسخ دهید. بازخوردهای منفی را در خلوت و انفرادی بیان کنید تا احساس امنیت روانی حفظ شود.';
  } else {
    behavioralApproach = 'به او نقش‌های مشارکتی کلاسی (مانند مبصر گروه، هدایتگر مباحثه، گزارش‌دهنده تیم) بسپارید. انرژی هیجانی بالای او را با مأموریت‌های متناوب مثبت مدیریت کرده و از خاموش‌سازی انگیزه ابراز وجودش بپرهیزید.';
  }

  // Homework Design based on Holland Primary Letter
  let homeworkDesign = '';
  switch (hollandPrimaryLetter) {
    case 'R':
      homeworkDesign = 'تکالیف کاربردی و عینی با خروجی ملموس: ساخت ابزار کوچک، گزارش اندازه‌گیری‌های فیزیکی در خانه، ترسیم مقیاسی یا تحلیل وسایل مکانیکی و الکترونیکی منزل به جای حل تئوری محض.';
      break;
    case 'I':
      homeworkDesign = 'تکالیف پژوهش‌محور، کشف الگوها، مقایسه دو دیدگاه علمی و حل مسائل چندمرحله‌ای چالشی که نیاز به تفکر تحلیلی و جستجو در منابع فراتر از کتاب درسی دارد.';
      break;
    case 'A':
      homeworkDesign = 'تکالیف خلاقانه و آزاد: ساخت اینفوگرافیک، نوشتن داستانک علمی، نقاشی از فرآیندهای درسی یا ارائه پادکست به جای رونویسی‌های سنتی و چارچوب‌های تکراری.';
      break;
    case 'S':
      homeworkDesign = 'پروژه‌های همیار معلم، تدریس همتایان، مصاحبه با اطرافیان پیرامون کاربرد درس در زندگی اجتماعی و فعالیت‌های حل مسئله در گروه‌های دونفره.';
      break;
    case 'E':
      homeworkDesign = 'تکالیف مهارتی با رویکرد مدیریت، طراحی طرح کسب‌وکار کوچک کلاسی، ارائه کنفرانس متقاعدکننده در ۵ دقیقه یا رهبری هماهنگی یک پروژه گروهی.';
      break;
    case 'C':
    default:
      homeworkDesign = 'تکالیف منظم، جدول‌بندی شده، دارای چک‌لیست گام‌به‌گام با دستورالعمل بسیار شفاف و زمان‌بندی معین، حل تمرین‌های ساختاریافته کتاب کار.';
      break;
  }

  // Parent Communication Strategy
  let parentCommunication = '';
  if (personalityType === 'درون‌گرا' && learningStyle === 'دیداری') {
    parentCommunication = 'در جلسات اولیا بر تأمین اتاق مطالعه آرام، نور مناسب و میز تحریر منظم تأکید کنید. به والدین یادآوری شود سکوت فرزند به معنای بی‌انگیزگی نیست؛ از تحت فشار گذاشتن او برای حضور در جمع‌های شلوغ بعد از مدرسه پرهیز کنند.';
  } else if (personalityType === 'برون‌گرا') {
    parentCommunication = 'با والدین هماهنگ کنید که برای او امکان گفت‌وگو پیرامون رخدادهای مدرسه در منزل فراهم شود. مدیریت ساعت نمایشگر و خواب بسیار کلیدی است چون هیجان دانش‌آموز ممکن است زمان استراحت را به تعویق بیندازد.';
  } else {
    parentCommunication = 'به والدین پیشنهاد کنید یادگیری را با کاربردهای روزمره در خانه (خرید، آشپزی، تعمیرات سبک) پیوند دهند و به جای ملامت تحرک فیزیکی فرزند، زمان‌های مشخصی برای فعالیت ورزشی روزانه اختصاص دهند.';
  }

  return {
    teachingMethod,
    behavioralApproach,
    homeworkDesign,
    parentCommunication,
  };
}
