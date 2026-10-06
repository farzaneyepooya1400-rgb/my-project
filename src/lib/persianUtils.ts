/**
 * Persian language and cultural utilities
 */

// Convert English numbers to Persian digits
export function toPersianDigits(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/[0-9]/g, (w) => persianDigits[+w]);
}

// Convert Persian/Arabic digits to English digits
export function toEnglishDigits(str: string): string {
  if (!str) return '';
  const persianMap: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  return str.replace(/[۰-۹٠-٩]/g, (c) => persianMap[c] || c);
}

// Iranian National ID (کد ملی) Validation Algorithm
export function validateIranianNationalId(code: string): boolean {
  if (!code) return false;
  const cleanCode = toEnglishDigits(code).trim();
  
  if (!/^\d{10}$/.test(cleanCode)) {
    return false;
  }

  // Reject identical repetition (e.g., 1111111111, 0000000000)
  if (/^(\d)\1{9}$/.test(cleanCode)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCode.charAt(i), 10) * (10 - i);
  }

  const remainder = sum % 11;
  const checkDigit = parseInt(cleanCode.charAt(9), 10);

  if (remainder < 2) {
    return checkDigit === remainder;
  } else {
    return checkDigit === 11 - remainder;
  }
}

// Persian solar date string from ISO string or Date
export function formatShamsiDate(dateInput: string | Date = new Date()): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

export function formatShamsiShort(dateInput: string | Date = new Date()): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

export type PersianDateParts = { year: number; month: number; day: number };

export const PERSIAN_CALENDAR_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const persianDateFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timeZone: 'UTC',
});

export function getPersianDateParts(date: Date = new Date()): PersianDateParts {
  const parts = Object.fromEntries(persianDateFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

export function getPersianMonthLength(year: number, month: number): number {
  const start = Date.UTC(year + 621, 2, 18);
  for (let offset = 0; offset < 400; offset += 1) {
    const candidate = new Date(start + offset * 86_400_000);
    const parts = getPersianDateParts(candidate);
    if (parts.year !== year || parts.month !== month || parts.day !== 1) continue;

    let length = 1;
    while (length < 32) {
      const next = getPersianDateParts(new Date(candidate.getTime() + length * 86_400_000));
      if (next.year !== year || next.month !== month) break;
      length += 1;
    }
    return length;
  }
  return month <= 6 ? 31 : month <= 11 ? 30 : 29;
}

export function getGregorianDateFromPersian({ year, month, day }: PersianDateParts): string {
  const start = Date.UTC(year + 621, 2, 18);
  for (let offset = 0; offset < 400; offset += 1) {
    const candidate = new Date(start + offset * 86_400_000);
    const parts = getPersianDateParts(candidate);
    if (parts.year === year && parts.month === month && parts.day === day) {
      return candidate.toISOString().slice(0, 10);
    }
  }
  return '';
}

export function updatePersianDate(date: PersianDateParts, field: keyof PersianDateParts, value: number): PersianDateParts {
  const updated = { ...date, [field]: value };
  updated.day = Math.min(updated.day, getPersianMonthLength(updated.year, updated.month));
  return updated;
}

export function formatPersianDateParts({ year, month, day }: PersianDateParts): string {
  return `${toPersianDigits(year)}/${toPersianDigits(String(month).padStart(2, '0'))}/${toPersianDigits(String(day).padStart(2, '0'))}`;
}

// Sanitize string to prevent injection
export function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '')
    .trim();
}

// Persian months list
export const PERSIAN_MONTHS = [
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
  'فروردین',
  'اردیبهشت',
  'خرداد',
];
