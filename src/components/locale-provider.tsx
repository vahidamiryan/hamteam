"use client";

import * as React from "react";

import {
  createTranslator,
  dirOf,
  LOCALE_STORAGE_KEY,
  type Direction,
  type Locale,
  type Translator,
} from "@/lib/i18n";
import {
  getLocaleServerSnapshot,
  getLocaleSnapshot,
  subscribeLocale,
  writeLocale,
} from "@/lib/locale-store";
import { formatNumber as formatNumberFor } from "@/lib/dates";

export { LOCALE_STORAGE_KEY };

type LocaleContextValue = {
  locale: Locale;
  dir: Direction;
  isRtl: boolean;
  t: Translator;
  setLocale: (locale: Locale) => void;
  formatNumber: (value: number | string) => string;
};

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // زبان از مخزن بیرونی خوانده می‌شود؛ نه setState داخل effect.
  const locale = React.useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getLocaleServerSnapshot,
  );

  const setLocale = React.useCallback((next: Locale) => {
    writeLocale(next);
  }, []);

  // جهت و زبان سند با انتخاب کاربر هم‌گام می‌شود (همگام‌سازی با مرورگر، نه state).
  React.useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dirOf(locale);
  }, [locale]);

  const value = React.useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: dirOf(locale),
      isRtl: locale === "fa",
      t: createTranslator(locale),
      setLocale,
      formatNumber: (input: number | string) => formatNumberFor(locale, input),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = React.useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale باید داخل LocaleProvider استفاده شود.");
  }
  return context;
}

/** متن جهت‌دار برای نام‌ها و ایمیل‌های لاتین. */
export function useDirProps() {
  const { dir } = useLocale();
  return { dir };
}
