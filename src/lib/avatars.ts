import type { Member } from "./types";

/** فهرست آواتارهای تصادفی که در `public/avatars` ساخته شده‌اند. */
export const AVATAR_COUNT = 12;

const AVATAR_FILES = Array.from(
  { length: AVATAR_COUNT },
  (_, index) => `/avatars/avatar-${String(index + 1).padStart(2, "0")}.svg`,
);

export function randomAvatarIndex(): number {
  return Math.floor(Math.random() * AVATAR_COUNT);
}

/** اندیس پایدار بر اساس شناسه، برای اعضای قدیمی که آواتار ندارند. */
export function hashAvatarIndex(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100_003;
  }
  return hash % AVATAR_COUNT;
}

export function avatarIndexFor(member: Pick<Member, "id" | "avatarIndex">): number {
  const value = member.avatarIndex;
  if (typeof value === "number" && value >= 0 && value < AVATAR_COUNT) return value;
  return hashAvatarIndex(member.id);
}

export function avatarSrc(index: number): string {
  const safe = ((index % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT;
  return AVATAR_FILES[safe];
}

/** گزینه‌های انتخاب آواتار در فرم عضو جدید. */
export const AVATAR_OPTIONS = AVATAR_FILES.map((src, index) => ({ src, index }));
