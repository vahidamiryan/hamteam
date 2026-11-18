import { CalendarClockIcon, TargetIcon } from "lucide-react";

import { dueLabel } from "@/lib/dates";
import { PRIORITY_META, STATUS_META } from "@/lib/labels";
import type { Goal, Priority, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const DUE_TONES = {
  overdue: "border-rose-200 bg-rose-50 text-rose-700",
  today: "border-amber-200 bg-amber-50 text-amber-800",
  soon: "border-sky-200 bg-sky-50 text-sky-700",
  later: "border-transparent bg-muted/70 text-muted-foreground",
} as const;

export function DueChip({
  dueDate,
  className,
}: {
  dueDate: string | null;
  className?: string;
}) {
  if (!dueDate) return null;
  const { text, tone } = dueLabel(dueDate);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
        DUE_TONES[tone],
        className,
      )}
      title={`سررسید: ${dueDate}`}
    >
      <CalendarClockIcon className="size-3" />
      {text}
    </span>
  );
}

export function StatusChip({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        meta.chip,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function PriorityChip({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        meta.chip,
        className,
      )}
    >
      اولویت {meta.label}
    </span>
  );
}

export function GoalChip({
  goal,
  className,
}: {
  goal: Goal;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-muted/70 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground",
        className,
      )}
      title={goal.title}
    >
      <TargetIcon className="size-3" />
      <span className="max-w-[11rem] truncate">{goal.title}</span>
    </span>
  );
}
