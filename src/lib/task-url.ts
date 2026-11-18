/** آدرس اختصاصی هر تسک؛ یک‌جا تعریف می‌شود تا همه‌جا یکسان بماند. */
export const TASK_PATH_PREFIX = "/tasks/";

export function taskPath(taskId: string): string {
  return `${TASK_PATH_PREFIX}${encodeURIComponent(taskId)}`;
}

/** نشانی کامل و قابل اشتراک (برای کپی کردن یا اشتراک در پیام). */
export function taskUrl(taskId: string, origin?: string): string {
  const base = origin ?? (typeof window === "undefined" ? "" : window.location.origin);
  return `${base}${taskPath(taskId)}`;
}

/** شناسهٔ تسک را از مسیر فعلی می‌خواند؛ مسیرهای دیگر `null` می‌دهند. */
export function taskIdFromPath(pathname: string | null | undefined): string | null {
  if (!pathname || !pathname.startsWith(TASK_PATH_PREFIX)) return null;
  const raw = pathname.slice(TASK_PATH_PREFIX.length).replace(/\/+$/, "");
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
