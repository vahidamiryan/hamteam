import type { Member } from "./types";

/**
 * منطق منشن در یک جا: هم برای شمارش «منشن شما» و هم برای برجسته‌سازی متن.
 * نام‌ها می‌توانند فاصله داشته باشند («سارا محمدی»)، پس به‌جای توکن‌های ساده،
 * از نام واقعی اعضا الگو ساخته می‌شود.
 */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** نام‌های قابل منشن برای یک عضو (فارسی و انگلیسی، یکتا و بدون تکرار). */
export function mentionNames(member: Member): string[] {
  const names = [member.name, member.nameEn]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  return [...new Set(names)];
}

/**
 * الگوی همهٔ منشن‌های معتبر؛ بلندترین نام اول تا «سارا محمدی» بر «سارا» مقدم باشد.
 * الگو برای هر آرایهٔ اعضا یک‌بار ساخته می‌شود (آرایه در هر نسخهٔ سند پایدار است).
 */
const membersPatternCache = new WeakMap<readonly Member[], RegExp | null>();

export function mentionPattern(members: readonly Member[]): RegExp | null {
  const cached = membersPatternCache.get(members);
  if (cached !== undefined) return cached;

  const names = members
    .flatMap(mentionNames)
    .sort((a, b) => b.length - a.length);
  const alternatives = [...new Set(names)].map(escapeRegExp).join("|");
  const pattern =
    names.length === 0
      ? null
      : new RegExp(`@(?:${alternatives})(?![\\p{L}\\p{N}])`, "giu");
  membersPatternCache.set(members, pattern);
  return pattern;
}

/** الگوهای منشن یک عضو؛ یک‌بار ساخته و برای همان شیء عضو نگه داشته می‌شود. */
const memberPatternCache = new WeakMap<Member, RegExp[]>();

function memberPatterns(user: Member): RegExp[] {
  const cached = memberPatternCache.get(user);
  if (cached) return cached;
  const patterns = mentionNames(user).map(
    (name) => new RegExp(`@${escapeRegExp(name)}(?![\\p{L}\\p{N}])`, "iu"),
  );
  memberPatternCache.set(user, patterns);
  return patterns;
}

/** آیا کاربر جاری در متن منشن شده است؟ */
export function isUserMentioned(text: string | undefined, user: Member | null): boolean {
  if (!text || !user) return false;
  const patterns = memberPatterns(user);
  return patterns.some((pattern) => pattern.test(text));
}

export type MentionPart = { text: string; member: Member | null };

/** متن را به بخش‌های ساده و منشن‌های شناسایی‌شده تقسیم می‌کند. */
export function splitMentions(text: string, members: readonly Member[]): MentionPart[] {
  const pattern = mentionPattern(members);
  if (!pattern) return [{ text, member: null }];

  const parts: MentionPart[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > lastIndex) parts.push({ text: text.slice(lastIndex, start), member: null });
    const handle = match[0].slice(1).toLowerCase();
    const member =
      members.find((item) =>
        mentionNames(item).some((name) => name.toLowerCase() === handle),
      ) ?? null;
    parts.push({ text: match[0], member });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), member: null });
  return parts;
}
