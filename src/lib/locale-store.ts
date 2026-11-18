"use client";

import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale, type Locale } from "./i18n";

/**
 * مخزن کوچک زبان برای `useSyncExternalStore`.
 * خواندن localStorage در زمان import رخ می‌دهد تا نیازی به setState داخل effect نباشد
 * و hydration هم به‌هم نریزد (server snapshot همیشه زبان پیش‌فرض است).
 */

const listeners = new Set<() => void>();

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

let current: Locale = readStoredLocale();

export function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== LOCALE_STORAGE_KEY) return;
    const next = isLocale(event.newValue) ? event.newValue : DEFAULT_LOCALE;
    if (next === current) return;
    current = next;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getLocaleSnapshot(): Locale {
  return current;
}

export function getLocaleServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export function writeLocale(next: Locale) {
  if (next === current) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    }
    return;
  }
  current = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }
  for (const listener of listeners) listener();
}
