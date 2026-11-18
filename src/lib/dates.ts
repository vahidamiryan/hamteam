/**
 * تاریخ‌ها در سراسر برنامه به شکل «YYYY-MM-DD» (بدون ساعت) ذخیره می‌شوند
 * تا مسئلهٔ منطقهٔ زمانی پیش نیاید. نمایش بر اساس زبان انتخابی است:
 * فارسی → تقویم جلالی، انگلیسی → تقویم میلادی.
 */

import { translate, type Locale } from "./i18n";
import { toFaDigits } from "./jalali";

export { toFaDigits };

const DAY_MS = 86_400_000;

export function formatNumber(locale: Locale, value: number | string): string {
  return locale === "fa" ? toFaDigits(value) : String(value);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

export function addDaysISO(days: number, from: Date = new Date()): string {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** اختلاف روز بین امروز و تاریخ هدف (منفی یعنی گذشته). */
export function daysUntil(value: string, from: Date = new Date()): number | null {
  const target = parseISODate(value);
  if (!target) return null;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.getTime() - start.getTime()) / DAY_MS);
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: Locale, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}:${JSON.stringify(options)}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;
  const created = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", options);
  formatterCache.set(key, created);
  return created;
}

/** «۲۸ آبان ۱۴۰۴» یا «Nov 18, 2026» */
export function formatDate(locale: Locale, value: string): string {
  const date = parseISODate(value);
  if (!date) return value;
  return formatter(locale, { day: "numeric", month: "long", year: "numeric" }).format(
    date,
  );
}

/** «۲۸ آبان» یا «Nov 18» */
export function formatDateShort(locale: Locale, value: string): string {
  const date = parseISODate(value);
  if (!date) return value;
  return formatter(locale, { day: "numeric", month: "long" }).format(date);
}

/** «پنج‌شنبه ۲۸ آبان ۱۴۰۴» یا «Thursday, November 18, 2026» */
export function formatDateWithWeekday(locale: Locale, value: string): string {
  const date = parseISODate(value);
  if (!date) return value;
  return formatter(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatClock(locale: Locale, iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatter(locale, { hour: "2-digit", minute: "2-digit" }).format(date);
}

/** «۲۸ آبان ۱۴۰۴ · ۱۴:۳۰» */
export function formatDateTime(locale: Locale, iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${formatDate(locale, toISODate(date))} · ${formatClock(locale, iso)}`;
}

/** «۳ ساعت پیش» / «3 h ago» */
export function formatRelative(
  locale: Locale,
  iso: string,
  now: Date = new Date(),
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (diffSeconds < 60) return translate(locale, "time.justNow");
  const minutes = Math.round(diffSeconds / 60);
  if (minutes < 60) {
    return translate(locale, "time.minutes", { count: formatNumber(locale, minutes) });
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return translate(locale, "time.hours", { count: formatNumber(locale, hours) });
  }
  const days = Math.round(hours / 24);
  if (days === 1) return translate(locale, "time.yesterday");
  if (days < 30) {
    return translate(locale, "time.days", { count: formatNumber(locale, days) });
  }
  return formatDate(locale, toISODate(date));
}

export type DueTone = "overdue" | "today" | "soon" | "later";

export function dueLabel(
  locale: Locale,
  dueDate: string,
  now: Date = new Date(),
): { text: string; tone: DueTone; days: number | null } {
  const days = daysUntil(dueDate, now);
  if (days === null) {
    return { text: dueDate, tone: "later", days: null };
  }
  if (days < 0) {
    const passed = Math.abs(days);
    return {
      text:
        passed === 1
          ? translate(locale, "due.yesterday")
          : translate(locale, "due.overdue", { count: formatNumber(locale, passed) }),
      tone: "overdue",
      days,
    };
  }
  if (days === 0) return { text: translate(locale, "due.today"), tone: "today", days };
  if (days === 1)
    return { text: translate(locale, "due.tomorrow"), tone: "soon", days };
  return {
    text: translate(locale, "due.inDays", { count: formatNumber(locale, days) }),
    tone: days <= 3 ? "soon" : "later",
    days,
  };
}

/** نماد درصد بسته به زبان. */
export function percentLabel(locale: Locale, value: number): string {
  const rounded = Math.round(value);
  return locale === "fa"
    ? `${formatNumber(locale, rounded)}٪`
    : `${rounded}%`;
}
