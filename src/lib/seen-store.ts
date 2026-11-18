"use client";

/**
 * مخزن «آخرین بار که هر تسک دیده شد» برای `useSyncExternalStore`.
 * هم‌ساختار با `locale-store.ts`: خواندن localStorage در زمان import، بدون setState داخل effect
 * و با snapshot سرور ثابت تا hydration به‌هم نریزد.
 *
 * ساختار سند هر کاربر: `{ v: 1, baseline, seen: { [taskId]: ISO } }`
 * `baseline` زمان اولین آشنایی کاربر با فضای کاری است؛ تسک‌هایی که بعد از آن تغییر کرده‌اند
 * «تغییر جدید» شمرده می‌شوند و لازم نیست برای هر تسک یک رکورد جدا نوشته شود.
 */

export const SEEN_STORAGE_PREFIX = "hamteam:seen:";
const EMPTY_SNAPSHOT = "";

export interface SeenDoc {
  v: 1;
  baseline: string;
  seen: Record<string, string>;
}

const rawCache = new Map<string, string>();
const docCache = new Map<string, SeenDoc>();
const listeners = new Set<() => void>();

function storageKey(userId: string) {
  return `${SEEN_STORAGE_PREFIX}${userId}`;
}

function parseDoc(raw: string): SeenDoc | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SeenDoc>;
    if (typeof parsed?.baseline !== "string") return null;
    return {
      v: 1,
      baseline: parsed.baseline,
      seen: parsed.seen && typeof parsed.seen === "object" ? parsed.seen : {},
    };
  } catch {
    return null;
  }
}

function store(userId: string): string {
  return window.localStorage.getItem(storageKey(userId)) ?? EMPTY_SNAPSHOT;
}

/**
 * سند کاربر را از حافظه یا localStorage می‌خواند.
 * اگر سندی نباشد، با baseline «الان» ساخته و همان‌جا ذخیره می‌شود تا پس از ری‌لود
 * هم بدانیم از چه زمانی تغییرات «جدید» شمرده می‌شوند.
 */
export function readSeenDoc(userId: string): SeenDoc {
  const cached = docCache.get(userId);
  if (cached) return cached;

  const doc = parseDoc(typeof window === "undefined" ? EMPTY_SNAPSHOT : store(userId));
  if (doc) {
    docCache.set(userId, doc);
    return doc;
  }

  const fresh: SeenDoc = { v: 1, baseline: new Date().toISOString(), seen: {} };
  docCache.set(userId, fresh);
  if (typeof window !== "undefined") {
    const raw = JSON.stringify(fresh);
    rawCache.set(userId, raw);
    try {
      window.localStorage.setItem(storageKey(userId), raw);
    } catch {
      // حافظه در دسترس نیست؛ baseline فقط در حافظه می‌ماند.
    }
  }
  return fresh;
}

/** ذخیرهٔ سند و اعلام تغییر به همهٔ مشترکان. */
function commit(userId: string, doc: SeenDoc) {
  docCache.set(userId, doc);
  const raw = JSON.stringify(doc);
  rawCache.set(userId, raw);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(storageKey(userId), raw);
    } catch {
      // حافظه پر است یا دسترسی ندارد؛ در حافظه ادامه می‌دهیم.
    }
  }
  for (const listener of listeners) listener();
}

export function markTaskSeen(userId: string, taskId: string) {
  const doc = readSeenDoc(userId);
  commit(userId, { ...doc, seen: { ...doc.seen, [taskId]: new Date().toISOString() } });
}

export function markTasksSeen(userId: string, taskIds: string[]) {
  const doc = readSeenDoc(userId);
  const now = new Date().toISOString();
  const seen = { ...doc.seen };
  for (const taskId of taskIds) seen[taskId] = now;
  commit(userId, { ...doc, seen });
}

/** snapshot رشته‌ای؛ شناسهٔ پایدار برای `useSyncExternalStore`. */
export function getSeenSnapshot(userId: string | null): string {
  if (!userId) return EMPTY_SNAPSHOT;
  const cached = rawCache.get(userId);
  if (cached !== undefined && cached !== EMPTY_SNAPSHOT) return cached;
  const raw = typeof window === "undefined" ? EMPTY_SNAPSHOT : store(userId);
  if (raw) {
    rawCache.set(userId, raw);
    return raw;
  }
  // اولین بار: baseline ساخته و ذخیره می‌شود تا بعد از ری‌لود از دست نرود.
  return JSON.stringify(readSeenDoc(userId));
}

export function getSeenServerSnapshot(): string {
  return EMPTY_SNAPSHOT;
}

export function subscribeSeen(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (!event.key || !event.key.startsWith(SEEN_STORAGE_PREFIX)) return;
    const userId = event.key.slice(SEEN_STORAGE_PREFIX.length);
    docCache.delete(userId);
    rawCache.set(userId, event.newValue ?? EMPTY_SNAPSHOT);
    listener();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}
