import type { TaskUpdateInput } from "../validation";
import type { Workspace } from "../types";
import type { Task } from "../types";

/**
 * وصلهٔ تسک با «اشتراک ساختاری»: فقط آرایهٔ تسک‌ها کپی و تنها همان تسک جایگزین
 * می‌شود. بقیهٔ تسک‌ها و همهٔ گفت‌وگوها همان شیء قبلی می‌مانند تا
 * `React.memo` کارت‌های دیگر را دوباره رندر نکند.
 */
export function patchTask(
  workspace: Workspace,
  taskId: string,
  patch: TaskUpdateInput,
  now = new Date().toISOString(),
): Workspace {
  const index = workspace.tasks.findIndex((item) => item.id === taskId);
  if (index === -1) return workspace;

  const next: Task = { ...workspace.tasks[index] };

  if (patch.title !== undefined) next.title = patch.title;
  if (patch.titleEn !== undefined) next.titleEn = patch.titleEn || undefined;
  if (patch.description !== undefined) next.description = patch.description;
  if (patch.descriptionEn !== undefined) {
    next.descriptionEn = patch.descriptionEn || undefined;
  }
  if (patch.priority !== undefined) next.priority = patch.priority;
  if (patch.assigneeId !== undefined) next.assigneeId = patch.assigneeId;
  if (patch.goalId !== undefined) next.goalId = patch.goalId;
  if (patch.dueDate !== undefined) next.dueDate = patch.dueDate;
  if (patch.blockedReason !== undefined) {
    next.blockedReason = patch.blockedReason?.trim() || null;
  }
  if (patch.blockedReasonEn !== undefined) {
    next.blockedReasonEn = patch.blockedReasonEn || undefined;
  }
  if (patch.status !== undefined && patch.status !== next.status) {
    next.status = patch.status;
    next.completedAt = patch.status === "done" ? now : null;
    if (patch.status !== "blocked" && patch.blockedReason === undefined) {
      next.blockedReason = null;
    }
  }
  next.updatedAt = now;

  const tasks = workspace.tasks.slice();
  tasks[index] = next;
  return { ...workspace, tasks };
}

export function removeTask(workspace: Workspace, taskId: string): Workspace {
  return {
    ...workspace,
    tasks: workspace.tasks.filter((task) => task.id !== taskId),
    comments: workspace.comments.filter((comment) => comment.taskId !== taskId),
  };
}

export function removeComment(workspace: Workspace, commentId: string): Workspace {
  return {
    ...workspace,
    comments: workspace.comments.filter((comment) => comment.id !== commentId),
  };
}

export function removeMember(workspace: Workspace, memberId: string): Workspace {
  return {
    ...workspace,
    members: workspace.members.filter((member) => member.id !== memberId),
    tasks: workspace.tasks.map((task) =>
      task.assigneeId === memberId ? { ...task, assigneeId: null } : task,
    ),
    goals: workspace.goals.map((goal) =>
      goal.ownerId === memberId ? { ...goal, ownerId: null } : goal,
    ),
  };
}

export function removeGoal(workspace: Workspace, goalId: string): Workspace {
  return {
    ...workspace,
    goals: workspace.goals.filter((goal) => goal.id !== goalId),
    tasks: workspace.tasks.map((task) =>
      task.goalId === goalId ? { ...task, goalId: null } : task,
    ),
  };
}
