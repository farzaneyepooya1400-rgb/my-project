import React, { useState } from 'react';
import { Check, CreditCard, ShieldCheck, LoaderCircle, Minus, Plus, Users } from 'lucide-react';

const BASE_PRICE_TOMAN = 799_000;
const MAX_STUDENTS = 10_000;
const VAT_RATE_PERCENT = 10;

const discountTiers = [
  { min: 1, max: 100, discount: 0, label: '۱ تا ۱۰۰ دانش‌آموز' },
  { min: 101, max: 150, discount: 5, label: '۱۰۱ تا ۱۵۰ دانش‌آموز' },
  { min: 151, max: 200, discount: 10, label: '۱۵۱ تا ۲۰۰ دانش‌آموز' },
  { min: 201, max: 250, discount: 15, label: '۲۰۱ تا ۲۵۰ دانش‌آموز' },
  { min: 251, max: 300, discount: 20, label: '۲۵۱ تا ۳۰۰ دانش‌آموز' },
  { min: 301, max: 500, discount: 25, label: '۳۰۱ تا ۵۰۰ دانش‌آموز' },
  { min: 501, max: MAX_STUDENTS, discount: 30, label: 'بیش از ۵۰۰ دانش‌آموز' },
];

const includedFeatures = [
  'مدیریت دانش‌آموزان، کلاس‌ها و حساب‌های کاربری',
  'ثبت نمره، حضور، تکلیف و گزارش‌های آموزشی',
  'آزمون‌های خودشناسی، استعداد و رغبت‌سنجی',
  'پنل‌های معلم، والدین، معاونان و مدیر مدرسه',
  'گزارش‌های عملکرد و پیشنهادهای آموزشی و پرورشی',
  'فعالیت‌های فوق‌برنامه و ارزیابی دبیران',
];

const formatToman = (amount: number) => `${new Intl.NumberFormat('fa-IR').format(amount)} تومان`;
const formatNumber = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

export const PaymentPanel: React.FC = () => {
  const [studentCount, setStudentCount] = useState(1);
  const [schoolType, setSchoolType] = useState<'public' | 'private'>('private');
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');

  const selectedTier = discountTiers.find((tier) => studentCount >= tier.min && studentCount <= tier.max) || discountTiers[discountTiers.length - 1];
  const priceBands = discountTiers.map((tier) => {
    const quantity = Math.max(0, Math.min(studentCount, tier.max) - tier.min + 1);
    const pricePerStudent = Math.round(BASE_PRICE_TOMAN * (100 - tier.discount) / 100);
    return { ...tier, quantity, pricePerStudent, subtotal: quantity * pricePerStudent };
  });
  const baseTotalToman = studentCount * BASE_PRICE_TOMAN;
  const subtotalToman = priceBands.reduce((sum, band) => sum + band.subtotal, 0);
  const volumeDiscountToman = baseTotalToman - subtotalToman;
  const schoolDiscountPercent = schoolType === 'public' ? 50 : 0;
  const schoolDiscountToman = Math.round(subtotalToman * schoolDiscountPercent / 100);
  const taxableSubtotalToman = subtotalToman - schoolDiscountToman;
  const averagePricePerStudentToman = Math.round(taxableSubtotalToman / studentCount);
  const vatToman = Math.round(taxableSubtotalToman * VAT_RATE_PERCENT / 100);
  const totalPayableToman = taxableSubtotalToman + vatToman;

  const startPayment = async () => {
    setPaymentError('');
    setPaymentMessage('');

    const paymentApiUrl = import.meta.env.VITE_PAYMENT_API_URL;
    if (!paymentApiUrl) {
      setPaymentError('آدرس درگاه پرداخت هنوز در تنظیمات سامانه ثبت نشده است.');
      return;
    }

    setIsStartingPayment(true);
    try {
      const response = await fetch(paymentApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'اشتراک سالانه به‌ازای هر دانش‌آموز',
          studentCount,
          schoolType,
          basePricePerStudentToman: BASE_PRICE_TOMAN,
          appliedDiscountBands: priceBands.filter((band) => band.quantity > 0).map(({ label, quantity, discount, pricePerStudent, subtotal }) => ({ label, quantity, discountPercent: discount, pricePerStudentToman: pricePerStudent, subtotalToman: subtotal })),
          averagePricePerStudentToman,
          baseTotalToman,
          volumeDiscountToman,
          schoolDiscountPercent,
          schoolDiscountToman,
          subtotalToman,
          taxableSubtotalToman,
          vatRatePercent: VAT_RATE_PERCENT,
          vatToman,
          amountToman: totalPayableToman,
          amountRial: totalPayableToman * 10,
          callbackUrl: `${window.location.origin}/payment/callback`,
        }),
      });
      const result = (await response.json()) as { paymentUrl?: string; message?: string };

      if (!response.ok || !result.paymentUrl) {
        throw new Error(result.message || 'لینک پرداخت از درگاه دریافت نشد.');
      }

      window.location.assign(result.paymentUrl);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'اتصال به درگاه پرداخت انجام نشد.');
      setPaymentMessage('');
    } finally {
      setIsStartingPayment(false);
    }
  };

  return (
    <section id="payment-plans" className="mt-12 scroll-mt-24 text-right">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-teal-700 dark:text-teal-300">اشتراک سالانه مدرسه</p>
          <h2 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">هزینه بر اساس تعداد دانش‌آموز</h2>
          <p className="mt-2 text-base leading-7 text-slate-700 dark:text-slate-300">نرخ پایه برای هر دانش‌آموز ۷۹۹٬۰۰۰ تومان در سال است؛ تخفیف هر پله فقط برای نفرات همان بازه محاسبه می‌شود.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <ShieldCheck className="h-4 w-4 text-teal-500" />
          محاسبه شفاف سالانه
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
            <Users className="h-5 w-5 text-teal-700 dark:text-teal-300" />
            تعیین تعداد دانش‌آموزان
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">تعداد دانش‌آموزانی را وارد کنید که در سال تحصیلی از سامانه استفاده می‌کنند.</p>

          <label className="mt-5 block max-w-sm">
            <span className="mb-2 block text-sm font-black text-slate-900 dark:text-white">نوع مدرسه</span>
            <select
              aria-label="نوع مدرسه"
              value={schoolType}
              onChange={(event) => setSchoolType(event.target.value as 'public' | 'private')}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="private">غیردولتی</option>
              <option value="public">دولتی · ۵۰٪ تخفیف اضافه</option>
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">تخفیف دولتی پس از تخفیف تعداد و پیش از محاسبه‌ی مالیات اعمال می‌شود.</p>
          </label>

          <div className="mt-5 flex max-w-sm items-center gap-2">
            <button type="button" aria-label="افزایش تعداد دانش‌آموزان" onClick={() => setStudentCount((count) => Math.min(MAX_STUDENTS, count + 1))} disabled={studentCount >= MAX_STUDENTS} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <Plus className="h-4 w-4" />
            </button>
            <label className="flex-1">
              <span className="sr-only">تعداد دانش‌آموزان</span>
              <input type="number" min={1} max={MAX_STUDENTS} step={1} value={studentCount} onChange={(event) => setStudentCount(Math.min(MAX_STUDENTS, Math.max(1, Math.floor(Number(event.target.value) || 1))))} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-center text-lg font-black text-slate-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <button type="button" aria-label="کاهش تعداد دانش‌آموزان" onClick={() => setStudentCount((count) => Math.max(1, count - 1))} disabled={studentCount <= 1} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <Minus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">تخفیف تعداد</h3>
            <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-700">
              {discountTiers.map((tier) => {
                const active = selectedTier.min === tier.min;
                return (
                  <div key={tier.min} className={`flex items-center justify-between gap-3 py-3 text-sm ${active ? 'font-black text-teal-800 dark:text-teal-300' : 'text-slate-600 dark:text-slate-300'}`}>
                    <span>{tier.label}</span>
                    <span>{tier.discount ? `${formatNumber(tier.discount)}٪ تخفیف` : 'نرخ پایه'}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">با افزایش تعداد، نرخ نفرات جدید کاهش می‌یابد و مبلغ کل با اضافه‌شدن دانش‌آموز کمتر نمی‌شود. برای مدرسه‌ی دولتی ۵۰٪ تخفیف اضافه اعمال می‌شود.</p>
            <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="border-b border-slate-200 px-3 py-2 text-xs font-black text-slate-800 dark:border-slate-700 dark:text-slate-200">ریز محاسبه‌ی تعداد فعلی</div>
              <div className="divide-y divide-slate-100 px-3 dark:divide-slate-800">
                {priceBands.filter((band) => band.quantity > 0).map((band) => (
                  <div key={band.min} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                    <span className="text-slate-600 dark:text-slate-300">{formatNumber(band.quantity)} نفر از بازه‌ی {band.label.split(' دانش‌آموز')[0]}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatToman(band.subtotal)}</span>
                    <span className="w-full text-[11px] text-slate-500">هر نفر: {formatToman(band.pricePerStudent)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col rounded-2xl bg-[#102a45] p-5 text-white shadow-sm sm:p-6">
          <div className="text-sm font-bold text-teal-200">برآورد اشتراک یک‌ساله</div>
          <div className="mt-2 text-2xl font-black">{formatNumber(studentCount)} دانش‌آموز</div>
          <div className="mt-5 space-y-3 border-t border-white/15 pt-4 text-sm">
            <div className="flex items-center justify-between gap-3 text-slate-200">
              <span>جمع پایه ({formatToman(BASE_PRICE_TOMAN)} × {formatNumber(studentCount)})</span><span>{formatToman(baseTotalToman)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-slate-200">
              <span>تخفیف پلکانی تعداد</span><span>− {formatToman(volumeDiscountToman)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-slate-200">
              <span>تخفیف مدرسه‌ی دولتی ({formatNumber(schoolDiscountPercent)}٪)</span><span>− {formatToman(schoolDiscountToman)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-slate-200">
              <span>میانگین مؤثر هر نفر، پیش از مالیات</span><span>{formatToman(averagePricePerStudentToman)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-slate-200">
              <span>جمع پس از تخفیف‌ها</span><span>{formatToman(taxableSubtotalToman)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-slate-200">
              <span>به‌علاوه مالیات و عوارض ارزش افزوده ({formatNumber(VAT_RATE_PERCENT)}٪)</span><span>{formatToman(vatToman)}</span>
            </div>
          </div>
          <div className="mt-5 border-t border-white/15 pt-4">
            <div className="text-xs font-bold text-teal-200">مبلغ نهایی پرداخت، شامل مالیات</div>
            <div className="mt-1 text-3xl font-black">{formatToman(totalPayableToman)}</div>
          </div>
          <button type="button" onClick={startPayment} disabled={isStartingPayment} className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-400 disabled:opacity-60">
            {isStartingPayment ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            {isStartingPayment ? 'در حال اتصال به درگاه...' : 'ادامه به پرداخت سالانه'}
          </button>
          <p className="mt-3 text-[11px] leading-5 text-slate-300">برآورد با نرخ عمومی ۱۰٪ برای خدمات مشمول محاسبه شده است؛ معافیت یا وضعیت مالیاتی ارائه‌دهنده در صورتحساب رسمی باید لحاظ شود.</p>
        </section>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
        <h3 className="text-base font-black text-slate-900 dark:text-white">امکانات شامل اشتراک</h3>
        <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {includedFeatures.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm leading-6 text-slate-700 dark:text-slate-200"><Check className="mt-1 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" />{feature}</li>)}
        </ul>
      </div>

      {(paymentError || paymentMessage) && (
        <div role={paymentError ? 'alert' : 'status'} className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${paymentError ? 'border border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300' : 'border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'}`}>
          {paymentError || paymentMessage}
        </div>
      )}
    </section>
  );
};
