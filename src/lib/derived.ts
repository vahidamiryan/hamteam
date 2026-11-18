import { TaskQuery, type TaskFilterExtras, type TaskFilterOptions } from "./domain/task-query";
import {
  compareTasks,
  indexOf,
  isOpen,
  isOverdue,
  type GoalProgress,
  type MemberStats,
  type WorkspaceStats,
} from "./domain/workspace-index";
import type { Comment, Member, Task, Workspace } from "./types";

/**
 * لایهٔ راحتی روی دامنه: کلاس‌های `WorkspaceIndex` و `TaskQuery` منطق را نگه
 * می‌دارند و این فایل فقط نام‌های قدیمی را برای کامپوننت‌ها حفظ می‌کند.
 */

export type { TaskFilterOptions, TaskFilterExtras };
export type { WorkspaceStats, MemberStats, GoalProgress };
export { isOpen, isOverdue };

export function commentsForTask(workspace: Workspace, taskId: string): readonly Comment[] {
  return indexOf(workspace).comments(taskId);
}

export function memberById(workspace: Workspace, id: string | null): Member | null {
  return indexOf(workspace).member(id);
}

export function goalProgress(workspace: Workspace, goalId: string): GoalProgress {
  return indexOf(workspace).goalProgress(goalId);
}

export function memberStats(
  workspace: Workspace,
  memberId: string,
  now = new Date(),
): MemberStats {
  return indexOf(workspace).memberStats(memberId, now);
}

export function workspaceStats(workspace: Workspace, now = new Date()): WorkspaceStats {
  return indexOf(workspace).stats(now);
}

export function sortTasks(tasks: readonly Task[]): Task[] {
  return [...tasks].sort(compareTasks);
}

export function filterTasks(
  workspace: Workspace,
  options: TaskFilterOptions,
  extras: TaskFilterExtras = {},
  now: Date = new Date(),
): Task[] {
  return TaskQuery.from(options, indexOf(workspace), extras, now).select(indexOf(workspace));
}
