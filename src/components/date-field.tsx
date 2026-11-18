"use client";

import * as React from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { addDaysISO, formatDate, formatNumber, todayISO } from "@/lib/dates";
import {
  JALALI_WEEKDAYS,
  isoToJalali,
  jalaliMonthLabel,
  jalaliMonthLength,
  jalaliToISO,
  persianWeekdayIndex,
} from "@/lib/jalali";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Cell = { iso: string; day: number } | null;
type Cursor = { year: number; month: number };

const GREGORIAN_WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function gregorianMonthLabel(locale: Locale, year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function cursorFor(locale: Locale, iso: string): Cursor {
  if (locale === "fa") {
    const jalali = isoToJalali(iso);
    if (jalali) return { year: jalali.jy, month: jalali.jm };
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  return { year: Number(match[1]), month: Number(match[2]) };
}

function cellsFor(locale: Locale, cursor: Cursor): Cell[] {
  if (locale === "fa") {
    const firstIso = jalaliToISO(cursor.year, cursor.month, 1);
    const offset = persianWeekdayIndex(firstIso);
    const length = jalaliMonthLength(cursor.year, cursor.month);
    const list: Cell[] = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= length; day += 1) {
      list.push({ iso: jalaliToISO(cursor.year, cursor.month, day), day });
    }
    return list;
  }

  const first = new Date(cursor.year, cursor.month - 1, 1);
  const offset = first.getDay();
  const length = new Date(cursor.year, cursor.month, 0).getDate();
  const list: Cell[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= length; day += 1) {
    const iso = `${cursor.year}-${String(cursor.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    list.push({ iso, day });
  }
  return list;
}

function shiftCursor(locale: Locale, cursor: Cursor, delta: number): Cursor {
  if (locale === "fa") {
    let month = cursor.month + delta;
    let year = cursor.year;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    if (month > 12) {
      month = 1;
      year += 1;
    }
    return { year, month };
  }
  const date = new Date(cursor.year, cursor.month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** انتخاب تاریخ؛ در فارسی تقویم جلالی و در انگلیسی تقویم میلادی. */
export function DateField({
  value,
  onChange,
  placeholder,
  triggerClassName,
  ariaLabel,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  triggerClassName?: string;
  ariaLabel?: string;
}) {
  const { locale, t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [today, setToday] = React.useState<string | null>(null);
  const [cursor, setCursor] = React.useState<Cursor | null>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    const now = todayISO();
    setToday(now);
    setCursor(cursorFor(locale, value ?? now));
  };

  const cells = React.useMemo(
    () => (cursor ? cellsFor(locale, cursor) : []),
    [cursor, locale],
  );

  const weekdays = locale === "fa" ? JALALI_WEEKDAYS : GREGORIAN_WEEKDAYS;
  const monthLabel = cursor
    ? locale === "fa"
      ? jalaliMonthLabel(cursor.year, cursor.month)
      : gregorianMonthLabel(locale, cursor.year, cursor.month)
    : "";

  const pick = (iso: string) => {
    onChange(iso);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        aria-label={ariaLabel ?? t("date.pick")}
        render={<Button variant="outline" size="sm" />}
        className={cn("w-full justify-between font-normal tabular-nums", triggerClassName)}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <CalendarIcon data-icon="inline-start" className="text-muted-foreground" />
          {value ? (
            <span className="truncate">{formatDate(locale, value)}</span>
          ) : (
            <span className="truncate text-muted-foreground">
              {placeholder ?? t("date.none")}
            </span>
          )}
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 p-2">
        <div className="mb-2 flex items-center justify-between gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("date.prevMonth")}
            onClick={() =>
              setCursor((current) =>
                current ? shiftCursor(locale, current, -1) : current,
              )
            }
          >
            <ChevronRightIcon />
          </Button>
          <span className="text-xs font-medium">{monthLabel}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("date.nextMonth")}
            onClick={() =>
              setCursor((current) =>
                current ? shiftCursor(locale, current, 1) : current,
              )
            }
          >
            <ChevronLeftIcon />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 pb-1 text-center text-[10px] text-muted-foreground">
          {weekdays.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((cell, index) =>
            cell ? (
              <Button
                key={cell.iso}
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => pick(cell.iso)}
                className={cn(
                  "tabular-nums",
                  cell.iso === value && "bg-primary text-primary-foreground hover:bg-primary/80",
                  cell.iso === today && cell.iso !== value && "ring-1 ring-primary/40",
                )}
              >
                {formatNumber(locale, cell.day)}
              </Button>
            ) : (
              <span key={`empty-${index}`} />
            ),
          )}
        </div>

        <Separator className="my-2" />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => pick(todayISO())}
          >
            {t("date.today")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => pick(addDaysISO(1))}
          >
            {t("date.tomorrow")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => pick(addDaysISO(7))}
          >
            {t("date.nextWeek")}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="ms-auto text-destructive hover:bg-destructive/10"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              {t("action.clear")}
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
