import type { MessageKey } from "./i18n";
import type { GoalStatus, Priority, TaskStatus } from "./types";

/**
 * رنگ‌ها از توکن‌های معنایی می‌آیند (`--status-*` در globals.css)
 * و برچسب‌ها از دیکشنری دو‌زبانه.
 */

export type StatusMeta = {
  labelKey: MessageKey;
  hintKey: MessageKey;
  /** رنگ نقطه/نوار */
  dot: string;
  /** نشان کوچک */
  chip: string;
};

export const STATUS_META: Record<TaskStatus, StatusMeta> = {
  backlog: {
    labelKey: "status.backlog",
    hintKey: "status.backlogHint",
    dot: "bg-status-backlog",
    chip: "bg-status-backlog/12 text-status-backlog",
  },
  in_progress: {
    labelKey: "status.in_progress",
    hintKey: "status.in_progressHint",
    dot: "bg-status-progress",
    chip: "bg-status-progress/12 text-status-progress",
  },
  pending: {
    labelKey: "status.pending",
    hintKey: "status.pendingHint",
    dot: "bg-status-pending",
    chip: "bg-status-pending/14 text-status-pending",
  },
  blocked: {
    labelKey: "status.blocked",
    hintKey: "status.blockedHint",
    dot: "bg-status-blocked",
    chip: "bg-status-blocked/12 text-status-blocked",
  },
  done: {
    labelKey: "status.done",
    hintKey: "status.doneHint",
    dot: "bg-status-done",
    chip: "bg-status-done/12 text-status-done",
  },
};

export type PriorityMeta = StatusMeta & { weight: number };

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  low: {
    labelKey: "priority.low",
    hintKey: "priority.low",
    dot: "bg-status-backlog",
    chip: "bg-status-backlog/12 text-status-backlog",
    weight: 1,
  },
  medium: {
    labelKey: "priority.medium",
    hintKey: "priority.medium",
    dot: "bg-status-progress",
    chip: "bg-status-progress/12 text-status-progress",
    weight: 2,
  },
  high: {
    labelKey: "priority.high",
    hintKey: "priority.high",
    dot: "bg-status-pending",
    chip: "bg-status-pending/14 text-status-pending",
    weight: 3,
  },
  urgent: {
    labelKey: "priority.urgent",
    hintKey: "priority.urgent",
    dot: "bg-status-blocked",
    chip: "bg-status-blocked/12 text-status-blocked",
    weight: 4,
  },
};

export const GOAL_STATUS_META: Record<GoalStatus, StatusMeta> = {
  active: {
    labelKey: "goalStatus.active",
    hintKey: "goalStatus.active",
    dot: "bg-status-progress",
    chip: "bg-status-progress/12 text-status-progress",
  },
  achieved: {
    labelKey: "goalStatus.achieved",
    hintKey: "goalStatus.achieved",
    dot: "bg-status-done",
    chip: "bg-status-done/12 text-status-done",
  },
  paused: {
    labelKey: "goalStatus.paused",
    hintKey: "goalStatus.paused",
    dot: "bg-status-backlog",
    chip: "bg-status-backlog/12 text-status-backlog",
  },
};

/** ستون‌های قابل نمایش در برد، به ترتیب. */
export const BOARD_COLUMNS: TaskStatus[] = [
  "backlog",
  "in_progress",
  "pending",
  "blocked",
  "done",
];

export const STATUS_ORDER: TaskStatus[] = BOARD_COLUMNS;

export const PRIORITY_ORDER: Priority[] = ["low", "medium", "high", "urgent"];

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`;
}
