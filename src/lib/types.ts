/**
 * مدل داده‌ی مشترک بین سرور و کلاینت.
 * کل فضای کاری (workspace) یک سند JSON است؛ هر تغییری یک نسخه جدید می‌سازد.
 */

export const TASK_STATUSES = [
  "backlog",
  "in_progress",
  "pending",
  "blocked",
  "done",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const GOAL_STATUSES = ["active", "achieved", "paused"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  /** عضوی که تسک به او سپرده شده است. */
  assigneeId: string | null;
  /** هدفی که این تسک به آن وصل است. */
  goalId: string | null;
  /** تاریخ سررسید به شکل YYYY-MM-DD */
  dueDate: string | null;
  /** دلیل مسدود بودن تسک */
  blockedReason: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  ownerId: string | null;
  /** تاریخ هدف به شکل YYYY-MM-DD */
  targetDate: string | null;
  status: GoalStatus;
  createdAt: string;
}

export interface Workspace {
  /** با هر تغییر یک واحد زیاد می‌شود و برای جلوگیری از بازنویسی هم‌زمان استفاده می‌شود. */
  version: number;
  updatedAt: string;
  members: Member[];
  tasks: Task[];
  comments: Comment[];
  goals: Goal[];
}

export type StorageMode = "postgres" | "file" | "ephemeral";

export interface StorageInfo {
  mode: StorageMode;
  persistent: boolean;
  label: string;
  hint: string;
}
