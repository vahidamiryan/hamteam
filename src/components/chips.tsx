"use client";

import * as React from "react";
import { CalendarClockIcon, CircleCheckIcon, TargetIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/locale-provider";
import { dueLabel, formatDate } from "@/lib/dates";
import {
  GOAL_STATUS_META,
  PRIORITY_META,
  STATUS_META,
} from "@/lib/labels";
import type { GoalStatus, Priority, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const DUE_TONE_CLASS: Record<string, string> = {
  overdue: "border-transparent bg-status-blocked/12 text-status-blocked",
  today: "border-transparent bg-status-pending/16 text-status-pending",
  soon: "border-transparent bg-status-pending/10 text-status-pending",
  later: "border-border bg-transparent text-muted-foreground",
};

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

export function PriorityChip({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const { t } = useLocale();
  const meta = PRIORITY_META[priority];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border-transparent font-medium", meta.chip, className)}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {t(meta.labelKey)}
    </Badge>
  );
}

export function DueChip({
  dueDate,
  className,
}: {
  dueDate: string | null;
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

  const due = dueLabel(locale, dueDate);
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium tabular-nums",
        DUE_TONE_CLASS[due.tone],
        className,
      )}
      title={formatDate(locale, dueDate)}
    >
      <CalendarClockIcon data-icon="inline-start" />
      {due.text}
    </Badge>
  );
}

export function GoalChip({
  status,
  className,
}: {
  status: GoalStatus;
  className?: string;
}) {
  const { t } = useLocale();
  const meta = GOAL_STATUS_META[status];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border-transparent font-medium", meta.chip, className)}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {t(meta.labelKey)}
    </Badge>
  );
}

/** نشان «انجام شد» برای کارت‌های ستون آخر. */
export function DoneChip({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-transparent bg-status-done/12 font-medium text-status-done",
        className,
      )}
    >
      <CircleCheckIcon data-icon="inline-start" />
      {t("status.done")}
    </Badge>
  );
}

export function GoalTag({ title, className }: { title: string; className?: string }) {
  return (
    <Badge
      variant="ghost"
      className={cn(
        "max-w-full gap-1.5 border border-border/70 bg-background/60 text-xs font-normal text-muted-foreground",
        className,
      )}
    >
      <TargetIcon data-icon="inline-start" />
      <span className="truncate">{title}</span>
    </Badge>
  );
}

export function CountBadge({ value, className }: { value: number; className?: string }) {
  const { formatNumber } = useLocale();
  return (
    <Badge
      variant="secondary"
      className={cn("min-w-5 justify-center tabular-nums", className)}
    >
      {formatNumber(value)}
    </Badge>
  );
}
