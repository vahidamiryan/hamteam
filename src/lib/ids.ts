/** ساخت شناسه‌های یکتا و خوانا مثل `task_l4f8x2a9` */
export function newId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 10)
    : Math.random().toString(36).slice(2, 12);
  return `${prefix}_${random}`;
}
