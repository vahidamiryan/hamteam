import type { Locale } from "./i18n";

/**
 * متن‌ها به دو زبان نگه داشته می‌شوند (`title` و `titleEn`).
 * این ماژول تنها نقطه‌ای است که تصمیم می‌گیرد کدام نسخه نمایش داده شود.
 */

type WithEn<T extends string> = Record<T, string | undefined> & {
  [K in `${T}En`]?: string;
};

export function localizedField<T extends string>(
  locale: Locale,
  record: WithEn<T> | null | undefined,
  field: T,
): string {
  if (!record) return "";
  const base = record[field] ?? "";
  if (locale === "fa") return base;
  const translated = record[`${field}En` as keyof typeof record];
  return typeof translated === "string" && translated.trim() ? translated : base;
}

export const memberName = (locale: Locale, member: { name: string; nameEn?: string }) =>
  localizedField(locale, member, "name");

export const memberRole = (locale: Locale, member: { role: string; roleEn?: string }) =>
  localizedField(locale, member, "role");

export const taskTitle = (
  locale: Locale,
  task: { title: string; titleEn?: string },
) => localizedField(locale, task, "title");

export const taskDescription = (
  locale: Locale,
  task: { description: string; descriptionEn?: string },
) => localizedField(locale, task, "description");

export const taskBlocker = (
  locale: Locale,
  task: { blockedReason: string | null; blockedReasonEn?: string },
) => {
  const base = task.blockedReason ?? "";
  if (locale === "fa") return base;
  const translated = task.blockedReasonEn;
  return translated && translated.trim() ? translated : base;
};

export const commentBody = (
  locale: Locale,
  comment: { body: string; bodyEn?: string },
) => localizedField(locale, comment, "body");

export const goalTitle = (
  locale: Locale,
  goal: { title: string; titleEn?: string },
) => localizedField(locale, goal, "title");

export const goalDescription = (
  locale: Locale,
  goal: { description: string; descriptionEn?: string },
) => localizedField(locale, goal, "description");

/**
 * هنگام ویرایش، فیلدی به‌روز می‌شود که در همان زبان وجود دارد؛
 * اگر نسخهٔ انگلیسی موجود نباشد، فیلد پایه نوشته می‌شود.
 */
export function localizedPatch(
  locale: Locale,
  field: string,
  value: string,
  hasTranslation: boolean,
): Record<string, string> {
  if (locale === "en" && hasTranslation) return { [`${field}En`]: value };
  return { [field]: value };
}
