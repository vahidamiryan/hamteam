import type { GoalStatus, Priority, TaskStatus } from "./types";

export const STATUS_META: Record<
  TaskStatus,
  {
    label: string;
    hint: string;
    dot: string;
    chip: string;
    /** رنگ نوار بالای ستون برد */
    accent: string;
  }
> = {
  backlog: {
    label: "بک‌لاگ",
    hint: "کارهایی که هنوز شروع نشده‌اند",
    dot: "bg-slate-400",
    chip: "bg-slate-100 text-slate-700",
    accent: "bg-slate-400",
  },
  in_progress: {
    label: "در حال انجام",
    hint: "کارهایی که همین حالا رویشان کار می‌شود",
    dot: "bg-indigo-500",
    chip: "bg-indigo-50 text-indigo-700",
    accent: "bg-indigo-500",
  },
  pending: {
    label: "در انتظار",
    hint: "در انتظار بازبینی، تأیید یا پاسخ",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700",
    accent: "bg-amber-500",
  },
  blocked: {
    label: "مسدود",
    hint: "به دلیل یک مانع بیرونی متوقف شده است",
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700",
    accent: "bg-rose-500",
  },
  done: {
    label: "انجام‌شده",
    hint: "کارهای تمام‌شده",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700",
    accent: "bg-emerald-500",
  },
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; bar: string; chip: string; weight: number }
> = {
  low: {
    label: "کم",
    bar: "bg-slate-300",
    chip: "bg-slate-100 text-slate-600",
    weight: 1,
  },
  medium: {
    label: "متوسط",
    bar: "bg-sky-400",
    chip: "bg-sky-50 text-sky-700",
    weight: 2,
  },
  high: {
    label: "بالا",
    bar: "bg-orange-400",
    chip: "bg-orange-50 text-orange-700",
    weight: 3,
  },
  urgent: {
    label: "فوری",
    bar: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700",
    weight: 4,
  },
};

export const GOAL_STATUS_META: Record<
  GoalStatus,
  { label: string; chip: string; dot: string }
> = {
  active: {
    label: "در جریان",
    chip: "bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
  },
  achieved: {
    label: "محقق شد",
    chip: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  paused: {
    label: "متوقف",
    chip: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
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

const AVATAR_TONES = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-800",
];

/** رنگ آواتار هر عضو را به‌صورت پایدار از شناسه‌اش می‌سازد. */
export function avatarTone(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`;
}
