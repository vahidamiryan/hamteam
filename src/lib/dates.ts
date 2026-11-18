/**
 * تاریخ‌ها در سراسر برنامه به شکل «YYYY-MM-DD» (بدون ساعت) ذخیره می‌شوند
 * تا مسئله‌ی منطقه‌ی زمانی پیش نیاید. نمایش به تقویم شمسی است.
 */

import { toFaDigits } from "./jalali";

export { toFaDigits };

const DAY_MS = 86_400_000;

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
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

/** اختلاف روز بین امروز و تاریخ هدف (منفی یعنی گذشته). */
export function daysUntil(value: string, from: Date = new Date()): number | null {
  const target = parseISODate(value);
  if (!target) return null;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.getTime() - start.getTime()) / DAY_MS);
}

const jalaliShort = new Intl.DateTimeFormat("fa-IR", {
  day: "numeric",
  month: "long",
});

const jalaliFull = new Intl.DateTimeFormat("fa-IR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const jalaliWeekday = new Intl.DateTimeFormat("fa-IR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const clockTime = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit",
});

/** «۲۸ آبان» */
export function formatJalaliShort(value: string): string {
  const date = parseISODate(value);
  return date ? jalaliShort.format(date) : value;
}

/** «۲۸ آبان ۱۴۰۴» */
export function formatJalali(value: string): string {
  const date = parseISODate(value);
  return date ? jalaliFull.format(date) : value;
}

/** «پنج‌شنبه ۲۸ آبان ۱۴۰۴» */
export function formatJalaliWithWeekday(value: string): string {
  const date = parseISODate(value);
  return date ? jalaliWeekday.format(date) : value;
}

/** «۱۴:۳۰» */
export function formatClock(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : clockTime.format(date);
}

/** «۲۸ آبان ۱۴۰۴ · ۱۴:۳۰» */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${jalaliFull.format(date)} · ${clockTime.format(date)}`;
}

/** «۳ ساعت پیش» */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (diffSeconds < 60) return "چند لحظه پیش";
  const minutes = Math.round(diffSeconds / 60);
  if (minutes < 60) return `${toFaDigits(minutes)} دقیقه پیش`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${toFaDigits(hours)} ساعت پیش`;
  const days = Math.round(hours / 24);
  if (days === 1) return "دیروز";
  if (days < 30) return `${toFaDigits(days)} روز پیش`;
  return formatJalali(toISODate(date));
}

export type DueTone = "overdue" | "today" | "soon" | "later";

export function dueLabel(
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
      text: passed === 1 ? "دیروز گذشته" : `${toFaDigits(passed)} روز گذشته`,
      tone: "overdue",
      days,
    };
  }
  if (days === 0) return { text: "امروز", tone: "today", days };
  if (days === 1) return { text: "فردا", tone: "soon", days };
  if (days <= 3) return { text: `${toFaDigits(days)} روز مانده`, tone: "soon", days };
  return { text: `${toFaDigits(days)} روز مانده`, tone: "later", days };
}
