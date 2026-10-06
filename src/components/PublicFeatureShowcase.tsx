import React from 'react';
import {
  ArrowUpLeft,
  BookOpen,
  Crown,
  GraduationCap,
  HeartHandshake,
  School,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { toPersianDigits } from '../lib/persianUtils';
import { UserRole } from '../types';

interface AudienceFeatureGroup {
  role: UserRole;
  title: string;
  focus: string;
  Icon: LucideIcon;
  tone: string;
  features: string[];
}

const audienceGroups: AudienceFeatureGroup[] = [
  {
    role: 'admin',
    title: 'مدیر مدرسه',
    focus: 'مدیریت و تصمیم‌گیری',
    Icon: ShieldCheck,
    tone: 'emerald',
    features: [
      'ساختار مدرسه را از پایه و کلاس تا دانش‌آموز، دبیر و حساب کاربری مدیریت کنید',
      'معلم و دبیر را به کلاس و درس بسپارید و ضریب دشواری درس‌ها را تنظیم کنید',
      'نمره‌ها و روند پیشرفت هر کلاس را یکجا بررسی کنید',
      'پرونده جامع دانش‌آموز، توانمندی‌ها، عوامل خطر و نیازهای حمایتی را ببینید',
      'ارزیابی کارکنان، اعلان‌های مدرسه و داده‌های آموزشی را مدیریت کنید',
    ],
  },
  {
    role: 'teacher',
    title: 'معلم و دبیر',
    focus: 'تدریس و پیگیری کلاس',
    Icon: BookOpen,
    tone: 'teal',
    features: [
      'نمره‌های مستمر و امتحانی را ثبت کنید و میانگین درس را زنده ببینید',
      'ارزشیابی شاخص‌محور را بر پایه جلسه و مفهوم درسی انجام دهید',
      'حضور روزانه، تأخیر، تکلیف و یادداشت رفتاری را برای کلاس ثبت کنید',
      'با شناخت سبک یادگیری و نتایج دانش‌آموز، پیشنهاد آموزشی متناسب بگیرید',
      'توانمندی‌های تدریس خود را ارزیابی و تناسب آموزشی با دانش‌آموز را بررسی کنید',
    ],
  },
  {
    role: 'student',
    title: 'دانش‌آموز',
    focus: 'خودشناسی و پیشرفت',
    Icon: UserRound,
    tone: 'indigo',
    features: [
      'نتایج درس‌ها، کارنامه و مسیر پیشرفت خود را دنبال کنید',
      'وضعیت حضور، تکلیف و بازخوردهای آموزشی را ببینید',
      'با آزمون‌های استعداد، رغبت شغلی، شخصیت و سبک یادگیری خودشناسی کنید',
      'کارنامه توانمندی‌ها و پیشنهادهای آموزشی و هدایت تحصیلی دریافت کنید',
      'در پرسشنامه‌های نگرش به مدرسه و فعالیت‌های پرورشی مشارکت کنید',
    ],
  },
  {
    role: 'parent',
    title: 'والدین',
    focus: 'همراهی با فرزند',
    Icon: HeartHandshake,
    tone: 'amber',
    features: [
      'نمره‌ها، غیبت، تأخیر و روند درسی فرزندتان را دنبال کنید',
      'با استعدادها، رغبت‌ها و شیوه یادگیری فرزندتان آشنا شوید',
      'اطلاعات خانواده و سلامت را ثبت و شاخص توده بدنی را مشاهده کنید',
      'بازخورد خود را درباره دبیران مرتبط با فرزند ثبت کنید',
      'اعلان‌ها و پیام‌های مرتبط با وضعیت آموزشی فرزند را پیگیری کنید',
    ],
  },
  {
    role: 'academic_vp',
    title: 'معاون آموزشی',
    focus: 'کیفیت یادگیری',
    Icon: GraduationCap,
    tone: 'blue',
    features: [
      'میانگین و پیشرفت درسی را به تفکیک کلاس و درس پایش کنید',
      'وضعیت تکلیف، حضور و شاخص‌های آموزشی کلاس‌ها را مقایسه کنید',
      'تفاوت شیوه نمره‌دهی و الگوی عملکرد دروس را بررسی کنید',
      'برای بهبود یادگیری، پیشنهادهای متناسب با نیاز کلاس دریافت کنید',
      'ارزیابی آموزشی دبیران و نگرش دانش‌آموزان را دنبال کنید',
    ],
  },
  {
    role: 'cultural_vp',
    title: 'معاون پرورشی',
    focus: 'رشد و مشارکت دانش‌آموز',
    Icon: Sparkles,
    tone: 'rose',
    features: [
      'فعالیت فوق‌برنامه را با توجه به استعداد و رغبت دانش‌آموزان برنامه‌ریزی کنید',
      'فعالیت‌های فرهنگی، هنری، ورزشی و مهارتی کلاس‌ها را ثبت و مقایسه کنید',
      'تقویم مناسبت‌ها و برنامه‌های سراسری مدرسه را سامان دهید',
      'پرسشنامه‌ها و مشارکت‌های پرورشی دانش‌آموزان را پایش کنید',
      'بازخورد تربیتی دبیران و روند مشارکت مدرسه را بررسی کنید',
    ],
  },
  {
    role: 'executive_vp',
    title: 'معاون اجرایی',
    focus: 'شفافیت مالی',
    Icon: Wallet,
    tone: 'cyan',
    features: [
      'شهریه، اقساط و دیگر دریافت‌های مدرسه را با تاریخ و رسید ثبت کنید',
      'هزینه‌ها را دسته‌بندی و برای هر پرداخت یادداشت ثبت کنید',
      'جمع درآمد، مخارج و مانده ثبت‌شده سال تحصیلی را ببینید',
      'روند ماهانه درآمد و هزینه را مقایسه کنید',
      'وضعیت دریافت دانش‌آموزان را بر اساس کلاس و جست‌وجو بررسی کنید',
      'ثبت روزانه حضور، تکلیف و موارد انضباطی کلاس‌ها را پیگیری کنید',
    ],
  },
  {
    role: 'sub_admin',
    title: 'ناظر کل مدارس',
    focus: 'نظارت فراگیر',
    Icon: Crown,
    tone: 'violet',
    features: [
      'حساب مدیران و دسترسی واحدهای آموزشی را مدیریت کنید',
      'وضعیت مدرسه‌ها، کلاس‌ها و عملکرد آموزشی را در یک نگاه پایش کنید',
      'گزارش‌های نمره، حضور، استعداد و ارزیابی کارکنان را بررسی کنید',
      'بخش‌های آموزشی، پرورشی، مالی و پرونده‌های دانش‌آموزان را دنبال کنید',
      'برای تصمیم‌گیری، روندها و نیازهای مدارس را کنار هم ببینید',
    ],
  },
];

const toneStyles: Record<string, { icon: string; line: string; label: string; button: string }> = {
  emerald: { icon: 'bg-emerald-100 text-emerald-800', line: 'bg-emerald-600', label: 'text-emerald-800', button: 'hover:bg-emerald-50' },
  teal: { icon: 'bg-teal-100 text-teal-800', line: 'bg-teal-600', label: 'text-teal-800', button: 'hover:bg-teal-50' },
  indigo: { icon: 'bg-indigo-100 text-indigo-800', line: 'bg-indigo-600', label: 'text-indigo-800', button: 'hover:bg-indigo-50' },
  amber: { icon: 'bg-amber-100 text-amber-900', line: 'bg-amber-500', label: 'text-amber-800', button: 'hover:bg-amber-50' },
  blue: { icon: 'bg-blue-100 text-blue-800', line: 'bg-blue-600', label: 'text-blue-800', button: 'hover:bg-blue-50' },
  rose: { icon: 'bg-rose-100 text-rose-800', line: 'bg-rose-600', label: 'text-rose-800', button: 'hover:bg-rose-50' },
  cyan: { icon: 'bg-cyan-100 text-cyan-900', line: 'bg-cyan-700', label: 'text-cyan-900', button: 'hover:bg-cyan-50' },
  violet: { icon: 'bg-violet-100 text-violet-800', line: 'bg-violet-600', label: 'text-violet-800', button: 'hover:bg-violet-50' },
};

interface PublicFeatureShowcaseProps {
  onRequestLogin: () => void;
}

export const PublicFeatureShowcase: React.FC<PublicFeatureShowcaseProps> = ({ onRequestLogin }) => (
  <section id="features" className="border-y border-slate-200 bg-[#f2f6f3] py-12 sm:py-16 dark:border-slate-800 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-5 border-b border-slate-300/80 pb-6 dark:border-slate-700 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-black text-teal-800 dark:text-teal-300">
            <School className="h-4 w-4" />
            <span>هشت نقش، یک مدرسهٔ هماهنگ</span>
          </div>
          <h2 className="max-w-3xl text-3xl font-black leading-tight text-slate-950 dark:text-white sm:text-4xl">
            همهٔ ابزارهای مدرسه، متناسب با نقش شما
          </h2>
          <p className="mt-3 text-base leading-8 text-slate-600 dark:text-slate-300">
            آموزش، پایش، پرورش، ارتباط با خانواده و مدیریت اجرایی در پنل‌های یکپارچه
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
          <span className="text-4xl font-black text-teal-800 dark:text-teal-300">۸</span>
          <span className="max-w-28 leading-6">نقش با امکانات اختصاصی</span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {audienceGroups.map(({ role, title, focus, Icon, tone, features }, groupIndex) => {
          const styles = toneStyles[tone];
          return (
            <article key={role} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className={`h-1.5 w-full ${styles.line}`} />
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`rounded-md px-2.5 py-1.5 text-xs font-black ${styles.label} bg-slate-50 dark:bg-slate-800`}>
                    {focus}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-950 dark:text-white">{title}</h3>
                <ol className="mt-4 flex-1 space-y-3.5">
                  {features.map((feature, featureIndex) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm leading-7 text-slate-700 dark:text-slate-300">
                      <span className={`mt-1 font-mono text-xs font-black ${styles.label}`}>
                        {toPersianDigits(featureIndex + 1).padStart(2, '۰')}
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ol>

                <button
                  type="button"
                  onClick={onRequestLogin}
                  className={`mt-5 flex w-full items-center justify-between border-t border-slate-100 pt-4 text-sm font-black text-slate-800 transition dark:border-slate-800 dark:text-slate-100 ${styles.button}`}
                >
                  <span>رفتن به ورود کاربران</span>
                  <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
                </button>
              </div>
              <span className="sr-only">گروه شماره {toPersianDigits(groupIndex + 1)}</span>
            </article>
          );
        })}
      </div>
    </div>
  </section>
);
