"use client";

import * as React from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDaysISO, formatJalali, todayISO, toFaDigits } from "@/lib/dates";
import {
  JALALI_WEEKDAYS,
  isoToJalali,
  jalaliMonthLabel,
  jalaliMonthLength,
  jalaliToISO,
  persianWeekdayIndex,
} from "@/lib/jalali";
import { cn } from "@/lib/utils";

type Cell = { iso: string; day: number } | null;

/**
 * انتخاب تاریخ با تقویم شمسی.
 * مقدار ذخیره‌شده در سرویس همیشه تاریخ میلادی «YYYY-MM-DD» است.
 */
export function DateField({
  value,
  onChange,
  placeholder = "بدون تاریخ",
  className,
  triggerClassName,
  ariaLabel,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [today, setToday] = React.useState<string | null>(null);
  const [cursor, setCursor] = React.useState<{ jy: number; jm: number } | null>(
    null,
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    const now = todayISO();
    const base = isoToJalali(value ?? now);
    setToday(now);
    if (base) setCursor({ jy: base.jy, jm: base.jm });
  };

  const cells = React.useMemo<Cell[]>(() => {
    if (!cursor) return [];
    const firstIso = jalaliToISO(cursor.jy, cursor.jm, 1);
    const offset = persianWeekdayIndex(firstIso);
    const length = jalaliMonthLength(cursor.jy, cursor.jm);
    const list: Cell[] = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= length; day += 1) {
      list.push({ iso: jalaliToISO(cursor.jy, cursor.jm, day), day });
    }
    return list;
  }, [cursor]);

  const shiftMonth = (delta: number) => {
    setCursor((current) => {
      if (!current) return current;
      let month = current.jm + delta;
      let year = current.jy;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
      if (month > 12) {
        month = 1;
        year += 1;
      }
      return { jy: year, jm: month };
    });
  };

  const pick = (iso: string) => {
    onChange(iso);
    setOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          aria-label={ariaLabel ?? "انتخاب تاریخ"}
          className={cn(
            "flex h-8 w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border border-input bg-background px-2.5 text-[0.8rem] transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-expanded:bg-muted/50",
            triggerClassName,
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
            {value ? (
              <span className="truncate">{formatJalali(value)}</span>
            ) : (
              <span className="truncate text-muted-foreground">{placeholder}</span>
            )}
          </span>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-64 p-2">
          <div className="mb-1 flex items-center justify-between gap-1">
            <button
              type="button"
              aria-label="ماه قبل"
              onClick={() => shiftMonth(-1)}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ChevronRightIcon className="size-4" />
            </button>
            <span className="text-[0.8rem] font-medium">
              {cursor ? jalaliMonthLabel(cursor.jy, cursor.jm) : ""}
            </span>
            <button
              type="button"
              aria-label="ماه بعد"
              onClick={() => shiftMonth(1)}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 pb-1 text-center text-[10px] text-muted-foreground">
            {JALALI_WEEKDAYS.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, index) =>
              cell ? (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => pick(cell.iso)}
                  className={cn(
                    "flex h-7 items-center justify-center rounded-md text-[0.75rem] tabular-nums transition",
                    cell.iso === value
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "hover:bg-muted",
                    cell.iso === today && cell.iso !== value && "ring-1 ring-primary/40",
                  )}
                >
                  {toFaDigits(cell.day)}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>

          <div className="mt-2 flex items-center gap-1 border-t pt-2 text-[0.72rem]">
            <button
              type="button"
              onClick={() => pick(todayISO())}
              className="rounded-md px-1.5 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              امروز
            </button>
            <button
              type="button"
              onClick={() => pick(addDaysISO(1))}
              className="rounded-md px-1.5 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              فردا
            </button>
            <button
              type="button"
              onClick={() => pick(addDaysISO(7))}
              className="rounded-md px-1.5 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              هفته بعد
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="ms-auto rounded-md px-1.5 py-1 text-rose-600 transition hover:bg-rose-50"
              >
                پاک کردن
              </button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      {value ? (
        <button
          type="button"
          aria-label="حذف تاریخ"
          onClick={() => onChange(null)}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <XIcon className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
