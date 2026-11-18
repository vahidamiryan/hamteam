"use client";

import * as React from "react";
import { CircleCheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/locale-provider";
import { dueLabel, formatDate, formatDateShort } from "@/lib/dates";
import { GOAL_STATUS_META, PRIORITY_META, STATUS_META } from "@/lib/labels";
import type { GoalStatus, Priority, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * وضعیت تنها جای رنگ‌دار ثابت کارت است؛ بقیهٔ متادیتا به متن آرام تبدیل شده‌اند.
 */
export function StatusChip({
  status,
  className,
  withDot = true,
}: {
  status: TaskStatus;
  className?: string;
  withDot?: boolean;
}) {
  const { t } = useLocale();
  const meta = STATUS_META[status];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border-transparent font-medium", meta.chip, className)}
    >
      {withDot ? <span className={cn("size-1.5 rounded-full", meta.dot)} /> : null}
      {t(meta.labelKey)}
    </Badge>
  );
}

/** اولویت: نقطهٔ رنگی + متن، بدون کادر. */
export function PriorityDot({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const { t } = useLocale();
  const meta = PRIORITY_META[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden="true" />
      {t(meta.labelKey)}
    </span>
  );
}

/**
 * مُهر تاریخ: امضای محصول. تاریخ کوتاه جلالی/میلادی، و فقط وقتی نزدیک است
 * واژهٔ فوریت هم کنارش می‌آید.
 */
export function DueStamp({
  dueDate,
  status,
  className,
}: {
  dueDate: string | null;
  status?: TaskStatus;
  className?: string;
}) {
  const { locale, t } = useLocale();

  if (!dueDate) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        {t("due.none")}
      </span>
    );
  }

  if (status === "done") {
    return (
      <span className={cn("text-xs text-muted-foreground tabular-nums", className)}>
        {formatDateShort(locale, dueDate)}
      </span>
    );
  }

  const due = dueLabel(locale, dueDate);
  // امروز و گذشته با واژهٔ کوتاه نمایش داده می‌شوند تا در کارت باریک جا شوند؛
  // تاریخ کامل در tooltip و در پنل تسک هست.
  const relative = due.tone === "overdue" || due.tone === "today";

  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        due.tone === "overdue"
          ? "font-medium text-destructive"
          : due.tone === "today"
            ? "text-status-pending"
            : "text-muted-foreground",
        className,
      )}
      title={formatDate(locale, dueDate)}
    >
      {relative ? due.text : formatDateShort(locale, dueDate)}
    </span>
  );
}

export function GoalStatusDot({
  status,
  className,
}: {
  status: GoalStatus;
  className?: string;
}) {
  const { t } = useLocale();
  const meta = GOAL_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden="true" />
      {t(meta.labelKey)}
    </span>
  );
}

/** نشان «انجام شد» برای کارت‌های ستون آخر. */
export function DoneChip({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-transparent bg-status-done/10 font-medium text-status-done",
        className,
      )}
    >
      <CircleCheckIcon data-icon="inline-start" />
      {t("status.done")}
    </Badge>
  );
}

/** هدف به شکل متن آرام، نه نشان. */
export function GoalTag({ title, className }: { title: string; className?: string }) {
  return (
    <span className={cn("truncate text-xs text-muted-foreground", className)}>
      {title}
    </span>
  );
}

export function CountText({ value, className }: { value: number; className?: string }) {
  const { formatNumber } = useLocale();
  return (
    <span className={cn("text-xs text-muted-foreground tabular-nums", className)}>
      {formatNumber(value)}
    </span>
  );
}
