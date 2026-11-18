import { daysUntil } from "./dates";
import { PRIORITY_META } from "./labels";
import type { Member, Task, TaskStatus, Workspace } from "./types";

export function isOpen(task: Task): boolean {
  return task.status !== "done";
}

export function isOverdue(task: Task, now: Date = new Date()): boolean {
  if (!task.dueDate || task.status === "done") return false;
  const days = daysUntil(task.dueDate, now);
  return days !== null && days < 0;
}

export function commentsForTask(workspace: Workspace, taskId: string) {
  return workspace.comments
    .filter((comment) => comment.taskId === taskId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function memberById(workspace: Workspace, id: string | null): Member | null {
  if (!id) return null;
  return workspace.members.find((member) => member.id === id) ?? null;
}

export function goalProgress(workspace: Workspace, goalId: string) {
  const tasks = workspace.tasks.filter((task) => task.goalId === goalId);
  const done = tasks.filter((task) => task.status === "done").length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const percent = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);
  return { total: tasks.length, done, blocked, percent };
}

export function memberStats(workspace: Workspace, memberId: string, now = new Date()) {
  const tasks = workspace.tasks.filter((task) => task.assigneeId === memberId);
  return {
    total: tasks.length,
    open: tasks.filter(isOpen).length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    blocked: tasks.filter((task) => task.status === "blocked").length,
    done: tasks.filter((task) => task.status === "done").length,
    overdue: tasks.filter((task) => isOverdue(task, now)).length,
  };
}

export function workspaceStats(workspace: Workspace, now = new Date()) {
  const tasks = workspace.tasks;
  return {
    total: tasks.length,
    open: tasks.filter(isOpen).length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    blocked: tasks.filter((task) => task.status === "blocked").length,
    done: tasks.filter((task) => task.status === "done").length,
    overdue: tasks.filter((task) => isOverdue(task, now)).length,
    unassigned: tasks.filter((task) => isOpen(task) && !task.assigneeId).length,
  };
}

/** ترتیب کارت‌ها: اولویت بالاتر، بعد سررسید نزدیک‌تر، بعد جدیدتر. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const priority = PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight;
    if (priority !== 0) return priority;
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export type TaskFilterOptions = {
  /** اگر تعیین نشود، همهٔ وضعیت‌ها برمی‌گردند. */
  status?: TaskStatus | null;
  search?: string;
  assigneeId?: string | null;
  onlyOverdue?: boolean;
  /** فقط تسک‌های دارای تغییر جدید برای کاربر جاری */
  onlyTracking?: boolean;
  /** فقط تسک‌هایی که کاربر در آن‌ها منشن شده است */
  onlyMentioned?: boolean;
};

/**
 * داده‌های تکمیلی فیلتر که از وضعیت کاربر می‌آیند، نه از خود فیلترها.
 * جدا نگه داشتنشان باعث می‌شود `filters` قابل ذخیره/اشتراک باشد و هر رندر
 * یک شیء تازه به فیلتر تزریق نکند.
 */
export type TaskFilterExtras = {
  activity?: Record<string, { hasChanges: boolean; hasUnreadMention: boolean }>;
};

function matchesSearch(task: Task, needle: string): boolean {
  if (!needle) return true;
  return [
    task.title,
    task.titleEn,
    task.description,
    task.descriptionEn,
    task.blockedReason,
    task.blockedReasonEn,
  ]
    .filter(Boolean)
    .some((value) => (value as string).toLowerCase().includes(needle));
}

export function filterTasks(
  workspace: Workspace,
  options: TaskFilterOptions,
  extras: TaskFilterExtras = {},
  now: Date = new Date(),
): Task[] {
  const needle = (options.search ?? "").trim().toLowerCase();
  const activity = extras.activity;
  return sortTasks(
    workspace.tasks.filter((task) => {
      if (options.status && task.status !== options.status) return false;
      if (options.assigneeId && task.assigneeId !== options.assigneeId) return false;
      if (options.onlyOverdue && !isOverdue(task, now)) return false;
      if (options.onlyTracking && activity && !activity[task.id]?.hasChanges) return false;
      if (options.onlyMentioned && activity && !activity[task.id]?.hasUnreadMention) {
        return false;
      }
      return matchesSearch(task, needle);
    }),
  );
}
