import { UserRole } from '../types';

export const ROLE_DETAILS: Record<
  UserRole,
  {
    title: string;
    englishTitle: string;
    badgeColor: string;
    description: string;
    menus: string[];
    iconName: string;
  }
> = {
  sub_admin: {
    title: 'ساب‌ادمین / ناظر کل مدارس',
    englishTitle: 'Sub-Admin / District Supervisor',
    badgeColor: 'bg-rose-700 text-white',
    description: 'دسترسی فراگیر به تمامی بخش‌های سامانه، افزودن و مدیریت مدیران مدارس، و نظارت ۳۶۰ درجه بر کلیه کارنامه‌ها و داده‌ها.',
    menus: ['افزودن و مدیریت مشخصات مدیران مدارس', 'دسترسی نامحدود به ساختار تمام پایه‌ها و کلاس‌ها', 'نظارت بر نمرات و غیبت‌های همه مدارس', 'پایش آزمون‌های استعدادیابی و هدایت تحصیلی', 'ارزیابی ۳۶۰ درجه دبیران و ضرایب سختی', 'مدیریت و حذف کلیه رکوردهای سامانه'],
    iconName: 'Crown',
  },
  admin: {
    title: 'مدیر مدرسه',
    englishTitle: 'Principal / Administrator',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'مدیریت کلان ساختار مدرسه، پایه‌ها، کلاس‌ها، معلمان، صدور حساب‌های کاربری، ضرایب سختی دروس و مانیتورینگ کلیه داده‌ها.',
    menus: ['ساختار مدرسه (پایه، کلاس، دانش‌آموز، دبیر)', 'تخصیص دبیر به کلاس و درس', 'صدور حساب کاربری نقش‌ها', 'تنظیم ضرایب سختی دروس', 'ارزیابی ۳۶۰ درجه دبیران', 'مدیریت داده‌ها و بایگانی کل ثبتی‌ها'],
    iconName: 'ShieldAlert',
  },
  executive_vp: {
    title: 'معاون اجرایی',
    englishTitle: 'Executive Vice Principal',
    badgeColor: 'bg-cyan-700 text-white',
    description: 'مدیریت دریافت شهریه‌ها، هزینه‌های مدرسه و گزارش مالی ماهانه و سالانه.',
    menus: ['ثبت پرداخت شهریه به‌ازای دانش‌آموز', 'ثبت هزینه‌ها با دسته‌بندی', 'گزارش درآمد و مخارج ماهانه', 'مشاهده مانده مالی سال تحصیلی'],
    iconName: 'Wallet',
  },
  academic_vp: {
    title: 'معاون آموزشی',
    englishTitle: 'Academic Vice Principal',
    badgeColor: 'bg-blue-600 text-white',
    description: 'پایش مستمر پیشرفت درسی، بودجه‌بندی دروس، ارزشیابی کیفیت آموزشی دبیران و تحلیل کارنامه‌های میان‌ترم و پایان‌ترم.',
    menus: ['داشبورد پیشرفت تحصیلی', 'پایش بودجه‌بندی و میانگین دروس', 'ارزیابی کیفی دبیران (شاخص‌های آموزشی)', 'گزارش‌گیری تحلیلی کلاس‌ها'],
    iconName: 'GraduationCap',
  },
  cultural_vp: {
    title: 'معاون پرورشی',
    englishTitle: 'Student Affairs Vice Principal',
    badgeColor: 'bg-purple-600 text-white',
    description: 'ثبت و پایش فعالیت‌های فوق‌برنامه در چهار حوزه هنری، ورزشی، مهارتی و علمی، محاسبه معدل پرورشی و ارزیابی تربیتی دبیران.',
    menus: ['ثبت فعالیت‌های فوق‌برنامه ماهانه', 'محاسبه و مقایسه معدل پرورشی کلاس‌ها', 'ارزیابی تربیتی-اخلاقی دبیران', 'پایش شاخص‌های رفتاری دانش‌آموزان'],
    iconName: 'Sparkles',
  },
  teacher: {
    title: 'معلم و دبیر',
    englishTitle: 'Teacher / Faculty',
    badgeColor: 'bg-teal-600 text-white',
    description: 'ورود نمرات ۵ گانه با فرمول زنده، ثبت حضور، غیاب و شاخص‌های رفتاری ماهانه، مشاهده توصیه‌های روانشناختی و گزارش عملکرد فردی.',
    menus: ['ورود نمرات کلاس/درس‌های تخصیص‌یافته', 'ثبت حضور، تکالیف و ۵ شاخص رفتاری', 'توصیه‌های روانشناختی و تربیتی دانش‌آموزان', 'مشاهده ارزیابی و میانگین خام و تعدیل‌شده'],
    iconName: 'BookOpen',
  },
  student: {
    title: 'دانش‌آموز',
    englishTitle: 'Student',
    badgeColor: 'bg-indigo-600 text-white',
    description: 'شرکت در آزمون‌های خودشناسی هوش‌های چندگانه گاردنر، رغبت‌سنجی هالند، سبک یادگیری، تیپ شخصیتی و پایش نمرات.',
    menus: ['آزمون جامع روانشناختی و خودشناسی', 'کارنامه هوش‌های ۸ گانه و کد هالند', 'سبک یادگیری برتر و تیپ شخصیتی', 'مشاهده کارنامه و نمرات تحصیلی'],
    iconName: 'UserCheck',
  },
  parent: {
    title: 'اولیا و والدین',
    englishTitle: 'Parents & Guardians',
    badgeColor: 'bg-amber-600 text-white',
    description: 'تکمیل شناسنامه سلامت و بستر خانوادگی (محاسبه خودکار BMI)، مشاهده خلاصه وضعیت فرزند و ارزیابی دبیران متصل به فرزند.',
    menus: ['تکمیل فرم اطلاعات خانواده و شاخص سلامت', 'محاسبه خودکار BMI و پایش خواب/نمایشگر', 'خلاصه وضعیت فرزند (نمرات، غیبت، آزمون‌ها)', 'ارزیابی دبیران کلاس فرزند (شاخص‌های اولیا)'],
    iconName: 'HeartHandshake',
  },
};

